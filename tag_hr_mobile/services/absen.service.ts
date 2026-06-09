import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { clearFaceEmbedding } from "@/lib/face/enrollment-cache";
import type { AbsenRecord, AbsenType, TodayAbsenStatus } from "@/types/absen";
import { authFetch } from "@/utils/fetcher";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USE_ERP_SYNC = false;

const STORAGE_KEY = "local_absen_records";

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isSameDay(timestamp: string): boolean {
  const date = new Date(timestamp);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return key === todayKey();
}

async function readRecords(): Promise<AbsenRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as AbsenRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

async function writeRecords(records: AbsenRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function saveLocalAbsen(
  type: AbsenType,
  nik: string,
  localScore: number,
): Promise<AbsenRecord> {
  const records = await readRecords();
  const record: AbsenRecord = {
    id: `${Date.now()}_${type}`,
    type,
    timestamp: new Date().toISOString(),
    localScore,
    verified: true,
    nik,
  };

  records.unshift(record);
  await writeRecords(records);

  if (USE_ERP_SYNC) {
    await syncAbsenToServer(record);
  }

  return record;
}

async function syncAbsenToServer(record: AbsenRecord): Promise<void> {
  const res = await authFetch(
    `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.SAVE_ABSEN_MOBILE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Type: record.type,
        Timestamp: record.timestamp,
        LocalScore: record.localScore,
        Nik: record.nik,
      }),
    },
  );

  const json = await res.json();
  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal sinkron absensi ke server.");
  }
}

export async function getTodayStatus(nik: string): Promise<TodayAbsenStatus> {
  const records = await readRecords();
  const today = records.filter((r) => r.nik === nik && isSameDay(r.timestamp));

  const checkIn =
    today
      .filter((r) => r.type === "IN")
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )[0] ?? null;

  const checkOut =
    today
      .filter((r) => r.type === "OUT")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )[0] ?? null;

  return { checkIn, checkOut };
}

export async function clearLocalAbsen(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function resetAbsenTestData(options?: {
  includeFaceCache?: boolean;
}): Promise<void> {
  await clearLocalAbsen();
  if (options?.includeFaceCache) {
    await clearFaceEmbedding();
  }
}

export async function getAbsenHistory(nik: string): Promise<AbsenRecord[]> {
  const records = await readRecords();
  return records
    .filter((r) => r.nik === nik)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export function canCheckIn(status: TodayAbsenStatus): boolean {
  return !status.checkIn;
}

export function canCheckOut(status: TodayAbsenStatus): boolean {
  return !!status.checkIn && !status.checkOut;
}

export function formatAbsenTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAbsenDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
