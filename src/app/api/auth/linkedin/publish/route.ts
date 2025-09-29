//src/app/api/auth/linkedin/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';
import OpenAI from "openai";

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

async function translateToEnglish(text: string, maxLength = 3000) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API key not set');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content: `You are a translator that translates Polish text to English while preserving formatting, lists, and line breaks.
        This text is for a LinkedIn post. Requirements:
        - MAX ${maxLength} characters (hard limit).
        - If original text is longer, summarize while keeping the main points and a natural LinkedIn style.
        - Style the article to match LinkedIn's blog posts. For example: a professional, expert tone, with business value; less code and technical details, more benefit for business owners, marketers, and designers; personal experience is mentioned. But DO NOT change the meaning and benefit of the original article, DO NOT lose the content, just slightly adjust the style of presentation of the material.
        -  Use Generative Engine Optimization (GEO) principles:
          • Naturally integrate questions and answers to reflect what users ask AI (e.g. "How can EU brands migrate from WooCommerce to Shopify faster? Here’s what works...").
          • Add light geo-context when relevant (Poland, EU, Rzeszów, Europe).
          • Include factual elements: 1–2 stats, comparisons, or practical insights.
          • Optionally format part of the text as a short FAQ (Q&A style) if it fits naturally.
          • Ensure each translation feels unique, not formulaic.
        - Add a maximum of 1-3 relevant emojis to your text, scattering them throughout. Don't overdo it. Don't place emojis too close together.
        - Do NOT add emojis to every sentence.
        - Do NOT break JSON or formatting.
        - The final text is entirely in English.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0
  });

  return response.output_text || text;
}


export async function POST(req: NextRequest) {
  const token = req.cookies.get('linkedin_token')?.value;
  if (!token) return new NextResponse('Not authenticated', { status: 401 });

  const { posts } = await req.json();
  const organizationUrn = 'urn:li:organization:66890500';

  try {
    for (const post of posts) {
      const { text, imageUrl } = extractTextAndImage(post.content);

      let translatedText = await translateToEnglish(text);
      translatedText = translatedText.replace(/\*\*/g, '');
      let translatedTitle = await translateToEnglish(post.title, 200);
      translatedTitle = translatedTitle.replace(/\*\*/g, '');
      let translatedDesc = await translateToEnglish(post.desc, 500);
      translatedDesc = translatedDesc.replace(/\*\*/g, '');

      const media = [];
      let shareMediaCategory = 'NONE';

      if (imageUrl) {
        const registerResponse = await axios.post(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: organizationUrn,
              serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
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
          registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = registerResponse.data.value.asset;

        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();

        await axios.put(uploadUrl, Buffer.from(imgBuffer), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' } });

        media.push({ status: 'READY', description: { text: translatedDesc }, media: asset, title: { text: translatedTitle } });
        shareMediaCategory = 'IMAGE';
      }

      const payload = {
        author: organizationUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${translatedTitle}\n\n${translatedDesc}\n\n${translatedText}`
            },
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

    return NextResponse.json({ message: 'Posts published successfully' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('LinkedIn publish error:', error.response?.data || error.message);
    return new NextResponse('Failed to publish posts', { status: 500 });
  }
}
