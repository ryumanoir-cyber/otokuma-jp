// 無料鑑定の結果 → 本鑑定の案内（2026-10-23）
// 結果の一番上（要約の直後）と一番下の2か所に案内を置き、どちらが押されたかを GA4 に送る。
// 10/18 に入れた「今いちばん気になっていること」の4択は、28日で2回しか押されなかったので外した。
// 2026-11-13：案内が「見られていない」のか「見られたが押されない」のかを分けるため、
//   画面に入った時（free_cta_top_seen / free_cta_bottom_seen）も1回ずつ送る。
(function () {
  // 2026-11-23：上の案内（ctaEarly）はなくした（本人「いきなり来ると困る」）。代わりに1章（本質）の下に小さな案内（ctaMid → free_cta_mid）。
  //   ctaMid は結果が出てから差し込まれるので、#reading の中身が変わるたびに探してつなぐ。
  function hook(p) {
    var a = document.getElementById(p[0]);
    if (!a || a.getAttribute("data-hooked")) return;
    a.setAttribute("data-hooked", "1");
    a.addEventListener("click", function () {
      if (window.track) window.track(p[1], {});
    });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (window.track) window.track(p[1] + "_seen", {});
        io.disconnect();
      });
    }, { threshold: 0.5 });
    io.observe(a);
  }
  var LIST = [["ctaMid", "free_cta_mid"], ["ctaLink", "free_cta_bottom"]];
  LIST.forEach(hook);
  var rd = document.getElementById("reading");
  if (rd && "MutationObserver" in window) new MutationObserver(function () { LIST.forEach(hook); }).observe(rd, { childList: true });
})();

// 2026-11-14：下の案内の1文を、その人の型に合わせる（本人OK）。
// 結果の上に出る「あなたの本質は◯◯です」の語から型を読み、「まだお伝えできていないこと」を1つ置く。
// 文は、その型の「気をつけること」（本文）に書いた落とし穴を、今の状況に当てはめたもの。新しい占いの内容は足していない。
// 型が読み取れないときは、元の文のまま。文案と確認：Project/threads-kurono-uranai/docs/free_reading_ending_draft_2026-11-14.md
(function () {
  var Q = {
    "大樹": "今あなたが意地で続けているものを、どこで引き返すか。",
    "草花": "今あなたが合わせているものの中で、何を譲らずにおくか。",
    "太陽": "今あなたが抱えているもののうち、どれを先に終わらせるか。",
    "灯火": "今あなたが手放せずにいるものを、どう終わらせるか。",
    "山":   "今あなたが先延ばしにしているもののうち、どれから動くか。",
    "田畑": "今あなたが引き受けているもののうち、どれを断るか。",
    "刀":   "今あなたが切ろうとしているものを、切っていいかどうか。",
    "宝石": "今あなたが出せずにいるものを、どの形で出すか。",
    "大河": "今あなたが手を離しかけているものを、どう終わらせて次へ行くか。",
    "雨":   "今あなたが言えずに溜めていることを、誰に、どう言うか。"
  };
  var box = document.getElementById("meishiki");
  var lead = document.getElementById("ctaLead");
  var body = document.getElementById("ctaBody");
  if (!box || !lead || !body || !("MutationObserver" in window)) return;
  var lead0 = lead.innerHTML, body0 = body.innerHTML;

  function apply() {
    var s = box.querySelector(".meishiki-note strong");
    var q = s ? Q[(s.textContent || "").trim()] : "";
    if (!q) { lead.innerHTML = lead0; body.innerHTML = body0; return; }
    lead.innerHTML = "今お伝えしたのは、あなたが「どういう人か」までです。<br>" + q + "<br>そこまでは、まだお伝えできていません。";
    body.innerHTML = "それは、あなたが今何を抱えているかを伺わないと、視えないからです。<br>" +
      "本鑑定では悩みを伺った上で、あなたの生まれ持ったものを一つずつ読んで、私が直接答えています。";
  }
  new MutationObserver(apply).observe(box, { childList: true, subtree: true });
  apply();
})();
