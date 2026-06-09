import { FACE_INPUT_SIZE } from "@/lib/face/constants";
import type { RgbImage } from "@/lib/face/image-utils";

type Point = { x: number; y: number };

/** InsightFace 5-point template for 112x112 ArcFace models. */
const ARCFACE_TEMPLATE: Point[] = [
  { x: 30.2946, y: 51.6963 },
  { x: 65.5318, y: 51.5014 },
  { x: 48.0252, y: 71.7366 },
  { x: 33.5493, y: 92.3655 },
  { x: 62.7299, y: 92.2041 },
];

type SimilarityMatrix = {
  a: number;
  b: number;
  tx: number;
  ty: number;
};

function meanPoint(points: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/** Maps template coordinates -> image coordinates (OpenCV/skimage convention). */
function estimateSimilarityTransform(
  imagePoints: Point[],
  templatePoints: Point[],
): SimilarityMatrix {
  const srcMean = meanPoint(templatePoints);
  const dstMean = meanPoint(imagePoints);

  let num = 0;
  let den = 0;
  let cross = 0;

  for (let i = 0; i < imagePoints.length; i++) {
    const sx = templatePoints[i].x - srcMean.x;
    const sy = templatePoints[i].y - srcMean.y;
    const dx = imagePoints[i].x - dstMean.x;
    const dy = imagePoints[i].y - dstMean.y;
    num += sx * dx + sy * dy;
    cross += sx * dy - sy * dx;
    den += sx * sx + sy * sy;
  }

  if (den === 0) {
    return { a: 1, b: 0, tx: dstMean.x, ty: dstMean.y };
  }

  const a = num / den;
  const b = cross / den;
  const tx = dstMean.x - (a * srcMean.x - b * srcMean.y);
  const ty = dstMean.y - (b * srcMean.x + a * srcMean.y);

  return { a, b, tx, ty };
}

function mapTemplateToImage(m: SimilarityMatrix, x: number, y: number): Point {
  return {
    x: m.a * x - m.b * y + m.tx,
    y: m.b * x + m.a * y + m.ty,
  };
}

function sampleBilinear(image: RgbImage, x: number, y: number): [number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(image.width - 1, x0 + 1);
  const y1 = Math.min(image.height - 1, y0 + 1);
  const dx = x - x0;
  const dy = y - y0;

  const idx00 = (y0 * image.width + x0) * 4;
  const idx10 = (y0 * image.width + x1) * 4;
  const idx01 = (y1 * image.width + x0) * 4;
  const idx11 = (y1 * image.width + x1) * 4;

  const r =
    image.data[idx00] * (1 - dx) * (1 - dy) +
    image.data[idx10] * dx * (1 - dy) +
    image.data[idx01] * (1 - dx) * dy +
    image.data[idx11] * dx * dy;
  const g =
    image.data[idx00 + 1] * (1 - dx) * (1 - dy) +
    image.data[idx10 + 1] * dx * (1 - dy) +
    image.data[idx01 + 1] * (1 - dx) * dy +
    image.data[idx11 + 1] * dx * dy;
  const b =
    image.data[idx00 + 2] * (1 - dx) * (1 - dy) +
    image.data[idx10 + 2] * dx * (1 - dy) +
    image.data[idx01 + 2] * (1 - dx) * dy +
    image.data[idx11 + 2] * dx * dy;

  return [r, g, b];
}

export function alignFaceWithLandmarks(
  image: RgbImage,
  landmarks: Point[],
): RgbImage {
  if (landmarks.length !== 5) {
    throw new Error("Butuh 5 landmark wajah untuk alignment.");
  }

  const templateToImage = estimateSimilarityTransform(
    landmarks,
    ARCFACE_TEMPLATE,
  );
  const size = FACE_INPUT_SIZE;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mapped = mapTemplateToImage(templateToImage, x, y);
      const srcX = mapped.x;
      const srcY = mapped.y;

      if (
        srcX < 0 ||
        srcY < 0 ||
        srcX >= image.width - 1 ||
        srcY >= image.height - 1
      ) {
        continue;
      }

      const [r, g, b] = sampleBilinear(image, srcX, srcY);
      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  return { width: size, height: size, data };
}

export function squareCropFace(
  image: RgbImage,
  bounds: { left: number; top: number; width: number; height: number },
  padding = 0.25,
): RgbImage {
  const cx = bounds.left + bounds.width / 2;
  const cy = bounds.top + bounds.height / 2;
  const side = Math.max(bounds.width, bounds.height) * (1 + padding * 2);
  const half = side / 2;

  const x0 = Math.max(0, Math.floor(cx - half));
  const y0 = Math.max(0, Math.floor(cy - half));
  const x1 = Math.min(image.width, Math.ceil(cx + half));
  const y1 = Math.min(image.height, Math.ceil(cy + half));
  const cropW = x1 - x0;
  const cropH = y1 - y0;
  const data = new Uint8Array(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((y0 + y) * image.width + (x0 + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      data[dstIdx] = image.data[srcIdx];
      data[dstIdx + 1] = image.data[srcIdx + 1];
      data[dstIdx + 2] = image.data[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }

  return { width: cropW, height: cropH, data };
}

export function flipImageHorizontal(image: RgbImage): RgbImage {
  const data = new Uint8Array(image.data.length);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const srcIdx = (y * image.width + x) * 4;
      const dstIdx = (y * image.width + (image.width - 1 - x)) * 4;
      data[dstIdx] = image.data[srcIdx];
      data[dstIdx + 1] = image.data[srcIdx + 1];
      data[dstIdx + 2] = image.data[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }
  return { width: image.width, height: image.height, data };
}
