/* =============================================================================
   Интерфейс: состояние, построение полей и таблиц, сохранение, экспорт.
   Поля описаны декларативно (FIELDS) и строятся из defaults() — так схема формы
   физически не может разойтись со схемой расчёта.

   Локализация: каждая подпись хранится парой [ключ, английский текст]. Пара, а
   не один ключ, потому что переводы приходят по fetch: на file:// он запрещён, и
   без английского запаса страница показывала бы имена ключей. Тот же файл
   грузится в Node (verify.js), где I18N нет вовсе — см. T().
   ========================================================================== */
"use strict";

var KEY = "cafeModel";
var KEY_UI = "cafeUi";

var P = defaults();          /* параметры */
var R = null;                /* результат текущего сценария */
var SC = null;               /* все три сценария */
var SENS = null;             /* чувствительность */
var VIEW = "base";           /* какой сценарий показан */
var staleSchema = false;
var dirty = false;           /* параметры менялись после последнего расчёта */
var legacyFixed = false;     /* в сохранёнке нашлись названия от прежней версии */

/* ------------------------------------------------------------------ мелочи */
function $(id) { return document.getElementById(id); }
function h(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
var SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs, text) {
  var n = document.createElementNS(SVGNS, tag);
  for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
function clearNode(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

/* ------------------------------------------------------------- локализация */
function hasI18N() { return typeof I18N !== "undefined" && I18N && typeof I18N.t === "function"; }
function T(key, params, fallback) {
  var def = fallback != null ? fallback : key;
  var out = hasI18N() ? I18N.t(key, params || null, def) : def;
  /* I18N подставляет {x} только в найденный перевод, а в запасной текст — нет.
     Дописываем сами, иначе на file:// вместо «€/мес» осталось бы «{cur}/mo». */
  if (params) {
    Object.keys(params).forEach(function (p) {
      out = out.split("{" + p + "}").join(params[p]);
    });
  }
  return out;
}
/* Подпись, заданная парой [ключ, английский текст]; строка трактуется как ключ. */
function tx(v, params) {
  if (v == null) return null;
  return Array.isArray(v) ? T(v[0], params, v[1]) : T(v, params, v);
}
function curLang() { return hasI18N() ? I18N.lang : "en"; }

/* ------------------------------------------------------------ форматирование */
var NBSP = " ";                    /* узкий неразрывный пробел */
function nf(x, dec) {
  if (x == null || !isFinite(x)) return "—";
  var d = dec == null ? 0 : dec;
  var s = Math.abs(x).toFixed(d);
  var parts = s.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, T("cf.fmt.group", null, ","));
  return (x < 0 ? "−" : "") + parts.join(T("cf.fmt.decimal", null, "."));
}
function cur() { return P.cur || "€"; }
function money(x, dec) { return x == null || !isFinite(x) ? "—" : nf(x, dec) + NBSP + cur(); }
function pctS(x, dec) { return x == null || !isFinite(x) ? "—" : nf(x, dec == null ? 1 : dec) + NBSP + "%"; }
function months(x) {
  if (x == null || !isFinite(x)) return T("cf.fmt.noPayback", null, "does not pay back");
  if (x > 120) return T("cf.fmt.over10y", null, "> 10 years");
  return nf(x, 1) + NBSP + T("cf.unit.moShort", null, "mo");
}

/* ----------------------------------------------------------------- уведомления */
var toastTimer = null;
function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2000);
}
function flash(btn, text) {
  var old = btn.textContent;
  btn.textContent = text;
  setTimeout(function () { btn.textContent = old; }, 1600);
}

/* Текст с подстановками {x}, где сами значения выделяются <b>. Собирается из
   узлов, а не через innerHTML: значения приходят из расчёта и вставляются как
   текст, поэтому разметку в них подставить нельзя. */
function noteInto(host, key, fallback, vals) {
  if (!host) return;
  clearNode(host);
  var s = T(key, null, fallback);
  var re = /\{(\w+)\}/g, last = 0, m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) host.appendChild(document.createTextNode(s.slice(last, m.index)));
    var v = vals ? vals[m[1]] : null;
    host.appendChild(h("b", null, v == null ? "" : String(v)));
    last = m.index + m[0].length;
  }
  if (last < s.length) host.appendChild(document.createTextNode(s.slice(last)));
}

/* Названия строк списков локализуются по id — но только пока пользователь их не
   переименовал: как только он правит поле, в P лежит его текст, и подменять его
   переводом нельзя. Сравниваем с дефолтом именно для этого. */
var LIST_KEYS = ["menu", "staff", "fixed", "capex", "days"];
var DEF_NAMES = (function () {
  var D = defaults(), out = {};
  LIST_KEYS.forEach(function (k) {
    out[k] = {};
    (D[k] || []).forEach(function (r) { if (r && r.id) out[k][r.id] = r.name; });
  });
  return out;
})();
function rowName(listKey, row) {
  var def = DEF_NAMES[listKey] ? DEF_NAMES[listKey][row.id] : null;
  if (def != null && row.name === def) {
    var prefix = listKey === "days" ? "cf.day." : "cf.row." + listKey + ".";
    return T(prefix + row.id, null, def);
  }
  return row.name;
}

/* Названия строк из defaults() до того, как страницу перевели: у тех, кто открывал
   калькулятор раньше, именно они лежат в куке и localStorage. Без этой таблицы такая
   строка считается переименованной вручную и остаётся русской на любом языке. Совпало с
   прежним дефолтом — значит её не трогали, возвращаем к текущему дефолту и переводим
   как обычно. Строки, действительно переименованные пользователем, не совпадут и
   останутся как есть. */
var LEGACY_NAMES = {
  name: "Кафе",
  days: { mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Вс" },
  menu: { coffee: "Кофе и напитки", bakery: "Выпечка и десерты",
          food: "Завтраки и сэндвичи", booze: "Вино и пиво" },
  staff: { barista: "Бариста", waiter: "Официант", cook: "Повар",
           helper: "Помощник кухни", manager: "Управляющий",
           owner: "Зарплата собственника" },
  fixed: { rent: "Аренда", util: "Коммунальные", inet: "Интернет и связь",
           pos: "POS и ПО", mktg: "Маркетинг", acct: "Бухгалтерия",
           clean: "Уборка и химия", trash: "Вывоз мусора", ins: "Страховка",
           maint: "Обслуживание оборудования", misc: "Прочее" },
  capex: { reno: "Ремонт и отделка", kitchen: "Кухонное оборудование", furn: "Мебель",
           bar: "Барное и кофейное оборуд.", ware: "Посуда и инвентарь", it: "POS и IT",
           brand: "Вывеска и брендинг", lic: "Лицензии и разрешения",
           dep: "Депозит по аренде", stock: "Первичный товарный запас",
           launch: "Маркетинг на открытие", reserve: "Резерв оборотных средств" }
};
/* Возвращает true, если что-то починила — тогда сохранёнку стоит перезаписать. */
function migrateLegacyNames() {
  var D = defaults(), touched = false;
  if (P.name === LEGACY_NAMES.name) { P.name = D.name; touched = true; }
  ["days", "menu", "staff", "fixed", "capex"].forEach(function (key) {
    var byId = {};
    (D[key] || []).forEach(function (r) { if (r && r.id) byId[r.id] = r.name; });
    (P[key] || []).forEach(function (row) {
      if (!row || !row.id) return;
      var legacy = LEGACY_NAMES[key] ? LEGACY_NAMES[key][row.id] : null;
      if (legacy != null && row.name === legacy && byId[row.id] != null) {
        row.name = byId[row.id];
        touched = true;
      }
    });
  });
  return touched;
}

/* =========================== ОПИСАНИЕ ПОЛЕЙ ФОРМЫ ========================== */
/* t: text | num | check | select | note. Ключ k совпадает с ключом в defaults(). */
var U_H = ["cf.unit.h", "h"];
var U_MIN = ["cf.unit.min", "min"];
var U_PCS = ["cf.unit.pcs", "pcs"];
var U_PCT = ["cf.unit.pct", "%"];
var U_CUR = ["cf.unit.cur", "{cur}"];

var FIELDS = {
  "f-general": [
    { k: "name", t: "text", label: ["cf.f.name", "Venue name"] },
    { k: "cur", t: "text", label: ["cf.f.cur", "Currency symbol"],
      hint: ["cf.f.cur.hint", "Any symbol or code — no country is hard-wired."] },
    { k: "closedDaysYear", t: "num", label: ["cf.f.closedDays", "Closed days per year"],
      unit: ["cf.unit.days", "days"], step: 1, min: 0, max: 364,
      hint: ["cf.f.closedDays.hint", "Holidays, repairs, public holidays. Reduces the number of working days in a month."] }
  ],
  "f-hours": [
    { k: "openWd", t: "num", label: ["cf.f.openWd", "Weekdays: opening"], unit: U_H, step: 1, min: 0, max: 23 },
    { k: "closeWd", t: "num", label: ["cf.f.closeWd", "Weekdays: closing"], unit: U_H, step: 1, min: 0, max: 24 },
    { k: "openWe", t: "num", label: ["cf.f.openWe", "Weekends: opening"], unit: U_H, step: 1, min: 0, max: 23 },
    { k: "closeWe", t: "num", label: ["cf.f.closeWe", "Weekends: closing"], unit: U_H, step: 1, min: 0, max: 24 }
  ],
  "f-hall": [
    { k: "seats", t: "num", label: ["cf.f.seats", "Seats"], unit: U_PCS, step: 1, min: 0 },
    { k: "visitMin", t: "num", label: ["cf.f.visitMin", "Average visit length"], unit: U_MIN, step: 5, min: 5,
      hint: ["cf.f.visitMin.hint", "The longer guests sit, the fewer of them pass through the same seat."] },
    { k: "lastOrderBuffer", t: "num", label: ["cf.f.lastOrder", "Last orders before closing"], unit: U_MIN, step: 5, min: 0, max: 60,
      hint: ["cf.f.lastOrder.hint", "The last hour serves fewer guests: it is already too late to sit down."] }
  ],
  "f-menu": [
    { k: "waste", t: "num", label: ["cf.f.waste", "Waste and write-offs"],
      unit: ["cf.unit.pctOfCost", "% of cost"], step: 0.5, min: 0, wide: true,
      hint: ["cf.f.waste.hint", "Of cost, not of revenue: spoiled food is a purchase that never sold."] }
  ],
  "f-channels": [
    { title: ["cf.f.title.takeaway", "Takeaway"] },
    { k: "taOrders", t: "num", label: ["cf.f.orders", "Orders per day"], unit: U_PCS, step: 1, min: 0 },
    { k: "taCheck", t: "num", label: ["cf.f.check", "Average check"], unit: U_CUR, step: 0.1, min: 0 },
    { k: "taPack", t: "num", label: ["cf.f.pack", "Packaging per order"], unit: U_CUR, step: 0.05, min: 0,
      hint: ["cf.f.pack.hint", "Real money on every order — not a percentage."] },
    { k: "taFc", t: "num", label: ["cf.f.ownFc", "Own food cost"], unit: U_PCT, step: 1, min: 0, max: 95,
      placeholder: ["cf.f.ownFc.ph", "as in menu"],
      hint: ["cf.f.ownFc.hint", "Empty — the weighted food cost of the menu is used."] },
    { title: ["cf.f.title.delivery", "Delivery"] },
    { k: "dlOrders", t: "num", label: ["cf.f.orders", "Orders per day"], unit: U_PCS, step: 1, min: 0 },
    { k: "dlCheck", t: "num", label: ["cf.f.check", "Average check"], unit: U_CUR, step: 0.5, min: 0 },
    { k: "dlPack", t: "num", label: ["cf.f.pack", "Packaging per order"], unit: U_CUR, step: 0.05, min: 0 },
    { k: "dlFc", t: "num", label: ["cf.f.ownFc", "Own food cost"], unit: U_PCT, step: 1, min: 0, max: 95,
      placeholder: ["cf.f.ownFc.ph", "as in menu"] },
    { k: "dlComm", t: "num", label: ["cf.f.dlComm", "Aggregator commission"], unit: U_PCT, step: 1, min: 0, max: 100,
      hint: ["cf.f.dlComm.hint", "Charged on the full order value including VAT. Card fees are not added on delivery — the aggregator collects the payment."] }
  ],
  "f-staff": [
    { k: "payrollTax", t: "num", label: ["cf.f.payrollTax", "Payroll taxes"], unit: U_PCT, step: 1, min: 0,
      hint: ["cf.f.payrollTax.hint", "Employer contributions on top of gross pay."] }
  ],
  "f-tax": [
    { title: ["cf.f.title.variable", "Variable costs"] },
    { k: "acquiring", t: "num", label: ["cf.f.acquiring", "Card processing fee"], unit: U_PCT, step: 0.1, min: 0, max: 100 },
    { k: "cardShare", t: "num", label: ["cf.f.cardShare", "Share paid by card"], unit: U_PCT, step: 5, min: 0, max: 100 },
    { k: "royalty", t: "num", label: ["cf.f.royalty", "Royalty or franchise fee"],
      unit: ["cf.unit.pctOfRev", "% of revenue"], step: 0.5, min: 0, max: 100 },
    { title: ["cf.f.title.vat", "VAT"] },
    { k: "vatReg", t: "check", label: ["cf.f.vatReg", "VAT registered"] },
    { k: "vat", t: "num", label: ["cf.f.vat", "VAT rate on sales"], unit: U_PCT, step: 1, min: 0, max: 100 },
    { k: "priceInclVat", t: "check", label: ["cf.f.priceInclVat", "Menu prices include VAT"] },
    { k: "_vatnote", t: "note", wide: true,
      text: ["cf.f.vatNote", "VAT registered — enter rent, services and cost of goods WITHOUT VAT: input tax is reclaimed and does not affect profit. Not registered — enter everything with VAT."] },
    { title: ["cf.f.title.bizTax", "Business taxes"] },
    { k: "taxRegime", t: "select", label: ["cf.f.taxRegime", "Tax regime"],
      opts: [["profit", ["cf.opt.profit", "On profit"]],
             ["turnover", ["cf.opt.turnover", "On turnover"]],
             ["both", ["cf.opt.both", "Both"]]],
      hint: ["cf.f.taxRegime.hint", "The inactive rate is locked at zero so that nothing is paid twice."] },
    { k: "profitTax", t: "num", label: ["cf.f.profitTax", "Profit tax"], unit: U_PCT, step: 1, min: 0, max: 100 },
    { k: "turnoverTax", t: "num", label: ["cf.f.turnoverTax", "Turnover tax"], unit: U_PCT, step: 0.5, min: 0, max: 100 },
    { k: "turnoverBase", t: "select", label: ["cf.f.turnoverBase", "Turnover tax base"],
      opts: [["gross", ["cf.opt.gross", "Revenue including VAT"]],
             ["net", ["cf.opt.net", "Revenue excluding VAT"]]] },
    { k: "levy", t: "num", label: ["cf.f.levy", "Fixed levy"],
      unit: ["cf.unit.curMonth", "{cur}/mo"], step: 10, min: 0,
      hint: ["cf.f.levy.hint", "A mandatory payment regardless of turnover."] },
    { adv: ["cf.f.adv.vatIn", "Input VAT rates — they only affect the memo line «VAT payable»"], fields: [
      { k: "vatInGoods", t: "num", label: ["cf.f.vatInGoods", "Input VAT on purchases"], unit: U_PCT, step: 1, min: 0, max: 100 },
      { k: "vatInServices", t: "num", label: ["cf.f.vatInServices", "Input VAT on services and rent"], unit: U_PCT, step: 1, min: 0, max: 100 }
    ] }
  ]
};

/* Единица измерения переводится вместе с валютой: «{cur}/mo» → «€/мес». */
function unitText(unit) { return tx(unit, { cur: cur() }); }

/* ------------------------------------------------------- построение одного поля */
function buildField(spec) {
  if (spec.title) {
    return h("div", "fieldset-title", tx(spec.title));
  }
  if (spec.t === "note") {
    var nb = h("div", "warnbox info", tx(spec.text));
    nb.style.margin = "4px 0 0";
    var wrapN = h("div", "f wide");
    wrapN.appendChild(nb);
    return wrapN;
  }
  if (spec.adv) {
    var d = document.createElement("details");
    d.className = "adv";
    var s = document.createElement("summary");
    s.textContent = tx(spec.adv);
    d.appendChild(s);
    var inner = h("div", "fields");
    spec.fields.forEach(function (f) { inner.appendChild(buildField(f)); });
    d.appendChild(inner);
    return d;
  }

  var wrap = h("div", "f" + (spec.wide ? " wide" : ""));
  wrap.dataset.key = spec.k;
  var id = "in-" + spec.k;

  if (spec.t === "check") {
    var lab = h("label", "chk");
    var cb = document.createElement("input");
    cb.type = "checkbox"; cb.id = id;
    cb.checked = !!P[spec.k];
    cb.addEventListener("change", function () { setParam(spec.k, cb.checked); });
    lab.appendChild(cb);
    lab.appendChild(h("span", null, tx(spec.label)));
    wrap.appendChild(lab);
  } else {
    var l = h("label", null, tx(spec.label));
    l.htmlFor = id;
    wrap.appendChild(l);
    var row = h("div", "row");
    var inp;
    if (spec.t === "select") {
      inp = document.createElement("select");
      spec.opts.forEach(function (o) {
        var op = document.createElement("option");
        op.value = o[0]; op.textContent = tx(o[1]);
        inp.appendChild(op);
      });
      inp.value = P[spec.k];
      inp.addEventListener("change", function () { setParam(spec.k, inp.value); });
    } else {
      inp = document.createElement("input");
      inp.type = spec.t === "num" ? "number" : "text";
      if (spec.step != null) inp.step = spec.step;
      if (spec.min != null) inp.min = spec.min;
      if (spec.max != null) inp.max = spec.max;
      if (spec.placeholder) inp.placeholder = tx(spec.placeholder);
      /* Название заведения переводится по тому же правилу, что и строки таблиц:
         пока оно совпадает с дефолтом, показываем локализованное. */
      inp.value = (spec.k === "name" && P.name === defaults().name)
        ? T("cf.venue.default", null, P.name)
        : P[spec.k];
      inp.addEventListener("input", function () {
        setParam(spec.k, spec.t === "num" && inp.value !== "" ? num(inp.value) : inp.value);
      });
    }
    inp.id = id;
    row.appendChild(inp);
    if (spec.unit) {
      var u = h("span", "unit", unitText(spec.unit));
      /* Ключ единицы держим на элементе: смена валюты обновляет подписи, не
         перестраивая форму, иначе из поля вылетала бы каретка. */
      u.dataset.unitKey = Array.isArray(spec.unit) ? spec.unit[0] : spec.unit;
      u.dataset.unitEn = Array.isArray(spec.unit) ? spec.unit[1] : spec.unit;
      row.appendChild(u);
    }
    wrap.appendChild(row);
  }
  if (spec.hint) wrap.appendChild(h("div", "hint", tx(spec.hint)));
  return wrap;
}

function buildFields() {
  Object.keys(FIELDS).forEach(function (hostId) {
    var host = $(hostId);
    if (!host) return;
    clearNode(host);
    FIELDS[hostId].forEach(function (spec) { host.appendChild(buildField(spec)); });
  });
}

/* Подсветка изменённых от дефолта полей + блокировка неактивных ставок. */
function refreshFieldStates() {
  var D = defaults();
  document.querySelectorAll(".f[data-key]").forEach(function (f) {
    var k = f.dataset.key;
    if (!(k in D)) return;
    f.classList.toggle("changed", JSON.stringify(P[k]) !== JSON.stringify(D[k]));
  });
  var regime = P.taxRegime;
  var pt = $("in-profitTax"), tt = $("in-turnoverTax"), tb = $("in-turnoverBase");
  if (pt) pt.disabled = regime === "turnover";
  if (tt) tt.disabled = regime === "profit";
  if (tb) tb.disabled = regime === "profit";
  var vt = $("in-vat"), pv = $("in-priceInclVat");
  if (vt) vt.disabled = !P.vatReg;
  if (pv) pv.disabled = !P.vatReg;
}

/* ---------------------------------------------------- изменение параметра ---- */
var saveTimer = null;
function setParam(k, v) {
  P[k] = v;
  markDirty();
  refreshFieldStates();
  refreshNotes();
  scheduleSave();
  /* Перестраивать форму целиком нельзя — из поля, в котором печатают, вылетит
     каретка. Меняем только подписи единиц. */
  if (k === "cur") updateUnits();
  if (k === "openWd" || k === "closeWd" || k === "openWe" || k === "closeWe") renderOcc();
}
function updateUnits() {
  document.querySelectorAll("[data-unit-key]").forEach(function (u) {
    u.textContent = T(u.dataset.unitKey, { cur: cur() }, u.dataset.unitEn)
      .replace("{cur}", cur());
  });
}
function markDirty() {
  dirty = true;
  if (R) $("runStatus").textContent = T("cf.status.dirty", null,
    "Parameters changed — press «Calculate»");
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
}
/* Сохранение отложено на 350 мс, чтобы не писать на каждое нажатие клавиши. Но
   если между последней правкой и F5 прошло меньше, правка пропала бы — поэтому
   перед уходом со страницы таймер обязательно досрочно срабатывает. */
function flushSave() {
  if (saveTimer == null) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  save();
}

/* ========================== РЕДАКТИРУЕМЫЕ ТАБЛИЦЫ ========================= */
/* Таблица перестраивается только при добавлении и удалении строк: при вводе
   меняются лишь P и подписи, иначе из поля выбивало бы каретку. */
function listTable(hostId, key, cols, opts) {
  opts = opts || {};
  var host = $(hostId);
  if (!host) return;
  clearNode(host);

  var thead = document.createElement("thead");
  var trh = document.createElement("tr");
  cols.forEach(function (c) {
    var th = h("th", c.n ? "n" : null, tx(c.label));
    if (c.w) th.style.width = c.w;
    trh.appendChild(th);
  });
  trh.appendChild(h("th", null, ""));
  thead.appendChild(trh);
  host.appendChild(thead);

  var tbody = document.createElement("tbody");
  (P[key] || []).forEach(function (row, i) {
    tbody.appendChild(buildRow(key, row, i, cols));
  });
  host.appendChild(tbody);

  var tfoot = document.createElement("tfoot");
  var trf = document.createElement("tr");
  var td = document.createElement("td");
  td.colSpan = cols.length + 1;
  var add = h("button", "ghost-btn sm", T("cf.btn.addRow", null, "+ add row"));
  add.type = "button";
  add.addEventListener("click", function () {
    var tpl = opts.template ? opts.template() : {};
    tpl.id = key.slice(0, 2) + "_" + Date.now().toString(36);
    P[key].push(tpl);
    markDirty(); scheduleSave();
    listTable(hostId, key, cols, opts);
    refreshNotes();
  });
  td.appendChild(add);
  trf.appendChild(td);
  tfoot.appendChild(trf);
  host.appendChild(tfoot);
}

function buildRow(key, row, i, cols) {
  var tr = document.createElement("tr");
  cols.forEach(function (c) {
    var td = h("td", c.n ? "n" : null);
    var inp;
    if (c.t === "select") {
      inp = document.createElement("select");
      c.opts.forEach(function (o) {
        var op = document.createElement("option");
        op.value = o[0]; op.textContent = tx(o[1]);
        inp.appendChild(op);
      });
      inp.value = row[c.k];
      inp.addEventListener("change", function () {
        row[c.k] = inp.value; markDirty(); scheduleSave(); refreshNotes();
      });
    } else if (c.t === "check") {
      inp = document.createElement("input");
      inp.type = "checkbox";
      inp.checked = !!row[c.k];
      inp.style.width = "auto";
      inp.addEventListener("change", function () {
        row[c.k] = inp.checked; markDirty(); scheduleSave(); refreshNotes();
      });
    } else {
      inp = document.createElement("input");
      inp.type = c.t === "num" ? "number" : "text";
      inp.className = c.t === "num" ? "n" : "name";
      if (c.step != null) inp.step = c.step;
      if (c.min != null) inp.min = c.min;
      if (c.max != null) inp.max = c.max;
      if (c.placeholder) inp.placeholder = tx(c.placeholder);
      /* Имя строки показываем переведённым, пока оно совпадает с дефолтом; как
         только пользователь его поправит, в P попадёт его текст и перевод больше
         не применяется. */
      inp.value = c.k === "name" ? rowName(key, row) : row[c.k];
      inp.addEventListener("input", function () {
        row[c.k] = c.t === "num" && inp.value !== "" ? num(inp.value) : inp.value;
        markDirty(); scheduleSave(); refreshNotes();
      });
    }
    td.appendChild(inp);
    tr.appendChild(td);
  });
  var tdd = document.createElement("td");
  tdd.style.width = "30px";
  var del = h("button", "del", "×");
  del.type = "button";
  del.title = T("cf.btn.delRow", null, "Delete row");
  del.addEventListener("click", function () {
    P[key].splice(i, 1);
    markDirty(); scheduleSave();
    renderAllTables(); refreshNotes();
  });
  tdd.appendChild(del);
  tr.appendChild(tdd);
  return tr;
}

var MENU_COLS = [
  { k: "name", t: "text", label: ["cf.col.category", "Category"], w: "46%" },
  { k: "spend", t: "num", label: ["cf.col.spendPerGuest", "Spend per guest"], n: true, step: 0.1, min: 0 },
  { k: "fc", t: "num", label: ["cf.col.foodCost", "Food cost, %"], n: true, step: 1, min: 0, max: 95 }
];
var STAFF_COLS = [
  { k: "name", t: "text", label: ["cf.col.role", "Role"], w: "30%" },
  { k: "n", t: "num", label: ["cf.col.people", "People"], n: true, step: 1, min: 0 },
  { k: "pay", t: "select", label: ["cf.col.pay", "Pay"],
    opts: [["month", ["cf.opt.salary", "Salary"]], ["hour", ["cf.opt.hourly", "Hourly"]]] },
  { k: "amt", t: "num", label: ["cf.col.amount", "Amount"], n: true, step: 50, min: 0 },
  { k: "hrs", t: "num", label: ["cf.col.hrsShift", "H/shift"], n: true, step: 1, min: 0 },
  { k: "shifts", t: "num", label: ["cf.col.shiftsMonth", "Shifts/mo"], n: true, step: 0.1, min: 0 }
];
var FIXED_COLS = [
  { k: "name", t: "text", label: ["cf.col.item", "Item"], w: "62%" },
  { k: "v", t: "num", label: ["cf.col.perMonth", "Per month"], n: true, step: 10, min: 0 }
];
var CAPEX_COLS = [
  { k: "name", t: "text", label: ["cf.col.item", "Item"], w: "48%" },
  { k: "v", t: "num", label: ["cf.col.amount", "Amount"], n: true, step: 500, min: 0 },
  { k: "dep", t: "check", label: ["cf.col.dep", "Depr."], n: true },
  { k: "years", t: "num", label: ["cf.col.years", "Years"], n: true, step: 1, min: 0, max: 30 }
];

function renderAllTables() {
  listTable("menuTable", "menu", MENU_COLS,
    { template: function () { return { name: T("cf.tpl.category", null, "New category"), spend: 0, fc: 30 }; } });
  listTable("staffTable", "staff", STAFF_COLS,
    { template: function () { return { name: T("cf.tpl.role", null, "New role"), n: 1, pay: "month", amt: 0, hrs: 8, shifts: 21.7 }; } });
  listTable("fixedTable", "fixed", FIXED_COLS,
    { template: function () { return { name: T("cf.tpl.item", null, "New item"), v: 0 }; } });
  listTable("capexTable", "capex", CAPEX_COLS,
    { template: function () { return { name: T("cf.tpl.item", null, "New item"), v: 0, dep: true, years: 5 }; } });
  renderScenTable();
}

/* ------------------------------------------------------------ сценарии ------ */
function scenName(s) {
  return T("cf.scen." + s, null, { pes: "Pessimistic", base: "Base", opt: "Optimistic" }[s]);
}
function leverName(id, fallback) {
  return T("cf.lever." + id, null, fallback || id);
}
function renderScenTable() {
  var host = $("scenTable");
  if (!host) return;
  clearNode(host);
  var keys = ["traffic", "check", "fixed"];
  var fallbacks = { traffic: "Traffic", check: "Average check", fixed: "Fixed costs" };

  var thead = document.createElement("thead");
  var trh = document.createElement("tr");
  trh.appendChild(h("th", null, T("cf.scen.col", null, "Scenario")));
  keys.forEach(function (k) {
    trh.appendChild(h("th", "n", leverName(k, fallbacks[k]) + T("cf.scen.multSuffix", null, ", ×")));
  });
  thead.appendChild(trh);
  host.appendChild(thead);

  var tb = document.createElement("tbody");
  ["pes", "base", "opt"].forEach(function (s) {
    var tr = document.createElement("tr");
    tr.appendChild(h("td", null, scenName(s)));
    keys.forEach(function (k) {
      var td = h("td", "n");
      /* Множитель без единиц читается как загадка, поэтому рядом с полем
         показываем, что он означает: ×0,75 → −25 %. */
      var box = h("div", "mult");
      box.appendChild(h("span", "unit", "×"));
      var inp = document.createElement("input");
      inp.type = "number"; inp.step = 0.05; inp.min = 0; inp.className = "n";
      inp.value = P.scen[s][k];
      inp.disabled = (s === "base");
      var delta = h("span", "unit delta", multLabel(P.scen[s][k]));
      inp.addEventListener("input", function () {
        P.scen[s][k] = num(inp.value);
        delta.textContent = multLabel(P.scen[s][k]);
        markDirty(); scheduleSave();
      });
      box.appendChild(inp);
      box.appendChild(delta);
      td.appendChild(box);
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  host.appendChild(tb);

  var note = $("scenNote");
  if (note) {
    clearNode(note);
    note.appendChild(document.createTextNode(T("cf.scen.note", null,
      "Multipliers are applied to the base parameters before the calculation: traffic — to " +
      "hourly occupancy and order counts, average check — to category spend and channel " +
      "checks, fixed costs — to the cost lines.")));
  }
}
/* «×0,75» → «−25 %»; ровно единица подписывается словом, чтобы не было «0 %». */
function multLabel(m) {
  var v = num(m);
  if (v === 1) return T("cf.scen.asIs", null, "as is");
  /* округляем до десятой: (1.05 - 1) * 100 в двоичной арифметике даёт
     5.000000000000004, и без этого подпись выходит «+5,0 %» вместо «+5 %» */
  var d = Math.round((v - 1) * 1000) / 10;
  var dec = Math.abs(d % 1) > 0.04 ? 1 : 0;
  return (d > 0 ? "+" : "−") + nf(Math.abs(d), dec) + NBSP + "%";
}

/* ------------------------------------------------------- дни и часы загрузки */
function renderDays() {
  var host = $("dayToggles");
  clearNode(host);
  P.days.forEach(function (d) {
    /* Класс несёт и открытость, и профиль: выходной красится вторым цветом —
       тем же, каким подписаны выходные на графике «Гостей по часам». */
    var cls = function () { return "day " + (d.open ? "on " + d.prof : "off " + d.prof); };
    var b = h("div", cls());
    var nm = h("b", null, rowName("days", d));
    b.appendChild(nm);
    var sel = document.createElement("select");
    [["wd", ["cf.prof.wd", "weekday"]], ["we", ["cf.prof.we", "weekend"]]].forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0]; op.textContent = tx(o[1]);
      sel.appendChild(op);
    });
    sel.value = d.prof;
    sel.addEventListener("change", function (e) {
      e.stopPropagation();
      d.prof = sel.value;
      b.className = cls();
      markDirty(); scheduleSave(); refreshNotes();
    });
    sel.addEventListener("click", function (e) { e.stopPropagation(); });
    b.appendChild(sel);
    b.addEventListener("click", function () {
      d.open = !d.open;
      b.className = cls();
      markDirty(); scheduleSave(); refreshNotes();
    });
    host.appendChild(b);
  });
}

/* Сетка загрузки перестраивается при смене часов работы; значения сохраняются,
   недостающие часы добираются последним известным. */
function occFit(arr, n) {
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push(arr && arr[i] != null ? num(arr[i]) : (arr && arr.length ? num(arr[arr.length - 1]) : 20));
  }
  return out;
}
/* Ссылки на подписи ползунков: число гостей зависит не только от самого
   ползунка, но и от мест и длительности визита, поэтому подписи пересчитываются
   централизованно, а не только в обработчике ползунка. */
var OCC_UI = { occWd: [], occWe: [] };

function renderOcc() {
  OCC_UI = { occWd: [], occWe: [] };
  [["occWd", P.openWd, P.closeWd], ["occWe", P.openWe, P.closeWe]]
    .forEach(function (cfg) {
      var key = cfg[0];
      var labels = hourLabels(cfg[1], cfg[2]);
      P[key] = occFit(P[key], labels.length);
      var host = $(key);
      clearNode(host);
      labels.forEach(function (hr, i) {
        var row = h("div", "occ-row");
        row.appendChild(h("span", "h", (hr < 10 ? "0" : "") + hr + ":00"));
        var r = document.createElement("input");
        r.type = "range"; r.min = 0; r.max = 100; r.step = 1;
        r.value = P[key][i];
        r.setAttribute("aria-label", T("cf.occ.aria", { h: hr }, "Occupancy at {h}:00"));
        var out = h("span", "v");
        r.addEventListener("input", function () {
          P[key][i] = num(r.value);
          markDirty(); scheduleSave(); refreshNotes();
        });
        row.appendChild(r);
        row.appendChild(out);
        host.appendChild(row);
        OCC_UI[key].push({ out: out, last: i === labels.length - 1 });
      });
    });
  refreshOccLabels();
}

/* «34 % · 18 чел» — процент занятых мест и сколько это гостей за час. */
function refreshOccLabels() {
  var seats = Math.max(0, num(P.seats));
  var capHour = seats * 60 / Math.max(5, num(P.visitMin));
  var wLast = Math.max(0, 1 - clamp(num(P.lastOrderBuffer), 0, 60) / 60);
  ["occWd", "occWe"].forEach(function (key) {
    OCC_UI[key].forEach(function (ui, i) {
      var occ = clamp(num(P[key][i]), 0, 100);
      var guests = capHour * occ / 100 * (ui.last ? wLast : 1);
      clearNode(ui.out);
      ui.out.appendChild(document.createTextNode(occ + NBSP + "%"));
      var g = h("span", "g", " · " + T("cf.occ.people", { n: nf(guests) }, "{n} ppl"));
      g.title = T("cf.occ.peopleTitle", null, "guests in this hour");
      ui.out.appendChild(g);
    });
  });
}

var PRESETS = [
  { id: "flat", label: ["cf.presets.flat", "Flat"],
    fn: function (n) { var a = []; for (var i = 0; i < n; i++) a.push(28); return a; } },
  { id: "morning", label: ["cf.presets.morning", "Morning peak"],
    fn: function (n) {
      var a = []; for (var i = 0; i < n; i++) {
        var f = i / Math.max(1, n - 1);
        a.push(Math.round(12 + 42 * Math.exp(-Math.pow((f - 0.15) / 0.18, 2))));
      } return a;
    } },
  { id: "lunchEve", label: ["cf.presets.lunchEve", "Lunch and evening"],
    fn: function (n) {
      var a = []; for (var i = 0; i < n; i++) {
        var f = i / Math.max(1, n - 1);
        a.push(Math.round(12 + 40 * Math.exp(-Math.pow((f - 0.38) / 0.13, 2))
                             + 28 * Math.exp(-Math.pow((f - 0.85) / 0.13, 2))));
      } return a;
    } }
];
function renderPresets() {
  var host = $("occPresets");
  clearNode(host);
  host.appendChild(h("span", "unit", T("cf.presets.label", null, "Fill both grids:")));
  PRESETS.forEach(function (preset) {
    var name = tx(preset.label);
    var b = h("button", "ghost-btn sm", name);
    b.type = "button";
    b.addEventListener("click", function () {
      P.occWd = preset.fn(hoursCount(P.openWd, P.closeWd));
      P.occWe = preset.fn(hoursCount(P.openWe, P.closeWe));
      renderOcc(); markDirty(); scheduleSave(); refreshNotes();
      toast(T("cf.toast.presetApplied", { name: name.toLowerCase() }, "Occupancy filled: {name}"));
    });
    host.appendChild(b);
  });
}

/* --------------------------------------------- живые подписи под блоками ---- */
function refreshNotes() {
  var r = calc(P);

  noteInto($("daysNote"), "cf.note.days",
    "The profile decides which occupancy grid and which hours apply to a day. " +
    "A month works out to {days}.",
    { days: T("cf.note.daysValue",
        { wd: nf(r.Dwd, 1), we: nf(r.Dwe, 1), all: nf(r.Dall, 1) },
        "{wd} weekdays and {we} weekend days, {all} in total") });

  noteInto($("turnsNote"), "cf.note.turns",
    "A guest occupies a seat for the time set above, so in one hour a single seat serves " +
    "{turns} guests. The room caps at {cap} guests per hour.",
    { turns: nf(r.turns, 2), cap: nf(r.capHour, 1) });

  /* число гостей под ползунками зависит от мест и визита, а не только от самого
     ползунка — поэтому обновляем его здесь, а не в обработчике ползунка */
  refreshOccLabels();

  noteInto($("menuNote"), "cf.note.menu",
    "Average check {check}, weighted food cost {fcW}, with write-offs {fcEff}. " +
    "Guests per day — {guests}.",
    { check: money(r.avgCheck, 2), fcW: pctS(r.fcW * 100), fcEff: pctS(r.fcEff * 100),
      guests: nf(r.guestsDay) });

  noteInto($("staffNote"), "cf.note.staff",
    "Gross payroll {gross}, with taxes {total}, hours per month {hours}.",
    { gross: money(r.payrollGross), total: money(r.payrollTotal), hours: nf(r.staffHours) });

  noteInto($("fixedNote"), "cf.note.fixed",
    "Total fixed costs {total} per month.", { total: money(r.fixed) });

  noteInto($("capexNote"), "cf.note.capex",
    "Total investment {inv}, depreciation {da} per month.",
    { inv: money(r.investment), da: money(r.da) });
}

/* ============================ СОХРАНЕНИЕ И ФАЙЛЫ =========================== */
/* Сохраняем только отличия от дефолтов — так состояние помещается в куку.
   Вынесено отдельной чистой функцией, чтобы её можно было проверить в Node. */
function diffFromDefaults(p) {
  var D = defaults(), d = {};
  Object.keys(p).forEach(function (k) {
    if (k === "schemaVersion") return;
    if (JSON.stringify(p[k]) !== JSON.stringify(D[k])) d[k] = p[k];
  });
  d.schemaVersion = SCHEMA_VERSION;
  return d;
}
function save() {
  saveTimer = null;
  STORE.set(KEY, JSON.stringify(diffFromDefaults(P)));
  updateStoreNote();
}

/* Скелет берём из кода, поверх кладём пользовательские значения по id: правки
   схемы побеждают устаревшую сохранёнку, но удалённые строки не воскресают. */
function migrateList(saved, defList) {
  if (!Array.isArray(saved)) return clone(defList);
  var byId = {};
  defList.forEach(function (r) { byId[r.id] = r; });
  var tpl = defList[0] || {};
  return saved.map(function (row, i) {
    if (row == null || typeof row !== "object") return row;
    var base = clone(byId[row.id] || tpl);
    Object.keys(row).forEach(function (k) { base[k] = row[k]; });
    if (!base.id) base.id = "x" + i;
    return base;
  });
}

function applyParams(src) {
  var D = defaults();
  Object.keys(src).forEach(function (k) {
    if (k === "schemaVersion" || !(k in D)) return;      /* выброшенные ключи игнорируем */
    var dv = D[k], sv = src[k];
    if (Array.isArray(dv)) {
      P[k] = (dv.length && typeof dv[0] === "object") ? migrateList(sv, dv)
           : (Array.isArray(sv) ? sv.map(num) : clone(dv));
    } else if (dv && typeof dv === "object") {
      var merged = clone(dv);
      if (sv && typeof sv === "object") {
        Object.keys(merged).forEach(function (g) {
          if (sv[g] && typeof sv[g] === "object") {
            Object.keys(merged[g]).forEach(function (f) {
              if (sv[g][f] !== undefined) merged[g][f] = sv[g][f];
            });
          }
        });
      }
      P[k] = merged;
    } else {
      P[k] = sv;
    }
  });
  /* Единая точка и для сохранёнки, и для импорта файла: старые русские названия
     приводятся к дефолтам сразу после того, как состояние легло в P. */
  if (migrateLegacyNames()) legacyFixed = true;
}

function load() {
  var raw = STORE.get(KEY);
  if (!raw) return;
  try {
    var d = JSON.parse(raw);
    if (d.schemaVersion !== SCHEMA_VERSION) staleSchema = true;
    applyParams(d);
  } catch (e) { staleSchema = true; }
}

function updateStoreNote() {
  var box = $("storeNote");
  var msgs = [];

  /* Самое важное сообщение — что сохранения не происходит вовсе. Раньше отказ
     localStorage молча проглатывался, и страница обещала сохранность, которой
     не было: правки исчезали на первом же F5 без единого предупреждения. */
  if (STORE.failed) {
    msgs.push(T("cf.store.failed", null,
      "Parameters ARE NOT SAVED: the browser rejected both cookies and localStorage. " +
      "That happens in private mode, under strict privacy settings, or when the file is " +
      "opened from disk. Everything you enter will be lost on reload — save the model with " +
      "«Export JSON» or open the page through a local server: python3 -m http.server 8137"));
  }
  if (staleSchema) {
    msgs.push(T("cf.store.stale", null,
      "The saved parameters came from an earlier version of the page — missing fields were " +
      "taken from the original values. Check them and press «Calculate»."));
  }
  if (STORE.oversize && STORE.local) {
    msgs.push(T("cf.store.oversize", null,
      "The parameters outgrew the cookie limit (about 4 KB) and are saved only in the " +
      "localStorage of this browser. That does not affect anything, but a backup via " +
      "«Export JSON» will not hurt."));
  }
  if (!STORE.cookies && STORE.local && !STORE.failed) {
    msgs.push(T("cf.store.noCookies", null,
      "Cookies are unavailable in this mode (usually when the file is opened from disk) — " +
      "the parameters are saved in localStorage."));
  }

  if (!msgs.length) { box.hidden = true; return; }
  box.hidden = false;
  box.className = STORE.failed ? "warnbox" : "warnbox info";
  clearNode(box);
  var ul = document.createElement("ul");
  msgs.forEach(function (m) { ul.appendChild(h("li", null, m)); });
  box.appendChild(ul);
}

/* -------------------------------------------------------- экспорт и импорт -- */
function stamp() {
  var d = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
         " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function collectState() {
  if (!SC) { SC = runScenarios(P); SENS = sensitivity(P); }
  return {
    format: "dykyi-cafe-model",
    version: 1,
    schemaVersion: SCHEMA_VERSION,
    savedAt: stamp(),
    params: P,
    results: {
      base: SC.base, pessimistic: SC.pes, optimistic: SC.opt,
      breakEven: { cash: SC.base.bepCash, accounting: SC.base.bepAcct, safety: SC.base.safety },
      sensitivity: SENS.rows
    }
  };
}
function exportJson(btn) {
  var st = collectState();
  var blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "cafe-model-" + st.savedAt.slice(0, 10) + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  flash(btn, T("cf.btn.downloaded", null, "Downloaded"));
}
function importJson(file) {
  var fr = new FileReader();
  fr.onload = function () {
    var st;
    try { st = JSON.parse(fr.result); }
    catch (e) { toast(T("cf.toast.readFail", null, "Could not read the file")); return; }
    if (!st || st.format !== "dykyi-cafe-model") {
      toast(T("cf.toast.notModel", null, "This is not a cafe model file")); return;
    }
    P = defaults();
    staleSchema = st.schemaVersion !== SCHEMA_VERSION;
    applyParams(st.params || {});
    syncAll();
    save();
    recalc();
    toast(T("cf.toast.loaded", null, "Parameters loaded"));
  };
  fr.readAsText(file);
}
function resetAll() {
  if (!confirm(T("cf.confirm.reset", null,
    "Return every parameter to its original value? The current settings will be lost."))) return;
  STORE.del(KEY);
  P = defaults();
  staleSchema = false;
  STORE.oversize = false;
  syncAll();
  save();
  recalc();
  toast(T("cf.toast.reset", null, "Parameters reset"));
}

/* Полная пересборка формы — после импорта, сброса и смены языка. */
function syncAll() {
  buildFields();
  renderDays();
  renderPresets();
  renderOcc();
  renderAllTables();
  refreshFieldStates();
  refreshNotes();
  updateStoreNote();
}

/* ============================== ВЫВОД РЕЗУЛЬТАТА =========================== */
/* Анимированный счётчик: цифры не должны прыгать, поэтому tabular-nums в CSS. */
function animateNum(node, to, fmt) {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || to == null || !isFinite(to)) { node.textContent = fmt(to); return; }
  var from = 0, t0 = null, dur = 700;
  function step(ts) {
    if (t0 == null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var e = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function kpiCard(label, value, detail, gradeKey, gradeVal) {
  var g = gradeKey ? grade(gradeKey, gradeVal) : "";
  var c = h("div", "kpi" + (g ? " " + g : ""));
  c.appendChild(h("span", "k", label));
  var v = h("span", "v", "—");
  c.appendChild(v);
  c.appendChild(h("span", "d", detail || ""));
  c._val = v;
  return c;
}

function renderKpis() {
  var host = $("kpis");
  clearNode(host);
  var k = R.kpi;
  var bench = function (key) { return BENCH[key]; };
  var asMoney = function (x) { return money(x); };
  var asPct = function (x) { return pctS(x); };

  var cards = [
    [T("cf.kpi.revenue", null, "Revenue per month"), R.revNet, asMoney,
     T("cf.kpi.revenue.d", { gross: money(R.revGross) }, "excl. VAT · {gross} incl. VAT"), null, null],
    [T("cf.kpi.netProfit", null, "Net profit"), R.netProfit, asMoney,
     T("cf.kpi.margin", { m: pctS(k.netMargin) }, "margin {m}"), "netMargin", k.netMargin],
    ["EBITDA", R.ebitda, asMoney,
     T("cf.kpi.margin", { m: pctS(k.ebitdaM) }, "margin {m}"), "ebitdaM", k.ebitdaM],
    [T("cf.kpi.foodCost", null, "Food cost"), k.foodCost, asPct,
     T("cf.kpi.benchLe", { v: bench("foodCost").good }, "target ≤ {v}%"), "foodCost", k.foodCost],
    [T("cf.kpi.labour", null, "Payroll with taxes"), k.labour, asPct,
     T("cf.kpi.perMonth", { v: money(R.payrollTotal) }, "{v} per month"), "labour", k.labour],
    [T("cf.kpi.prime", null, "Prime cost"), k.prime, asPct,
     T("cf.kpi.prime.d", { v: bench("prime").good }, "food + payroll, target ≤ {v}%"), "prime", k.prime],
    [T("cf.kpi.rent", null, "Rent"), k.rent, asPct,
     T("cf.kpi.perMonth", { v: money(R.rent) }, "{v} per month"), "rent", k.rent],
    [T("cf.kpi.avgCheck", null, "Average check"), R.avgCheck, function (x) { return money(x, 2); },
     T("cf.kpi.avgCheck.d", { v: money(R.avgCheckNet, 2) }, "excl. VAT {v}"), null, null],
    [T("cf.kpi.guestsDay", null, "Guests per day"), R.guestsDay, function (x) { return nf(x); },
     T("cf.kpi.guestsDay.d", { v: pctS(R.occAvg * 100) }, "room occupancy {v}"), null, null],
    [T("cf.kpi.bep", null, "Break-even"), R.bepCash.guestsDay, function (x) { return nf(x); },
     R.bepCash.status === "ok"
       ? T("cf.kpi.bep.d", { v: pctS(R.bepCash.occRequired * 100) }, "guests per day · occupancy {v}")
       : (R.bepCash.note ? tx([R.bepCash.note.k, R.bepCash.note.en], R.bepCash.note.p) : ""),
     null, null],
    [T("cf.kpi.safety", null, "Margin of safety"), k.safety, asPct,
     T("cf.kpi.safety.d", null, "revenue can fall by this much"), "safety", k.safety],
    [T("cf.kpi.payback", null, "Payback"), R.payback, function (x) { return months(x); },
     T("cf.kpi.payback.d", { v: money(R.investment) }, "{v} invested"), "payback", k.payback],
    [T("cf.kpi.roi", null, "ROI per year"), R.roiYear == null ? null : R.roiYear * 100, asPct,
     T("cf.kpi.roi.d", null, "profit against investment"), null, null],
    [T("cf.kpi.revPerSeat", null, "Revenue per seat"), k.revPerSeat, function (x) { return money(x, 1); },
     T("cf.kpi.revPerSeat.d", null, "per day, incl. VAT"), "revPerSeat", k.revPerSeat]
  ];

  cards.forEach(function (c, i) {
    var card = kpiCard(c[0], c[1], c[3], c[4], c[5]);
    card.style.setProperty("--i", i);
    host.appendChild(card);
    animateNum(card._val, c[1], c[2]);
  });

  $("kpiBadge").textContent = T("cf.kpi.badge",
    { scen: scenName(VIEW).toLowerCase() }, "{scen} scenario");

  /* предупреждения */
  var wh = $("warnHost");
  clearNode(wh);
  if (R.warns.length) {
    var box = h("div", "warnbox");
    var ul = document.createElement("ul");
    R.warns.forEach(function (w) {
      ul.appendChild(h("li", null, T(w.k, w.p, w.en)));
    });
    box.appendChild(ul);
    wh.appendChild(box);
  }
}

function renderPnl() {
  var host = $("pnlTable");
  clearNode(host);
  var thead = document.createElement("thead");
  var trh = document.createElement("tr");
  trh.appendChild(h("th", null, T("cf.pnl.item", null, "Item")));
  trh.appendChild(h("th", "n", T("cf.pnl.perMonth", null, "Per month")));
  trh.appendChild(h("th", "n", T("cf.pnl.pctRev", null, "% of revenue")));
  thead.appendChild(trh);
  host.appendChild(thead);

  var tb = document.createElement("tbody");
  function row(label, val, cls, showPct) {
    var tr = document.createElement("tr");
    if (cls) tr.className = cls;
    tr.appendChild(h("td", null, label));
    tr.appendChild(h("td", "n", val == null ? "—" : money(val)));
    var p = (showPct === false || R.revNet <= 0 || val == null) ? "" : pctS(val / R.revNet * 100);
    tr.appendChild(h("td", "n", p));
    if (val != null && val < 0) tr.classList.add("neg");
    tb.appendChild(tr);
    return tr;
  }
  row(T("cf.pnl.revNet", null, "Revenue excl. VAT"), R.revNet, "total");
  row(T("cf.pnl.dine", null, "dine-in"), R.revDineN, "sub");
  row(T("cf.pnl.takeaway", null, "takeaway"), R.revTaN, "sub");
  row(T("cf.pnl.delivery", null, "delivery"), R.revDlN, "sub");
  row(T("cf.pnl.cogs", null, "Cost of goods"), -R.cogs);
  row(T("cf.pnl.gross", null, "Gross profit"), R.grossProfit, "total");
  row(T("cf.pnl.payroll", null, "Payroll with taxes"), -R.payrollTotal);
  row(T("cf.pnl.fixed", null, "Fixed costs"), -R.fixed);
  row(T("cf.pnl.variable", null, "Variable costs"), -R.variable);
  row(T("cf.pnl.acquiring", null, "card processing"), -R.acquiringFee, "sub");
  row(T("cf.pnl.aggFee", null, "aggregator commission"), -R.aggFee, "sub");
  if (R.royaltyFee > 0) row(T("cf.pnl.royalty", null, "royalty"), -R.royaltyFee, "sub");
  if (R.turnoverTax > 0) row(T("cf.pnl.turnoverTax", null, "turnover tax"), -R.turnoverTax, "sub");
  row(T("cf.pnl.levy", null, "Fixed levy"), -R.levy);
  row("EBITDA", R.ebitda, "total");
  row(T("cf.pnl.da", null, "Depreciation"), -R.da);
  row(T("cf.pnl.ebit", null, "Profit before tax"), R.ebit, "total");
  row(T("cf.pnl.incomeTax", null, "Profit tax"), -R.incomeTax);
  row(T("cf.pnl.net", null, "Net profit"), R.netProfit, "grand");
  row(T("cf.pnl.cash", null, "Cash flow"), R.cashFlow, "total");
  host.appendChild(tb);

  var tf = document.createElement("tbody");
  tf.className = "memo";
  var tr = document.createElement("tr");
  tr.appendChild(h("td", null, T("cf.pnl.vatMemo", null,
    "VAT payable (not a cost, but it leaves the account)")));
  tr.appendChild(h("td", "n", money(R.vatPayable)));
  tr.appendChild(h("td", "n", ""));
  tf.appendChild(tr);
  host.appendChild(tf);
}

function renderScenTabs() {
  var host = $("scenTabs");
  clearNode(host);
  ["pes", "base", "opt"].forEach(function (s) {
    var b = h("button", "ghost-btn" + (VIEW === s ? " on" : ""), scenName(s));
    b.type = "button";
    b.addEventListener("click", function () {
      VIEW = s;
      R = SC[s];
      renderScenTabs();
      renderKpis();
      renderPnl();
      drawAll();
      saveUi();
    });
    host.appendChild(b);
  });
}

/* ------------------------------------------------------ сворачивание формы -- */
/* Переключателя два — вверху над формой и внизу рядом с «Посчитать», — но
   состояние одно, поэтому обе кнопки всегда перерисовываются вместе. */
var TOGGLES = ["toggleParamsTop", "toggleParams"];
var paramsHidden = false;
function setParamsHidden(hide, persist) {
  paramsHidden = !!hide;
  $("params").hidden = paramsHidden;
  TOGGLES.forEach(function (id) {
    var btn = $(id);
    if (!btn) return;
    btn.textContent = paramsHidden
      ? T("cf.btn.showParams", null, "Show parameters")
      : T("cf.btn.hideParams", null, "Collapse parameters");
    btn.classList.toggle("on", paramsHidden);
    btn.setAttribute("aria-expanded", paramsHidden ? "false" : "true");
    btn.setAttribute("aria-controls", "params");
  });
  if (persist !== false) saveUi();
}

/* ------------------------------------------------------------------- тема --- */
function setTheme(mode) {
  if (mode === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", mode);
  ["themeAuto", "themeLight", "themeDark"].forEach(function (id) {
    $(id).classList.toggle("on", id === "theme" + mode.charAt(0).toUpperCase() + mode.slice(1));
  });
  saveUi(mode);
  if (R) drawAll();          /* цвета в SVG берутся из CSS-переменных на момент отрисовки */
}
function saveUi(theme) {
  var ui = {
    view: VIEW,
    theme: theme || (document.documentElement.getAttribute("data-theme") || "auto"),
    paramsHidden: paramsHidden
  };
  STORE.set(KEY_UI, JSON.stringify(ui));
}
function loadUi() {
  var ui = {};
  try { ui = JSON.parse(STORE.get(KEY_UI) || "{}"); } catch (e) { ui = {}; }
  if (ui.view) VIEW = ui.view;
  /* persist=false: не перезаписываем сохранёнку на этапе её же чтения */
  setParamsHidden(!!ui.paramsHidden, false);
  setTheme(ui.theme || "auto");
}

/* ------------------------------------------------------------- скролл-спай -- */
function initScrollSpy() {
  var links = {};
  document.querySelectorAll(".side a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "#") return;   /* ссылка на сайт — не якорь */
    var id = href.slice(1);
    links[id] = a;
    /* Ссылка на свёрнутый блок иначе просто ничего не делает: сперва
       разворачиваем форму, потом браузер отрабатывает переход по якорю. */
    a.addEventListener("click", function () {
      var target = $(id);
      if (paramsHidden && target && $("params").contains(target)) setParamsHidden(false);
    });
  });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Object.keys(links).forEach(function (id) { links[id].classList.remove("active"); });
      if (links[e.target.id]) links[e.target.id].classList.add("active");
    });
  }, { rootMargin: "0px 0px -72% 0px" });
  Object.keys(links).forEach(function (id) {
    var s = $(id);
    if (s) obs.observe(s);
  });
}

/* ============================== СМЕНА ЯЗЫКА =============================== */
/* applyToDOM закрывает статическую разметку, но не то, что нарисовал JS: форму,
   таблицы, KPI и графики. Их перерисовывает CF_refresh, вызываемый I18N после
   переключения языка (имя функции зарегистрировано в resources/i18n.js). */
function CF_applyLang() {
  if (!hasI18N()) return;
  document.documentElement.lang = I18N.lang;
  I18N.applyToDOM();

  var titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) document.title = T(titleEl.getAttribute("data-i18n"), null, document.title);

  document.querySelectorAll("[data-i18n-content]").forEach(function (m) {
    var key = m.getAttribute("data-i18n-content");
    m.setAttribute("content", T(key, null, m.getAttribute("content")));
  });
  /* aria-label графиков: applyToDOM таких атрибутов не знает. */
  document.querySelectorAll("[data-i18n-aria]").forEach(function (n) {
    var key = n.getAttribute("data-i18n-aria");
    n.setAttribute("aria-label", T(key, null, n.getAttribute("aria-label")));
  });
}

function CF_refresh() {
  CF_applyLang();
  syncAll();
  setParamsHidden(paramsHidden, false);
  if (R) {
    renderScenTabs();
    renderKpis();
    renderPnl();
    drawAll();
    $("runStatus").textContent = dirty
      ? T("cf.status.dirty", null, "Parameters changed — press «Calculate»")
      : T("cf.status.saved", null, "Showing the calculation from the saved parameters");
  }
}

/* Файл грузится ещё и в Node (verify.js), где window не существует. */
if (typeof window !== "undefined") {
  window.CF_refresh = CF_refresh;
  window.CF_applyLang = CF_applyLang;
}
