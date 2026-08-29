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

    /* 命式パネル */
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
    if (ms.hasHour) {
      c += "<tr><th>時柱通変</th><td colspan='3'>" + ms.hourTsuhen + "</td></tr>";
    }
    c += "</tbody></table>";

    c += '<h2>大運（' + (du.forward ? "順行" : "逆行") + " ／ 立運 " + du.startAge + "歳）</h2>";
    c += '<table class="chart-tbl daiun"><tbody>';
    du.pillars.forEach(function (p) {
      var cur = (age >= p.from && age <= p.to);
      c += "<tr" + (cur ? ' class="cur"' : "") + "><th>" + p.from + "〜" + p.to + "歳</th>"
         + "<td>" + p.kan + p.shi + "</td><td>" + p.tsuhen + "</td>"
         + "<td>" + (cur ? "← 現在" : "") + "</td></tr>";
    });
    c += "</tbody></table>";
    el("k-chart").innerHTML = c;

    /* 下書き本文 */
    var L = [];
    function h2(t) { L.push("", "■ " + t, "──────────", ""); }
    function p(t) { if (t) L.push(t, ""); }

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
    L.push("【ここに結論を1〜2行で書く。相談内容に対する答えを言い切ること】");

    h2("一　今のあなたの現在地");
    p(R.destiny[k]);
    p(R.gyoMost[ms.balance.mostName]);
    p(ms.balance.lackName ? R.gyoLack[ms.balance.lackName] : R.gyoNone);

    h2("二　あなたが目を背けていること");
    p(R.character[k]);
    p("【ここが本鑑定の目玉。相談内容に即して、本人が認めたくない一点を書く。"
      + "図星を突いたら必ず『責めているのではありません』でフォローすること】");

    h2("三　社会での出方");
    p("月柱の天干は" + ms.month.kan + "。日干" + k + "から見ると" + ms.tsuhen + "にあたります。");
    p(R.tsuhen[ms.tsuhen]);

    h2("四　恋愛・結婚");
    p(R.love[k]);
    p(R.loveByGender[k][gender]);

    h2("五　仕事・お金");
    p(R.work[k]);

    if (ms.hasHour) {
      h2("六　隠れているもの");
      p("時柱は" + ms.hour.kan + ms.hour.shi + "。日干" + k + "から見ると" + ms.hourTsuhen + "にあたります。");
      p(R.hourTsuhen[ms.hourTsuhen]);
    }

    h2("七　今の段階");
    p("日支は" + ms.day.shi + "。十二運では" + ms.junisei + "の位置にあります。");
    p(R.junisei[ms.junisei]);

    h2("八　十年ごとの流れ");
    p("大運は" + (du.forward ? "順行" : "逆行") + "、" + du.startAge + "歳から動き始めています。");
    du.pillars.forEach(function (pl) {
      var cur = (age >= pl.from && age <= pl.to);
      L.push("【" + pl.from + "〜" + pl.to + "歳】" + pl.kan + pl.shi + "（" + pl.tsuhen + "）"
             + (cur ? "  ← 今ここ" : ""));
      L.push(R.daiunRel[pl.rel][pl.yang ? "yang" : "yin"]);
      L.push("");
    });
    p("【現在の大運について、相談内容に絡めて2〜3行足すこと】");

    h2("九　今後5年の運気");
    var thisYear = new Date().getFullYear();
    M.years(ms.dayGyo, thisYear, 5).forEach(function (v) {
      L.push("【" + v.year + "年　" + v.kan + v.shi + "】");
      L.push(R.yearRel[v.rel][v.yang ? "yang" : "yin"]);
      L.push("");
    });
    p("これは決まった未来ではありません。今のままなら、そうなるというだけです。");

    h2("十　今すべきこと");
    p("【抽象論で終わらせない。次に何をどう言うか、どう動くかまで具体的に書く。"
      + "『話し合いましょう』で終わる鑑定書に5,980円の価値はない】");

    h2("絶対にしてはいけないこと");
    p(R.caution[k]);
    p("【あと2つ、相談内容に即して具体的に足す】");

    h2("最後に");
    p(R.summary[k]);
    p(name + "さん。決めるのはあなたです。私は視えたものをお伝えしただけで、"
      + "あなたの人生を代わりに選ぶことはできません。");

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
