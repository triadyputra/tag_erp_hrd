import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import {
  getDetailKontrakMobile,
  signKontrak,
} from "@/services/kontrak.service";
import {
  openSavedPdfFile,
  savePdfFileToDeviceStorage,
} from "@/helpers/pdf.util";
import { Directory, File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import ReactNativeBlobUtil from "react-native-blob-util";
import SignatureScreen from "react-native-signature-canvas";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Estimasi jumlah halaman dari struktur PDF (fallback bila native mengembalikan 1). */
async function estimatePdfPageCountFromFile(uri: string): Promise<number> {
  try {
    const path = uri.replace(/^file:\/\//, "");
    const raw = await ReactNativeBlobUtil.fs.readFile(path, "utf8");

    const pagesTreeCount = raw.match(
      /\/Type\s*\/Pages\b[\s\S]{0,3000}?\/Count\s+(\d+)/,
    );
    if (pagesTreeCount?.[1]) {
      const n = parseInt(pagesTreeCount[1], 10);
      if (n > 0 && n < 500) return n;
    }

    const matches = raw.match(/\/Type\s*\/Page(?!s)\b/g);
    return matches?.length ?? 0;
  } catch {
    return 0;
  }
}

function resolvePageCount(nativeCount: number, estimated: number): number {
  const native = Number.isFinite(nativeCount) ? Math.floor(nativeCount) : 0;
  const est = Number.isFinite(estimated) ? Math.floor(estimated) : 0;
  if (native > 1) return native;
  if (est > 1) return est;
  return Math.max(native, 1);
}

const PDF_MIN_SCALE = 1;
const PDF_MAX_SCALE = 5;

export default function KontrakSignPage() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const contractId = decodeURIComponent(
    Array.isArray(params.contractId)
      ? params.contractId[0]
      : params.contractId || "",
  );

  const type = params.type;
  const start = params.start;
  const end = params.end;

  const signatureRef = useRef<any>(null);

  const [agreed, setAgreed] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [signatureValue, setSignatureValue] = useState<string | null>(null);

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [signing, setSigning] = useState(false);

  const [statusTtd, setStatusTtd] = useState<number>(0);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const pdfViewerHeight = screenHeight * 0.52;
  const pdfViewWidth = screenWidth - 32;

  const canGoPrev = totalPages > 1 && currentPage > 1;
  const canGoNext = totalPages > 1 && currentPage < totalPages;
  /** Pengguna sedang di halaman terakhir (indeks >= total halaman dokumen). */
  const isOnLastPage = totalPages > 0 && currentPage >= totalPages;
  const isSigned = statusTtd === 1;
  const showBottomPrimary = isSigned || (!isSigned && isOnLastPage);
  const bottomBarExtra =
    (pdfUri && !loadingPdf ? 38 : 0) +
    (showBottomPrimary ? (isOnLastPage && !isSigned ? 88 : 36) : 0) +
    8;

  const base64ToFile = async (base64: string) => {
    try {
      const pureBase64 = (base64.includes(",") ? base64.split(",")[1] : base64)
        .replace(/\\s+/g, "");

      const dir = new Directory(Paths.document);
      if (!dir.exists) {
        await dir.create({ intermediates: true });
      }

      const file = new File(dir, `kontrak-${Date.now()}.pdf`);
      await file.write(pureBase64, { encoding: "base64" });

      return file.uri;
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  const parseSignedStatus = (detail: any): number => {
    const candidates = [
      detail?.StatusTtd,
      detail?.StatusTTD,
      detail?.StatusTTd,
      detail?.Status,
      detail?.IsSigned,
      detail?.Signed,
    ];

    for (const c of candidates) {
      if (c === true) return 1;
      if (c === false) return 0;
      const n = Number(c);
      if (Number.isFinite(n)) return n ? 1 : 0;
    }

    return 0;
  };

  const loadPdf = useCallback(async () => {
    if (!contractId) return;

    try {
      setLoadingPdf(true);

      const res = await getDetailKontrakMobile(contractId);

      const base64 = res?.PdfBase64;
      const stTtd = parseSignedStatus(res?.Detail);
      console.log(`STATUS KONTRAK : ${stTtd}`);
      console.log("DETAIL KONTRAK:", res?.Detail);
      // console.log("statusTtd:", stTtd, typeof statusTtd);

      setStatusTtd(stTtd);

      if (!base64) {
        throw new Error("PDF tidak ditemukan");
      }

      const uri = await base64ToFile(base64);
      setCurrentPage(1);
      setTotalPages(0);
      setPdfUri(uri);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoadingPdf(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  useEffect(() => {
    if (!isOnLastPage) {
      setAgreed(false);
    }
  }, [isOnLastPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (!signatureValue || !contractId) return;

    const sendSignature = async () => {
      try {
        setSigning(true);
        console.log(signatureValue);
        console.log("SUBMIT SIGNATURE...");
        console.log(contractId);

        await signKontrak(contractId, signatureValue);

        setShowSign(false);

        Alert.alert("Berhasil", "Tanda tangan berhasil disimpan");

        // reload pdf biar ada signature
        // loadPdf();
        // 🔥 kembali ke halaman sebelumnya
        router.back();
      } catch (err: any) {
        Alert.alert("Error", err.message || "Gagal kirim tanda tangan");
      } finally {
        setSigning(false);
      }
    };

    sendSignature();
  }, [signatureValue]);

  const handleOK = (signature: string) => {
    setSignatureValue(signature);
    //setShowSign(false);
    //Alert.alert("Berhasil", "Tanda tangan berhasil dibuat");
  };

  const handleSubmit = () => {
    if (!agreed) {
      Alert.alert("Persetujuan", "Centang dulu");
      return;
    }

    signatureRef.current?.readSignature();
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureValue(null);
  };

  const closeSign = () => {
    setShowSign(false);
    setAgreed(false);
  };

  const handleDownloadPdf = async () => {
    try {
      if (!pdfUri) {
        Alert.alert("Info", "PDF belum tersedia");
        return;
      }

      setDownloading(true);
      const fileName = contractId
        ? `kontrak-${contractId}.pdf`
        : `kontrak-${Date.now()}.pdf`;

      const result = await savePdfFileToDeviceStorage(pdfUri, fileName);

      Alert.alert(
        "Berhasil disimpan",
        `PDF kontrak tersimpan di:\n${result.locationLabel}`,
        [
          { text: "Tutup", style: "cancel" },
          {
            text: "Buka dokumen",
            onPress: () => {
              void openSavedPdfFile(result.path).catch((openErr: unknown) => {
                const openMsg =
                  openErr instanceof Error
                    ? openErr.message
                    : "Gagal membuka PDF";
                Alert.alert("Gagal membuka", openMsg);
              });
            },
          },
        ],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan PDF";
      Alert.alert("Gagal", msg);
    } finally {
      setDownloading(false);
    }
  };

  const webStyle = `
    .m-signature-pad { box-shadow:none;border:none; }
    .m-signature-pad--footer { display:none; }
    body, html {
      width: 100%;
      height: 100%;
    }
  `;

  const openSignatureSheet = () => {
    if (!isOnLastPage) {
      Alert.alert(
        "Baca kontrak",
        totalPages > 1
          ? `Buka dan tetap di halaman terakhir (${totalPages}) untuk menandatangani.`
          : "Tunggu dokumen selesai dimuat.",
      );
      return;
    }

    if (!agreed) {
      Alert.alert("Persetujuan", "Centang persetujuan kontrak terlebih dahulu.");
      return;
    }

    setShowSign(true);
  };

  const goToPdfPage = useCallback(
    (target: number) => {
      if (totalPages <= 0) return;
      const page = Math.max(1, Math.min(totalPages, target));
      if (page === currentPage) return;
      setCurrentPage(page);
    },
    [totalPages, currentPage],
  );

  const goToPrevPage = () => {
    goToPdfPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPdfPage(currentPage + 1);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Tanda Tangan Kontrak" />

      <View style={styles.pdfCard}>
        <View style={styles.pdfHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pdfTitle} numberOfLines={1}>
              {contractId || "Dokumen"}
            </Text>
            <Text style={styles.pdfSubtitle}>
              Halaman {currentPage} / {totalPages || 0}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => loadPdf()}
            disabled={loadingPdf}
          >
            <Text style={styles.smallBtnText}>
              {loadingPdf ? "..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.pdfViewer, { height: pdfViewerHeight }]}>
          {loadingPdf ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Memuat dokumen...</Text>
            </View>
          ) : pdfUri ? (
            <Pdf
              key={`${pdfUri}-page-${currentPage}`}
              source={{ uri: pdfUri, cache: true }}
              style={[styles.pdfView, { width: pdfViewWidth, height: pdfViewerHeight }]}
              page={currentPage}
              spacing={0}
              fitPolicy={0}
              enablePaging={false}
              scrollEnabled={false}
              minScale={PDF_MIN_SCALE}
              maxScale={PDF_MAX_SCALE}
              enableDoubleTapZoom
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              onLoadComplete={(numberOfPages, path) => {
                void (async () => {
                  let est = 0;
                  if (numberOfPages <= 1) {
                    const filePath = path?.startsWith("file")
                      ? path
                      : pdfUri ?? "";
                    if (filePath) {
                      est = await estimatePdfPageCountFromFile(filePath);
                    }
                  }
                  const total = resolvePageCount(numberOfPages, est);
                  if (total > 0) {
                    setTotalPages((prev) =>
                      numberOfPages > 1 ? numberOfPages : Math.max(prev, total),
                    );
                  }
                })();
              }}
              onPageChanged={(_page, numberOfPages) => {
                if (numberOfPages > 1) {
                  setTotalPages(numberOfPages);
                }
              }}
              onError={(error) => {
                console.log(error);
                Alert.alert("Error", "Gagal membuka PDF");
              }}
            />
          ) : (
            <View style={styles.center}>
              <Text style={styles.loadingText}>PDF tidak tersedia</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 72 + bottomBarExtra + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {statusTtd === 1 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Kontrak sudah ditandatangani</Text>
            <Text style={styles.infoText}>
              Kamu bisa unduh dokumen ke folder Download kapan saja.
            </Text>
            <Text style={styles.infoMeta}>StatusTTD: {String(statusTtd)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Detail Kontrak</Text>
              <Text style={styles.infoText}>Jenis: {type || "-"}</Text>
              <Text style={styles.infoText}>Mulai: {start || "-"}</Text>
              <Text style={styles.infoText}>Berakhir: {end || "-"}</Text>
              <Text style={styles.infoMeta}>StatusTTD: {String(statusTtd)}</Text>
            </View>

            {!isOnLastPage && totalPages > 0 ? (
              <View style={styles.readHintCard}>
                <Text style={styles.readHintTitle}>Baca kontrak sampai selesai</Text>
                <Text style={styles.readHintText}>
                  Buka halaman terakhir ({totalPages}) untuk menandatangani. Jika
                  kembali ke halaman sebelumnya, tanda tangan tidak tersedia.
                </Text>
                <Text style={styles.readHintMeta}>
                  Saat ini: halaman {currentPage} dari {totalPages}
                </Text>
              </View>
            ) : null}

            {isOnLastPage ? (
              <TouchableOpacity
                style={[styles.checkRow, agreed && styles.checkRowActive]}
                onPress={() => setAgreed((v) => !v)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                  {agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <Text style={styles.checkLabel}>
                  Saya menyetujui seluruh isi kontrak kerja
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {signatureValue && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Tanda tangan berhasil</Text>

            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>Selesai</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 8) + 4 },
        ]}
      >
        <View style={styles.bottomActionCard}>
        {pdfUri && !loadingPdf ? (
          <View
            style={[
              styles.pageNav,
              !showBottomPrimary && styles.pageNavLast,
            ]}
          >
            <TouchableOpacity
              style={[styles.pageNavBtn, !canGoPrev && styles.pageNavBtnDisabled]}
              onPress={goToPrevPage}
              disabled={!canGoPrev}
              accessibilityRole="button"
              accessibilityLabel="Halaman sebelumnya"
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  !canGoPrev && styles.pageNavBtnTextDisabled,
                ]}
              >
                ← Sebelumnya
              </Text>
            </TouchableOpacity>

            <Text style={styles.pageNavIndicator}>
              {currentPage} / {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageNavBtn, !canGoNext && styles.pageNavBtnDisabled]}
              onPress={goToNextPage}
              disabled={!canGoNext}
              accessibilityRole="button"
              accessibilityLabel="Halaman berikutnya"
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  !canGoNext && styles.pageNavBtnTextDisabled,
                ]}
              >
                Berikutnya →
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isSigned ? (
          <TouchableOpacity
            style={[styles.primaryAction, downloading && styles.primaryActionDisabled]}
            onPress={handleDownloadPdf}
            disabled={downloading || !pdfUri}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>Unduh ke penyimpanan</Text>
            )}
          </TouchableOpacity>
        ) : isOnLastPage ? (
          <>
            <TouchableOpacity
              style={[styles.bottomAgreeRow, agreed && styles.bottomAgreeRowActive]}
              onPress={() => setAgreed((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <View style={[styles.bottomCheckbox, agreed && styles.checkboxActive]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.bottomAgreeLabel}>
                Saya menyetujui seluruh isi kontrak kerja
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                (!agreed || signing) && styles.primaryActionDisabled,
              ]}
              onPress={openSignatureSheet}
              disabled={signing}
            >
              {signing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryActionText}>✍️ Buka Tanda Tangan</Text>
                  {!agreed ? (
                    <Text style={styles.primaryActionHint}>
                      Centang persetujuan di atas untuk melanjutkan
                    </Text>
                  ) : null}
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}
        </View>
      </View>

      {showSign && !isSigned && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeSign}
        />
      )}

      {showSign && !isSigned && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Tanda Tangan</Text>

            <TouchableOpacity onPress={closeSign}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signatureWrapLarge}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleOK}
              autoClear={false}
              webStyle={webStyle}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleClear}
            >
              <Text>Hapus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!agreed || signing) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!agreed || signing}
            >
              {signing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "800" }}>Kirim</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  pdfCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pdfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    gap: 10,
  },
  pdfTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
  },
  pdfSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  smallBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  smallBtnText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  pdfViewer: {
    overflow: "hidden",
  },
  pdfView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  bottomActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pageNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 6,
  },
  pageNavLast: {
    marginBottom: 0,
  },
  pageNavBtn: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  pageNavBtnDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  pageNavBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  pageNavBtnTextDisabled: {
    color: "#94A3B8",
  },
  pageNavIndicator: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    minWidth: 48,
    textAlign: "center",
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },

  checkRowActive: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.light.primary,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },

  checkboxActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },

  checkmark: {
    color: "#fff",
  },

  checkLabel: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "600",
    flex: 1,
  },

  infoCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: Colors.light.text,
  },
  infoText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 4,
  },
  infoMeta: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "700",
  },

  readHintCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 12,
  },
  readHintTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 6,
  },
  readHintText: {
    fontSize: 12,
    color: "#78350F",
    lineHeight: 18,
    fontWeight: "600",
  },
  readHintMeta: {
    marginTop: 8,
    fontSize: 11,
    color: "#B45309",
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: "rgba(245,247,251,0.98)",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    elevation: 6,
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  primaryAction: {
    backgroundColor: Colors.light.primary,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  primaryActionHint: {
    marginTop: 2,
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomAgreeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  bottomAgreeRowActive: {
    backgroundColor: "#EFF6FF",
  },
  bottomCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  bottomAgreeLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "600",
  },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height * 0.5,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 12,
    shadowColor: "#0B1220",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sheetTitle: {
    fontWeight: "900",
    color: Colors.light.text,
  },

  closeBtn: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },

  signatureWrapLarge: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 12,
    alignItems: "center",
    borderRadius: 14,
    marginRight: 10,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    padding: 12,
    alignItems: "center",
    borderRadius: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },

  successCard: {
    marginTop: 20,
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
  },
  successTitle: {
    color: "#065F46",
    fontWeight: "900",
    marginBottom: 8,
  },

  doneButton: {
    marginTop: 10,
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
