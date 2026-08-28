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

  /* 公開API */
  function build(y, m, d) {
    var sm = solarMonth(y, m, d);
    var yp = yearPillar(sm.year);
    var mp = monthPillar(yp.kan, sm.shi);
    var dp = dayPillar(y, m, d);
    var dayGyo = KAN_GYO[dp.kan];

    return {
      year:  { kan: KAN[yp.kan], shi: SHI[yp.shi], kanIdx: yp.kan },
      month: { kan: KAN[mp.kan], shi: SHI[mp.shi], kanIdx: mp.kan },
      day:   { kan: KAN[dp.kan], shi: SHI[dp.shi], kanIdx: dp.kan },
      dayKan: KAN[dp.kan],
      dayKanIdx: dp.kan,
      dayKanYomi: KAN_YOMI[KAN[dp.kan]],
      dayGyo: dayGyo,
      dayGyoName: GYO_NAME[dayGyo],
      solarYear: sm.year
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

  return {
    build: build,
    years: years,
    KAN: KAN,
    SHI: SHI,
    GYO_NAME: GYO_NAME
  };
})();
