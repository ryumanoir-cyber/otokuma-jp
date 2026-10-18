// 無料鑑定の結果 → 本鑑定の案内で「今いちばん気になっていること」を選んでもらう（2026-10-18）
// 選んだ内容に合わせた一言を出し、本鑑定へのリンクに topic を付ける。GA4 には free_topic で送る。
(function () {
  var box = document.getElementById("topicPick");
  if (!box) return;
  var answer = document.getElementById("topicAnswer");
  var cta = document.getElementById("ctaLink");
  var TEXT = {
    love: "この人でいいのか。待つのか、動くのか。\n本鑑定では、ご相談の状況を読んだ上で、どちらかを選んでお答えします。「両方に良さがあります」とは書きません。",
    work: "続けるのか、変えるのか。動くなら、いつがいいのか。\n本鑑定では、あなたが何で消耗しやすい人なのかから読んで、次の一手をお答えします。",
    people: "離れるのか、付き合い方を変えるのか。\n本鑑定では、なぜ同じ相手で同じことが起きるのかを、あなたの側から読んでお答えします。",
    self: "同じところで、何度もつまずいてしまう。\n本鑑定では、その理由と、そこから抜ける順番をお答えします。"
  };
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-topic]");
    if (!b) return;
    var t = b.getAttribute("data-topic");
    box.querySelectorAll("button[data-topic]").forEach(function (x) {
      x.classList.toggle("on", x === b);
    });
    answer.textContent = TEXT[t] || "";
    answer.hidden = false;
    if (cta) {
      var u = new URL(cta.getAttribute("href"), location.href);
      u.searchParams.set("topic", t);
      cta.setAttribute("href", u.pathname + u.search);
    }
    if (window.track) window.track("free_topic", { topic: t });
  });
})();
