import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/layout/AppBottomNav.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8');

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

test('all six bottom-nav destinations remain registered as app routes', () => {
  for (const route of ['/', '/search', '/news', '/gov', '/sdk-jobs', '/favorites']) {
    if (route === '/') {
      assert.match(app, /<Route path="\/" element={<Home \/>} \/>/);
    } else {
      assert.ok(app.includes(`path="${route}"`), `missing route ${route}`);
    }
  }
});

test('removing the Urgent shortcut does not remove Emergency access', () => {
  assert.ok(app.includes('path="/emergency"'), 'Emergency route must remain registered');
  assert.match(home, /to="\/emergency"/);
});
