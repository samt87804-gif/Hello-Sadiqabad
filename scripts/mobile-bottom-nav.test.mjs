import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/layout/AppBottomNav.tsx', import.meta.url), 'utf8');

test('mobile bottom navigation preserves the six approved destinations in order', () => {
  const tabsBlock = source.match(/const tabs = \[([\s\S]*?)\n  \];/);
  assert.ok(tabsBlock, 'bottom navigation tabs array exists');
  const destinations = [...tabsBlock[1].matchAll(/to: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(destinations, ['/', '/search', '/news', '/gov', '/sdk-jobs', '/favorites']);
});

test('News uses the existing route, bilingual translation and newspaper icon', () => {
  assert.match(source, /to: '\/news', label: t\('nav\.news', 'News'\), ur: 'خبریں', icon: Newspaper/);
  assert.match(source, /import \{[^}]*Newspaper[^}]*\} from 'lucide-react'/);
});

test('six destinations have a matching six-column mobile layout', () => {
  assert.match(source, /grid grid-cols-6 h-16/);
});
