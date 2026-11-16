import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildBookUrl, buildMailUrl, buildRecipeUrl, buildWhatsAppUrl, displayUrl} from '../src/lib/share-links';

const origin = 'https://receitas.gr1618.io';

test('book and recipe links share the book slug', () => {
  assert.equal(buildBookUrl(origin, 'abc123def456'), `${origin}/c/abc123def456`);
  assert.equal(buildRecipeUrl(origin, 'abc123def456', 'r1'), `${origin}/c/abc123def456/r/r1`);
});

test('displayUrl drops the protocol', () => {
  assert.equal(displayUrl(`${origin}/c/x`), 'receitas.gr1618.io/c/x');
});

test('WhatsApp and e-mail links encode the message', () => {
  assert.equal(buildWhatsAppUrl('a b&c'), 'https://wa.me/?text=a%20b%26c');
  assert.equal(buildMailUrl('Oi', 'a\nb'), 'mailto:?subject=Oi&body=a%0Ab');
});
