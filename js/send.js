/* フォームの送信（2026-10-04）。送ったらすぐ完了ページへ移る。
   以前は Apps Script の返事（数秒〜十数秒）を待ってから「お受けしました」を出していたが、返事の中身は読めない（no-cors）ので待つ意味がなく、
   待っている間にページを閉じる人がいた。keepalive を付けると、ページを移っても送信は最後まで続く。
   使い方：window.kuroSend(送信先URL, データ, 完了ページのURL) */
(function () {
  "use strict";
  window.kuroSend = function (endpoint, data, nextUrl) {
    // 通信が切れているときは送らずに false を返す（呼び出し側でエラーを出す）
    if (navigator.onLine === false) return false;
    var body = JSON.stringify(data);
    var moved = false;
    function go() { if (moved) return; moved = true; location.href = nextUrl; }
    var sent = false;
    try {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body
      }).then(go, go);
      sent = true;
    } catch (e) { /* keepalive に対応していない古いブラウザ */ }
    if (!sent && navigator.sendBeacon) {
      try { sent = navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain;charset=utf-8" })); } catch (e) {}
    }
    // 返事を待たずに移る（送信は keepalive で続く）。一瞬だけ間を置いて、送信の開始を確実にする
    setTimeout(go, 600);
    return true;
  };
})();
