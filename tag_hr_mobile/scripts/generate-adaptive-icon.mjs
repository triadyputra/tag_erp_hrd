/**
 * Generate app icons with white background (Android adaptive + splash).
 * Run: npm run icons:generate
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "assets", "images", "tag_icon.png");
const outFg = path.join(root, "assets", "images", "tag_icon_adaptive_fg.png");
const outIcon = path.join(root, "assets", "images", "tag_icon_app.png");

const SIZE = 1024;
/** Zona aman adaptive icon Android (~66% diameter lingkaran). */
const SAFE = Math.round(SIZE * 0.62);
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function main() {
  const logo = await sharp(source)
    .resize(SAFE, SAFE, {
      fit: "contain",
      background: WHITE,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outFg);

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outIcon);

  console.log("Written:", outFg);
  console.log("Written:", outIcon);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
