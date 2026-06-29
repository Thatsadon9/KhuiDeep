import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { KhuiDeepAdmin } from "@/components/admin/khui-deep-admin";

export const metadata = {
  title: "ผู้ดูแลระบบ - KhuiDeep คุยดีพ",
  description: "พื้นที่จัดการหมวดหมู่และการ์ดคำถามสำหรับแอปพลิเคชัน KhuiDeep",
};

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <KhuiDeepAdmin />
    </AdminAuthGuard>
  );
}
