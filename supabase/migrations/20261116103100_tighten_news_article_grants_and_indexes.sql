revoke all on table public.news_articles from anon, public;
grant select on public.news_articles to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;
grant all on public.news_articles to service_role;
create index if not exists idx_news_articles_created_by on public.news_articles(created_by);
create index if not exists idx_news_articles_updated_by on public.news_articles(updated_by);
