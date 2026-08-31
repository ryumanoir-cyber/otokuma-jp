/* 紫微斗数
   旧暦の月日と時辰から命盤を組む。
   十二宮・命宮・身宮・五行局・十四主星を配置する。 */
window.Ziwei = (function () {
  "use strict";

  var KAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  var SHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  /* 命宮から逆行に並ぶ十二宮 */
  var PALACES = ["命宮","兄弟宮","夫妻宮","子女宮","財帛宮","疾厄宮",
                 "遷移宮","交友宮","官禄宮","田宅宮","福徳宮","父母宮"];

  var PALACE_MEAN = {
    "命宮":   "本人の性質。人生全体の軸",
    "兄弟宮": "兄弟姉妹、対等な立場の相手",
    "夫妻宮": "配偶者、恋愛の相手",
    "子女宮": "子ども、部下、生み出すもの",
    "財帛宮": "お金の入り方と扱い方",
    "疾厄宮": "体質、抱えやすい弱り方",
    "遷移宮": "外での動き、移動、対外的な見え方",
    "交友宮": "友人、同僚、周囲の人間関係",
    "官禄宮": "仕事、社会での立場",
    "田宅宮": "住まい、不動産、家庭の土台",
    "福徳宮": "内面の満足、価値観、楽しみ",
    "父母宮": "親、目上、庇護してくれる存在"
  };

  /* 六十干支の納音五行。二支ずつ同じ五行になる */
  var NAYIN = ["金","火","木","土","金","火","水","土","金","木",
               "水","土","火","木","水","金","火","木","土","金",
               "火","水","土","金","木","水","土","火","木","水"];
  var KYOKU = { "水": 2, "木": 3, "金": 4, "土": 5, "火": 6 };
  var KYOKU_NAME = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };

  function mod12(n) { return ((n % 12) + 12) % 12; }

  /* 五虎遁：年干から寅宮の天干を決め、そこから各宮に干を振る */
  function palaceKan(yearKanIdx, palaceIdx) {
    var base = [2, 4, 6, 8, 0][yearKanIdx % 5];   // 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
    var offset = mod12(palaceIdx - 2);            // 寅からいくつ進んだか
    return (base + offset) % 10;
  }

  /* 干支の組み合わせから六十干支の番号 */
  function kanshiIndex(kanIdx, shiIdx) {
    for (var n = 0; n < 60; n++) if (n % 10 === kanIdx && n % 12 === shiIdx) return n;
    return 0;
  }

  /* 紫微星の位置。局数と旧暦日から決める */
  function ziweiPos(kyoku, day) {
    var quotient = Math.ceil(day / kyoku);
    var remainder = kyoku * quotient - day;
    /* 余りが偶数なら順行に足し、奇数なら逆行に引く */
    var step = (remainder % 2 === 0) ? remainder : -remainder;
    return mod12(2 + (quotient - 1) + step);      // 寅(2)を起点にする
  }

  function build(lunarMonth, lunarDay, hourShiIdx, yearKanIdx, yearShiIdx, isLeap) {
    /* 閏月は前半を本月、後半を次月として扱う（一般的な扱い） */
    var m = lunarMonth;
    if (isLeap && lunarDay > 15) m = (lunarMonth % 12) + 1;

    /* 命宮：寅から月数だけ順行し、時辰だけ逆行する */
    var meiIdx = mod12(2 + (m - 1) - hourShiIdx);
    /* 身宮：寅から月数だけ順行し、時辰だけ順行する */
    var shenIdx = mod12(2 + (m - 1) + hourShiIdx);

    /* 命宮の干支から五行局を決める */
    var meiKan = palaceKan(yearKanIdx, meiIdx);
    var nayin = NAYIN[Math.floor(kanshiIndex(meiKan, meiIdx) / 2)];
    var kyoku = KYOKU[nayin];

    /* 紫微と天府 */
    var zw = ziweiPos(kyoku, lunarDay);
    var tf = mod12(4 - zw);

    /* 十四主星の配置 */
    var stars = {};
    function put(idx, name) { (stars[idx] = stars[idx] || []).push(name); }
    put(zw, "紫微");
    put(mod12(zw - 1), "天機");
    put(mod12(zw - 3), "太陽");
    put(mod12(zw - 4), "武曲");
    put(mod12(zw - 5), "天同");
    put(mod12(zw - 8), "廉貞");
    put(tf, "天府");
    put(mod12(tf + 1), "太陰");
    put(mod12(tf + 2), "貪狼");
    put(mod12(tf + 3), "巨門");
    put(mod12(tf + 4), "天相");
    put(mod12(tf + 5), "天梁");
    put(mod12(tf + 6), "七殺");
    put(mod12(tf + 10), "破軍");

    /* 十二宮を命宮から逆行に並べる */
    var palaces = [];
    for (var i = 0; i < 12; i++) {
      var idx = mod12(meiIdx - i);
      palaces.push({
        name: PALACES[i],
        meaning: PALACE_MEAN[PALACES[i]],
        branch: SHI[idx],
        kan: KAN[palaceKan(yearKanIdx, idx)],
        stars: (stars[idx] || []).slice(),
        isMei: idx === meiIdx,
        isShen: idx === shenIdx
      });
    }

    return {
      lunarMonthUsed: m,
      meiBranch: SHI[meiIdx],
      meiKan: KAN[meiKan],
      shenBranch: SHI[shenIdx],
      shenPalace: palaces.filter(function (p) { return p.isShen; })[0].name,
      nayin: nayin,
      kyoku: kyoku,
      kyokuName: KYOKU_NAME[kyoku],
      ziwei: SHI[zw],
      tenfu: SHI[tf],
      palaces: palaces
    };
  }

  return { build: build, PALACES: PALACES, KYOKU_NAME: KYOKU_NAME };
})();
