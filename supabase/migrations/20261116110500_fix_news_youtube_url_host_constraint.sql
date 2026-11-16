alter table public.news_articles
  drop constraint if exists news_article_youtube_url_valid;

alter table public.news_articles
  add constraint news_article_youtube_url_valid
  check (
    youtube_url is null
    or (
      char_length(btrim(youtube_url)) <= 500
      and left(lower(btrim(youtube_url)), 8) = 'https://'
      and lower(split_part(split_part(btrim(youtube_url), '/', 3), ':', 1))
        in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be')
    )
  );
