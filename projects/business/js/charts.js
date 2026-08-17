/* =============================================================================
   Графики — рукописный inline SVG, без библиотек.
   Цвета берутся из CSS-переменных на момент отрисовки, поэтому смена темы
   просто перерисовывает всё заново.
   Этот файл подключается последним: он определяет recalc() и CF_boot().
   Бутстрап вызывается из index.html после загрузки переводов — иначе первый
   кадр рисовался бы по-английски и тут же перерисовывался.
   ========================================================================== */
"use strict";

function cssv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
}
function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

/* Верхняя граница оси: шаг обязан делиться на 4, чтобы сетка была круглой. */
function niceMax(v) {
  if (v <= 0) return 1;
  var p = Math.pow(10, Math.floor(Math.log10(v)));
  var s = [1, 1.2, 1.4, 1.6, 2, 2.4, 2.8, 3.2, 4, 5, 6, 7, 8, 10];
  for (var i = 0; i < s.length; i++) if (s[i] * p >= v) return s[i] * p;
  return 10 * p;
}
/* Шкала, уходящая в минус: подбираем круглый шаг и выравниваем по нему обе
   границы, иначе подписи выходят вида «600» вперемешку с «4k». */
function niceScale(lo, hi) {
  if (hi <= lo) hi = lo + 1;
  var step = niceMax((hi - lo) / 4);
  var l, t;
  for (var guard = 0; guard < 8; guard++) {
    l = Math.floor(lo / step) * step;
    t = Math.ceil(hi / step) * step;
    if ((t - l) / step <= 6) break;
    step *= 2;
  }
  return { lo: l, hi: t, step: step };
}
function scaleTicks(s) {
  var out = [];
  for (var v = s.lo; v <= s.hi + s.step * 1e-6; v += s.step) out.push(v);
  return out;
}

function short(v) {
  var dec = T("cf.fmt.decimal", null, ".");
  var a = Math.abs(v);
  if (a >= 1000000) {
    return (v / 1000000).toFixed(a >= 10000000 ? 0 : 1).replace(".", dec) +
      NBSP + T("cf.fmt.mln", null, "M");
  }
  if (a >= 1000) {
    var k = v / 1000;
    /* Math.round(-2.5) === -2, а Math.round(2.5) === 3 — симметричная шкала
       из-за этого получала подписи «−2k» напротив «+3k». Держим десятую. */
    var s = (Math.abs(k) < 10 && Math.abs(k % 1) > 0.05)
      ? k.toFixed(1).replace(".", dec) : String(Math.round(k));
    return s + T("cf.fmt.k", null, "k");
  }
  return String(Math.round(v));
}
function title(node, text) { node.appendChild(el("title", {}, text)); }
function legend(hostId, items) {
  var host = $(hostId);
  if (!host) return;
  clearNode(host);
  items.forEach(function (it) {
    var s = h("span");
    var i = h("i");
    i.style.background = it[1];
    s.appendChild(i);
    s.appendChild(document.createTextNode(it[0]));
    host.appendChild(s);
  });
}

/* Гостей по каждому часу в обоих профилях — нужно и графику, и подписям. */
function hourSeries() {
  var wdH = hourLabels(P.openWd, P.closeWd);
  var weH = hourLabels(P.openWe, P.closeWe);
  var buf = clamp(num(P.lastOrderBuffer), 0, 60);
  var wLast = Math.max(0, 1 - buf / 60);
  var anchor = Math.min(wdH.length ? wdH[0] : 0, weH.length ? weH[0] : 0);
  var map = {};
  function put(hours, key) {
    hours.forEach(function (hr, i) {
      var occ = clamp(num(P[key === "wd" ? "occWd" : "occWe"][i]), 0, 100) / 100;
      var g = R.capHour * occ * (i === hours.length - 1 ? wLast : 1);
      if (!map[hr]) map[hr] = { hr: hr, wd: 0, we: 0 };
      map[hr][key] = g;
    });
  }
  put(wdH, "wd");
  put(weH, "we");
  return Object.keys(map).map(function (k) { return map[k]; })
    .sort(function (a, b) {
      return ((a.hr - anchor + 24) % 24) - ((b.hr - anchor + 24) % 24);
    });
}

/* ------------------------------------------------ 1. гости по часам --------- */
function chartHours() {
  var svg = $("chHours");
  clearSvg(svg);
  var data = hourSeries();
  var W = 900, H = 300, L = 46, Rm = 14, T0 = 16, B = 34;
  var c1 = cssv("--cf-s1"), c2 = cssv("--cf-s2"), grid = cssv("--cf-grid"), axis = cssv("--cf-axis");
  var sWd = T("cf.ch.weekdays", null, "Weekdays");
  var sWe = T("cf.ch.weekends", null, "Weekends");

  var hi = niceMax(Math.max(1, Math.max.apply(null, data.map(function (d) {
    return Math.max(d.wd, d.we);
  }))));
  var yy = function (v) { return T0 + (1 - v / hi) * (H - T0 - B); };

  for (var i = 0; i <= 4; i++) {
    var v = hi * i / 4;
    svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(v), y2: yy(v), stroke: grid }));
    svg.appendChild(el("text", { x: L - 7, y: yy(v) + 4, "text-anchor": "end" }, short(v)));
  }
  svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(0), y2: yy(0), stroke: axis }));

  var bw = (W - L - Rm) / Math.max(1, data.length);
  var pad = Math.min(6, bw * 0.16);
  var half = (bw - pad * 2) / 2;

  data.forEach(function (d, i) {
    var x0 = L + i * bw + pad;
    [["wd", c1, sWd], ["we", c2, sWe]].forEach(function (s, j) {
      var v = d[s[0]];
      if (v <= 0) return;
      var rct = el("rect", {
        x: x0 + j * half, y: yy(v), width: Math.max(1, half - 1),
        height: Math.max(0, yy(0) - yy(v)), fill: s[1], rx: 2
      });
      rct.setAttribute("class", "bar-grow");
      rct.style.setProperty("--i", i);
      title(rct, T("cf.ch.hoursTip", { series: s[2], h: d.hr, n: nf(v, 1) },
        "{series}, {h}:00 — {n} guests"));
      svg.appendChild(rct);
    });
    if (data.length <= 16 || i % 2 === 0) {
      svg.appendChild(el("text", {
        x: x0 + half, y: H - B + 17, "text-anchor": "middle"
      }, (d.hr < 10 ? "0" : "") + d.hr));
    }
  });
  legend("lgHours", [
    [T("cf.ch.hoursLegend", { series: sWd, n: nf(R.guestsWdDay) }, "{series} · {n} guests per day"), c1],
    [T("cf.ch.hoursLegend", { series: sWe, n: nf(R.guestsWeDay) }, "{series} · {n} guests per day"), c2]
  ]);
}

/* ------------------------------------------------ 2. водопад ---------------- */
function chartWaterfall() {
  var svg = $("chWater");
  clearSvg(svg);
  var W = 900, H = 340, L = 56, Rm = 14, T0 = 18, B = 66;
  var good = cssv("--cf-good"), bad = cssv("--cf-bad"), acc = cssv("--cf-accent");
  var grid = cssv("--cf-grid"), axis = cssv("--cf-axis"), ink = cssv("--cf-text");

  var steps = [
    { n: T("cf.wf.revenue", null, "Revenue"), v: R.revNet, type: "start" },
    { n: T("cf.wf.cogs", null, "Food"), v: -R.cogs },
    { n: T("cf.wf.payroll", null, "Payroll"), v: -R.payrollTotal },
    { n: T("cf.wf.fixed", null, "Fixed"), v: -R.fixed },
    { n: T("cf.wf.variable", null, "Variable"), v: -R.variable },
    { n: T("cf.wf.levy", null, "Levy"), v: -R.levy },
    { n: T("cf.wf.da", null, "Depr."), v: -R.da },
    { n: T("cf.wf.tax", null, "Tax"), v: -R.incomeTax },
    { n: T("cf.wf.net", null, "Net"), v: R.netProfit, type: "end" }
  ];

  var run = 0, lo = 0, hi = 0;
  steps.forEach(function (s) {
    if (s.type === "start") { s.from = 0; s.to = s.v; run = s.v; }
    else if (s.type === "end") { s.from = 0; s.to = s.v; }
    else { s.from = run; run += s.v; s.to = run; }
    lo = Math.min(lo, s.from, s.to);
    hi = Math.max(hi, s.from, s.to);
  });
  var sc = niceScale(Math.min(0, lo), Math.max(0, hi));
  var yy = function (v) { return T0 + (sc.hi - v) / (sc.hi - sc.lo) * (H - T0 - B); };

  scaleTicks(sc).forEach(function (v) {
    svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(v), y2: yy(v), stroke: grid }));
    svg.appendChild(el("text", { x: L - 7, y: yy(v) + 4, "text-anchor": "end" }, short(v)));
  });
  svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(0), y2: yy(0), stroke: axis }));

  var bw = (W - L - Rm) / steps.length;
  steps.forEach(function (s, i) {
    var x = L + i * bw + bw * 0.18;
    var w = bw * 0.64;
    var y1 = yy(Math.max(s.from, s.to)), y2 = yy(Math.min(s.from, s.to));
    var col = s.type ? (s.v >= 0 ? acc : bad) : (s.v >= 0 ? good : bad);
    var g = el("g", { class: "bar-grow" });
    g.style.setProperty("--i", i);
    var rct = el("rect", {
      x: x, y: y1, width: w, height: Math.max(1.5, y2 - y1), fill: col, rx: 2,
      opacity: s.type ? 1 : 0.85
    });
    title(rct, s.n + ": " + money(s.v));
    g.appendChild(rct);
    svg.appendChild(g);

    /* соединительная черта к следующему столбцу */
    if (i < steps.length - 1 && steps[i + 1].type !== "end") {
      svg.appendChild(el("line", {
        x1: x + w, x2: L + (i + 1) * bw + bw * 0.18, y1: yy(s.to), y2: yy(s.to),
        stroke: axis, "stroke-dasharray": "3 3"
      }));
    }
    svg.appendChild(el("text", {
      x: x + w / 2, y: H - B + 18, "text-anchor": "middle"
    }, s.n));
    svg.appendChild(el("text", {
      x: x + w / 2, y: H - B + 33, "text-anchor": "middle", fill: ink,
      "font-size": "10.5", "font-weight": "600"
    }, short(s.v)));
  });
}

/* ------------------------------------------------ 3. структура расходов ----- */
function chartDonut() {
  var svg = $("chDonut");
  clearSvg(svg);
  var segs = [
    [T("cf.donut.cogs", null, "Food"), R.cogs, cssv("--cf-s1")],
    [T("cf.donut.payroll", null, "Payroll with taxes"), R.payrollTotal, cssv("--cf-s2")],
    [T("cf.donut.rent", null, "Rent"), R.rent, cssv("--cf-s3")],
    [T("cf.donut.otherFixed", null, "Other fixed costs"), Math.max(0, R.fixed - R.rent), cssv("--cf-s4")],
    [T("cf.donut.variable", null, "Variable costs"), R.variable, cssv("--cf-s5")],
    [T("cf.donut.daLevy", null, "Depreciation and levy"), R.da + R.levy, cssv("--cf-s6")],
    [T("cf.donut.incomeTax", null, "Profit tax"), R.incomeTax, cssv("--cf-s7")],
    [T("cf.donut.net", null, "Net profit"), Math.max(0, R.netProfit), cssv("--cf-s8")]
  ].filter(function (s) { return s[1] > 0; });

  var total = segs.reduce(function (a, s) { return a + s[1]; }, 0);
  if (total <= 0) { clearNode($("lgDonut")); return; }

  var cx = 130, cy = 130, r = 92, w = 34;
  var circ = 2 * Math.PI * r;
  var off = 0;
  segs.forEach(function (s, i) {
    var frac = s[1] / total;
    var c = el("circle", {
      cx: cx, cy: cy, r: r, fill: "none", stroke: s[2], "stroke-width": w,
      "stroke-dasharray": (frac * circ) + " " + circ,
      "stroke-dashoffset": -off * circ,
      transform: "rotate(-90 " + cx + " " + cy + ")"
    });
    c.setAttribute("class", "pop");
    c.style.animationDelay = (i * 55) + "ms";
    title(c, s[0] + ": " + money(s[1]) + " · " + pctS(frac * 100));
    svg.appendChild(c);
    off += frac;
  });
  svg.appendChild(el("text", {
    x: cx, y: cy - 4, "text-anchor": "middle", fill: cssv("--cf-text"),
    "font-size": "19", "font-weight": "650"
  }, short(total)));
  svg.appendChild(el("text", {
    x: cx, y: cy + 15, "text-anchor": "middle", "font-size": "11"
  }, T("cf.donut.center", null, "revenue excl. VAT")));

  legend("lgDonut", segs.map(function (s) {
    return [s[0] + " — " + pctS(s[1] / total * 100), s[2]];
  }));
}

/* ------------------------------------------------ 4. точка безубыточности --- */
function chartBep() {
  var svg = $("chBep");
  clearSvg(svg);
  var note = $("bepNote");
  clearNode(note);

  var b = R.bepCash;
  if (b.status !== "ok") {
    clearNode($("lgBep"));            /* иначе останется легенда от прошлого расчёта */
    note.appendChild(h("b", null, b.note
      ? T(b.note.k, b.note.p, b.note.en)
      : T("cf.bep.cannot", null, "The break-even point cannot be computed.")));
    return;
  }

  var W = 900, H = 320, L = 62, Rm = 16, T0 = 18, B = 44;
  var cRev = cssv("--cf-s3"), cCost = cssv("--cf-s6"), grid = cssv("--cf-grid"),
      axis = cssv("--cf-axis"), acc = cssv("--cf-accent"), ink = cssv("--cf-text");

  var other = R.revTaN + R.revDlN;
  var fixedCash = R.payrollTotal + R.fixed + R.levy;
  var perGuest = R.avgCheckNet * R.Dall;          /* нетто-выручка зала за месяц на 1 гостя/день */
  var gMax = Math.max(R.guestsDay * 1.5, b.guestsDay * 1.4, 10);

  function rev(g) { return g * perGuest + other; }
  function cost(g) { return g * perGuest * (1 - R.cmDine) + (other - R.cmOther) + fixedCash; }

  var hi = niceMax(Math.max(rev(gMax), cost(gMax)));
  var xx = function (g) { return L + g / gMax * (W - L - Rm); };
  var yy = function (v) { return T0 + (1 - v / hi) * (H - T0 - B); };

  for (var i = 0; i <= 4; i++) {
    var v = hi * i / 4;
    svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(v), y2: yy(v), stroke: grid }));
    svg.appendChild(el("text", { x: L - 7, y: yy(v) + 4, "text-anchor": "end" }, short(v)));
  }
  svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(0), y2: yy(0), stroke: axis }));
  for (var g = 0; g <= gMax; g += Math.max(1, Math.round(gMax / 8 / 10) * 10)) {
    svg.appendChild(el("text", { x: xx(g), y: H - B + 18, "text-anchor": "middle" }, nf(g)));
  }
  svg.appendChild(el("text", {
    x: (L + W - Rm) / 2, y: H - 8, "text-anchor": "middle", "font-size": "11"
  }, T("cf.bep.axis", null, "dine-in guests per day")));

  function line(fn, col) {
    var d = "M" + xx(0) + " " + yy(fn(0)) + " L" + xx(gMax) + " " + yy(fn(gMax));
    var p = el("path", { d: d, fill: "none", stroke: col, "stroke-width": 2.5 });
    svg.appendChild(p);
    /* длину берём фактическую: при dasharray короче пути узор повторится */
    p.setAttribute("class", "line-draw");
    p.style.setProperty("--len", p.getTotalLength());
  }
  line(rev, cRev);
  line(cost, cCost);

  /* точка пересечения и текущее положение */
  var bx = xx(b.guestsDay), by = yy(rev(b.guestsDay));
  var mark = el("g", { class: "pop" });
  mark.appendChild(el("line", { x1: bx, x2: bx, y1: T0, y2: yy(0), stroke: acc, "stroke-dasharray": "4 4" }));
  mark.appendChild(el("circle", { cx: bx, cy: by, r: 6, fill: acc }));
  /* Подпись ставим у верха пунктира, а не у самой точки: там она ложилась
     поверх линии расходов. Если места справа мало — отзеркаливаем. */
  var flip = bx > W * 0.62;
  mark.appendChild(el("text", {
    x: bx + (flip ? -10 : 10), y: T0 + 12, fill: acc, "font-size": "12", "font-weight": "600",
    "text-anchor": flip ? "end" : "start"
  }, T("cf.bep.mark", { n: nf(b.guestsDay) }, "break-even · {n} guests per day")));
  svg.appendChild(mark);

  var cx = xx(R.guestsDay), cy = yy(rev(R.guestsDay));
  var now = el("g", { class: "pop" });
  now.style.animationDelay = ".7s";
  now.appendChild(el("circle", { cx: cx, cy: cy, r: 6, fill: "none", stroke: ink, "stroke-width": 2 }));
  now.appendChild(el("text", {
    x: cx + 10, y: cy + 18, fill: ink, "font-size": "12", "font-weight": "600"
  }, T("cf.bep.plan", { n: nf(R.guestsDay) }, "plan · {n}")));
  svg.appendChild(now);

  legend("lgBep", [
    [T("cf.bep.legendRev", null, "Revenue excl. VAT"), cRev],
    [T("cf.bep.legendCost", null, "Costs without depreciation"), cCost]
  ]);

  noteInto(note, "cf.bep.note",
    "To break even on cash you need {guests} — that is {occ} occupancy. To cover depreciation " +
    "on top of that — {guestsAcct}. The plan sits {safety} above the cash threshold, and that " +
    "is the margin of safety.",
    {
      guests: T("cf.bep.guestsPerDay", { n: nf(b.guestsDay) }, "{n} dine-in guests per day"),
      occ: pctS(b.occRequired * 100),
      guestsAcct: T("cf.bep.guests", { n: nf(R.bepAcct.guestsDay) }, "{n} guests"),
      safety: pctS(R.kpi.safety)
    });
  if (!b.feasible) {
    note.appendChild(h("b", null, T("cf.bep.infeasible", null,
      " Careful: that many guests do not fit into the room you have.")));
  }
}

/* ------------------------------------------------ 5. торнадо ---------------- */
function chartTornado() {
  var svg = $("chTornado");
  clearSvg(svg);
  var rows = SENS.rows;
  var W = 900, H = 300, L = 118, Rm = 60, T0 = 22, B = 30;
  var cUp = cssv("--cf-good"), cDn = cssv("--cf-bad"),
      grid = cssv("--cf-grid"), axis = cssv("--cf-axis"), ink = cssv("--cf-text");

  var span = 0;
  rows.forEach(function (r) {
    r.points.forEach(function (p) { span = Math.max(span, Math.abs(p.delta)); });
  });
  span = niceMax(span || 1);
  var cx = (L + W - Rm) / 2;
  var half = (W - L - Rm) / 2;
  var xx = function (v) { return cx + v / span * half; };

  for (var i = -2; i <= 2; i++) {
    var v = span * i / 2;
    svg.appendChild(el("line", { x1: xx(v), x2: xx(v), y1: T0 - 6, y2: H - B, stroke: i === 0 ? axis : grid }));
    svg.appendChild(el("text", { x: xx(v), y: H - B + 17, "text-anchor": "middle" },
      (v > 0 ? "+" : "") + short(v)));
  }

  var rh = (H - T0 - B) / Math.max(1, rows.length);
  rows.forEach(function (r, i) {
    var y = T0 + i * rh;
    var name = leverName(r.id, r.name);
    svg.appendChild(el("text", {
      x: L - 10, y: y + rh / 2 + 4, "text-anchor": "end", fill: ink, "font-size": "12"
    }, name));

    /* Внешние плечи ±20 % — бледный фон, внутренние ±10 % — насыщенные.
       Плечи рисуются раздельно и не усредняются: из-за клампа загрузки на
       100 % бар «+20 % трафика» может оказаться короче «−20 %», и это не
       артефакт, а сигнал «зал упирается в потолок». */
    [[0, 0.35], [3, 0.35], [1, 1], [2, 1]].forEach(function (cfg) {
      var pt = r.points[cfg[0]];
      var right = pt.delta >= 0;
      var x0 = Math.min(cx, xx(pt.delta)), x1 = Math.max(cx, xx(pt.delta));
      var rct = el("rect", {
        x: x0, y: y + rh * (cfg[1] === 1 ? 0.3 : 0.16),
        width: Math.max(1, x1 - x0), height: rh * (cfg[1] === 1 ? 0.4 : 0.68),
        fill: right ? cUp : cDn, opacity: cfg[1], rx: 2
      });
      /* origin у левых баров — справа: они «вырастают» из центральной оси */
      rct.setAttribute("class", right ? "bar-wide-l" : "bar-wide-r");
      rct.style.setProperty("--i", i);
      title(rct, T("cf.tornado.tip", {
        name: name,
        pct: (pt.d > 0 ? "+" : "") + Math.round(pt.d * 100),
        delta: (pt.delta >= 0 ? "+" : "") + money(pt.delta)
      }, "{name} {pct}% → {delta} to net profit"));
      svg.appendChild(rct);
    });

    svg.appendChild(el("text", {
      x: W - Rm + 8, y: y + rh / 2 + 4, "font-size": "11"
    }, "±" + short(r.span)));
  });

  svg.appendChild(el("text", {
    x: cx, y: T0 - 10, "text-anchor": "middle", "font-size": "11"
  }, T("cf.tornado.axis", { cur: cur() }, "change in net profit, {cur} per month")));

  var last = rows[rows.length - 1];
  noteInto($("sensNote"), "cf.sens.note",
    "The saturated part is a ±10% move, the pale one ±20%. Profit is moved most by {top}: " +
    "±20% on it is worth {topSpan} a month. Least of all — {bottom} ({bottomSpan}).",
    {
      top: leverName(rows[0].id, rows[0].name).toLowerCase(),
      topSpan: money(rows[0].span),
      bottom: leverName(last.id, last.name).toLowerCase(),
      bottomSpan: money(last.span)
    });
}

/* ------------------------------------------------ 6. сценарии --------------- */
function chartScenarios() {
  var svg = $("chScen");
  clearSvg(svg);
  var W = 900, H = 280, L = 62, Rm = 16, T0 = 24, B = 52;
  var grid = cssv("--cf-grid"), axis = cssv("--cf-axis"),
      good = cssv("--cf-good"), bad = cssv("--cf-bad"), ink = cssv("--cf-text");

  var items = [["pes", SC.pes], ["base", SC.base], ["opt", SC.opt]];
  var vals = items.map(function (it) { return it[1].netProfit; });
  var sc = niceScale(Math.min.apply(null, vals.concat([0])),
                     Math.max.apply(null, vals.concat([1])));
  var yy = function (v) { return T0 + (sc.hi - v) / (sc.hi - sc.lo) * (H - T0 - B); };

  scaleTicks(sc).forEach(function (v) {
    svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(v), y2: yy(v), stroke: grid }));
    svg.appendChild(el("text", { x: L - 7, y: yy(v) + 4, "text-anchor": "end" }, short(v)));
  });
  svg.appendChild(el("line", { x1: L, x2: W - Rm, y1: yy(0), y2: yy(0), stroke: axis }));

  var bw = (W - L - Rm) / items.length;
  items.forEach(function (it, i) {
    var v = it[1].netProfit;
    var name = scenName(it[0]);
    var x = L + i * bw + bw * 0.3, w = bw * 0.4;
    var g = el("g", { class: "bar-grow" });
    g.style.setProperty("--i", i);
    var rct = el("rect", {
      x: x, y: yy(Math.max(0, v)), width: w,
      height: Math.max(2, Math.abs(yy(v) - yy(0))), fill: v >= 0 ? good : bad, rx: 3
    });
    title(rct, T("cf.scen.tip", { name: name, v: money(v) }, "{name}: net profit {v}"));
    g.appendChild(rct);
    svg.appendChild(g);

    svg.appendChild(el("text", {
      x: x + w / 2, y: v >= 0 ? yy(v) - 8 : yy(v) + 17, "text-anchor": "middle",
      fill: v >= 0 ? good : bad, "font-size": "13", "font-weight": "650"
    }, short(v)));
    svg.appendChild(el("text", {
      x: x + w / 2, y: H - B + 20, "text-anchor": "middle", fill: ink, "font-size": "12"
    }, name));
    svg.appendChild(el("text", {
      x: x + w / 2, y: H - B + 36, "text-anchor": "middle", "font-size": "11"
    }, it[1].payback == null
        ? T("cf.fmt.noPayback", null, "does not pay back")
        : T("cf.scen.payback", { v: months(it[1].payback) }, "payback {v}")));
  });

  /* таблица под графиком */
  var host = $("scenResTable");
  clearNode(host);
  var thead = document.createElement("thead");
  var trh = document.createElement("tr");
  [T("cf.scenres.metric", null, "Metric"), scenName("pes"), scenName("base"), scenName("opt")]
    .forEach(function (t, i) {
      trh.appendChild(h("th", i ? "n" : null, t));
    });
  thead.appendChild(trh);
  host.appendChild(thead);
  var tb = document.createElement("tbody");
  [
    [T("cf.scenres.revNet", null, "Revenue excl. VAT"), function (r) { return money(r.revNet); }],
    [T("cf.scenres.guests", null, "Guests per day"), function (r) { return nf(r.guestsDay); }],
    ["EBITDA", function (r) { return money(r.ebitda); }],
    [T("cf.scenres.net", null, "Net profit"), function (r) { return money(r.netProfit); }],
    [T("cf.scenres.netMargin", null, "Net margin"), function (r) { return pctS(r.kpi.netMargin); }],
    [T("cf.scenres.prime", null, "Prime cost"), function (r) { return pctS(r.kpi.prime); }],
    [T("cf.scenres.bep", null, "Break-even, guests per day"), function (r) {
      return r.bepCash.status === "ok" ? nf(r.bepCash.guestsDay) : "—"; }],
    [T("cf.scenres.payback", null, "Payback"), function (r) { return months(r.payback); }]
  ].forEach(function (row) {
    var tr = document.createElement("tr");
    tr.appendChild(h("td", null, row[0]));
    [SC.pes, SC.base, SC.opt].forEach(function (r) {
      tr.appendChild(h("td", "n", row[1](r)));
    });
    tb.appendChild(tr);
  });
  host.appendChild(tb);
}

/* =============================== ОРКЕСТРАЦИЯ ============================== */
function drawAll() {
  chartHours();
  chartWaterfall();
  chartDonut();
  chartBep();
  chartTornado();
  chartScenarios();
}

function revealCards() {
  var cards = document.querySelectorAll("#result .reveal");
  Array.prototype.forEach.call(cards, function (c, i) {
    c.style.setProperty("--i", i);
    c.classList.remove("revealed");
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(cards, function (c) { c.classList.add("revealed"); });
    });
  });
}

function recalc() {
  SC = runScenarios(P);
  SENS = sensitivity(P);
  R = SC[VIEW] || SC.base;
  dirty = false;

  $("result").hidden = false;
  renderScenTabs();
  renderKpis();
  renderPnl();
  drawAll();
  revealCards();

  $("runStatus").textContent = T("cf.status.calculated", { time: stamp() }, "Calculated {time}");
}

/* ------------------------------------------------------------------ запуск -- */
var booted = false;
function CF_boot() {
  if (booted) return;
  booted = true;

  load();
  syncAll();
  loadUi();
  initScrollSpy();

  /* Сохранёнку с названиями от прежней, ещё непереведённой версии страницы
     перезаписываем сразу: иначе она бы чинилась заново при каждом открытии. */
  if (legacyFixed) save();

  $("run").addEventListener("click", function () {
    recalc();
    $("s-kpi").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("exportBtn").addEventListener("click", function () { exportJson(this); });
  $("importBtn").addEventListener("click", function () { $("importFile").click(); });
  $("importFile").addEventListener("change", function () {
    if (this.files && this.files[0]) importJson(this.files[0]);
    this.value = "";
  });
  $("resetBtn").addEventListener("click", resetAll);
  /* Нижняя кнопка при разворачивании возвращает взгляд к началу формы: иначе она
     остаётся на месте, а несколько тысяч пикселей раскрываются выше без
     предупреждения. Верхней это не нужно — форма разворачивается прямо под ней. */
  $("toggleParams").addEventListener("click", function () {
    setParamsHidden(!paramsHidden);
    if (!paramsHidden) $("s-general").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("toggleParamsTop").addEventListener("click", function () {
    setParamsHidden(!paramsHidden);
  });
  $("themeAuto").addEventListener("click", function () { setTheme("auto"); });
  $("themeLight").addEventListener("click", function () { setTheme("light"); });
  $("themeDark").addEventListener("click", function () { setTheme("dark"); });

  /* F5 может прийти раньше, чем сработает отложенное сохранение — дожимаем его. */
  window.addEventListener("beforeunload", flushSave);
  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushSave();
  });

  var rt = null;
  window.addEventListener("resize", function () {
    if (!R) return;
    clearTimeout(rt);
    rt = setTimeout(drawAll, 180);
  });

  /* Первый расчёт сразу: пустая страница ничего не объясняет, а дефолты
     подобраны так, чтобы показывать осмысленную модель. */
  recalc();
  $("runStatus").textContent = T("cf.status.saved", null,
    "Showing the calculation from the saved parameters");
}
window.CF_boot = CF_boot;

/* Страховка: если resources/i18n.js не подключился, бутстрап всё равно должен
   произойти — иначе вместо страницы остался бы пустой каркас. */
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    if (!booted) CF_boot();
  }, 2500);
});
