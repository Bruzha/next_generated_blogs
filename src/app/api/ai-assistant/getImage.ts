import { getBase64ImageFromPublic } from "@/utils/imageToBase64";

const NEGATIVE_PROMPT = "deformed face, blurry face, extra limbs, distorted hands, missing fingers, incorrect anatomy, unrealistic reflections, duplicate body parts, asymmetrical face, artifacts, glitch, watermark, text, logo, poorly drawn face, extra arms, fused fingers, low quality, incorrect screen location, deformed diagrams, blurry keyboard, deformed keyboard";

const STYLE_IMAGES = [
  "image-styles/style1.png",
  "image-styles/style3.png",
  "image-styles/style4.png",
  "image-styles/style6.png",
];

export function getImage(imageDescription: string): {
  prompt: string;
  styleImageBase64: string[];
} {
  const styleSrc = STYLE_IMAGES[Math.floor(Math.random() * STYLE_IMAGES.length)];
  const base64 = getBase64ImageFromPublic(styleSrc);
  const base64Card = getBase64ImageFromPublic("image-styles/style2.png");

  if (!base64 || !base64Card) {
    throw new Error("Style image not found or failed to convert to base64");
  }

  const prompt = `
  Generate a original, photorealistic photo based on the following description:
  ${imageDescription}.

  Instructions:
    - Use reference images as a style.
    - Make sure faces, hands, proportions, laptops and keyboards are not deformed and look correct if they exist.
  Style: photorealistic without outlines.

  Negative prompt: ${NEGATIVE_PROMPT}
`.trim();

console.log('getImage: ', prompt)
  return { prompt, styleImageBase64: [base64, base64Card] };
}