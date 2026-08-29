/* 本鑑定 下書き作成（作業用）
   無料鑑定と同じ命式エンジンを使い、大運と年運を足した長い下書きを出す。
   出力はそのまま納品せず、必ず手を入れる前提。 */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  function initSelects() {
    var y = el("k-year"), m = el("k-month"), d = el("k-day"), h = el("k-hour");
    var now = new Date().getFullYear(), i;
    for (i = now - 12; i >= 1930; i--) y.add(new Option(i, i));
    for (i = 1; i <= 12; i++) m.add(new Option(i, i));
    for (i = 1; i <= 31; i++) d.add(new Option(i, i));
    h.add(new Option("わからない", ""));
    for (i = 0; i <= 23; i++) h.add(new Option(i + "時台", i));
    y.value = 1995; m.value = 1; d.value = 1; h.value = "";
  }

  function ageNow(y, m, d) {
    var t = new Date();
    var a = t.getFullYear() - y;
    if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
    return a;
  }

  function build() {
    var name   = el("k-name").value.trim() || "お客様";
    var y      = Number(el("k-year").value);
    var m      = Number(el("k-month").value);
    var d      = Number(el("k-day").value);
    var hv     = el("k-hour").value;
    var hour   = hv === "" ? null : Number(hv);
    var gender = el("k-gender").value;
    var topic  = el("k-topic").value.trim();

    var M  = window.Meishiki;
    var R  = window.Reading;
    var ms = M.build(y, m, d, hour);
    var du = M.daiun(y, m, d, gender);
    var k  = ms.dayKan;
    var age = ageNow(y, m, d);

    /* --- 命式パネル --- */
    var c = "";
    c += '<h2>命式</h2>';
    c += '<table class="chart-tbl"><tbody>';
    c += "<tr><th>年柱</th><td>" + ms.year.kan + ms.year.shi + "</td>";
    c += "<th>月柱</th><td>" + ms.month.kan + ms.month.shi + "</td></tr>";
    c += "<tr><th>日柱</th><td>" + ms.day.kan + ms.day.shi + "</td>";
    c += "<th>時柱</th><td>" + (ms.hasHour ? ms.hour.kan + ms.hour.shi : "—（時刻不明）") + "</td></tr>";
    c += "<tr><th>日干</th><td>" + k + "（" + ms.dayKanYomi + "）・" + ms.dayGyoName + "</td>";
    c += "<th>年齢</th><td>" + age + "歳</td></tr>";
    c += "<tr><th>通変星</th><td>" + ms.tsuhen + "（月干）</td>";
    c += "<th>十二運</th><td>" + ms.junisei + "（日支）</td></tr>";
    c += "<tr><th>五行</th><td colspan='3'>最多 " + ms.balance.mostName
       + (ms.balance.lackName ? " ／ 欠 " + ms.balance.lackAll.join("・") : " ／ 欠なし")
       + "（" + ms.balance.chars + "文字で判定）</td></tr>";
    c += "<tr><th>持つ星</th><td colspan='3'>" + (ms.stars.list.join("・") || "—") + "</td></tr>";
    c += "</tbody></table>";

    c += '<h2>大運（' + (du.forward ? "順行" : "逆行") + " ／ 立運 " + du.startAge + "歳）</h2>";
    c += '<table class="chart-tbl daiun"><tbody>';
    var curPillar = null;
    du.pillars.forEach(function (pl) {
      var cur = (age >= pl.from && age <= pl.to);
      if (cur) curPillar = pl;
      c += "<tr" + (cur ? ' class="cur"' : "") + "><th>" + pl.from + "〜" + pl.to + "歳</th>"
         + "<td>" + pl.kan + pl.shi + "</td><td>" + pl.tsuhen + "</td>"
         + "<td>" + (cur ? "← 現在" : "") + "</td></tr>";
    });
    c += "</tbody></table>";
    el("k-chart").innerHTML = c;

    /* --- 申し送り（書き手向け） --- */
    var g = "";
    g += "<h2>この相談者に言葉を通す方法</h2>";
    g += '<table class="chart-tbl"><tbody>';
    g += "<tr><th>通る言い方</th><td>" + R.advice[ms.tsuhen].in + "</td></tr>";
    g += "<tr><th>逆効果</th><td class='ng'>" + R.advice[ms.tsuhen].out + "</td></tr>";
    g += "</tbody></table>";

    g += "<h2>今は動かす時期か</h2>";
    g += "<p class='guide-p'>十二運「" + ms.junisei + "」　" + R.timing[ms.junisei] + "</p>";

    g += "<h2>命式に無い星（相談の根本になりやすい）</h2>";
    g += '<table class="chart-tbl"><tbody>';
    var lackedAny = false;
    ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
      var n = R.starNote[key];
      var has = ms.stars.has[key];
      if (!has) lackedAny = true;
      g += "<tr class='" + (has ? "" : "ng") + "'><th>" + n.name + "</th>"
         + "<td>" + (has ? "あり" : "なし") + "</td>"
         + "<td>" + (has ? n.yes : n.no) + "</td></tr>";
    });
    g += "</tbody></table>";
    if (!lackedAny) g += "<p class='guide-p'>五つとも揃っています。突出した欠けがないぶん、決め手も出にくい人です。</p>";
    el("k-guide").innerHTML = g;

    /* --- 本人が既に読んだ内容（繰り返し禁止） --- */
    var a = "";
    a += "<p class='guide-p'>無料鑑定でこの人が読んだ本文です。<strong>同じ内容を本鑑定に書かないでください。</strong>"
       + "本鑑定は、この続きとして書きます。</p>";
    [["宿命・本質", R.destiny[k]], ["性格", R.character[k]],
     ["社会での出方", R.tsuhen[ms.tsuhen]], ["恋愛・結婚", R.love[k]],
     ["仕事・お金", R.work[k]], ["今の段階", R.junisei[ms.junisei]],
     ["気をつけること", R.caution[k]], ["最後に", R.summary[k]]].forEach(function (row) {
      a += "<details class='already'><summary>" + row[0] + "</summary><p>"
         + row[1].replace(/\n\n/g, "<br><br>") + "</p></details>";
    });
    el("k-already").innerHTML = a;

    /* --- 下書き本文（無料の文章は入れない） --- */
    var L = [];
    function h2(t) { L.push("", "■ " + t, "──────────", ""); }
    function p(t) { if (t) L.push(t, ""); }
    function todo(t) { L.push("【" + t + "】", ""); }

    L.push("お読みいただきありがとうございます。");
    L.push("");
    if (topic) {
      L.push("「" + topic.replace(/\n+/g, " ") + "」");
      L.push("");
      L.push("そう書かれていました。前置きはしません。結論から書きます。");
    } else {
      L.push(name + "さん。前置きはしません。結論から書きます。");
    }
    L.push("");
    todo("結論を1〜2行。相談への答えを言い切る。ここで濁したら全部が濁る");

    h2("一　この相談について、命式から視えること");
    p("あなたの日干は" + k + "。月柱から見た働きは" + ms.tsuhen
      + "、今いる段階は十二運の" + ms.junisei + "です。");
    todo("上の3点のうち、この相談に直接効くものを1つ選んで掘る。"
       + "無料鑑定の一般論ではなく、相談内容に当てて書くこと");
    if (!ms.stars.has.zaisei || !ms.stars.has.kansei || !ms.stars.has.insei
        || !ms.stars.has.shokusho || !ms.stars.has.hikyo) {
      var lacks = [];
      ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
        if (!ms.stars.has[key]) lacks.push(R.starNote[key].name);
      });
      todo("この人の命式には " + lacks.join("・") + " がない。"
         + "相談の根本がここにある可能性が高い。当てはまるなら、ここを本鑑定の軸にする");
    }

    h2("二　あなたが目を背けていること");
    todo("本鑑定の目玉。相談文の中で本人が言い訳している箇所を探し、そこを突く。"
       + "図星を突いたら必ず「責めているのではありません」でフォローする。"
       + "相手ではなく相談者自身の内面を扱うこと");

    h2("三　いつ動くか");
    if (curPillar) {
      p("現在は大運 " + curPillar.from + "〜" + curPillar.to + "歳、"
        + curPillar.kan + curPillar.shi + "（" + curPillar.tsuhen + "）の中にいます。");
      p(R.daiunRel[curPillar.rel][curPillar.yang ? "yang" : "yin"]);
    }
    L.push("この先の流れは、年ごとに次のように動きます。");
    L.push("");
    var thisYear = new Date().getFullYear();
    M.years(ms.dayGyo, thisYear, 5).forEach(function (v) {
      L.push("【" + v.year + "年　" + v.kan + v.shi + "】");
      L.push(R.yearRel[v.rel][v.yang ? "yang" : "yin"]);
      L.push("");
    });
    todo("どの年に何をするのかを言い切る。ここが有料の中心。"
       + "「◯年に動いてください」まで書く。時期をぼかすと無料と変わらない");

    h2("四　今すべきこと");
    todo("抽象論で終わらせない。次に何をどう言うか、どう動くかまで具体的に。"
       + "この相談者には『" + R.advice[ms.tsuhen].in + "』という形が通る。"
       + "逆に『" + R.advice[ms.tsuhen].out + "』は避ける");
    todo("時期の判断：" + R.timing[ms.junisei]);

    h2("五　絶対にしてはいけないこと");
    todo("3つ書く。相談内容に即して具体的に。"
       + "『やるべきこと』より、こちらの方が満足度に効く");

    h2("最後に");
    todo("甘やかさない。ただし見捨てない一言で終える。"
       + "最後に主導権を相談者へ返すこと（決めるのはあなたです）");

    L.push("");
    L.push("【本鑑定について】");
    L.push("・鑑定結果は未来を保証するものではなく、判断の参考としてお受け取りください");
    L.push("・最終的に選ぶのはご本人です。私は選択肢と、視えたものをお伝えするだけです");
    L.push("・病気の診断、健康、生死、試験の合否、法律・医療上の判断はお受けできません");
    L.push("・投資、ギャンブル等、財産上の判断に関する助言は行いません");
    L.push("・特定の人物への働きかけ（別れさせる・縁を切る等）は一切行いません");
    L.push("・サービスの性質上、納品後のキャンセル・返金はお受けできません");
    L.push("・ご相談内容を第三者に開示することはありません");

    el("k-draft").value = L.join("\n");
    el("k-out").classList.remove("hidden");
    el("k-out").scrollIntoView({ behavior: "smooth" });
  }

  function copy() {
    var ta = el("k-draft");
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (!ok && navigator.clipboard) {
      navigator.clipboard.writeText(ta.value).then(function () { flash("コピーしました"); });
      return;
    }
    flash(ok ? "コピーしました" : "コピーできませんでした");
  }

  function flash(msg) {
    var b = el("k-copy"), old = b.textContent;
    b.textContent = msg;
    setTimeout(function () { b.textContent = old; }, 1600);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSelects();
    el("k-run").addEventListener("click", build);
    el("k-copy").addEventListener("click", copy);
  });
})();
