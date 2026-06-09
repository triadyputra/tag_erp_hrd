export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const result = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      result[i] += emb[i];
    }
  }

  const count = embeddings.length;
  for (let i = 0; i < dim; i++) {
    result[i] /= count;
  }

  return normalizeEmbedding(result);
}

export function normalizeEmbedding(embedding: number[]): number[] {
  let norm = 0;
  for (const v of embedding) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return embedding;
  return embedding.map((v) => v / norm);
}

export function photoCacheKey(photo: string): string {
  const trimmed = photo.trim();
  if (trimmed.length <= 200) return trimmed;
  return `${trimmed.length}:${trimmed.slice(0, 100)}:${trimmed.slice(-100)}`;
}
