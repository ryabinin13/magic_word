#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'new.txt');
const OUT = path.join(__dirname, 'predictions.js');
const LINE_RE = /^\s*(\d+)\.\s*(.+?)\s*$/;

function fail(message) {
  console.error('Ошибка: ' + message);
  process.exit(1);
}

if (!fs.existsSync(SRC)) {
  fail('не найден файл ' + SRC);
}

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const items = [];
const broken = [];

lines.forEach((line, i) => {
  if (!line.trim()) return;
  const match = LINE_RE.exec(line);
  if (!match) {
    broken.push(i + 1);
    return;
  }
  items.push({ n: Number(match[1]), text: match[2] });
});

if (broken.length) {
  console.warn('Пропущены строки без формата "N. Текст": ' + broken.join(', '));
}

if (!items.length) {
  fail('в new.txt нет ни одного предсказания');
}

const seen = new Map();
items.forEach((item) => {
  if (seen.has(item.n)) {
    console.warn('Номер ' + item.n + ' повторяется (строки ' + seen.get(item.n) + ' и позже)');
  }
  seen.set(item.n, item.n);
});

const body = items.map((item) => '  ' + JSON.stringify(item)).join(',\n');
const out = [
  '// Сгенерировано автоматически: node build.js',
  '// Источник — new.txt. Правь new.txt, потом запусти сборку.',
  'window.PREDICTIONS = [',
  body,
  '];',
  ''
].join('\n');

fs.writeFileSync(OUT, out, 'utf8');
console.log('Готово: ' + items.length + ' предсказаний → ' + path.basename(OUT));
