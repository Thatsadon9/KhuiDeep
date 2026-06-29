"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseAuthClient, verifyAdminAccess } from "@/lib/supabase-auth";

const errorMessages: Record<string, string> = {
  forbidden: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล กรุณาติดต่อผู้ดูแลระบบ",
  supabase: "การตั้งค่า Supabase ไม่สมบูรณ์ กรุณาตรวจสอบ Environment Variables",
  invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
};

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const queryError = searchParams.get("error");
  const initialError = useMemo(() => {
    if (!queryError) {
      return null;
    }

    return errorMessages[queryError] ?? "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง";
  }, [queryError]);

  useEffect(() => {
    const supabase = getSupabaseAuthClient();

    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    const client = supabase;
    let mounted = true;

    async function checkExistingSession() {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!mounted || !session) {
        setCheckingSession(false);
        return;
      }

      const isAdmin = await verifyAdminAccess(session.user.id);
      if (!mounted) {
        return;
      }

      if (isAdmin) {
        router.replace("/admin");
        return;
      }

      await client.auth.signOut();
      setCheckingSession(false);
    }

    void checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      setFormError(errorMessages.supabase);
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      setSubmitting(false);
      setFormError(errorMessages.invalid);
      return;
    }

    const isAdmin = await verifyAdminAccess(data.session.user.id);
    if (!isAdmin) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setFormError(errorMessages.forbidden);
      return;
    }

    router.replace("/admin");
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-800 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-paper px-4 py-8 text-ink-900 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute -left-20 top-36 h-40 w-40 rotate-12 rounded-[45%_55%_48%_52%] border border-dashed border-ink-800/10 bg-doodle-sky/15" />
      <div className="pointer-events-none absolute bottom-12 right-6 h-28 w-28 rotate-[-8deg] rounded-[52%_48%_50%_50%] border border-dashed border-ink-800/10 bg-doodle-mint/20" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Link
            href="/"
            className="btn-doodle group mb-6 inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <div className="sketchy-panel border-2 border-ink-800 bg-white/80 p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex rotate-[-1deg] items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lemon px-4 py-1.5 font-hand text-lg font-bold shadow-sketch-soft">
                <LockKeyhole className="h-5 w-5" />
                <span>ผู้ดูแลระบบ</span>
              </div>
              <h1 className="font-hand text-3xl font-bold text-ink-900">เข้าสู่ระบบ Admin</h1>
              <p className="mt-2 text-sm font-semibold text-ink-600">
                สำหรับผู้ดูแลที่ได้รับอนุญาตเท่านั้น
              </p>
            </div>

            {(initialError || formError) && (
              <div className="mb-5 rounded-note border-2 border-red-500 bg-red-50 px-4 py-3 font-hand text-base font-bold text-red-600">
                {formError ?? initialError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 font-hand text-lg font-bold text-ink-900">
                  <Mail className="h-4 w-4" />
                  อีเมล
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-4 py-3 font-hand text-lg placeholder-ink-700/40 focus:outline-none"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 font-hand text-lg font-bold text-ink-900">
                  <LockKeyhole className="h-4 w-4" />
                  รหัสผ่าน
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-4 py-3 pr-12 font-hand text-lg placeholder-ink-700/40 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-600 hover:text-ink-900"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="btn-doodle mt-2 flex w-full items-center justify-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-mint px-5 py-3 font-hand text-xl font-bold shadow-sketch disabled:cursor-not-allowed disabled:opacity-60"
                style={{ "--btn-hover-rotate": "-2deg" } as React.CSSProperties}
              >
                <LogIn className="h-5 w-5" />
                <span>{submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
