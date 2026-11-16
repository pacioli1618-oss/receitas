import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildPhotoUrl, randomPhotoName, thumbPath} from '../src/lib/photo';

const path = '0d07a622-f8e5-4552-b5ed-465293e72cd3/k2v8x9qw3m4n5p6r.webp';

test('the thumbnail sits next to the photo with a -thumb suffix', () => {
  assert.equal(thumbPath(path), '0d07a622-f8e5-4552-b5ed-465293e72cd3/k2v8x9qw3m4n5p6r-thumb.webp');
  assert.equal(thumbPath('r/abc12345.jpg'), 'r/abc12345-thumb.jpg');
});

test('photo URLs point at the public "receitas" bucket', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  assert.equal(buildPhotoUrl(path), `https://example.supabase.co/storage/v1/object/public/receitas/${path}`);
  assert.ok(buildPhotoUrl(path, 'thumb').endsWith('-thumb.webp'));
});

test('random names match what the database accepts', () => {
  for (let index = 0; index < 50; index += 1) assert.match(randomPhotoName(), /^[a-z0-9]{16}$/);
});
