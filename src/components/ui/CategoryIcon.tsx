import React from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  Building2,
  Car,
  Flame,
  GraduationCap,
  HeartPulse,
  Hospital,
  Phone,
  Pill,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  Sprout,
  Store,
  Truck,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react';

export function CategoryIcon({
  name,
  className = 'w-5 h-5',
}: {
  name?: string | null;
  className?: string;
}) {
  switch (name) {
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Hospital':
    case 'local_hospital':
      return <Hospital className={className} />;
    case 'Pill':
    case 'medication':
      return <Pill className={className} />;
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Utensils':
    case 'restaurant':
      return <Utensils className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Sprout':
      return <Sprout className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Ambulance':
      return <Ambulance className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Phone':
      return <Phone className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    default:
      return <Store className={className} />;
  }
}

import { useI18n } from '../../lib/i18n';

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
        <CategoryIcon name={icon} className="w-4 h-4" />
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
            className={`${
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
