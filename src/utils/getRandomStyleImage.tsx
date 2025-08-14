// import fs from 'fs';
// import path from 'path';

// const STYLE_IMAGES_DIR = path.join(__dirname, 'assets', 'style-references');

// export default function getRandomStyleImage(): string {
//     console.log("STYLE_IMAGES_DIR: ", STYLE_IMAGES_DIR);
//     const files = fs.readdirSync(STYLE_IMAGES_DIR).filter(file => /\.(jpe?g|png)$/i.test(file));
//     console.log("files: ", files);
//     const randomFile = files[Math.floor(Math.random() * files.length)];
//     console.log("randomFile: ", randomFile);
//     return path.join(STYLE_IMAGES_DIR, randomFile);
// }
