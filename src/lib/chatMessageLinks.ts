export type ChatMessagePart =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; url: string };

const LINK_PATTERN = /\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)|(https?:\\/\\/[^\\s<>()]+)/g;

export function parseChatMessageContent(content: string): ChatMessagePart[] {
  const parts: ChatMessagePart[] = [];
  const source = String(content || '');
  let cursor = 0;

  for (const match of source.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: 'text', value: source.slice(cursor, index) });

    const markdownLabel = match[1];
    const markdownUrl = match[2];
    let url = markdownUrl || match[3] || '';
    let label = markdownLabel || url;

    if (!markdownUrl) {
      const trailing = url.match(/[.,!?;:]+$/)?.[0] || '';
      url = url.slice(0, url.length - trailing.length);
      label = url;
      if (trailing) {
        // Keep punctuation outside the clickable link.
        const parsed = safeHttpUrl(url);
        if (parsed) {
          parts.push({ type: 'link', label, url: parsed });
          parts.push({ type: 'text', value: trailing });
          cursor = index + match[0].length;
          continue;
        }
      }
    }

    const safeUrl = safeHttpUrl(url);
    if (safeUrl) {
      parts.push({ type: 'link', label, url: safeUrl });
    } else {
      parts.push({ type: 'text', value: match[0] });
    }
    cursor = index + match[0].length;
  }

  if (cursor < source.length) parts.push({ type: 'text', value: source.slice(cursor) });
  return parts.length ? parts : [{ type: 'text', value: source }];
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
