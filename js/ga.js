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
