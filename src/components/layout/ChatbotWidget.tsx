import React, { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { parseChatMessageContent } from '../../lib/chatMessageLinks';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Assalam-o-Alaikum! Main Hello Sadiqabad ka information assistant hoon. Aap businesses, services, areas, news aur government helplines ke bare mein mujh se pooch sakte hain.',
};

function renderMessageContent(content: string) {
  return parseChatMessageContent(content).map((part, index) => part.type === 'link' ? (
    <a
      key={index}
      href={part.url}
      target=\"_blank\"
      rel=\"noopener noreferrer\"
      className=\"text-primary underline underline-offset-2 break-all hover:opacity-80\"
    >
      {part.label}
    </a>
  ) : <React.Fragment key={index}>{part.value}</React.Fragment>);
}

const SUGGESTIONS = [
  'Sadiqabad mein hospitals aur clinics?',
  'Government helplines ke numbers batao',
  'Mere area mein kaun se businesses hain?',
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Assalam-o-Alaikum! Main Hello Sadiqabad ka information assistant hoon. Aap businesses, services, areas, news aur government helplines ke bare mein mujh se pooch sakte hain.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isSending]);

  function startNewChat() {\n    if (isSending) return;\n    setMessages([WELCOME_MESSAGE]);\n    setInput('');\n    inputRef.current?.focus();\n  }\n\n  async function sendMessage(rawMessage: string) {
    const content = rawMessage.trim();
    if (!content || isSending || content.length > 500) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.answer !== 'string') {
        throw new Error(typeof result.error === 'string' ? result.error : 'Abhi jawab hasil nahi ho saka. Dobara koshish karein.');
      }
      setMessages((current) => [...current, { role: 'assistant', content: result.answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection ka masla hai. Dobara koshish karein.';
      setMessages((current) => [...current, { role: 'assistant', content: message }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Hello Sadiqabad AI assistant"
          className="fixed z-[70] bottom-24 md:bottom-6 right-3 md:right-6 w-[calc(100vw-1.5rem)] sm:w-[390px] h-[min(680px,calc(100dvh-7.5rem))] md:h-[min(680px,calc(100dvh-3rem))] bg-surface-container-lowest text-on-surface border border-outline-variant/60 rounded-[1.6rem] shadow-2xl overflow-hidden flex flex-col"
        >
          <header className="shrink-0 bg-primary text-on-primary px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm">Hello Sadiqabad Assistant</h2>
              <p className="text-[11px] text-on-primary/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Roman Urdu · Sirf maloomat ke liye
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="w-9 h-9 rounded-xl hover:bg-white/15 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 bg-surface">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-surface-container-lowest border border-outline-variant/50 px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {messages[0].content}
              </div>
            </div>

            {messages.slice(1).map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-md'
                      : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-tl-md'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="pt-2 space-y-2">
                <p className="px-1 text-[11px] font-semibold text-on-surface-variant">Aap ye bhi pooch sakte hain</p>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={isSending}
                    className="block w-full text-left text-xs px-3 py-2.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant px-2">
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Jawab tayyar ho raha hai...
              </div>
            )}
          </div>

          <form
            className="shrink-0 p-3 border-t border-outline-variant/60 bg-surface-container-lowest"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface px-3 py-2 focus-within:border-primary/70">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Apna sawal likhein..."
                aria-label="Apna sawal likhein"
                className="min-w-0 flex-1 bg-transparent outline-none text-sm placeholder:text-on-surface-variant/70"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="w-9 h-9 shrink-0 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-40"
              >
                {isSending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant text-center mt-2">
              Assistant sirf public directory ki maloomat deta hai; koi action perform nahi karta.
            </p>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Hello Sadiqabad AI assistant"
          className="fixed z-[70] bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-surface" />
        </button>
      )}
    </>
  );
}
