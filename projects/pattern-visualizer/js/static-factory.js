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
                    tooltip: 'Static factory class with named creation methods — inspects input type and delegates to the appropriate subclass constructor'
                }) +
                PV.renderClass('cls-sf-cache', 'Cache', {
                    stereotype: 'internal',
                    fields: ['entries: Map'],
                    methods: ['+get(key)', '+put(key, val)', '+has(key): boolean'],
                    tooltip: 'Internal cache storing previously created Integer instances keyed by their int value'
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="margin-top: 60px; gap: 60px;">' +
                PV.renderClass('cls-sf-integer', 'Integer', {
                    fields: ['value: int'],
                    methods: ['+intValue(): int'],
                    tooltip: 'Concrete product for whole number values — instances may be cached for small values'
                }) +
                PV.renderClass('cls-sf-float', 'Float', {
                    fields: ['value: float'],
                    methods: ['+floatValue(): float'],
                    tooltip: 'Concrete product for floating-point values — never cached, always a new instance'
                }) +
                PV.renderClass('cls-sf-bigdecimal', 'BigDecimal', {
                    fields: ['value: string', 'scale: int'],
                    methods: ['+precision(): int'],
                    tooltip: 'Concrete product for arbitrary-precision decimal values'
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="margin-top: 30px;">' +
                PV.renderObject('obj-sf-int1', ':Integer(42)', { tooltip: 'First Integer(42) instance — created and cached' }) +
                PV.renderObject('obj-sf-int2', ':Integer(42) [cached]', { tooltip: 'Second request for 42 — same cached instance returned' }) +
                PV.renderObject('obj-sf-float1', ':Float(3.14)', { tooltip: 'Float instance — created fresh, not cached' }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Static method call</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> Creates new</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Returns (cached)</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> Inherit</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> Compose</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
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
            { elementId: 'cls-sf-factory', label: 'Number.of(42)', description: 'Client calls Number.of(42)', logType: 'REQUEST', badgePosition: 'top-left' },
            { elementId: 'cls-sf-factory', label: 'Type detection', description: 'int detected — delegate to valueOf(42)', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-sf-cache', label: 'Cache lookup', description: 'Cache miss for key 42', logType: 'CACHE', arrowFromOffset: { x: 0, y: 0.3 }, arrowToOffset: { x: 0, y: 0.3 } },
            { elementId: 'cls-sf-integer', label: 'Create Integer', description: 'new Integer(42) — instantiate concrete product', logType: 'CREATE', spawnId: 'obj-sf-int1', spawnLabel: 'Integer(42)' },
            { elementId: 'cls-sf-cache', label: 'Cache store', description: 'Cached: 42 -> Integer(42)', logType: 'CACHE', arrowFromId: 'cls-sf-integer' },
            { elementId: 'cls-sf-factory', label: 'Return', description: 'Return Integer(42) as Number to client', logType: 'RESPONSE', arrowFromId: 'cls-sf-cache', arrowFromOffset: { x: 0, y: 0.3 }, arrowToOffset: { x: 0, y: 0.3 } },
            { elementId: 'cls-sf-factory', label: 'Number.of(42)', description: 'Client calls Number.of(42) again', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-sf-cache', label: 'Cache lookup', description: 'Cache HIT for key 42', logType: 'CACHE', arrowFromOffset: { x: 0, y: -0.3 }, arrowToOffset: { x: 0, y: -0.3 } },
            { elementId: 'cls-sf-factory', label: 'Return cached', description: 'Return cached Integer(42) — same instance, no allocation', logType: 'RESPONSE', spawnId: 'obj-sf-int2', spawnLabel: 'Integer(42) [cached]', arrowFromId: 'cls-sf-cache', arrowFromOffset: { x: 0, y: -0.3 }, arrowToOffset: { x: 0, y: -0.3 } },
            { elementId: 'cls-sf-factory', label: 'Number.of(3.14)', description: 'Client calls Number.of(3.14)', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'cls-sf-factory', label: 'Type detection', description: 'float detected — no caching for floats', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'top-right' },
            { elementId: 'cls-sf-float', label: 'Create Float', description: 'new Float(3.14) — instantiate concrete product', logType: 'CREATE', spawnId: 'obj-sf-float1', spawnLabel: 'Float(3.14)' },
            { elementId: 'cls-sf-factory', label: 'Return', description: 'Return Float(3.14) as Number to client', logType: 'RESPONSE', arrowFromId: 'cls-sf-float' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Client: Number.of(value) — static factory with caching' }; },
    run: function() {
        PV.animateFlow(PV['static-factory'].number.steps(), PV['static-factory'].number.stepOptions());
    }
};
