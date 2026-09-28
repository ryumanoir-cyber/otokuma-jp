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

  var mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var xWeb = "https://x.com/intent/post?text=" + encodeURIComponent(text + "\n") + "&url=" + encodeURIComponent(url);

  // アプリを直接開く。ブラウザ版を経由して「アプリで開く」を押すと、Xは下書きを捨ててホームに飛ぶため。
  // アプリが入っていなければ（ページが裏に回らなければ）ブラウザ版へ切り替える
  function openApp(scheme, web) {
    var left = false;
    function onHide() { if (document.hidden) left = true; }
    document.addEventListener("visibilitychange", onHide);
    location.href = scheme;
    setTimeout(function () {
      document.removeEventListener("visibilitychange", onHide);
      if (!left && !document.hidden) location.href = web;
    }, 1600);
  }

  // Threads は普通のリンクでアプリの投稿画面が開く（本人の実機で確認済み）
  var th = document.getElementById("shareThreads");
  if (th) {
    th.href = "https://www.threads.net/intent/post?text=" + encodeURIComponent(text + "\n" + url);
    if (!mobile) { th.target = "_blank"; th.rel = "noopener"; }
  }

  on("shareX", function (ev) {
    ev.preventDefault();
    if (!mobile) { window.open(xWeb, "_blank", "noopener"); return; }
    openApp("twitter://post?message=" + encodeURIComponent(text + "\n" + url), xWeb);
  });

  // 結果画像（Xのカードと同じ画像）。iPhone はタップ直後でないと共有シートを開けないので先に読んでおく
  var imgUrl = "../../og/" + code + ".png", imgFile = null;
  if (mine && body.dataset.og === "1") fetch(imgUrl).then(function (r) {
    return r.ok ? r.blob() : null;
  }).then(function (b) {
    if (b) imgFile = new File([b], "ura-" + code + ".png", { type: "image/png" });
  }).catch(function () {});

  // Instagram には外から投稿画面を開くURLが無いので、シェア文をコピーしてストーリーズのカメラを開く
  on("shareIG", function () {
    copy(text + "\n" + url).catch(function () {}).finally(function () {
      say("シェア文をコピーしました。「画像を保存」で保存した結果画像をストーリーズに貼ってください。");
      if (mobile) openApp("instagram://story-camera", "https://www.instagram.com/");
      else window.open("https://www.instagram.com/", "_blank", "noopener");
    });
  });

  // 画像を保存：スマホは共有シートの「画像を保存」で写真に入る。パソコンはそのままダウンロード
  on("saveImg", function () {
    if (imgFile && navigator.canShare && navigator.canShare({ files: [imgFile] })) {
      navigator.share({ files: [imgFile] }).catch(function () {});
      return;
    }
    var a = document.createElement("a");
    a.href = imgUrl;
    a.download = "ura-" + code + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  on("copy", function () {
    copy(url).then(function () { say("リンクをコピーしました"); });
  });
})();
