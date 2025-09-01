import { Handler } from '@netlify/functions';
import axios from 'axios';
import { client } from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);

export const schedule = "0 7 * * 2,5"; // каждый вторник и пятницу в 9:00 CEST, UTC+2


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlFor(source: any) {
  return builder.image(source).url();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextAndImage(content: any[]) {
  const textParts: string[] = [];
  let imageUrl: string | null = null;
  const listCounter = 1;

  for (const item of content) {
    if (item._type === 'block' && item.children) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let blockText = item.children.map((c: any) => c.text).join('');
      if (item.listItem === 'bullet') blockText = `- ${blockText}`;
      else if (item.listItem === 'number') blockText = `${listCounter}. ${blockText}`;
      textParts.push(blockText);
    } else if (item._type === 'image' && !imageUrl && item.asset?._ref) {
      imageUrl = urlFor(item.asset);
    }
  }

  return { text: textParts.join('\n\n'), imageUrl };
}

const handler: Handler = async () => {
  try {
    // 1. Получаем текущую дату
    const today = new Date();
    today.setHours(0, 0, 0, 0); // начало дня
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // начало следующего дня

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: any[] = await client.fetch(
    `*[_type == "articlesItem" && date >= $today && date < $tomorrow]`,
    { today: today.toISOString() }
    );

    if (posts.length === 0) {
      return { statusCode: 200, body: 'No posts to publish today' };
    }

    console.log(`Publishing ${posts.length} post(s)`);

    // 3. Берем токен LinkedIn из env
    const token = process.env.LINKEDIN_TOKEN;
    const organizationUrn = `urn:li:organization:${process.env.LINKEDIN_COMPANY_ID}`;

    for (const post of posts) {
      const { text, imageUrl } = extractTextAndImage(post.content || []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media: any[] = [];
      let shareMediaCategory = 'NONE';

      if (imageUrl) {
        // Регистрируем и загружаем изображение в LinkedIn
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

      // Публикуем пост
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

      await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      console.log(`Published: ${post.title}`);
    }

    return { statusCode: 200, body: 'Posts published successfully' };
  } catch (error) {
    console.error('Error publishing posts:', error);
    return { statusCode: 500, body: 'Error publishing posts' };
  }
};

export { handler };
