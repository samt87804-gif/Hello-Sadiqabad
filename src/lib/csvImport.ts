import * as XLSX from 'xlsx';
import { normalizePkPhone } from './phone';
import type { AreaRow, CategoryRow } from '../types/database';

export type CsvTargetField =
  | 'ignore'
  | 'name_en'
  | 'name_ur'
  | 'phone'
  | 'whatsapp'
  | 'category'
  | 'area'
  | 'address'
  | 'landmark'
  | 'description_en'
  | 'is_verified'
  | 'home_delivery';

export interface CsvColumnMapping {
  headerIndex: number;
  headerName: string;
  target: CsvTargetField;
}

export interface ParsedCsvRow {
  rowNumber: number;
  raw: string[];
  name_en: string;
  name_ur: string | null;
  phone_primary: string;
  phone_normalized: string;
  whatsapp: string | null;
  category_id: string | null;
  category_label: string;
  area_id: string | null;
  area_label: string;
  address_en: string | null;
  landmark_en: string | null;
  description_en: string | null;
  is_verified: boolean;
  home_delivery: boolean;
  isDuplicate: boolean;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface SpreadsheetParseResult {
  sheetName: string;
  rows: string[][];
}

export function detectImportFileType(
  fileName: string,
  mimeType = ''
): 'xlsx' | 'csv' | null {
  const lower = fileName.trim().toLowerCase();
  const mime = mimeType.trim().toLowerCase();
  if (
    lower.endsWith('.xlsx') ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'xlsx';
  }
  if (lower.endsWith('.csv') || lower.endsWith('.txt') || mime === 'text/csv') {
    return 'csv';
  }
  return null;
}

/**
 * Parses the first worksheet of an .xlsx workbook buffer into a normalized 2D string matrix.
 */
export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer,
  _fileName?: string
): SpreadsheetParseResult {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('The uploaded spreadsheet file is empty.');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  } catch {
    throw new Error('Could not read Excel file. Make sure it is a valid .xlsx workbook.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error('The Excel workbook does not contain any worksheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  const nonEmptyRows = rawRows
    .map((r) => (Array.isArray(r) ? r.map((cell) => String(cell ?? '').trim()) : []))
    .filter((r) => r.some((cell) => cell.length > 0));

  if (nonEmptyRows.length === 0) {
    throw new Error(`Worksheet "${sheetName}" is empty.`);
  }

  const colWidth = nonEmptyRows[0].length;
  const rows = nonEmptyRows.map((r) => {
    if (r.length >= colWidth) return r.slice(0, colWidth);
    return [...r, ...Array.from({ length: colWidth - r.length }, () => '')];
  });

  return { sheetName, rows };
}

/**
 * Parses CSV text handling quoted fields, escaped double-quotes (""), and CRLF/LF newlines.
 */
export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(current.trim());
      current = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = '';
    } else if (ch === '\n') {
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

const HEADER_ALIASES: Record<CsvTargetField, string[]> = {
  ignore: [],
  name_en: ['name_en', 'name', 'business_name', 'shop', 'title', 'business'],
  name_ur: ['name_ur', 'urdu_name', 'name_urdu'],
  phone: ['phone', 'phone_primary', 'mobile', 'contact', 'tel', 'number'],
  whatsapp: ['whatsapp', 'wa', 'whatsapp_number'],
  category: ['category', 'category_slug', 'cat', 'trade', 'type'],
  area: ['area', 'area_slug', 'locality', 'neighborhood', 'chowk'],
  address: ['address', 'address_en', 'location', 'street'],
  landmark: ['landmark', 'landmark_en', 'near'],
  description_en: ['description', 'description_en', 'about', 'notes'],
  is_verified: ['verified', 'is_verified'],
  home_delivery: ['delivery', 'home_delivery'],
};

export function autoMapCsvHeaders(headers: string[]): CsvColumnMapping[] {
  const usedTargets = new Set<CsvTargetField>();
  return headers.map((headerName, headerIndex) => {
    const clean = headerName.trim().toLowerCase().replace(/[\s-]+/g, '_');
    let matched: CsvTargetField = 'ignore';
    for (const [target, aliases] of Object.entries(HEADER_ALIASES) as Array<
      [CsvTargetField, string[]]
    >) {
      if (target === 'ignore' || usedTargets.has(target)) continue;
      if (aliases.some((alias) => clean === alias || clean.includes(alias))) {
        matched = target;
        usedTargets.add(target);
        break;
      }
    }
    return { headerIndex, headerName, target: matched };
  });
}

export function validateMappings(mappings: CsvColumnMapping[]): {
  valid: boolean;
  missingFields: string[];
} {
  const mappedTargets = new Set(mappings.map((m) => m.target));
  const missingFields: string[] = [];
  if (!mappedTargets.has('name_en')) missingFields.push('Business Name (EN)');
  if (!mappedTargets.has('phone')) missingFields.push('Primary Phone');
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

function parseBoolCell(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function isValidPkPhoneNormalized(phoneNorm: string): boolean {
  if (!phoneNorm || !phoneNorm.startsWith('+92')) return false;
  const digits = phoneNorm.replace(/\D/g, '');
  // Standard Pakistani numbers: 92 + 9 digits (landline 068-XXXXXXX) or 92 + 10 digits (mobile 03XX-XXXXXXX)
  return digits.length >= 11 && digits.length <= 13;
}

export function validateCsvRows(
  dataRows: string[][],
  mappings: CsvColumnMapping[],
  categories: CategoryRow[],
  areas: AreaRow[],
  existingPhonesNormalized: string[]
): ParsedCsvRow[] {
  const existingSet = new Set(
    existingPhonesNormalized.map((p) => normalizePkPhone(p)).filter(Boolean)
  );
  const seenBatchPhones = new Set<string>();

  const fieldIndex = (target: CsvTargetField): number =>
    mappings.find((m) => m.target === target)?.headerIndex ?? -1;

  const idxName = fieldIndex('name_en');
  const idxNameUr = fieldIndex('name_ur');
  const idxPhone = fieldIndex('phone');
  const idxWa = fieldIndex('whatsapp');
  const idxCat = fieldIndex('category');
  const idxArea = fieldIndex('area');
  const idxAddr = fieldIndex('address');
  const idxLandmark = fieldIndex('landmark');
  const idxDesc = fieldIndex('description_en');
  const idxVerified = fieldIndex('is_verified');
  const idxDelivery = fieldIndex('home_delivery');

  const indexedRows = dataRows
    .map((raw, i) => ({ raw, rowNumber: i + 2 }))
    .filter(({ raw }) => raw.some((cell) => cell.trim().length > 0));

  return indexedRows.map(({ raw, rowNumber }) => {
    const get = (idx: number) => (idx >= 0 ? (raw[idx] ?? '').trim() : '');
    const nameEn = get(idxName);
    const nameUr = get(idxNameUr) || null;
    const phoneRaw = get(idxPhone);
    const phoneNorm = normalizePkPhone(phoneRaw);
    const waRaw = get(idxWa);
    const waNorm = waRaw ? normalizePkPhone(waRaw) : '';
    const catRaw = get(idxCat);
    const areaRaw = get(idxArea);
    const addressEn = get(idxAddr) || null;
    const landmarkEn = get(idxLandmark) || null;
    const descriptionEn = get(idxDesc) || null;
    const isVerified = parseBoolCell(get(idxVerified));
    const homeDelivery = parseBoolCell(get(idxDelivery));

    const errors: string[] = [];
    const warnings: string[] = [];
    let isDuplicate = false;

    if (!nameEn || nameEn.length < 2) {
      errors.push('Missing business name (min 2 chars)');
    }
    if (!phoneRaw || !isValidPkPhoneNormalized(phoneNorm)) {
      errors.push('Invalid or missing Pakistani phone number');
    } else {
      if (existingSet.has(phoneNorm)) {
        isDuplicate = true;
        errors.push('Duplicate phone matches existing directory listing');
      } else if (seenBatchPhones.has(phoneNorm)) {
        isDuplicate = true;
        errors.push('Duplicate phone inside import batch');
      }
      seenBatchPhones.add(phoneNorm);
    }

    if (waRaw && !isValidPkPhoneNormalized(waNorm)) {
      errors.push('Invalid WhatsApp phone number');
    }

    const catLc = catRaw.toLowerCase();
    const matchedCat = catRaw
      ? categories.find(
          (c) =>
            c.slug.toLowerCase() === catLc ||
            c.name_en.toLowerCase() === catLc ||
            c.name_ur === catRaw ||
            (catLc.length >= 3 && c.name_en.toLowerCase().includes(catLc))
        ) ?? null
      : null;

    if (!catRaw) {
      errors.push('Missing category');
    } else if (!matchedCat) {
      errors.push(`Unmatched category "${catRaw}"`);
    }

    const areaLc = areaRaw.toLowerCase();
    const matchedArea = areaRaw
      ? areas.find(
          (a) =>
            a.slug.toLowerCase() === areaLc ||
            a.name_en.toLowerCase() === areaLc ||
            a.name_ur === areaRaw ||
            (areaLc.length >= 3 && a.name_en.toLowerCase().includes(areaLc))
        ) ?? null
      : null;

    if (areaRaw && !matchedArea) {
      errors.push(`Unmatched area "${areaRaw}"`);
    }

    return {
      rowNumber,
      raw,
      name_en: nameEn,
      name_ur: nameUr,
      phone_primary: phoneRaw,
      phone_normalized: phoneNorm,
      whatsapp: waRaw || null,
      category_id: matchedCat?.id ?? null,
      category_label: matchedCat?.name_en ?? (catRaw || 'Unmapped'),
      area_id: matchedArea?.id ?? null,
      area_label: matchedArea?.name_en ?? (areaRaw || 'Unassigned'),
      address_en: addressEn,
      landmark_en: landmarkEn,
      description_en: descriptionEn,
      is_verified: isVerified,
      home_delivery: homeDelivery,
      isDuplicate,
      errors,
      warnings,
      isValid: errors.length === 0 && Boolean(matchedCat?.id),
    };
  });
}
