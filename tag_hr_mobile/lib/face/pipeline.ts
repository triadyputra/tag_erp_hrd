import { getEmbeddingFromRgbImage } from "@/lib/face/arcface";
import { flipImageHorizontal } from "@/lib/face/align";
import { MAX_PITCH, MAX_ROLL, MAX_YAW } from "@/lib/face/constants";
import { prepareAlignedFaceImage } from "@/lib/face/detect";
import { decodeJpegBase64, type RgbImage } from "@/lib/face/image-utils";
import { cosineSimilarity } from "@/lib/face/math";
import FaceDetection, { type Face as MlKitFace } from "@react-native-ml-kit/face-detection";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

type DetectedFace = MlKitFace;

function toFileUri(uri: string): string {
  return uri.startsWith("file://") ? uri : `file://${uri}`;
}

function faceArea(face: DetectedFace): number {
  return (face.frame?.width ?? 0) * (face.frame?.height ?? 0);
}

function pickLargestFace<T extends DetectedFace>(faces: T[]): T | null {
  if (faces.length === 0) return null;
  return faces.reduce((largest, face) =>
    faceArea(face) > faceArea(largest) ? face : largest,
  );
}

function validateStaticFace(face: DetectedFace): void {
  const yaw = Math.abs(face.headEulerAngleY ?? 0);
  const pitch = Math.abs(face.headEulerAngleX ?? 0);
  const roll = Math.abs(face.headEulerAngleZ ?? 0);

  if (yaw > MAX_YAW || pitch > MAX_PITCH || roll > MAX_ROLL) {
    throw new Error("Hadapkan wajah lurus ke kamera.");
  }

}

/** Bake EXIF orientation so landmarks and pixels use the same coordinate space. */
export async function normalizeImageUri(uri: string): Promise<string> {
  const input = toFileUri(uri);
  const result = await manipulateAsync(input, [], {
    compress: 0.95,
    format: SaveFormat.JPEG,
  });
  return toFileUri(result.uri);
}

export async function loadRgbImageForFace(uri: string): Promise<RgbImage> {
  const fileUri = toFileUri(uri);
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeJpegBase64(base64);
}

async function detectFaceInNormalizedImage(
  normalizedUri: string,
): Promise<DetectedFace> {
  const fileUri = toFileUri(normalizedUri);
  const faces = await FaceDetection.detect(fileUri, {
    performanceMode: "accurate",
    landmarkMode: "all",
    classificationMode: "all",
    minFaceSize: 0.1,
  });
  const face = pickLargestFace(faces);
  if (!face) {
    throw new Error("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.");
  }
  validateStaticFace(face);
  return face;
}

export async function detectFaceInImage(uri: string): Promise<DetectedFace> {
  const normalized = await normalizeImageUri(uri);
  return detectFaceInNormalizedImage(normalized);
}

export async function buildFaceEmbeddingVariants(
  uri: string,
  onDownloadProgress?: (progress: { percent: number }) => void,
): Promise<number[][]> {
  const normalized = await normalizeImageUri(uri);
  const face = await detectFaceInNormalizedImage(normalized);
  const image = await loadRgbImageForFace(normalized);
  const aligned = prepareAlignedFaceImage(image, face);
  const flipped = flipImageHorizontal(aligned);

  const [original, mirrored] = await Promise.all([
    getEmbeddingFromRgbImage(aligned, onDownloadProgress),
    getEmbeddingFromRgbImage(flipped, onDownloadProgress),
  ]);

  return [original, mirrored];
}

export function bestPairwiseSimilarity(
  referenceEmbeddings: number[][],
  captureEmbeddings: number[][],
): number {
  let best = -1;
  for (const ref of referenceEmbeddings) {
    for (const cap of captureEmbeddings) {
      const score = cosineSimilarity(ref, cap);
      if (score > best) best = score;
    }
  }
  return best;
}

export type BatchScoreResult = {
  minScore: number;
  avgScore: number;
  batchScores: number[];
};

export function scoreCaptureBatches(
  referenceEmbeddings: number[][],
  captureBatches: number[][][],
): BatchScoreResult {
  const batchScores = captureBatches.map((batch) =>
    bestPairwiseSimilarity(referenceEmbeddings, batch),
  );
  const minScore = Math.min(...batchScores);
  const avgScore =
    batchScores.reduce((sum, score) => sum + score, 0) / batchScores.length;
  return { minScore, avgScore, batchScores };
}
