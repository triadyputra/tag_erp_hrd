export async function parseApiResponse<T = any>(
  res: Response
): Promise<T> {
  let json: any;

  try {
    json = await res.json();
  } catch {
    throw new Error("Respon server tidak valid");
  }

  // 🔥 NORMALISASI METADATA (support semua backend lama & baru)
  const metadata = json.metadata || json.Metadata;

  // ❌ HTTP error ATAU business error
  if (!res.ok || metadata?.Code !== "200") {
    throw new Error(
      metadata?.Message ||
      metadata?.message ||
      "Terjadi kesalahan"
    );
  }

  // ✅ sukses
  return json.Data ?? json.response ?? json;
}
