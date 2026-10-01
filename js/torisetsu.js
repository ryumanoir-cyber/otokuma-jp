/* 人生の取扱説明書 申込フォーム（プロフィールのリンクから）
   送信先は事前相談フォームと同じ Apps Script。種別「取扱説明書」でスプシの「取扱説明書」タブに入る。 */
(function () {
  "use strict";

  /* Apps Script のデプロイURL（noir.xadアカウント・スプシ「本鑑定 申込」） */
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxSwxzz0zt1vmlr_RyiWybQAu4Sc2YcMIjNkp28CC5Yx_cPzjL3fmib7_zNqc0MG6X_/exec";

  var PREFS = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉",
    "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都",
    "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡",
    "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];

  function el(id) { return document.getElementById(id); }

  function initSelects() {
    var h = el("t-hour");
    h.add(new Option("わからない", ""));
    for (var i = 0; i < 24; i++) h.add(new Option(i + "時台", i + "時台"));
    var p = el("t-pref");
    p.add(new Option("答えない（不明・海外）", ""));
    PREFS.forEach(function (name) { p.add(new Option(name, name)); });
  }

  function submit(e) {
    e.preventDefault();
    var form = el("toriForm");
    var msg = el("t-msg");
    var btn = el("t-submit");
    var name = form["お名前"].value.trim();
    var mail = form["メールアドレス"].value.trim();
    var birth = form["生年月日"].value;

    var missing = [];
    if (!name) missing.push("お名前");
    if (!mail) missing.push("メールアドレス");
    if (!birth) missing.push("生年月日");
    if (missing.length) {
      msg.className = "form-msg err";
      msg.textContent = "未記入の項目があります：" + missing.join("、");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      msg.className = "form-msg err";
      msg.textContent = "メールアドレスの形式をご確認ください。ここにお送りするため、お間違いがあるとお届けできません。";
      form["メールアドレス"].focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "送信しています…";
    msg.className = "form-msg";
    msg.textContent = "";

    var data = {
      "種別": "取扱説明書",
      "送信日時": new Date().toLocaleString("ja-JP"),
      "お名前": name,
      "メールアドレス": mail,
      "生年月日": birth,
      "出生時刻": form["出生時刻"].value,
      "出生地": form["出生地"].value
    };

    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function () {
      if (window.track) window.track("torisetsu_submit");
      form.classList.add("hidden");
      el("t-thanks").classList.remove("hidden");
      el("t-thanks").scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "無料で申し込む";
      msg.className = "form-msg err";
      msg.textContent = "送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSelects();
    el("toriForm").addEventListener("submit", submit);
  });
})();
