/* 黒の占い師 — 無料鑑定フロー
   命式は Meishiki、本文は Reading から引く。すべて端末内で完結。 */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove("hidden"); }
  function hide(id) { el(id).classList.add("hidden"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function paras(text) {
    return String(text).split("\n\n").map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }
  function scrollTop() {
    window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
  }

  var state = { name: "", gender: "male" };

  function initDate() {
    var y = el("year"), m = el("month"), d = el("day");
    var now = new Date().getFullYear(), i;
    for (i = now - 12; i >= 1930; i--) y.add(new Option(i, i));
    for (i = 1; i <= 12; i++) m.add(new Option(i, i));
    for (i = 1; i <= 31; i++) d.add(new Option(i, i));
    y.value = 1995; m.value = 1; d.value = 1;
  }

  function initGender() {
    var box = el("genderChoices");
    box.innerHTML = "";
    [{ v: "female", l: "女性" }, { v: "male", l: "男性" }].forEach(function (g) {
      var b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = g.l;
      b.addEventListener("click", function () {
        state.gender = g.v;
        run();
      });
      box.appendChild(b);
    });
  }

  var LOADING = ["命式を立てています", "命式を立てています．", "命式を立てています．．", "命式を立てています．．．"];

  function run() {
    hide("step3"); show("loading"); scrollTop();
    var i = 0;
    var timer = setInterval(function () {
      el("loadingText").textContent = LOADING[i % LOADING.length];
      i++;
    }, 420);
    setTimeout(function () {
      clearInterval(timer);
      render();
      hide("loading"); show("result"); scrollTop();
    }, 2800);
  }

  function render() {
    var y = Number(el("year").value),
        m = Number(el("month").value),
        d = Number(el("day").value);

    var ms = window.Meishiki.build(y, m, d);
    var R  = window.Reading;
    var k  = ms.dayKan;
    var nm = esc(state.name);

    /* 命式 */
    var mh = "";
    mh += '<p class="meishiki-label">あなたの命式</p>';
    mh += '<div class="pillars">';
    mh += '<div class="pillar"><span class="pl">年柱</span><span class="pv">' + ms.year.kan + ms.year.shi + "</span></div>";
    mh += '<div class="pillar"><span class="pl">月柱</span><span class="pv">' + ms.month.kan + ms.month.shi + "</span></div>";
    mh += '<div class="pillar"><span class="pl">日柱</span><span class="pv">' + ms.day.kan + ms.day.shi + "</span></div>";
    mh += "</div>";
    mh += '<p class="meishiki-note">あなたの本質を表すのは日柱の天干、<strong>' + k
        + "（" + ms.dayKanYomi + "）</strong>。五行では<strong>" + ms.dayGyoName + "</strong>にあたります。</p>";
    mh += '<div class="attrs">';
    mh += '<div class="attr"><span class="al">社会での出方</span><span class="av">' + ms.tsuhen + "</span></div>";
    mh += '<div class="attr"><span class="al">今の段階</span><span class="av">' + ms.junisei + "</span></div>";
    mh += '<div class="attr"><span class="al">五行の偏り</span><span class="av">'
        + ms.balance.mostName + "が最多"
        + (ms.balance.lackName ? " / " + ms.balance.lackAll.join("・") + "が欠" : "")
        + "</span></div>";
    mh += "</div>";
    el("meishiki").innerHTML = mh;

    /* 本文 */
    var h = "";

    h += "<h3>一　宿命・本質</h3>";
    h += "<p>" + nm + "さん。前置きはしません。</p>";
    h += paras(R.destiny[k]);
    h += "<p>" + esc(R.gyoMost[ms.balance.mostName]) + "</p>";
    h += "<p>" + esc(ms.balance.lackName ? R.gyoLack[ms.balance.lackName] : R.gyoNone) + "</p>";

    h += "<h3>二　性格</h3>";
    h += paras(R.character[k]);

    h += "<h3>三　社会での出方</h3>";
    h += "<p class=\"axis\">月柱の天干は" + ms.month.kan + "。日干" + k + "から見ると<strong>"
       + ms.tsuhen + "</strong>にあたります。</p>";
    h += paras(R.tsuhen[ms.tsuhen]);

    h += "<h3>四　恋愛・結婚</h3>";
    h += paras(R.love[k]);
    h += "<p>" + esc(R.loveByGender[k][state.gender]) + "</p>";

    h += "<h3>五　仕事・お金</h3>";
    h += paras(R.work[k]);

    h += "<h3>六　今の段階</h3>";
    h += "<p class=\"axis\">日支は" + ms.day.shi + "。十二運では<strong>"
       + ms.junisei + "</strong>の位置にあります。</p>";
    h += paras(R.junisei[ms.junisei]);

    h += "<h3>七　気をつけること</h3>";
    h += paras(R.caution[k]);

    h += "<h3>八　最後に</h3>";
    h += paras(R.summary[k]);
    h += "<p>" + nm + "さん。決めるのはあなたです。私は視えたものをお伝えしただけです。</p>";

    el("reading").innerHTML = h;
  }

  function reset() {
    hide("result"); hide("loading"); hide("step2"); hide("step3");
    show("step1"); scrollTop();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDate();
    initGender();

    el("begin").addEventListener("click", function () {
      show("start");
      hide("step2"); hide("step3"); hide("loading"); hide("result");
      show("step1");
      requestAnimationFrame(scrollTop);
    });

    el("to2").addEventListener("click", function () {
      var v = el("name").value.trim();
      if (!v) { el("name").focus(); el("name").classList.add("err"); return; }
      el("name").classList.remove("err");
      state.name = v;
      hide("step1"); show("step2"); scrollTop();
    });

    /* 日本語入力の変換確定Enterで次へ進まないようにする。
       IME変換中のEnterは e.isComposing が true（古い環境では keyCode 229）。
       compositionend の直後に keydown が来る環境もあるので、フラグでも保険をかける。 */
    var composing = false;
    var composeEndedAt = 0;
    el("name").addEventListener("compositionstart", function () { composing = true; });
    el("name").addEventListener("compositionend", function () {
      composing = false;
      composeEndedAt = Date.now();
    });
    el("name").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (e.isComposing || e.keyCode === 229 || composing) return;   // 変換中
      if (Date.now() - composeEndedAt < 120) return;                  // 確定直後
      e.preventDefault();
      el("to2").click();
    });

    el("to3").addEventListener("click", function () {
      hide("step2"); show("step3"); scrollTop();
    });

    el("again").addEventListener("click", reset);
  });
})();
