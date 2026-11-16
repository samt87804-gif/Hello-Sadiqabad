alter table public.news_articles
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists youtube_url text;

alter table public.news_articles
  add constraint news_article_image_urls_valid
    check (cardinality(image_urls) <= 12 and public.are_valid_https_urls(image_urls)),
  add constraint news_article_youtube_url_valid
    check (
      youtube_url is null
      or (
        char_length(btrim(youtube_url)) <= 500
        and btrim(youtube_url) ~* '^https://((www|m)\.)?youtube\.com/|^https://youtu\.be/'
      )
    );
