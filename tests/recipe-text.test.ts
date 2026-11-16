import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildRecipeMessage, matchesSearch, splitIngredients, splitSteps} from '../src/lib/recipe-text';

test('splitIngredients drops bullets and blank lines but keeps quantities', () => {
  assert.deepEqual(splitIngredients('3 ovos\n- 2 xícaras de açúcar\n\n• 1.5 kg de farinha\n2-3 dentes de alho\n✅ sal'), [
    '3 ovos',
    '2 xícaras de açúcar',
    '1.5 kg de farinha',
    '2-3 dentes de alho',
    'sal',
  ]);
});

test('splitSteps removes typed numbering so the list is not numbered twice', () => {
  assert.deepEqual(splitSteps('1. Bata tudo.\n2) Asse por 40 minutos.\r\n\n'), ['Bata tudo.', 'Asse por 40 minutos.']);
  assert.deepEqual(splitSteps('Bata tudo e asse por 40 minutos.'), ['Bata tudo e asse por 40 minutos.']);
});

test('buildRecipeMessage formats a WhatsApp message with the link at the end', () => {
  const message = buildRecipeMessage(
    {title: 'Bolo de fubá', author: 'Vó Lurdes', ingredients: '3 ovos\n1 xícara de leite', steps: 'Bata.\nAsse.', tip: 'Erva-doce.'},
    {byline: 'Receita de Vó Lurdes', ingredients: 'Ingredientes', steps: 'Modo de preparo', tip: 'Dica', link: 'Veja:'},
    'https://receitas.gr1618.io/c/abc/r/1',
  );
  assert.equal(
    message,
    '*Bolo de fubá*\n_Receita de Vó Lurdes_\n\n*Ingredientes*\n• 3 ovos\n• 1 xícara de leite\n\n*Modo de preparo*\n1. Bata.\n2. Asse.\n\n*Dica*\nErva-doce.\n\nVeja: https://receitas.gr1618.io/c/abc/r/1',
  );
});

test('search ignores case and accents, and looks at who the recipe is from', () => {
  assert.ok(matchesSearch({title: 'Pudim de leite', author: 'Tia Cida'}, 'PUDIM'));
  assert.ok(matchesSearch({title: 'Bolo de fubá', author: 'Vó Lurdes'}, 'vo lurdes'));
  assert.ok(matchesSearch({title: 'Bolo de fubá', author: null}, 'fuba'));
  assert.ok(!matchesSearch({title: 'Bolo de fubá', author: null}, 'pernil'));
});
