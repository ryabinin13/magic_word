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

  function draw() {
    var item = nextPrediction();
    numEl.textContent = 'Предсказание № ' + item.n;
    textEl.textContent = item.text;
  }

  if (!predictions.length) {
    numEl.textContent = 'предсказания не загрузились';
    textEl.textContent = 'Файл predictions.js пустой. Добавь предсказания в a.txt и выполни в папке проекта: node build.js';
    btnEl.disabled = true;
  } else {
    btnEl.addEventListener('click', draw);
  }
})();
