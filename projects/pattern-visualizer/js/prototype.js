/* ===== Prototype Pattern ===== */

PV['prototype'] = {};

PV['prototype'].modes = [
    { id: 'shapes', label: 'Shapes', desc: 'Clone geometric shapes (Circle, Rectangle, Triangle) without depending on their concrete classes. The client calls clone() on an existing shape object, and a deep copy spawns alongside the original — fully independent and ready to mutate.' }
];

PV['prototype'].depRules = [
    { name: 'Prototype (Interface)', role: 'Declares the clone() method' },
    { name: 'Concrete Prototype', role: 'Implements clone() creating a copy of itself' },
    { name: 'Client', role: 'Creates new objects by asking prototypes to clone themselves' }
];

/* ---------- Shared render functions ---------- */

function renderPrototypeShapes() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Prototype interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-p-shape', 'Shape', {
                    stereotype: 'interface',
                    methods: ['clone(): Shape', 'draw()'],
                    tooltip: 'Prototype interface declaring clone() — all concrete shapes implement this to produce copies of themselves'
                }) +
            '</div>' +
            PV.renderArrowConnector('implements') +
            /* Row 2: Concrete prototypes */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-p-circle', 'Circle', {
                    fields: ['radius', 'color'],
                    methods: ['clone(): Circle', 'draw()'],
                    tooltip: 'Concrete prototype that can clone itself, producing a deep copy with the same radius and color'
                }) +
                PV.renderClass('cls-p-rect', 'Rectangle', {
                    fields: ['width', 'height', 'color'],
                    methods: ['clone(): Rectangle', 'draw()'],
                    tooltip: 'Concrete prototype that clones itself with all dimension and color data'
                }) +
                PV.renderClass('cls-p-tri', 'Triangle', {
                    fields: ['base', 'height', 'color'],
                    methods: ['clone(): Triangle', 'draw()'],
                    tooltip: 'Concrete prototype that produces an independent copy via clone()'
                }) +
            '</div>' +
            PV.renderArrowConnector('clone()') +
            /* Row 3: Original and clone objects */
            '<div class="layout-pattern-flow">' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Originals</div>' +
                    PV.renderObject('obj-p-circle-orig', ':Circle (original)', { visible: true, tooltip: 'Original Circle prototype instance — the source for cloning' }) +
                    PV.renderObject('obj-p-rect-orig', ':Rectangle (original)', { visible: true, tooltip: 'Original Rectangle prototype instance' }) +
                '</div>' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Clones</div>' +
                    PV.renderObject('obj-p-circle-clone', ':Circle (clone)', { tooltip: 'Deep copy of Circle — independent from the original' }) +
                    PV.renderObject('obj-p-rect-clone', ':Rectangle (clone)', { tooltip: 'Deep copy of Rectangle — independent from the original' }) +
                '</div>' +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Flow</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> Create</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Response</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> Inherit</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-p-circle', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-rect', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-tri', 'cls-p-shape', 'inherit');
    }, 50);
}

/* ---------- Details ---------- */

PV['prototype'].details = {
    shapes: {
        principles: [
            'Clone objects without coupling to their concrete classes — the client only knows the Prototype interface',
            'Avoid costly initialization: cloning bypasses complex constructor logic and expensive resource setup',
            'Program to an interface (Shape.clone()), not an implementation (new Circle(...))',
            'Each prototype is self-contained: it knows how to copy itself, preserving encapsulation',
            'Open/Closed Principle: add new shape types without modifying client cloning code'
        ],
        concepts: [
            { term: 'Prototype Interface', definition: 'Declares clone() method that all concrete prototypes must implement. The client calls clone() without knowing the concrete type.' },
            { term: 'Deep Copy', definition: 'clone() produces a fully independent object — changing the clone does not affect the original, and vice versa.' },
            { term: 'Concrete Prototype', definition: 'A class (Circle, Rectangle, Triangle) that implements clone() by copying all its internal state into a new instance.' },
            { term: 'Prototype Registry', definition: 'An optional catalog of pre-built prototypes that clients can look up by key and clone on demand, avoiding direct class references.' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates the need for complex class hierarchies of factories',
                'Cloning complex objects is faster than creating them from scratch',
                'Client code is decoupled from concrete classes entirely',
                'Adding new prototypes requires no changes to existing code'
            ],
            cons: [
                'Deep copying complex objects with circular references can be tricky',
                'Each concrete prototype must implement its own clone() correctly',
                'Cloned objects share no identity — may need careful tracking',
                'Some languages make deep copy harder than others (e.g., shallow copy pitfalls)'
            ],
            whenToUse: 'Best when creating objects is expensive (complex initialization, database reads, network calls) and you have a set of pre-configured objects that can serve as templates for new instances.'
        }
    }
};

/* ---------- Mode: shapes ---------- */

PV['prototype'].shapes = {
    init: function() {
        renderPrototypeShapes();
    },
    steps: function() {
        return [
            { elementId: 'obj-p-circle-orig', label: 'Original Circle', description: 'Client has a reference to the original Circle object', logType: 'REQUEST' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() through the Prototype interface', logType: 'FLOW', arrowFromId: 'obj-p-circle-orig' },
            { elementId: 'cls-p-circle', label: 'Circle.clone()', description: 'Circle implements clone() — copies radius and color into new instance', logType: 'CLONE' },
            { elementId: 'obj-p-circle-clone', label: 'Circle clone spawns', description: 'Deep copy of Circle created — independent from original', logType: 'CREATE', spawnId: 'obj-p-circle-clone', spawnLabel: ':Circle (clone)' },
            { elementId: 'obj-p-circle-clone', label: 'Clone is independent', description: 'Modifying clone.color does not affect original', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-p-rect-orig', label: 'Original Rectangle', description: 'Client now needs a copy of Rectangle', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() on Rectangle through Prototype interface', logType: 'FLOW', arrowFromId: 'obj-p-rect-orig' },
            { elementId: 'cls-p-rect', label: 'Rectangle.clone()', description: 'Rectangle copies width, height, and color into new instance', logType: 'CLONE' },
            { elementId: 'obj-p-rect-clone', label: 'Rectangle clone spawns', description: 'Deep copy of Rectangle created — fully independent', logType: 'CREATE', spawnId: 'obj-p-rect-clone', spawnLabel: ':Rectangle (clone)' },
            { elementId: 'cls-p-shape', label: 'Prototype Pattern', description: 'Both clones exist independently — pattern complete', logType: 'RESPONSE', arrowFromId: 'obj-p-rect-clone' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Client: original.clone() — cloning shapes' }; },
    run: function() {
        PV.animateFlow(PV['prototype'].shapes.steps(), PV['prototype'].shapes.stepOptions());
    }
};
