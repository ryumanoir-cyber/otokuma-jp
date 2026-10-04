/* ほかのページへの案内（2026-10-04）。無料鑑定・裏の顔診断・あなた自身の取扱説明書を互いに行き来してもらい、本鑑定（有料）も案内する。
   置き方：<div class="kn-cross" data-here="free|ura|torisetsu" data-from="◯◯" data-paid="1"></div> と、このファイルを読み込む。
   - data-here：今いるページ（このページへの案内は出さない）
   - data-from：リンクに付ける ?from= の値（GA4 と鑑定数値シートの流入元に残る）。裏の顔診断→無料鑑定は ?from=ura（無料鑑定側の計測と合わせる）
   - data-paid="1"：本鑑定の案内も出す（すぐ上に本鑑定の案内があるページでは付けない）
   クリックは GA4 に cross_click（from・to）で送る。 */
(function () {
  "use strict";

  var ITEMS = {
    free: { href: "/", label: "無料鑑定", desc: "生年月日から、あなたがどういう人かを、その場で視ます。", btn: "無料鑑定を受ける" },
    ura: { href: "/ura/", label: "裏の顔診断", desc: "5分で、人に隠している本性を視ます。", btn: "裏の顔を診断する" },
    torisetsu: { href: "/torisetsu/", label: "あなた自身の取扱説明書", desc: "一生使える、あなた自身の取扱説明書を作ってます。一人ひとりに合わせて、無料で作ります。", btn: "取扱説明書を受け取る" }
  };
  var ORDER = ["free", "ura", "torisetsu"];

  var CSS = [
    ".kn-cross{max-width:560px;margin:40px auto 8px;padding:0 4px;font-family:'Hiragino Mincho ProN','Yu Mincho',YuMincho,'Noto Serif JP',serif;color:#e8e6e3;text-align:left}",
    ".kn-cross-h{text-align:center;color:#e6c98a;letter-spacing:.12em;font-size:15px;margin:0 0 14px}",
    ".kn-card{display:block;border:1px solid rgba(201,164,92,.55);border-radius:4px;padding:16px 16px 14px;margin:0 0 12px;background:rgba(255,255,255,.02);text-decoration:none;color:inherit}",
    ".kn-card:hover{border-color:#e6c98a}",
    ".kn-card-t{display:block;color:#e6c98a;font-weight:700;letter-spacing:.08em;font-size:16px;margin:0 0 6px}",
    ".kn-card-d{display:block;font-size:14px;line-height:1.7;margin:0 0 12px;color:#d9d6d0}",
    ".kn-card-b{display:inline-block;border:1px solid #c9a45c;color:#e6c98a;font-size:14px;letter-spacing:.08em;padding:8px 16px;border-radius:2px}",
    ".kn-paid{border:1px solid #c9a45c;border-radius:4px;padding:20px 16px;margin:22px 0 0;text-align:center;background:linear-gradient(180deg,rgba(201,164,92,.10),rgba(201,164,92,.02))}",
    ".kn-paid-k{color:#c9a45c;font-size:12px;letter-spacing:.3em;margin:0 0 6px}",
    ".kn-paid-t{color:#e6c98a;font-size:18px;font-weight:700;letter-spacing:.06em;margin:0 0 10px;line-height:1.6}",
    ".kn-paid-d{font-size:14px;line-height:1.8;margin:0 0 12px;color:#d9d6d0}",
    ".kn-paid-p{font-size:15px;margin:0 0 12px;color:#e8e6e3;letter-spacing:.06em}",
    ".kn-paid-b{display:inline-block;background:#c9a45c;color:#14120e;text-decoration:none;font-weight:700;letter-spacing:.1em;padding:12px 26px;border-radius:2px}",
    ".kn-paid-n{font-size:12px;color:#a9a49b;margin:12px 0 0;line-height:1.7}"
  ].join("");

  function url(href, from) { return from ? href + "?from=" + encodeURIComponent(from) : href; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render(box) {
    var here = box.getAttribute("data-here") || "";
    var from = box.getAttribute("data-from") || "";
    var paid = box.getAttribute("data-paid") === "1";
    var html = '<p class="kn-cross-h">こちらも、無料で視られます</p>';
    ORDER.forEach(function (k) {
      if (k === here) return;
      var it = ITEMS[k];
      var f = (here === "ura" && k === "free") ? "ura" : from;
      html += '<a class="kn-card" data-to="' + k + '" href="' + esc(url(it.href, f)) + '">' +
        '<span class="kn-card-t">' + esc(it.label) + '</span>' +
        '<span class="kn-card-d">' + esc(it.desc) + '</span>' +
        '<span class="kn-card-b">' + esc(it.btn) + '</span></a>';
    });
    if (paid) {
      html += '<div class="kn-paid">' +
        '<p class="kn-paid-k">本鑑定</p>' +
        '<p class="kn-paid-t">あなたの悩みそのものに、<br>私が直接お答えします。</p>' +
        '<p class="kn-paid-d">ご相談内容から、一人ずつ私が直接鑑定してお届けします。</p>' +
        '<p class="kn-paid-p">本鑑定　5,980円</p>' +
        '<a class="kn-paid-b" data-to="paid" href="' + esc(url("/honkantei/", from)) + '">本鑑定を見てみる</a>' +
        '<p class="kn-paid-n">甘いことは書きません。それでも構わない方だけ、お進みください。</p></div>';
    }
    box.innerHTML = html;
    box.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[data-to]") : null;
      if (a && window.track) window.track("cross_click", { from: from || here, to: a.getAttribute("data-to") });
    });
  }

  function init() {
    var boxes = document.querySelectorAll(".kn-cross");
    if (!boxes.length) return;
    if (!document.getElementById("kn-cross-css")) {
      var st = document.createElement("style"); st.id = "kn-cross-css"; st.textContent = CSS; document.head.appendChild(st);
    }
    for (var i = 0; i < boxes.length; i++) render(boxes[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
