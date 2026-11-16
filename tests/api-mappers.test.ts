import assert from 'node:assert/strict';
import {test} from 'node:test';
import {toBookView, toCategory, toFullBookView, type RawBook} from '../src/lib/api-mappers';
import book from './fixtures/rc_get_book.json';

test('toFullBookView converts rc_get_book (with details) to camelCase', () => {
  const view = toFullBookView(book as RawBook);
  assert.equal(view.title, 'Família Teste');
  assert.equal(view.locale, 'pt-BR');
  assert.equal(view.trashCount, 0);
  assert.deepEqual(view.recipes[0], {
    id: '0d07a622-f8e5-4552-b5ed-465293e72cd3',
    title: 'Bolo de fubá cremoso',
    author: 'Vó Lurdes',
    category: 'sweets',
    photoPath: '0d07a622-f8e5-4552-b5ed-465293e72cd3/k2v8x9qw3m4n5p6r.webp',
    updatedAt: '2026-11-16T14:08:13.374592+00:00',
    ingredients: '3 ovos',
    steps: 'Bata.',
    tip: null,
    createdAt: '2026-11-16T14:08:13.374592+00:00',
  });
});

test('unknown categories and locales fall back safely', () => {
  assert.equal(toCategory('dessert'), 'other');
  assert.equal(toBookView({...(book as RawBook), locale: 'fr'}).locale, 'pt-BR');
});
