/* 事前相談フォーム（購入者のみ・メールで案内）
   送信先（ENDPOINT）は Google Apps Script のウェブアプリURLを入れる。
   空のままだと送信せず、未接続である旨を表示する。 */
(function () {
  "use strict";

  /* Apps Script のデプロイURL（noir.xadアカウント・スプシ「本鑑定 申込」） */
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxSwxzz0zt1vmlr_RyiWybQAu4Sc2YcMIjNkp28CC5Yx_cPzjL3fmib7_zNqc0MG6X_/exec";

  function el(id) { return document.getElementById(id); }

  /* 都道府県の一覧。以前は /js/meishiki.js から読んでいたが、2026-09-15 に同ファイルを公開から外した際に
     このフォームが動かなくなっていた（2026-10-02 修正）。他のファイルに頼らずここに直接持つ */
  var PREFS = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉",
    "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都",
    "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡",
    "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];

  function initPref() {
    var p = el("f-pref");
    p.add(new Option("選択しない（不明・海外）", ""));
    PREFS.forEach(function (name) { p.add(new Option(name, name)); });
  }

  function collect(form) {
    var out = {};
    var fd = new FormData(form);
    fd.forEach(function (v, kk) {
      if (out[kk] === undefined) out[kk] = v;
      else out[kk] = out[kk] + "、" + v;   // 複数値の項目をまとめる
    });
    return out;
  }

  function validate(form) {
    var missing = [];
    ["注文番号", "メールアドレス", "お名前", "生年月日", "性別",
     "一番鑑定してほしいこと", "悩み"].forEach(function (nm) {
      var f = form.querySelector('[name="' + nm + '"]');
      if (f && !f.value.trim()) missing.push(nm);
    });
    if (!form.querySelector('[name="伝え方"]:checked')) missing.push("お伝えの仕方");
    return missing;
  }

  /* メールアドレスの形は最低限だけ確かめる。
     ここが間違っていると鑑定書を届けられない。 */
  function badEmail(form) {
    var v = form.querySelector('[name="メールアドレス"]').value.trim();
    if (!v) return false;                      // 未記入は validate 側で拾う
    return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function submit(e) {
    e.preventDefault();
    var form = el("kanteiForm");
    var msg = el("f-msg");
    var btn = el("f-submit");

    var missing = validate(form);
    if (missing.length) {
      msg.className = "form-msg err";
      msg.textContent = "未記入の項目があります：" + missing.join("、");
      msg.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (badEmail(form)) {
      msg.className = "form-msg err";
      msg.textContent = "メールアドレスの形式をご確認ください。ここにお送りするため、お間違いがあるとお届けできません。";
      el("f-contact").focus();
      return;
    }

    if (!ENDPOINT) {
      msg.className = "form-msg err";
      msg.textContent = "フォームの送信先がまだ設定されていません。恐れ入りますが、しばらくしてからお試しください。";
      return;
    }

    btn.disabled = true;
    btn.textContent = "送信しています…";
    msg.className = "form-msg";
    msg.textContent = "";

    var data = collect(form);
    data["送信日時"] = new Date().toLocaleString("ja-JP");
    var vis = window.kuroVisitor ? window.kuroVisitor() : { id: "", src: "" };
    data["訪問者ID"] = vis.id;
    data["流入元"] = vis.src;

    // 返事を待たずに完了ページへ（送信は裏で最後まで続く）。2026-10-04
    var ok = window.kuroSend && window.kuroSend(ENDPOINT, data, "/form/thanks/");
    if (!ok) {
      btn.disabled = false;
      btn.textContent = "この内容で送信する";
      msg.className = "form-msg err";
      msg.textContent = "送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPref();
    el("kanteiForm").addEventListener("submit", submit);
    /* 送信ボタンは HTML では押せない状態にしてあり、準備ができてから押せるようにする */
    el("f-submit").disabled = false;
  });
})();
