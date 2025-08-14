const BASE_STYLE = [
    'photorealistic, volumetric, with soft lighting, pleasant matching colors, without lines or contours',
    "digital volumetric stylized illustration with a 3D effect, with contrasting lighting, pleasantly selected colors, without lines and contours, without sharp corners",
    "flat minimalism with textured fills and smooth gradients, pastel colors, no lines or contours",
    "flat minimalism with solid and gradient fills, limited color palette (3-5 colors and their shades), clear vector outline",
    "digital 2D, clear outline, matching colors, contrasting light and shadow, medium detail"
];

const NEGATIVE_PROMPT = "deformed face, blurry face, extra limbs, distorted hands, missing fingers, incorrect anatomy, unrealistic reflections, duplicate body parts, asymmetrical face, artifacts, glitch, watermark, text, logo, poorly drawn face, extra arms, fused fingers, low quality, incorrect screen location, deformed diagrams";

const style = BASE_STYLE[Math.floor(Math.random() * BASE_STYLE.length)];

export const getImage = (imageDescription: string) => `
Generate a photo in which ${imageDescription} in style ${style}.
No text, no watermark, no logos, no captions.

Negative prompt: ${NEGATIVE_PROMPT}

Top P = 0.9
T = 0.5
-ar 1:1
-s 1000
-w 500 
`;

// import getRandomStyleImage from "@/utils/getRandomStyleImage";

// const NEGATIVE_PROMPT = "deformed face, blurry face, extra limbs, distorted hands, missing fingers, incorrect anatomy, unrealistic reflections, duplicate body parts, asymmetrical face, artifacts, glitch, watermark, text, logo, poorly drawn face, extra arms, fused fingers, low quality, incorrect screen location, deformed diagrams";

// export const getImage = (imageDescription: string) => {
//     const styleReference = getRandomStyleImage();
//     console.log("styleReference: ", styleReference);

//     return `
// Use the following image as a style reference: ${styleReference}

// Generate a photo in which ${imageDescription}, matching the visual style of the reference.

// No text, no watermark, no logos, no captions.

// Negative prompt: ${NEGATIVE_PROMPT}

// Top P = 0.9
// T = 0.5
// -ar 1:1
// -s 1000
// -w 500
// `;
// };
