(function () {
  'use strict';

  var predictions = (window.PREDICTIONS || []).filter(function (p) {
    return p && typeof p.text === 'string' && p.text.trim();
  });

  var numEl = document.getElementById('num');
  var textEl = document.getElementById('text');
  var btnEl = document.getElementById('draw');

  /* Одно предсказание за визит: после первого нажатия всё остальное
     игнорируется, кнопка остаётся задизейбленной. */
  var drawn = false;
  var rolling = false;

  /* Мотание: первые мелькания каждые ~40мс (быстро-быстро), дальше интервал
     растёт по квадрату прогресса до ~620мс (медленно-медленно), на4-й секунде
     — финальное предсказание. */
  var ROLL_MS = 4000;
  var FAST_MS = 40;
  var SLOW_MS = 620;

  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function randomPrediction() {
    return predictions[Math.floor(Math.random() * predictions.length)];
  }

  function show(item) {
    numEl.textContent = 'Предсказание № ' + item.n;
    textEl.textContent = item.text;
    fitText();
  }

  /* Лёгкое мерцание на каждом переключении — «мотание» видно. */
  function flicker(el, duration) {
    if (el.animate) {
      el.animate([{ opacity: 0.15 }, { opacity: 1 }],
        { duration: duration, easing: 'ease-out' });
    }
  }

  /* Финал: предсказание проявляется чуть заметным вздохом. */
  function reveal() {
    if (!textEl.animate) return;
    var opts = { duration: 340, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' };
    textEl.animate(
      [{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }],
      opts);
    numEl.animate([{ opacity: 0 }, { opacity: 1 }], opts);
  }

  function roll(final, done) {
    var start = performance.now();
    var nextFlip = start;

    function frame(now) {
      var p = (now - start) / ROLL_MS;
      if (p >= 1) {
        show(final);
        reveal();
        done();
        return;
      }
      if (now >= nextFlip) {
        show(randomPrediction());
        flicker(textEl, 110);
        flicker(numEl, 110);
        nextFlip = now + FAST_MS + (SLOW_MS - FAST_MS) * p * p;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function textHeight() {
    var range = document.createRange();
    range.selectNodeContents(textEl);
    return range.getBoundingClientRect().height;
  }

  /* Текст должен строго лежать в поле макета 648×189. Пока не влезает —
     уменьшаем кегль. На узком экране высоты у поля нет, цикл не выполняется. */
  function fitText() {
    textEl.style.setProperty('--fit', '1');
    var k = 1;
    while (k > 0.6 && textHeight() > textEl.clientHeight + 1) {
      k = Math.round(k * 0.96 * 1000) / 1000;
      textEl.style.setProperty('--fit', String(k));
    }
  }

  function draw() {
    if (drawn || rolling) return;
    drawn = true;
    btnEl.disabled = true;
    var final = randomPrediction();

    if (reduceMotion) {
      show(final);
      btnEl.textContent = 'Предсказание готово';
      return;
    }

    rolling = true;
    btnEl.textContent = 'Считаем…';
    roll(final, function () {
      rolling = false;
      btnEl.textContent = 'Предсказание готово';
    });
  }

  if (!predictions.length) {
    numEl.textContent = 'предсказания не загрузились';
    textEl.textContent = 'Файл predictions.js пустой. Добавь предсказания в new.txt и выполни в папке проекта: node build.js';
    btnEl.disabled = true;
    fitText();
  } else {
    btnEl.addEventListener('click', draw);
    fitText();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(fitText, 120);
    });
  }
})();
