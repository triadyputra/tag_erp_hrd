import { Directory, File, Paths } from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";

const FLAG_ACTIVITY_NEW_TASK = 0x10000000;
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const PDF_MIME = "application/pdf";

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "dokumen.pdf";
  const withExt = trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
  return withExt.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function openPdfFromBase64(base64: string) {
  try {
    if (!base64) {
      throw new Error("PDF kosong");
    }

    const pureBase64 = (base64.includes(",") ? base64.split(",")[1] : base64)
      // base64 kadang ada newline/whitespace dari server
      .replace(/\s+/g, "");

    // =============================
    // 🌐 WEB ONLY (boleh pakai Blob)
    // =============================
    if (Platform.OS === "web") {
      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Uint8Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const blob = new Blob([byteNumbers], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.click();

      return url;
    }

    // =============================
    // 📱 MOBILE ONLY
    // =============================
    const dir = new Directory(Paths.document);
    if (!dir.exists) {
      await dir.create({ intermediates: true });
    }

    const file = new File(dir, `dokumen-${Date.now()}.pdf`);
    await file.write(pureBase64, { encoding: "base64" });

    return file.uri;
  } catch (err) {
    console.error("ERROR openPdfFromBase64:", err);
    throw err;
  }
}

export type SavePdfResult = {
  path: string;
  /** Pesan lokasi untuk ditampilkan ke pengguna */
  locationLabel: string;
};

/**
 * Simpan file PDF ke penyimpanan perangkat (bukan sheet share).
 * Android: folder Download. iOS: folder Documents aplikasi (akses via Files).
 */
export async function savePdfFileToDeviceStorage(
  sourceUri: string,
  fileName: string,
): Promise<SavePdfResult> {
  if (!sourceUri?.trim()) {
    throw new Error("File PDF tidak ditemukan.");
  }

  const safeName = sanitizeFileName(fileName);
  const srcPath = sourceUri.replace(/^file:\/\//, "");

  const exists = await ReactNativeBlobUtil.fs.exists(srcPath);
  if (!exists) {
    throw new Error("File PDF sumber tidak ditemukan.");
  }

  if (Platform.OS === "android") {
    const destPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${safeName}`;
    await ReactNativeBlobUtil.fs.unlink(destPath).catch(() => {});
    await ReactNativeBlobUtil.fs.cp(srcPath, destPath);

    try {
      if (Number(Platform.Version) >= 29) {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: safeName,
            parentFolder: "",
            mimeType: "application/pdf",
          },
          "Download",
          destPath,
        );
      }
    } catch {
      /* file tetap di DownloadDir meski index media gagal */
    }

    return {
      path: destPath,
      locationLabel: `Download/${safeName}`,
    };
  }

  if (Platform.OS === "ios") {
    const destPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${safeName}`;
    await ReactNativeBlobUtil.fs.unlink(destPath).catch(() => {});
    await ReactNativeBlobUtil.fs.cp(srcPath, destPath);
    return {
      path: destPath,
      locationLabel: `Files → HR-TAG → ${safeName}`,
    };
  }

  // Web: unduh lewat browser
  const base64 = await ReactNativeBlobUtil.fs.readFile(srcPath, "base64");
  const url = await openPdfFromBase64(base64);
  return {
    path: url ?? srcPath,
    locationLabel: "unduhan browser",
  };
}

function toFileUri(localPath: string): string {
  const p = localPath.trim();
  if (p.startsWith("file://")) return p;
  const unix = p.replace(/\\/g, "/");
  return unix.startsWith("/") ? `file://${unix}` : `file:///${unix}`;
}

/** Buka PDF yang sudah tersimpan di perangkat (viewer sistem). */
export async function openSavedPdfFile(localPath: string): Promise<void> {
  const path = localPath.replace(/^file:\/\//, "");
  const exists = await ReactNativeBlobUtil.fs.exists(path);
  if (!exists) {
    throw new Error("File PDF tidak ditemukan.");
  }

  if (Platform.OS === "android") {
    try {
      await ReactNativeBlobUtil.android.actionViewIntent(path, PDF_MIME);
      return;
    } catch {
      /* fallback */
    }

    const contentUri = await getContentUriAsync(toFileUri(path));
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      type: PDF_MIME,
      flags: FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION,
    });
    return;
  }

  if (Platform.OS === "ios") {
    try {
      await ReactNativeBlobUtil.ios.openDocument(path);
      return;
    } catch {
      const canOpen = await Linking.canOpenURL(toFileUri(path));
      if (canOpen) {
        await Linking.openURL(toFileUri(path));
        return;
      }
      throw new Error("Tidak ada aplikasi untuk membuka PDF.");
    }
  }

  if (Platform.OS === "web") {
    window.open(toFileUri(path), "_blank");
    return;
  }

  throw new Error("Membuka PDF tidak didukung di perangkat ini.");
}

// =============================
// 🔧 HELPER WEB
// =============================
/* function b64toBlob(b64Data: string, contentType: string) {
  const byteCharacters = atob(b64Data);
  const byteNumbers = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([byteNumbers], { type: contentType });
}
 */
