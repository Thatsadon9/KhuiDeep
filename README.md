# KhuiDeep คุยดีพ

เว็บแอปการ์ดคำถามภาษาไทยสำหรับบทสนทนาเชิงลึก สร้างด้วย Next.js App Router, Tailwind CSS และ Supabase พร้อมธีมสมุดสเก็ตช์ลายมือ

## สิ่งที่มีในโปรเจกต์

- หน้าแอปหลักภาษาไทยพร้อมลุค Hand-drawn / Doodle / Sketchbook
- การ์ดคำถามแบบพลิกหน้า พร้อมแอนิเมชันและสถานะเข้าถึงได้ด้วยปุ่ม
- ฟิลเตอร์หมวดคำถาม 4 หมวด และหมวดรวมทั้งหมด
- ระบบสุ่มคำถามแบบไม่ซ้ำในหนึ่งรอบ พร้อมเริ่มรอบใหม่
- Supabase schema, RLS policy และ seed data ภาษาไทย
- fallback data ในโค้ด เพื่อให้เปิดดูได้ทันทีแม้ยังไม่ได้ตั้งค่า Supabase

## โครงสร้างสำคัญ

- `src/app/page.tsx` หน้าแรกแบบ Server Component ที่ดึงชุดคำถาม
- `src/components/khui-deep-app.tsx` UI หลัก, ฟิลเตอร์ และ randomizer logic
- `src/components/flipping-card.tsx` การ์ดพลิกได้
- `src/components/category-tabs.tsx` ปุ่มเลือกหมวด
- `src/lib/questions.ts` ดึงข้อมูลจาก Supabase และ fallback เมื่อยังไม่มี env
- `src/data/fallback-questions.ts` ชุดคำถามสำรองภาษาไทย
- `supabase/migrations/0001_create_khui_deep_schema.sql` schema ฐานข้อมูล
- `supabase/seed.sql` ข้อมูลตั้งต้นสำหรับ Supabase
- `tailwind.config.ts` theme, สี, font family, animation และ utility สำหรับ sketchy UI

## ขั้นตอนติดตั้ง

1. ติดตั้ง dependency

```bash
npm install
```

2. สร้างไฟล์ env

```bash
cp .env.example .env.local
```

3. ใส่ค่าจาก Supabase ใน `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://okcyedusumxoewabwnlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. ตั้งค่า Supabase

เปิด Supabase SQL Editor แล้วรันไฟล์ตามลำดับนี้

```text
supabase/migrations/0001_create_khui_deep_schema.sql
supabase/seed.sql
```

5. รันเว็บในเครื่อง

```bash
npm run dev
```

จากนั้นเปิด `http://localhost:3000`

## การทำงานของ Supabase

ตาราง `categories` เก็บหมวดคำถาม เช่น ละลายพฤติกรรม ความรัก ความหลัง และครอบครัว

ตาราง `questions` เก็บคำถาม, ข้อความช่วยชวนคุย, ระดับความลึก และแท็ก

RLS เปิดไว้ทั้งสองตาราง โดยอนุญาตให้ `anon` และ `authenticated` อ่านเฉพาะข้อมูลที่ `is_active = true` เท่านั้น การเพิ่มหรือแก้ไขข้อมูลควรทำผ่าน Supabase Dashboard, service role, หรือระบบหลังบ้านแยกต่างหาก

## คำสั่งที่ใช้บ่อย

```bash
npm run dev
npm run build
npm run lint
```

## ปรับแต่งธีม

- สีหลักอยู่ใน `tailwind.config.ts` ใต้ `paper`, `ink`, และ `doodle`
- ฟอนต์ภาษาไทยอยู่ใน `src/app/layout.tsx` โดยใช้ `Mali` สำหรับลายมือ และ `Noto Sans Thai` สำหรับข้อความอ่านยาว
- CSS สำหรับกระดาษ, เส้นวาดมือ, เทป และการ์ดพลิกอยู่ใน `src/app/globals.css`

## เพิ่มคำถามใหม่

เพิ่มใน Supabase ด้วย SQL ลักษณะนี้

```sql
insert into public.questions (category_id, question, helper_text, level, tags)
values (
  (select id from public.categories where slug = 'love'),
  'คำถามภาษาไทยของคุณ',
  'ข้อความชวนคุยเพิ่มเติม',
  3,
  array['แท็กหนึ่ง', 'แท็กสอง']
);
```
