/* Автопроверка расчётного движка. Запуск:  node verify.js
   Секции: 1 базовый прогон · 2 сходимость водопада · 3 обратная проверка BEP ·
   4 вырожденные входы · 5 сценарии и торнадо · 6 сохранение и импорт ·
   7 регрессии по итогам ревью (НДС без цен «с НДС», ряды по часам, KPI). */
"use strict";
var vm = require("vm"), fs = require("fs"), path = require("path");
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "js/engine.js"), "utf8"));

var fails = 0, checks = 0;
function ok(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
  else console.log("  ✓ " + name + (detail ? "  (" + detail + ")" : ""));
}
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.01 : eps); }
function n(x, d) { return x == null ? "—" : x.toFixed(d == null ? 0 : d); }

/* ---------------------------------------------------- 1. базовый прогон ---- */
console.log("\n1. Базовый сценарий");
var P = defaults(), R = calc(P);
console.log("   выручка нетто " + n(R.revNet) + " | EBITDA " + n(R.ebitda) +
            " | чистая " + n(R.netProfit) + " (" + n(R.kpi.netMargin, 1) + "%)" +
            " | окупаемость " + n(R.payback, 1) + " мес");
console.log("   food cost " + n(R.kpi.foodCost, 1) + "% · ФОТ " + n(R.kpi.labour, 1) +
            "% · prime " + n(R.kpi.prime, 1) + "% · аренда " + n(R.kpi.rent, 1) + "%");
ok("модель прибыльна на дефолтах", R.netProfit > 0, n(R.netProfit) + " €");
ok("метрики в разумных пределах",
   R.kpi.netMargin > 3 && R.kpi.netMargin < 20 && R.kpi.prime > 50 && R.kpi.prime < 75,
   "маржа " + n(R.kpi.netMargin, 1) + "%, prime " + n(R.kpi.prime, 1) + "%");

/* ------------------------------------------------ 2. сходимость водопада --- */
console.log("\n2. Сходимость водопада");
var sum = R.revNet - R.cogs - R.payrollTotal - R.fixed - R.variable - R.levy - R.da - R.incomeTax;
ok("выручка − все расходы = чистая прибыль", near(sum, R.netProfit),
   n(sum, 2) + " vs " + n(R.netProfit, 2));
ok("EBITDA = валовая − ФОТ − постоянные − переменные − взнос",
   near(R.grossProfit - R.payrollTotal - R.fixed - R.variable - R.levy, R.ebitda));
ok("COGS = сумма по каналам", near(R.cogsDine + R.cogsTa + R.cogsDl, R.cogs));
ok("выручка нетто = сумма каналов", near(R.revDineN + R.revTaN + R.revDlN, R.revNet));
ok("переменные = эквайринг + агрегатор + роялти + налог с оборота",
   near(R.acquiringFee + R.aggFee + R.royaltyFee + R.turnoverTax, R.variable));
ok("эквайринг не начислен на доставку",
   near(R.acquiringFee, (R.revDineG + R.revTaG) * 0.75 * 0.009));

/* ------------------------------------- 3. обратная проверка безубыточности - */
console.log("\n3. Обратная проверка точки безубыточности");
/* Подставляем найденную загрузку обратно: масштабируем профиль так, чтобы
   гостей стало ровно bepCash.guestsMonth, и ждём EBITDA = 0. */
var k = R.bepCash.guestsMonth / R.guestsMonth;
var Pb = clone(P);
Pb.occWd = Pb.occWd.map(function (o) { return o * k; });
Pb.occWe = Pb.occWe.map(function (o) { return o * k; });
var Rb = calc(Pb);
ok("при BEP-денежном EBITDA = 0", near(Rb.ebitda, 0, 0.5), "EBITDA = " + n(Rb.ebitda, 3));
console.log("   BEP денежный " + n(R.bepCash.guestsDay) + " гост/день (загрузка " +
            n(R.bepCash.occRequired * 100, 1) + "%), бухгалтерский " +
            n(R.bepAcct.guestsDay) + " гост/день, запас прочности " + n(R.kpi.safety, 1) + "%");

var ka = R.bepAcct.guestsMonth / R.guestsMonth;
var Pa = clone(P);
Pa.occWd = Pa.occWd.map(function (o) { return o * ka; });
Pa.occWe = Pa.occWe.map(function (o) { return o * ka; });
ok("при BEP-бухгалтерском EBIT = 0", near(calc(Pa).ebit, 0, 0.5), "EBIT = " + n(calc(Pa).ebit, 3));
ok("бухгалтерский BEP выше денежного", R.bepAcct.guestsMonth > R.bepCash.guestsMonth);

/* -------------------------------------------------- 4. вырожденные входы -- */
console.log("\n4. Вырожденные входы");
function finiteAll(r) {
  var bad = [];
  Object.keys(r).forEach(function (key) {
    var v = r[key];
    if (typeof v === "number" && !isFinite(v)) bad.push(key);
  });
  Object.keys(r.kpi).forEach(function (key) {
    var v = r.kpi[key];
    if (typeof v === "number" && !isFinite(v)) bad.push("kpi." + key);
  });
  return bad;
}
var cases = {
  "все поля нулевые": function (q) {
    q.seats = 0; q.visitMin = 0; q.taOrders = 0; q.dlOrders = 0;
    q.menu.forEach(function (m) { m.spend = 0; });
    q.staff.forEach(function (s) { s.amt = 0; });
    q.fixed.forEach(function (f) { f.v = 0; });
    q.capex.forEach(function (c) { c.v = 0; c.years = 0; });
  },
  "ни один день не выбран": function (q) { q.days.forEach(function (d) { d.open = false; }); },
  "нулевой средний чек": function (q) { q.menu.forEach(function (m) { m.spend = 0; }); },
  "нулевой CAPEX": function (q) { q.capex.forEach(function (c) { c.v = 0; }); },
  "срок амортизации 0": function (q) { q.capex.forEach(function (c) { c.years = 0; }); },
  "визит 0 минут": function (q) { q.visitMin = 0; },
  "аренда 100 000 (глубокий убыток)": function (q) {
    q.fixed.forEach(function (f) { if (f.id === "rent") f.v = 100000; });
  },
  "food cost 100 %": function (q) { q.menu.forEach(function (m) { m.fc = 100; }); },
  "мусор в полях": function (q) { q.seats = "сорок"; q.visitMin = "abc"; q.menu[0].spend = "—"; },
  "запятая как разделитель": function (q) { q.menu[0].spend = "2,80"; q.taCheck = "4,20"; }
};
Object.keys(cases).forEach(function (name) {
  var q = defaults(); cases[name](q);
  var r;
  try { r = calc(q); } catch (e) { ok(name, false, "исключение: " + e.message); return; }
  var bad = finiteAll(r);
  ok(name, bad.length === 0, bad.length ? "не число: " + bad.join(", ") : "");
});

var loss = defaults();
loss.fixed.forEach(function (f) { if (f.id === "rent") f.v = 100000; });
var Rl = calc(loss);
ok("при убытке налог на прибыль = 0", Rl.incomeTax === 0);
ok("при убытке окупаемость = null (не Infinity)", Rl.payback === null);
/* food cost клампится на 95 %, поэтому при вводе 100 % маржинальность остаётся
   чуть выше нуля — но точка безубыточности улетает за пределы посадки. */
var Rfc = calc((function () { var q = defaults(); q.menu.forEach(function (m) { m.fc = 100; }); return q; })());
ok("при food cost 100 % безубыточность недостижима",
   Rfc.bepCash.status === "ok" && Rfc.bepCash.feasible === false,
   "нужно " + n(Rfc.bepCash.occRequired * 100) + "% загрузки");
/* А вот когда списания добивают себестоимость выше 100 % — точки нет вовсе. */
ok("при себестоимости выше выручки точки безубыточности нет",
   calc((function () {
     var q = defaults(); q.waste = 20; q.menu.forEach(function (m) { m.fc = 95 }); return q;
   })()).bepCash.status === "impossible");
/* Ту же цену пишем через запятую — средний чек обязан не дрогнуть. Значение
   берём из самих дефолтов, чтобы проверка пережила их следующую правку. */
ok("запятая распознаётся как разделитель",
   near(calc((function () {
     var q = defaults();
     q.menu[0].spend = q.menu[0].spend.toFixed(2).replace(".", ",");
     return q;
   })()).avgCheck, R.avgCheck));

/* ---------------------------------------------------- 5. сценарии + торнадо */
console.log("\n5. Сценарии и чувствительность");
var S = runScenarios(P);
console.log("   пессимистичный " + n(S.pes.netProfit) + " | базовый " + n(S.base.netProfit) +
            " | оптимистичный " + n(S.opt.netProfit));
ok("монотонность чистой прибыли",
   S.pes.netProfit < S.base.netProfit && S.base.netProfit < S.opt.netProfit);
ok("базовый сценарий совпадает с прямым расчётом", near(S.base.netProfit, R.netProfit));
/* На прежних дефолтах пессимистичный сценарий уходил в убыток; после правки
   параметров он остаётся в плюсе, поэтому проверяем не знак, а размер потери —
   guard окупаемости при убытке проверен в секции 4 на аренде 100 000. */
ok("пессимистичный сценарий съедает больше половины прибыли",
   S.pes.netProfit < S.base.netProfit * 0.5,
   n(S.pes.netProfit) + " € против " + n(S.base.netProfit) + " €, окупаемость " +
   (S.pes.payback === null ? "не окупается" : n(S.pes.payback, 1)));

var T = sensitivity(P);
console.log("   торнадо (по убыванию влияния на чистую прибыль):");
T.rows.forEach(function (row) {
  console.log("     " + row.name.padEnd(14) +
              row.points.map(function (pt) {
                return (pt.d > 0 ? "+" : "") + (pt.d * 100).toFixed(0) + "%: " +
                       (pt.delta >= 0 ? "+" : "") + n(pt.delta);
              }).join("   "));
});
ok("торнадо отсортирован по убыванию влияния",
   T.rows.every(function (r2, i) { return i === 0 || T.rows[i - 1].span >= r2.span; }));
ok("рост food cost снижает прибыль",
   T.rows.filter(function (r2) { return r2.id === "foodcost"; })[0].points[3].delta < 0);
ok("рост трафика повышает прибыль",
   T.rows.filter(function (r2) { return r2.id === "traffic"; })[0].points[3].delta > 0);
ok("сильнейший рычаг — чек или трафик", T.rows[0].id === "traffic" || T.rows[0].id === "check",
   "первый: " + T.rows[0].name);

/* --------------------------------------------- 6. сохранение и импорт ------ */
/* ui.js на верхнем уровне к DOM не обращается, поэтому грузится в Node как есть
   и логику диффа с миграцией можно проверить без браузера. */
console.log("\n6. Сохранение, миграция, импорт");
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "js/ui.js"), "utf8"));

/* applyParams пишет в глобальную P из ui.js, а в этом файле своя локальная P —
   поэтому обращаемся к глобальной явно, иначе тест проверял бы дефолты. */
function importInto(src) {
  global.P = defaults();
  applyParams(src);
  return global.P;
}

var edited = defaults();
edited.cur = "$";
edited.menu.splice(2, 1);                                   /* удалили категорию */
edited.menu[0].spend = 3.5;
edited.fixed.forEach(function (f) { if (f.id === "rent") f.v = 5000; });
edited.staff.push({ id: "st_new", name: "Кондитер", n: 1, pay: "month", amt: 1600, hrs: 8, shifts: 21.7 });
edited.occWd = edited.occWd.map(function (o) { return o + 3; });

var diff = diffFromDefaults(edited);
ok("дифф содержит только изменённые ключи",
   Object.keys(diff).sort().join(",") === "cur,fixed,menu,occWd,schemaVersion,staff",
   Object.keys(diff).sort().join(","));
ok("неизменённые блоки в дифф не попали", !("capex" in diff) && !("scen" in diff) && !("days" in diff));

var back = importInto(diff);
ok("импорт восстанавливает состояние один в один",
   JSON.stringify(back) === JSON.stringify(edited));
ok("удалённая строка меню не воскресает", back.menu.length === 2,
   back.menu.map(function (m) { return m.name; }).join(", "));
ok("добавленная роль сохранилась", back.staff.length === 5 && back.staff[4].name === "Кондитер");
ok("расчёт по восстановленным параметрам совпадает",
   near(calc(back).netProfit, calc(edited).netProfit));

/* Старая сохранёнка, в которой у строки CAPEX ещё нет поля years: недостающее
   должно прийти из defaults(), а не остаться undefined. */
var oldSave = { schemaVersion: SCHEMA_VERSION, capex: defaults().capex.map(function (c) {
  return { id: c.id, name: c.name, v: c.v, dep: c.dep };
}) };
var mig = importInto(oldSave);
ok("недостающее поле схемы берётся из дефолтов",
   mig.capex.every(function (c) { return typeof c.years === "number" && c.years >= 0; }));
ok("амортизация после миграции считается", near(calc(mig).da, calc(defaults()).da),
   n(calc(mig).da, 2) + " vs " + n(calc(defaults()).da, 2));

/* Строка, которой в дефолтах нет вовсе, не должна ломать миграцию. */
var alien = importInto({ fixed: [{ id: "totally_new", name: "Охрана", v: 300 }] });
ok("незнакомая строка списка переживает миграцию",
   alien.fixed.length === 1 && alien.fixed[0].name === "Охрана" && calc(alien).fixed === 300);

/* Ключ, которого в схеме больше нет, игнорируется молча. */
var obsolete = importInto({ obsoleteKey: 42, seats: 55 });
ok("выброшенный ключ игнорируется", !("obsoleteKey" in obsolete) && obsolete.seats === 55);

/* Сценарии — вложенный объект, а не список: правится точечно. */
var scen = importInto({ scen: { opt: { traffic: 1.5 } } });
ok("частичная правка сценария не теряет остальные множители",
   scen.scen.opt.traffic === 1.5 && scen.scen.opt.check === 1.05 &&
   scen.scen.pes.traffic === 0.75,
   "opt: " + JSON.stringify(scen.scen.opt));

/* ------------------------------------------- 7. регрессии по итогам ревью -- */
console.log("\n7. Регрессии по итогам ревью");
function withOpt(fn) { var q = defaults(); fn(q); return q; }
function hasWarn(r, key) { return r.warns.some(function (w) { return w.k === key; }); }
function sumArr(a) { return a.reduce(function (s, x) { return s + x; }, 0); }

/* 7.1 Цены меню без НДС у плательщика НДС: гость платит цену × (1 + НДС), и всё,
   что считается от брутто, обязано это видеть. Раньше «брутто» здесь равнялось нетто. */
var Pex = withOpt(function (q) { q.priceInclVat = false; });
var Rex = calc(Pex);
ok("цены без НДС: брутто = нетто × (1 + НДС)", near(Rex.revGross, Rex.revNet * 1.10, 0.01),
   n(Rex.revGross) + " vs " + n(Rex.revNet * 1.1));
ok("цены без НДС: нетто равно выручке в ценах меню", near(Rex.revNet, R.revNet * 1.10, 0.01));
ok("цены без НДС: эквайринг — та же доля от брутто, что и при ценах с НДС",
   near(Rex.acquiringFee / Rex.revGross, R.acquiringFee / R.revGross, 1e-9));
ok("цены без НДС: комиссия агрегатора берётся от брутто заказа",
   near(Rex.aggFee, Rex.revDlG * 0.28, 0.01));
ok("цены без НДС: средний чек гостя = цена меню × (1 + НДС), нетто = цена меню",
   near(Rex.avgCheckGross, R.avgCheck * 1.10, 0.001) && near(Rex.avgCheckNet, R.avgCheck, 0.001),
   n(Rex.avgCheckGross, 2) + " / " + n(Rex.avgCheckNet, 2));
var Ptg = withOpt(function (q) { q.priceInclVat = false; q.taxRegime = "both"; q.turnoverTax = 5; });
var Ptn = clone(Ptg); Ptn.turnoverBase = "net";
ok("цены без НДС: налог с оборота по базе «с НДС» больше, чем по базе «без», ровно на НДС",
   near(calc(Ptg).turnoverTax, calc(Ptn).turnoverTax * 1.10, 0.01),
   n(calc(Ptg).turnoverTax) + " vs " + n(calc(Ptn).turnoverTax));
var kex = Rex.bepCash.guestsMonth / Rex.guestsMonth;
var Pexb = clone(Pex);
Pexb.occWd = Pexb.occWd.map(function (o) { return o * kex; });
Pexb.occWe = Pexb.occWe.map(function (o) { return o * kex; });
ok("цены без НДС: обратная проверка BEP даёт EBITDA = 0", near(calc(Pexb).ebitda, 0, 0.5),
   "EBITDA = " + n(calc(Pexb).ebitda, 3));
var Rnv = calc(withOpt(function (q) { q.vatReg = false; }));
ok("не плательщик НДС: брутто = нетто = цены меню",
   near(Rnv.revGross, Rnv.revNet) && near(Rnv.revNet, R.revGross) && Rnv.vatPayable === 0);

/* 7.2 Ряды гостей по часам — из calc(), и они сходятся с итогами дня в каждом сценарии. */
ok("сумма ряда по часам = гостей за будний день", near(sumArr(R.hoursWd), R.guestsWdDay, 1e-6));
ok("ряд по часам в пессимистичном сценарии масштабирован вместе с легендой",
   near(sumArr(S.pes.hoursWd), S.pes.guestsWdDay, 1e-6) &&
   near(S.pes.guestsWdDay, R.guestsWdDay * 0.75, 0.01),
   n(sumArr(S.pes.hoursWd), 1) + " vs " + n(S.pes.guestsWdDay, 1));

/* 7.3 Ёмкость зала считается с тем же буфером последнего часа, что и гости. */
var Rbuf = calc(withOpt(function (q) { q.lastOrderBuffer = 60; }));
ok("буфер 60 мин: ёмкость без последнего часа",
   near(Rbuf.capacityMonth, Rbuf.capHour * ((Rbuf.Hwd - 1) * Rbuf.Dwd + (Rbuf.Hwe - 1) * Rbuf.Dwe), 0.01));
ok("буфер 60 мин: загрузка при 100 % на ползунках ровно 100 %",
   near(calc(withOpt(function (q) {
     q.lastOrderBuffer = 60;
     q.occWd = q.occWd.map(function () { return 100; });
     q.occWe = q.occWe.map(function () { return 100; });
   })).occAvg, 1, 1e-9));

/* 7.4 KPI: выручка на место — только зал; food cost — без упаковки. */
ok("выручка на место считается по залу", near(R.kpi.revPerSeat, R.revDineG / R.Dall / R.seats, 1e-9),
   n(R.kpi.revPerSeat, 1) + " €/место/день");
ok("food cost без упаковки меньше полной себестоимости в долях выручки",
   R.packaging > 0 && R.kpi.foodCost < R.cogs / R.revNet * 100 && near(R.cogsFood + R.packaging, R.cogs),
   n(R.kpi.foodCost, 1) + "% vs " + n(R.cogs / R.revNet * 100, 1) + "%");

/* 7.5 Амортизация при сроке 0 — не за год, а пропуск с предупреждением. */
var Rd0 = calc(withOpt(function (q) { q.capex.forEach(function (c) { if (c.id === "reserve") c.dep = true; }); }));
ok("dep=true при years=0 не меняет DA и даёт предупреждение",
   near(Rd0.da, R.da) && hasWarn(Rd0, "cf.warn.depYears"), n(Rd0.da, 2) + " vs " + n(R.da, 2));

/* 7.6 Аренда и коммуналка — по id: без строки честный null, а не «0 % ok». */
var Rnr = calc(withOpt(function (q) { q.fixed = q.fixed.filter(function (r) { return r.id !== "rent"; }); }));
ok("без строки rent: KPI аренды и «аренда+коммуналка» = null, смета посчитана",
   Rnr.rent === null && Rnr.kpi.rent === null && Rnr.kpi.occupancy === null &&
   near(Rnr.fixed, R.fixed - 2010));
ok("с дефолтной сметой KPI «аренда + коммуналка» считается",
   near(R.kpi.occupancy, (R.rent + R.utilities) / R.revNet * 100, 1e-9), n(R.kpi.occupancy, 1) + "%");

/* 7.7 Режим налога: неизвестное значение = «на прибыль», а не оба налога сразу. */
var Rtx = calc(withOpt(function (q) { q.taxRegime = "xyz"; q.turnoverTax = 5; }));
ok("taxRegime «xyz» считается как «на прибыль»", Rtx.turnoverTax === 0 && near(Rtx.netProfit, R.netProfit));

/* 7.8 Множители сценариев: пустое поле — «как есть», ноль — ноль; база всегда без множителей. */
ok("mult(): пусто → 1, 0 → 0, «0,75» → 0.75, мусор → 1",
   mult("") === 1 && mult(null) === 1 && mult(0) === 0 && mult("0,75") === 0.75 && mult("abc") === 1);
ok("множитель трафика 0 обнуляет выручку сценария",
   runScenarios(withOpt(function (q) { q.scen.pes.traffic = 0; })).pes.revNet === 0);
ok("пустые множители сценария = базовый расчёт",
   near(runScenarios(withOpt(function (q) { q.scen.pes = { traffic: "", check: "", fixed: "" }; })).pes.netProfit,
        R.netProfit));
ok("базовый сценарий не зависит от множителей строки base",
   near(runScenarios(withOpt(function (q) { q.scen.base.traffic = 1.2; })).base.netProfit, R.netProfit));

/* 7.9 Чувствительность: 24 точки + база = 25 прогонов, и рычаг food cost трогает свой fc каналов. */
var calls = 0, origCalc = calc;
global.calc = function (q) { calls++; return origCalc(q); };
sensitivity(P);
global.calc = origCalc;
ok("sensitivity() = 25 прогонов calc()", calls === 25, calls + " вызовов");
var Pfc = withOpt(function (q) { q.taFc = 30; q.dlFc = ""; });
LEVERS.filter(function (l) { return l.id === "foodcost"; })[0].patch(Pfc, 0.2);
ok("рычаг food cost масштабирует заданный taFc и не трогает пустой dlFc",
   near(Pfc.taFc, 36, 1e-9) && Pfc.dlFc === "");

/* 7.10 Импорт: нормализация режима налога и строки base. */
ok("импорт: неизвестный режим налога приводится к «на прибыль»",
   importInto({ taxRegime: "xyz" }).taxRegime === "profit");
ok("импорт: множители base приводятся к единице",
   importInto({ scen: { base: { traffic: 1.2, check: 0.9 } } }).scen.base.traffic === 1);

/* 7.11 При нулевом чеке одно предупреждение, а не два. */
var Rz = calc(withOpt(function (q) { q.menu.forEach(function (m) { m.spend = 0; }); }));
ok("нулевой чек: предупреждение про чек без «BEP недостижима»",
   hasWarn(Rz, "cf.warn.zeroCheck") && !hasWarn(Rz, "cf.warn.bepUnreachable"));

/* 7.12 Разовый подбор персонала — расход запуска, а не актив: в инвестициях он
   есть, в амортизации его быть не должно. Поставленная здесь галочка «аморти-
   зировать» растянула бы интервью на годы и занизила бы окупаемость. */
var Rhr = calc(withOpt(function (q) {
  q.capex = q.capex.filter(function (c) { return c.id !== "hire"; });
}));
ok("подбор персонала входит в инвестиции, но не в амортизацию",
   near(Rhr.investment, R.investment - 2500) && near(Rhr.da, R.da),
   n(R.investment) + " → " + n(Rhr.investment) + ", DA " + n(R.da, 2) + " без изменений");

/* 7.13 Дополнительные выплаты поднимают только окладные строки: в почасовой
   ставке они, как правило, уже разнесены, и второе начисление было бы двойным
   счётом. Часы смен от числа выплат не зависят вовсе. */
var R12 = calc(withOpt(function (q) { q.pagas = 12; }));
var salaried = defaults().staff.reduce(function (s, r) {
  return s + (r.pay === "month" ? r.n * r.amt : 0);
}, 0);
ok("14 выплат добавляют к окладам ровно две, почасовые не трогают",
   near(R.payrollGross - R12.payrollGross, salaried * 2 / 12) && near(R.staffHours, R12.staffHours),
   "+" + n(R.payrollGross - R12.payrollGross) + " € в месяц");
ok("без параметра pagas считается по двенадцати выплатам",
   near(calc(withOpt(function (q) { delete q.pagas; })).payrollGross, R12.payrollGross),
   n(R12.payrollGross) + " €");

/* ------------------------------------------------------------------- итог -- */
console.log("\n" + (fails ? "✗ провалено " + fails + " из " + checks
                          : "✓ все " + checks + " проверок пройдены") + "\n");
process.exit(fails ? 1 : 0);
