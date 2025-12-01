// src/utils/generateContentPlan.ts
import { getTuesdaysAndFridaysForNextMonth } from "./dateUtils";
import { getContentPlanPrompt } from "@/prompts/contentPlanPrompt";
import fetchContentPlan from "../store/thunks/fetchContentPlan";
import { getArticlePrompt } from "@/prompts/articlePrompt";
import fetchArticleContent from "../store/thunks/fetchArticleContent";
import generateImagesForArticle from "../store/thunks/generateImagesForArticle";
import { client } from "../sanity/client";
import { LoadingStage } from "@/app/componets/ui/loadingIndicator/LoadingIndicator";
import { AppDispatch } from "../store";
import { addPost } from "../store/reducers/postsSlice";
import { PostType } from "@/app/componets/ui/postTable/PostTable";
import { selectCategoriesForDates } from "./modalUtils";
import { nanoid } from 'nanoid';
import { countTextCharacters, extendArticleContent } from "./textVolumeUtils";

type SanityDocId = { _id: string };

export type Keyword = {
  word: string;
  weight: number;
};

export default async function fetchKeywordsFromAPI(query: string) {
  const res = await fetch('/api/keywords/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.keywords || [];
}

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

  const baseShopifyKeywords = await fetchKeywordsFromAPI("shopify");

  console.log("baseShopifyKeywords: ", baseShopifyKeywords)

  const categoryQueries: Record<string, string> = {
    "Shopify Expertise": "shopify expertise",
    "UX/UI & Design": "shopify ux design",
    "Cases & Processes": "shopify case study",
    "SEO & Content": "shopify seo content",
    "AI & Automation": "shopify automation ai",
    "Opinions & Trends": "shopify trends",
  };

  const allKeywords: { word: string; weight: number }[] = [...baseShopifyKeywords];

  for (const query of Object.values(categoryQueries)) {
    const categoryKeywords = await fetchKeywordsFromAPI(query);
    allKeywords.push(...categoryKeywords);
  }

  console.log("allKeywords: ", allKeywords);

  // Получаем LSI слова для всех ключевых слов
  setLoadingStage('finding-keywords');

  const keywordsForLSI = allKeywords.slice(0, 10).map(k => k.word);
  let lsiKeywords: string[] = [];

  try {
    const lsiResponse = await fetch('/api/keywords/lsi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: keywordsForLSI }),
    });
    const lsiData = await lsiResponse.json();
    lsiKeywords = lsiData.lsiKeywords || [];
    console.log("LSI keywords: ", lsiKeywords);
  } catch (error) {
    console.error("Error fetching LSI keywords:", error);
  }

  const categoriesForPrompt: string[] = articleDates.map(d => {
    const dateKey = d.toISOString().split('T')[0];
    const catsForDate = selectedCategories[dateKey] || [];
    return catsForDate.join(', ');
  });
  const combinedPromptContentPlan = getContentPlanPrompt(
    categoriesForPrompt,
    articleDates,
    allKeywords,
    lsiKeywords
  );

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
          categoriesForPrompt[i],
          lsiKeywords
        );

        let bodyContent = await fetchArticleContent(promptArticle);
        if (!bodyContent) return null;

        // Проверка объёма текста и догенерация при необходимости
        const TARGET_CHAR_COUNT = 3000;
        const MAX_ATTEMPTS = 5;
        let currentCharCount = countTextCharacters(bodyContent);
        let attempt = 0;

        console.log(`📊 Initial article volume: ${currentCharCount} characters (target: ${TARGET_CHAR_COUNT})`);

        while (currentCharCount < TARGET_CHAR_COUNT && attempt < MAX_ATTEMPTS) {
          attempt++;
          console.log(`🔄 Attempt ${attempt}/${MAX_ATTEMPTS}: Adding more content (current: ${currentCharCount}, missing: ${TARGET_CHAR_COUNT - currentCharCount})`);

          setLoadingStage('adding-volume');

          const extendedContent = await extendArticleContent(
            bodyContent,
            contentPlan.title,
            contentPlan.keywords,
            contentPlan.description,
            categoriesForPrompt[i],
            currentCharCount,
            TARGET_CHAR_COUNT
          );

          if (!extendedContent) {
            console.log(`❌ Failed to extend content on attempt ${attempt}`);
            break;
          }

          bodyContent = extendedContent;
          currentCharCount = countTextCharacters(bodyContent);
          console.log(`✅ After attempt ${attempt}: ${currentCharCount} characters`);

          if (currentCharCount >= TARGET_CHAR_COUNT) {
            console.log(`✅ Target volume reached: ${currentCharCount} characters`);
            break;
          }
        }

        if (currentCharCount < TARGET_CHAR_COUNT) {
          console.log(`⚠️ Final volume: ${currentCharCount} characters (target was ${TARGET_CHAR_COUNT}). Proceeding with current content.`);
        }

        setLoadingStage('image-generation');

        const { modifiedBodyContent, images } = await generateImagesForArticle(bodyContent);

        const slugBase = contentPlan.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const cover = images.length > 0 ? { image: images[0].image, altText: images[0].altText } : undefined;

        const breadcrumbs = [
          {
            _key: `key-${nanoid()}`,
            linkInternal: {
              label: "Home",
              reference: homeDoc ? { _type: 'reference', _ref: homeDoc._id } : null,
            },
          },
          {
            _key: `key-${nanoid()}`,
            linkInternal: {
              label: "Blog",
              reference: blogDoc ? { _type: 'reference', _ref: blogDoc._id } : null,
            },
          },
          {
            _key: `key-${nanoid()}`,
            linkInternal: {
              label: contentPlan.title,
              reference: null,
            },
          },
        ];

        const seoObj = {
          _key: `key-${nanoid()}`,
          _type: 'seo',
          titleTemplate: false,
          title: contentPlan.title,
          description: contentPlan.description,
          keywords: contentPlan.keywords,
          ogType: 'article',
          twitterCard: 'summary_large_image',
          ...(cover ? { image: cover } : {}),
        };

        const article = {
          _type: 'articlesItem',
          _id: `article-${nanoid()}`,
          title: contentPlan.title,
          desc: contentPlan.description,
          slug: { _type: 'slug', current: `/${slugBase}` },
          date,
          ...(cover ? { coverImage: cover } : {}),
          seo: seoObj,
          content: modifiedBodyContent,
          category: categoriesForPrompt[i],
          status: "Unpublished",
          breadcrumbs,
        };

        const created = await client.create(article);

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
