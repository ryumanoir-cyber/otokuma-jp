/* 黒の占い師 — 無料鑑定フロー（クライアント・薄い版）
   鑑定ロジックと本文はサーバー(GAS)側にある。ここは
   「入力を集める → GASへ送る → 返ってきた完成HTMLを表示する」だけ。
   命式計算(meishiki)も本文(reading)もブラウザには含めない＝流出しない。 */
(function () {
  "use strict";

  /* 無料鑑定サーバー（Cloudflare Worker）。CORS対応なので普通の fetch(GET) で読める。 */
  var WORKER_URL = "https://kurono-free-reading.noir-xad.workers.dev";

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

  var LOADING = ["視ています", "視ています．", "視ています．．", "視ています．．．"];

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
      var vis = window.kuroVisitor ? window.kuroVisitor() : { id: "", src: "" };
      data["訪問者ID"] = vis.id;
      data["流入元"] = vis.src;
      fetch(LOG_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      }).catch(function () {});
    } catch (e) { /* ログ失敗は無視 */ }
  }

  /* サーバー(Cloudflare Worker)へ鑑定を依頼して #meishiki / #reading に流し込む。
     WorkerはCORSを返すので普通のfetch(GET)でOK。名前はサーバーに渡さず {{NAME}} をここで置換。 */
  function fetchReadingOnce() {
    var q = "?year="   + encodeURIComponent(el("year").value)
          + "&month="  + encodeURIComponent(el("month").value)
          + "&day="    + encodeURIComponent(el("day").value)
          + "&hour="   + encodeURIComponent(state.hour == null ? "" : state.hour)
          + "&gender=" + encodeURIComponent(state.gender)
          + "&v=2"; /* 文面を変えたら上げる（ブラウザに残った古い結果を使わせない） */
    return fetch(WORKER_URL + q, { method: "GET" }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "reading failed");
      var nm = esc(state.name || el("name").value.trim());
      el("meishiki").innerHTML = res.meishikiHtml;
      addSummary(el("meishiki"));
      el("reading").innerHTML  = foldReading(res.readingHtml.replace(/\{\{NAME\}\}/g, nm));
    });
  }

  /* FOLD-START
     2026-11-23（本人OK）：章を「開く」で開く折りたたみにする。サーバーの返事（<h3>番号　題</h3>＋本文）を
     章ごとに <details> に包み直すだけで、文は変えない。1章（本質）の下にだけ小さな本鑑定の案内を置く。 */
  var MID_CTA = '<div class="kn-mid"><p>ここまで読んで思い当たることがあるなら、今の悩みも同じ所から来ています。</p>' +
    '<a href="/honkantei/?from=free_result_mid" class="btn-primary" id="ctaMid">本鑑定で、悩みに答えてもらう</a></div>';
  function foldReading(html) {
    var parts = String(html).split("<h3>");
    if (parts.length < 2) return html;
    var out = parts[0];
    for (var i = 1; i < parts.length; i++) {
      var j = parts[i].indexOf("</h3>");
      if (j < 0) { out += "<h3>" + parts[i]; continue; }
      var title = parts[i].slice(0, j), body = parts[i].slice(j + 5);
      var m = title.match(/^(\d+)[\s　]+([\s\S]*)$/);
      out += '<details class="ch"><summary><span class="no">' + (m ? m[1] : "") + '</span><span class="tt">' +
        (m ? m[2] : title) + '</span></summary><div class="ch-body">' + body + (i === 1 ? MID_CTA : "") + "</div></details>";
    }
    return out;
  }
  /* FOLD-END */

  /* 2026-11-23（本人OK）：結果の一番上に5行の要約を置く。本質（10通り）だけで決まる本文から拾った文なので、
     同じ本質の人なら誰が見ても本文と食い違わない。●良い所3つ・○気をつけること2つ。
     正本：Project/threads-kurono-uranai/docs/mock/build_summaries_10.py（直したらここも同じに直す） */
  var SUMMARY = {
"大樹": [
"一度決めたら、まっすぐ進める。",
"筋を通すので、時間はかかっても信頼される。",
"成果がはっきり形に出る場所なら、誰より早く着く。",
"その代わり、引き返せる所で引き返さない。",
"回り道ができず、合わない場所では何年も止まる。"
],
"草花": [
"誰とでも合わせられて、最後まで折れずに残る。",
"人と人の間に立つと、力が出る。",
"良い相手と組めば、自分だけでは届かない所まで行ける。",
"その代わり、合わせすぎて自分の希望が分からなくなる。",
"頼まれると断れず、雑用まで集まる。"
],
"太陽": [
"隠さないから、人が集まってくる。",
"人を巻き込んで、物事を始める力が強い。",
"褒められる場所では、驚くほど伸びる。",
"その代わり、飽きると途中で手が止まる。",
"機嫌も本音も顔に出て、損をすることがある。"
],
"灯火": [
"一度火がつくと、静かに長く続けられる。",
"一つのことを深く掘って、人に真似できないものを積み上げる。",
"人が本当に困ったときに、頼りにされる。",
"その代わり、終わったことを手放せない。",
"言わずに察してほしくて、一人で傷つく。"
],
"山": [
"周りが慌てていても、動じない。",
"任されると本領を出し、長く信頼を積める。",
"一度始まった関係を、長く大事にする。",
"その代わり、動くべき時に動かず、先延ばしにする。",
"気にしていても表に出さず、一人で溜め込む。"
],
"田畑": [
"人を育てること、支えることで、一番力が出る。",
"何でも受け止められるので、人に頼られる。",
"良い人に囲まれると、周りごと豊かにできる。",
"その代わり、断れずに、要らないものまで抱える。",
"自分のことは、誰にも相談しない。"
],
"刀": [
"要るものと要らないものを、はっきり分けられる。",
"誰かが嫌われ役をやる場面で、迷わず決められる。",
"厳しい場所ほど鍛えられて、強くなる。",
"その代わり、正しさで人を追い詰めてしまう。",
"判断が速すぎて、惜しいものまで切る。"
],
"宝石": [
"細かいところに気がつき、質の高いものを作れる。",
"良いものを見分ける目が確か。",
"削られるほど磨かれて、後から光る。",
"その代わり、完璧に整うまで動けない。",
"傷ついても平気な顔をして、一人で考え込む。"
],
"大河": [
"変化のある場所で、力が一番出る。",
"誰とでもすぐ打ち解けられる。",
"いくつものことを同時に回せる。",
"その代わり、終わらせる前に次へ行ってしまう。",
"自由でいたいのに寂しがりで、関係が中途半端になる。"
],
"雨": [
"人の気持ちや場の空気に、誰より早く気づく。",
"言われる前に、相手の望みを先回りできる。",
"人の内側を扱う仕事で、深く力を出せる。",
"その代わり、人の感情まで背負って疲れる。",
"言わずに溜めて、限界が来ると黙って離れる。"
]
};
  function addSummary(box) {
    var s = box.querySelector(".meishiki-note strong");
    var lines = s ? SUMMARY[(s.textContent || "").trim()] : null;
    if (!lines) return;
    var ul = document.createElement("ul");
    ul.className = "kn-sum";
    lines.forEach(function (t, i) {
      var li = document.createElement("li");
      if (i >= 3) li.className = "warn";
      li.textContent = t;
      ul.appendChild(li);
    });
    var label = box.querySelector(".meishiki-label");
    if (label && label.nextSibling) box.insertBefore(ul, label.nextSibling); else box.appendChild(ul);
  }

  /* 失敗時は少し待って最大3回まで試す（GAS・回線の一時的な不調対策） */
  function fetchReading() {
    var attempts = 0;
    function attempt() {
      attempts++;
      return fetchReadingOnce().catch(function (e) {
        if (attempts >= 3) throw e;
        return new Promise(function (r) { setTimeout(r, 700); }).then(attempt);
      });
    }
    return attempt();
  }

  /* 計測（js/ga.js）。裏の顔診断から来た人は ?from=ura が付いている */
  var FROM = (location.search.match(/[?&]from=([\w-]+)/) || [])[1] || "";
  function track(name) {
    if (!window.track) return;
    window.track(name, { from: FROM || "direct" });
    if (FROM === "ura") window.track("ura_" + name);
  }

  function run() {
    logFree();
    track("free_submit");
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
        track("free_result");
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
      track("free_start");
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
