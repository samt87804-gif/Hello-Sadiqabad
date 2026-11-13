import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from 'lucide-react';
import { isValidHttpsUrl } from '../../lib/phone';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { ImageWithFallback } from '../ui/ImageWithFallback';

export function UrlListEditor({
  title,
  urls,
  maxItems,
  kind = 'image',
  onChange,
}: {
  title: string;
  urls: string[];
  maxItems: number;
  kind?: 'image' | 'video';
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const atLimit = urls.length >= maxItems;

  const handleAdd = () => {
    const clean = draft.trim();
    if (!isValidHttpsUrl(clean)) {
      setError('Enter a valid https:// URL (under 500 characters).');
      return;
    }
    if (atLimit) {
      setError(`Your current plan allows up to ${maxItems} items.`);
      return;
    }
    setError('');
    onChange([...urls, clean]);
    setDraft('');
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= urls.length) return;
    const copy = [...urls];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  };

  const remove = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-on-surface">{title}</span>
        <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
          {urls.length} / {maxItems} allowed
        </span>
      </div>

      {maxItems === 0 ? (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface-variant flex items-center gap-2">
          <Lock className="w-4 h-4 text-secondary shrink-0" />
          <span>This media feature is unlocked on Basic &amp; Premium plans.</span>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              dir="ltr"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`https://example.com/${kind === 'image' ? 'shop-photo.jpg' : 'video'}`}
              error={error}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={atLimit}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      )}

      {urls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-center gap-3"
            >
              {kind === 'image' && (
                <ImageWithFallback
                  src={url}
                  alt={`Media ${idx + 1}`}
                  className="w-14 h-14 rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate text-on-surface" dir="ltr">
                  {url}
                </p>
                <span className="text-[11px] text-on-surface-variant">Item #{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg hover:bg-surface-container-low disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(idx, 1)}
                  disabled={idx === urls.length - 1}
                  className="p-1.5 rounded-lg hover:bg-surface-container-low disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => remove(idx)}
                  className="p-1.5 rounded-lg text-error hover:bg-error-container/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
