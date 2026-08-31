/* 西洋占星術
   天体の黄経を軌道要素から計算する。月には主要な摂動項を加える。
   出生時刻は日本標準時(UTC+9)として扱う。 */
window.Astro = (function () {
  "use strict";

  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  var sin = function (x) { return Math.sin(x * RAD); };
  var cos = function (x) { return Math.cos(x * RAD); };
  var tan = function (x) { return Math.tan(x * RAD); };
  var atan2 = function (y, x) { return Math.atan2(y, x) * DEG; };
  var asin = function (x) { return Math.asin(x) * DEG; };

  function norm(a) { a = a % 360; return a < 0 ? a + 360 : a; }

  var SIGNS = ["牡羊座","牡牛座","双子座","蟹座","獅子座","乙女座",
               "天秤座","蠍座","射手座","山羊座","水瓶座","魚座"];

  /* 都道府県の緯度・経度（県庁所在地） */
  var PLACE = {
    "北海道":[43.06,141.35],"青森":[40.82,140.74],"岩手":[39.70,141.15],"宮城":[38.27,140.87],
    "秋田":[39.72,140.10],"山形":[38.24,140.36],"福島":[37.75,140.47],"茨城":[36.34,140.45],
    "栃木":[36.57,139.88],"群馬":[36.39,139.06],"埼玉":[35.86,139.65],"千葉":[35.60,140.12],
    "東京":[35.69,139.69],"神奈川":[35.45,139.64],"新潟":[37.90,139.02],"富山":[36.70,137.21],
    "石川":[36.59,136.63],"福井":[36.07,136.22],"山梨":[35.66,138.57],"長野":[36.65,138.18],
    "岐阜":[35.39,136.72],"静岡":[34.98,138.38],"愛知":[35.18,136.91],"三重":[34.73,136.51],
    "滋賀":[35.00,135.87],"京都":[35.02,135.76],"大阪":[34.69,135.52],"兵庫":[34.69,135.18],
    "奈良":[34.69,135.83],"和歌山":[34.23,135.17],"鳥取":[35.50,134.24],"島根":[35.47,133.05],
    "岡山":[34.66,133.93],"広島":[34.40,132.46],"山口":[34.19,131.47],"徳島":[34.07,134.56],
    "香川":[34.34,134.04],"愛媛":[33.84,132.77],"高知":[33.56,133.53],"福岡":[33.61,130.42],
    "佐賀":[33.25,130.30],"長崎":[32.74,129.87],"熊本":[32.79,130.74],"大分":[33.24,131.61],
    "宮崎":[31.91,131.42],"鹿児島":[31.56,130.56],"沖縄":[26.21,127.68]
  };

  /* 2000年1月0.0日(UT)からの通日 */
  function dayNumber(y, m, d, utHours) {
    var n = 367 * y
          - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
          + Math.floor(275 * m / 9) + d - 730530;
    return n + utHours / 24;
  }

  /* ケプラー方程式を反復して離心近点角を出す */
  function eccAnomaly(M, e) {
    var E = M + e * DEG * sin(M) * (1 + e * cos(M));
    for (var i = 0; i < 8; i++) {
      var dE = (E - e * DEG * sin(E) - M) / (1 - e * cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-9) break;
    }
    return E;
  }

  /* 軌道要素から黄経・動径を出す（軌道面内） */
  function orbit(N, i, w, a, e, M) {
    var E = eccAnomaly(norm(M), e);
    var xv = a * (cos(E) - e);
    var yv = a * (Math.sqrt(1 - e * e) * sin(E));
    var v = atan2(yv, xv);
    var r = Math.sqrt(xv * xv + yv * yv);
    var lon = v + w;
    var xh = r * (cos(N) * cos(lon) - sin(N) * sin(lon) * cos(i));
    var yh = r * (sin(N) * cos(lon) + cos(N) * sin(lon) * cos(i));
    var zh = r * (sin(lon) * sin(i));
    return { x: xh, y: yh, z: zh, r: r, v: v, lon: lon };
  }

  function sunPos(d) {
    var w = 282.9404 + 4.70935e-5 * d;
    var e = 0.016709 - 1.151e-9 * d;
    var M = norm(356.0470 + 0.9856002585 * d);
    var E = eccAnomaly(M, e);
    var xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E);
    var v = atan2(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
    return { lon: norm(v + w), r: r, M: M, w: w, L: norm(M + w) };
  }

  function moonPos(d, sun) {
    var N = 125.1228 - 0.0529538083 * d;
    var i = 5.1454;
    var w = 318.0634 + 0.1643573223 * d;
    var a = 60.2666, e = 0.054900;
    var M = norm(115.3654 + 13.0649929509 * d);
    var o = orbit(N, i, w, a, e, M);
    var lon = atan2(o.y, o.x);
    var lat = atan2(o.z, Math.sqrt(o.x * o.x + o.y * o.y));

    /* 主要な摂動項 */
    var Ls = sun.L, Lm = norm(M + w + N);
    var D = Lm - Ls, F = Lm - N, Ms = sun.M;
    lon += -1.274 * sin(M - 2 * D)
         +  0.658 * sin(2 * D)
         -  0.186 * sin(Ms)
         -  0.059 * sin(2 * M - 2 * D)
         -  0.057 * sin(M - 2 * D + Ms)
         +  0.053 * sin(M + 2 * D)
         +  0.046 * sin(2 * D - Ms)
         +  0.041 * sin(M - Ms)
         -  0.035 * sin(D)
         -  0.031 * sin(M + Ms)
         -  0.015 * sin(2 * F - 2 * D)
         +  0.011 * sin(M - 4 * D);
    lat += -0.173 * sin(F - 2 * D)
         -  0.055 * sin(M - F - 2 * D)
         -  0.046 * sin(M + F - 2 * D)
         +  0.033 * sin(F + 2 * D)
         +  0.017 * sin(2 * M + F);
    return { lon: norm(lon), lat: lat };
  }

  var ELEMENTS = {
    "水星": function (d) { return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d,
      w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d,
      M: 168.6562 + 4.0923344368 * d }; },
    "金星": function (d) { return { N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d,
      w: 54.8910 + 1.38374e-5 * d, a: 0.723330, e: 0.006773 - 1.302e-9 * d,
      M: 48.0052 + 1.6021302244 * d }; },
    "火星": function (d) { return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d,
      w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d,
      M: 18.6021 + 0.5240207766 * d }; },
    "木星": function (d) { return { N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d,
      w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d,
      M: 19.8950 + 0.0830853001 * d }; },
    "土星": function (d) { return { N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d,
      w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d,
      M: 316.9670 + 0.0334442282 * d }; }
  };

  function planetLon(name, d, sun) {
    var el = ELEMENTS[name](d);
    var o = orbit(el.N, el.i, el.w, el.a, el.e, el.M);
    /* 太陽の直交座標を足して地心にする */
    var xs = sun.r * cos(sun.lon), ys = sun.r * sin(sun.lon);
    return norm(atan2(o.y + ys, o.x + xs));
  }

  function signOf(lon) {
    var idx = Math.floor(norm(lon) / 30);
    var deg = norm(lon) - idx * 30;
    return { sign: SIGNS[idx], deg: deg, text: SIGNS[idx] + " " + deg.toFixed(1) + "度" };
  }

  /* アセンダントと天頂 */
  function angles(d, utHours, lat, lng, sun) {
    var ecl = 23.4393 - 3.563e-7 * d;
    var gmst0 = norm(sun.L + 180) / 15;              // 時間単位
    var lst = norm((gmst0 + utHours + lng / 15) * 15); // 恒星時（度）
    var asc = norm(atan2(cos(lst), -(sin(lst) * cos(ecl) + tan(lat) * sin(ecl))));
    var mc  = norm(atan2(sin(lst), cos(lst) * cos(ecl)));
    return { asc: asc, mc: mc, lst: lst, ecl: ecl };
  }

  var ASPECTS = [
    { name: "合",   deg: 0,   orb: 8 },
    { name: "衝",   deg: 180, orb: 8 },
    { name: "三分", deg: 120, orb: 6 },
    { name: "矩",   deg: 90,  orb: 6 },
    { name: "六分", deg: 60,  orb: 4 }
  ];

  function aspects(points) {
    var out = [], keys = Object.keys(points), i, j;
    for (i = 0; i < keys.length; i++) {
      for (j = i + 1; j < keys.length; j++) {
        var diff = Math.abs(norm(points[keys[i]] - points[keys[j]]));
        if (diff > 180) diff = 360 - diff;
        for (var a = 0; a < ASPECTS.length; a++) {
          var d0 = Math.abs(diff - ASPECTS[a].deg);
          if (d0 <= ASPECTS[a].orb) {
            out.push({ a: keys[i], b: keys[j], name: ASPECTS[a].name,
                       orb: d0.toFixed(1) });
            break;
          }
        }
      }
    }
    return out;
  }

  /* 公開API。hour/minute/pref が無い場合は太陽など日付だけで決まるものを返す */
  function build(y, m, d, hour, minute, pref) {
    var hasTime = (typeof hour === "number");
    var jst = hasTime ? (hour + (typeof minute === "number" ? minute : 30) / 60) : 12;
    var ut = jst - 9;                                  // 日本標準時 → 世界時
    var dd = dayNumber(y, m, d, ut);

    var sun = sunPos(dd);
    var moon = moonPos(dd, sun);
    var pts = { "太陽": sun.lon, "月": moon.lon };
    ["水星","金星","火星","木星","土星"].forEach(function (n) {
      pts[n] = planetLon(n, dd, sun);
    });

    var res = {
      hasTime: hasTime,
      planets: {},
      aspects: [],
      asc: null, mc: null
    };
    Object.keys(pts).forEach(function (n) { res.planets[n] = signOf(pts[n]); });

    if (hasTime && pref && PLACE[pref]) {
      var p = PLACE[pref];
      var ang = angles(dd, ut, p[0], p[1], sun);
      res.asc = signOf(ang.asc);
      res.mc = signOf(ang.mc);
      pts["ASC"] = ang.asc;
      pts["MC"] = ang.mc;
    }
    res.aspects = aspects(pts);
    return res;
  }

  /* 旧暦の計算から使う低レベルAPI。dは2000年1月0.0日(UT)からの通日 */
  function lonsAt(d) {
    var sun = sunPos(d);
    var moon = moonPos(d, sun);
    return { sun: sun.lon, moon: moon.lon };
  }

  return {
    build: build, SIGNS: SIGNS, PLACE: PLACE,
    lonsAt: lonsAt, dayNumber: dayNumber, norm: norm
  };
})();
