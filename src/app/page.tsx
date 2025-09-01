'use client';

import { useEffect, useState } from 'react';
import PostTable, { PostType } from './componets/ui/postTable/PostTable';
import { generateContentPlan } from '@/utils/generateContentPlan';
import { client } from '@/sanity/client';
import "./style.scss";
import LoadingIndicator, { LoadingStage } from './componets/ui/loadingIndicator/LoadingIndicator';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setPosts, updatePostStatus } from '../../store/reducers/postsSlice';

export default function IndexPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('initial');
  const [, setSelectedPosts] = useState<string[]>([]);

  const posts = useSelector((state: RootState) => state.posts.data);
  const sortedPosts = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
  const initialized = useSelector((state: RootState) => state.posts.initialized);
  const dispatch = useDispatch<AppDispatch>();


  useEffect(() => {
    const fetchAllPostsFromSanity = async () => {
      setLoading(true);
      try {
        const allPosts = await client.fetch(`*[_type == "articlesItem"] | order(date desc)`);
        console.log("allPosts: ", allPosts)
        dispatch(setPosts(allPosts));
        if (!allPosts || allPosts.length === 0) {
          await generateContentPlan(allPosts, dispatch, setLoading, setLoadingStage);
        }
      } catch (error) {
        console.error("❌ Error loading posts from Sanity:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialized) {
      fetchAllPostsFromSanity();
    }
  }, [dispatch, initialized]);


  // Обновление статуса поста
  const handlePostUpdate = async (postId: string, newStatus: PostType['status']) => {
    dispatch(updatePostStatus({ id: postId, status: newStatus }));
    if (newStatus === 'Planned for publication') {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
    setLoadingStage("status-update");
    setLoading(true);
    try {
      const draftId = postId;
      await client.patch(draftId).set({ status: newStatus }).commit();
    } catch (error) {
      console.error(`❌ Error updating post status ${postId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // const handlePublication = async () => {
  //   setLoadingStage("publishing");
  //   setLoading(true);

  //   try {
  //     const postsToPublish = posts.filter(post => post.status === 'Planned for publication');

  //     console.log("postsToPublish: ", postsToPublish)

  //     const res = await fetch('/api/auth/linkedin/publish', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ posts: postsToPublish })
  //     });

  //     if (!res.ok) throw new Error('Failed to publish on LinkedIn');

  //     alert('Posts scheduled successfully!');
  //   } catch (error) {
  //     console.error('❌ Error while publishing posts:', error);
  //     alert('Failed to schedule posts on LinkedIn');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePublication = async () => {
    setLoadingStage("publishing");
    setLoading(true);

    try {
      const postsToPublish = posts.filter(post => post.status === 'Planned for publication');

      if (postsToPublish.length === 0) return;

      console.log("postsToPublish: ", postsToPublish);

      const res = await fetch('/api/auth/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsToPublish })
      });

      if (!res.ok) throw new Error('Failed to publish on LinkedIn');

      // После успешной публикации обновляем статус
      await Promise.all(postsToPublish.map(async (post) => {
        try {
          // Обновляем в Sanity
          await client.patch(post._id).set({ status: 'Published' }).commit();
          // Обновляем в Redux
          dispatch(updatePostStatus({ id: post._id, status: 'Published' }));
        } catch (err) {
          console.error(`❌ Error updating status for post ${post._id}:`, err);
        }
      }));

      alert('Posts published successfully!');

    } catch (error) {
      console.error('❌ Error while publishing posts:', error);
      alert('Failed to schedule posts on LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosts = async (postIds: string[]) => {
    if (postIds.length === 0) return;

    setLoadingStage('deleting');
    setLoading(true);

    try {
      await Promise.all(postIds.map(id => client.delete(id)));
      dispatch(setPosts(posts.filter(post => !postIds.includes(post._id))));
    } catch (error) {
      console.error('❌ Error deleting posts:', error);
      alert('Failed to delete some posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      {loading ? (
        <LoadingIndicator stage={loadingStage} />
      ) : (
        <>
          <h1 className="main__title">Articles for the CROCODE blog</h1>
          <div className="main__buttonContainer">
            <button
              className={`blueButton ${loading ? 'loading' : ''}`}
              onClick={() =>
                generateContentPlan(posts, dispatch, setLoading, setLoadingStage)
              }
              disabled={loading}
            >
              {loading ? 'Generation...' : 'Create a content plan'}
            </button>
            <button
              className="main__publicationButton"
              onClick={handlePublication}
              disabled={loading}
            >
              Publish on LinkedIn
            </button>
          </div>
          <PostTable posts={sortedPosts} onPostUpdate={handlePostUpdate} onDeletePosts={handleDeletePosts} />
        </>
      )}
    </main>
  );
}