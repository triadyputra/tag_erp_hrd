import { FACE_INPUT_SIZE } from "@/lib/face/constants";
import * as FileSystem from "expo-file-system/legacy";
import jpeg from "jpeg-js";
import { Images } from "react-native-nitro-image";
import type { RawPixelData } from "react-native-nitro-image";

export type RgbImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type FaceBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function toFilePath(uri: string): string {
  return uri.replace(/^file:\/\//, "");
}

function rawPixelDataToRgbImage(raw: RawPixelData): RgbImage {
  const { buffer, width, height, pixelFormat } = raw;
  const src = new Uint8Array(buffer);
  const data = new Uint8Array(width * height * 4);
  const format = pixelFormat.toUpperCase();

  for (let i = 0; i < width * height; i++) {
    const si = i * 4;
    const di = i * 4;

    if (format === "BGRA" || format === "BGRX") {
      data[di] = src[si + 2];
      data[di + 1] = src[si + 1];
      data[di + 2] = src[si];
    } else if (format === "ARGB" || format === "XRGB") {
      data[di] = src[si + 1];
      data[di + 1] = src[si + 2];
      data[di + 2] = src[si + 3];
    } else {
      data[di] = src[si];
      data[di + 1] = src[si + 1];
      data[di + 2] = src[si + 2];
    }

    data[di + 3] = 255;
  }

  return { width, height, data };
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function readImageWithNitro(uri: string): Promise<RgbImage> {
  const filePath = toFilePath(uri);
  const image = await Images.loadFromFileAsync(filePath);
  const raw = await image.toRawPixelDataAsync();
  return rawPixelDataToRgbImage(raw);
}

async function readImageWithJpegFallback(uri: string): Promise<RgbImage> {
  const normalizedUri = uri.startsWith("file://") ? uri : `file://${uri}`;
  const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeJpegBase64(base64);
}

export async function readImageFromUri(uri: string): Promise<RgbImage> {
  try {
    return await readImageWithNitro(uri);
  } catch {
    return readImageWithJpegFallback(uri);
  }
}

export function decodeJpegBase64(base64: string): RgbImage {
  const clean = base64.replace(/^data:image\/\w+;base64,/, "");
  const bytes = decodeBase64(clean);
  const decoded = jpeg.decode(bytes, { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
  };
}

export async function writePhotoToTempFile(
  photo: string,
): Promise<string> {
  const raw = photo.trim();
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error("Cache aplikasi tidak tersedia.");
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const path = `${cacheDir}face_ref_${Date.now()}.jpg`;
    const download = await FileSystem.downloadAsync(raw, path);
    if (!download?.uri) {
      throw new Error("Gagal mengunduh foto profil dari server.");
    }
    return download.uri.startsWith("file://")
      ? download.uri
      : `file://${download.uri}`;
  }

  const base64 = raw.startsWith("data:image/")
    ? raw.split(",")[1] ?? raw
    : raw;

  const path = `${cacheDir}face_ref_${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path.startsWith("file://") ? path : `file://${path}`;
}

export function cropFace(
  image: RgbImage,
  bounds: { left: number; top: number; width: number; height: number },
  padding = 0.15,
): RgbImage {
  const padX = bounds.width * padding;
  const padY = bounds.height * padding;

  const x0 = Math.max(0, Math.floor(bounds.left - padX));
  const y0 = Math.max(0, Math.floor(bounds.top - padY));
  const x1 = Math.min(
    image.width,
    Math.ceil(bounds.left + bounds.width + padX),
  );
  const y1 = Math.min(
    image.height,
    Math.ceil(bounds.top + bounds.height + padY),
  );

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

export function resizeImage(image: RgbImage, size: number): RgbImage {
  const data = new Uint8Array(size * size * 4);
  const xRatio = image.width / size;
  const yRatio = image.height / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.min(image.width - 1, Math.floor(x * xRatio));
      const srcY = Math.min(image.height - 1, Math.floor(y * yRatio));
      const srcIdx = (srcY * image.width + srcX) * 4;
      const dstIdx = (y * size + x) * 4;
      data[dstIdx] = image.data[srcIdx];
      data[dstIdx + 1] = image.data[srcIdx + 1];
      data[dstIdx + 2] = image.data[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }

  return { width: size, height: size, data };
}

/** Convert RGBA image to NCHW float32 tensor for ArcFace. */
export function imageToTensor(image: RgbImage): Float32Array {
  const size = FACE_INPUT_SIZE;
  const resized =
    image.width === size && image.height === size
      ? image
      : resizeImage(image, size);

  const tensor = new Float32Array(3 * size * size);
  const pixels = resized.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const r = (pixels[idx] - 127.5) / 127.5;
      const g = (pixels[idx + 1] - 127.5) / 127.5;
      const b = (pixels[idx + 2] - 127.5) / 127.5;
      const offset = y * size + x;
      tensor[offset] = r;
      tensor[size * size + offset] = g;
      tensor[2 * size * size + offset] = b;
    }
  }

  return tensor;
}
