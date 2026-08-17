/* Автопроверка расчётного движка. Запуск:  node verify.js
   Прогоняет пункты 1–5 раздела «Верификация» из плана. */
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
ok("запятая распознаётся как разделитель",
   near(calc((function () { var q = defaults(); q.menu[0].spend = "2,80"; return q; })()).avgCheck,
        R.avgCheck));

/* ---------------------------------------------------- 5. сценарии + торнадо */
console.log("\n5. Сценарии и чувствительность");
var S = runScenarios(P);
console.log("   пессимистичный " + n(S.pes.netProfit) + " | базовый " + n(S.base.netProfit) +
            " | оптимистичный " + n(S.opt.netProfit));
ok("монотонность чистой прибыли",
   S.pes.netProfit < S.base.netProfit && S.base.netProfit < S.opt.netProfit);
ok("базовый сценарий совпадает с прямым расчётом", near(S.base.netProfit, R.netProfit));
ok("пессимистичный уходит в убыток (проверка guard'а окупаемости)", S.pes.netProfit < 0,
   n(S.pes.netProfit) + " €, окупаемость " + (S.pes.payback === null ? "не окупается" : n(S.pes.payback, 1)));

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
ok("трафик — сильнейший рычаг", T.rows[0].id === "traffic" || T.rows[0].id === "check",
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
edited.menu.splice(3, 1);                                   /* удалили категорию */
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
ok("удалённая строка меню не воскресает", back.menu.length === 3,
   back.menu.map(function (m) { return m.name; }).join(", "));
ok("добавленная роль сохранилась", back.staff.length === 7 && back.staff[6].name === "Кондитер");
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

/* ------------------------------------------------------------------- итог -- */
console.log("\n" + (fails ? "✗ провалено " + fails + " из " + checks
                          : "✓ все " + checks + " проверок пройдены") + "\n");
process.exit(fails ? 1 : 0);
