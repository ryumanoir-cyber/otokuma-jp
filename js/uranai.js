/* 黒の占い師 — 無料鑑定エンジン
   すべて端末内で完結。送信も保存もしない。
   同じ入力からは必ず同じ結果が出る（決定的）。 */
(function () {
  "use strict";

  /* ============ テキストライブラリ ============ */

  var LIFE = {
    1: "あなたは本来、先に動く人です。今はその力が止まっているだけです。",
    2: "あなたは人の間に立つ人です。合わせすぎると、自分の輪郭が薄くなります。",
    3: "あなたは場を明るくする人です。その分、しんどさを見せるのが下手です。",
    4: "あなたは積み上げる人です。その着実さが、動けなさに変わることがあります。",
    5: "あなたは変化で生きる人です。同じ場所に長くいると、力が鈍ります。",
    6: "あなたは引き受ける人です。抱えすぎて、自分の番を後回しにしています。",
    7: "あなたは考える人です。考えることで、決めることから逃げられてしまいます。",
    8: "あなたは結果で語る人です。数字が出ないとき、自分を責めすぎます。",
    9: "あなたは察する人です。察するがゆえに、言わずに終わらせがちです。"
  };

  var DATA = {
    love: {
      name: "恋愛",
      states: [
        { label: "片思い。まだ気持ちを伝えていない",
          verdict: "あなたは、もう答えを知っています。確かめるのが怖いだけです。",
          reality: ["今の関係は、あなたが動かない限り、来年の今日も同じ形です。",
                    "悪くなるという意味ではありません。「何も起きない」という意味です。"] },
        { label: "会うけれど、関係に名前がない",
          verdict: "その距離は、お相手が選んでいるものです。",
          reality: ["この関係は、あなたが確かめない限り続きます。",
                    "続くというのは、良いことではありません。何も決まらないまま時間だけが過ぎるということです。"] },
        { label: "終わった相手が忘れられない",
          verdict: "忘れられないのは、まだ終わっていないからではありません。終わらせていないからです。",
          reality: ["連絡を待っている限り、この件はあなたの手の中に戻りません。",
                    "待つというのは、決めないことの言い換えです。"] },
        { label: "交際している。でも続くか不安",
          verdict: "不安の原因は、お相手ではありません。確かめないまま続けていることです。",
          reality: ["聞かないままなら、その不安が消えることはありません。",
                    "関係が終わるからではなく、確かめていないから消えないのです。"] }
      ],
      seen: [
        "あなたは、自分の気持ちを最後まで伝えきれていません",
        "お相手は、あなたの好意に気づいています",
        "あなたが待っているうちは、お相手から動くことはありません",
        "あなたは相手の言葉より、相手の沈黙を気にしています",
        "あなたは「嫌われないこと」を、いちばん上に置いています",
        "あなたの中で、答えはもう出ています。認めたくないだけです",
        "あなたは、この関係に名前をつけることを避けています",
        "あなたは一度、引き返せる場所で立ち止まりました"
      ],
      signs: [
        "相手からの連絡を、一日に何度も確認してしまう",
        "自分から誘うことを「重いと思われるかも」と我慢している",
        "友人に相談しても、聞きたい答えが返ってこない",
        "「そのうち変わるかもしれない」と思って、半年以上経っている",
        "相手の予定に、自分の予定を合わせている",
        "既読がついたまま、画面を何度も見てしまう",
        "相手の何気ない一言を、何日も考えている",
        "別の人を勧められると、なぜか少し腹が立つ"
      ]
    },

    work: {
      name: "仕事",
      states: [
        { label: "今の職場が合わない",
          verdict: "合わないのではありません。合わせないと決めていないだけです。",
          reality: ["今の状態は、あなたが動かない限り来年も同じです。",
                    "耐えられなくなるのではありません。慣れていきます。それがいちばん時間を失います。"] },
        { label: "評価されていないと感じる",
          verdict: "評価されないのは、能力の問題ではありません。",
          reality: ["黙って積み上げても、見えないものは評価されません。",
                    "不当だからではなく、そういう仕組みだからです。"] },
        { label: "転職を迷っている",
          verdict: "迷っているのではありません。決める材料を、まだ自分に許していないだけです。",
          reality: ["情報を集めても決まりません。決めてから、情報が意味を持ちます。",
                    "順番が逆のままなら、来年も同じ場所にいます。"] },
        { label: "やりたいことが分からない",
          verdict: "分からないのではありません。選ぶと失うものがあるから、決めていないだけです。",
          reality: ["探しても出てきません。やってみた中からしか出ないからです。",
                    "考えている限り、答えが増えることはありません。"] }
      ],
      seen: [
        "あなたは、今の場所で本気を出していません",
        "あなたは「認められること」を、報酬より上に置いています",
        "あなたは、正しさで戦おうとして疲れています",
        "あなたは、見えるところで働いていません",
        "あなたは、辞める理由を集めています",
        "あなたは、誰かに背中を押してほしいと思っています",
        "あなたの不満は、待遇ではなく扱われ方にあります",
        "あなたは、比べる相手を間違えています"
      ],
      signs: [
        "日曜の夜になると、気分が重くなる",
        "職場の誰かの発言を、家に帰ってからも考えている",
        "求人サイトを開くが、応募はしていない",
        "「あと一年だけ」と、何年も言っている",
        "自分の成果を、口に出して伝えたことがない",
        "頑張っている自覚があるのに、認められた実感がない",
        "辞めた人のことが、やけに気になる",
        "給料の額より、扱われ方に腹が立っている"
      ]
    },

    money: {
      name: "金運",
      states: [
        { label: "お金が貯まらない",
          verdict: "お金が貯まらないのは、収入のせいではありません。",
          reality: ["減らす工夫だけを続ける限り、来年も同じです。",
                    "足りないのではなく、出ていく先を見ていないだけです。"] },
        { label: "収入を増やしたい",
          verdict: "増やしたいと思っているだけで、まだ何も変えていません。",
          reality: ["望むだけでは変わりません。",
                    "今の使い方のまま額だけ増えても、手元に残る額は変わりません。"] },
        { label: "何に使っているか分からない",
          verdict: "分からないのではありません。見ていないだけです。",
          reality: ["見ないままなら、この状態は続きます。",
                    "悪くなるのではありません。ずっと同じままです。"] },
        { label: "将来のお金が不安",
          verdict: "不安なのは、金額ではありません。把握していないからです。",
          reality: ["数字にしない限り、その不安が消えることはありません。",
                    "不安の正体は足りなさではなく、分からないという状態です。"] }
      ],
      seen: [
        "あなたは、収入が増えれば解決すると思っています",
        "あなたは、支出の全体を一度も数えたことがありません",
        "あなたは、節約は得意ですが、配分が苦手です",
        "あなたは、人と比べたときだけ不安になります",
        "あなたは、必要かどうかより「気分」で買っています",
        "あなたは、お金の話題を避けています",
        "あなたは、将来のことを考えるのを先送りしています",
        "あなたは、稼ぐことより減らさないことに意識が向いています"
      ],
      signs: [
        "給料日の直後だけ、気が大きくなる",
        "残高を見るのが、少し怖い",
        "「これくらいなら」で買ったものが、部屋にいくつもある",
        "固定費を見直そうと思って、そのままになっている",
        "人の年収を聞くと、その日ずっと考えてしまう",
        "先月、何にいくら使ったかを答えられない",
        "貯めようと決めた金額を、一度も達成していない",
        "将来の話になると、話題を変えたくなる"
      ]
    },

    human: {
      name: "人間関係",
      states: [
        { label: "苦手な人がいる",
          verdict: "その人が変わることはありません。変えられるのは距離だけです。",
          reality: ["距離を変えない限り、同じことが繰り返されます。",
                    "相手に悪気があるかどうかは、関係ありません。"] },
        { label: "距離感が分からない",
          verdict: "分からないのではありません。嫌われる可能性を引き受けたくないだけです。",
          reality: ["探り続ける限り、この疲れは減りません。",
                    "間違えないことを目的にすると、関係は近づきません。"] },
        { label: "ずっと我慢している",
          verdict: "あなたが我慢すれば済む、と思っている人がいます。",
          reality: ["その人は、これからも同じことをします。",
                    "あなたが黙っている限り、それは通じたことになっているからです。"] },
        { label: "ひとりだと感じる",
          verdict: "あなたは、人がいないのではありません。話していないだけです。",
          reality: ["待っていても、状況は変わりません。",
                    "減っていくのではなく、増えないだけです。"] }
      ],
      seen: [
        "あなたは、断ることに強い抵抗があります",
        "あなたは、その場を丸く収める役をずっとやっています",
        "あなたは、相手の機嫌を先に読んでいます",
        "あなたは、言わなかったことを何度も思い返しています",
        "あなたは、嫌われることより、気まずくなることを恐れています",
        "あなたは、必要とされることで自分の位置を確かめています",
        "あなたは、頼るのが下手です",
        "あなたは、去っていった人のことを長く覚えています"
      ],
      signs: [
        "用件のない連絡を、自分からはしない",
        "集まりのあと、自分の発言を思い返してしまう",
        "誘いを断ったあと、罪悪感が残る",
        "相手からの返信の速さで、気分が変わる",
        "頼まれごとを、いつも引き受けている",
        "本音を言える相手が、思い浮かばない",
        "誰かが不機嫌だと、自分のせいかと考える",
        "「大丈夫」と言うのが口ぐせになっている"
      ]
    },

    general: {
      name: "総合",
      states: [
        { label: "停滞している",
          verdict: "止まっているのではありません。同じことを選び続けているだけです。",
          reality: ["今のままなら、来年の今日も同じ景色です。",
                    "悪くなるのではありません。何も起きないだけです。"] },
        { label: "決められないことがある",
          verdict: "決められないのではありません。決めた後を、まだ引き受けていないだけです。",
          reality: ["迷っている時間は、選ばなかったことと同じ結果になります。",
                    "決めずにいると、時間が代わりに決めてしまいます。"] },
        { label: "疲れている",
          verdict: "疲れているのは、やることが多いからではありません。",
          reality: ["休んでも戻りません。減らしていないからです。",
                    "抱えたまま休んでも、同じ場所に戻るだけです。"] },
        { label: "何かが変わりそうな気がする",
          verdict: "変わりそうなのではありません。もう変わり始めています。",
          reality: ["気づかないふりを続けると、選ぶ側から選ばれる側に回ります。",
                    "流れは、こちらの準備を待ってはくれません。"] }
      ],
      seen: [
        "あなたは、変えたい気持ちと変わらない安心を、両方持っています",
        "あなたは、他人の中に答えを探しています",
        "あなたは、いちばん大事なことを後回しにしています",
        "あなたは、疲れを認めることを避けています",
        "あなたは、期待されることに応え続けています",
        "あなたは、始める前に完璧な条件を待っています",
        "あなたは、過去の選択をまだ精算していません",
        "あなたは、自分の望みを言葉にしていません"
      ],
      signs: [
        "気づくと、同じことを検索している",
        "予定のない日ができると、落ち着かない",
        "「今年こそ」と、毎年思っている",
        "眠っても、疲れが取れた感じがしない",
        "やりたいことを聞かれると、答えに詰まる",
        "誰かの成功を見ると、少し苦しくなる",
        "部屋か財布か、どちらかが片づいていない",
        "決めたことを、いつのまにか先延ばしにしている"
      ]
    }
  };

  var ORDER = ["love", "work", "money", "human", "general"];

  /* ============ ユーティリティ ============ */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  // seed から pool を決定的にシャッフルして n 件取る
  function pick(pool, n, seed) {
    var arr = pool.slice();
    var s = seed;
    for (var i = arr.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      var j = s % (i + 1);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr.slice(0, n);
  }

  function lifeNumber(y, m, d) {
    var n = String(y) + String(m) + String(d);
    var sum = 0, i;
    for (i = 0; i < n.length; i++) sum += Number(n[i]);
    while (sum > 9) {
      var t = 0;
      String(sum).split("").forEach(function (c) { t += Number(c); });
      sum = t;
    }
    return sum || 9;
  }

  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove("hidden"); }
  function hide(id) { el(id).classList.add("hidden"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ============ 状態 ============ */

  var pickState = { y: 0, m: 0, d: 0, cat: null, st: 0 };

  /* ============ 初期化 ============ */

  function initDate() {
    var y = el("year"), m = el("month"), d = el("day");
    var now = new Date().getFullYear();
    var i;
    for (i = now - 15; i >= 1940; i--) y.add(new Option(i, i));
    for (i = 1; i <= 12; i++) m.add(new Option(i, i));
    for (i = 1; i <= 31; i++) d.add(new Option(i, i));
    y.value = 1995; m.value = 1; d.value = 1;
  }

  function initCategories() {
    var box = el("categoryChoices");
    box.innerHTML = "";
    ORDER.forEach(function (key) {
      var b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = DATA[key].name;
      b.addEventListener("click", function () {
        pickState.cat = key;
        renderStates(key);
        hide("step2"); show("step3");
        window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
      });
      box.appendChild(b);
    });
  }

  function renderStates(key) {
    var box = el("stateChoices");
    box.innerHTML = "";
    DATA[key].states.forEach(function (s, idx) {
      var b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = s.label;
      b.addEventListener("click", function () {
        pickState.st = idx;
        run();
      });
      box.appendChild(b);
    });
  }

  /* ============ 鑑定 ============ */

  var LOADING = ["視ています", "視ています．", "視ています．．", "視ています．．．"];

  function run() {
    hide("step3"); show("loading");
    window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });

    var i = 0;
    var timer = setInterval(function () {
      el("loadingText").textContent = LOADING[i % LOADING.length];
      i++;
    }, 400);

    setTimeout(function () {
      clearInterval(timer);
      render();
      hide("loading"); show("result");
      window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
    }, 2600);
  }

  function render() {
    var y = Number(el("year").value),
        m = Number(el("month").value),
        d = Number(el("day").value);
    var cat = DATA[pickState.cat];
    var st = cat.states[pickState.st];
    var seed = hash(y + "-" + m + "-" + d + "-" + pickState.cat + "-" + pickState.st);
    var ln = lifeNumber(y, m, d);

    var seen = pick(cat.seen, 4, seed);
    var signs = pick(cat.signs, 4, seed ^ 0x9e3779b9);

    var h = "";
    h += '<p class="verdict">' + esc(st.verdict) + "</p>";

    h += "<h3>視えたもの</h3>";
    h += "<ul>";
    seen.forEach(function (s) { h += "<li>" + esc(s) + "</li>"; });
    h += "</ul>";

    h += "<h3>心当たりはありませんか</h3>";
    h += "<ul>";
    signs.forEach(function (s) { h += "<li>" + esc(s) + "</li>"; });
    h += "</ul>";

    h += "<h3>あなたという人について</h3>";
    h += "<p>" + esc(LIFE[ln]) + "</p>";

    h += "<h3>はっきり申し上げます</h3>";
    st.reality.forEach(function (p) { h += "<p>" + esc(p) + "</p>"; });
    h += "<p>これは決まった未来ではありません。今のままなら、そうなるというだけです。</p>";

    el("reading").innerHTML = h;
  }

  /* ============ 配線 ============ */

  document.addEventListener("DOMContentLoaded", function () {
    initDate();
    initCategories();

    el("to2").addEventListener("click", function () {
      hide("step1"); show("step2");
      window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
    });

    el("again").addEventListener("click", function () {
      hide("result"); show("step2");
      window.scrollTo({ top: el("start").offsetTop - 20, behavior: "smooth" });
    });
  });
})();
