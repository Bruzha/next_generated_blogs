import { getTuesdaysAndFridaysForNextMonth } from "./dateUtils";
import { getContentPlanPrompt } from "@/prompts/contentPlanPrompt";
import fetchContentPlan from "../../store/thunks/fetchContentPlan";
import { getArticlePrompt } from "@/prompts/articlePrompt";
import fetchArticleContent from "../../store/thunks/fetchArticleContent";
import generateImagesForArticle from "../../store/thunks/generateImagesForArticle";
import { client } from "../sanity/client";
import { LoadingStage } from "@/app/componets/ui/loadingIndicator/LoadingIndicator";
import { AppDispatch } from "../../store";
import { addPost } from "../../store/reducers/postsSlice";
import { PostType } from "@/app/componets/ui/postTable/PostTable";
import { selectCategoriesForDates } from "./modalUtils";
import { nanoid } from 'nanoid';

type SanityDocId = { _id: string };

export async function generateContentPlan(
  posts: PostType[],
  dispatch: AppDispatch,
  setLoading: (val: boolean) => void,
  setLoadingStage: (stage: LoadingStage) => void
) {
  setLoading(true);
  setLoadingStage('content-plan');

  const articleDates = getTuesdaysAndFridaysForNextMonth();

  const selectedCategories = await selectCategoriesForDates(articleDates);

  if (!selectedCategories || Object.keys(selectedCategories).length === 0) {
    setLoading(false);
    setLoadingStage('initial');
    return;
  }

  const categoriesForPrompt: string[] = articleDates.map(d => {
    const dateKey = d.toISOString().split('T')[0];
    const catsForDate = selectedCategories[dateKey] || [];
    return catsForDate.join(', ');
  });

  console.log("categoriesForPrompt: ", categoriesForPrompt);
  const combinedPromptContentPlan = getContentPlanPrompt(categoriesForPrompt, articleDates);

  const combinedContentPlan = await fetchContentPlan(combinedPromptContentPlan);

  if (!combinedContentPlan || !Array.isArray(combinedContentPlan)) {
    console.error('❌ Failed to fetch combined content plan or result is not an array');
    setLoading(false);
    setLoadingStage('done');
    return;
  }

  const [homeDoc, blogDoc] = await Promise.all([
    client.fetch<SanityDocId | null>(`*[_type == "page" && slug.current == $slug][0]{_id}`, { slug: "/" }),
    client.fetch<SanityDocId | null>(`*[_type == "page" && slug.current == $slug][0]{_id}`, { slug: "/blog" }),
  ]);

  setLoadingStage('article-generation');
  const articlePromises: Promise<PostType | null>[] = [];

  for (let i = 0; i < 1; i++) {
    const contentPlan = combinedContentPlan[i];
    const d = articleDates[i];
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!contentPlan) continue;

    const generateArticle = async () => {
      try {
        const promptArticle = getArticlePrompt(
          contentPlan.title,
          contentPlan.keywords,
          contentPlan.description,
          categoriesForPrompt[i]
        );

        const bodyContent = await fetchArticleContent(promptArticle);
        if (!bodyContent) return null;
        setLoadingStage('image-generation');

        const { modifiedBodyContent, images } = await generateImagesForArticle(bodyContent);

        const slugBase = contentPlan.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const timestamp = new Date().toISOString().replace(/[^a-z0-9]+/gi, '-');

        const cover = images.length > 0 ? { image: images[0].image, altText: images[0].altText } : undefined;

        const breadcrumbs = [
          {
            _key: nanoid(),
            linkInternal: {
              label: "Home",
              reference: homeDoc ? { _type: 'reference', _ref: homeDoc._id } : null,
            },
          },
          {
            _key: nanoid(),
            linkInternal: {
              label: "Blog",
              reference: blogDoc ? { _type: 'reference', _ref: blogDoc._id } : null,
            },
          },
          {
            _key: nanoid(),
            linkInternal: {
              label: contentPlan.title,
              reference: null,
            },
          },
        ];

        const article = {
          _type: 'articlesItem',
          _id: timestamp,
          title: contentPlan.title,
          desc: contentPlan.description,
          slug: { _type: 'slug', current: `/${slugBase}` },
          date,
          ...(cover ? { coverImage: cover } : {}),
          seo: {},
          content: modifiedBodyContent,
          category: categoriesForPrompt[i],
          status: "Unpublished",
          breadcrumbs,
        };

        const created = await client.create(article);
        console.log("created: ", created);

        const postToStore: PostType = {
          _id: created._id,
          title: created.title,
          desc: created.desc,
          slug: { current: created.slug.current },
          date: created.date,
          status: created.status,
        };

        dispatch(addPost(postToStore));
        return postToStore;
      } catch (error) {
        console.error('❌ Error while generating article:', error);
        return null;
      } finally {
        setLoadingStage('article-generation');
      }
    };

    articlePromises.push(generateArticle());
  }

  await Promise.allSettled(articlePromises);
  setLoading(false);
  setLoadingStage('done');
}

