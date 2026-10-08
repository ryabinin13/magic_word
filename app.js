(function () {
  'use strict';

  var predictions = (window.PREDICTIONS || []).filter(function (p) {
    return p && typeof p.text === 'string' && p.text.trim();
  });

  var numEl = document.getElementById('num');
  var textEl = document.getElementById('text');
  var btnEl = document.getElementById('draw');
  var toastEl = document.getElementById('toast');

  var bag = [];
  var shownOnce = false;
  var toastTimer = null;

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
      /* Колода кончилась не в первый раз — значит начался новый круг. */
      if (shownOnce) showToast('Новый круг предсказаний!');
    }
    shownOnce = true;
    return bag.pop();
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
    var item = nextPrediction();
    numEl.textContent = 'Предсказание № ' + item.n;
    textEl.textContent = item.text;
    fitText();
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
