/* 事前相談フォーム（購入者のみ・メールで案内）
   送信先（ENDPOINT）は Google Apps Script のウェブアプリURLを入れる。
   空のままだと送信せず、未接続である旨を表示する。 */
(function () {
  "use strict";

  /* Apps Script のデプロイURL（noir.xadアカウント・スプシ「本鑑定 申込」） */
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxSwxzz0zt1vmlr_RyiWybQAu4Sc2YcMIjNkp28CC5Yx_cPzjL3fmib7_zNqc0MG6X_/exec";

    var THEMES = [
    "仕事・転職", "副業・独立・起業", "お金・収入", "恋愛", "結婚", "復縁",
    "相性", "人間関係", "家族", "将来・人生全般", "才能・適職", "運気・転機", "その他"
  ];

  function el(id) { return document.getElementById(id); }

  function initPref() {
    var p = el("f-pref");
    p.add(new Option("選択しない（不明・海外）", ""));
    window.Meishiki.PREF.forEach(function (row) { p.add(new Option(row[0], row[0])); });
  }

  function initThemes() {
    var box = el("f-themes");
    THEMES.forEach(function (t) {
      var lab = document.createElement("label");
      lab.className = "chk";
      lab.innerHTML = '<input type="checkbox" name="テーマ" value="' + t + '"><span>' + t + "</span>";
      box.appendChild(lab);
    });
  }

  function collect(form) {
    var out = {};
    var fd = new FormData(form);
    fd.forEach(function (v, kk) {
      if (out[kk] === undefined) out[kk] = v;
      else out[kk] = out[kk] + "、" + v;   // テーマの複数選択をまとめる
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
    if (!form.querySelector('[name="テーマ"]:checked')) missing.push("テーマ");
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

    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function () {
      form.classList.add("hidden");
      el("f-thanks").classList.remove("hidden");
      el("f-thanks").scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "この内容で送信する";
      msg.className = "form-msg err";
      msg.textContent = "送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPref();
    initThemes();
    el("kanteiForm").addEventListener("submit", submit);
  });
})();
