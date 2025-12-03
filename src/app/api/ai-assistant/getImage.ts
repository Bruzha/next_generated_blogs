import { getBase64ImageFromPublic } from "@/utils/imageToBase64";

const NEGATIVE_PROMPT = "collage, fragmented picture, deformed face, blurry face, extra limbs, distorted hands, missing fingers, incorrect anatomy, unrealistic reflections, duplicate body parts, asymmetrical face, artifacts, unreadable text, poorly drawn face, extra arms, fused fingers, incorrect screen location, deformed diagrams, blurry keyboard, deformed keyboard, low quality, worst quality, jpeg artifacts";

const STYLE_IMAGES = [
  "image-styles/style1.png",
  "image-styles/style3.png",
  "image-styles/style4.png",
  "image-styles/style6.png",
  "image-styles/style7.png",
  "image-styles/style8.png",
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
  Generate a new, unique, original photo based on the following description:
  ${imageDescription}.

  Instructions:
    - Use reference images ONLY for stylization. Generate a completely new image based on the description, NOT a copy or collage of reference images.
    - Make sure faces, hands, proportions, laptops and keyboards are not deformed and look correct if they exist.
    - Realistic human anatomy: correct facial proportions; both eyes visible and aligned; mouth and nose proportionate.
    - Hands: five fingers, natural finger spacing, no fused or extra fingers, natural palm shape; if holding an object, fingers wrap naturally.
    - Devices (laptops/keyboards/phones): realistic proportions, keys visible, no blurred or fused keys; correct screen aspect ratio and glare consistent with scene lighting.
    - No extra limbs, no duplicated facial features, no asymmetrical face, no floating or disconnected body parts.
    - High detail: photorealistic, ultra-realistic skin textures, crisp edges, realistic depth of field, natural bokeh from camera lens.
    - Style instructions are references only — do not copy exact patterns, produce a new unique image.
    - Text: English, clear, legible, and meaningful.
  Style: photorealistic without outlines.

  Negative prompt: ${NEGATIVE_PROMPT}
`.trim();
  return { prompt, styleImageBase64: [base64, base64Card] };
}