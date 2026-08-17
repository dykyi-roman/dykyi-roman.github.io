/* =============================================================================
   Калькулятор бизнес-модели кафе — расчётный движок.

   Здесь нет ни одного обращения к DOM, кроме STORE (и тот обёрнут в проверку
   наличия document). Благодаря этому файл грузится в Node:

     node -e 'var vm=require("vm"),fs=require("fs");
              vm.runInThisContext(fs.readFileSync("js/engine.js","utf8"));
              console.log(calc(defaults()).netProfit);'

   calc(p) — единственная чистая функция. Её же вызывают все три сценария и все
   24 прогона чувствительности: только так KPI, сценарии и торнадо не разъедутся.
   ========================================================================== */
"use strict";

var SCHEMA_VERSION = 1;
var WEEKS = 4.345;              /* 365 / 7 / 12 — недель в среднем месяце */

/* ---------------------------------------------------------------- хранилище */
/* Куки + localStorage: куки просил владелец, localStorage — страховка, потому
   что в Chrome на file:// куки молча не сохраняются, а лимит куки ~4 КБ.
   Пишем всегда в оба, читаем сперва куку. */
var STORE = (function () {
  var hasDoc = typeof document !== "undefined";

  var ok = false;                       /* работают ли куки */
  if (hasDoc) {
    try {
      document.cookie = "cf_probe=1; path=/; SameSite=Lax";
      ok = document.cookie.indexOf("cf_probe=1") !== -1;
      if (ok) document.cookie = "cf_probe=; path=/; max-age=0; SameSite=Lax";
    } catch (e) { ok = false; }
  }

  /* localStorage тоже проверяем записью, а не наличием объекта: в инкогнито и при
     жёстких настройках приватности он существует, но setItem бросает исключение. */
  var lsOk = false;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cf_probe", "1");
      lsOk = localStorage.getItem("cf_probe") === "1";
      localStorage.removeItem("cf_probe");
    }
  } catch (e) { lsOk = false; }

  return {
    cookies: ok,
    local: lsOk,
    oversize: false,
    failed: false,

    /* Читаем localStorage первым: кука ограничена четырьмя килобайтами и потому
       может не содержать полного значения, а localStorage содержит всегда. */
    get: function (k) {
      if (lsOk) {
        try {
          var v = localStorage.getItem(k);
          if (v != null) return v;
        } catch (e) {}
      }
      if (ok) {
        var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + k + "=([^;]*)"));
        if (m) { try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
      }
      return null;
    },

    set: function (k, v, maxAge) {
      var okLocal = false;
      if (lsOk) {
        try {
          localStorage.setItem(k, v);
          okLocal = localStorage.getItem(k) === v;   /* проверяем, что запись легла */
        } catch (e) { okLocal = false; }
      }

      var okCookie = false;
      if (ok) {
        var enc = encodeURIComponent(v);
        if (enc.length > 3800) {
          this.oversize = true;
          /* Старую куку обязательно стираем. Иначе она переживёт сессию и будет
             отдавать устаревшее состояние вместо свежего localStorage — правки
             будут пропадать молча и только «иногда». */
          document.cookie = k + "=; path=/; max-age=0; SameSite=Lax";
        } else {
          this.oversize = false;
          document.cookie = k + "=" + enc + "; path=/; max-age=" +
            (maxAge || 31536000) + "; SameSite=Lax";
          okCookie = document.cookie.indexOf(k + "=") !== -1;
        }
      }

      /* Ни одно хранилище не приняло запись — об этом обязан узнать владелец,
         иначе он будет считать, что модель сохраняется, а это не так. */
      this.failed = !okLocal && !okCookie;
      return !this.failed;
    },

    del: function (k) {
      if (ok) document.cookie = k + "=; path=/; max-age=0; SameSite=Lax";
      try { localStorage.removeItem(k); } catch (e) {}
    }
  };
})();

/* ------------------------------------------------------------- утилиты числа */
/* Принимаем запятую как десятичный разделитель — иначе «4,20» молча станет 4. */
function num(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (v == null || v === "") return 0;
  var x = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return isFinite(x) ? x : 0;
}
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function pct(v, lo, hi) { return clamp(num(v), lo == null ? 0 : lo, hi == null ? 100 : hi) / 100; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* Часов работы в сутки, с поддержкой перехода через полночь (22:00 → 02:00). */
function hoursCount(open, close) {
  var o = clamp(Math.round(num(open)), 0, 23);
  var c = clamp(Math.round(num(close)), 0, 24);
  var h = ((c - o) + 24) % 24;
  return h === 0 ? 24 : h;
}
/* Подписи часов работы: [8, 9, … 19] */
function hourLabels(open, close) {
  var o = clamp(Math.round(num(open)), 0, 23);
  var n = hoursCount(open, close);
  var out = [];
  for (var i = 0; i < n; i++) out.push((o + i) % 24);
  return out;
}

/* ================================= ДЕФОЛТЫ ================================= */
/* Набор просчитан вручную и сходится: выручка 44 588 € нетто, food cost 30,0 %,
   ФОТ 30,7 %, prime cost 60,7 %, чистая прибыль 5 638 € (12,6 %), окупаемость
   22,5 мес. Пессимистичный сценарий на этих же числах уходит в убыток — это
   осознанно, чтобы сразу было видно, что модель чувствительна. */
function defaults() {
  return {
    schemaVersion: SCHEMA_VERSION,
    /* Названия строк здесь и ниже — английские: это одновременно значения по
       умолчанию и запас на случай, если переводы не загрузились. Локализованную
       подпись подставляет ui.js по id, пока пользователь не переименовал строку. */
    name: "Cafe",
    cur: "€",

    /* --- режим работы -------------------------------------------------- */
    days: [                                   /* prof: wd — будни, we — выходной */
      { id: "mon", name: "Mon", open: true, prof: "wd" },
      { id: "tue", name: "Tue", open: true, prof: "wd" },
      { id: "wed", name: "Wed", open: true, prof: "wd" },
      { id: "thu", name: "Thu", open: true, prof: "wd" },
      { id: "fri", name: "Fri", open: true, prof: "wd" },
      { id: "sat", name: "Sat", open: true, prof: "we" },
      { id: "sun", name: "Sun", open: true, prof: "we" }
    ],
    openWd: 8, closeWd: 20,                   /* 12 часов, будни */
    openWe: 9, closeWe: 21,                   /* 12 часов, выходные */
    closedDaysYear: 0,                        /* отпуск и праздники */

    /* --- зал ------------------------------------------------------------ */
    seats: 40,
    visitMin: 45,                             /* → 1,333 оборота на место в час */
    lastOrderBuffer: 0,                       /* стоп-приём за N минут до закрытия */
    /* Загрузка зала по часам, % занятых мест. Будни 08…19, выходные 09…20. */
    occWd: [15, 25, 30, 22, 34, 46, 42, 26, 22, 21, 17, 10],
    occWe: [13, 25, 34, 42, 46, 42, 32, 27, 27, 24, 19, 13],

    /* --- вынос и доставка ----------------------------------------------- */
    taOrders: 40, taCheck: 4.20, taPack: 0.35, taFc: "",   /* fc пусто = как в меню */
    dlOrders: 10, dlCheck: 12.00, dlPack: 0.60, dlFc: "", dlComm: 28,

    /* --- меню ------------------------------------------------------------ */
    /* spend — средняя трата ОДНОГО гостя на эту категорию, в ценах меню. */
    menu: [
      { id: "coffee", name: "Coffee and drinks",       spend: 2.80, fc: 22 },
      { id: "bakery", name: "Bakery and desserts",     spend: 1.80, fc: 32 },
      { id: "food",   name: "Breakfasts and sandwiches", spend: 2.60, fc: 31 },
      { id: "booze",  name: "Wine and beer",           spend: 0.80, fc: 28 }
    ],
    waste: 3,                                 /* потери и списания, % ОТ СЕБЕСТОИМОСТИ */

    /* --- персонал -------------------------------------------------------- */
    /* pay: "hour" — amt это ставка в час, "month" — оклад брутто в месяц. */
    staff: [
      { id: "barista", name: "Barista",        n: 2, pay: "hour",  amt: 10.5, hrs: 8, shifts: 21.7 },
      { id: "waiter",  name: "Waiter",         n: 1, pay: "hour",  amt: 9.5,  hrs: 8, shifts: 21.7 },
      { id: "cook",    name: "Cook",           n: 1, pay: "month", amt: 1900, hrs: 8, shifts: 21.7 },
      { id: "helper",  name: "Kitchen helper", n: 1, pay: "hour",  amt: 9.0,  hrs: 6, shifts: 21.7 },
      { id: "manager", name: "Manager",        n: 1, pay: "month", amt: 2000, hrs: 8, shifts: 21.7 },
      /* Без этой строки EBITDA систематически завышена: собственник работает
         бесплатно только в презентации, не в жизни. Выключается галочкой. */
      { id: "owner",   name: "Owner's salary", n: 1, pay: "month", amt: 1500, hrs: 8, shifts: 21.7 }
    ],
    payrollTax: 32,                           /* соцвзносы работодателя сверх брутто */

    /* --- постоянные расходы, в месяц ------------------------------------- */
    fixed: [
      { id: "rent",   name: "Rent",                    v: 4200 },
      { id: "util",   name: "Utilities",               v: 850 },
      { id: "inet",   name: "Internet and phone",      v: 60 },
      { id: "pos",    name: "POS and software",        v: 120 },
      { id: "mktg",   name: "Marketing",               v: 400 },
      { id: "acct",   name: "Accounting",              v: 250 },
      { id: "clean",  name: "Cleaning and supplies",   v: 180 },
      { id: "trash",  name: "Waste removal",           v: 90 },
      { id: "ins",    name: "Insurance",               v: 90 },
      { id: "maint",  name: "Equipment maintenance",   v: 180 },
      { id: "misc",   name: "Other",                   v: 200 }
    ],

    /* --- переменные ------------------------------------------------------ */
    acquiring: 0.9,                           /* % эквайринга */
    cardShare: 75,                            /* доля безнала, % */
    royalty: 0,

    /* --- налоги ---------------------------------------------------------- */
    vatReg: true,                             /* плательщик НДС */
    vat: 10,                                  /* ставка НДС на продажи */
    priceInclVat: true,                       /* цены в меню указаны с НДС */
    vatInGoods: 10,                           /* входящий НДС на закупки продуктов */
    vatInServices: 21,                        /* входящий НДС на аренду и услуги */
    taxRegime: "profit",                      /* profit | turnover | both */
    turnoverTax: 0,
    turnoverBase: "gross",                    /* база налога с оборота */
    profitTax: 25,
    levy: 330,                                /* фиксированный взнос в месяц */

    /* --- стартовые вложения ---------------------------------------------- */
    /* Единый срок амортизации на весь CAPEX слишком груб: ремонт живёт 7 лет,
       посуда — 3, а депозит и резерв не амортизируются вовсе. */
    capex: [
      { id: "reno",    name: "Renovation and fit-out",     v: 55000, dep: true,  years: 7 },
      { id: "kitchen", name: "Kitchen equipment",          v: 28000, dep: true,  years: 7 },
      { id: "furn",    name: "Furniture",                  v: 14000, dep: true,  years: 7 },
      { id: "bar",     name: "Bar and coffee equipment",   v: 16000, dep: true,  years: 5 },
      { id: "ware",    name: "Tableware and smallware",    v: 3500,  dep: true,  years: 3 },
      { id: "it",      name: "POS and IT",                 v: 3000,  dep: true,  years: 3 },
      { id: "brand",   name: "Signage and branding",       v: 4000,  dep: true,  years: 5 },
      { id: "lic",     name: "Licences and permits",       v: 4500,  dep: true,  years: 5 },
      { id: "dep",     name: "Lease deposit",              v: 8400,  dep: false, years: 0 },
      { id: "stock",   name: "Opening inventory",          v: 5000,  dep: false, years: 0 },
      { id: "launch",  name: "Launch marketing",           v: 5000,  dep: false, years: 0 },
      { id: "reserve", name: "Working capital reserve",     v: 20000, dep: false, years: 0 }
    ],

    /* --- сценарии --------------------------------------------------------- */
    scen: {
      pes:  { traffic: 0.75, check: 0.95, fixed: 1.05 },
      base: { traffic: 1.00, check: 1.00, fixed: 1.00 },
      opt:  { traffic: 1.20, check: 1.05, fixed: 1.00 }
    }
  };
}

/* ============================ ОТРАСЛЕВЫЕ ОРИЕНТИРЫ ========================= */
/* Это правила большого пальца из ресторанной практики, а не нормы закона.
   Все доли считаются от выручки БЕЗ НДС: сравнение с брутто занижает каждое
   отношение примерно на ставку НДС — самая частая ошибка в таких расчётах.
   dir: "lo" — чем меньше, тем лучше; "hi" — чем больше, тем лучше. */
/* key — ключ перевода подписи, label — английский запас (и подпись в Node). */
var BENCH = {
  foodCost:   { dir: "lo", good: 30,  warn: 35,  key: "cf.bench.foodCost",   label: "Food cost" },
  labour:     { dir: "lo", good: 30,  warn: 35,  key: "cf.bench.labour",     label: "Payroll with taxes" },
  prime:      { dir: "lo", good: 65,  warn: 70,  key: "cf.bench.prime",      label: "Prime cost" },
  rent:       { dir: "lo", good: 8,   warn: 12,  key: "cf.bench.rent",       label: "Rent" },
  occupancy:  { dir: "lo", good: 12,  warn: 15,  key: "cf.bench.occupancy",  label: "Rent and utilities" },
  netMargin:  { dir: "hi", good: 8,   warn: 0,   key: "cf.bench.netMargin",  label: "Net margin" },
  ebitdaM:    { dir: "hi", good: 15,  warn: 8,   key: "cf.bench.ebitdaM",    label: "EBITDA margin" },
  payback:    { dir: "lo", good: 24,  warn: 48,  key: "cf.bench.payback",    label: "Payback" },
  safety:     { dir: "hi", good: 25,  warn: 10,  key: "cf.bench.safety",     label: "Margin of safety" },
  revPerSeat: { dir: "hi", good: 35,  warn: 20,  key: "cf.bench.revPerSeat", label: "Revenue per seat per day" }
};

/* Возвращает "ok" | "warn" | "bad" | "" (когда значения нет). */
function grade(key, value) {
  var b = BENCH[key];
  if (!b || value == null || !isFinite(value)) return "";
  if (b.dir === "lo") return value <= b.good ? "ok" : (value <= b.warn ? "warn" : "bad");
  return value >= b.good ? "ok" : (value >= b.warn ? "warn" : "bad");
}

/* ================================== РАСЧЁТ ================================= */
/* Предупреждения возвращаются ключами, а не готовым текстом: движок ничего не
   знает про язык интерфейса и грузится в Node без I18N. Подписывает их ui.js.
   k — ключ перевода, en — английский запас, p — подстановки. */
function warn(k, en, params) { return { k: k, en: en, p: params || null }; }

function calc(p) {
  var warns = [];

  /* --- НДС ------------------------------------------------------------- */
  var vatReg = !!p.vatReg;
  var vat = vatReg ? pct(p.vat, 0, 100) : 0;
  var inclVat = vatReg && !!p.priceInclVat;
  var g2n = inclVat ? (1 + vat) : 1;          /* множитель брутто → нетто наоборот */
  function toNet(x) { return inclVat ? x / (1 + vat) : x; }

  /* --- календарь ------------------------------------------------------- */
  var wdWeek = 0, weWeek = 0;
  (p.days || []).forEach(function (d) {
    if (!d.open) return;
    if (d.prof === "we") weWeek++; else wdWeek++;
  });
  var avail = 1 - clamp(num(p.closedDaysYear), 0, 364) / 365;
  var Dwd = wdWeek * WEEKS * avail;
  var Dwe = weWeek * WEEKS * avail;
  var Dall = Dwd + Dwe;
  if (Dall <= 0) warns.push(warn("cf.warn.noDays",
    "No working day is selected — the whole model is zero."));

  var Hwd = hoursCount(p.openWd, p.closeWd);
  var Hwe = hoursCount(p.openWe, p.closeWe);

  /* --- ёмкость зала ---------------------------------------------------- */
  var seats = Math.max(0, num(p.seats));
  var visitMin = Math.max(5, num(p.visitMin));   /* защита от деления на ноль */
  var turns = 60 / visitMin;                     /* оборотов на МЕСТО в час */
  var capHour = seats * turns;
  var buffer = clamp(num(p.lastOrderBuffer), 0, 60);
  var wLast = Math.max(0, 1 - buffer / 60);      /* последний час обслуживает меньше */

  function occSum(arr, H) {
    var s = 0, hot = 0;
    for (var i = 0; i < H; i++) {
      var o = pct(arr && arr[i], 0, 100);
      if (o > 0.95) hot++;
      s += o * (i === H - 1 ? wLast : 1);
    }
    if (hot) warns.push(warn("cf.warn.occHot",
      "Occupancy above 95% for {n} h — practically unreachable.", { n: hot }));
    return s;
  }
  var guestsWdDay = capHour * occSum(p.occWd, Hwd);
  var guestsWeDay = capHour * occSum(p.occWe, Hwe);
  var guestsMonth = guestsWdDay * Dwd + guestsWeDay * Dwe;
  var capacityMonth = capHour * (Hwd * Dwd + Hwe * Dwe);
  var occAvg = capacityMonth > 0 ? guestsMonth / capacityMonth : null;

  /* --- меню ------------------------------------------------------------ */
  var spendSum = 0, fcNum = 0;
  (p.menu || []).forEach(function (c) {
    var s = Math.max(0, num(c.spend));
    spendSum += s;
    fcNum += s * pct(c.fc, 0, 95);
  });
  var avgCheck = spendSum;                        /* средний чек в ценах меню */
  var fcW = spendSum > 0 ? fcNum / spendSum : 0;  /* взвешенный food cost */
  var kWaste = 1 + pct(p.waste, 0, 100);
  var fcEff = fcW * kWaste;                       /* фактический, со списаниями */

  /* --- выручка по каналам ---------------------------------------------- */
  var taOrders = Math.max(0, num(p.taOrders)) * Dall;
  var dlOrders = Math.max(0, num(p.dlOrders)) * Dall;

  var revDineG = guestsMonth * avgCheck;
  var revTaG = taOrders * Math.max(0, num(p.taCheck));
  var revDlG = dlOrders * Math.max(0, num(p.dlCheck));
  var revGross = revDineG + revTaG + revDlG;

  var revDineN = toNet(revDineG);
  var revTaN = toNet(revTaG);
  var revDlN = toNet(revDlG);
  var revNet = revDineN + revTaN + revDlN;

  /* --- себестоимость по каналам ---------------------------------------- */
  /* Упаковка — реальные деньги за заказ, а не процент: именно она делает
     вынос и доставку заметно менее выгодными, чем кажется по food cost. */
  var fcTa = (p.taFc === "" || p.taFc == null) ? fcW : pct(p.taFc, 0, 95);
  var fcDl = (p.dlFc === "" || p.dlFc == null) ? fcW : pct(p.dlFc, 0, 95);

  var cogsDine = revDineN * fcW * kWaste;
  var cogsTa = revTaN * fcTa * kWaste + taOrders * Math.max(0, num(p.taPack));
  var cogsDl = revDlN * fcDl * kWaste + dlOrders * Math.max(0, num(p.dlPack));
  var cogs = cogsDine + cogsTa + cogsDl;
  var grossProfit = revNet - cogs;

  /* --- персонал --------------------------------------------------------- */
  var payrollGross = 0, staffHours = 0;
  (p.staff || []).forEach(function (r) {
    var n = Math.max(0, num(r.n));
    var amt = Math.max(0, num(r.amt));
    var hrs = Math.max(0, num(r.hrs));
    var sh = Math.max(0, num(r.shifts));
    if (r.pay === "month") {
      payrollGross += n * amt;
      staffHours += n * hrs * sh;
    } else {
      payrollGross += n * amt * hrs * sh;
      staffHours += n * hrs * sh;
    }
  });
  var payrollTotal = payrollGross * (1 + pct(p.payrollTax, 0, 200));

  /* --- постоянные ------------------------------------------------------- */
  var fixedTotal = 0, fixedById = {};
  (p.fixed || []).forEach(function (r) {
    var v = Math.max(0, num(r.v));
    fixedTotal += v;
    fixedById[r.id] = v;
  });
  var rent = fixedById.rent || 0;
  var utilities = fixedById.util || 0;

  /* --- переменные ------------------------------------------------------- */
  var acqRate = pct(p.acquiring, 0, 100);
  var cardShare = pct(p.cardShare, 0, 100);
  var royalty = pct(p.royalty, 0, 100);
  var aggRate = pct(p.dlComm, 0, 100);

  /* Эквайринг НЕ начисляется на доставку: платёж собирает агрегатор, кафе
     получает уже очищенную сумму. Иначе комиссия считается дважды. */
  var acquiringFee = (revDineG + revTaG) * cardShare * acqRate;
  /* Комиссия агрегатора берётся от БРУТТО стоимости заказа. */
  var aggFee = revDlG * aggRate;
  var royaltyFee = revNet * royalty;

  var regime = p.taxRegime || "profit";
  var tRate = regime !== "profit" ? pct(p.turnoverTax, 0, 100) : 0;
  var tBaseGross = (p.turnoverBase || "gross") === "gross";
  /* Налог с оборота — операционный расход ДО EBITDA: он масштабируется с
     выручкой, значит входит в маржинальность. После EBIT он занизил бы BEP. */
  var turnoverTax = (tBaseGross ? revGross : revNet) * tRate;
  var turnoverOnRev = tRate * (tBaseGross ? g2n : 1);   /* доля от нетто-выручки */

  var variable = acquiringFee + aggFee + royaltyFee + turnoverTax;
  var levy = Math.max(0, num(p.levy));

  /* --- P&L -------------------------------------------------------------- */
  var ebitda = grossProfit - payrollTotal - fixedTotal - variable - levy;

  var da = 0, investment = 0;
  (p.capex || []).forEach(function (r) {
    var v = Math.max(0, num(r.v));
    investment += v;
    if (r.dep) da += v / (Math.max(1, num(r.years)) * 12);
  });

  var ebit = ebitda - da;
  var incomeTax = regime !== "turnover" ? Math.max(0, ebit) * pct(p.profitTax, 0, 100) : 0;
  var netProfit = ebit - incomeTax;
  var cashFlow = netProfit + da;

  /* --- НДС к уплате: денежный отток, но НЕ расход P&L -------------------- */
  var vatOutput = vatReg ? revNet * vat : 0;
  var vatInput = vatReg
    ? cogs * pct(p.vatInGoods, 0, 100) + fixedTotal * pct(p.vatInServices, 0, 100)
    : 0;
  var vatPayable = Math.max(0, vatOutput - vatInput);

  /* --- точка безубыточности --------------------------------------------- */
  /* Только зал масштабируется посадочными местами. Вынос и доставку держим на
     плановом уровне и вычитаем их вклад из числителя. */
  var cmDine = 1 - fcW * kWaste - g2n * cardShare * acqRate - royalty - turnoverOnRev;

  var cmTa = revTaN - cogsTa - revTaG * cardShare * acqRate
           - revTaN * royalty - (tBaseGross ? revTaG : revTaN) * tRate;
  var cmDl = revDlN - cogsDl - aggFee
           - revDlN * royalty - (tBaseGross ? revDlG : revDlN) * tRate;
  var cmOther = cmTa + cmDl;

  var avgCheckNet = toNet(avgCheck);
  var fixedCash = payrollTotal + fixedTotal + levy;

  function bep(F) {
    if (cmDine <= 0) {
      return { status: "impossible", note: warn("cf.bep.impossible",
        "Dine-in contribution margin is ≤ 0 — there is no break-even point.") };
    }
    var need = F - cmOther;
    if (need <= 0) {
      return { status: "covered", dineRevNet: 0, guestsMonth: 0, guestsDay: 0,
               totalRevNet: revTaN + revDlN, occRequired: 0, feasible: true,
               note: warn("cf.bep.covered",
                 "Fixed costs are already covered by takeaway and delivery.") };
    }
    var dineRevNet = need / cmDine;
    var gm = avgCheckNet > 0 ? dineRevNet / avgCheckNet : null;
    /* Профиль масштабируем коэффициентом, а не усредняем плоско — тогда BEP по
       будням и выходным получается разный и правдоподобный. */
    var k = (gm != null && guestsMonth > 0) ? gm / guestsMonth : null;
    return {
      status: "ok",
      dineRevNet: dineRevNet,
      totalRevNet: dineRevNet + revTaN + revDlN,
      guestsMonth: gm,
      guestsDay: (gm != null && Dall > 0) ? gm / Dall : null,
      guestsWdDay: k != null ? guestsWdDay * k : null,
      guestsWeDay: k != null ? guestsWeDay * k : null,
      occRequired: (gm != null && capacityMonth > 0) ? gm / capacityMonth : null,
      feasible: gm != null && capacityMonth > 0 ? gm <= capacityMonth : false
    };
  }
  var bepCash = bep(fixedCash);
  var bepAcct = bep(fixedCash + da);
  if (bepCash.status === "ok" && !bepCash.feasible) {
    warns.push(warn("cf.warn.bepUnreachable",
      "Break-even is unreachable with the current seating and opening hours."));
  }
  var safety = (revNet > 0 && bepCash.status === "ok")
    ? (revNet - bepCash.totalRevNet) / revNet : null;

  /* --- окупаемость ------------------------------------------------------ */
  var payback = (cashFlow > 0 && investment > 0) ? investment / cashFlow : null;
  var roiYear = investment > 0 ? netProfit * 12 / investment : null;

  /* --- доли и KPI ------------------------------------------------------- */
  function share(x) { return revNet > 0 ? x / revNet * 100 : null; }
  var kpi = {
    foodCost:   share(cogs),
    labour:     share(payrollTotal),
    prime:      share(cogs + payrollTotal),
    rent:       share(rent),
    occupancy:  share(rent + utilities),
    netMargin:  share(netProfit),
    ebitdaM:    share(ebitda),
    payback:    payback,
    safety:     safety != null ? safety * 100 : null,
    revPerSeat: (seats > 0 && Dall > 0) ? revGross / Dall / seats : null
  };

  /* --- мягкие предупреждения -------------------------------------------- */
  if (kpi.labour != null && kpi.labour < 22 && revNet > 0) {
    warns.push(warn("cf.warn.labourLow",
      "Payroll is below 22% of revenue — at this traffic you will most likely need more shifts."));
  }
  if (staffHours > 0 && Dall > 0 && staffHours < (Hwd * Dwd + Hwe * Dwe)) {
    warns.push(warn("cf.warn.staffHours",
      "Staff hours are fewer than the opening hours — someone is left alone on the floor."));
  }
  if (spendSum <= 0) warns.push(warn("cf.warn.zeroCheck",
    "The average check is zero — fill in the menu categories."));

  return {
    /* календарь и зал */
    Dwd: Dwd, Dwe: Dwe, Dall: Dall, Hwd: Hwd, Hwe: Hwe,
    seats: seats, turns: turns, capHour: capHour,
    guestsWdDay: guestsWdDay, guestsWeDay: guestsWeDay,
    guestsMonth: guestsMonth, guestsDay: Dall > 0 ? guestsMonth / Dall : 0,
    capacityMonth: capacityMonth, occAvg: occAvg,
    /* чек и себестоимость */
    avgCheck: avgCheck, avgCheckNet: avgCheckNet, fcW: fcW, fcEff: fcEff,
    /* выручка */
    revDineG: revDineG, revTaG: revTaG, revDlG: revDlG, revGross: revGross,
    revDineN: revDineN, revTaN: revTaN, revDlN: revDlN, revNet: revNet,
    /* расходы */
    cogsDine: cogsDine, cogsTa: cogsTa, cogsDl: cogsDl, cogs: cogs,
    grossProfit: grossProfit,
    payrollGross: payrollGross, payrollTotal: payrollTotal, staffHours: staffHours,
    fixed: fixedTotal, fixedById: fixedById, rent: rent, utilities: utilities,
    acquiringFee: acquiringFee, aggFee: aggFee, royaltyFee: royaltyFee,
    turnoverTax: turnoverTax, variable: variable, levy: levy,
    /* итоги */
    ebitda: ebitda, da: da, ebit: ebit, incomeTax: incomeTax,
    netProfit: netProfit, cashFlow: cashFlow,
    investment: investment, payback: payback, roiYear: roiYear,
    /* НДС справочно */
    vatOutput: vatOutput, vatInput: vatInput, vatPayable: vatPayable,
    /* безубыточность */
    cmDine: cmDine, cmOther: cmOther, bepCash: bepCash, bepAcct: bepAcct, safety: safety,
    /* прочее */
    kpi: kpi, warns: warns
  };
}

/* ============================== СЦЕНАРИИ ================================== */
/* Множители применяются к ВХОДАМ до calc(): трафик — к слайдерам загрузки (с
   клампом на 100 %) и к числу заказов, чек — к тратам по категориям и чекам
   каналов, постоянные — к статьям расходов. */
function applyScenario(p, s) {
  if (!s) return p;
  var q = clone(p);
  var t = num(s.traffic) || 1, c = num(s.check) || 1, f = num(s.fixed) || 1;

  if (t !== 1) {
    q.occWd = (q.occWd || []).map(function (o) { return clamp(num(o) * t, 0, 100); });
    q.occWe = (q.occWe || []).map(function (o) { return clamp(num(o) * t, 0, 100); });
    q.taOrders = num(q.taOrders) * t;
    q.dlOrders = num(q.dlOrders) * t;
  }
  if (c !== 1) {
    (q.menu || []).forEach(function (m) { m.spend = num(m.spend) * c; });
    q.taCheck = num(q.taCheck) * c;
    q.dlCheck = num(q.dlCheck) * c;
  }
  if (f !== 1) {
    (q.fixed || []).forEach(function (r) { r.v = num(r.v) * f; });
  }
  return q;
}

function runScenarios(p) {
  var sc = p.scen || defaults().scen;
  return {
    pes:  calc(applyScenario(p, sc.pes)),
    base: calc(applyScenario(p, sc.base)),
    opt:  calc(applyScenario(p, sc.opt))
  };
}

/* =========================== ЧУВСТВИТЕЛЬНОСТЬ ============================= */
/* Всегда от БАЗОВОГО сценария — иначе торнадо смешался бы с множителями.
   Полный пересчёт, а не аналитическая дельта: в цепочке есть разрывы
   (max(0, ebit), кламп загрузки на 100 %), и формула дельты врёт именно у
   точки безубыточности — там, где ответ нужнее всего. */
/* name — английский запас, ключ перевода строится как cf.lever.{id}. */
var LEVERS = [
  { id: "traffic", name: "Traffic", patch: function (q, d) {
      q.occWd = (q.occWd || []).map(function (o) { return clamp(num(o) * (1 + d), 0, 100); });
      q.occWe = (q.occWe || []).map(function (o) { return clamp(num(o) * (1 + d), 0, 100); });
      q.taOrders = num(q.taOrders) * (1 + d);
      q.dlOrders = num(q.dlOrders) * (1 + d);
    } },
  { id: "check", name: "Average check", patch: function (q, d) {
      (q.menu || []).forEach(function (m) { m.spend = num(m.spend) * (1 + d); });
      q.taCheck = num(q.taCheck) * (1 + d);
      q.dlCheck = num(q.dlCheck) * (1 + d);
    } },
  { id: "foodcost", name: "Food cost", patch: function (q, d) {
      (q.menu || []).forEach(function (m) { m.fc = clamp(num(m.fc) * (1 + d), 0, 95); });
    } },
  { id: "rent", name: "Rent", patch: function (q, d) {
      (q.fixed || []).forEach(function (r) { if (r.id === "rent") r.v = num(r.v) * (1 + d); });
    } },
  { id: "payroll", name: "Payroll", patch: function (q, d) {
      (q.staff || []).forEach(function (r) { r.amt = num(r.amt) * (1 + d); });
    } },
  { id: "util", name: "Utilities", patch: function (q, d) {
      (q.fixed || []).forEach(function (r) { if (r.id === "util") r.v = num(r.v) * (1 + d); });
    } }
];

function sensitivity(p) {
  var base = calc(p);
  var deltas = [-0.20, -0.10, 0.10, 0.20];
  var rows = LEVERS.map(function (lv) {
    var pts = deltas.map(function (d) {
      var q = clone(p);
      lv.patch(q, d);
      return { d: d, netProfit: calc(q).netProfit, delta: calc(q).netProfit - base.netProfit };
    });
    var span = Math.max(Math.abs(pts[0].delta), Math.abs(pts[3].delta));
    return { id: lv.id, name: lv.name, points: pts, span: span };
  });
  rows.sort(function (a, b) { return b.span - a.span; });
  return { base: base.netProfit, rows: rows };
}

/* ---------------------------------------------------------------- экспорт ---- */
if (typeof window !== "undefined") {
  window.CAFE = {
    SCHEMA_VERSION: SCHEMA_VERSION, STORE: STORE, BENCH: BENCH,
    defaults: defaults, calc: calc, grade: grade,
    applyScenario: applyScenario, runScenarios: runScenarios,
    sensitivity: sensitivity, LEVERS: LEVERS,
    num: num, clamp: clamp, clone: clone,
    hoursCount: hoursCount, hourLabels: hourLabels
  };
}
