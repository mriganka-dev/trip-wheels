import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const svgPath = path.join(rootDir, "app", "icon.svg");
const outputDir = path.join(rootDir, "public", "icons");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, "icon-192.png"));
  console.log("Generated icon-192.png");

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, "icon-512.png"));
  console.log("Generated icon-512.png");

  // 512x512 Maskable PNG (with 10% padding for safe area)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: "#1F5C4D",
    })
    .png()
    .toFile(path.join(outputDir, "icon-512-maskable.png"));
  console.log("Generated icon-512-maskable.png");

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");

  console.log("PWA icons successfully generated in public/icons/");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
