/* 旧暦（太陰太陽暦）への変換
   新月の瞬間と中気の時刻を天体計算から求め、そこから月・日・閏月を決める。
   日の境目は日本標準時の0時とする。 */
window.Lunar = (function () {
  "use strict";

  var A = window.Astro;

  /* 通日 → ユリウス日 */
  function toJD(d) { return d + 2451543.5; }

  /* ユリウス日 → 西暦（グレゴリオ暦） */
  function fromJD(jd) {
    var z = Math.floor(jd + 0.5);
    var a = Math.floor((z - 1867216.25) / 36524.25);
    var A2 = z + 1 + a - Math.floor(a / 4);
    var B = A2 + 1524;
    var C = Math.floor((B - 122.1) / 365.25);
    var D = Math.floor(365.25 * C);
    var E = Math.floor((B - D) / 30.6001);
    var day = B - D - Math.floor(30.6001 * E);
    var month = (E < 14) ? E - 1 : E - 13;
    var year = (month > 2) ? C - 4716 : C - 4715;
    return { y: year, m: month, d: day };
  }

  /* 通日 → 日本標準時での「日」を表す整数 */
  function jstDay(t) { return Math.floor(t + 9 / 24); }

  /* 整数の日 → 西暦の年月日 */
  function dayToDate(n) { return fromJD(toJD(n)); }

  function wrap180(x) {
    x = x % 360;
    if (x > 180) x -= 360;
    if (x < -180) x += 360;
    return x;
  }

  /* 月と太陽の黄経差。新月で0になる */
  function elong(t) {
    var l = A.lonsAt(t);
    return wrap180(l.moon - l.sun);
  }

  /* t 以降で最初の新月の瞬間を返す */
  function nextNewMoon(t) {
    /* 朔望月は約29.53日。まず粗く探して符号の変化を捉える */
    var step = 0.5, a = t, fa = elong(a), b, fb;
    for (var i = 0; i < 80; i++) {
      b = a + step; fb = elong(b);
      if (fa <= 0 && fb > 0) break;         // 負→正 の変化点が新月
      a = b; fa = fb;
    }
    /* 二分法で詰める */
    for (var j = 0; j < 60; j++) {
      var mid = (a + b) / 2, fm = elong(mid);
      if (fm > 0) { b = mid; } else { a = mid; }
    }
    return (a + b) / 2;
  }

  /* 太陽黄経が target を通過する時刻（t以降で最初） */
  function nextSolarTerm(t, target) {
    function f(x) { return wrap180(A.lonsAt(x).sun - target); }
    var step = 1, a = t, fa = f(a), b, fb;
    for (var i = 0; i < 400; i++) {
      b = a + step; fb = f(b);
      if (fa <= 0 && fb > 0) break;
      a = b; fa = fb;
    }
    for (var j = 0; j < 60; j++) {
      var mid = (a + b) / 2, fm = f(mid);
      if (fm > 0) { b = mid; } else { a = mid; }
    }
    return (a + b) / 2;
  }

  /* ある年の旧暦を組み立てる。
     冬至を含む月を11月とし、次の冬至までに13ヶ月あれば
     中気を含まない最初の月を閏月とする。 */
  function buildYear(year) {
    /* 前年の冬至（太陽黄経270度）を探す */
    var start = A.dayNumber(year - 1, 11, 1, 0);
    var ws1 = nextSolarTerm(start, 270);              // 前年の冬至
    var ws2 = nextSolarTerm(ws1 + 300, 270);          // 当年の冬至

    /* 冬至を含む月を探すため、冬至の少し前から月を並べる */
    var nm = nextNewMoon(ws1 - 70);
    var months = [];
    var t = nm;
    for (var i = 0; i < 17; i++) {
      var next = nextNewMoon(t + 1);
      months.push({ start: jstDay(t), end: jstDay(next) - 1, startT: t, endT: next });
      if (jstDay(t) > jstDay(ws2)) break;
      t = next;
    }

    /* 二つの冬至がそれぞれどの月に入るかを求める */
    function findMonth(dayNum) {
      for (var k = 0; k < months.length; k++) {
        if (dayNum >= months[k].start && dayNum <= months[k].end) return k;
      }
      return -1;
    }
    var idxWs1 = findMonth(jstDay(ws1));
    var idxWs2 = findMonth(jstDay(ws2));
    if (idxWs1 < 0 || idxWs2 < 0) return [];

    /* 冬至月から次の冬至月までが13ヶ月なら、その間に閏月が入る */
    var needLeap = ((idxWs2 - idxWs1) === 13);

    /* 各月が中気を含むか。判定は日単位で行う */
    for (var n = idxWs1; n <= idxWs2; n++) {
      var mo = months[n];
      mo.hasChuki = false;
      for (var deg = 0; deg < 360; deg += 30) {
        var ct = jstDay(nextSolarTerm(mo.startT - 32, deg));
        if (ct >= mo.start && ct <= mo.end) { mo.hasChuki = true; break; }
      }
    }

    /* 冬至を含む月を11月として番号を振る */
    var num = 11, leapUsed = false;
    for (var p = idxWs1; p <= idxWs2; p++) {
      var mo2 = months[p];
      if (needLeap && !leapUsed && p > idxWs1 && !mo2.hasChuki) {
        mo2.leap = true;
        mo2.month = ((num - 2 + 12) % 12) + 1;   // 直前の月と同じ番号
        leapUsed = true;
      } else {
        mo2.leap = false;
        mo2.month = num;
        num = (num % 12) + 1;
      }
    }
    return months.slice(idxWs1, idxWs2 + 1);

  }

  /* 西暦の年月日 → 旧暦 */
  var cache = {};
  function toLunar(y, m, d) {
    var target = jstDay(A.dayNumber(y, m, d, 0) - 9 / 24 + 0.001);
    /* その日が属する年を試す。前年側にはみ出す場合があるので2年分見る */
    for (var yy = y + 1; yy >= y - 1; yy--) {
      if (!cache[yy]) cache[yy] = buildYear(yy);
      var ms = cache[yy];
      for (var i = 0; i < ms.length; i++) {
        if (target >= ms[i].start && target <= ms[i].end) {
          return {
            year: yy,
            month: ms[i].month,
            day: target - ms[i].start + 1,
            leap: !!ms[i].leap,
            text: (ms[i].leap ? "閏" : "") + ms[i].month + "月" + (target - ms[i].start + 1) + "日"
          };
        }
      }
    }
    return null;
  }

  return { toLunar: toLunar, buildYear: buildYear, nextNewMoon: nextNewMoon,
           nextSolarTerm: nextSolarTerm, dayToDate: dayToDate, jstDay: jstDay };
})();
