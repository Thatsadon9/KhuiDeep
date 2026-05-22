"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Save,
  Settings,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  AlertCircle
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type DbCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent: string;
  sort_order: number;
  is_active: boolean;
};

type DbQuestion = {
  id: string;
  category_id: string;
  question: string;
  helper_text: string | null;
  level: number;
  tags: string[] | null;
  is_active: boolean;
};

const colorPresets = [
  { name: "Peach (พีช)", value: "#ffd5bd" },
  { name: "Mint (มิ้นต์)", value: "#ccebd9" },
  { name: "Lemon (เลมอน)", value: "#f7e7a7" },
  { name: "Rose (กุหลาบ)", value: "#f3b8c6" },
  { name: "Sky (ท้องฟ้า)", value: "#b9d9f2" },
  { name: "Lilac (ไลแลค)", value: "#d9c9ef" }
];

export function KhuiDeepAdmin() {
  const [activeTab, setActiveTab] = useState<"categories" | "questions">("categories");
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Success/Error Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Category Form State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    slug: "",
    name: "",
    description: "",
    accent: "#ffd5bd",
    sort_order: 1,
    is_active: true
  });

  // Question Form State
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    category_id: "",
    question: "",
    helper_text: "",
    level: 1,
    tagsString: "",
    is_active: true
  });

  // JSON Import State
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonImportCategory, setJsonImportCategory] = useState("");

  const jsonValidation = useMemo(() => {
    if (!jsonInput.trim()) return { valid: null, count: 0, message: "" };
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return { valid: true, count: items.length, message: `รูปแบบ JSON ถูกต้อง (ตรวจพบ ${items.length} คำถาม)` };
    } catch (err) {
      // Clean up the error message slightly for user friendliness
      const errMsg = (err as Error).message;
      return { valid: false, count: 0, message: `รูปแบบ JSON ไม่ถูกต้อง: ${errMsg}` };
    }
  }, [jsonInput]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Deletion double-check states (stores item ID)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();

    if (!supabase) {
      setError("ไม่พบการเชื่อมต่อ Supabase กรุณาตรวจสอบ Environment Variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)");
      setLoading(false);
      return;
    }

    try {
      const [catResult, qResult] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("questions").select("*").order("created_at", { ascending: false })
      ]);

      if (catResult.error) throw catResult.error;
      if (qResult.error) throw qResult.error;

      setCategories(catResult.data || []);
      setQuestions(qResult.data || []);

      // Auto select first category in question form if empty
      if (catResult.data && catResult.data.length > 0) {
        setQuestionForm((prev) => ({
          ...prev,
          category_id: prev.category_id || catResult.data[0].id
        }));
        setJsonImportCategory((prev) => prev || catResult.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError((err as Error).message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helpers to convert Name to Slug
  const handleNameChangeForSlug = (nameValue: string, isCategory: boolean) => {
    if (isCategory) {
      setCategoryForm((prev) => {
        // Simple regex slugify for English names or keep as is, but lowercase and remove spaces
        const slugified = nameValue
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s-]+/g, "-");
        return {
          ...prev,
          name: nameValue,
          slug: prev.slug ? prev.slug : slugified // only auto-fill if slug is empty
        };
      });
    }
  };

  // CRUD Operations: Categories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Validate Slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(categoryForm.slug)) {
      showToast("Slug ต้องเป็นภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง (-) เท่านั้น เช่น my-category", "error");
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            slug: categoryForm.slug,
            name: categoryForm.name,
            description: categoryForm.description || null,
            accent: categoryForm.accent,
            sort_order: Number(categoryForm.sort_order),
            is_active: categoryForm.is_active
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        showToast("แก้ไขหมวดหมู่สำเร็จแล้ว! (ข้อมูลหน้าเล่นจะอัปเดตแคชภายใน 5 นาที)", "success");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([
            {
              slug: categoryForm.slug,
              name: categoryForm.name,
              description: categoryForm.description || null,
              accent: categoryForm.accent,
              sort_order: Number(categoryForm.sort_order),
              is_active: categoryForm.is_active
            }
          ]);

        if (error) throw error;
        showToast("เพิ่มหมวดหมู่ใหม่สำเร็จแล้ว!", "success");
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({
        slug: "",
        name: "",
        description: "",
        accent: "#ffd5bd",
        sort_order: categories.length + 1,
        is_active: true
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  const handleEditCategory = (cat: DbCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      slug: cat.slug,
      name: cat.name,
      description: cat.description || "",
      accent: cat.accent,
      sort_order: cat.sort_order,
      is_active: cat.is_active
    });
    setShowCategoryForm(true);
    setConfirmDeleteId(null);
  };

  const handleDeleteCategory = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;

      showToast("ลบหมวดหมู่เรียบร้อยแล้ว!", "success");
      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "ไม่สามารถลบได้ มีคำถามที่เชื่อมโยงกับหมวดหมู่นี้อยู่", "error");
    }
  };

  // CRUD Operations: Questions
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (!questionForm.question.trim()) {
      showToast("กรุณากรอกคำถามหลัก", "error");
      return;
    }

    if (!questionForm.category_id) {
      showToast("กรุณาเลือกหมวดหมู่คำถาม", "error");
      return;
    }

    // Parse comma-separated tags into array
    const tagsArray = questionForm.tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from("questions")
          .update({
            category_id: questionForm.category_id,
            question: questionForm.question.trim(),
            helper_text: questionForm.helper_text.trim() || null,
            level: Number(questionForm.level),
            tags: tagsArray,
            is_active: questionForm.is_active
          })
          .eq("id", editingQuestion.id);

        if (error) throw error;
        showToast("แก้ไขคำถามสำเร็จแล้ว! (ข้อมูลหน้าเล่นจะอัปเดตแคชภายใน 5 นาที)", "success");
      } else {
        const { error } = await supabase
          .from("questions")
          .insert([
            {
              category_id: questionForm.category_id,
              question: questionForm.question.trim(),
              helper_text: questionForm.helper_text.trim() || null,
              level: Number(questionForm.level),
              tags: tagsArray,
              is_active: questionForm.is_active
            }
          ]);

        if (error) throw error;
        showToast("เพิ่มคำถามใหม่สำเร็จแล้ว!", "success");
      }

      setShowQuestionForm(false);
      setEditingQuestion(null);
      setQuestionForm((prev) => ({
        category_id: prev.category_id, // keep last selected category for faster entry
        question: "",
        helper_text: "",
        level: 1,
        tagsString: "",
        is_active: true
      }));
      fetchData();
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  const handleEditQuestion = (q: DbQuestion) => {
    setEditingQuestion(q);
    setQuestionForm({
      category_id: q.category_id,
      question: q.question,
      helper_text: q.helper_text || "",
      level: q.level,
      tagsString: (q.tags || []).join(", "),
      is_active: q.is_active
    });
    setShowQuestionForm(true);
    setConfirmDeleteId(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;

      showToast("ลบคำถามเรียบร้อยแล้ว!", "success");
      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "เกิดข้อผิดพลาดในการลบคำถาม", "error");
    }
  };

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (!jsonInput.trim()) {
      showToast("กรุณากรอกข้อมูล JSON", "error");
      return;
    }

    if (!jsonImportCategory) {
      showToast("กรุณาเลือกหมวดหมู่ปลายทาง", "error");
      return;
    }

    try {
      interface ImportItem {
        question?: string;
        helper_text?: string;
        level?: number;
        tags?: string | string[];
        is_active?: boolean;
      }

      const parsed = JSON.parse(jsonInput);
      const items = (Array.isArray(parsed) ? parsed : [parsed]) as ImportItem[];

      if (items.length === 0) {
        showToast("ไม่พบชุดคำถามใน JSON", "error");
        return;
      }

      const questionsToInsert = items.map((item, idx: number) => {
        if (!item.question || typeof item.question !== "string" || !item.question.trim()) {
          throw new Error(`คำถามลำดับที่ ${idx + 1} ไม่มีข้อความคำถามหลัก (question)`);
        }

        let level = Number(item.level);
        if (isNaN(level) || level < 1 || level > 5) {
          level = 1;
        }

        let tags: string[] = [];
        if (Array.isArray(item.tags)) {
          tags = item.tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof item.tags === "string") {
          tags = item.tags.split(",").map((t) => t.trim()).filter(Boolean);
        }

        return {
          category_id: jsonImportCategory,
          question: item.question.trim(),
          helper_text: item.helper_text ? String(item.helper_text).trim() : null,
          level,
          tags,
          is_active: item.is_active !== false
        };
      });

      const { data, error } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();

      if (error) throw error;

      showToast(`นำเข้าคำถามสำเร็จแล้ว ${data?.length || questionsToInsert.length} ใบ!`, "success");
      setJsonInput("");
      setShowJsonImport(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || "รูปแบบ JSON ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  // Filtered Questions list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.helper_text && q.helper_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory = categoryFilter === "all" || q.category_id === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [questions, searchQuery, categoryFilter]);

  // Map category ID to Category Name
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Motion variants for entrance wiggles
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 220, damping: 14 }
    }
  };

  return (
    <main className="relative min-h-screen px-4 py-8 text-ink-900 sm:px-6 lg:px-8 bg-paper">
      {/* Decorative lines */}
      <div className="pointer-events-none absolute -left-20 top-36 h-40 w-40 rotate-12 rounded-[45%_55%_48%_52%] border border-dashed border-ink-800/10 bg-doodle-sky/15" />
      <div className="pointer-events-none absolute bottom-12 right-6 h-28 w-28 rotate-[-8deg] rounded-[52%_48%_50%_50%] border border-dashed border-ink-800/10 bg-doodle-mint/20" />

      {/* Floating Success/Error Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
            className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-note border-2 border-ink-800 px-6 py-3.5 font-hand text-lg font-bold shadow-sketch ${
              toast.type === "success" ? "bg-doodle-mint text-ink-900" : "bg-doodle-peach text-ink-900"
            }`}
          >
            {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:scale-110 font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mx-auto max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Navigation Bar */}
        <motion.nav
          variants={itemVariants}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href="/"
            className="btn-doodle group inline-flex items-center gap-2 rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <div className="inline-flex rotate-[-1deg] items-center gap-2 rounded-full border-2 border-ink-800 bg-doodle-lemon px-4 py-1.5 font-hand text-lg font-bold shadow-sketch-soft">
            <Settings className="h-5 w-5 animate-spin-slow text-ink-900" />
            <span>ระบบจัดการคำถาม (Admin Panel)</span>
          </div>
        </motion.nav>

        {/* Tab Selection */}
        <motion.div variants={itemVariants} className="mb-6 flex gap-4 border-b border-dashed border-ink-800/20 pb-4">
          <button
            onClick={() => {
              setActiveTab("categories");
              setConfirmDeleteId(null);
            }}
            className={`btn-doodle flex items-center gap-2 rounded-note border-2 border-ink-800 px-5 py-2.5 font-hand text-xl font-bold shadow-sketch-soft ${
              activeTab === "categories" ? "bg-[#ffd5bd] scale-105" : "bg-white"
            }`}
            style={{ "--btn-hover-rotate": "-1deg" } as React.CSSProperties}
          >
            <Layers className="h-5 w-5" />
            <span>หมวดหมู่ทั้งหมด ({categories.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("questions");
              setConfirmDeleteId(null);
            }}
            className={`btn-doodle flex items-center gap-2 rounded-note border-2 border-ink-800 px-5 py-2.5 font-hand text-xl font-bold shadow-sketch-soft ${
              activeTab === "questions" ? "bg-[#b9d9f2] scale-105" : "bg-white"
            }`}
            style={{ "--btn-hover-rotate": "1deg" } as React.CSSProperties}
          >
            <HelpCircle className="h-5 w-5" />
            <span>คำถามทั้งหมด ({questions.length})</span>
          </button>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full border-4 border-ink-800 border-t-transparent animate-spin" />
            <p className="mt-4 font-hand text-xl font-bold text-ink-700">กำลังเชื่อมต่อและโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <motion.div
            variants={itemVariants}
            className="sketchy-panel bg-doodle-peach/30 p-6 text-center border-2 border-ink-800"
          >
            <AlertCircle className="mx-auto h-12 w-12 text-ink-900" />
            <h3 className="mt-4 font-hand text-2xl font-bold">ไม่สามารถดึงข้อมูลได้</h3>
            <p className="mt-2 text-ink-800">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 btn-doodle rounded-note border-2 border-ink-800 bg-white px-4 py-2 font-hand text-lg font-bold shadow-sketch"
            >
              ลองอีกครั้ง
            </button>
          </motion.div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TABS: CATEGORIES */}
            {/* ========================================================================= */}
            {activeTab === "categories" && (
              <motion.div key="categories-tab" variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-hand text-3xl font-bold text-ink-900">จัดการหมวดหมู่คำถาม 📂</h2>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        slug: "",
                        name: "",
                        description: "",
                        accent: "#ffd5bd",
                        sort_order: categories.length + 1,
                        is_active: true
                      });
                      setShowCategoryForm(true);
                      setConfirmDeleteId(null);
                    }}
                    className="btn-doodle flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-lemon px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
                    style={{ "--btn-hover-rotate": "1.2deg" } as React.CSSProperties}
                  >
                    <Plus className="h-5 w-5" />
                    <span>เพิ่มหมวดหมู่ใหม่</span>
                  </button>
                </div>

                {/* Form Category (Draw Overlay Panel) */}
                <AnimatePresence>
                  {showCategoryForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="sketchy-panel bg-white p-6 border-2 border-ink-800"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-hand text-2xl font-bold text-ink-900">
                          {editingCategory ? `แก้ไขหมวดหมู่: ${editingCategory.name}` : "เพิ่มหมวดหมู่ใหม่ 📂"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowCategoryForm(false);
                            setEditingCategory(null);
                          }}
                          className="text-ink-500 hover:text-ink-900 font-bold text-lg"
                        >
                          ✕ ยกเลิก
                        </button>
                      </div>

                      <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">ชื่อหมวดหมู่ (Name)</label>
                            <input
                              type="text"
                              required
                              value={categoryForm.name}
                              onChange={(e) => {
                                setCategoryForm({ ...categoryForm, name: e.target.value });
                                handleNameChangeForSlug(e.target.value, true);
                              }}
                              placeholder="เช่น พัฒนาความรู้สึก, รักแรกพบ"
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">สลักลิงก์ (Slug - ภาษาอังกฤษ/พิมพ์เล็ก/ขีดกลางเท่านั้น)</label>
                            <input
                              type="text"
                              required
                              value={categoryForm.slug}
                              onChange={(e) => {
                                // Force lowercase, strip spaces and invalid characters
                                const formatted = e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, "");
                                setCategoryForm({ ...categoryForm, slug: formatted });
                              }}
                              placeholder="เช่น connection-boost, deep-love"
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-hand text-lg font-bold text-ink-800 mb-1">คำอธิบายหมวดหมู่ (Description)</label>
                          <textarea
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            placeholder="คำอธิบายที่ช่วยบอกผู้เล่นว่าการ์ดกองนี้เหมาะสำหรับการสนทนาเรื่องอะไร..."
                            rows={2}
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          {/* Accent Color Preset Picker */}
                          <div className="sm:col-span-2">
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">สีประจำหมวดหมู่ (Accent Color)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {colorPresets.map((preset) => (
                                <button
                                  type="button"
                                  key={preset.value}
                                  onClick={() => setCategoryForm({ ...categoryForm, accent: preset.value })}
                                  className={`h-8 w-8 rounded-full border-2 border-ink-800 shadow-sketch-soft transition-transform ${
                                    categoryForm.accent.toLowerCase() === preset.value.toLowerCase() ? "scale-125 ring-2 ring-ink-800" : "hover:scale-110"
                                  }`}
                                  style={{ backgroundColor: preset.value }}
                                  title={preset.name}
                                />
                              ))}
                            </div>
                            <input
                              type="text"
                              required
                              value={categoryForm.accent}
                              onChange={(e) => setCategoryForm({ ...categoryForm, accent: e.target.value })}
                              placeholder="#hex เช่น #ffeedd"
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-1 font-hand text-sm focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">การเรียงลำดับ (Sort Order)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={categoryForm.sort_order}
                              onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Toggle active state */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="cat_is_active"
                            checked={categoryForm.is_active}
                            onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                            className="h-5 w-5 rounded border-2 border-ink-800 text-ink-900 focus:ring-0"
                          />
                          <label htmlFor="cat_is_active" className="font-hand text-lg font-bold text-ink-900 cursor-pointer select-none">
                            เปิดใช้งานหมวดหมู่นี้ในหน้าหลักและหน้าเล่น
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCategoryForm(false);
                              setEditingCategory(null);
                            }}
                            className="rounded-note border-2 border-ink-800 bg-white px-5 py-2 font-hand text-lg font-bold shadow-sketch"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="submit"
                            className="btn-doodle rounded-note border-2 border-ink-800 bg-doodle-mint px-5 py-2 font-hand text-lg font-bold shadow-sketch text-ink-900"
                          >
                            <Save className="inline-block h-5 w-5 mr-1" />
                            <span>บันทึกหมวดหมู่</span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Categories Cards List */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {categories.map((cat) => (
                    <motion.div
                      key={cat.id}
                      variants={itemVariants}
                      className="sketchy-panel bg-white p-5 flex flex-col justify-between"
                      style={{ borderLeftWidth: "8px", borderLeftColor: cat.accent }}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-hand text-2xl font-bold text-ink-900">{cat.name}</h3>
                          <span className="rounded-full border-2 border-ink-800 bg-white px-2 py-0.5 font-hand text-xs font-bold shadow-sketch-soft">
                            ลำดับ: {cat.sort_order}
                          </span>
                        </div>
                        <p className="font-hand text-sm text-ink-500 mb-2">slug: {cat.slug}</p>
                        <p className="text-sm text-ink-700 leading-relaxed mb-4">
                          {cat.description || <span className="italic text-ink-400">ไม่มีคำอธิบาย</span>}
                        </p>
                      </div>

                      <div className="border-t border-dashed border-ink-800/10 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          {cat.is_active ? (
                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                              <Eye className="h-4 w-4" /> เปิดใช้งานอยู่
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded">
                              <EyeOff className="h-4 w-4" /> ปิดใช้งาน
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="btn-doodle p-2 rounded-note border-2 border-ink-800 bg-white hover:bg-doodle-lemon"
                            title="แก้ไขหมวดหมู่"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>

                          {confirmDeleteId === cat.id ? (
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="btn-doodle px-2.5 py-1 text-xs rounded-note border-2 border-red-500 bg-red-100 text-red-600 font-bold"
                              title="ยืนยันการลบ"
                            >
                              แน่ใจนะ? ลบเลย
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmDeleteId(cat.id);
                                // Auto clear after 4 seconds
                                setTimeout(() => setConfirmDeleteId((prev) => (prev === cat.id ? null : prev)), 4000);
                              }}
                              className="btn-doodle p-2 rounded-note border-2 border-ink-800 bg-white hover:bg-red-50 text-red-500"
                              title="ลบหมวดหมู่"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* TABS: QUESTIONS */}
            {/* ========================================================================= */}
            {activeTab === "questions" && (
              <motion.div key="questions-tab" variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <h2 className="font-hand text-3xl font-bold text-ink-900">จัดการคำถาม 💬</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setShowJsonImport(true);
                        setShowQuestionForm(false);
                        setConfirmDeleteId(null);
                      }}
                      className="btn-doodle flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-sky px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
                      style={{ "--btn-hover-rotate": "0.8deg" } as React.CSSProperties}
                    >
                      <Plus className="h-5 w-5" />
                      <span>นำเข้า JSON 🚀</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setQuestionForm({
                          category_id: categories[0]?.id || "",
                          question: "",
                          helper_text: "",
                          level: 1,
                          tagsString: "",
                          is_active: true
                        });
                        setShowQuestionForm(true);
                        setShowJsonImport(false);
                        setConfirmDeleteId(null);
                      }}
                      className="btn-doodle flex items-center gap-2 rounded-note border-2 border-ink-800 bg-doodle-lemon px-4 py-2 font-hand text-lg font-bold shadow-sketch-soft"
                      style={{ "--btn-hover-rotate": "-1.2deg" } as React.CSSProperties}
                    >
                      <Plus className="h-5 w-5" />
                      <span>เพิ่มคำถามใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาคำถาม/ไกด์/แท็ก..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-note border-2 border-ink-800 bg-white pl-9 pr-3 py-2.5 font-hand text-lg placeholder-ink-700/40 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
                  </div>

                  {/* Category Filter */}
                  <div className="sm:col-span-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-note border-2 border-ink-800 bg-white px-3 py-2.5 font-hand text-lg focus:outline-none"
                    >
                      <option value="all">แสดงผลคำถามจากทุกหมวดหมู่ ({questions.length})</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          หมวดหมู่: {c.name} ({questions.filter((q) => q.category_id === c.id).length} ใบ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* JSON Import Overlay */}
                <AnimatePresence>
                  {showJsonImport && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="sketchy-panel bg-white p-6 border-2 border-ink-800"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-hand text-2xl font-bold text-ink-900">
                          นำเข้าการ์ดคำถามด้วย JSON 🚀
                        </h3>
                        <button
                          onClick={() => {
                            setShowJsonImport(false);
                            setJsonInput("");
                          }}
                          className="text-ink-500 hover:text-ink-900 font-bold text-lg"
                        >
                          ✕ ยกเลิก
                        </button>
                      </div>

                      <form onSubmit={handleImportJson} className="space-y-4">
                        <div>
                          <label className="block font-hand text-lg font-bold text-ink-800 mb-1">หมวดหมู่ปลายทางสำหรับคำถามนำเข้า</label>
                          <select
                            required
                            value={jsonImportCategory}
                            onChange={(e) => setJsonImportCategory(e.target.value)}
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block font-hand text-lg font-bold text-ink-800">ใส่โค้ด JSON คำถาม (Array ของ Object)</label>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setJsonInput(JSON.stringify([
                                    {
                                      "question": "ช่วงนี้เรื่องอะไรที่ทำให้คุณยิ้มได้กว้างที่สุด?",
                                      "helper_text": "เล่าถึงเหตุการณ์เล็กๆ ในสัปดาห์นี้ให้ฟังหน่อย",
                                      "level": 1,
                                      "tags": ["ความสุข", "ชีวิตประจำวัน"],
                                      "is_active": true
                                    },
                                    {
                                      "question": "ความกลัวที่ยิ่งใหญ่ที่สุดของคุณในตอนนี้คืออะไร?",
                                      "helper_text": "และคุณรับมือกับมันอย่างไร?",
                                      "level": 3,
                                      "tags": ["ความกลัว", "เปราะบาง"]
                                    }
                                  ], null, 2));
                                }}
                                className="text-xs text-ink-600 hover:underline font-bold"
                              >
                                💡 ใส่โครงสร้างตัวอย่าง
                              </button>
                              {jsonInput && (
                                <button
                                  type="button"
                                  onClick={() => setJsonInput("")}
                                  className="text-xs text-red-500 hover:underline font-bold"
                                >
                                  🧹 ล้างข้อมูล
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            required
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='[
  {
    "question": "คำถาม...",
    "helper_text": "คำแนะนำ...",
    "level": 1,
    "tags": ["แท็ก1", "แท็ก2"]
  }
]'
                            rows={16}
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-mono text-sm placeholder-ink-700/40 focus:outline-none resize-y min-h-[320px]"
                          />
                          {jsonValidation.valid !== null && (
                            <div className={`mt-2 rounded-note border-2 border-ink-800 px-3 py-2 font-hand text-base font-bold shadow-sketch-soft flex items-center gap-2 ${
                              jsonValidation.valid ? "bg-doodle-mint text-ink-900" : "bg-doodle-peach/50 text-ink-900"
                            }`}>
                              <span>{jsonValidation.valid ? "✅" : "❌"}</span>
                              <span>{jsonValidation.message}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowJsonImport(false);
                              setJsonInput("");
                            }}
                            className="rounded-note border-2 border-ink-800 bg-white px-5 py-2 font-hand text-lg font-bold shadow-sketch"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="submit"
                            disabled={jsonValidation.valid === false}
                            className={`btn-doodle rounded-note border-2 border-ink-800 bg-doodle-mint px-5 py-2 font-hand text-lg font-bold shadow-sketch text-ink-900 ${
                              jsonValidation.valid === false ? "opacity-50 cursor-not-allowed hover:scale-100" : ""
                            }`}
                          >
                            <Save className="inline-block h-5 w-5 mr-1" />
                            <span>บันทึกและนำเข้าทั้งหมด ({jsonValidation.count > 0 ? jsonValidation.count : 0} ใบ)</span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Question Overlay */}
                <AnimatePresence>
                  {showQuestionForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="sketchy-panel bg-white p-6 border-2 border-ink-800"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-hand text-2xl font-bold text-ink-900">
                          {editingQuestion ? "แก้ไขการ์ดคำถาม ✏️" : "เพิ่มการ์ดคำถามใหม่ 💬"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowQuestionForm(false);
                            setEditingQuestion(null);
                          }}
                          className="text-ink-500 hover:text-ink-900 font-bold text-lg"
                        >
                          ✕ ยกเลิก
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuestion} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">หมวดหมู่การ์ด (Category)</label>
                            <select
                              required
                              value={questionForm.category_id}
                              onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-hand text-lg font-bold text-ink-800 mb-1">ระดับความดีพ/ความลึก (Level)</label>
                            <select
                              required
                              value={questionForm.level}
                              onChange={(e) => setQuestionForm({ ...questionForm, level: Number(e.target.value) })}
                              className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base focus:outline-none"
                            >
                              <option value="1">ระดับ 1 - เบาใจ สบาย ๆ (Icebreaker)</option>
                              <option value="2">ระดับ 2 - เชื่อมโยงใจ เริ่มลึก (Connection)</option>
                              <option value="3">ระดับ 3 - ทบทวนคิด ปรับความเข้าใจ (Insight)</option>
                              <option value="4">ระดับ 4 - ทะนุถนอม ความเปราะบาง (Vulnerable)</option>
                              <option value="5">ระดับ 5 - คุยชีวิต ดินแดนปลอดภัยสูงสุด (Deep Soul)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-hand text-lg font-bold text-ink-800 mb-1">คำถามหลัก (Question)</label>
                          <textarea
                            required
                            value={questionForm.question}
                            onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                            placeholder="เขียนคำถามที่ต้องการ เช่น ช่วงนี้คุณห่วงเรื่องอะไรมากที่สุด?"
                            rows={3}
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-hand text-lg font-bold text-ink-800 mb-1">คำไกด์เพิ่มเติม (Helper Text - ใส่เพื่อช่วยแนะผู้ตอบ)</label>
                          <input
                            type="text"
                            value={questionForm.helper_text}
                            onChange={(e) => setQuestionForm({ ...questionForm, helper_text: e.target.value })}
                            placeholder="เช่น เล่าเหตุการณ์ย่อย ๆ หรือตัวตนของคุณที่เปลี่ยนไป..."
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-hand text-lg font-bold text-ink-800 mb-1">แท็กต่าง ๆ (Tags - แยกแต่ละคีย์ด้วยลูกน้ำ [,] )</label>
                          <input
                            type="text"
                            value={questionForm.tagsString}
                            onChange={(e) => setQuestionForm({ ...questionForm, tagsString: e.target.value })}
                            placeholder="เช่น อารมณ์, ดูแลใจ, ความสัมพันธ์, วัยเด็ก"
                            className="w-full rounded-note border-2 border-ink-800 bg-paper-50 px-3 py-2 font-hand text-base placeholder-ink-700/40 focus:outline-none"
                          />
                          <span className="text-xs text-ink-500 font-semibold block mt-1">
                            *แท็กจะถูกทำความสะอาดและแยกอัตโนมัติเมื่อกดบันทึก
                          </span>
                        </div>

                        {/* Toggle active state */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="q_is_active"
                            checked={questionForm.is_active}
                            onChange={(e) => setQuestionForm({ ...questionForm, is_active: e.target.checked })}
                            className="h-5 w-5 rounded border-2 border-ink-800 text-ink-900 focus:ring-0"
                          />
                          <label htmlFor="q_is_active" className="font-hand text-lg font-bold text-ink-900 cursor-pointer select-none">
                            เปิดใช้งานคำถามนี้ในการสุ่มคำถาม
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuestionForm(false);
                              setEditingQuestion(null);
                            }}
                            className="rounded-note border-2 border-ink-800 bg-white px-5 py-2 font-hand text-lg font-bold shadow-sketch"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="submit"
                            className="btn-doodle rounded-note border-2 border-ink-800 bg-doodle-mint px-5 py-2 font-hand text-lg font-bold shadow-sketch text-ink-900"
                          >
                            <Save className="inline-block h-5 w-5 mr-1" />
                            <span>บันทึกคำถาม</span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filtered Questions List (Draw wobbly list items) */}
                {filteredQuestions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="font-hand text-lg text-ink-600">
                      แสดงผลอยู่ทั้งหมด <strong>{filteredQuestions.length}</strong> ใบ
                    </p>
                    {filteredQuestions.map((q) => {
                      const cat = categoryMap.get(q.category_id);
                      return (
                        <motion.div
                          key={q.id}
                          variants={itemVariants}
                          className="sketchy-panel bg-white p-5 border-2 border-ink-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {cat && (
                                <span
                                  className="rounded-full border border-ink-800 px-2 py-0.5 font-hand text-xs font-bold text-ink-900 shadow-sketch-soft"
                                  style={{ backgroundColor: cat.accent }}
                                >
                                  {cat.name}
                                </span>
                              )}
                              <span className="rounded bg-paper-100 text-ink-700 px-2 py-0.5 text-xs font-bold">
                                Level {q.level}
                              </span>
                              {!q.is_active && (
                                <span className="rounded bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 text-xs font-bold">
                                  ปิดใช้งานอยู่
                                </span>
                              )}
                            </div>
                            <h4 className="font-hand text-2xl font-bold text-ink-900 !leading-snug">{q.question}</h4>
                            {q.helper_text && (
                              <p className="text-sm text-ink-600 italic">คำไกด์: {q.helper_text}</p>
                            )}

                            {/* Tags list */}
                            {q.tags && q.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                {q.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded border border-ink-800/10 bg-paper-50 px-2 py-0.5 text-xs text-ink-500 font-semibold"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action tools */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="btn-doodle p-2.5 rounded-note border-2 border-ink-800 bg-white hover:bg-doodle-lemon"
                              title="แก้ไขคำถาม"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>

                            {confirmDeleteId === q.id ? (
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="btn-doodle px-3 py-1.5 text-xs rounded-note border-2 border-red-500 bg-red-100 text-red-600 font-bold"
                                title="ยืนยันการลบการ์ด"
                              >
                                แน่ใจนะ? ลบเลย
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setConfirmDeleteId(q.id);
                                  setTimeout(() => setConfirmDeleteId((prev) => (prev === q.id ? null : prev)), 4000);
                                }}
                                className="btn-doodle p-2.5 rounded-note border-2 border-ink-800 bg-white hover:bg-red-50 text-red-500"
                                title="ลบคำถาม"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 sketchy-panel bg-white/70">
                    <p className="font-hand text-2xl text-ink-500 italic">ไม่พบคำถามตรงตามการค้นหาหรือคัดกรอง</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
