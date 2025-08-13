import { getImage } from "@/prompts/imagePrompt";

export default async function generateImagesForArticle(bodyContent: string) {
  const imagePlaceholderRegex = /<img src="" alt="\[IMAGE:(.*?)\].*?">/gi;
  let match;
  let modifiedBodyContent = bodyContent;
  let image;

  while ((match = imagePlaceholderRegex.exec(bodyContent)) !== null) {
    const originalTag = match[0];
    const imageDescription = match[1].trim();

    const promptImage = getImage(imageDescription);

    try {
      const imageResponse = await fetch('/api/ai-assistant/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptImage }),
      });

      if (!imageResponse.ok) {
        console.error(`❌ Failed to generate image for "${imageDescription}"`);
        continue;
      }

      image = await imageResponse.json();
      const { image: base64Image } = image;

      image = base64Image;
      
      if (!base64Image.startsWith("data:image/")) {
        console.error(`❌ Invalid base64 image data:`, base64Image);
        continue;
      }

      const updatedTag = originalTag.replace('src=""', `src="${base64Image}"`);
      const escapedOriginalTag = originalTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagRegex = new RegExp(escapedOriginalTag, 'g');
      modifiedBodyContent = modifiedBodyContent.replace(tagRegex, updatedTag);

    } catch (error) {
      console.error(`❌ Error generating image for "${imageDescription}":`, error);
    }
  }

  return { modifiedBodyContent };
}
