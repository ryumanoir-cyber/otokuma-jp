/* 本鑑定ページ：購入ボタン
   STORESの商品URLが入るまでは「準備中です」と表示して押せなくする。 */
(function () {
  "use strict";

  /* STORESの商品URL。ショップを公開すると購入可能になる */
  var BUY_URL = "https://kuronouranaishi.stores.jp/items/6a9514ef6cfe534b0b89ad67";

  /* どこから来たか（2026-11-13）。GA4 の標準レポートでは ?from= が見えないので、イベント名に入れて送る。
     honkantei_view_<経路>／honkantei_buy_seen_<経路>／honkantei_buy_<経路>。
     経路：free_result（無料鑑定の結果の下）・free_result_top（結果のすぐ下）・ura_result・torisetsu_report など。
     ?from= が無いときは、サイト内から来たら site、それ以外は direct。 */
  var KNOWN = ["free_result", "free_result_top", "ura_result", "torisetsu_report", "free", "ura", "torisetsu",
               "threads", "threads_pin", "ig", "x", "x_pin", "yt", "tiktok"];
  function source() {
    var f = (location.search.match(/[?&]from=([\w-]+)/) || [])[1] || "";
    if (f) return KNOWN.indexOf(f) >= 0 ? f : "other";
    try {
      var h = document.referrer ? new URL(document.referrer).hostname : "";
      if (h.indexOf("otokuma-jp.com") >= 0) return "site";
    } catch (e) {}
    return "direct";
  }
  var SRC = source();
  function send(name) { if (window.track) window.track(name, { from: SRC }); }

  document.addEventListener("DOMContentLoaded", function () {
    send("honkantei_view_" + SRC);

    var b = document.getElementById("buyLink");
    if (!b) return;
    if (BUY_URL) {
      b.href = BUY_URL;
      b.addEventListener("click", function () {
        send("honkantei_buy_click");
        send("honkantei_buy_" + SRC);
      });
      /* 購入ボタンまで読んだか */
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            send("honkantei_buy_seen");
            send("honkantei_buy_seen_" + SRC);
            io.disconnect();
          });
        }, { threshold: 0.5 });
        io.observe(b);
      }
    } else {
      b.href = "#";
      b.classList.add("disabled");
      b.textContent = "準備中です";
      b.removeAttribute("target");
      b.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });
})();
