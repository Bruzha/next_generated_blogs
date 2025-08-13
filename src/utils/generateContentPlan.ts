import { getTuesdaysAndFridaysForNextMonth } from "./dateUtils";
import { exampleContentPlan, topics } from "./ArticleTemplate";
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

// export async function generateContentPlan(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   posts: any[],
//   dispatch: AppDispatch,
//   setLoading: (val: boolean) => void,
//   setLoadingStage: (stage: LoadingStage) => void,
// ) {
//   setLoading(true);
//   setLoadingStage('content-plan');

//   const existingTitles = posts.map(post => post.title);
//   const articleDates = getTuesdaysAndFridaysForNextMonth();

//   const topicsForArticles = Array.from({ length: articleDates.length }, () => {
//     return topics[Math.floor(Math.random() * topics.length)];
//   });

//   const combinedPromptContentPlan = getContentPlanPrompt(
//     topicsForArticles,
//     existingTitles,
//     exampleContentPlan,
//     articleDates
//   );

//   const combinedContentPlan = await fetchContentPlan(combinedPromptContentPlan);
//   console.log('combinedContentPlan: ', combinedContentPlan);

//   if (!combinedContentPlan || !Array.isArray(combinedContentPlan)) {
//     console.error('❌ Failed to fetch combined content plan or result is not an array');
//     setLoading(false);
//     setLoadingStage('done');
//     return;
//   }

//   setLoadingStage('article-generation');

//   const articlePromises = [];

//   // for (let i = 0; i < combinedContentPlan.length; i++) {
//   for (let i = 0; i < 1; i++) {
//     const contentPlan = combinedContentPlan[i];
//     const date = articleDates[i].toLocaleDateString('en-CA', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//     }).replace(/\//g, '-');

//     if (!contentPlan) {
//       console.warn(`❌ No content plan found for topic ${topicsForArticles[i]} and date ${date}`);
//       continue;
//     }

//     const generateArticle = async () => {
//       try {
//         const promptArticle = getArticlePrompt(
//           contentPlan.title,
//           contentPlan.keywords,
//           topicsForArticles[i]
//         );
//         const bodyContent = await fetchArticleContent(promptArticle);
//         if (!bodyContent) return null;

//         setLoadingStage('image-generation');

//         const { modifiedBodyContent } = await generateImagesForArticle(bodyContent);

//         const newPost = {
//           _type: 'post',
//           title: contentPlan.title,
//           slug: {
//             _type: 'slug',
//             current: contentPlan.title
//               .toLowerCase()
//               .replace(/[^a-z0-9]+/g, '-')
//               .replace(/^-*|-*$/g, ''),
//           },
//           publishedAt: date,
//           body: modifiedBodyContent,
//           image: null,
//           status: 'Unpublished',
//         };

//         const createdDoc = await client.create({
//           ...newPost,
//           _id: `drafts.${newPost.slug.current}`,
//         });

//         const postToStore = {
//           ...createdDoc,
//           body: modifiedBodyContent,
//         };

//         dispatch(addPost(postToStore));

//         return postToStore;
//       } catch (error) {
//         console.error('❌ Error while generating article:', error);
//         return null;
//       } finally {
//         setLoadingStage('article-generation');
//       }
//     };

//     articlePromises.push(generateArticle());
//   }

//   await Promise.allSettled(articlePromises);

//   setLoading(false);
//   setLoadingStage('done');
// }

export async function generateContentPlan(
  posts: PostType[],
  dispatch: AppDispatch,
  setLoading: (val: boolean) => void,
  setLoadingStage: (stage: LoadingStage) => void,
) {
  setLoading(true);
  setLoadingStage('content-plan');

  const existingTitles = posts.map(post => post.title);
  const articleDates = getTuesdaysAndFridaysForNextMonth();

  const topicsForArticles = Array.from({ length: articleDates.length }, () => {
    return topics[Math.floor(Math.random() * topics.length)];
  });

  const combinedPromptContentPlan = getContentPlanPrompt(
    topicsForArticles,
    existingTitles,
    exampleContentPlan,
    articleDates
  );

  const combinedContentPlan = await fetchContentPlan(combinedPromptContentPlan);
  console.log('combinedContentPlan: ', combinedContentPlan);

  if (!combinedContentPlan || !Array.isArray(combinedContentPlan)) {
    console.error('❌ Failed to fetch combined content plan or result is not an array');
    setLoading(false);
    setLoadingStage('done');
    return;
  }

  setLoadingStage('article-generation');

  const articlePromises = [];

  for (let i = 0; i < 1; i++) {
    const contentPlan = combinedContentPlan[i];
    const date = articleDates[i].toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');

    if (!contentPlan) {
      console.warn(`❌ No content plan found for topic ${topicsForArticles[i]} and date ${date}`);
      continue;
    }

    const generateArticle = async () => {
      try {
        const promptArticle = getArticlePrompt(
          contentPlan.title,
          contentPlan.keywords,
          topicsForArticles[i]
        );
        const bodyContent = await fetchArticleContent(promptArticle);
        if (!bodyContent) return null;

        setLoadingStage('image-generation');

        const { modifiedBodyContent } = await generateImagesForArticle(bodyContent);

        const newPost = {
          _type: 'post',
          title: contentPlan.title,
          slug: {
            _type: 'slug',
            current: contentPlan.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-*|-*$/g, ''),
          },
          publishedAt: date,
          body: modifiedBodyContent,
          image: null,
          status: 'Unpublished',
        };

        const updatedDoc = await client.create({
          ...newPost,
          _id: `drafts.${newPost.slug.current}`,
        });

        const postToStore: PostType = {
          _id: updatedDoc._id,
          title: updatedDoc.title,
          slug: { current: updatedDoc.slug.current },
          publishedAt: updatedDoc.publishedAt,
          image: updatedDoc.image ?? null,
          body: updatedDoc.body,
          status: updatedDoc.status,
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