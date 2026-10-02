/* Googleアナリティクス（GA4, noir.xad のアカウント）。全ページの <head> で読み込む。
   ボタンなどの計測は window.track("イベント名", {...}) で送る。手元のプレビューでは送らない。 */
(function () {
  var ID = "G-5L59YMPQVM";
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  window.track = function (name, params) {
    try { gtag("event", name, params || {}); } catch (e) {}
  };
  if (location.hostname !== "otokuma-jp.com") return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", ID);
})();

/* 動線をまたいで同じ人を見分けるための訪問者ID（ランダムな文字列。名前などの個人情報は含まない）。
   最初に来た経路（?from= か、外部サイトからの流入元）も一度だけ記録する。
   無料鑑定・取扱説明書・本鑑定のフォーム送信時に、スプレッドシートへ一緒に送る。 */
(function () {
  var empty = function () { return { id: "", src: "" }; };
  try {
    var ls = window.localStorage;
    var vid = ls.getItem("kuro_vid");
    if (!vid) {
      vid = Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
      ls.setItem("kuro_vid", vid);
    }
    if (!ls.getItem("kuro_src")) {
      var from = (location.search.match(/[?&]from=([\w-]+)/) || [])[1];
      var ref = "";
      try {
        var h = document.referrer ? new URL(document.referrer).hostname : "";
        if (h && h.indexOf("otokuma-jp.com") < 0) ref = h;
      } catch (e) {}
      ls.setItem("kuro_src", (from || ref || "直接") + " → " + location.pathname);
    }
    window.kuroVisitor = function () {
      return { id: ls.getItem("kuro_vid") || "", src: ls.getItem("kuro_src") || "" };
    };
  } catch (e) {
    window.kuroVisitor = empty;
  }
})();
