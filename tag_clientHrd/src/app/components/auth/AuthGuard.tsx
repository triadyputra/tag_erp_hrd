// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe } from "@/services/auth.service";
import { clearAuth, setAuthMenu } from "@/helpers/auth.helper";

const publicPaths = ["/auth"];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const fetchedRef = useRef(false); // 🔥 cegah double hit (StrictMode)

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    // ❌ belum login → ke login
    if (!token && !isPublic) {
      router.replace(`/auth/auth1/login?next=${pathname}`);
      return;
    }

    // ✅ sudah login → tidak boleh ke halaman auth
    if (token && isPublic) {
      router.replace("/");
      return;
    }

    // 🔥 SAAT RELOAD → HIT /Auth/me SEKALI
    if (token && !fetchedRef.current) {
      fetchedRef.current = true;

      getMe()
        .then((me) => {
          localStorage.setItem("auth_user", JSON.stringify(me.user));
          localStorage.setItem("auth_access", JSON.stringify(me.acces));
          setAuthMenu(me.Menu ?? []);
        })
        .catch(() => {
          // ❌ token invalid / expired
          clearAuth();
          router.replace("/auth/auth1/login");
        });
    }
  }, [pathname, router]);

  return <>{children}</>;
}
