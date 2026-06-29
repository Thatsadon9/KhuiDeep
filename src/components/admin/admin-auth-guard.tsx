"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseAuthClient, verifyAdminAccess } from "@/lib/supabase-auth";

type AdminAuthGuardProps = {
  children: React.ReactNode;
};

type AuthStatus = "loading" | "authorized" | "redirecting";

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");

  const resolveAccess = useCallback(
    async (session: Session | null, cancelled: () => boolean) => {
      if (cancelled()) {
        return;
      }

      if (!session) {
        setStatus("redirecting");
        router.replace("/admin/login");
        return;
      }

      const isAdmin = await verifyAdminAccess(session.user.id);
      if (cancelled()) {
        return;
      }

      if (!isAdmin) {
        setStatus("redirecting");
        router.replace("/admin/login?error=forbidden");
        window.setTimeout(() => {
          void getSupabaseAuthClient()?.auth.signOut();
        }, 0);
        return;
      }

      setStatus("authorized");
    },
    [router],
  );

  useEffect(() => {
    const client = getSupabaseAuthClient();

    if (!client) {
      router.replace("/admin/login?error=supabase");
      return;
    }

    const supabase = client;
    let active = true;

    const cancelled = () => !active;

    async function checkSession() {
      setStatus("loading");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await resolveAccess(session, cancelled);
    }

    void checkSession();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void checkSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "SIGNED_OUT") {
        setStatus("redirecting");
        router.replace("/admin/login");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void resolveAccess(session, cancelled);
      }
    });

    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
      subscription.unsubscribe();
    };
  }, [resolveAccess, router]);

  if (status !== "authorized") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="sketchy-panel flex flex-col items-center gap-4 border-2 border-ink-800 bg-white/70 p-8">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-800 border-t-transparent" />
          <p className="font-hand text-xl font-bold text-ink-900">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
