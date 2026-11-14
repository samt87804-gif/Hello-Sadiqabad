import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';

/**
 * Small, original SVG illustrations for directory categories.
 * The soft teal / mint / amber palette follows the Hello Sadiqabad design
 * system. These are intentionally illustrative images rather than generic
 * outline glyphs; the surrounding controls keep their normal UI icons.
 */
export function CategoryIcon({
  name,
  className = 'w-7 h-7',
}: {
  name?: string | null;
  className?: string;
}) {
  const key = name || 'Store';
  const art = (() => {
    switch (key) {
      case 'HeartPulse':
        return <g><path d="M24 39S7 29 7 17a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22Z" fill="#F28B78"/><path d="M10 23h8l3-6 5 13 4-7h8" fill="none" stroke="#FFF9EF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></g>;
      case 'Hospital':
      case 'local_hospital':
        return <g><rect x="8" y="14" width="32" height="25" rx="4" fill="#D7EEE8"/><path d="M14 39V20h20v19" fill="#F8F2E7"/><path d="M21 39V29h6v10" fill="#F2B45F"/><path d="M21 9h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="#159B91"/><path d="M12 24h4m16 0h4" stroke="#74BFB2" strokeWidth="2" strokeLinecap="round"/></g>;
      case 'Pill':
      case 'medication':
        return <g><rect x="9" y="16" width="18" height="25" rx="6" fill="#F2B45F"/><path d="M9 22h18v13H9z" fill="#FFF4DE"/><g transform="rotate(-38 31 19)"><rect x="25" y="8" width="12" height="25" rx="6" fill="#159B91"/><path d="M25 20h12v7a6 6 0 0 1-12 0z" fill="#EAF5EF"/></g></g>;
      case 'ShoppingCart':
        return <g><path d="M8 12h5l4 19h19l5-14H16" fill="none" stroke="#159B91" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 21h19l-3 8H20z" fill="#F2B45F"/><circle cx="21" cy="37" r="3.2" fill="#167F79"/><circle cx="34" cy="37" r="3.2" fill="#167F79"/><path d="M22 16v7m7-7v7" stroke="#FFF4DE" strokeWidth="2" strokeLinecap="round"/></g>;
      case 'Utensils':
      case 'restaurant':
        return <g><circle cx="24" cy="25" r="15" fill="#FFF8EA" stroke="#159B91" strokeWidth="3"/><circle cx="24" cy="25" r="9" fill="#F2B45F"/><path d="M8 8v12m-3-12v7m6-7v7m-3 5v19M40 8c-4 5-4 11 0 14v15m0-29v14" fill="none" stroke="#159B91" strokeWidth="2.5" strokeLinecap="round"/></g>;
      case 'Smartphone':
        return <g><rect x="13" y="5" width="22" height="38" rx="5" fill="#167F79"/><rect x="16" y="10" width="16" height="25" rx="2" fill="#D9F0EA"/><path d="M19 14h10v3H19zM19 20h7v2h-7z" fill="#F2B45F"/><circle cx="24" cy="39" r="1.5" fill="#FFF4DE"/></g>;
      case 'Sprout':
        return <g><path d="M24 40V20" stroke="#167F55" strokeWidth="3" strokeLinecap="round"/><path d="M24 25C9 25 7 14 9 9c10-1 16 4 15 16Z" fill="#76B96B"/><path d="M24 20c0-11 8-15 16-13 1 9-5 15-16 16Z" fill="#159B91"/><path d="M13 40h22l-3 5H16z" fill="#B97A4B"/><path d="M18 35h12" stroke="#F2B45F" strokeWidth="2" strokeLinecap="round"/></g>;
      case 'Wrench':
        return <g><path d="M29 8a11 11 0 0 0 1 13L16 35a4 4 0 0 1-6-6l14-14a11 11 0 0 0 13-1l-7 7-6-6Z" fill="#159B91"/><path d="m29 30 5-5 7 7-5 5z" fill="#F2B45F"/><circle cx="13" cy="32" r="2" fill="#FFF4DE"/></g>;
      case 'Car':
        return <g><path d="m10 27 4-11a4 4 0 0 1 4-3h13a4 4 0 0 1 4 3l4 11 2 3v8h-4v-4H11v4H7v-8z" fill="#159B91"/><path d="m17 16-3 9h20l-3-9z" fill="#DDF0EA"/><path d="M9 28h30v5H9z" fill="#F2B45F"/><circle cx="15" cy="36" r="4" fill="#35545A"/><circle cx="33" cy="36" r="4" fill="#35545A"/></g>;
      case 'GraduationCap':
        return <g><path d="m5 19 19-10 19 10-19 10z" fill="#167F79"/><path d="M13 24v9c7 6 15 6 22 0v-9l-11 6z" fill="#F2B45F"/><path d="M42 20v12" stroke="#F2B45F" strokeWidth="2.5" strokeLinecap="round"/><circle cx="42" cy="34" r="2.5" fill="#159B91"/></g>;
      case 'Truck':
        return <g><path d="M6 14h23v22H6z" fill="#F2B45F"/><path d="M29 21h8l6 8v7H29z" fill="#159B91"/><path d="M32 24h4l4 5h-8z" fill="#EAF5EF"/><circle cx="15" cy="37" r="4" fill="#35545A"/><circle cx="35" cy="37" r="4" fill="#35545A"/></g>;
      case 'Zap':
        return <g><path d="M27 5 11 27h11l-2 16 17-24H25z" fill="#F2B45F" stroke="#E39A3D" strokeWidth="1.5" strokeLinejoin="round"/><path d="M29 10 18 26h8l-2 10 9-15h-8z" fill="#FFE6A9"/></g>;
      case 'Ambulance':
        return <g><path d="M6 16h25v21H6z" fill="#FFF4DE"/><path d="M31 23h8l5 7v7H31z" fill="#D7EEE8"/><path d="M16 19h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="#E56F62"/><path d="M34 26h4l3 4h-7z" fill="#159B91"/><circle cx="14" cy="38" r="4" fill="#35545A"/><circle cx="36" cy="38" r="4" fill="#35545A"/></g>;
      case 'ShieldAlert':
        return <g><path d="M24 5 40 11v12c0 10-7 17-16 21C15 40 8 33 8 23V11z" fill="#159B91"/><path d="M24 10 35 14v9c0 7-4 12-11 16-7-4-11-9-11-16v-9z" fill="#DDF0EA"/><path d="M24 16v11" stroke="#167F79" strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="32" r="2" fill="#F2B45F"/></g>;
      case 'Flame':
        return <g><path d="M26 5c3 10-5 11-2 19 2-3 6-5 8-9 8 9 9 17 3 24-7 7-22 5-25-5-3-9 4-16 10-23 0 7 3 9 6 10-2-7 1-11 0-16Z" fill="#F2B45F"/><path d="M25 26c5 5 6 9 3 13-3 4-10 2-10-3 0-4 4-7 7-10Z" fill="#E87957"/></g>;
      case 'Phone':
        return <g><path d="M14 7c-3 1-5 5-4 9 3 11 11 19 22 22 4 1 8-1 9-5l-8-6-5 5c-5-2-9-6-11-11l5-5z" fill="#159B91"/><path d="m14 12 5 5m13 13 5 4" stroke="#DDF0EA" strokeWidth="2" strokeLinecap="round"/></g>;
      case 'Building2':
        return <g><rect x="8" y="8" width="32" height="34" rx="3" fill="#D7EEE8"/><path d="M15 14h5v6h-5zm13 0h5v6h-5zM15 25h5v6h-5zm13 0h5v6h-5z" fill="#159B91"/><path d="M21 33h7v9h-7z" fill="#F2B45F"/><path d="M5 42h38" stroke="#167F79" strokeWidth="2.5" strokeLinecap="round"/></g>;
      default:
        return <g><path d="M7 21 24 8l17 13v19H7z" fill="#D7EEE8"/><path d="M5 22 24 7l19 15" fill="none" stroke="#159B91" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 40V27h10v13" fill="#F2B45F"/><path d="M12 25h5v6h-5zm19 0h5v6h-5z" fill="#159B91"/></g>;
    }
  })();

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="23" fill="#F1F7F2" />
      <ellipse cx="24" cy="43" rx="11" ry="1.8" fill="#D8E9E1" />
      {art}
    </svg>
  );
}

export function CategoryChip({
  to,
  onClick,
  icon,
  labelEn,
  labelUr,
  active = false,
  color,
}: {
  to?: string;
  onClick?: () => void;
  icon?: string;
  labelEn: string;
  labelUr?: string;
  active?: boolean;
  color?: string;
}) {
  const { lang, urduHints } = useI18n();
  const primaryText = lang === 'ur' && labelUr ? labelUr : labelEn;
  const secondaryText =
    lang === 'en' && urduHints && labelUr
      ? labelUr
      : lang === 'ur' && urduHints && labelUr
        ? labelEn
        : null;

  const inner = (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
        active
          ? 'bg-primary text-on-primary border-primary shadow-sm'
          : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container-low shadow-xs'
      }`}
    >
      <span style={!active && color ? { color } : undefined} className="shrink-0">
        <CategoryIcon name={icon} className="w-7 h-7" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span
          className={
            lang === 'ur' && labelUr
              ? 'font-urdu text-xs font-bold leading-[1.8]'
              : 'text-xs font-semibold'
          }
          dir={lang === 'ur' && labelUr ? 'rtl' : undefined}
        >
          {primaryText}
        </span>
        {secondaryText && (
          <span
            className={` ${
              lang === 'en' ? 'font-urdu text-[10px] leading-[1.6]' : 'text-[10px]'
            } ${active ? 'text-on-primary/90' : 'text-on-surface-variant'}`}
            dir={lang === 'en' ? 'rtl' : 'ltr'}
          >
            {secondaryText}
          </span>
        )}
      </span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="shrink-0">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="shrink-0 cursor-pointer">
      {inner}
    </button>
  );
}
