(function () {
  var D = window.URA, Q = D.q, PER = 6, PAGES = Math.ceil(Q.length / PER);
  // 丸は左から「そう思わない(強)」→「そう思う(強)」
  var VALUES = [-3, -2, -1, 1, 2, 3];
  var LABELS = ["まったくそう思わない", "そう思わない", "ややそう思わない", "ややそう思う", "そう思う", "とてもそう思う"];
  var answers = new Array(Q.length).fill(null);
  var page = 0;
  var $ = function (id) { return document.getElementById(id); };

  $("start").addEventListener("click", function () {
    $("landing").hidden = true;
    $("quiz").hidden = false;
    render();
    window.scrollTo(0, 0);
  });

  function render() {
    var html = "";
    for (var i = page * PER; i < Math.min(Q.length, (page + 1) * PER); i++) {
      html += '<div class="q' + (answers[i] !== null ? " done" : "") + '" data-i="' + i + '">' +
        '<p class="q-text">' + Q[i].w.map(function (c) { return '<span class="nb">' + c + "</span>"; }).join("") + "</p>" +
        '<div class="scale" role="radiogroup" aria-label="' + Q[i].t + '">' +
        VALUES.map(function (v, k) {
          var on = answers[i] === v;
          return '<button class="dot' + (on ? " on" : "") + '" role="radio" aria-checked="' + on + '" data-v="' + v +
            '" aria-label="' + LABELS[k] + '"></button>';
        }).join("") +
        '</div><div class="scale-label"><span>そう思わない</span><span>そう思う</span></div></div>';
    }
    $("qpage").innerHTML = html;
    $("prev").style.visibility = page === 0 ? "hidden" : "visible";
    $("next").textContent = page === PAGES - 1 ? "結果を視る" : "次へ";
    update();
  }

  function update() {
    var n = answers.filter(function (a) { return a !== null; }).length;
    document.querySelector(".progress-bar i").style.width = (n / Q.length * 100) + "%";
    document.querySelector(".progress-num b").textContent = n;
    document.querySelector(".progress").setAttribute("aria-valuenow", n);
    var ok = true;
    for (var i = page * PER; i < Math.min(Q.length, (page + 1) * PER); i++) if (answers[i] === null) ok = false;
    $("next").disabled = !ok;
  }

  $("qpage").addEventListener("click", function (ev) {
    var b = ev.target.closest(".dot");
    if (!b) return;
    var q = b.closest(".q"), i = +q.dataset.i, first = answers[i] === null;
    answers[i] = +b.dataset.v;
    q.querySelectorAll(".dot").forEach(function (d) {
      var on = d === b;
      d.classList.toggle("on", on);
      d.setAttribute("aria-checked", on);
    });
    q.classList.add("done");
    update();
    // 初めて答えた問いだけ、次の未回答へ送る（答え直しでは動かさない）
    if (first) {
      var next = q.nextElementSibling;
      while (next && answers[+next.dataset.i] !== null) next = next.nextElementSibling;
      setTimeout(function () {
        (next || $("next")).scrollIntoView({ behavior: "smooth", block: "center" });
      }, 180);
    }
  });

  $("prev").addEventListener("click", function () {
    if (page > 0) { page--; render(); window.scrollTo(0, 0); }
  });
  $("next").addEventListener("click", function () {
    if (page < PAGES - 1) { page++; render(); window.scrollTo(0, 0); return; }
    finish();
  });

  function score() {
    var code = "", pcts = [], gap = 0;
    D.axes.forEach(function (ax) {
      var sum = 0, om = 0, ur = 0;
      Q.forEach(function (q, i) {
        if (q.a !== ax.key) return;
        var v = answers[i] * (q.p === ax.left ? 1 : -1);
        sum += v;
        if (q.l === "omote") om += v; else ur += v;
      });
      // 同点なら本音（裏の設問）側に寄せる
      var left = sum > 0 || (sum === 0 && ur >= 0);
      code += left ? ax.left : ax.right;
      pcts.push(Math.round(50 + 50 * Math.abs(sum) / 18));
      gap += Math.abs(om - ur);
    });
    // 表と裏の食い違い（0〜72）を百分率へ。素直に回答しても0%になりにくいよう曲線をかける
    var mask = Math.round(100 * Math.pow(Math.min(1, gap / 36), 0.7));
    mask = Math.max(5, Math.min(99, mask));
    return { code: code, pcts: pcts, mask: mask };
  }

  function finish() {
    var r = score();
    try { localStorage.setItem("ura_result", JSON.stringify(r)); } catch (e) {}
    $("quiz").hidden = true;
    $("loading").hidden = false;
    window.scrollTo(0, 0);
    document.querySelectorAll(".loading-line").forEach(function (el) {
      setTimeout(function () { el.classList.add("show"); }, 500 + 800 * +el.dataset.d);
    });
    setTimeout(function () {
      location.href = "r/" + r.code + "/?m=" + r.mask + "&a=" + r.pcts.join("-");
    }, 3100);
  }
})();
