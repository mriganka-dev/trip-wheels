import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, "../app/icon.svg");
const outputDir = path.resolve(__dirname, "../public/icons");
const appleTouchIconPath = path.resolve(__dirname, "../public/apple-touch-icon.png");

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Standard 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, "icon-192.png"));

  // 2. Standard 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, "icon-512.png"));

  // 3. Maskable 512x512 PNG (with safe padding for maskable requirements)
  // Scaled mark placed in center of brand-colored canvas
  const innerMark = await sharp(svgBuffer)
    .resize(410, 410)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#1F5C4D",
    },
  })
    .composite([{ input: innerMark, top: 51, left: 51 }])
    .png()
    .toFile(path.join(outputDir, "icon-maskable-512.png"));

  // 4. Apple Touch Icon 180x180 PNG
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);

  console.log("Successfully generated all PWA icons in public/icons/ and apple-touch-icon.png");
}

generateIcons().catch((err) => {
  console.error("Failed to generate PWA icons:", err);
  process.exit(1);
});

