/* サイト共通のナビゲーション（上部に固定）と、ページ下のフッター。
   パソコン：上のバーに3つの診断と本鑑定を常に表示。スマホ：右上のメニューボタン（ハンバーガー）で開く。
   どの入口から来ても、無料鑑定・人生の取扱説明書・裏の顔診断・本鑑定を行き来できるようにするため。 */
(function () {
  "use strict";

  var ITEMS = [
    { href: "/", label: "無料鑑定", desc: "生年月日から、あなたがどういう人かを視る", key: "free" },
    { href: "/ura/", label: "裏の顔診断", desc: "5分で、人に隠している本性を視る", key: "ura" },
    { href: "/torisetsu/", label: "あなた自身の取扱説明書", desc: "あなたの本質を一冊にしてお届け（無料）", key: "torisetsu" },
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


  /* ページ下のフッター。各ページにあった簡単なフッターを、これに置き換える（無ければ最後に足す）。
     SNSはアイコンで並べ、タップでそのアカウントへ。アイコンの形は Simple Icons（CC0） */
  var SNS = [
    { key: "x", label: "X", href: "https://x.com/kurono_uranai", d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
    { key: "threads", label: "Threads", href: "https://www.threads.com/@kurono_uranai", d: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" },
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/kurono_uranai/", d: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@kuro_uranai", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
    { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@kurono_uranai", d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" }
  ];

  var FCSS = [
    ".kf{border-top:1px solid rgba(201,164,92,.35);background:#0b0b0f;padding:40px 16px 48px;text-align:center;",
    "font-family:'Hiragino Mincho ProN','Yu Mincho',YuMincho,'Noto Serif JP',serif;margin-top:40px}",
    ".kf-name{color:#e6c98a;letter-spacing:.3em;font-size:14px;margin:0 0 22px}",
    ".kf-sns{display:flex;justify-content:center;gap:14px;margin:0 0 26px;flex-wrap:wrap}",
    ".kf-sns a{width:44px;height:44px;border:1px solid rgba(201,164,92,.55);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s}",
    ".kf-sns a:hover{background:rgba(201,164,92,.15)}",
    ".kf-sns svg{width:19px;height:19px;fill:#e6c98a}",
    ".kf-menu{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 16px;max-width:360px;margin:0 auto 24px}",
    ".kf-menu a{color:#e8e6e3;font-size:13px;text-decoration:none;letter-spacing:.04em;padding:4px 0}",
    ".kf-menu a:hover{color:#e6c98a}",
    ".kf-sub a{color:#9a97a3;font-size:12px;text-decoration:none;border-bottom:1px solid rgba(154,151,163,.4)}",
    ".kf-copy{color:#55525c;font-size:11.5px;margin:18px 0 0}",
    "@media(min-width:640px){.kf-menu{grid-template-columns:repeat(4,auto);justify-content:center;gap:10px 28px;max-width:none}}"
  ].join("");

  function buildFooter() {
    if (document.querySelector(".kf")) return;
    var style = document.createElement("style");
    style.textContent = FCSS;
    document.head.appendChild(style);
    var f = document.createElement("footer");
    f.className = "kf";
    f.innerHTML =
      '<p class="kf-name">黒の占い師</p>' +
      '<div class="kf-sns">' + SNS.map(function (s) {
        return '<a href="' + s.href + '" target="_blank" rel="noopener" aria-label="' + s.label + '" title="' + s.label +
          '" data-kf="' + s.key + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + s.d + '"/></svg></a>';
      }).join("") + "</div>" +
      '<nav class="kf-menu" aria-label="サイト内のページ">' + ITEMS.map(function (it) {
        return '<a href="' + it.href + '" data-kf="' + it.key + '">' + it.label + "</a>";
      }).join("") + "</nav>" +
      '<p class="kf-sub"><a href="/policy/">プライバシーポリシー・免責事項</a></p>' +
      '<p class="kf-copy">&copy; 黒の占い師</p>';
    var old = document.querySelectorAll("footer:not(.kf)");
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
    document.body.appendChild(f);
    f.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[data-kf]") : null;
      if (a && window.track) window.track("footer_click", { to: a.getAttribute("data-kf"), from_page: current() || location.pathname });
    });
  }

  function init() { build(); buildFooter(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
