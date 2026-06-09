import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { USE_SERVER_ENROLLMENT } from "@/lib/face/constants";
import { authFetch } from "@/utils/fetcher";

export type ServerEnrollmentResult = {
  synced: boolean;
  message: string;
};

/**
 * Phase 2: store official 1:1 embedding per NIK in ERP DB (no Milvus needed).
 * Backend stores embedding_json and compares cosine similarity on verify.
 */
export async function syncEmbeddingToServer(
  nik: string,
  embeddings: number[][],
): Promise<ServerEnrollmentResult> {
  if (!USE_SERVER_ENROLLMENT) {
    return { synced: false, message: "Server enrollment disabled." };
  }

  const primary = embeddings[0];
  if (!primary?.length) {
    return { synced: false, message: "Embedding kosong." };
  }

  try {
    const res = await authFetch(
      `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.SAVE_FACE_EMBEDDING_MOBILE}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Nik: nik,
          Embedding: primary,
          MirrorEmbedding: embeddings[1] ?? null,
        }),
      },
    );

    const json = await res.json();
    if (!json?.Metadata?.Success) {
      return {
        synced: false,
        message: json?.Metadata?.Message ?? "Gagal menyimpan embedding ke server.",
      };
    }

    return { synced: true, message: "Embedding tersimpan di server." };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal sinkron embedding.";
    return { synced: false, message };
  }
}
