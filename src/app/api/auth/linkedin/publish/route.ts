import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = imageUrlBuilder(client);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlFor(source: any) {
  return builder.image(source).url();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextAndImage(content: any[]) {
  const textParts: string[] = [];
  let imageUrl: string | null = null;
  let listCounter = 1;

  for (const item of content) {
    if (item._type === 'block' && item.children) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let blockText = item.children.map((c: any) => c.text).join('');
      if (item.listItem === 'bullet') {
        blockText = `- ${blockText}`;
      } else if (item.listItem === 'number') {
        blockText = `${listCounter}. ${blockText}`;
        listCounter++;
      }

      textParts.push(blockText);
    } else if (item._type === 'image' && !imageUrl && item.asset?._ref) {
      imageUrl = urlFor(item.asset);
    }
  }

  return {
    text: textParts.join('\n\n'),
    imageUrl
  };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('linkedin_token')?.value;
  if (!token) {
    return new NextResponse('Not authenticated ' + token, { status: 401 });
  }

  const { posts } = await req.json();

  if (!token) {
    return new NextResponse('Not authenticated', { status: 401 });
  }
  
  const organizationUrn = 'urn:li:organization:66890500';

  try {
    for (const post of posts) {
      const { text, imageUrl } = extractTextAndImage(post.content);

      const media = [];
      let shareMediaCategory = 'NONE';

      if (imageUrl) {
        // 1. Регистрируем загрузку
        const registerResponse = await axios.post(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: organizationUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type': 'application/json'
            }
          }
        );

        const uploadUrl =
          registerResponse.data.value.uploadMechanism[
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
          ].uploadUrl;
        const asset = registerResponse.data.value.asset;

        // 2. Загружаем картинку
        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();

        await axios.put(uploadUrl, Buffer.from(imgBuffer), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'image/jpeg'
          }
        });

        media.push({
          status: 'READY',
          description: { text: post.desc },
          media: asset,
          title: { text: post.title }
        });

        shareMediaCategory = 'IMAGE';
      }

      // 3. Публикуем пост
      const payload = {
        author: organizationUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${post.title}\n\n${post.desc}\n\n${text}`
            },
            shareMediaCategory,
            ...(media.length > 0 ? { media } : {})
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      console.log('payload:', JSON.stringify(payload, null, 2));

      await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json({ message: 'Posts published successfully' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('LinkedIn publish error:', error.response?.data || error.message);
    return new NextResponse('Failed to publish posts', { status: 500 });
  }
}

// import { NextRequest, NextResponse } from 'next/server';
// import axios from 'axios';
// import imageUrlBuilder from '@sanity/image-url';
// import { client } from '@/sanity/client';

// const builder = imageUrlBuilder(client);

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function urlFor(source: any) {
//   return builder.image(source).url();
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractTextAndImage(content: any[]) {
//   const textParts: string[] = [];
//   let imageUrl: string | null = null;
//   let listCounter = 1;

//   for (const item of content) {
//     if (item._type === 'block' && item.children) {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       let blockText = item.children.map((c: any) => c.text).join('');
//       if (item.listItem === 'bullet') {
//         blockText = `- ${blockText}`;
//       } else if (item.listItem === 'number') {
//         blockText = `${listCounter}. ${blockText}`;
//         listCounter++;
//       }
//       textParts.push(blockText);
//     } else if (item._type === 'image' && !imageUrl && item.asset?._ref) {
//       imageUrl = urlFor(item.asset);
//     }
//   }

//   return {
//     text: textParts.join('\n\n'),
//     imageUrl
//   };
// }

// // Функция для перевода текста через OpenAI
// async function translateToEnglish(text: string) {
//   const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
//   if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set');

//   const response = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${OPENAI_API_KEY}`
//     },
//     body: JSON.stringify({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content: 'You are a translator that translates Polish text to English while preserving formatting, lists, and line breaks.'
//         },
//         {
//           role: 'user',
//           content: text
//         }
//       ],
//       temperature: 0
//     })
//   });

//   const data = await response.json();
//   const translated = data.choices?.[0]?.message?.content;
//   return translated || text;
// }

// export async function POST(req: NextRequest) {
//   const token = req.cookies.get('linkedin_token')?.value;
//   if (!token) return new NextResponse('Not authenticated', { status: 401 });

//   const { posts } = await req.json();
//   const organizationUrn = 'urn:li:organization:66890500';

//   try {
//     for (const post of posts) {
//       const { text, imageUrl } = extractTextAndImage(post.content);

//       // --- Добавляем перевод ---
//       const translatedText = await translateToEnglish(text);

//       const media = [];
//       let shareMediaCategory = 'NONE';

//       if (imageUrl) {
//         // регистрация и загрузка изображения (как у тебя было)
//         const registerResponse = await axios.post(
//           'https://api.linkedin.com/v2/assets?action=registerUpload',
//           {
//             registerUploadRequest: {
//               recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
//               owner: organizationUrn,
//               serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
//             }
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'X-Restli-Protocol-Version': '2.0.0',
//               'Content-Type': 'application/json'
//             }
//           }
//         );

//         const uploadUrl =
//           registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
//         const asset = registerResponse.data.value.asset;

//         const imgResponse = await fetch(imageUrl);
//         const imgBuffer = await imgResponse.arrayBuffer();

//         await axios.put(uploadUrl, Buffer.from(imgBuffer), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' } });

//         media.push({ status: 'READY', description: { text: post.desc }, media: asset, title: { text: post.title } });
//         shareMediaCategory = 'IMAGE';
//       }

//       // публикация с переведённым текстом
//       const payload = {
//         author: organizationUrn,
//         lifecycleState: 'PUBLISHED',
//         specificContent: {
//           'com.linkedin.ugc.ShareContent': {
//             shareCommentary: {
//               text: `${post.title}\n\n${post.desc}\n\n${translatedText}`
//             },
//             shareMediaCategory,
//             ...(media.length > 0 ? { media } : {})
//           }
//         },
//         visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
//       };

//       console.log('payload:', JSON.stringify(payload, null, 2));

//       await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
//         headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' }
//       });
//     }

//     return NextResponse.json({ message: 'Posts published successfully' });
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (error: any) {
//     console.error('LinkedIn publish error:', error.response?.data || error.message);
//     return new NextResponse('Failed to publish posts', { status: 500 });
//   }
// }
