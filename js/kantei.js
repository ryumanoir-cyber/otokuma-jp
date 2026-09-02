/* 本鑑定 下書き作成（作業用）
   無料鑑定と同じ命式エンジンを使い、大運と年運を足した長い下書きを出す。
   出力はそのまま納品せず、必ず手を入れる前提。 */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  /* ASC・MCが出せない理由を、実際に欠けているものだけで言う。
     出生地が分かっているのに「出生地が不明」と書くと、有料商品として矛盾する */
  function ascWhy(ms) {
    var miss = [];
    if (!ms || !ms.hasHour) miss.push("出生時刻");
    if (!el("k-pref").value) miss.push("出生地");
    return miss.join("と") || "必要な情報";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* 段階をまたいで持ち回る */
  var ctx = null;     // 命式などの計算結果
  var tarot = null;   // 引いたカード

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

    /* 数秘術 */
    var num = window.Numerology.build(y, m, d, new Date().getFullYear());

    /* 西洋占星術 */
    var astro = window.Astro.build(y, m, d, hour, minute, pref);

    /* 旧暦と紫微斗数。出生時刻が無ければ命盤は組まない */
    var lun = window.Lunar.toLunar(y, m, d);
    var zw = null;
    if (ms.hasHour && lun) {
      var gzYear = (lun.month >= 11) ? lun.year - 1 : lun.year;
      var gzIdx = ((gzYear - 4) % 60 + 60) % 60;
      zw = window.Ziwei.build(lun.month, lun.day, ms.hour.shiIdx,
                              gzIdx % 10, gzIdx % 12, lun.leap);
      zw.ganzhiYear = gzYear;
    }

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
    c += "<tr><th>天干の星</th><td colspan='3'>" + (ms.stars.list.join("・") || "—") + "</td></tr>";
    c += "<tr><th>蔵干の星</th><td colspan='3'>"
       + ms.stars.zokan.map(function (z) { return z.shi + "：" + z.stars.join("・"); }).join(" ／ ")
       + "</td></tr>";
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
    /* 数秘術 */
    c += "<h2>数秘術</h2>";
    c += '<table class="chart-tbl"><tbody>';
    c += "<tr><th>ライフパス</th><td>" + num.lifePath + "（" + num.lifePathInfo.key + "）</td>"
       + "<th>誕生数</th><td>" + num.birthday + "（" + num.birthdayInfo.key + "）</td></tr>";
    c += "<tr><th>個人年</th><td colspan='3'>"
       + num.personalYears.map(function (v) { return v.year + "年:" + v.num; }).join("　") + "</td></tr>";
    c += "</tbody></table>";

    /* 西洋占星術 */
    c += "<h2>西洋占星術</h2>";
    c += '<table class="chart-tbl"><tbody>';
    var pk = Object.keys(astro.planets);
    for (var pi = 0; pi < pk.length; pi += 2) {
      c += "<tr><th>" + pk[pi] + "</th><td>" + astro.planets[pk[pi]].text + "</td>";
      if (pk[pi + 1]) c += "<th>" + pk[pi + 1] + "</th><td>" + astro.planets[pk[pi + 1]].text + "</td>";
      else c += "<th></th><td></td>";
      c += "</tr>";
    }
    if (astro.asc) {
      c += "<tr><th>ASC</th><td>" + astro.asc.text + "</td><th>MC</th><td>" + astro.mc.text + "</td></tr>";
    } else {
      c += "<tr><th>ASC</th><td colspan='3'>" + ascWhy(ms) + "が不明のため算出せず</td></tr>";
    }
    if (astro.aspects.length) {
      c += "<tr><th>アスペクト</th><td colspan='3'>"
         + astro.aspects.map(function (a) { return a.a + "-" + a.b + " " + a.name; }).join("　") + "</td></tr>";
    }
    c += "</tbody></table>";

    /* 紫微斗数 */
    c += "<h2>紫微斗数</h2>";
    if (!zw) {
      c += "<p class='guide-p'>出生時刻が不明のため、命盤は組みません。"
         + "<strong>時刻なしで命盤を作ると、結果を創作することになります。</strong>"
         + (lun ? "（旧暦は " + lun.text + "）" : "") + "</p>";
    } else {
      c += "<p class='guide-p'>旧暦 " + lun.text + "　／　命宮 " + zw.meiKan + zw.meiBranch
         + "　身宮 " + zw.shenPalace + "　／　" + zw.nayin + " → " + zw.kyokuName
         + "　／　紫微 " + zw.ziwei + "　天府 " + zw.tenfu + "</p>";
      c += '<table class="chart-tbl ziwei"><tbody>';
      zw.palaces.forEach(function (p) {
        c += "<tr" + (p.isMei ? ' class="cur"' : "") + "><th>" + p.name
           + (p.isShen ? "（身）" : "") + "</th><td>" + p.kan + p.branch + "</td>"
           + '<td class="cname">' + (p.stars.join("・") || "—") + "</td>"
           + "<td>" + p.meaning + "</td></tr>";
      });
      c += "</tbody></table>";
    }

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

    g += "<h2>五つの星（天干＝表に出ている／蔵干＝内側にある）</h2>";
    g += '<table class="chart-tbl"><tbody>';
    var lackedAny = false;
    ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
      var n = R.starNote[key];
      var where, note, cls;
      if (ms.stars.has[key])            { where = "表に出ている"; note = n.yes;    cls = ""; }
      else if (ms.stars.onlyBuried[key]) { where = "内側にある";   note = n.buried; cls = "mid"; }
      else                               { where = "なし";        note = n.no;     cls = "ng"; lackedAny = true; }
      g += "<tr class='" + cls + "'><th>" + n.name + "</th>"
         + "<td>" + where + "</td><td>" + note + "</td></tr>";
    });
    g += "</tbody></table>";
    g += "<p class='guide-p'>天干に出ている星は普段から使っている力です。"
       + "蔵干にしかない星は、持っているのに表へ出していない力で、相談の根本はたいていここにあります。"
       + "どちらにも無い星だけが、本当に欠けている働きです。</p>";
    if (!lackedAny) g += "<p class='guide-p'>五つとも、表か内かのどちらかにあります。完全な欠けはありません。</p>";
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

    /* 命式などを次の段階へ渡す */
    ctx = { name: name, y: y, m: m, d: d, hour: hour, minute: minute, pref: pref,
            gender: gender, tone: tone, topic: topic, ms: ms, du: du, k: k,
            age: age, curPillar: curPillar, num: num, astro: astro, lun: lun, zw: zw };

    el("k-out").classList.remove("hidden");
    el("k-draft-wrap").classList.add("hidden");
    el("k-cards-wrap").classList.add("hidden");
    tarot = null;
    el("k-out").scrollIntoView({ behavior: "smooth" });
  }

  /* ===== タロット ===== */

  function drawCards() {
    var r = window.Tarot.drawN(10);
    tarot = r;
    var h = '<p class="drawn-at">10枚　引いた時刻 ' + r.drawnAt + "</p>";
    h += '<table class="chart-tbl cards"><tbody>';
    r.cards.forEach(function (c) {
      h += "<tr><th>" + c.order + "枚目</th>"
         + '<td class="cname">' + esc(c.name) + "</td>"
         + '<td class="' + (c.reversed ? "rev" : "") + '">' + c.orientation + "</td>"
         + "<td>" + esc(c.keywords) + (c.field ? "<br><span class='cfield'>" + esc(c.field) + "</span>" : "")
         + "</td></tr>";
    });
    h += "</tbody></table>";
    el("k-cards").innerHTML = h;
    el("k-cards-wrap").classList.remove("hidden");
    el("k-cards-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ===== プロンプト生成 ===== */

  function makePrompt() {
    if (!ctx) return;
    var name = ctx.name, y = ctx.y, m = ctx.m, d = ctx.d;
    var hour = ctx.hour, minute = ctx.minute, pref = ctx.pref;
    var gender = ctx.gender, tone = ctx.tone, topic = ctx.topic;
    var ms = ctx.ms, du = ctx.du, k = ctx.k, age = ctx.age, curPillar = ctx.curPillar;
    var M = window.Meishiki, R = window.Reading;

    /* --- GPT用プロンプト --- */
    var P = [];
    function line(t) { P.push(t === undefined ? "" : t); }

    line("あなたは「黒の占い師」という、複数の占術を統合して鑑定する占い師です。");
    line("四柱推命を主軸とし、タロット・数秘術・西洋占星術を補助的に使用してください。");
    line("以下の命式と相談内容をもとに、有料の本鑑定書を作成してください。");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【キャラクター】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("・鑑定書の最初は、いただいた相談内容の振り返り（2〜4文）から始める。");
    line("　注文から納品まで時間が空くので、相談者は自分が何を書いたか忘れています。");
    line("　相談者の言葉を使って「今回いただいたのは◯◯のご相談です」と思い出させてから、");
    line("　すぐ「先に結論をお伝えします」で核心に入る。それ以外の前置き・挨拶はしない");
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
    if (ms.hasHour && pref) {
      line("出生地：" + pref + "　… 真太陽時に補正（" + (ms.solarOffset >= 0 ? "+" : "") + ms.solarOffset
         + "分）。補正後の時刻は" + ms.solarTimeText + "。時柱はこの補正後の時刻で立てています。");
    } else if (ms.hasHour) {
      line("出生地：不明　… 真太陽時の補正なし。時柱は境目の場合ずれる可能性があります。");
    } else {
      line("出生地：" + (pref || "不明"));
      line("出生時刻が不明のため、真太陽時の補正も時柱の算出も行っていません。三柱で判断します。");
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
    line("天干に出ている星：" + (ms.stars.list.join("・") || "なし"));
    line("蔵干（地支の中）の星：");
    ms.stars.zokan.forEach(function (z) {
      line("　" + z.shi + "　" + z.kans.join("") + " → " + z.stars.join("・"));
    });
    var surfaced = [], buriedOnly = [], absent = [];
    ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
      var n = R.starNote[key].name;
      if (ms.stars.has[key]) surfaced.push(n);
      else if (ms.stars.onlyBuried[key]) buriedOnly.push(n);
      else absent.push(n);
    });
    line();
    line("表に出ている星：" + (surfaced.join("・") || "なし"));
    line("内側にだけある星：" + (buriedOnly.join("・") || "なし"));
    line("どこにも無い星：" + (absent.join("・") || "なし（五つとも揃っている）"));
    line();
    line("※この三つを混同しないでください。");
    line("　表に出ている星は、普段から使っている力です。");
    line("　内側にだけある星は、持っているのに使えていない力です。「ありません」と書いてはいけません。");
    line("　どこにも無い星だけが、本当に欠けている働きです。");
    if (buriedOnly.length) {
      line();
      line("【内側にだけある星 ─ 相談の根本になりやすい場所】");
      ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
        if (ms.stars.onlyBuried[key]) line("　・" + R.starNote[key].name + " … " + R.starNote[key].buried);
      });
    }
    if (absent.length) {
      line();
      line("【どこにも無い星 ─ 本当に欠けている働き】");
      ["zaisei","kansei","insei","shokusho","hikyo"].forEach(function (key) {
        if (!ms.stars.hasAny[key]) line("　・" + R.starNote[key].name + "がない … " + R.starNote[key].no);
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
    line("【数秘術】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("ライフパス：" + ctx.num.lifePath + "（" + ctx.num.lifePathInfo.key + "）");
    line("　" + ctx.num.lifePathInfo.text);
    line("誕生数：" + ctx.num.birthday + "（" + ctx.num.birthdayInfo.key + "）");
    line("　" + ctx.num.birthdayInfo.text);
    line();
    line("個人年（9年で一巡する。その年に置かれるテーマ）");
    ctx.num.personalYears.forEach(function (v) {
      line("　" + v.year + "年：" + v.num + " … " + v.text);
    });
    line();

    line("━━━━━━━━━━━━━━━━━━━━");
    line("【西洋占星術】");
    line("━━━━━━━━━━━━━━━━━━━━");
    Object.keys(ctx.astro.planets).forEach(function (n) {
      line("　" + n + "：" + ctx.astro.planets[n].text);
    });
    if (ctx.astro.asc) {
      line("　アセンダント：" + ctx.astro.asc.text + "　… 外に見せている顔、第一印象");
      line("　MC：" + ctx.astro.mc.text + "　… 社会的な到達点、目指す方向");
    } else {
      line("　アセンダントとMCは、" + ascWhy(ms) + "が不明のため算出していません。");
      line("　推測で補わないでください。");
    }
    if (ctx.astro.aspects.length) {
      line();
      line("　主なアスペクト（天体どうしの角度。性質の組み合わさり方を見る）");
      ctx.astro.aspects.forEach(function (a) {
        line("　　" + a.a + " と " + a.b + "：" + a.name + "（誤差" + a.orb + "度）");
      });
    }
    line();

    line("━━━━━━━━━━━━━━━━━━━━");
    line("【紫微斗数】");
    line("━━━━━━━━━━━━━━━━━━━━");
    if (!ctx.zw) {
      line("出生時刻が不明のため、命盤を組んでいません。");
      line("紫微斗数の結果として何かを書くことは、創作になります。絶対に書かないでください。");
      if (ctx.lun) line("（旧暦は " + ctx.lun.text + " です）");
    } else {
      line("旧暦：" + ctx.lun.text + "（" + ctx.zw.ganzhiYear + "年）");
      line("命宮：" + ctx.zw.meiKan + ctx.zw.meiBranch + "　身宮：" + ctx.zw.shenPalace);
      line("五行局：" + ctx.zw.nayin + " → " + ctx.zw.kyokuName);
      line("紫微：" + ctx.zw.ziwei + "　天府：" + ctx.zw.tenfu);
      line();
      line("十二宮と主星");
      ctx.zw.palaces.forEach(function (p) {
        line("　" + (p.isMei ? "★" : "　") + p.name + "（" + p.kan + p.branch + "）"
           + "　" + (p.stars.join("・") || "主星なし") + "　… " + p.meaning);
      });
      line();
      line("※主星のない宮は、対面の宮の星を借りて読みます。");
    }
    line();

    line("━━━━━━━━━━━━━━━━━━━━");
    line("【この相談者への伝え方】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("通る言い方：" + R.advice[ms.tsuhen].in);
    line("逆効果になる言い方：" + R.advice[ms.tsuhen].out);
    line("今は動かす時期か：" + R.timing[ms.junisei]);
    line("本人の希望する伝え方：" + (tone === "hard" ? "覚悟して聞きたい" : "優しく聞きたい"));
    if (tone === "hard") {
      line("　→ 視えたものを全て、遠慮なく書いてください。クッションも、和らげる前置きも、");
      line("　　 フォローの一文も不要です。短く、冷たく、言い切って構いません。");
      line("　　 傷つくかどうかではなく、根拠があるかどうかだけで言葉を選んでください。");
      line("　　 ただし未来の断定（必ず・絶対・確実）だけはしません。");
    } else {
      line("　→ これが標準の強度です。結論は言い切り、厳しい現実もそのまま伝えます。");
      line("　　 問題を指摘したら、受け止めやすい言葉と改善方法を添えてください。");
      line("　　 都合のいい安心に変えないこと。");
    }
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
    if (tarot) {
      line("━━━━━━━━━━━━━━━━━━━━");
      line("【タロット】");
      line("━━━━━━━━━━━━━━━━━━━━");
      line("78枚から重複なしで10枚引きました。正位置・逆位置も1枚ずつ乱数で決めています。");
      line("引いた時刻：" + tarot.drawnAt);
      line();
      line("※このカードは、相談内容を読む前に無作為に引いたものです。");
      line("　差し替えたり、引き直したことにしないでください。");
      line();
      line("※以下の基礎キーワードは、解釈を固定するものではありません。");
      line("　鑑定文へそのまま書き写さないでください。相談内容との関係を優先して読み、");
      line("　相談者について書かれていない事実を、カードだけで作らないでください。");
      line("　カード名と正逆は変更禁止です。当て方だけを相談内容に合わせます。");
      line();
      tarot.cards.forEach(function (c) {
        line(c.order + "枚目　" + c.name + "（" + c.orientation + "）");
        line("　　基礎キーワード：" + c.keywords);
        if (c.field) line("　　主に扱う領域：" + c.field);
      });
      line();
      line("【カードの割り当て方 ─ ここは選ばないでください】");
      line("どのカードをどの悩みに当てるかを、あなたが選んではいけません。");
      line("選べる状態だと、都合のいいカードを都合のいい悩みに当てられてしまいます。");
      line("次の規則で機械的に決めてください。");
      line();
      line("　1. 相談文に書かれている悩みを、書かれている順に並べる");
      line("　2. 1枚目を1つ目の悩み、2枚目を2つ目の悩み、と順に対応させる");
      line("　3. 悩みが10個に満たず札が余ったら、余った分を順に次へ充てる");
      line("　　　・本人が気づいていないこと");
      line("　　　・今、助けになるもの");
      line("　　　・今、妨げになるもの");
      line("　　　・この相談への結論");
      line();
      line("　4. 悩みが10個を超えて札が足りない場合");
      line("　　　11個目以降の悩みには札が回りません。");
      line("　　　その悩みを黙って飛ばさないでください。");
      line("　　　「この悩みにはカードが回らなかった」と鑑定書に明記した上で、");
      line("　　　命式や他の材料から読んで、必ず答えを書いてください。");
      line("　　　書かれた悩みは、ひとつ残らず扱います。");
      line();
      line("　5. 余り札の役割は、上の並び順に固定です。組み替え禁止。");
      line("　　　悩みが6個なら、7枚目＝本人が気づいていないこと、8枚目＝今、助けになるもの、");
      line("　　　9枚目＝今、妨げになるもの、10枚目＝この相談への結論。必ずこの対応になります。");
      line("　　　章の名前を「今回の核心」「見落としていること」などに変えるのは構いませんが、");
      line("　　　札と役割の対応は動かせません。8枚目の札を「盲点」として読み替えることはできません。");
      line("　　　8枚目は「今、助けになるもの」としてだけ読みます。");
      line();
      line("　「本人が気づいていないこと」に札が回った場合は、");
      line("　相談文・命式・そのカードから確認できる盲点だけを扱ってください。");
      line("　本人の過去や心理を創作しないでください。");
      line("　たとえば下書きに書かれていない生い立ちを理由にするのは、事実でないことを売ることになります。");
      line();
      line("　対応表そのものは完成品に載せません（制作工程は見せない方針）。");
      line("　代わりに、次の二つを必ず守ってください。");
      line("　・各章で「この問いに出たのは◯◯・正位置です」の形で、札名と正逆を名指しする");
      line("　・10枚すべてを、どこかの章で使う。使わない札を作らない");
      line("　どの札がどの悩みに出たのかが、章を読めば分かる状態にします。");
      line("　札を伏せたり余らせたりすると、都合の悪い札を捨てたのと区別がつきません。");
      line("　札が回らなかった悩みがあれば、その章で「この悩みには札が回っていません」と書き、");
      line("　他の占術から答えます。");
      line();
      line("【読み方】");
      line("・カードの意味をそのまま書き写さないこと。相談内容に当てて読みます。");
      line("・鑑定書の中に、カード名と正逆を必ず明記してください。");
      line("　何を引いたか伏せると、後から都合よく選んだのと区別がつかなくなります。");
      line("・命式から読めることとカードが食い違う場合は、食い違い自体を書いてください。");
      line("　そこがこの人にとって一番重要な論点であることが多いためです。");
      line("・10枚も引いて、全部の札と全部の占術が同じ結論を向くことは、まずありません。");
      line("　書き終えて食い違いが一つも無ければ、それは読みを結論へ寄せた合図です。");
      line("　その場合は、結論に最も逆らう材料を1つ選び、章の中で正面から扱ってください。");
      line("　「この札もこう読めます」と結論へ丸めるのではなく、");
      line("　「この札は結論と逆を向いている。それでも進める理由は──」の形にします。");
      line();
    }

    line("━━━━━━━━━━━━━━━━━━━━");
    line("【ご相談内容】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line(topic || "（相談内容が未入力です。ここに相談文を貼ってください）");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【書き方の指示】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("0. 相談内容はフォームの回答をそのまま貼ってあります。");
    line("　 見出しは「一番鑑定してほしいこと」「悩み」「テーマ」「その他」です。");
    line("　 「悩み」は自由記述で、今の状況・迷っている選択肢・理想（どうなりたいか）・不安が");
    line("　 混ざって書かれています。見出しに分かれていなくても、文中から全部拾ってください。");
    line("　 理想らしき記述は着地点、不安らしき記述は「目を背けていること」の章に直結します。");
    line("　 冒頭の結論は「一番鑑定してほしいこと」への回答にしてください。");
    line("　 「テーマ」は章立ての範囲の確認に使います。テーマに挙がっているのに");
    line("　 相談文で触れられていない領域は、命式から読めることを補って軽く扱ってください。");
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
    line("6. 時期は具体的に示してください。");
    line("　 大運と年運を使い、「何年に何を意識するか」「何歳までは何を優先するか」を明確にします。");
    line("　 ぼかすと無料鑑定と変わらなくなります。");
    line("　 ただし「その年に必ず出来事が起こる」という未来の断定はしません。");
    line("　 年や年齢は言い切る。その年に起こることは言い切らない。この二つを区別してください。");
    line("　 　×「2028年に副業が成功します」");
    line("　 　○「2028年は、それまで試したものから一つに絞り、力を集中させる時期です」");
    line();
    line("7. 相談者が「どちらを選ぶべきか」と聞いている場合は、必ずどちらかを選んで答えてください。");
    line("　 両論併記にしないこと。選んだ理由を命式から示します。");
    line();
    line("8. 最後の章の前に「絶対にしてはいけないこと」を3つ入れてください。");
    line("　 やるべきことより、こちらの方が満足度に効きます。");
    line();
    line("9. 締めでは、決めるのは本人であることを伝えて主導権を返してください。");
    line();
    line("10. 複数の占術を使う場合：");
    line("　  結果を並べるだけにしないでください。相談内容に対する答えを出すために使います。");
    line("　  占術どうしが食い違う場合、無理に一致させないでください。");
    line("　  食い違い自体を書き、どちらを重く見るかを理由とともに示します。");
    line("　  そこがこの人にとって一番重要な論点であることが多いためです。");
    line("　  算出していないと明記されているものについては、何も書かないでください。");
    line("　  それらしい結果を作ると、事実でないことを売ることになります。");
    line();
    line("11. タロットが提示されている場合：");
    line("　  カードの意味をそのまま並べないでください。相談内容に当てて読みます。");
    line("　  鑑定書の中に、引いたカード名とその正逆を必ず明記してください。");
    line("　  何を引いたか隠すと、後から都合よく選んだのと区別がつかなくなります。");
    line("　  命式から読めることとカードが食い違う場合は、食い違い自体を書いてください。");
    line("　  そこがこの人にとって一番重要な論点であることが多いためです。");
    line();
    line("━━━━━━━━━━━━━━━━━━━━");
    line("【出力の形式】");
    line("━━━━━━━━━━━━━━━━━━━━");
    line("・全体は6,000〜9,000字程度を目安とする");
    line("・相談テーマが多い場合は多少超過してよい。少ない場合は無理に引き伸ばさない");
    line("・同じ内容の言い換えで文字数を増やさない");
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
    el("k-drawc").addEventListener("click", drawCards);
    el("k-redraw").addEventListener("click", drawCards);
    el("k-copy").addEventListener("click", copy);
    el("k-make").addEventListener("click", function () {
      makePrompt();
      el("k-draft-wrap").classList.remove("hidden");
      el("k-draft-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    el("k-copy").addEventListener("click", copy);
  });
})();
