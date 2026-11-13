import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  autoMapCsvHeaders,
  detectImportFileType,
  parseCsvText,
  parseSpreadsheetBuffer,
  validateCsvRows,
  validateMappings,
} from './csvImport';
import { SEED_AREAS, SEED_CATEGORIES } from './seedData';

function buildXlsxArrayBuffer(rows: unknown[][], sheetName = 'Listings'): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return out instanceof ArrayBuffer ? out : out.buffer;
}

test('detectImportFileType identifies .xlsx and .csv and rejects unsupported formats', () => {
  assert.equal(detectImportFileType('sadiqabad_shops.xlsx'), 'xlsx');
  assert.equal(detectImportFileType('sadiqabad_shops.csv'), 'csv');
  assert.equal(detectImportFileType('legacy.xls'), null);
  assert.equal(detectImportFileType('photo.png'), null);
});

test('parseCsvText handles quoted commas, escaped quotes, and blank lines', () => {
  const csv = [
    'name_en,phone,category,area,address',
    '"Al-Madina Pharmacy, Plus","0300-8671234",pharmacy,rail-bazaar,"Shop 4, ""Main"" Market"',
    '',
    'Bismillah Bakers,068-5701122,restaurants,klp-road,KLP Road',
  ].join('\n');

  const rows = parseCsvText(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], 'Al-Madina Pharmacy, Plus');
  assert.equal(rows[1][4], 'Shop 4, "Main" Market');
  assert.equal(rows[2][0], 'Bismillah Bakers');
});

test('parseSpreadsheetBuffer extracts first sheet of valid .xlsx workbook', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Business Name', 'Mobile Number', 'Category', 'Area', 'Address'],
      ['Noor Pharmacy', '0300-5544332', 'pharmacy', 'rail-bazaar', 'Main Rail Bazaar'],
      ['', '', '', '', ''],
      ['Sadiqabad Sweets', '068-5701122', 'restaurants', 'klp-road', 'KLP Road'],
    ]),
    'PrimarySheet'
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['Ignored Second Sheet']]),
    'SecondSheet'
  );
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const buffer = out instanceof ArrayBuffer ? out : out.buffer;

  const parsed = parseSpreadsheetBuffer(buffer, 'shops.xlsx');
  assert.equal(parsed.sheetName, 'PrimarySheet');
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[1][0], 'Noor Pharmacy');
  assert.equal(parsed.rows[2][0], 'Sadiqabad Sweets');
});

test('parseSpreadsheetBuffer throws clear error on empty workbook or empty buffer', () => {
  const emptyBuffer = buildXlsxArrayBuffer([], 'EmptySheet');
  assert.throws(() => parseSpreadsheetBuffer(emptyBuffer, 'empty.xlsx'), /is empty/i);
  assert.throws(() => parseSpreadsheetBuffer(new ArrayBuffer(0), 'zero.xlsx'), /empty/i);
});

test('autoMapCsvHeaders and validateMappings detect required columns', () => {
  const mapping = autoMapCsvHeaders([
    'Business Name',
    'Mobile Number',
    'Trade',
    'Chowk',
    'Urdu Name',
    'Unknown Col',
  ]);
  assert.equal(mapping[0].target, 'name_en');
  assert.equal(mapping[1].target, 'phone');
  assert.equal(mapping[2].target, 'category');
  assert.equal(mapping[3].target, 'area');
  assert.equal(mapping[4].target, 'name_ur');
  assert.equal(mapping[5].target, 'ignore');

  assert.equal(validateMappings(mapping).valid, true);

  const missingPhone = autoMapCsvHeaders(['Business Name', 'Category']);
  const check = validateMappings(missingPhone);
  assert.equal(check.valid, false);
  assert.ok(check.missingFields.includes('Primary Phone'));
});

test('validateCsvRows rejects duplicates, invalid phones, and unmatched categories/areas without silent fallback', () => {
  const headers = ['name_en', 'phone', 'category', 'area'];
  const mappings = autoMapCsvHeaders(headers);
  const rows = [
    ['Valid Shop', '0300-1112233', 'pharmacy', 'rail-bazaar'],
    ['Batch Duplicate Shop', '03001112233', 'pharmacy', 'klp-road'],
    ['Existing DB Duplicate', '0300-9998887', 'pharmacy', 'klp-road'],
    ['', '', '', ''],
    ['Invalid Fields Shop', '12', 'unknown-cat', 'unknown-area'],
  ];

  const validated = validateCsvRows(rows, mappings, SEED_CATEGORIES, SEED_AREAS, ['+923009998887']);
  // Blank row is skipped completely -> 4 rows returned
  assert.equal(validated.length, 4);

  assert.equal(validated[0].isValid, true);
  assert.equal(validated[0].isDuplicate, false);
  assert.equal(validated[0].errors.length, 0);

  // Batch duplicate is flagged and blocked
  assert.equal(validated[1].isValid, false);
  assert.equal(validated[1].isDuplicate, true);
  assert.ok(validated[1].errors.some((e) => e.includes('Duplicate phone inside import batch')));

  // DB duplicate is flagged and blocked
  assert.equal(validated[2].isValid, false);
  assert.equal(validated[2].isDuplicate, true);
  assert.ok(validated[2].errors.some((e) => e.includes('existing directory listing')));

  // Invalid phone, unmatched category & unmatched area are rejected as errors
  assert.equal(validated[3].isValid, false);
  assert.equal(validated[3].category_id, null);
  assert.ok(validated[3].errors.some((e) => e.includes('Invalid or missing Pakistani phone')));
  assert.ok(validated[3].errors.some((e) => e.includes('Unmatched category')));
  assert.ok(validated[3].errors.some((e) => e.includes('Unmatched area')));
});
