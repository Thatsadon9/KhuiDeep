-- Migration: Add talk_modes support to public.categories and seed separate categories for Interesting Talk

-- 1. Alter categories table to add talk_modes column
alter table public.categories
  add column if not exists talk_modes text[] not null default '{"deep"}';

-- Create Index for fast querying on array contents
create index if not exists categories_talk_modes_idx
  on public.categories using gin (talk_modes);

-- Ensure existing categories are set to {"deep"}
update public.categories
set talk_modes = '{"deep"}'
where talk_modes is null or talk_modes = '{}';

-- 2. Insert new categories for the 'interesting' mode
INSERT INTO public.categories (slug, name, description, accent, sort_order, talk_modes)
VALUES
  ('weird-ideas', 'ไอเดียหลุดโลก', 'คำถามแปลก สนุก และชวนปล่อยสมองให้วิ่งออกนอกกรอบเดิม', '#bef264', 1, '{"interesting"}'),
  ('parallel-world', 'ทางเลือกโลกขนาน', 'ลองสลับเส้นเวลา ความสัมพันธ์ และสิ่งที่อาจเกิดขึ้นอีกแบบ', '#c4b5fd', 2, '{"interesting"}'),
  ('human-analysis', 'วิเคราะห์มนุษย์', 'สแกนนิสัย ความคิด ความฝัน และพฤเบียบแบบนักทดลองตัวจิ๋ว', '#7dd3fc', 3, '{"interesting"}'),
  ('suppose', 'สมมติว่า...', 'ตั้งเงื่อนไขประหลาด ๆ แล้วดูว่าคำตอบพาใจเราไปถึงไหน', '#5eead4', 4, '{"interesting"}')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  accent = EXCLUDED.accent,
  sort_order = EXCLUDED.sort_order,
  talk_modes = EXCLUDED.talk_modes;

-- 3. Move default interesting questions to their corresponding interesting categories
UPDATE public.questions
SET category_id = (SELECT id FROM public.categories WHERE slug = 'weird-ideas' LIMIT 1)
WHERE (question LIKE '%มนุษย์ล่องหน%' OR question LIKE '%ลอยได้สูง 1 เมตร%') AND 'interesting' = ANY(talk_modes);

UPDATE public.questions
SET category_id = (SELECT id FROM public.categories WHERE slug = 'parallel-world' LIMIT 1)
WHERE (question LIKE '%พลังงานความเบียว%' OR question LIKE '%สลับร่างกันได้ทุกวัน%') AND 'interesting' = ANY(talk_modes);

UPDATE public.questions
SET category_id = (SELECT id FROM public.categories WHERE slug = 'human-analysis' LIMIT 1)
WHERE (question LIKE '%ชิปหน่วยความจำ%' OR question LIKE '%จดลิขสิทธิ์เป็น%') AND 'interesting' = ANY(talk_modes);

UPDATE public.questions
SET category_id = (SELECT id FROM public.categories WHERE slug = 'suppose' LIMIT 1)
WHERE (question LIKE '%แก๊งฮีโร่ผู้พิทักษ์%' OR question LIKE '%กฎแปลก%') AND 'interesting' = ANY(talk_modes);
