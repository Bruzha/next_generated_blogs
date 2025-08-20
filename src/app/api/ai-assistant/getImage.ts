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
  Generate a realistic natural photo in which ${imageDescription}.
  Use the style, color palette, and mood of the reference image,
  but do not copy its content, subject, objects, or composition.
  The result must be a completely new scene with unique elements,
  only inspired by the artistic style of the reference image.
  The output image must be exactly 1024x1024 pixels in resolution.

  Negative prompt: ${NEGATIVE_PROMPT}
`.trim();

  return { prompt, styleImageBase64: base64 };
}