-- Add image dimensions to tattoos for CLS-free rendering.
-- Nullable so existing rows stay valid; backfill via admin action.
alter table tattoos
  add column if not exists width integer,
  add column if not exists height integer;
