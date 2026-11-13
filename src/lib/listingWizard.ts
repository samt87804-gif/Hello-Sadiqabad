/**
 * Hello Sadiqabad - Listing Editor Wizard Step Definitions and Parsers
 */

export type WizardStep = 'basic' | 'contact' | 'location' | 'hours' | 'preview';

export const STEPS: Array<{ id: WizardStep; num: number; label: string; ur: string }> = [
  { id: 'basic', num: 1, label: 'Basic Info', ur: 'بنیادی معلومات' },
  { id: 'contact', num: 2, label: 'Contact & Social', ur: 'رابطہ اور سوشل' },
  { id: 'location', num: 3, label: 'Location & Map', ur: 'مقام اور نقشہ' },
  { id: 'hours', num: 4, label: 'Hours & Services', ur: 'اوقات اور سہولیات' },
  { id: 'preview', num: 5, label: 'Preview & Submit', ur: 'جائزہ اور تصدیق' },
];

export const QUICK_AMENITIES: Array<{ en: string; ur: string }> = [
  { en: 'Home Delivery', ur: 'ہوم ڈلیوری' },
  { en: 'Air Conditioned', ur: 'ایئر کنڈیشنڈ' },
  { en: 'Generator Backup', ur: 'جنریٹر بیک اپ' },
  { en: 'Cards / Raast Accepted', ur: 'کارڈز / راست / ایزی پیسہ' },
  { en: 'Wholesale Rates', ur: 'ہول سیل نرخ' },
  { en: 'Family Hall / Seating', ur: 'فیملی ہال' },
  { en: '24/7 Support', ur: '24 گھنٹے سروس' },
];

export function parseStepParam(raw: string | null): WizardStep {
  if (!raw) return 'basic';
  const clean = raw.trim().toLowerCase();
  if (clean === 'contact' || clean === 'social') return 'contact';
  if (clean === 'location' || clean === 'map') return 'location';
  if (clean === 'hours' || clean === 'services' || clean === 'amenities') return 'hours';
  if (clean === 'preview' || clean === 'media' || clean === 'submit') return 'preview';
  return 'basic';
}
