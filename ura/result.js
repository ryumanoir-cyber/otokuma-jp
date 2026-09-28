(function () {
  var body = document.body, code = body.dataset.code, name = body.dataset.name;
  var p = new URLSearchParams(location.search);
  var m = parseInt(p.get("m"), 10), a = (p.get("a") || "").split("-").map(Number);
  var mine = !isNaN(m) && a.length === 4 && a.every(function (x) { return x >= 50 && x <= 100; });
  var url = location.origin + location.pathname;

  if (mine) {
    document.getElementById("kicker").textContent = "あなたの裏の顔は";
    document.getElementById("mine").hidden = false;

    var band = window.URA_MASK.filter(function (b) { return m >= b.min; }).pop();
    document.getElementById("maskLabel").textContent = band.label;
    document.getElementById("maskText").textContent = band.text;

    var ring = document.querySelector(".ring-fg"), num = document.getElementById("maskNum");
    requestAnimationFrame(function () { ring.style.strokeDashoffset = 327 * (1 - m / 100); });
    var t0 = null;
    (function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      num.textContent = Math.round(m * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(performance.now());

    document.getElementById("axes").innerHTML = window.URA_AXES.map(function (ax, i) {
      var leftWin = code[i] === ax.l, pct = a[i];
      var style = leftWin ? "left:0;width:" + pct + "%" : "right:0;width:" + pct + "%";
      return '<div class="axis"><div class="axis-head"><span>' + ax.label + "</span><b>" + (leftWin ? ax.ln : ax.rn) + " " + pct + "%</b></div>" +
        '<div class="axis-bar"><i style="' + style + '"></i></div>' +
        '<div class="axis-foot"><span class="' + (leftWin ? "win" : "") + '">' + ax.ln + '</span><span class="' + (leftWin ? "" : "win") + '">' + ax.rn + "</span></div></div>";
    }).join("");
  } else {
    // 人のシェアから来た人：自分の結果が無いので、まず診断へ誘う
    document.getElementById("share").innerHTML =
      '<a class="btn-start" href="../../">あなたの裏の顔を診断する<small>全24問・約3分</small></a>';
  }

  var text = "私の裏の顔は【" + name + "】だった。\n仮面度" + m + "%\n\n#裏の顔診断 #黒の占い師";
  var toast = document.getElementById("toast"), timer;
  function say(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(function () { toast.hidden = true; }, 5000);
  }
  function copy(s) {
    return navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject();
  }
  function on(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  }

  // X と Threads は普通のリンクにする。スマホで window.open や新しいタブで開くとアプリに切り替わらず
  // ブラウザ版が開いてしまうため、スマホでは同じタブで開いてアプリに渡す。パソコンだけ新しいタブ
  var mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  function link(id, href) {
    var el = document.getElementById(id);
    if (!el) return;
    el.href = href;
    if (!mobile) { el.target = "_blank"; el.rel = "noopener"; }
  }
  link("shareX", "https://x.com/intent/post?text=" + encodeURIComponent(text + "\n") + "&url=" + encodeURIComponent(url));
  link("shareThreads", "https://www.threads.net/intent/post?text=" + encodeURIComponent(text + "\n" + url));
  // Instagramには投稿用のURLが無いので、スマホの共有シートに結果画像を渡す（ストーリーズを選べる）。
  // iPhoneはタップ直後でないと共有シートを開けないため、画像は先に読み込んでおく
  var igFile = null;
  if (mine && body.dataset.og === "1") fetch("../../og/" + code + ".png").then(function (r) {
    return r.ok ? r.blob() : null;
  }).then(function (b) {
    if (b) igFile = new File([b], "ura-" + code + ".png", { type: "image/png" });
  }).catch(function () {});
  on("shareIG", function () {
    if (igFile && navigator.canShare && navigator.canShare({ files: [igFile] })) {
      navigator.share({ files: [igFile], text: text + "\n" + url }).catch(function () {});
      return;
    }
    copy(text + "\n" + url).finally(function () {
      say("シェア文をコピーしました。この画面をスクショして、インスタのストーリーズに貼ってください。");
    });
  });
  on("copy", function () {
    copy(url).then(function () { say("リンクをコピーしました"); });
  });
})();
