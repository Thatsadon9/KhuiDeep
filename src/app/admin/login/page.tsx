import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "เข้าสู่ระบบผู้ดูแล - KhuiDeep คุยดีพ",
  description: "หน้าเข้าสู่ระบบสำหรับผู้ดูแลระบบ KhuiDeep",
};

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-800 border-t-transparent" />
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
