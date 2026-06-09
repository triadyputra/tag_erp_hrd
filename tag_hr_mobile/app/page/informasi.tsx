import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import {
  formatBeritaDate,
  getListBerita,
  resolveBeritaImageUrl,
  type BeritaItem,
} from "@/services/berita.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";

export default function InformasiPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const idParam = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    return raw?.trim() ? raw.trim() : undefined;
  }, [id]);

  const { width } = useWindowDimensions();
  const htmlContentWidth = Math.max(0, width - 72);

  const [list, setList] = useState<BeritaItem[]>([]);
  const [loading, setLoading] = useState(!idParam);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailItem, setDetailItem] = useState<BeritaItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(!!idParam);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  const loadList = useCallback(async () => {
    const res = await getListBerita();
    setList(res.Data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (idParam) return;
      let cancelled = false;
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          await loadList();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Gagal memuat berita";
          if (!cancelled) setError(msg);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [idParam, loadList]),
  );

  useEffect(() => {
    if (!idParam) {
      setDetailItem(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      setLoadingImage(true);
      try {
        const targetId = Number(idParam);
        const res = await getListBerita();
        const found = res.Data.find((x) => x.Id === targetId);
        if (!cancelled) {
          if (found) setDetailItem(found);
          else setDetailError("Berita tidak ditemukan");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal memuat berita";
        if (!cancelled) setDetailError(msg);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idParam]);

  useEffect(() => {
    if (!detailItem || !resolveBeritaImageUrl(detailItem.Gambar)) {
      setLoadingImage(false);
    }
  }, [detailItem]);

  const onRefreshList = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      await loadList();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal memuat berita";
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  }, [loadList]);

  if (!idParam) {
    return (
      <View style={styles.container}>
        <AppHeader title="Informasi" />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLoading(true);
                setError(null);
                loadList()
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : "Gagal memuat berita"),
                  )
                  .finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryBtnText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.Id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefreshList}
                tintColor="#2563EB"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Belum ada berita.</Text>
            }
            renderItem={({ item }) => {
              const uri = resolveBeritaImageUrl(item.Gambar);
              return (
                <TouchableOpacity
                  style={styles.rowCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/page/informasi",
                      params: { id: String(item.Id) },
                    })
                  }
                >
                  <View style={styles.rowThumb}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.rowThumbImg} />
                    ) : (
                      <View style={styles.rowThumbPlaceholder}>
                        <Ionicons
                          name="newspaper-outline"
                          size={28}
                          color="#94A3B8"
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.Judul}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {formatBeritaDate(item.CreatedAt)}
                      {item.IsPinned ? " · Disematkan" : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  if (detailLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Informasi" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  if (detailError || !detailItem) {
    return (
      <View style={styles.container}>
        <AppHeader title="Informasi" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {detailError || "Berita tidak ditemukan"}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.retryBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const item = detailItem;
  const imageUri = resolveBeritaImageUrl(item.Gambar);

  return (
    <View style={styles.container}>
      <AppHeader title="Informasi" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrapper}>
          {loadingImage && imageUri ? (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : null}

          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              onLoadEnd={() => setLoadingImage(false)}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.IsPinned ? "Disematkan" : "Berita"}
          </Text>
        </View>

        <Text style={styles.title}>{item.Judul}</Text>

        <View style={styles.dateRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.date}>{formatBeritaDate(item.CreatedAt)}</Text>
        </View>

        <View style={styles.bodyCard}>
          <RenderHTML
            contentWidth={htmlContentWidth}
            source={{ html: item.Isi || "<p></p>" }}
            baseStyle={styles.htmlBase}
            tagsStyles={{
              body: {
                color: Colors.light.text,
              },
              p: {
                marginTop: 8,
                marginBottom: 8,
                lineHeight: 22,
              },
              h2: {
                fontSize: 18,
                fontWeight: "700",
                marginTop: 12,
                marginBottom: 8,
                color: Colors.light.text,
              },
              strong: {
                fontWeight: "700",
              },
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },

  retryBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  listContent: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },

  emptyText: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginTop: 40,
    fontSize: 14,
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  rowThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  rowThumbImg: {
    width: "100%",
    height: "100%",
  },

  rowThumbPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  rowBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },

  rowMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },

  content: {
    padding: 20,
  },

  imageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#E5E7EB",
  },

  imageLoader: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    color: Colors.light.text,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  date: {
    fontSize: 12,
    marginLeft: 6,
    color: Colors.light.textSecondary,
  },

  bodyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  htmlBase: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },
});
