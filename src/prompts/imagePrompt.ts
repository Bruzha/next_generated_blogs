const BASE_STYLE = 'photorealistic, volumetric, with soft lighting, pleasant matching colors, without lines or contours.';

export const getImage = (imageDescription: string) => `
Draw a photo in which ${imageDescription} in style ${BASE_STYLE}
No text, no watermark, no logos, no captions. 

Illustration generated for CROCODE blog. CROCODE colors: 
- white (background)
- black (text)
- #7dbe3b (accent color associated with the company)

Top P = 0.5
T = 0.3
-ar 1:1
-s 900
-w 300 
`;