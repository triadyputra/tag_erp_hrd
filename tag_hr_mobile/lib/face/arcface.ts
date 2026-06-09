import {
  ARCFACE_MODEL_FILENAME,
  ARCFACE_MODEL_MIN_BYTES,
  ARCFACE_MODEL_PROFILE,
  ARCFACE_MODEL_URL,
  FACE_INPUT_SIZE,
} from "@/lib/face/constants";
import { getErrorMessage } from "@/lib/face/errors";
import { imageToTensor, readImageFromUri } from "@/lib/face/image-utils";
import { normalizeEmbedding } from "@/lib/face/math";
import * as FileSystem from "expo-file-system/legacy";
import { NativeModules } from "react-native";

let session: Awaited<ReturnType<typeof createSession>> | null = null;
let inputName = "input.1";
let outputName = "683";

export type ModelDownloadProgress = {
  percent: number;
};

function assertOnnxNativeModule() {
  if (!NativeModules.Onnxruntime) {
    throw new Error(
      "Modul ONNX Runtime belum terpasang di app. Rebuild dengan: npx expo prebuild && npx expo run:android",
    );
  }
}

function assertOnnxInitialized() {
  if (typeof globalThis.OrtApi === "undefined") {
    const installed = NativeModules.Onnxruntime?.install?.() ?? false;
    if (!installed || typeof globalThis.OrtApi === "undefined") {
      throw new Error(
        "ONNX Runtime gagal diinisialisasi. Rebuild aplikasi: npx expo run:android",
      );
    }
  }
}

type OnnxRuntimeModule = typeof import("onnxruntime-react-native");

function loadOnnxRuntime(): OnnxRuntimeModule {
  assertOnnxNativeModule();
  // require() is stable with Metro; dynamic import() causes stale module ID errors after HMR.
  const runtime = require("onnxruntime-react-native") as OnnxRuntimeModule;
  assertOnnxInitialized();
  return runtime;
}

async function createSession(modelPath: string) {
  try {
    const { InferenceSession } = loadOnnxRuntime();
    return await InferenceSession.create(modelPath);
  } catch (err) {
    throw new Error(
      `Gagal memuat model pengenalan wajah: ${getErrorMessage(err, "model tidak valid")}`,
    );
  }
}

async function ensureModelFile(
  onProgress?: (progress: ModelDownloadProgress) => void,
): Promise<string> {
  const dir = `${FileSystem.documentDirectory}models/`;
  const modelPath = `${dir}${ARCFACE_MODEL_FILENAME}`;

  const info = await FileSystem.getInfoAsync(modelPath, { size: true });
  if (
    info.exists &&
    "size" in info &&
    typeof info.size === "number" &&
    info.size >= ARCFACE_MODEL_MIN_BYTES
  ) {
    onProgress?.({ percent: 100 });
    return modelPath;
  }

  if (info.exists) {
    await FileSystem.deleteAsync(modelPath, { idempotent: true });
  }

  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const download = FileSystem.createDownloadResumable(
    ARCFACE_MODEL_URL,
    modelPath,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite;
      const written = progress.totalBytesWritten;
      if (total > 0) {
        onProgress?.({ percent: Math.round((written / total) * 100) });
      }
    },
  );
  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error(
      "Gagal mengunduh model pengenalan wajah. Periksa koneksi internet lalu coba lagi.",
    );
  }

  const downloaded = await FileSystem.getInfoAsync(modelPath, { size: true });
  if (
    !downloaded.exists ||
    !("size" in downloaded) ||
    typeof downloaded.size !== "number" ||
    downloaded.size < ARCFACE_MODEL_MIN_BYTES
  ) {
    await FileSystem.deleteAsync(modelPath, { idempotent: true });
    throw new Error(
      "Model pengenalan wajah tidak lengkap. Periksa koneksi internet lalu coba lagi.",
    );
  }

  onProgress?.({ percent: 100 });
  return modelPath;
}

export async function ensureArcFaceSession(
  onDownloadProgress?: (progress: ModelDownloadProgress) => void,
) {
  if (session) return session;

  const modelPath = await ensureModelFile(onDownloadProgress);
  session = await createSession(modelPath);

  const inputs = session.inputNames;
  const outputs = session.outputNames;
  if (inputs.length > 0) inputName = inputs[0];
  if (outputs.length > 0) outputName = outputs[0];

  return session;
}

export async function getEmbeddingFromImageUri(
  uri: string,
): Promise<number[]> {
  const image = await readImageFromUri(uri);
  return getEmbeddingFromRgbImage(image);
}

export async function getEmbeddingFromRgbImage(
  image: {
    width: number;
    height: number;
    data: Uint8Array;
  },
  onDownloadProgress?: (progress: ModelDownloadProgress) => void,
): Promise<number[]> {
  const activeSession = await ensureArcFaceSession(onDownloadProgress);
  const { Tensor } = loadOnnxRuntime();
  const tensorData = imageToTensor(image);
  const inputTensor = new Tensor(
    "float32",
    tensorData,
    [1, 3, FACE_INPUT_SIZE, FACE_INPUT_SIZE],
  );

  try {
    const result = await activeSession.run({ [inputName]: inputTensor });
    const output = result[outputName];
    if (!output?.data) {
      throw new Error("Model pengenalan wajah tidak mengembalikan hasil.");
    }

    const embedding = Array.from(output.data as Float32Array);
    return normalizeEmbedding(embedding);
  } catch (err) {
    throw new Error(
      `Inferensi wajah gagal: ${getErrorMessage(err, "model error")}`,
    );
  }
}

export function resetArcFaceSession() {
  session = null;
}

export function getActiveModelProfile(): string {
  return ARCFACE_MODEL_PROFILE;
}
