-- Migration: Reset all existing questions to be in 'deep' mode only, removing any legacy 'interesting' mode seeding
update public.questions
set talk_modes = '{"deep"}'
where 'interesting' = any(talk_modes);
