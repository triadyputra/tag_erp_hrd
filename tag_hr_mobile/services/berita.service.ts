import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { authFetch } from "@/utils/fetcher";

export type BeritaItem = {
  Id: number;
  Judul: string;
  Slug: string;
  Isi: string;
  Status: number;
  Gambar: string;
  IsPinned: boolean;
  CreatedAt: string;
  UpdatedAt: string;
};

export type ListBeritaResult = {
  Data: BeritaItem[];
  Total: number;
};

const FILES_BASE = DATA_API_BASE_URL.replace(/\/api\/?$/, "");

/** Log ke JS (Metro) + Hermes `print` → sering muncul di `adb logcat` / Logcat Android Studio. */
function beritaLog(step: string, detail?: string) {
  const line = detail ? `[Berita] ${step} | ${detail}` : `[Berita] ${step}`;
  console.warn(line);
  const printFn = (globalThis as { print?: (s: string) => void }).print;
  if (typeof printFn === "function") {
    try {
      printFn(line);
    } catch {
      /* abaikan */
    }
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function getMetadata(root: Record<string, unknown>) {
  return asRecord(root.Metadata) ?? asRecord(root.metadata);
}

function metadataSuccess(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const s = meta.Success ?? meta.success;
  if (s === true || s === "true" || s === 1) return true;
  const code = meta.Code ?? meta.code;
  return code === 200 || code === "200";
}

function metadataMessage(meta: Record<string, unknown> | null): string {
  if (!meta) return "";
  const m = meta.Message ?? meta.message;
  return typeof m === "string" ? m : "";
}

function mapBeritaRows(rows: unknown[]): BeritaItem[] {
  const out: BeritaItem[] = [];
  for (const raw of rows) {
    const o = asRecord(raw);
    if (!o) continue;

    const idRaw = o.Id ?? o.id;
    const idNum = typeof idRaw === "number" ? idRaw : Number(idRaw);
    if (!Number.isFinite(idNum)) continue;

    const pinned = o.IsPinned ?? o.isPinned ?? o.is_pinned;
    const isPinned =
      pinned === true ||
      pinned === "true" ||
      pinned === 1 ||
      pinned === "1";

    out.push({
      Id: idNum,
      Judul: String(o.Judul ?? o.judul ?? ""),
      Slug: String(o.Slug ?? o.slug ?? ""),
      Isi: String(o.Isi ?? o.isi ?? ""),
      Status: Number(o.Status ?? o.status ?? 0),
      Gambar: String(o.Gambar ?? o.gambar ?? ""),
      IsPinned: Boolean(isPinned),
      CreatedAt: String(o.CreatedAt ?? o.createdAt ?? ""),
      UpdatedAt: String(o.UpdatedAt ?? o.updatedAt ?? ""),
    });
  }
  return out;
}

/** Ambil blok `Data` dari root atau dari `Result`/`result` bila API membungkusnya. */
function getDataBlock(root: Record<string, unknown>): unknown {
  const direct = root.Data ?? root.data;
  if (direct !== undefined && direct !== null) return direct;
  const res = asRecord(root.Result) ?? asRecord(root.result);
  if (res) {
    return res.Data ?? res.data ?? res.Result ?? res.result;
  }
  return undefined;
}

/** Baca payload list dari berbagai bentuk respons backend (PascalCase / camelCase / nested). */
function extractListPayload(root: Record<string, unknown>): ListBeritaResult {
  const dataBlock = getDataBlock(root);

  if (Array.isArray(dataBlock)) {
    const rows = mapBeritaRows(dataBlock);
    return { Data: rows, Total: rows.length };
  }

  const inner = asRecord(dataBlock);
  if (!inner) {
    return { Data: [], Total: 0 };
  }

  const list =
    inner.Data ??
    inner.data ??
    inner.Items ??
    inner.items ??
    inner.Results ??
    inner.results;
  const totalRaw = inner.Total ?? inner.total;

  if (!Array.isArray(list)) {
    return { Data: [], Total: typeof totalRaw === "number" ? totalRaw : 0 };
  }

  const rows = mapBeritaRows(list);
  const total =
    typeof totalRaw === "number" && !Number.isNaN(totalRaw)
      ? totalRaw
      : Number(totalRaw);

  return {
    Data: rows,
    Total: Number.isFinite(total) ? total : rows.length,
  };
}

export function resolveBeritaImageUrl(
  gambar: string | null | undefined,
): string | undefined {
  if (!gambar?.trim()) return undefined;
  const g = gambar.trim();
  if (/^https?:\/\//i.test(g)) return g;
  return `${FILES_BASE}${g.startsWith("/") ? "" : "/"}${g}`;
}

export function formatBeritaDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Top berita dari HR API — tanpa query parameter. */
export async function getListBerita(): Promise<ListBeritaResult> {
  beritaLog("getListBerita (GetTopBerita) dipanggil");

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.GET_TOP_BERITA}`;

  beritaLog("request", url);

  let res: Response;
  try {
    res = await authFetch(url, {
      method: "GET",
    });
  } catch (e) {
    beritaLog(
      "authFetch ERROR (belum dapat Response — log status tidak akan muncul)",
      e instanceof Error ? e.message : String(e),
    );
    throw e;
  }

  beritaLog("HTTP status", String(res.status));

  const text = await res.text();
  beritaLog("body length", String(text.length));

  const preview =
    text.length > 800 ? `${text.slice(0, 800)}… (${text.length} chars)` : text;
  beritaLog("body preview", preview);

  if (!text) {
    throw new Error("Response kosong dari server");
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (Array.isArray(json)) {
    const rows = mapBeritaRows(json);
    beritaLog("OK (root array)", `${rows.length} items`);
    return { Data: rows, Total: rows.length };
  }

  const root = asRecord(json);
  if (!root) {
    throw new Error("Format response tidak valid");
  }

  const meta = getMetadata(root);
  const payload = extractListPayload(root);
  const ok = metadataSuccess(meta);

  if (!ok && payload.Data.length === 0) {
    throw new Error(metadataMessage(meta) || "Gagal mengambil berita");
  }

  beritaLog("OK", `${payload.Data.length} items, total ${payload.Total}`);

  return payload;
}
