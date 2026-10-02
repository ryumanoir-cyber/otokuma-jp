/* サイト共通のナビゲーション（上部に固定）。
   パソコン：上のバーに3つの診断と本鑑定を常に表示。スマホ：右上のメニューボタン（ハンバーガー）で開く。
   どの入口から来ても、無料鑑定・人生の取扱説明書・裏の顔診断・本鑑定を行き来できるようにするため。 */
(function () {
  "use strict";

  var ITEMS = [
    { href: "/", label: "無料鑑定", desc: "生年月日から、あなたがどういう人かを視る", key: "free" },
    { href: "/torisetsu/", label: "人生の取扱説明書", desc: "あなたの本質を一冊にしてお届け（無料）", key: "torisetsu" },
    { href: "/ura/", label: "裏の顔診断", desc: "24の質問で、人に隠している本性を視る", key: "ura" },
    { href: "/honkantei/", label: "本鑑定", desc: "あなたの悩みに直接お答えする（有料）", key: "paid", accent: true }
  ];

  function current() {
    var p = location.pathname;
    if (p.indexOf("/torisetsu") === 0) return "torisetsu";
    if (p.indexOf("/ura") === 0) return "ura";
    if (p.indexOf("/honkantei") === 0) return "paid";
    if (p === "/" || p === "/index.html") return "free";
    return "";
  }

  var CSS = [
    ".kn-bar{position:fixed;top:0;left:0;right:0;z-index:1000;height:54px;display:flex;align-items:center;justify-content:space-between;",
    "padding:0 16px;background:rgba(11,11,15,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid rgba(201,164,92,.35);",
    "font-family:'Hiragino Mincho ProN','Yu Mincho',YuMincho,'Noto Serif JP',serif}",
    ".kn-brand{color:#e6c98a;text-decoration:none;font-weight:700;letter-spacing:.18em;font-size:15px;white-space:nowrap}",
    ".kn-links{display:flex;gap:4px;align-items:center}",
    ".kn-links a{color:#e8e6e3;text-decoration:none;font-size:13px;letter-spacing:.06em;padding:7px 12px;border-radius:2px;white-space:nowrap}",
    ".kn-links a:hover{color:#e6c98a}",
    ".kn-links a.on{color:#e6c98a;box-shadow:inset 0 -2px 0 #c9a45c}",
    ".kn-links a.accent{border:1px solid #c9a45c;color:#e6c98a;margin-left:6px}",
    ".kn-links a.accent.on{background:#c9a45c;color:#14120e;box-shadow:none}",
    ".kn-burger{display:none;background:none;border:1px solid rgba(201,164,92,.6);width:42px;height:36px;border-radius:2px;cursor:pointer;padding:0;align-items:center;justify-content:center;flex-direction:column;gap:5px}",
    ".kn-burger span{display:block;width:18px;height:1.5px;background:#e6c98a;transition:transform .2s,opacity .2s}",
    ".kn-open .kn-burger span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}",
    ".kn-open .kn-burger span:nth-child(2){opacity:0}",
    ".kn-open .kn-burger span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}",
    ".kn-panel{position:fixed;top:54px;left:0;right:0;z-index:999;background:rgba(11,11,15,.98);border-bottom:1px solid rgba(201,164,92,.35);",
    "padding:8px 16px 18px;display:none;font-family:'Hiragino Mincho ProN','Yu Mincho',YuMincho,'Noto Serif JP',serif}",
    ".kn-open .kn-panel{display:block}",
    ".kn-panel a{display:block;text-decoration:none;color:#e8e6e3;padding:14px 4px;border-bottom:1px dotted rgba(201,164,92,.3)}",
    ".kn-panel a:last-child{border-bottom:0}",
    ".kn-panel a strong{display:block;font-size:16px;letter-spacing:.06em}",
    ".kn-panel a span{display:block;color:#9a97a3;font-size:12px;margin-top:2px}",
    ".kn-panel a.on strong{color:#e6c98a}",
    ".kn-panel a.on strong:after{content:'　（いまここ）';font-size:11px;color:#9a97a3}",
    ".kn-panel a.accent{margin-top:10px;border:1px solid #c9a45c;padding:12px 14px;border-radius:2px}",
    ".kn-panel a.accent strong{color:#e6c98a}",
    "body.kn-has{padding-top:54px}",
    "body.kn-has .progress{top:54px}",
    "@media(max-width:760px){.kn-links{display:none}.kn-burger{display:flex}}"
  ].join("");

  function build() {
    if (document.querySelector(".kn-bar")) return;
    var cur = current();
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = document.createElement("div");
    wrap.className = "kn";
    var links = ITEMS.map(function (it) {
      var cls = (it.key === cur ? "on" : "") + (it.accent ? " accent" : "");
      return '<a class="' + cls + '" href="' + it.href + '" data-kn="' + it.key + '">' + it.label + "</a>";
    }).join("");
    var panel = ITEMS.map(function (it) {
      var cls = (it.key === cur ? "on" : "") + (it.accent ? " accent" : "");
      return '<a class="' + cls + '" href="' + it.href + '" data-kn="' + it.key + '"><strong>' + it.label +
        "</strong><span>" + it.desc + "</span></a>";
    }).join("");
    wrap.innerHTML =
      '<nav class="kn-bar" aria-label="サイト内メニュー"><a class="kn-brand" href="/">黒の占い師</a>' +
      '<div class="kn-links">' + links + "</div>" +
      '<button class="kn-burger" type="button" aria-label="メニューを開く" aria-expanded="false"><span></span><span></span><span></span></button></nav>' +
      '<div class="kn-panel">' + panel + "</div>";
    document.body.insertBefore(wrap, document.body.firstChild);
    document.body.classList.add("kn-has");

    var btn = wrap.querySelector(".kn-burger");
    btn.addEventListener("click", function () {
      var open = wrap.classList.toggle("kn-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    wrap.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[data-kn]") : null;
      if (!a) return;
      wrap.classList.remove("kn-open");
      if (window.track) window.track("nav_click", { to: a.getAttribute("data-kn"), from_page: cur || location.pathname });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
