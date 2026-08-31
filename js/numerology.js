/* 数秘術
   生年月日から算出する。11・22・33はマスターナンバーとして還元しない。 */
window.Numerology = (function () {
  "use strict";

  var MASTER = [11, 22, 33];

  function reduce(n) {
    while (n > 9 && MASTER.indexOf(n) === -1) {
      n = String(n).split("").reduce(function (a, c) { return a + Number(c); }, 0);
    }
    return n;
  }

  function digitSum(n) {
    return String(n).split("").reduce(function (a, c) { return a + Number(c); }, 0);
  }

  /* ライフパス：年・月・日をそれぞれ還元してから合計し、もう一度還元する */
  function lifePath(y, m, d) {
    var parts = [reduce(digitSum(y)), reduce(m), reduce(d)];
    return { value: reduce(parts.reduce(function (a, b) { return a + b; }, 0)), parts: parts };
  }

  /* 誕生数：生まれた日 */
  function birthday(d) { return reduce(d); }

  /* 1〜9へ完全に還元する。マスターナンバーを残さない */
  function reduceFull(n) {
    while (n > 9) n = digitSum(n);
    return n;
  }

  /* 個人年数：その年に本人が置かれるテーマ。
     個人年は9年で一巡するものなので、11や22を残さず1〜9に還元する。 */
  function personalYear(m, d, year) {
    return reduceFull(reduceFull(m) + reduceFull(d) + reduceFull(digitSum(year)));
  }

  var LIFE = {
    1:  { key: "始める人", text: "先頭に立って動き出す数。人の後ろを歩くと力が鈍る。決めるのが速い代わりに、周りを置き去りにしやすい。" },
    2:  { key: "支える人", text: "人と人の間で力を出す数。単独では実力の半分も出ない。ただし合わせすぎて自分の輪郭を失いやすい。" },
    3:  { key: "表す人",   text: "表現で開く数。楽しんでいるときだけ結果が出る。飽きやすさが最大の弱点。" },
    4:  { key: "築く人",   text: "積み上げる数。手順と型がある場所で強い。融通が利かず、変化に弱い。" },
    5:  { key: "動く人",   text: "変化で生きる数。同じ場所に留まると腐る。自由を求めるあまり、続けることが苦手。" },
    6:  { key: "引き受ける人", text: "面倒を見る数。頼られると断れない。抱えすぎて自分の番を後回しにする。" },
    7:  { key: "見極める人", text: "内へ掘る数。一人の時間が要る。考えることで、決めることから逃げられる。" },
    8:  { key: "動かす人", text: "現実を動かす数。金と力と結果に縁がある。極端に振れやすく、失うときも大きい。" },
    9:  { key: "手放す人", text: "広く受け取る数。人のために動けるが、自分の望みを言葉にするのが下手。" },
    11: { key: "感じ取る人", text: "マスターナンバー。人が見落とすものを拾う。ただし拾いすぎて消耗する。周りの反応に流されやすい。" },
    22: { key: "形にする人", text: "マスターナンバー。大きなものを現実にする数。器が大きい分、中途半端だと何も残らない。" },
    33: { key: "注ぐ人",   text: "マスターナンバー。無条件に与える数。境界がなく、自分が空になるまで与えてしまう。" }
  };

  var PY = {
    1: "始める年。種を蒔く。ここで動かないと、9年周期の全部が遅れる。",
    2: "育てる年。目立たない。人との関係を整える時期。",
    3: "表に出す年。発信、表現、人が集まる。",
    4: "固める年。地道な作業。土台を作る。",
    5: "動く年。変化、移動、予定外のことが起きる。",
    6: "背負う年。責任、家庭、人の世話。",
    7: "内へ向かう年。立ち止まって考える。結果を求めない。",
    8: "実る年。現実的な成果と金銭が動く。",
    9: "終わる年。手放し、片づける。次の周期の準備。"
  };

  function build(y, m, d, thisYear) {
    var lp = lifePath(y, m, d);
    var bd = birthday(d);
    var years = [];
    for (var i = 0; i < 5; i++) {
      var yy = thisYear + i;
      var n = personalYear(m, d, yy);
      years.push({ year: yy, num: n, text: PY[n] });
    }
    return {
      lifePath: lp.value,
      lifePathParts: lp.parts,
      lifePathInfo: LIFE[lp.value],
      birthday: bd,
      birthdayInfo: LIFE[bd],
      personalYears: years
    };
  }

  return { build: build, reduce: reduce };
})();
