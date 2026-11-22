/* 無料鑑定の結果を読み終えたら、次の鑑定へ自動で進む（2026-11-14・本人指示「Netflix のように、押さなくても次へ進む」）
   動画配信の「次のエピソードまで◯秒」と同じ作り：
   - 結果の一番下（ほかの鑑定の案内）まで来たら、画面の下に「次の鑑定」のカードを出して 10 秒数える
   - 数え終わると自動で次の鑑定へ移る。「今すぐ進む」ですぐ移る。「ここに残る」でやめる
   - 上へ読み戻した・本鑑定のボタンを押した・やり直した ときは自動でやめる（読んでいる人を連れ去らない）
   - 1回の結果につき出すのは1回だけ
   次の鑑定：取扱説明書（2026-11-23〜全員。それまでは裏の顔診断・裏の顔診断から来た人だけ取扱説明書）。
   計測：free_auto_show / free_auto_go（数え終わって移動）/ free_auto_now（今すぐ）/ free_auto_cancel（理由つき） */
(function () {
  "use strict";
  var SEC = 10;
  var NEXT = {
    ura: { href: "/ura/?from=free_auto", label: "裏の顔診断", desc: "3分で、人に隠している本性を視ます。" },
    torisetsu: { href: "/torisetsu/?from=free_auto", label: "あなた自身の取扱説明書", desc: "あなたの扱い方を、一冊にまとめます。" }
  };

  var result = document.getElementById("result");
  var anchor = document.querySelector("#result .kn-cross");
  if (!result || !anchor || !("IntersectionObserver" in window)) return;

  var css = [
    ".an{position:fixed;left:0;right:0;bottom:0;z-index:60;padding:0 14px calc(14px + env(safe-area-inset-bottom));pointer-events:none;",
    "transform:translateY(110%);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}",
    ".an.on{transform:none;opacity:1}",
    ".an-in{pointer-events:auto;max-width:520px;margin:0 auto;background:#15151c;border:1px solid #8b7647;border-radius:4px;",
    "box-shadow:0 14px 44px rgba(0,0,0,.6);overflow:hidden;font-family:inherit}",
    ".an-bar{height:3px;background:#26262f}.an-bar i{display:block;height:100%;width:0;background:#b9a06a}",
    ".an-row{display:flex;align-items:center;gap:14px;padding:16px 16px 6px}",
    ".an-ring{flex:none;position:relative;width:52px;height:52px}",
    ".an-ring svg{width:52px;height:52px;transform:rotate(-90deg)}",
    ".an-ring circle{fill:none;stroke-width:3}",
    ".an-ring .bg{stroke:#2e2e38}.an-ring .fg{stroke:#b9a06a;stroke-linecap:round}",
    ".an-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#e8e6e3;font-size:19px;font-weight:400}",
    ".an-tx{min-width:0;text-align:left}",
    ".an-k{color:#b9a06a;font-size:11px;letter-spacing:.24em;margin:0 0 4px}",
    ".an-t{color:#e8e6e3;font-size:17px;letter-spacing:.06em;margin:0 0 3px;line-height:1.4}",
    ".an-d{color:#9a97a3;font-size:12px;margin:0;line-height:1.6}",
    ".an-btns{display:flex;gap:10px;padding:10px 16px 16px}",
    ".an-go{flex:1;display:block;text-align:center;background:#b9a06a;color:#0b0b0f;text-decoration:none;font-size:14px;letter-spacing:.12em;padding:13px 10px;border-radius:2px}",
    ".an-stay{flex:none;background:none;border:1px solid #33333d;color:#9a97a3;font-size:13px;letter-spacing:.06em;padding:13px 16px;border-radius:2px;cursor:pointer;font-family:inherit}",
    ".an-stay:hover{color:#e8e6e3;border-color:#55555f}",
    "@media(prefers-reduced-motion:reduce){.an{transition:none}}"
  ].join("");

  var box, ring, num, bar, left, timer = null, started = 0, done = false, shown = false, topAtShow = 0, target;

  function pick() {
    var src = "";
    try { src = (window.kuroVisitor ? window.kuroVisitor().src : "") || ""; } catch (e) {}
    var f = (location.search.match(/[?&]from=([\w-]+)/) || [])[1] || "";
    // 2026-11-23 本人指示：次の鑑定は全員、取扱説明書（本鑑定につながった実績があるため。裏の顔診断へは自動で送らない）
    return NEXT.torisetsu;
  }
  function track(name, p) { if (window.track) window.track(name, p || {}); }

  function build() {
    if (!document.getElementById("an-css")) {
      var st = document.createElement("style"); st.id = "an-css"; st.textContent = css; document.head.appendChild(st);
    }
    target = pick();
    box = document.createElement("div"); box.className = "an"; box.setAttribute("role", "status");
    var C = 2 * Math.PI * 23;
    box.innerHTML =
      '<div class="an-in"><div class="an-bar"><i></i></div>' +
      '<div class="an-row"><div class="an-ring"><svg viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="23"/>' +
      '<circle class="fg" cx="26" cy="26" r="23" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="0"/></svg><b>' + SEC + '</b></div>' +
      '<div class="an-tx"><p class="an-k">次の鑑定</p><p class="an-t"></p><p class="an-d"></p></div></div>' +
      '<div class="an-btns"><a class="an-go" href="#">今すぐ進む</a><button type="button" class="an-stay">ここに残る</button></div></div>';
    box.querySelector(".an-t").textContent = target.label;
    box.querySelector(".an-d").innerHTML = "";
    box.querySelector(".an-d").appendChild(document.createTextNode(target.desc));
    box.querySelector(".an-d").appendChild(document.createElement("br"));
    left = document.createElement("span"); left.textContent = SEC + "秒後に自動で進みます";
    box.querySelector(".an-d").appendChild(left);
    box.querySelector(".an-go").href = target.href;
    ring = box.querySelector(".fg"); num = box.querySelector(".an-ring b"); bar = box.querySelector(".an-bar i");
    box.querySelector(".an-go").addEventListener("click", function () { stop(); mark(); done = true; track("free_auto_now", { to: target.label }); });
    box.querySelector(".an-stay").addEventListener("click", function () { cancel("stay"); });
    document.body.appendChild(box);
  }

  function tick() {
    var t = (Date.now() - started) / 1000, rest = Math.max(0, SEC - t), C = 2 * Math.PI * 23;
    num.textContent = Math.ceil(rest);
    if (left) left.textContent = Math.ceil(rest) + "秒後に自動で進みます";
    ring.setAttribute("stroke-dashoffset", (C * (t / SEC)).toFixed(1));
    bar.style.width = Math.min(100, t / SEC * 100) + "%";
    if (rest <= 0) { stop(); mark(); done = true; track("free_auto_go", { to: target.label }); location.href = target.href; }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function seen() { try { return sessionStorage.getItem("kuro_auto") === "1"; } catch (e) { return false; } }
  function mark() { try { sessionStorage.setItem("kuro_auto", "1"); } catch (e) {} }
  function show() {
    if (shown || done || seen()) return;
    shown = true; build();
    topAtShow = window.pageYOffset;
    requestAnimationFrame(function () { box.classList.add("on"); });
    started = Date.now(); timer = setInterval(tick, 100);
    track("free_auto_show", { to: target.label });
  }
  function cancel(why) {
    if (done) return; done = true; stop();
    if (box) { box.classList.remove("on"); setTimeout(function () { if (box && box.parentNode) box.parentNode.removeChild(box); }, 500); }
    if (shown) track("free_auto_cancel", { why: why });
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !result.classList.contains("hidden")) { show(); io.disconnect(); }
    });
  }, { threshold: 0.5 });
  io.observe(anchor);

  /* 読み戻したらやめる */
  window.addEventListener("scroll", function () {
    if (shown && !done && window.pageYOffset < topAtShow - 240) cancel("scroll_up");
  }, { passive: true });
  /* 本鑑定のボタン・ほかの案内・やり直し を押したらやめる */
  result.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a,button") : null;
    if (a && shown && !done) cancel(a.id === "again" ? "again" : "other_link");
  });
  /* 画面を離れている間は数えない（戻ってきたら最初から数え直す） */
  document.addEventListener("visibilitychange", function () {
    if (!shown || done) return;
    if (document.hidden) stop(); else { started = Date.now(); if (!timer) timer = setInterval(tick, 100); }
  });
  /* 「戻る」でこのページに帰ってきたときは、もう数えない（また連れて行かれる輪にならないように）。
     一度自動で進んだら、同じタブではもう出さない（sessionStorage の kuro_auto） */
  window.addEventListener("pageshow", function (e) {
    if (e.persisted || seen()) { stop(); done = true; if (box && box.parentNode) box.parentNode.removeChild(box); }
  });
  /* やり直したら、次の結果でまた1回出せるようにする */
  var again = document.getElementById("again");
  if (again) again.addEventListener("click", function () {
    setTimeout(function () { if (seen()) return; shown = false; done = false; box = null; io.observe(anchor); }, 600);
  });
})();
