import { client } from '@/sanity/client';
import { nanoid } from 'nanoid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PTBlock = Record<string, any>;

export default async function generateImagesForArticle(
  bodyContent: unknown
): Promise<{
  modifiedBodyContent: PTBlock[];
  images: {
    altText: string;
    image: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
  }[];
}> {
  let blocks: PTBlock[];

  if (Array.isArray(bodyContent)) {
    blocks = bodyContent as PTBlock[];
  } else if (typeof bodyContent === 'string') {
    try {
      blocks = JSON.parse(bodyContent) as PTBlock[];
    } catch (error) {
      console.error('❌ Invalid JSON format for bodyContent:', error);
      return { modifiedBodyContent: [], images: [] };
    }
  } else {
    console.error('❌ bodyContent must be an array or a JSON string');
    return { modifiedBodyContent: [], images: [] };
  }

  const images: {
    altText: string;
    image: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
  }[] = [];

  const updatedBlocks: PTBlock[] = [];

  for (const block of blocks) {
    if (!block._key) block._key = nanoid();
    if (!('markDefs' in block)) block.markDefs = [];

    if (Array.isArray(block.children)) {
      block.children = block.children.map((child: PTBlock) => {
        if (!child._key) child._key = nanoid();
        if (!child._type) child._type = 'span';
        if (!('marks' in child)) child.marks = [];
        return child;
      });
    }

    if (block._type === 'list' && Array.isArray(block.children)) {
      block.children = block.children.map((child: PTBlock) => {
        if (!child._key) child._key = nanoid();
        if (!('markDefs' in child)) child.markDefs = [];
        if (!child.style) child.style = 'normal';
        if (!Array.isArray(child.children)) child.children = [];
        return child;
      });
    }

    if (block.dataImageDescription) {
      const rawDesc = String(block.dataImageDescription).trim();

      const match = rawDesc.match(/\[IMAGE:\s*(.*?)\]/i);
      console.log("match: ", match)
      const imageDescription = match ? match[1].trim() : rawDesc;
      const altText =
        typeof block.alt === 'string' && block.alt.length > 0
          ? block.alt
          : imageDescription;

      try {
        const imageResponse = await fetch('/api/ai-assistant/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imageDescription }),
        });

        if (!imageResponse.ok) {
          console.error(`❌ Failed to generate image for "${imageDescription}"`);
          updatedBlocks.push(block);
          continue;
        }

        const { image: base64Image } = await imageResponse.json();

        if (
          !base64Image ||
          typeof base64Image !== 'string' ||
          !base64Image.startsWith('data:image/')
        ) {
          console.error('❌ Invalid base64 image data:', base64Image);
          updatedBlocks.push(block);
          continue;
        }

        const response = await fetch(base64Image);
        const blob = await response.blob();

        const uploadedAsset = await client.assets.upload('image', blob, {
          filename: `${Date.now()}.webp`,
        });

        const imageBlock: PTBlock = {
          _key: `image-${nanoid()}`,
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: uploadedAsset._id,
          },
          alt: altText,
        };

        images.push({
          altText,
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: uploadedAsset._id,
            },
          },
        });

        updatedBlocks.push(block);
        updatedBlocks.push(imageBlock);
      } catch (error) {
        console.error(`❌ Error generating image for "${imageDescription}":`, error);
        updatedBlocks.push(block);
      }
    } else {
      updatedBlocks.push(block);
    }
  }

  console.log("3) data: ", images)
  return {
    modifiedBodyContent: updatedBlocks,
    images,
  };
}
