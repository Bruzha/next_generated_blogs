const BASE_STYLE = [
    'photorealistic, volumetric, with soft lighting, pleasant matching colors, without lines or contours',
    "digital volumetric stylized illustration with a 3D effect, with contrasting lighting, pleasantly selected colors, without lines and contours, without sharp corners",
    "flat minimalism with textured fills and smooth gradients, pastel colors, no lines or contours",
    "flat minimalism with solid and gradient fills, limited color palette (3-5 colors and their shades), clear vector outline",
    "digital 2D, clear outline, matching colors, contrasting light and shadow, medium detail"
];
const style = BASE_STYLE[Math.floor(Math.random() * BASE_STYLE.length)];
export const getImage = (imageDescription: string) => `
Generate a photo in which ${imageDescription} in style ${style}.
No text, no watermark, no logos, no captions. 

Top P = 0.9
T = 0.5
-ar 1:1
-s 900
-w 500 
`;