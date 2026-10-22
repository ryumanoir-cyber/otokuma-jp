// 無料鑑定の結果 → 本鑑定の案内（2026-10-23）
// 結果の一番上（要約の直後）と一番下の2か所に案内を置き、どちらが押されたかを GA4 に送る。
// 10/18 に入れた「今いちばん気になっていること」の4択は、28日で2回しか押されなかったので外した。
(function () {
  [["ctaEarly", "free_cta_top"], ["ctaLink", "free_cta_bottom"]].forEach(function (p) {
    var a = document.getElementById(p[0]);
    if (!a) return;
    a.addEventListener("click", function () {
      if (window.track) window.track(p[1], {});
    });
  });
})();
