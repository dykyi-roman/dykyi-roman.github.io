/* ===== Builder Pattern ===== */

PV['builder'] = {};

PV['builder'].modes = [
    { id: 'house', label: 'House', desc: 'Step-by-step house construction: foundation, walls, roof, interior — Director orchestrates the sequence.' }
];

PV['builder'].depRules = [
    { name: 'Director', role: 'Constructs an object using the Builder interface in a specific order' },
    { name: 'Builder (Interface)', role: 'Declares step-by-step construction methods' },
    { name: 'Concrete Builder', role: 'Implements construction steps and tracks the product being built' },
    { name: 'Product', role: 'The complex object being constructed step by step' }
];

/* ---------- Details per mode ---------- */

PV['builder'].details = {
    house: {
        principles: [
            'Separate the construction algorithm (Director) from the object representation (Builder)',
            'The Director defines the order of construction steps; the Builder knows how to perform each step',
            'Different builders produce different representations using the same construction process',
            'The Product is assembled incrementally — each step adds one component',
            'The client retrieves the finished product from the builder, not from the director'
        ],
        concepts: [
            { term: 'Director', definition: 'Orchestrates the construction sequence. Calls builder methods in a fixed order but is decoupled from concrete product details.' },
            { term: 'HouseBuilder', definition: 'Interface declaring construction steps: buildFoundation(), buildWalls(), buildRoof(), buildInterior(). Each concrete builder implements these.' },
            { term: 'WoodenHouseBuilder', definition: 'Concrete builder that constructs a wooden house with log foundation, timber walls, shingle roof, and rustic interior.' },
            { term: 'StoneHouseBuilder', definition: 'Concrete builder that constructs a stone house with concrete foundation, stone walls, tile roof, and modern interior.' },
            { term: 'House', definition: 'Product object whose properties are set one by one during construction. Retrieved via getResult() after all steps complete.' }
        ],
        tradeoffs: {
            pros: [
                'Same construction process creates different representations (wooden vs. stone house)',
                'Construction code is isolated from representation — easy to add new builder types',
                'Fine-grained control over the construction process step by step',
                'Product is always in a valid state once construction completes'
            ],
            cons: [
                'Overall complexity increases — requires Director, Builder interface, concrete builders, and Product',
                'Overkill for simple objects that can be constructed in a single step',
                'The number of classes grows with each new product variant'
            ],
            whenToUse: 'Use when construction involves multiple steps that must follow a specific order, when the same process should create different representations, or when you want to avoid a constructor with many parameters.'
        }
    }
};

/* =================================================================
   MODE: house
   ================================================================= */

function renderBuilderHouse() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Director (right-aligned) */
            '<div class="pv-hierarchy-row" style="justify-content: flex-end; width: 100%; padding-right: 100px;">' +
                PV.renderClass('cls-director', 'Director', {
                    methods: ['constructHouse(builder)'],
                    tooltip: 'Orchestrates the construction sequence by calling builder methods in order'
                }) +
            '</div>' +
            PV.renderArrowConnector('uses') +
            /* Row 2: HouseBuilder (right-aligned) */
            '<div class="pv-hierarchy-row" style="justify-content: flex-end; width: 100%; padding-right: 40px;">' +
                PV.renderClass('cls-house-builder', 'HouseBuilder', {
                    stereotype: 'interface',
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: 'Abstract builder interface declaring all construction steps'
                }) +
            '</div>' +
            /* Row 3: House (with checkmarks) + :House + Concrete Builders */
            '<div class="pv-hierarchy-row" style="gap: 20px; align-items: flex-start; width: 100%;">' +
                '<div style="position: relative; margin-right: 80px;">' +
                    '<div id="obj-b-house" class="pv-object" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 10px; padding: 8px 12px; font-size: 11px; white-space: nowrap;">:House</div>' +
                    '<div class="pv-class-box" id="cls-house" data-tooltip="Product assembled step by step — each property is set during construction">' +
                        '<div class="pv-class-header">House</div>' +
                        '<div class="pv-class-section">' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-foundation" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">foundation</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-walls" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">walls</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-roof" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">roof</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-interior" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">interior</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                PV.renderClass('cls-wooden-builder', 'WoodenHouseBuilder', {
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: 'Builds a wooden house with log foundation, timber walls, shingle roof'
                }) +
                PV.renderClass('cls-stone-builder', 'StoneHouseBuilder', {
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: 'Builds a stone house with concrete foundation, stone walls, tile roof'
                }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Flow</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> Create</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Return</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> Inherit</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> Uses</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-wooden-builder', 'cls-house-builder', 'inherit');
        PV.renderRelation('cls-stone-builder', 'cls-house-builder', 'inherit');
        PV.renderRelation('cls-director', 'cls-house-builder', 'depend');
        PV.renderRelation('cls-house', 'cls-wooden-builder', 'depend');
    }, 100);
}

PV['builder'].house = {
    init: function() {
        renderBuilderHouse();
    },
    stepOptions: function() { return { requestLabel: 'Director.constructHouse(WoodenHouseBuilder)' }; },
    steps: function() {
        return [
            {
                elementId: 'cls-director',
                label: 'Director.constructHouse()',
                description: 'Director begins construction by calling builder methods in order',
                logType: 'REQUEST',
                noArrowFromPrev: true,
                badgePosition: 'top'
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildFoundation()',
                description: 'Builder lays the foundation — log pilings for wooden house',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: -2.0,
                arrowToOffset: -2.0
            },
            {
                elementId: 'cls-house',
                label: 'foundation set',
                description: 'Product property "foundation" is now initialized',
                logType: 'PROPERTY',
                spawnId: 'prop-foundation',
                spawnLabel: 'foundation',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: -0.45 },
                arrowToOffset: { x: 0, y: -0.45 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildWalls()',
                description: 'Builder erects walls — timber frame with insulation',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: -0.7,
                arrowToOffset: -0.7
            },
            {
                elementId: 'cls-house',
                label: 'walls set',
                description: 'Product property "walls" is now initialized',
                logType: 'PROPERTY',
                spawnId: 'prop-walls',
                spawnLabel: 'walls',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: -0.15 },
                arrowToOffset: { x: 0, y: -0.15 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildRoof()',
                description: 'Builder installs roof — wooden shingles',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: 0.7,
                arrowToOffset: 0.7
            },
            {
                elementId: 'cls-house',
                label: 'roof set',
                description: 'Product property "roof" is now initialized',
                logType: 'PROPERTY',
                spawnId: 'prop-roof',
                spawnLabel: 'roof',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: 0.15 },
                arrowToOffset: { x: 0, y: 0.15 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildInterior()',
                description: 'Builder finishes interior — rustic wood paneling',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: 2.0,
                arrowToOffset: 2.0
            },
            {
                elementId: 'cls-house',
                label: 'interior set',
                description: 'Product property "interior" is now initialized',
                logType: 'PROPERTY',
                spawnId: 'prop-interior',
                spawnLabel: 'interior',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: 0.45 },
                arrowToOffset: { x: 0, y: 0.45 }
            },
            {
                elementId: 'cls-director',
                label: 'getResult()',
                description: 'Builder returns the fully constructed House to Director',
                logType: 'RESPONSE',
                arrowFromId: 'cls-wooden-builder'
            },
            {
                elementId: 'obj-b-house',
                label: ':House returned',
                description: 'Fully assembled House returned to the client',
                logType: 'RESPONSE',
                spawnId: 'obj-b-house',
                spawnLabel: ':House'
            }
        ];
    },
    run: function() {
        PV.animateFlow(PV['builder'].house.steps(), { requestLabel: 'Director.constructHouse(WoodenHouseBuilder)' });
    }
};
