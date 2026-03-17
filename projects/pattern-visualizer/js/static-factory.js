/* ===== Static Factory Pattern ===== */

PV['static-factory'] = {};

PV['static-factory'].modes = [
    { id: 'number', label: 'Number', desc: 'Number.of(value) inspects the input and returns an Integer, Float, or BigDecimal. Small integers are cached internally, so repeated calls for the same value return the same instance — a flyweight-like optimization that avoids redundant allocations.' }
];

PV['static-factory'].depRules = [
    { name: 'Static Factory', role: 'Provides named static methods to create instances, improving readability over constructors' },
    { name: 'Product', role: 'Objects created and optionally cached by the static factory methods' },
    { name: 'Cache', role: 'Internal storage enabling instance reuse for equivalent inputs' }
];

/* ---------- Shared render functions ---------- */

function renderStaticFactoryNumber() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            '<div class="pv-hierarchy-row" style="gap: 200px;">' +
                PV.renderClass('cls-sf-factory', 'Number', {
                    stereotype: 'static factory',
                    fields: ['-cache: Map<int, Integer>'],
                    methods: ['+of(value): Number', '+valueOf(int): Integer', '+zero(): Number'],
                    tooltip: I18N.t('static-factory.tooltip.number', null, 'Static factory class with named creation methods — inspects input type and delegates to the appropriate subclass constructor')
                }) +
                PV.renderClass('cls-sf-cache', 'Cache', {
                    stereotype: 'internal',
                    fields: ['entries: Map'],
                    methods: ['+get(key)', '+put(key, val)', '+has(key): boolean'],
                    tooltip: I18N.t('static-factory.tooltip.cache', null, 'Internal cache storing previously created Integer instances keyed by their int value')
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="margin-top: 60px; gap: 60px;">' +
                PV.renderClass('cls-sf-integer', 'Integer', {
                    fields: ['value: int'],
                    methods: ['+intValue(): int'],
                    tooltip: I18N.t('static-factory.tooltip.integer', null, 'Concrete product for whole number values — instances may be cached for small values')
                }) +
                PV.renderClass('cls-sf-float', 'Float', {
                    fields: ['value: float'],
                    methods: ['+floatValue(): float'],
                    tooltip: I18N.t('static-factory.tooltip.float', null, 'Concrete product for floating-point values — never cached, always a new instance')
                }) +
                PV.renderClass('cls-sf-bigdecimal', 'BigDecimal', {
                    fields: ['value: string', 'scale: int'],
                    methods: ['+precision(): int'],
                    tooltip: I18N.t('static-factory.tooltip.bigdecimal', null, 'Concrete product for arbitrary-precision decimal values')
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="margin-top: 30px;">' +
                PV.renderObject('obj-sf-int1', ':Integer(42)', { tooltip: I18N.t('static-factory.tooltip.obj-int1', null, 'First Integer(42) instance — created and cached') }) +
                PV.renderObject('obj-sf-int2', ':Integer(42) [cached]', { tooltip: I18N.t('static-factory.tooltip.obj-int2', null, 'Second request for 42 — same cached instance returned') }) +
                PV.renderObject('obj-sf-float1', ':Float(3.14)', { tooltip: I18N.t('static-factory.tooltip.obj-float1', null, 'Float instance — created fresh, not cached') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.static_call', null, 'Static method call') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.creates_new', null, 'Creates new') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.returns_cached', null, 'Returns (cached)') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-sf-integer', 'cls-sf-factory', 'inherit');
        PV.renderRelation('cls-sf-float', 'cls-sf-factory', 'inherit');
        PV.renderRelation('cls-sf-bigdecimal', 'cls-sf-factory', 'inherit');
        PV.renderRelation('cls-sf-factory', 'cls-sf-cache', 'compose');
    }, 50);
}

/* ---------- Details ---------- */

PV['static-factory'].details = {
    number: {
        principles: [
            'Named constructors: Number.of(value) is more expressive than new Number(value) — the method name communicates intent',
            'Caching and flyweight: small integers are cached internally, so of(42) called twice returns the same instance',
            'Subtype selection: the factory inspects the input and returns Integer, Float, or BigDecimal without the caller knowing',
            'Encapsulation of creation logic: the decision of which subclass to instantiate is hidden behind the static method',
            'No public constructors: clients cannot bypass the factory, ensuring all instances go through the controlled creation path'
        ],
        concepts: [
            { term: 'Static Factory Method', definition: 'A static method on a class that returns an instance of that class (or a subclass). Unlike constructors, static factory methods have names, can return cached instances, and can return subtypes.' },
            { term: 'Flyweight Caching', definition: 'Small integer values are cached in an internal Map. When of(42) is called again, the cached Integer(42) is returned instead of creating a new object — similar to the Flyweight pattern.' },
            { term: 'Type Inference', definition: 'The factory inspects the runtime value to determine the concrete type: int values become Integer, floating-point become Float, and very large or precise values become BigDecimal.' },
            { term: 'valueOf() Convention', definition: 'A common naming convention (from Java) where valueOf() converts a primitive to its wrapper type. Number.of() delegates to valueOf() for integer inputs.' }
        ],
        tradeoffs: {
            pros: [
                'Descriptive naming: Number.of(42) and Number.zero() are self-documenting, unlike new Number(42)',
                'Instance caching: frequently used values are shared, reducing memory allocation and GC pressure',
                'Can return subtypes: of() returns Integer, Float, or BigDecimal — constructors cannot do this',
                'Encapsulates creation logic: adding a new numeric type requires no client-side changes'
            ],
            cons: [
                'Not discoverable via new keyword: developers must know the static method names exist',
                'Cannot subclass a class that only provides static factory methods (no public constructor to call via super)',
                'Cache management adds complexity: cache invalidation, memory leaks, and thread safety must be considered',
                'Harder to identify in documentation: static methods blend in with other utility methods'
            ],
            whenToUse: 'Ideal for value types where instance caching benefits performance (small integers, enum-like values), when the return type should vary based on input, or when named construction methods improve API readability.'
        }
    }
};

/* ---------- Mode: number ---------- */

PV['static-factory'].number = {
    init: function() {
        renderStaticFactoryNumber();
    },
    steps: function() {
        return [
            { elementId: 'cls-sf-factory', label: 'Number.of(42)', description: 'Client calls Number.of(42)', descriptionKey: 'static-factory.step.number.0', logType: 'REQUEST', badgePosition: 'top-left' },
            { elementId: 'cls-sf-factory', label: 'Type detection', description: 'int detected — delegate to valueOf(42)', descriptionKey: 'static-factory.step.number.1', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-sf-cache', label: 'Cache lookup', description: 'Cache miss for key 42', descriptionKey: 'static-factory.step.number.2', logType: 'CACHE', arrowFromOffset: { x: 0, y: 0.5 }, arrowToOffset: { x: 0, y: 0.5 } },
            { elementId: 'cls-sf-integer', label: 'Create Integer', description: 'new Integer(42) — instantiate concrete product', descriptionKey: 'static-factory.step.number.3', logType: 'CREATE', spawnId: 'obj-sf-int1', spawnLabel: 'Integer(42)' },
            { elementId: 'cls-sf-cache', label: 'Cache store', description: 'Cached: 42 -> Integer(42)', descriptionKey: 'static-factory.step.number.4', logType: 'CACHE', arrowFromId: 'cls-sf-factory' },
            { elementId: 'cls-sf-factory', label: 'Return', description: 'Return Integer(42) as Number to client', descriptionKey: 'static-factory.step.number.5', logType: 'RESPONSE', arrowFromId: 'cls-sf-cache', arrowFromOffset: { x: 0, y: -0.55 }, arrowToOffset: { x: 0, y: -0.55 } },
            { elementId: 'cls-sf-factory', label: 'Number.of(42)', description: 'Client calls Number.of(42) again', descriptionKey: 'static-factory.step.number.6', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-sf-cache', label: 'Cache lookup', description: 'Cache HIT for key 42', descriptionKey: 'static-factory.step.number.7', logType: 'CACHE', arrowFromOffset: { x: 0, y: -0.4 }, arrowToOffset: { x: 0, y: -0.4 } },
            { elementId: 'cls-sf-factory', label: 'Return cached', description: 'Return cached Integer(42) — same instance, no allocation', descriptionKey: 'static-factory.step.number.8', logType: 'RESPONSE', spawnId: 'obj-sf-int2', spawnLabel: 'Integer(42) [cached]', arrowFromId: 'cls-sf-cache', arrowFromOffset: { x: 0, y: -0.9 }, arrowToOffset: { x: 0, y: -0.9 } },
            { elementId: 'cls-sf-factory', label: 'Number.of(3.14)', description: 'Client calls Number.of(3.14)', descriptionKey: 'static-factory.step.number.9', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'cls-sf-factory', label: 'Type detection', description: 'float detected — no caching for floats', descriptionKey: 'static-factory.step.number.10', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'top-right' },
            { elementId: 'cls-sf-float', label: 'Create Float', description: 'new Float(3.14) — instantiate concrete product', descriptionKey: 'static-factory.step.number.11', logType: 'CREATE', spawnId: 'obj-sf-float1', spawnLabel: 'Float(3.14)' },
            { elementId: 'cls-sf-factory', label: 'Return', description: 'Return Float(3.14) as Number to client', descriptionKey: 'static-factory.step.number.12', logType: 'RESPONSE', noArrowFromPrev: true, badgePosition: 'bottom' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('static-factory.stepLabel.number', null, 'Create numbers via static methods with caching') }; },
    run: function() {
        PV.animateFlow(PV['static-factory'].number.steps(), PV['static-factory'].number.stepOptions());
    }
};

PV['static-factory'].codeExamples = {
    number: {
        php: `<?php
declare(strict_types=1);

abstract class Number
{
    private static array $cache = [];

    public static function of(mixed $value): static
    {
        return match (true) {
            is_int($value)   => self::valueOf($value),
            is_float($value) => new Float($value),
            default          => new BigDecimal((string) $value),
        };
    }

    public static function valueOf(int $value): Integer
    {
        return self::$cache[$value] ??= new Integer($value);
    }

    public static function zero(): static
    {
        return self::valueOf(0);
    }
}

readonly class Integer extends Number
{
    public function __construct(public int $value) {}
    public function intValue(): int { return $this->value; }
}

readonly class Float extends Number
{
    public function __construct(public float $value) {}
    public function floatValue(): float { return $this->value; }
}

readonly class BigDecimal extends Number
{
    public function __construct(
        public string $value,
        public int $scale = 0,
    ) {}
    public function precision(): int { return strlen($this->value); }
}

// Client
$a = Number::of(42);        // Integer (created & cached)
$b = Number::of(42);        // Integer (same cached instance)
$c = Number::of(3.14);      // Float (new instance)
var_dump($a === $b);         // true`,

        go: `package main

import "fmt"

type Number interface {
	String() string
}

type Integer struct{ Value int }

func (i Integer) String() string { return fmt.Sprintf("Integer(%d)", i.Value) }

type Float struct{ Value float64 }

func (f Float) String() string { return fmt.Sprintf("Float(%g)", f.Value) }

type BigDecimal struct {
	Value string
	Scale int
}

func (b BigDecimal) String() string { return fmt.Sprintf("BigDecimal(%s)", b.Value) }

var cache = map[int]*Integer{}

func Of(value any) Number {
	switch v := value.(type) {
	case int:
		return ValueOf(v)
	case float64:
		return Float{Value: v}
	case string:
		return BigDecimal{Value: v}
	default:
		panic("unsupported type")
	}
}

func ValueOf(v int) *Integer {
	if cached, ok := cache[v]; ok {
		return cached
	}
	n := &Integer{Value: v}
	cache[v] = n
	return n
}

func Zero() Number { return ValueOf(0) }

func main() {
	a := Of(42)
	b := Of(42)
	c := Of(3.14)
	fmt.Println(a, b, c)
	fmt.Println(a == b) // true — same cached pointer
}`,

        python: `from abc import ABC
from dataclasses import dataclass
from typing import Self


class Number(ABC):
    _cache: dict[int, "Integer"] = {}

    @staticmethod
    def of(value: int | float | str) -> Self:
        if isinstance(value, int):
            return Number.value_of(value)
        if isinstance(value, float):
            return Float(value)
        return BigDecimal(str(value))

    @staticmethod
    def value_of(value: int) -> "Integer":
        if value not in Number._cache:
            Number._cache[value] = Integer(value)
        return Number._cache[value]

    @staticmethod
    def zero() -> Self:
        return Number.value_of(0)


@dataclass(slots=True, frozen=True)
class Integer(Number):
    value: int

    def int_value(self) -> int:
        return self.value


@dataclass(slots=True, frozen=True)
class Float(Number):
    value: float

    def float_value(self) -> float:
        return self.value


@dataclass(slots=True, frozen=True)
class BigDecimal(Number):
    value: str
    scale: int = 0

    def precision(self) -> int:
        return len(self.value)


# Client
a = Number.of(42)       # Integer (created & cached)
b = Number.of(42)       # Integer (same cached instance)
c = Number.of(3.14)     # Float (new instance)
print(a is b)           # True`,

        rust: `use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::fmt;

enum Number {
    Int(i64),
    Float(f64),
    Big(String),
}

impl fmt::Display for Number {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Int(v)   => write!(f, "Integer({v})"),
            Self::Float(v) => write!(f, "Float({v})"),
            Self::Big(v)   => write!(f, "BigDecimal({v})"),
        }
    }
}

static CACHE: LazyLock<Mutex<HashMap<i64, Number>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

impl Number {
    fn of_int(value: i64) -> &'static str {
        let mut cache = CACHE.lock().unwrap();
        if !cache.contains_key(&value) {
            cache.insert(value, Number::Int(value));
            "created"
        } else {
            "cached"
        }
    }

    fn of_float(value: f64) -> Self { Number::Float(value) }
    fn of_big(value: &str) -> Self { Number::Big(value.to_string()) }
    fn zero() -> &'static str { Self::of_int(0) }
}

fn main() {
    let status1 = Number::of_int(42);   // "created"
    let status2 = Number::of_int(42);   // "cached"
    let _float  = Number::of_float(3.14);
    println!("First call: {status1}, second call: {status2}");
}`
    }
}
