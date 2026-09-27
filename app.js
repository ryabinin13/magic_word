(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SPIN_MS = 600;
  var SPIN_STEP_MS = 55;

  var WORKERS = ['w-cap', 'w-vest', 'w-tool', 'w-box'];
  var PARTS = ['p-gear', 'p-wrench', 'p-tire', 'p-piston', 'p-can', 'p-crate', 'p-bolt'];
  var VIEWS = {
    'w-cap': '0 0 60 90', 'w-vest': '0 0 60 90', 'w-tool': '0 0 60 90', 'w-box': '0 0 60 90',
    'p-gear': '0 0 64 64', 'p-wrench': '0 0 40 96', 'p-tire': '0 0 64 64',
    'p-piston': '0 0 56 74', 'p-can': '0 0 68 56', 'p-crate': '0 0 96 60', 'p-bolt': '0 0 56 32'
  };
  var COLORS = {
    top: ['ink', 'ink', 'cream'],
    bottom: ['ink', 'ink', 'blue'],
    both: ['ink', 'ink']
  };

  var KEEP_OUT = ['.title', '#paper', '#draw', '.toast'];
  var EDGE = 10;

  var predictions = (window.PREDICTIONS || []).filter(function (p) {
    return p && typeof p.text === 'string' && p.text.trim();
  });

  var numEl = document.getElementById('num');
  var textEl = document.getElementById('text');
  var paperEl = document.getElementById('paper');
  var btnEl = document.getElementById('draw');
  var toastEl = document.getElementById('toast');
  var decoEl = document.getElementById('deco');

  var bag = [];
  var drawn = 0;
  var spinning = false;
  var toastTimer = null;

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2200);
  }

  function nextPrediction() {
    if (!bag.length) {
      bag = shuffle(predictions);
      drawn = 0;
      if (btnEl.textContent === 'Ещё одно') showToast('Новый круг предсказаний!');
    }
    drawn++;
    return bag.pop();
  }

  function paint(item) {
    numEl.textContent = 'Предсказание № ' + item.n;
    textEl.textContent = item.text;
    paperEl.classList.remove('pop');
    void paperEl.offsetWidth;
    paperEl.classList.add('pop');
  }

  function draw() {
    if (spinning) return;
    var item = nextPrediction();
    if (btnEl.textContent === 'Узнать предсказание') btnEl.textContent = 'Ещё одно';

    if (reducedMotion()) {
      paint(item);
      return;
    }

    spinning = true;
    btnEl.disabled = true;
    var start = Date.now();

    (function step() {
      if (Date.now() - start >= SPIN_MS) {
        spinning = false;
        btnEl.disabled = false;
        paint(item);
        return;
      }
      textEl.textContent = randomItem(predictions).text;
      window.setTimeout(step, SPIN_STEP_MS);
    })();
  }

  function makeSvg(id) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', VIEWS[id]);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function spot() {
    return { x: 1 + Math.random() * 96, y: 1 + Math.random() * 94 };
  }

  /* Прямоугольники, которые рисунки не должны перекрывать. Раньше проверялся
     только левый верхний угол (anchor), из-за чего 18% деко налезали на
     заголовок, 7% — на бумажку, а 27% выходили за пределы экрана. */
  function keepOutRects() {
    return KEEP_OUT.map(function (sel) {
      var el = document.querySelector(sel);
      return el ? el.getBoundingClientRect() : null;
    }).filter(Boolean);
  }

  function clearance(b, rects) {
    var nearest = Math.min(b.left, b.top, innerWidth - b.right, innerHeight - b.bottom);
    rects.forEach(function (r) {
      var dx = Math.max(r.left - b.right, b.left - r.right);
      var dy = Math.max(r.top - b.bottom, b.top - r.bottom);
      var dist = Math.max(dx, dy);
      if (dist < nearest) nearest = dist;
    });
    return nearest;
  }

  /* Граница фонов проходит не по центру окна (фон повёрнут на -2deg), поэтому
     берём реальную нижнюю границу верхней половины, а не innerHeight / 2. */
  function splitY() {
    var top = document.querySelector('.bg-top');
    return top ? top.getBoundingClientRect().bottom : innerHeight / 2;
  }

  /* Цвет подбираем под ту половину, где рисунок реально оказался. Раньше сюда
     попадала высота в процентах, а сравнивалась с пикселями — из-за этого
     тёмно-синие детали оказывались на синем фоне (контраст 1.8) и были не видны. */
  function pickColor(centerY, split) {
    if (Math.abs(centerY - split) < EDGE * 3) return randomItem(COLORS.both);
    return randomItem(centerY < split ? COLORS.top : COLORS.bottom);
  }

  function place(id, isWorker) {
    var node = document.createElement('div');
    var size = isWorker ? 7 + Math.random() * 6 : 5 + Math.random() * 6;
    var tilt = -32 + Math.random() * 64;
    node.className = 'deco deco--' + id;
    node.style.width = size + 'vmin';
    node.style.transform = 'rotate(' + tilt.toFixed(1) + 'deg)';
    node.appendChild(makeSvg(id));
    decoEl.appendChild(node);

    var rects = keepOutRects();
    var split = splitY();
    var best = null;
    var bestGap = -Infinity;
    for (var attempt = 0; attempt < 60; attempt++) {
      var point = spot();
      node.style.left = point.x + '%';
      node.style.top = point.y + '%';
      var b = node.getBoundingClientRect();
      if (!b.width) continue;
      var gap = clearance(b, rects);
      if (gap > bestGap) { bestGap = gap; best = { point: point, box: b }; }
      if (gap >= EDGE) {
        node.classList.add(pickColor(b.top + b.height / 2, split));
        return;
      }
    }
    /* Ни одно положение не оказалось полностью свободным — берём самое
       удалённое, чтобы не оставлять экран пустым. */
    if (best) {
      node.style.left = best.point.x + '%';
      node.style.top = best.point.y + '%';
      node.classList.add(pickColor(best.box.top + best.box.height / 2, split));
    } else {
      node.remove();
    }
  }

  function spawnDecor() {
    var workers = Math.min(WORKERS.length, 6);
    var parts = Math.min(PARTS.length, 9);
    for (var i = 0; i < workers; i++) place(randomItem(WORKERS), true);
    for (var j = 0; j < parts; j++) place(randomItem(PARTS), false);
  }

  if (!predictions.length) {
    numEl.textContent = 'предсказания не загрузились';
    textEl.textContent = 'Файл predictions.js пустой. Добавь предсказания в a.txt и выполни в папке проекта: node build.js';
    btnEl.disabled = true;
  } else {
    btnEl.addEventListener('click', draw);
    spawnDecor();
  }
})();
