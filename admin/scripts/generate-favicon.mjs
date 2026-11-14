import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, "../app/icon.svg");
const icoPath = path.resolve(__dirname, "../app/favicon.ico");

async function generateFavicon() {
  const svgBuffer = fs.readFileSync(svgPath);

  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  const icoBuffer = await pngToIco([png16, png32, png48]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log("Generated app/favicon.ico successfully.");
}

generateFavicon().catch((err) => {
  console.error("Failed to generate favicon:", err);
  process.exit(1);
});
