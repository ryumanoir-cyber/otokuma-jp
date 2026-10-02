(function () {
  var body = document.body, code = body.dataset.code, name = body.dataset.name;
  var p = new URLSearchParams(location.search);
  var m = parseInt(p.get("m"), 10), a = (p.get("a") || "").split("-").map(Number);
  var mine = !isNaN(m) && a.length === 4 && a.every(function (x) { return x >= 50 && x <= 100; });
  var url = location.origin + location.pathname;
  function track(name, params) { if (window.track) window.track(name, params); }
  // own＝自分で診断した人、shared＝人のシェアから結果ページだけ見に来た人
  track("ura_result_view", { type: code, viewer: mine ? "own" : "shared" });

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
  // シェア系ボタンは押された数を method 別に数える
  [["shareX", "x"], ["shareThreads", "threads"], ["shareIG", "instagram"], ["saveImg", "save"], ["copy", "copy"]].forEach(function (b) {
    on(b[0], function () { track("ura_share", { method: b[1], type: code }); });
  });
  on("toFree", function () { track("ura_to_free_click", { type: code, viewer: mine ? "own" : "shared" }); });
  on("toPaid", function () { track("ura_to_paid_click", { type: code, viewer: mine ? "own" : "shared" }); });

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

  // 結果画像。iPhone はタップ直後でないと共有シートを開けないので先に読んでおく
  // card＝Xのカードと同じ横長、story＝ストーリーズ用の縦長
  var imgUrl = "../../og/" + code + ".png", storyUrl = "../../og/" + code + "-story.png";
  var imgFile = null, storyFile = null;
  function preload(src, name, done) {
    fetch(src).then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) { if (b) done(new File([b], name, { type: "image/png" })); })
      .catch(function () {});
  }
  if (mine && body.dataset.og === "1") {
    preload(imgUrl, "ura-" + code + ".png", function (f) { imgFile = f; });
    preload(storyUrl, "ura-" + code + "-story.png", function (f) { storyFile = f; });
  }
  function canShareFile(f) { return f && navigator.canShare && navigator.canShare({ files: [f] }); }

  // Instagram：サイトからストーリーズへ画像を直接渡す手段は無いので、共有シートに縦長画像だけを渡す。
  // 文章も一緒に渡すと Instagram が共有先の一覧から消えるため、画像のみ。リンクはコピーしてリンクスタンプに貼ってもらう
  on("shareIG", function () {
    copy(url).catch(function () {});
    if (canShareFile(storyFile)) {
      say("一覧から「Instagram」→「ストーリーズ」を選んでください。リンクはコピー済みなので、リンクスタンプに貼れます。");
      navigator.share({ files: [storyFile] }).catch(function () {});
      return;
    }
    save(storyUrl, "ura-" + code + "-story.png");
    say("画像を保存しました。インスタのストーリーズでこの画像を選んでください。");
  });

  function save(src, name) {
    var a = document.createElement("a");
    a.href = src;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // 画像を保存：スマホは共有シートの「画像を保存」で写真に入る。パソコンはそのままダウンロード
  on("saveImg", function () {
    if (canShareFile(imgFile)) { navigator.share({ files: [imgFile] }).catch(function () {}); return; }
    save(imgUrl, "ura-" + code + ".png");
  });
  on("copy", function () {
    copy(url).then(function () { say("リンクをコピーしました"); });
  });
})();
