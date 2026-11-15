create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_ur text not null,
  excerpt_en text not null,
  excerpt_ur text not null,
  content_en text not null,
  content_ur text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint news_title_en_length check (char_length(btrim(title_en)) between 3 and 180),
  constraint news_title_ur_length check (char_length(btrim(title_ur)) between 3 and 180),
  constraint news_excerpt_en_length check (char_length(btrim(excerpt_en)) between 10 and 500),
  constraint news_excerpt_ur_length check (char_length(btrim(excerpt_ur)) between 10 and 500),
  constraint news_content_en_length check (char_length(btrim(content_en)) between 20 and 30000),
  constraint news_content_ur_length check (char_length(btrim(content_ur)) between 20 and 30000),
  constraint news_cover_https check (cover_image_url is null or cover_image_url ~* '^https://')
);
create index if not exists idx_news_articles_public_feed on public.news_articles (published_at desc, created_at desc) where status = 'published';
create index if not exists idx_news_articles_featured on public.news_articles (is_featured, published_at desc) where status = 'published';
alter table public.news_articles enable row level security;
grant select on public.news_articles to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;
grant all on public.news_articles to service_role;
create policy news_articles_public_read on public.news_articles for select to anon using (status = 'published' and published_at is not null and published_at <= now());
create policy news_articles_authenticated_read on public.news_articles for select to authenticated using ((status = 'published' and published_at is not null and published_at <= now()) or (select private.is_super_admin()) or (select private.staff_has_permission('announcements.manage')));
create policy news_articles_admin_insert on public.news_articles for insert to authenticated with check ((select private.is_super_admin()) or (select private.staff_has_permission('announcements.manage')));
create policy news_articles_admin_update on public.news_articles for update to authenticated using ((select private.is_super_admin()) or (select private.staff_has_permission('announcements.manage'))) with check ((select private.is_super_admin()) or (select private.staff_has_permission('announcements.manage')));
create policy news_articles_admin_delete on public.news_articles for delete to authenticated using ((select private.is_super_admin()) or (select private.staff_has_permission('announcements.manage')));
