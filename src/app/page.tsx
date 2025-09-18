'use client';

import { useEffect, useState } from 'react';
import PostTable, { PostType } from './componets/ui/postTable/PostTable';
import { generateContentPlan } from '@/utils/generateContentPlan';
import { client } from '@/sanity/client';
import "./style.scss";
import LoadingIndicator, { LoadingStage } from './componets/ui/loadingIndicator/LoadingIndicator';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setPosts, updatePostStatus } from '../store/reducers/postsSlice';

export default function IndexPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('initial');
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);

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

  const handlePostUpdate = async (postId: string, newStatus: PostType['status']) => {
    dispatch(updatePostStatus({ id: postId, status: newStatus }));
    setLoadingStage("status-update");
    setLoading(true);
    try {
      await client.patch(postId).set({ status: newStatus }).commit();
    } catch (error) {
      console.error(`❌ Error updating post status ${postId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // const handleDeletePosts = async () => {
  //   if (selectedForDeletion.length === 0) return;

  //   if (!confirm(`Are you sure you want to delete ${selectedForDeletion.length} post(s)?`)) return;

  //   setLoadingStage('deleting');
  //   setLoading(true);

  //   try {
  //     await Promise.all(selectedForDeletion.map(id => client.delete(id)));
  //     dispatch(setPosts(posts.filter(post => !selectedForDeletion.includes(post._id))));
  //     setSelectedForDeletion([]);
  //   } catch (error) {
  //     console.error('❌ Error deleting posts:', error);
  //     alert('Failed to delete some posts');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDeletePosts = async () => {
    if (selectedForDeletion.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedForDeletion.length} post(s) including drafts?`)) return;

    setLoadingStage('deleting');
    setLoading(true);

    try {
      // Удаляем все версии выбранных постов (черновики и опубликованные)
      await Promise.all(
        selectedForDeletion.map(id =>
          client.delete({ query: `*[_id in [$id, "drafts." + $id]]`, params: { id } })
        )
      );

      // Обновляем store, убираем удалённые посты
      const remainingPosts = posts.filter(post => !selectedForDeletion.includes(post._id));
      dispatch(setPosts(remainingPosts));

      alert(`Successfully deleted ${selectedForDeletion.length} post(s) including drafts.`);
      setSelectedForDeletion([]);
    } catch (error) {
      console.error('❌ Error deleting posts:', error);
      alert('Failed to delete some posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePublication = async () => {
    setLoadingStage("publishing");
    setLoading(true);

    try {
      const freshPosts = await client.fetch(`*[_type == "articlesItem"] | order(date desc)`);
const postsToPublish = freshPosts.filter((post: { status: string; }) => post.status === 'Planned for publication');

      if (postsToPublish.length === 0) return;

      const res = await fetch('/api/auth/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsToPublish }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to publish on LinkedIn');

      await Promise.all(postsToPublish.map(async (post: { _id: string; }) => {
        try {
          await client.patch(post._id).set({ status: 'Published' }).commit();
          dispatch(updatePostStatus({ id: post._id, status: 'Published' }));
        } catch (err) {
          console.error(`❌ Error updating status for post ${post._id}:`, err);
        }
      }));

    } catch (error) {
      console.error('❌ Error while publishing posts:', error);
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
              className="greenButton"
              onClick={handlePublication}
              disabled={loading}
            >
              Publish on LinkedIn
            </button>
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
              className="redButton"
              onClick={handleDeletePosts}
              disabled={loading || selectedForDeletion.length === 0}
            >
              Delete selected
            </button>
          </div>
          <PostTable
            posts={sortedPosts}
            onPostUpdate={handlePostUpdate}
            selectedForDeletion={selectedForDeletion}
            setSelectedForDeletion={setSelectedForDeletion}
          />
        </>
      )}
    </main>
  );
}
