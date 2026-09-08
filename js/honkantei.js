/* 本鑑定ページ：購入ボタン
   STORESの商品URLが入るまでは「準備中です」と表示して押せなくする。 */
(function () {
  "use strict";

  /* STORESの商品URL。ショップを公開すると購入可能になる */
  var BUY_URL = "https://kuronouranaishi.stores.jp/items/6a9514ef6cfe534b0b89ad67";

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("buyLink");
    if (!b) return;
    if (BUY_URL) {
      b.href = BUY_URL;
    } else {
      b.href = "#";
      b.classList.add("disabled");
      b.textContent = "準備中です";
      b.removeAttribute("target");
      b.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });
})();
