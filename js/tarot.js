/* タロット
   78枚のフルデッキから、重複なしで引く。正位置・逆位置も引くたびに判定する。
   乱数は crypto.getRandomValues を使う。命式と違い、タロットは引くたびに変わるのが正しい。 */
window.Tarot = (function () {
  "use strict";

  /* ===== 大アルカナ 22枚 ===== */
  var MAJOR = [
    { n: 0,  name: "愚者",
      up: "始まり。まだ何者でもない自由さ。無計画だが、動き出す力がある。",
      rev: "無謀。考えなしの飛び込み。あるいは、怖くて一歩を踏み出せていない。" },
    { n: 1,  name: "魔術師",
      up: "材料は揃っている。あとは使うかどうか。始めるのに適した時。",
      rev: "力を持て余している。準備ばかりで着手していない。口先だけになりやすい。" },
    { n: 2,  name: "女教皇",
      up: "静かに見極める時。answersは内側にある。感情ではなく理知で。",
      rev: "考えすぎ。潔癖さが人を遠ざける。頭で否定して直感を殺している。" },
    { n: 3,  name: "女帝",
      up: "豊かさ、受け取る力、育てる力。関係が実る方向へ動く。",
      rev: "与えすぎ、抱え込みすぎ。甘やかしが相手を弱くしている。" },
    { n: 4,  name: "皇帝",
      up: "主導権を握る。決めて、責任を取る。型と秩序が力になる。",
      rev: "支配的になっている。あるいは責任から逃げ、決断を人に預けている。" },
    { n: 5,  name: "教皇",
      up: "型に沿うことで守られる。信頼できる助言者、既存の枠組み。",
      rev: "形骸化した決まり。従うふりをしている。助言が届いていない。" },
    { n: 6,  name: "恋人",
      up: "惹かれ合い、選ぶこと。心が動く方を取ってよい時。",
      rev: "優柔不断。感情に流された選択。誘惑に負けている。" },
    { n: 7,  name: "戦車",
      up: "前進。押し切る力がある。多少強引でも進めば結果が出る。",
      rev: "空回り。勢いだけで方向が定まっていない。あるいは停止している。" },
    { n: 8,  name: "力",
      up: "静かな強さ。時間をかけて手なずける。焦らず続ける力。",
      rev: "力任せ。感情に飲まれている。自信を失っている。" },
    { n: 9,  name: "隠者",
      up: "内へ向かう時。一人で考える。答えを外に求めない。",
      rev: "孤立。閉じこもりすぎ。あるいは人の意見に振り回されている。" },
    { n: 10, name: "運命の輪",
      up: "流れが変わる。予期しない展開。今動くと乗れる。",
      rev: "流れを逃す。悪い方への転換。タイミングが合っていない。" },
    { n: 11, name: "正義",
      up: "公平な判断。因果が返る。感情ではなく事実で決める時。",
      rev: "偏った判断。不公平が続いている。責任の所在が曖昧。" },
    { n: 12, name: "吊るされた男",
      up: "今は動けない時期。耐えることに意味がある。視点を変えると見える。",
      rev: "無駄な我慢。報われない努力。自分から犠牲になりに行っている。" },
    { n: 13, name: "死神",
      up: "終わり。ここで一度切れる。終わらせることで次が始まる。",
      rev: "終われない。しがみついている。ずるずると続いている。" },
    { n: 14, name: "節制",
      up: "混ぜ合わせ、整える。極端に振れず、少しずつ調整する時。",
      rev: "過不足。バランスを崩している。焦って一気に動こうとしている。" },
    { n: 15, name: "悪魔",
      up: "断ち切れない執着。分かっていてやめられない関係や習慣。",
      rev: "束縛からの脱出。目が覚める。ただし抜けるには痛みが伴う。" },
    { n: 16, name: "塔",
      up: "突然の崩壊。前提が壊れる。ただし、崩れたものは元々もろかった。",
      rev: "崩壊の予兆。先延ばしにしている。小さく壊して被害を抑える余地がある。" },
    { n: 17, name: "星",
      up: "希望。見通しが立つ。細いが確かな道筋が見えている。",
      rev: "期待外れ。理想が高すぎる。あるいは希望を失っている。" },
    { n: 18, name: "月",
      up: "不安と曖昧さ。本当のことが見えていない。惑わされやすい時。",
      rev: "霧が晴れる。誤解が解ける。不安の正体が分かる。" },
    { n: 19, name: "太陽",
      up: "明るい結果。隠さず出してよい。素直さが実る。",
      rev: "空元気。無邪気さが裏目に出る。結果が遅れている。" },
    { n: 20, name: "審判",
      up: "決着。過去が戻ってくる。やり直しが利く。呼ばれている。",
      rev: "決着がつかない。過去を清算できていない。呼び声を無視している。" },
    { n: 21, name: "世界",
      up: "完成。ひと区切り。ここまでのやり方が正しかった。",
      rev: "未完。あと一歩で止まっている。区切りをつけられない。" }
  ];

  /* ===== 小アルカナ ===== */
  var SUITS = [
    { name: "ワンド",   elem: "火", field: "情熱・意欲・行動" },
    { name: "カップ",   elem: "水", field: "感情・関係・心" },
    { name: "ソード",   elem: "風", field: "思考・言葉・対立" },
    { name: "ペンタクル", elem: "地", field: "現実・お金・仕事" }
  ];

  var RANKS = [
    { name: "エース", up: "始まり。種が置かれた状態", rev: "始められない。機会を掴み損ねている" },
    { name: "2",     up: "対と選択。二つの間で釣り合っている", rev: "決められない。均衡が崩れている" },
    { name: "3",     up: "形になり始める。共同で進む", rev: "空回り。噛み合っていない" },
    { name: "4",     up: "安定。守りに入る", rev: "停滞。守りすぎて動けない" },
    { name: "5",     up: "欠け、争い、思い通りにならない", rev: "争いの収束。あるいは長引く消耗" },
    { name: "6",     up: "回復と調和。流れが良い方へ向く", rev: "過去に戻れない。停滞したまま" },
    { name: "7",     up: "試練。粘りどころ", rev: "粘れない。投げ出したくなっている" },
    { name: "8",     up: "加速、積み上げ、集中", rev: "急ぎすぎ。あるいは失速" },
    { name: "9",     up: "達成間近。ただし孤独", rev: "あと一歩で崩れる。不安が勝っている" },
    { name: "10",    up: "完成と、その重さ", rev: "過剰。抱えきれなくなっている" },
    { name: "ペイジ", up: "学びの段階。知らせが来る", rev: "未熟。情報が不確か" },
    { name: "ナイト", up: "行動。突き進む", rev: "空回り。方向を誤っている" },
    { name: "クイーン", up: "受け入れる成熟。内側の充実", rev: "感情的。依存している" },
    { name: "キング", up: "統率。責任を持って決める", rev: "独善。支配的になっている" }
  ];

  /* ===== スプレッド ===== */
  var SPREADS = {
    three: {
      name: "スリーカード",
      note: "流れを見る。相談内容が絞れているときに向く。",
      pos: ["過去 ─ ここまでの経緯", "現在 ─ 今の状態", "近い未来 ─ このまま進んだ場合"]
    },
    choice: {
      name: "二者択一",
      note: "「AとBで迷っている」相談に向く。フォームの『迷っている選択肢』がある場合はこれ。",
      pos: ["現在の状況", "Aを選んだ場合の流れ", "Aを選んだ先に待つもの",
            "Bを選んだ場合の流れ", "Bを選んだ先に待つもの", "助言 ─ 判断の軸"]
    },
    celtic: {
      name: "ケルト十字",
      note: "最も深く読む。相談が複雑なとき、人生全体の相談のときに。",
      pos: ["現在の状況", "障害 ─ 立ちはだかっているもの", "顕在意識 ─ 本人が自覚していること",
            "潜在意識 ─ 本人が気づいていない本音", "過去 ─ 手放しつつあるもの", "近い未来 ─ これから来るもの",
            "本人の姿勢", "周囲の環境・他者の目", "希望と不安", "最終的な結果"]
    },
    one: {
      name: "ワンオラクル",
      note: "一点だけを問う。補助的に使う。",
      pos: ["答え"]
    },
    custom: {
      name: "カスタム",
      note: "相談内容からポジションを自分で組む。有料鑑定ではこれが最も噛み合う。",
      pos: []   /* 実行時に差し込む */
    }
  };

  /* 相談内容から組むときの下敷き。そのまま使わず、相談に合わせて書き換える前提 */
  var CUSTOM_TEMPLATE = [
    "現在の状態",
    "Aの道を選んだ場合",
    "Bの道を選んだ場合",
    "この人が活かすべき資質",
    "本人が見落としていること",
    "近い将来に来るもの",
    "この相談への助言"
  ];

  /* ===== 引く ===== */

  /* 78枚のデッキを作る */
  function deck() {
    var d = [], i, s, r;
    for (i = 0; i < MAJOR.length; i++) {
      d.push({ type: "major", idx: i });
    }
    for (s = 0; s < SUITS.length; s++) {
      for (r = 0; r < RANKS.length; r++) {
        d.push({ type: "minor", suit: s, rank: r });
      }
    }
    return d;
  }

  /* 暗号論的乱数で 0〜max-1 を返す（剰余の偏りを避ける） */
  function rnd(max) {
    var limit = Math.floor(0xFFFFFFFF / max) * max;
    var a = new Uint32Array(1);
    do { crypto.getRandomValues(a); } while (a[0] >= limit);
    return a[0] % max;
  }

  /* フィッシャー・イェーツでシャッフル */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rnd(i + 1);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function describe(card) {
    if (card.type === "major") {
      var m = MAJOR[card.idx];
      return {
        label: m.name + "（大アルカナ " + m.n + "）",
        name: m.name,
        arcana: "大アルカナ " + m.n,
        meaning: card.rev ? m.rev : m.up
      };
    }
    var s = SUITS[card.suit], r = RANKS[card.rank];
    return {
      label: s.name + "の" + r.name,
      name: s.name + "の" + r.name,
      arcana: "小アルカナ・" + s.name + "（" + s.elem + "／" + s.field + "）",
      meaning: (card.rev ? r.rev : r.up) + "。扱う領域は" + s.field + "。"
    };
  }

  /* スプレッドを引く */
  function draw(spreadKey, customPositions) {
    var sp = SPREADS[spreadKey];
    if (!sp) return null;
    var positions = (spreadKey === "custom")
      ? (customPositions || []).filter(function (t) { return t && t.trim(); })
      : sp.pos;
    if (!positions.length) return null;
    if (positions.length > 20) positions = positions.slice(0, 20);
    var d = shuffle(deck());
    var out = [];
    for (var i = 0; i < positions.length; i++) {
      var c = d[i];
      c.rev = (rnd(2) === 1);          // 正位置・逆位置を1枚ずつ判定
      var info = describe(c);
      out.push({
        position: positions[i],
        name: info.name,
        arcana: info.arcana,
        reversed: c.rev,
        orientation: c.rev ? "逆位置" : "正位置",
        meaning: info.meaning
      });
    }
    return { key: spreadKey, spread: sp.name, note: sp.note, cards: out,
             drawnAt: new Date().toLocaleString("ja-JP") };
  }

  return {
    SPREADS: SPREADS,
    CUSTOM_TEMPLATE: CUSTOM_TEMPLATE,
    draw: draw
  };
})();
