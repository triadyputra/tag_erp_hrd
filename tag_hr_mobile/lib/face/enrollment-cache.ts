import AsyncStorage from "@react-native-async-storage/async-storage";

const EMBEDDING_KEY = "face_embedding_ref_v5";

export async function clearFaceEmbedding(): Promise<void> {
  await AsyncStorage.removeItem(EMBEDDING_KEY);
}

export async function readCachedEmbedding(
  photoKey: string,
): Promise<number[][] | null> {
  const raw = await AsyncStorage.getItem(EMBEDDING_KEY);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as {
      embeddings?: number[][];
      embedding?: number[];
      photoKey?: string;
    };

    if (stored.photoKey !== photoKey) return null;

    if (Array.isArray(stored.embeddings) && stored.embeddings.length > 0) {
      return stored.embeddings;
    }

    if (Array.isArray(stored.embedding) && stored.embedding.length > 0) {
      return [stored.embedding];
    }
  } catch {
    await AsyncStorage.removeItem(EMBEDDING_KEY);
  }

  return null;
}

export async function writeCachedEmbedding(
  photoKey: string,
  embeddings: number[][],
): Promise<void> {
  await AsyncStorage.setItem(
    EMBEDDING_KEY,
    JSON.stringify({ embeddings, photoKey }),
  );
}
