/* 黒の占い師 — 無料鑑定フロー（クライアント・薄い版）
   鑑定ロジックと本文はサーバー(GAS)側にある。ここは
   「入力を集める → GASへ送る → 返ってきた完成HTMLを表示する」だけ。
   命式計算(meishiki)も本文(reading)もブラウザには含めない＝流出しない。 */
(function () {
  "use strict";

  /* ▼▼▼ 無料鑑定サーバー（Code.gs をデプロイして得た /exec のURLを貼る）▼▼▼ */
  var GAS_URL = "https://script.google.com/macros/s/AKfycbywfDbsOw4_Yd5I-KbDtr05vfla8oPB01ZIcbmiA4iUOU9QyFg6qSLBiz5XE5l2QcZw/exec";
  /* ▲▲▲ ここだけ差し替える ▲▲▲ */

  /* 属性ログ用（既存のフォーム受信GAS。鑑定サーバーとは別でよい） */
  var LOG_ENDPOINT = "https://script.google.com/macros/s/AKfycbxSwxzz0zt1vmlr_RyiWybQAu4Sc2YcMIjNkp28CC5Yx_cPzjL3fmib7_zNqc0MG6X_/exec";

  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove("hidden"); }
  function hide(id) { el(id).classList.add("hidden"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function scrollTop() {
    window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
  }

  var state = { name: "", gender: "male", hour: null };

  function initDate() {
    var y = el("year"), m = el("month"), d = el("day");
    var now = new Date().getFullYear(), i;
    for (i = now - 12; i >= 1930; i--) y.add(new Option(i, i));
    for (i = 1; i <= 12; i++) m.add(new Option(i, i));
    for (i = 1; i <= 31; i++) d.add(new Option(i, i));
    y.value = 1995; m.value = 1; d.value = 1;
  }

  function initHour() {
    var h = el("hour");
    h.add(new Option("わからない", ""));
    for (var i = 0; i <= 23; i++) h.add(new Option(i + "時台", i));
    h.value = "";
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

  /* 入力属性をシートへ送るだけ（従来どおり）。失敗しても鑑定は止めない */
  function logFree() {
    try {
      if (!LOG_ENDPOINT) return;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      var data = {
        "種別": "無料",
        "送信日時": new Date().toLocaleString("ja-JP"),
        "お名前": el("name").value.trim(),
        "生年月日": el("year").value + "-" + pad(Number(el("month").value)) + "-" + pad(Number(el("day").value)),
        "出生時刻": state.hour === null || state.hour === "" ? "" : state.hour + "時台",
        "性別": state.gender === "female" ? "女性" : "男性"
      };
      fetch(LOG_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      }).catch(function () {});
    } catch (e) { /* ログ失敗は無視 */ }
  }

  /* サーバーへ鑑定を依頼して #meishiki / #reading に流し込む。
     名前はサーバーに渡さず、返ってきた {{NAME}} をここで置換する。 */
  function fetchReading() {
    var payload = {
      year:  Number(el("year").value),
      month: Number(el("month").value),
      day:   Number(el("day").value),
      hour:  state.hour,               // null または 0〜23
      gender: state.gender
    };
    return fetch(GAS_URL, {
      method: "POST",
      /* text/plain の“単純リクエスト”にしてCORSプリフライトを避ける */
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "reading failed");
      var nm = esc(state.name || el("name").value.trim());
      el("meishiki").innerHTML = res.meishikiHtml;
      el("reading").innerHTML  = res.readingHtml.replace(/\{\{NAME\}\}/g, nm);
    });
  }

  function run() {
    logFree();
    hide("step4"); show("loading"); scrollTop();
    var i = 0;
    var timer = setInterval(function () {
      el("loadingText").textContent = LOADING[i % LOADING.length];
      i++;
    }, 420);

    var started = Date.now();
    fetchReading().then(function () {
      var wait = Math.max(0, 1400 - (Date.now() - started)); // 演出の最低表示時間
      setTimeout(function () {
        clearInterval(timer);
        hide("loading"); show("result"); scrollTop();
      }, wait);
    }).catch(function () {
      clearInterval(timer);
      el("loadingText").textContent = "通信が混み合っています。少し待って、もう一度お試しください。";
      setTimeout(function () { hide("loading"); show("step4"); scrollTop(); }, 1900);
    });
  }

  function reset() {
    hide("result"); hide("loading"); hide("step2"); hide("step3"); hide("step4");
    show("step1"); scrollTop();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDate();
    initHour();
    initGender();

    el("begin").addEventListener("click", function () {
      show("start");
      hide("step2"); hide("step3"); hide("step4"); hide("loading"); hide("result");
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

    /* 日本語入力の変換確定Enterで次へ進まないようにする */
    var composing = false;
    var composeEndedAt = 0;
    el("name").addEventListener("compositionstart", function () { composing = true; });
    el("name").addEventListener("compositionend", function () {
      composing = false;
      composeEndedAt = Date.now();
    });
    el("name").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (e.isComposing || e.keyCode === 229 || composing) return;
      if (Date.now() - composeEndedAt < 120) return;
      e.preventDefault();
      el("to2").click();
    });

    el("to3").addEventListener("click", function () {
      hide("step2"); show("step3"); scrollTop();
    });

    el("to4").addEventListener("click", function () {
      var v = el("hour").value;
      state.hour = (v === "") ? null : Number(v);
      hide("step3"); show("step4"); scrollTop();
    });

    el("again").addEventListener("click", reset);
  });
})();
