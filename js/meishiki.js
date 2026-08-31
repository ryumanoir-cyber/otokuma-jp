/* 四柱推命 命式計算
   年柱・月柱・日柱を算出する（時柱は出生時刻が必要なため対象外）。
   すべて端末内で計算。外部通信なし。 */
window.Meishiki = (function () {
  "use strict";

  var KAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  var SHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  var KAN_YOMI = {
    "甲":"きのえ","乙":"きのと","丙":"ひのえ","丁":"ひのと","戊":"つちのえ",
    "己":"つちのと","庚":"かのえ","辛":"かのと","壬":"みずのえ","癸":"みずのと"
  };
  // 十干の五行（0:木 1:火 2:土 3:金 4:水）
  var KAN_GYO = [0,0,1,1,2,2,3,3,4,4];
  var GYO_NAME = ["木","火","土","金","水"];

  /* 節入り（近似）。四柱推命の月は暦月ではなく節で切り替わる。
     実際の節入りは年により最大1日前後する。 */
  var SETSU = [
    { m: 1,  d: 6,  shi: 1  }, // 小寒 → 丑
    { m: 2,  d: 4,  shi: 2  }, // 立春 → 寅（ここが年の変わり目）
    { m: 3,  d: 6,  shi: 3  }, // 啓蟄 → 卯
    { m: 4,  d: 5,  shi: 4  }, // 清明 → 辰
    { m: 5,  d: 6,  shi: 5  }, // 立夏 → 巳
    { m: 6,  d: 6,  shi: 6  }, // 芒種 → 午
    { m: 7,  d: 7,  shi: 7  }, // 小暑 → 未
    { m: 8,  d: 8,  shi: 8  }, // 立秋 → 申
    { m: 9,  d: 8,  shi: 9  }, // 白露 → 酉
    { m: 10, d: 8,  shi: 10 }, // 寒露 → 戌
    { m: 11, d: 7,  shi: 11 }, // 立冬 → 亥
    { m: 12, d: 7,  shi: 0  }  // 大雪 → 子
  ];

  /* ユリウス通日 */
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
      + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  /* 日柱の基準
     1996年12月28日 = 己亥日（六十干支の35番）を基準とする。
     外部の万年暦2件で照合済み。
     ※ずれが見つかった場合はこの2定数だけ直せば全体が直る */
  var ANCHOR_JDN = jdn(1996, 12, 28);
  var ANCHOR_IDX = 35; // 己亥

  function dayPillar(y, m, d) {
    var n = ((jdn(y, m, d) - ANCHOR_JDN + ANCHOR_IDX) % 60 + 60) % 60;
    return { kan: n % 10, shi: n % 12, idx: n };
  }

  /* 節による「四柱推命上の年月」 */
  function solarMonth(y, m, d) {
    var i, s, cur = null;
    for (i = SETSU.length - 1; i >= 0; i--) {
      s = SETSU[i];
      if (m > s.m || (m === s.m && d >= s.d)) { cur = s; break; }
    }
    if (cur === null) cur = SETSU[SETSU.length - 1]; // 1/1〜1/5 は前年の大雪（子月）
    // 立春前は前年扱い
    var sy = y;
    if (m < 2 || (m === 2 && d < 4)) sy = y - 1;
    return { shi: cur.shi, year: sy, setsu: cur };
  }

  function yearPillar(sy) {
    var n = ((sy - 4) % 60 + 60) % 60;
    return { kan: n % 10, shi: n % 12, idx: n };
  }

  /* 月干：五虎遁（年干から寅月の干を決め、そこから順に進める） */
  function monthPillar(yearKan, monthShi) {
    var base = [2, 4, 6, 8, 0][yearKan % 5]; // 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
    var step = ((monthShi - 2) % 12 + 12) % 12;  // 寅を起点に何ヶ月進んだか
    return { kan: (base + step) % 10, shi: monthShi };
  }

  /* 五行の関係（日干から見た相手の五行が何にあたるか） */
  function relation(dayGyo, otherGyo) {
    if (dayGyo === otherGyo) return "hiwa";                 // 比和：力が集まる
    if ((otherGyo + 1) % 5 === dayGyo) return "in";         // 印：生まれる（助けられる）
    if ((dayGyo + 1) % 5 === otherGyo) return "shoku";      // 食傷：生み出す（出す）
    if ((dayGyo + 2) % 5 === otherGyo) return "zai";        // 財：剋す（掴む）
    return "kan";                                            // 官殺：剋される（圧がかかる）
  }

  /* 地支の五行 */
  var SHI_GYO = [4,2,0,0,2,1,1,2,3,3,2,4]; // 子丑寅卯辰巳午未申酉戌亥

  /* 通変星：日干から見た相手の干が何にあたるか
     五行の関係 × 陰陽が同じか異なるか で10種に分かれる */
  var TSUHEN = {
    hiwa:  ["比肩", "劫財"],  // [同じ陰陽, 異なる陰陽]
    shoku: ["食神", "傷官"],
    zai:   ["偏財", "正財"],
    kan:   ["偏官", "正官"],
    in:    ["偏印", "印綬"]
  };

  function tsuhen(dayKanIdx, otherKanIdx) {
    var rel = relation(KAN_GYO[dayKanIdx], KAN_GYO[otherKanIdx]);
    var samePolarity = (dayKanIdx % 2) === (otherKanIdx % 2);
    return TSUHEN[rel][samePolarity ? 0 : 1];
  }

  /* 十二運：日干ごとの長生の位置から、陽干は順行・陰干は逆行で数える */
  var UNSEI = ["長生","沐浴","冠帯","建禄","帝旺","衰","病","死","墓","絶","胎","養"];
  var CHOSEI = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲乙丙丁戊己庚辛壬癸 の長生の地支

  function junisei(dayKanIdx, shiIdx) {
    var start = CHOSEI[dayKanIdx];
    var step = (dayKanIdx % 2 === 0)
      ? ((shiIdx - start) % 12 + 12) % 12   // 陽干：順行
      : ((start - shiIdx) % 12 + 12) % 12;  // 陰干：逆行
    return UNSEI[step];
  }

  /* 出生地の経度（県庁所在地の概値）。日本標準時は東経135度が基準。
     経度が1度ずれるごとに、実際の太陽の位置は4分ずれる。 */
  var PREF = [
    ["北海道",141.35],["青森",140.74],["岩手",141.15],["宮城",140.87],["秋田",140.10],
    ["山形",140.36],["福島",140.47],["茨城",140.45],["栃木",139.88],["群馬",139.06],
    ["埼玉",139.65],["千葉",140.12],["東京",139.69],["神奈川",139.64],["新潟",139.02],
    ["富山",137.21],["石川",136.63],["福井",136.22],["山梨",138.57],["長野",138.18],
    ["岐阜",136.72],["静岡",138.38],["愛知",136.91],["三重",136.51],["滋賀",135.87],
    ["京都",135.76],["大阪",135.52],["兵庫",135.18],["奈良",135.83],["和歌山",135.17],
    ["鳥取",134.24],["島根",133.05],["岡山",133.93],["広島",132.46],["山口",131.47],
    ["徳島",134.56],["香川",134.04],["愛媛",132.77],["高知",133.53],["福岡",130.42],
    ["佐賀",130.30],["長崎",129.87],["熊本",130.74],["大分",131.61],["宮崎",131.42],
    ["鹿児島",130.56],["沖縄",127.68]
  ];

  /* 真太陽時への補正（分）。経度差のみを見る。
     均時差（年間で±16分ほど動く分）は含めていない。 */
  function solarOffsetMinutes(pref) {
    for (var i = 0; i < PREF.length; i++) {
      if (PREF[i][0] === pref) return Math.round((PREF[i][1] - 135) * 4);
    }
    return 0;
  }

  /* 時柱：出生時刻が分かる場合のみ
     時支は23時から子の刻で始まり、2時間ごとに進む。
     時干は五鼠遁（日干から子の刻の干を決め、そこから順に進める）。 */
  function hourPillar(dayKanIdx, minutes) {
    /* 子の刻は23時に始まるので、60分ぶん進めてから2時間で割る */
    var shi = Math.floor(((((minutes + 60) % 1440) + 1440) % 1440) / 120);
    var base = [0, 2, 4, 6, 8][dayKanIdx % 5]; // 甲己→甲子, 乙庚→丙子, 丙辛→戊子, 丁壬→庚子, 戊癸→壬子
    return { kan: (base + shi) % 10, shi: shi };
  }

  /* 五行バランス：三柱6文字、時柱が分かる場合は四柱8文字で数える */
  function balance(yp, mp, dp, hp) {
    var count = [0,0,0,0,0];
    count[KAN_GYO[yp.kan]]++; count[SHI_GYO[yp.shi]]++;
    count[KAN_GYO[mp.kan]]++; count[SHI_GYO[mp.shi]]++;
    count[KAN_GYO[dp.kan]]++; count[SHI_GYO[dp.shi]]++;
    if (hp) { count[KAN_GYO[hp.kan]]++; count[SHI_GYO[hp.shi]]++; }

    var max = Math.max.apply(null, count);
    var most = count.indexOf(max);          // 最も多い五行
    var lacks = [];
    for (var i = 0; i < 5; i++) if (count[i] === 0) lacks.push(i);

    return {
      count: count,
      most: most,
      mostName: GYO_NAME[most],
      mostCount: max,
      lack: lacks.length ? lacks[0] : null,   // 欠けている五行（複数あれば先頭）
      lackName: lacks.length ? GYO_NAME[lacks[0]] : null,
      lackAll: lacks.map(function (i) { return GYO_NAME[i]; }),
      chars: hp ? 8 : 6
    };
  }

  /* 命式にどの星があるか（日干以外の天干＝年干・月干・時干を見る）
     無い星は、その人に欠けている働き。相談の核心になりやすい。 */
  var STAR_GROUP = {
    "比肩":"hikyo", "劫財":"hikyo",
    "食神":"shokusho", "傷官":"shokusho",
    "偏財":"zaisei", "正財":"zaisei",
    "偏官":"kansei", "正官":"kansei",
    "偏印":"insei",  "印綬":"insei"
  };

  function stars(dayKanIdx, kanIdxList) {
    var found = {}, list = [];
    kanIdxList.forEach(function (ki) {
      if (ki === null || ki === undefined) return;
      var t = tsuhen(dayKanIdx, ki);
      list.push(t);
      found[STAR_GROUP[t]] = true;
    });
    return {
      list: list,
      has: {
        hikyo:    !!found.hikyo,     // 比劫：独立・競争
        shokusho: !!found.shokusho,  // 食傷：表現・発信
        zaisei:   !!found.zaisei,    // 財星：お金・現実・（男性から見た）異性
        kansei:   !!found.kansei,    // 官星：責任・立場・（女性から見た）異性
        insei:    !!found.insei      // 印星：学び・支え
      }
    };
  }

  /* 干支の組み合わせから六十干支の番号を求める */
  function kanshiIndex(kan, shi) {
    for (var n = 0; n < 60; n++) if (n % 10 === kan && n % 12 === shi) return n;
    return 0;
  }

  /* その年の節入り日をユリウス通日の配列で返す */
  function setsuJdnList(y) {
    return SETSU.map(function (t) { return { jdn: jdn(y, t.m, t.d), m: t.m, d: t.d }; });
  }

  /* 生日を挟む前後の節入りまでの日数 */
  function setsuGap(y, m, d) {
    var me = jdn(y, m, d);
    var all = setsuJdnList(y - 1).concat(setsuJdnList(y), setsuJdnList(y + 1))
      .sort(function (a, b) { return a.jdn - b.jdn; });
    var prev = null, next = null, i;
    for (i = 0; i < all.length; i++) {
      if (all[i].jdn <= me) prev = all[i];
      if (all[i].jdn > me && next === null) next = all[i];
    }
    return { toNext: next.jdn - me, fromPrev: me - prev.jdn };
  }

  /* 大運：10年ごとの運の柱
     順行か逆行かは、年干の陰陽と性別の組み合わせで決まる。
     起運の年齢（立運数）は、節入りまでの日数を3で割る（3日で1年）。 */
  function daiun(y, m, d, gender, yp, mp) {
    var yangYear = (yp.kan % 2 === 0);
    var male = (gender === "male");
    var forward = (yangYear && male) || (!yangYear && !male);

    var gap = setsuGap(y, m, d);
    var days = forward ? gap.toNext : gap.fromPrev;
    var startAge = Math.max(1, Math.round(days / 3));

    var base = kanshiIndex(mp.kan, mp.shi);
    var out = [], i, idx;
    for (i = 0; i < 8; i++) {
      idx = ((base + (forward ? (i + 1) : -(i + 1))) % 60 + 60) % 60;
      out.push({
        from: startAge + i * 10,
        to: startAge + i * 10 + 9,
        kan: KAN[idx % 10],
        shi: SHI[idx % 12],
        kanIdx: idx % 10
      });
    }
    return { forward: forward, startAge: startAge, pillars: out };
  }

  /* 公開API */
  function build(y, m, d, hour, minute, pref) {
    var sm = solarMonth(y, m, d);
    var yp = yearPillar(sm.year);
    var mp = monthPillar(yp.kan, sm.shi);
    var dp = dayPillar(y, m, d);
    var dayGyo = KAN_GYO[dp.kan];
    var hasHour = (typeof hour === "number" && hour >= 0 && hour <= 23);
    /* 分が渡されなければ、その時間帯の真ん中（30分）とみなす */
    var min = (typeof minute === "number" && minute >= 0 && minute <= 59) ? minute : 30;
    var offset = pref ? solarOffsetMinutes(pref) : 0;
    /* 出生地が分かる場合は真太陽時に寄せてから時支を決める。
       時支の境目にいる人は、これで柱が変わる。 */
    var localMin = hasHour ? (hour * 60 + min) : null;
    var solarMin = hasHour ? (localMin + offset) : null;
    var hp = hasHour ? hourPillar(dp.kan, solarMin) : null;

    return {
      year:  { kan: KAN[yp.kan], shi: SHI[yp.shi], kanIdx: yp.kan },
      month: { kan: KAN[mp.kan], shi: SHI[mp.shi], kanIdx: mp.kan },
      day:   { kan: KAN[dp.kan], shi: SHI[dp.shi], kanIdx: dp.kan },
      dayKan: KAN[dp.kan],
      dayKanIdx: dp.kan,
      dayKanYomi: KAN_YOMI[KAN[dp.kan]],
      dayGyo: dayGyo,
      dayGyoName: GYO_NAME[dayGyo],
      solarYear: sm.year,
      /* 追加の軸 */
      tsuhen: tsuhen(dp.kan, mp.kan),        // 月干との関係＝社会での出方
      junisei: junisei(dp.kan, dp.shi),      // 日支との関係＝今の段階
      balance: balance(yp, mp, dp, hp),      // 五行の偏り（時柱があれば8文字で判定）
      hasHour: hasHour,
      hour: hasHour ? { kan: KAN[hp.kan], shi: SHI[hp.shi], kanIdx: hp.kan } : null,
      hourTsuhen: hasHour ? tsuhen(dp.kan, hp.kan) : null,   // 時干との関係＝隠れているもの
      hourJunisei: hasHour ? junisei(dp.kan, hp.shi) : null,
      stars: stars(dp.kan, [yp.kan, mp.kan, hasHour ? hp.kan : null]),
      solarOffset: offset,
      birthMinutes: localMin,
      solarMinutes: solarMin,
      solarTimeText: hasHour
        ? (Math.floor((((solarMin % 1440) + 1440) % 1440) / 60) + "時"
           + ("0" + ((((solarMin % 60) + 60) % 60))).slice(-2) + "分")
        : null
    };
  }

  /* 今後n年の運気（年干の五行と日干の関係で判定） */
  function years(dayGyo, fromYear, n) {
    var out = [], i, yk, rel;
    for (i = 0; i < n; i++) {
      var yr = fromYear + i;
      var idx = ((yr - 4) % 60 + 60) % 60;
      yk = idx % 10;
      rel = relation(dayGyo, KAN_GYO[yk]);
      out.push({ year: yr, kan: KAN[yk], shi: SHI[idx % 12], rel: rel, yang: yk % 2 === 0 });
    }
    return out;
  }

  /* 大運は性別が要るので別APIにする */
  function daiunFor(y, m, d, gender) {
    var sm = solarMonth(y, m, d);
    var yp = yearPillar(sm.year);
    var mp = monthPillar(yp.kan, sm.shi);
    var dp = dayPillar(y, m, d);
    var du = daiun(y, m, d, gender, yp, mp);
    du.pillars.forEach(function (pl) {
      pl.rel = relation(KAN_GYO[dp.kan], KAN_GYO[pl.kanIdx]);
      pl.yang = (pl.kanIdx % 2 === 0);
      pl.tsuhen = tsuhen(dp.kan, pl.kanIdx);
    });
    return du;
  }

  return {
    build: build,
    PREF: PREF,
    solarOffsetMinutes: solarOffsetMinutes,
    years: years,
    daiun: daiunFor,
    KAN: KAN,
    SHI: SHI,
    GYO_NAME: GYO_NAME
  };
})();
