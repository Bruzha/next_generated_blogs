import { getBase64ImageFromPublic } from "@/utils/imageToBase64";

const NEGATIVE_PROMPT = "deformed face, blurry face, extra limbs, distorted hands, missing fingers, incorrect anatomy, unrealistic reflections, duplicate body parts, asymmetrical face, artifacts, glitch, watermark, text, logo, poorly drawn face, extra arms, fused fingers, low quality, incorrect screen location, deformed diagrams";
const STYLE_IMAGES = [
  "image-styles/style1.png",
  "image-styles/style2.png",
  "image-styles/style3.png",
  "image-styles/style4.png",
  "image-styles/style5.png",
  "image-styles/style6.png",
  "image-styles/style10.png",
];

export function getImage(imageDescription: string): {
  prompt: string;
  styleImageBase64: string;
} {
  const styleSrc = STYLE_IMAGES[Math.floor(Math.random() * STYLE_IMAGES.length)];
  const base64 = getBase64ImageFromPublic(styleSrc);

  if (!base64) {
    throw new Error("Style image not found or failed to convert to base64");
  }

  const prompt = `
  Generate a completely original, photorealistic image that accurately represents the following scene: ${imageDescription}.

  Only use the *visual style*, *color palette*, and *overall mood* of the reference image — strictly as artistic inspiration. 
  Do **not** copy or replicate any objects, subjects, layouts, or content from the reference. The final image must depict a **totally new and unique composition**, determined solely by the scene description above.

  The result should look like a **real photograph** — realistic lighting, textures, and perspective — while creatively reflecting the reference style.

  Negative prompt: ${NEGATIVE_PROMPT}
`.trim();

  return { prompt, styleImageBase64: base64 };
}