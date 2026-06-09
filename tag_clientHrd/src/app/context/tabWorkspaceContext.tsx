"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  HOME_HREF,
  isPinnedTab,
  isWorkspaceRoute,
  MAX_TABS,
  normalizeHref,
  STORAGE_KEY,
  titleFromHref,
} from "@/app/(DashboardLayout)/workspace/routeRegistry";

function createHomeTab(): WorkspaceTab {
  return {
    id: HOME_HREF,
    href: HOME_HREF,
    title: titleFromHref(HOME_HREF),
  };
}

function ensurePinnedTabs(tabs: WorkspaceTab[]): WorkspaceTab[] {
  if (!tabs.some((t) => t.href === HOME_HREF)) {
    return [createHomeTab(), ...tabs];
  }
  const home = tabs.find((t) => t.href === HOME_HREF)!;
  const rest = tabs.filter((t) => t.href !== HOME_HREF);
  return [home, ...rest];
}

function trimTabs(tabs: WorkspaceTab[]): WorkspaceTab[] {
  const withPinned = ensurePinnedTabs(tabs);
  if (withPinned.length <= MAX_TABS) return withPinned;
  const pinned = withPinned.filter((t) => isPinnedTab(t.href));
  const unpinned = withPinned.filter((t) => !isPinnedTab(t.href));
  const room = Math.max(0, MAX_TABS - pinned.length);
  return [...pinned, ...unpinned.slice(-room)];
}

export interface WorkspaceTab {
  id: string;
  href: string;
  title: string;
  iconKey?: string;
}

interface StoredWorkspace {
  tabs: WorkspaceTab[];
  activeHref: string | null;
}

interface TabWorkspaceContextValue {
  tabs: WorkspaceTab[];
  activeHref: string | null;
  hydrated: boolean;
  openTab: (href: string, title?: string, iconKey?: string) => void;
  closeTab: (href: string) => void;
  closeOtherTabs: (href: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (href: string) => void;
  /** Path untuk highlight menu sidebar */
  pathDirect: string;
}

const TabWorkspaceContext = createContext<TabWorkspaceContextValue | null>(
  null
);

function readStorage(): StoredWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWorkspace;
    const tabs = (parsed.tabs ?? [])
      .filter((t) => isWorkspaceRoute(t.href))
      .map((t) => ({
        ...t,
        id: normalizeHref(t.href),
        href: normalizeHref(t.href),
      }));
    const activeHref =
      parsed.activeHref && isWorkspaceRoute(parsed.activeHref)
        ? normalizeHref(parsed.activeHref)
        : tabs[0]?.href ?? null;
    return { tabs, activeHref };
  } catch {
    return null;
  }
}

function writeStorage(tabs: WorkspaceTab[], activeHref: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tabs, activeHref } satisfies StoredWorkspace)
    );
  } catch {
    /* ignore quota errors */
  }
}

function syncUrl(href: string, replace = false) {
  if (typeof window === "undefined") return;
  const url = href + window.location.search + window.location.hash;
  if (replace) {
    window.history.replaceState({ workspace: true }, "", url);
  } else {
    window.history.pushState({ workspace: true }, "", url);
  }
}

export function TabWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeHref, setActiveHrefState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipPopRef = useRef(false);

  const setActiveTab = useCallback((href: string) => {
    const normalized = normalizeHref(href);
    if (!isWorkspaceRoute(normalized)) return;
    setActiveHrefState(normalized);
    setTabs((prev) => {
      writeStorage(prev, normalized);
      return prev;
    });
    skipPopRef.current = true;
    syncUrl(normalized, true);
  }, []);

  const openTab = useCallback(
    (href: string, title?: string, iconKey?: string) => {
      const normalized = normalizeHref(href);
      if (!isWorkspaceRoute(normalized)) return;

      const label = title?.trim() || titleFromHref(normalized);

      setTabs((prev) => {
        const existing = prev.find((t) => t.href === normalized);
        let nextTabs = prev;
        if (!existing) {
          nextTabs = [
            ...prev,
            {
              id: normalized,
              href: normalized,
              title: label,
              iconKey: iconKey || undefined,
            },
          ];
          nextTabs = trimTabs(nextTabs);
        } else if (iconKey && !existing.iconKey) {
          nextTabs = prev.map((t) =>
            t.href === normalized ? { ...t, iconKey } : t
          );
        }
        setActiveHrefState(normalized);
        writeStorage(nextTabs, normalized);
        skipPopRef.current = true;
        syncUrl(normalized, prev.length === 0);
        return nextTabs;
      });
    },
    []
  );

  const closeAllTabs = useCallback(() => {
    const homeOnly = [createHomeTab()];
    setTabs(homeOnly);
    setActiveHrefState(HOME_HREF);
    writeStorage(homeOnly, HOME_HREF);
    skipPopRef.current = true;
    syncUrl(HOME_HREF, true);
  }, []);

  const closeOtherTabs = useCallback((href: string) => {
    const normalized = normalizeHref(href);
    setTabs((prev) => {
      const keep = prev.find((t) => t.href === normalized);
      if (!keep) return prev;
      const pinned = prev.filter((t) => isPinnedTab(t.href));
      const nextTabs = ensurePinnedTabs([
        ...pinned.filter((t) => t.href !== normalized),
        keep,
      ]);
      setActiveHrefState(normalized);
      writeStorage(nextTabs, normalized);
      skipPopRef.current = true;
      syncUrl(normalized, true);
      return nextTabs;
    });
  }, []);

  const closeTab = useCallback((href: string) => {
    const normalized = normalizeHref(href);
    if (isPinnedTab(normalized)) return;

    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.href === normalized);
      if (idx === -1) return prev;

      const nextTabs = ensurePinnedTabs(
        prev.filter((t) => t.href !== normalized)
      );

      setActiveHrefState((currentActive) => {
        const nextActive =
          currentActive === normalized
            ? (nextTabs[idx]?.href ??
                nextTabs[idx - 1]?.href ??
                HOME_HREF)
            : currentActive;
        writeStorage(nextTabs, nextActive);
        skipPopRef.current = true;
        if (currentActive === normalized) {
          syncUrl(nextActive ?? HOME_HREF, true);
        }
        return nextActive;
      });

      return nextTabs;
    });
  }, []);

  useEffect(() => {
    const stored = readStorage();
    const current = normalizeHref(pathname);
    let initialTabs = ensurePinnedTabs(stored?.tabs ?? []);
    let initialActive = stored?.activeHref ?? null;

    if (isWorkspaceRoute(current)) {
      const exists = initialTabs.some((t) => t.href === current);
      if (!exists) {
        initialTabs = [
          ...initialTabs,
          {
            id: current,
            href: current,
            title: titleFromHref(current),
          },
        ];
      }
      if (!initialActive || !initialTabs.some((t) => t.href === initialActive)) {
        initialActive = current;
      }
      skipPopRef.current = true;
      syncUrl(initialActive ?? current, true);
    }

    setTabs(initialTabs);
    setActiveHrefState(initialActive);
    writeStorage(initialTabs, initialActive);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  /** Sinkronkan tab saat navigasi Next.js (Link menu, dll.) */
  useEffect(() => {
    if (!hydrated) return;

    const current = normalizeHref(pathname);
    if (!isWorkspaceRoute(current)) return;

    if (skipPopRef.current) {
      skipPopRef.current = false;
      return;
    }

    setTabs((prev) => {
      const exists = prev.some((t) => t.href === current);
      let nextTabs = prev;
      if (!exists) {
        nextTabs = [
          ...prev,
          {
            id: current,
            href: current,
            title: titleFromHref(current),
          },
        ];
        nextTabs = trimTabs(nextTabs);
      }
      setActiveHrefState(current);
      writeStorage(nextTabs, current);
      return nextTabs;
    });
  }, [pathname, hydrated]);

  useEffect(() => {
    const onPopState = () => {
      if (skipPopRef.current) {
        skipPopRef.current = false;
        return;
      }
      const current = normalizeHref(window.location.pathname);
      if (!isWorkspaceRoute(current)) return;

      setTabs((prev) => {
        const exists = prev.some((t) => t.href === current);
        let nextTabs = prev;
        if (!exists) {
          nextTabs = [
            ...prev,
            {
              id: current,
              href: current,
              title: titleFromHref(current),
            },
          ];
          nextTabs = trimTabs(nextTabs);
        }
        setActiveHrefState(current);
        writeStorage(nextTabs, current);
        return nextTabs;
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const pathDirect = useMemo(() => {
    if (tabs.length > 0 && activeHref) return activeHref;
    return pathname;
  }, [tabs.length, activeHref, pathname]);

  const value = useMemo(
    () => ({
      tabs,
      activeHref,
      hydrated,
      openTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setActiveTab,
      pathDirect,
    }),
    [
      tabs,
      activeHref,
      hydrated,
      openTab,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      setActiveTab,
      pathDirect,
    ]
  );

  return (
    <TabWorkspaceContext.Provider value={value}>
      {children}
    </TabWorkspaceContext.Provider>
  );
}

export function useTabWorkspace() {
  const ctx = useContext(TabWorkspaceContext);
  if (!ctx) {
    throw new Error("useTabWorkspace must be used within TabWorkspaceProvider");
  }
  return ctx;
}

export function useTabWorkspaceOptional() {
  return useContext(TabWorkspaceContext);
}
