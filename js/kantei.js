/* 本鑑定 下書き作成（作業用）
   無料鑑定と同じ命式エンジンを使い、大運と年運を足した長い下書きを出す。
   出力はそのまま納品せず、必ず手を入れる前提。 */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  function initSelects() {
    var y = el("k-year"), m = el("k-month"), d = el("k-day"),
        h = el("k-hour"), mi = el("k-min"), pf = el("k-pref");
    var now = new Date().getFullYear(), i;
    for (i = now - 12; i >= 1930; i--) y.add(new Option(i, i));
    for (i = 1; i <= 12; i++) m.add(new Option(i, i));
    for (i = 1; i <= 31; i++) d.add(new Option(i, i));
    h.add(new Option("わからない", ""));
    for (i = 0; i <= 23; i++) h.add(new Option(i, i));
    mi.add(new Option("不明", ""));
    for (i = 0; i <= 59; i++) mi.add(new Option(("0" + i).slice(-2), i));
    pf.add(new Option("不明・海外", ""));
    window.Meishiki.PREF.forEach(function (row) { pf.add(new Option(row[0], row[0])); });
    y.value = 1995; m.value = 1; d.value = 1; h.value = ""; mi.value = ""; pf.value = "";
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
    var mv     = el("k-min").value;
    var minute = mv === "" ? null : Number(mv);
    var pref   = el("k-pref").value || null;
    var gender = el("k-gender").value;
    var tone   = el("k-tone").value;
    var topic  = el("k-topic").value.trim();

    var M  = window.Meishiki;
    var R  = window.Reading;
    var ms = M.build(y, m, d, hour, minute, pref);
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

    /* --- GPT用プロンプト --- */
    var P = [];
    function line(t) { P.push(t === undefined ? "" : t); }

    line("あなたは「黒の占い師」という四柱推命の鑑定士です。");
    line("以下の命式と相談内容をもとに、有料の本鑑定書を作成してください。");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【キャラクター】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("・前置きをしない。一行目から結論を言う");
    line("・甘い言葉を使わない。厳しい現実もそのまま伝える");
    line("・ただし突き放さない。本当のことを知った人だけが前に進める、という立場");
    line("・一人称は「私」。敬体。絵文字は使わない");
    line("・「〜かもしれません」「〜のようです」を使わない。言い切る");
    line("・相談者を責めない。厳しくするのは状況に対してであって、本人に対してではない");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【最重要ルール】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("・命式から読み取れる「現状」と「性質」は断定してよい");
    line("・「未来」は断定しない。触れるときは「今のままなら」「動いた場合は」と条件を付ける");
    line("・「悪くなる」ではなく「変わらない」「何も起きない」と表現する");
    line("・必ず／絶対に／確実に／100%／保証、で未来を語らない");
    line("・恐怖で行動させる書き方をしない（不安を煽って何かを勧めない）");
    line("・病気、健康、生死、法律問題に触れない");
    line("・投資、ギャンブル、具体的な金額の助言をしない");
    line("・特定の人物への働きかけ（別れさせる、縁を切る等）を提案しない");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【この相談者の命式】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("お名前：" + name + "　／　" + (gender === "male" ? "男性" : "女性") + "　／　" + age + "歳");
    line("生年月日：" + y + "年" + m + "月" + d + "日"
       + (ms.hasHour ? "　" + hour + "時" + (minute === null ? "頃" : ("0" + minute).slice(-2) + "分") : "（出生時刻は不明）"));
    if (pref) {
      line("出生地：" + pref + "　… 真太陽時に補正（" + (ms.solarOffset >= 0 ? "+" : "") + ms.solarOffset
         + "分）。補正後の時刻は" + ms.solarTimeText + "。時柱はこの補正後の時刻で立てています。");
    } else if (ms.hasHour) {
      line("出生地：不明　… 真太陽時の補正なし。時柱は境目の場合ずれる可能性があります。");
    }
    line();
    line("年柱：" + ms.year.kan + ms.year.shi);
    line("月柱：" + ms.month.kan + ms.month.shi);
    line("日柱：" + ms.day.kan + ms.day.shi);
    line("時柱：" + (ms.hasHour ? ms.hour.kan + ms.hour.shi : "—（不明のため三柱で判断）"));
    line();
    line("日干：" + k + "（" + ms.dayKanYomi + "）　五行は" + ms.dayGyoName);
    line("通変星（月干との関係）：" + ms.tsuhen + "　… 社会での出方を表す");
    line("十二運（日支）：" + ms.junisei + "　… 今どのエネルギー段階にいるか");
    if (ms.hasHour) line("時柱の通変星：" + ms.hourTsuhen + "　… まだ表に出していない部分と後半の形");
    line("五行バランス：最多は" + ms.balance.mostName
       + (ms.balance.lackName ? "、欠けているのは" + ms.balance.lackAll.join("・") : "、欠けなし")
       + "（" + ms.balance.chars + "文字で判定）");
    line("命式にある星：" + (ms.stars.list.join("・") || "なし"));
    var lacks = [];
    ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
      if (!ms.stars.has[key]) lacks.push(R.starNote[key].name);
    });
    line("命式に無い星：" + (lacks.length ? lacks.join("・") : "なし（五つとも揃っている）"));
    if (lacks.length) {
      line();
      line("※無い星は、この人が繰り返しつまずく場所です。相談の根本がここにある可能性が高いので、");
      line("　当てはまる場合は鑑定の軸に据えてください。");
      ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
        if (!ms.stars.has[key]) line("　・" + R.starNote[key].name + "がない … " + R.starNote[key].no);
      });
    }
    line();
    line("【大運】（" + (du.forward ? "順行" : "逆行") + "、" + du.startAge + "歳から）");
    du.pillars.forEach(function (pl) {
      var cur = (age >= pl.from && age <= pl.to);
      line("　" + pl.from + "〜" + pl.to + "歳：" + pl.kan + pl.shi + "（" + pl.tsuhen + "）"
         + (cur ? "　← 現在ここ" : ""));
    });
    if (curPillar) {
      line();
      line("現在の大運の意味：" + R.daiunRel[curPillar.rel][curPillar.yang ? "yang" : "yin"]);
    }
    line();
    line("【年運】");
    var thisYear = new Date().getFullYear();
    M.years(ms.dayGyo, thisYear, 5).forEach(function (v) {
      line("　" + v.year + "年（" + v.kan + v.shi + "）：" + R.yearRel[v.rel][v.yang ? "yang" : "yin"]);
    });
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【この相談者への伝え方】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("通る言い方：" + R.advice[ms.tsuhen].in);
    line("逆効果になる言い方：" + R.advice[ms.tsuhen].out);
    line("今は動かす時期か：" + R.timing[ms.junisei]);
    line("本人の希望する伝え方：" + (tone === "hard" ? "覚悟して聞きたい" : "優しく聞きたい"));
    line(tone === "hard"
      ? "　→ 遠慮せず、厳しい部分をはっきり書いてください。"
      : "　→ 内容は変えず、語尾だけ和らげてください。伝える中身を甘くしないこと。");
    line();
    line("助言を書くときは、上の「通る言い方」の形にしてください。");
    line("「逆効果」に挙げた形は使わないでください。");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【すでに無料鑑定で伝えた内容 ─ 繰り返さないこと】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("この人は以下をすでに読んでいます。同じ内容を書くと、お金を払って同じ文章を読ませることになります。");
    line("前提として踏まえた上で、この続きを書いてください。");
    line();
    [["宿命・本質", R.destiny[k]], ["性格", R.character[k]],
     ["社会での出方", R.tsuhen[ms.tsuhen]], ["恋愛・結婚", R.love[k]],
     ["仕事・お金", R.work[k]], ["今の段階", R.junisei[ms.junisei]],
     ["気をつけること", R.caution[k]], ["まとめ", R.summary[k]]].forEach(function (row) {
      line("◇" + row[0]);
      line(row[1].replace(/\n\n/g, " "));
      line();
    });
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【ご相談内容】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line(topic || "（相談内容が未入力です。ここに相談文を貼ってください）");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【書き方の指示】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("0. 相談内容はフォームの回答をそのまま貼ってあります。");
    line("　 「悩み」「今の状況」「迷っている選択肢」「理想」「不安」など、");
    line("　 見出しごとに書かれている内容を、すべて材料として使ってください。");
    line("　 特に「本当はどうなりたいか」と「特に不安に感じていること」は必ず本文で扱ってください。");
    line("　 理想は着地点、不安は「目を背けていること」の章に直結します。");
    line();
    line("1. まず相談文を読み、この人が抱えている悩みをすべて洗い出してください。");
    line("　 数え漏らさないこと。相談文に書かれた悩みは、ひとつ残らず扱います。");
    line();
    line("2. 洗い出した悩みごとに、章を立ててください。");
    line("　 章立ては固定ではありません。この人の相談内容から決めてください。");
    line("　 相談者が挙げた順に並べます。");
    line();
    line("3. 各章では、必ず命式のどの要素から言えるのかを示してください。");
    line("　 例：「日干" + k + "は◯◯の性質を持ちます。だからあなたの場合は──」");
    line("　 例：「あなたの命式には◯◯がありません。だから──」");
    line("　 根拠を示さずに断定すると、ただの決めつけになります。");
    line();
    line("4. 相談者が書いた言葉を、最低3箇所そのまま引用してください。");
    line("　 例：「◯◯と書かれていました」");
    line("　 これがないと、誰にでも当てはまる文章になります。");
    line();
    line("5. 一般論で終わる段落を作らないでください。");
    line("　 「行動することが大切です」のような文は削ってください。");
    line("　 次に何をどうするかまで、具体的に書きます。");
    line();
    line("6. 時期を言い切ってください。");
    line("　 大運と年運を使い、「◯年ごろに動く」「◯歳までは仕込みの時期」と示します。");
    line("　 ぼかすと無料鑑定と変わらなくなります。");
    line();
    line("7. 相談者が「どちらを選ぶべきか」と聞いている場合は、必ずどちらかを選んで答えてください。");
    line("　 両論併記にしないこと。選んだ理由を命式から示します。");
    line();
    line("8. 最後の章の前に「絶対にしてはいけないこと」を3つ入れてください。");
    line("　 やるべきことより、こちらの方が満足度に効きます。");
    line();
    line("9. 締めでは、決めるのは本人であることを伝えて主導権を返してください。");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【出力の形式】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("・全体で4,000〜5,000字");
    line("・冒頭：相談内容を受け止め、結論を1〜2行で言い切る");
    line("・中盤：悩みごとの章（相談内容から章立てを決める）");
    line("・終盤：絶対にしてはいけないこと3つ → 締め");
    line("・見出しは「■ 」で始め、その下に罫線「──────────」を引く");
    line("・絵文字は使わない");
    line("・末尾に以下の免責をそのまま付ける");
    line();
    line("【本鑑定について】");
    line("・鑑定結果は未来を保証するものではなく、判断の参考としてお受け取りください");
    line("・最終的に選ぶのはご本人です。私は選択肢と、視えたものをお伝えするだけです");
    line("・病気の診断、健康、生死、試験の合否、法律・医療上の判断はお受けできません");
    line("・投資、ギャンブル等、財産上の判断に関する助言は行いません");
    line("・特定の人物への働きかけ（別れさせる・縁を切る等）は一切行いません");
    line("・サービスの性質上、納品後のキャンセル・返金はお受けできません");
    line("・ご相談内容を第三者に開示することはありません");

    var L = P;

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
