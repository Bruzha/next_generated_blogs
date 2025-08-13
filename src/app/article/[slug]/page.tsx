//src/app/article/[slug]/page.tsx
import ArticleClient from './ArticleClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}


export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  return <ArticleClient slug={slug} />;
}





// 'use client';

// import { useSelector } from 'react-redux';
// import { RootState } from '../../../../store';
// import { PostType } from '@/app/componets/ui/postTable/PostTable';
// import { format } from 'date-fns';
// import { notFound } from 'next/navigation';
// import Link from 'next/link';
// import './style.scss';

// interface Props {
//   params: {
//     slug: string;
//   };
// }

// export default function ArticlePage({ params }: Props) {
//   const { slug } = params;
//   const posts = useSelector((state: RootState) => state.posts.data);
//   const post = posts.find((p: PostType) => p.slug?.current === slug);
//   if (!post) {
//     return notFound();
//   }

//   return (
//     <div className="article">
//       <Link href="/" className="article__backLink">
//         Back
//       </Link>
//       <h1 className="article__title">{post.title}</h1>
//       <p className="article__publishedDate">
//         Published: {format(new Date(post.publishedAt), 'dd.MM.yyyy')}
//       </p>
//       <div dangerouslySetInnerHTML={{ __html: post.body || '' }} />
//     </div>
//   );
// }
