'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import "./style.scss";
import { PortableTextBlock } from '@portabletext/types';
import { client } from '@/sanity/client';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../store';
import { updatePostStatus } from '../../../../store/reducers/postsSlice';

export interface PostType {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  date: string;
  desc: string;
  image?: string | null;
  content?: PortableTextBlock[];
  bodyContent?: string;
  status?: string;
}

interface PostTableProps {
  posts: PostType[];
  onPostUpdate: (postId: string, newStatus: PostType['status']) => void;
  selectedForDeletion: string[];
  setSelectedForDeletion: React.Dispatch<React.SetStateAction<string[]>>;
  onDateUpdate: (postId: string, newDate: string) => void;
}

export default function PostTable({
  posts,
  onPostUpdate,
  selectedForDeletion,
  setSelectedForDeletion,
  onDateUpdate
}: PostTableProps) {

  const dispatch = useDispatch<AppDispatch>();
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const handleSelectAll = async () => {
    const selectablePosts = posts.filter(post => post.status !== 'Published');
    const allSelected = selectablePosts.every(post => post.status === 'Planned for publication');

    const newStatus: PostType['status'] = allSelected ? 'Unpublished' : 'Planned for publication';

    if (selectablePosts.length === 0) return;

    try {
      const transaction = client.transaction();
      selectablePosts.forEach(post => {
        transaction.patch(post._id, { set: { status: newStatus } });
      });
      await transaction.commit();

      selectablePosts.forEach(post => {
        dispatch(updatePostStatus({ id: post._id, status: newStatus }));
      });

    } catch (err) {
      console.error("❌ Bulk update failed:", err);
    }
  };



  const handleCheckboxChange = (post: PostType) => {
    if (post.status === 'Published') return;

    const newStatus: PostType['status'] =
      post.status === 'Planned for publication' ? 'Unpublished' : 'Planned for publication';

    onPostUpdate(post._id, newStatus);
  };

  const handleDeleteCheckboxChange = (postId: string) => {
    setSelectedForDeletion(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAllToDelete = () => {
    const allIds = posts.map(post => post._id);
    const allSelected = selectedForDeletion.length === posts.length;

    setSelectedForDeletion(allSelected ? [] : allIds);
  };

  const handleDateClick = (postId: string) => {
    setEditingDateId(postId);
  };

  const handleDateChange = (postId: string, newDate: string) => {
    if (newDate) {
      onDateUpdate(postId, newDate);
      setEditingDateId(null);
    }
  };

  const handleDateBlur = () => {
    setEditingDateId(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <button className="greenButton" onClick={handleSelectAll}>
          Select all for publication
        </button>
        <button className="redButton" onClick={handleSelectAllToDelete}>
          Select all to delete
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Publish Select</th>
            <th>Status</th>
            <th>Date</th>
            <th>Title</th>
            <th>Delete Select</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post._id}>
              <td>
                <input
                  type="checkbox"
                  disabled={post.status === 'Published'}
                  checked={post.status === 'Planned for publication'}
                  onChange={() => handleCheckboxChange(post)}
                />
              </td>
              <td>
                <p>{post.status}</p>
              </td>
              <td className="dateCell">
                {editingDateId === post._id ? (
                  <input
                    type="date"
                    className="dateInput"
                    defaultValue={post.date}
                    onChange={(e) => handleDateChange(post._id, e.target.value)}
                    onBlur={handleDateBlur}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => handleDateClick(post._id)} className="dateText">
                    {post.date ? format(new Date(post.date), 'dd.MM.yyyy') : '—'}
                  </span>
                )}
              </td>
              <td className="link">
                <Link href={`/article/${post.slug.current}`} className="blueLink">
                  {post.title}
                </Link>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedForDeletion.includes(post._id)}
                  onChange={() => handleDeleteCheckboxChange(post._id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
