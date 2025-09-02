// import { Handler } from '@netlify/functions';
// import axios from 'axios';
// import { client } from '@/sanity/client';
// import imageUrlBuilder from '@sanity/image-url';

// const builder = imageUrlBuilder(client);

// export const schedule = "0 7 * * 2,5"; // каждый вторник и пятницу в 9:00 CEST, UTC+2


// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function urlFor(source: any) {
//   return builder.image(source).url();
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function extractTextAndImage(content: any[]) {
//   const textParts: string[] = [];
//   let imageUrl: string | null = null;
//   const listCounter = 1;

//   for (const item of content) {
//     if (item._type === 'block' && item.children) {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       let blockText = item.children.map((c: any) => c.text).join('');
//       if (item.listItem === 'bullet') blockText = `- ${blockText}`;
//       else if (item.listItem === 'number') blockText = `${listCounter}. ${blockText}`;
//       textParts.push(blockText);
//     } else if (item._type === 'image' && !imageUrl && item.asset?._ref) {
//       imageUrl = urlFor(item.asset);
//     }
//   }

//   return { text: textParts.join('\n\n'), imageUrl };
// }

// const handler: Handler = async () => {
//   try {
//     // 1. Получаем текущую дату
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // начало дня
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1); // начало следующего дня

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const posts: any[] = await client.fetch(
//     `*[_type == "articlesItem" && date >= $today && date < $tomorrow]`,
//     { today: today.toISOString() }
//     );

//     if (posts.length === 0) {
//       return { statusCode: 200, body: 'No posts to publish today' };
//     }

//     console.log(`Publishing ${posts.length} post(s)`);

//     // 3. Берем токен LinkedIn из env
//     const token = process.env.LINKEDIN_TOKEN;
//     const organizationUrn = `urn:li:organization:${process.env.LINKEDIN_COMPANY_ID}`;

//     for (const post of posts) {
//       const { text, imageUrl } = extractTextAndImage(post.content || []);

//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const media: any[] = [];
//       let shareMediaCategory = 'NONE';

//       if (imageUrl) {
//         // Регистрируем и загружаем изображение в LinkedIn
//         const registerResponse = await axios.post(
//           'https://api.linkedin.com/v2/assets?action=registerUpload',
//           {
//             registerUploadRequest: {
//               recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
//               owner: organizationUrn,
//               serviceRelationships: [
//                 { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }
//               ]
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
//           registerResponse.data.value.uploadMechanism[
//             'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
//           ].uploadUrl;
//         const asset = registerResponse.data.value.asset;

//         const imgResponse = await fetch(imageUrl);
//         const imgBuffer = await imgResponse.arrayBuffer();

//         await axios.put(uploadUrl, Buffer.from(imgBuffer), {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'image/jpeg'
//           }
//         });

//         media.push({
//           status: 'READY',
//           description: { text: post.desc },
//           media: asset,
//           title: { text: post.title }
//         });

//         shareMediaCategory = 'IMAGE';
//       }

//       // Публикуем пост
//       const payload = {
//         author: organizationUrn,
//         lifecycleState: 'PUBLISHED',
//         specificContent: {
//           'com.linkedin.ugc.ShareContent': {
//             shareCommentary: {
//               text: `${post.title}\n\n${post.desc}\n\n${text}`
//             },
//             shareMediaCategory,
//             ...(media.length > 0 ? { media } : {})
//           }
//         },
//         visibility: {
//           'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
//         }
//       };

//       await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'X-Restli-Protocol-Version': '2.0.0',
//           'Content-Type': 'application/json'
//         }
//       });

//       console.log(`Published: ${post.title}`);
//     }

//     return { statusCode: 200, body: 'Posts published successfully' };
//   } catch (error) {
//     console.error('Error publishing posts:', error);
//     return { statusCode: 500, body: 'Error publishing posts' };
//   }
// };

// export { handler };

import { Handler } from '@netlify/functions';
import axios from 'axios';
import { client } from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);
export const schedule = "0 7 * * 2,5"; // вторник и пятница 09:00 CEST

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlFor(source: any) {
  return builder.image(source).url();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextAndImage(content: any[]) {
  const textParts: string[] = [];
  let imageUrl: string | null = null;

  for (const item of content) {
    if (item._type === 'block' && item.children) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let blockText = item.children.map((c: any) => c.text).join('');
      if (item.listItem === 'bullet') blockText = `- ${blockText}`;
      textParts.push(blockText);
    } else if (item._type === 'image' && !imageUrl && item.asset?._ref) {
      imageUrl = urlFor(item.asset);
    }
  }

  return { text: textParts.join('\n\n'), imageUrl };
}

const handler: Handler = async () => {
  try {
    // 1. Получаем токен из Sanity
    const auth = await client.fetch(`*[_id == "linkedinAuth"][0]`);
    if (!auth || !auth.accessToken) {
      return { statusCode: 401, body: 'No LinkedIn token stored' };
    }

    let token = auth.accessToken;
    const expiresAt = new Date(auth.expiresAt);
    console.log("token 1: ", token)

    // 2. Проверяем, не истек ли токен
    if (expiresAt.getTime() < Date.now()) {
      // Обновляем через refresh_token
      const refreshResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: auth.refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      token = refreshResponse.data.access_token;
      console.log("token 2: ", token)
      const newExpiresAt = new Date(Date.now() + refreshResponse.data.expires_in * 1000).toISOString();

      await client.createOrReplace({
        _id: 'linkedinAuth',
        _type: 'linkedinAuth',
        accessToken: token,
        refreshToken: auth.refreshToken,
        expiresAt: newExpiresAt
      });
    }

    // 3. Ищем посты на сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const posts = await client.fetch(
      `*[_type == "articlesItem" && date >= $today && date < $tomorrow]`,
      { today: today.toISOString(), tomorrow: tomorrow.toISOString() }
    );

    if (posts.length === 0) {
      return { statusCode: 200, body: 'No posts to publish today' };
    }

    const organizationUrn = `urn:li:organization:${process.env.LINKEDIN_COMPANY_ID}`;

    for (const post of posts) {
      const { text, imageUrl } = extractTextAndImage(post.content || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media: any[] = [];
      let shareMediaCategory = 'NONE';

      if (imageUrl) {
        const registerResponse = await axios.post(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: organizationUrn,
              serviceRelationships: [
                { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }
              ]
            }
          },
          { headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' } }
        );

        const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = registerResponse.data.value.asset;

        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();

        await axios.put(uploadUrl, Buffer.from(imgBuffer), {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' }
        });

        media.push({ status: 'READY', description: { text: post.desc }, media: asset, title: { text: post.title } });
        shareMediaCategory = 'IMAGE';
      }

      const payload = {
        author: organizationUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: `${post.title}\n\n${post.desc}\n\n${text}` },
            shareMediaCategory,
            ...(media.length > 0 ? { media } : {})
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };

      await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
        headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' }
      });
    }

    return { statusCode: 200, body: 'Posts published successfully' };
  } catch (error) {
    console.error('Error publishing posts:', error);
    return { statusCode: 500, body: 'Error publishing posts' };
  }
};

export { handler };
