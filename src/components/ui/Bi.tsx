import React from 'react';
import { useI18n } from '../../lib/i18n';

interface BiProps {
  en: string;
  ur?: string | null;
  className?: string;
  urClassName?: string;
  inline?: boolean;
  as?: 'span' | 'div' | 'p';
}

/**
 * Bilingual text display:
 * - In Urdu mode: renders Urdu primary (with English fallback).
 * - In English mode: renders English primary; if urduHints is ON and ur is present,
 *   renders a subtle Noto Nastaliq Urdu subtitle cleanly with generous line-height.
 */
export function Bi({
  en,
  ur,
  className = '',
  urClassName = '',
  inline = false,
  as = 'span',
}: BiProps) {
  const { lang, urduHints } = useI18n();
  const cleanEn = en?.trim() ?? '';
  const cleanUr = ur?.trim() ?? '';

  if (lang === 'ur') {
    const text = cleanUr || cleanEn;
    return (
      <span className={`font-urdu ${className}`} dir={cleanUr ? 'rtl' : 'ltr'}>
        {text}
      </span>
    );
  }

  if (!urduHints || !cleanUr) {
    const Tag = as;
    return <Tag className={className}>{cleanEn}</Tag>;
  }

  if (inline) {
    return (
      <span className={`inline-flex items-baseline gap-1.5 flex-wrap ${className}`}>
        <span>{cleanEn}</span>
        <span
          className={`font-urdu text-[0.82em] text-on-surface-variant opacity-85 ${urClassName}`}
          dir="rtl"
        >
          {cleanUr}
        </span>
      </span>
    );
  }

  const Wrapper = as;
  return (
    <Wrapper className={`flex flex-col ${className}`}>
      <span>{cleanEn}</span>
      <span
        className={`font-urdu text-xs text-on-surface-variant opacity-85 leading-[2.1] ${urClassName}`}
        dir="rtl"
      >
        {cleanUr}
      </span>
    </Wrapper>
  );
}
