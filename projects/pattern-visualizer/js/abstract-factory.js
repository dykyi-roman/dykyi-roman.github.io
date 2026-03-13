/* ===== Abstract Factory Pattern ===== */

PV['abstract-factory'] = {};

PV['abstract-factory'].modes = [
    { id: 'furniture', label: 'Furniture', desc: 'Furniture store: each style (Modern, Victorian) creates matching Chair, Table, and Sofa.' }
];

PV['abstract-factory'].depRules = [
    { name: 'Abstract Factory', role: 'Declares creation methods for each product in the family' },
    { name: 'Concrete Factory', role: 'Implements creation methods for a specific product family/variant' },
    { name: 'Abstract Product', role: 'Interface for a type of product' },
    { name: 'Concrete Product', role: 'Implements abstract product for a specific variant' },
    { name: 'Client', role: 'Uses factories and products through abstract interfaces only' }
];

/* ===== Details ===== */
PV['abstract-factory'].details = {
    furniture: {
        principles: [
            'Program to interfaces: client code depends only on FurnitureFactory, Chair, Table, and Sofa abstractions',
            'Product families guarantee consistency: ModernFurnitureFactory always produces matching modern products',
            'Open/Closed Principle: new furniture styles (e.g., ArtDeco) can be added without modifying existing code',
            'Single Responsibility: each concrete factory encapsulates creation logic for one product family',
            'Dependency Inversion: high-level client depends on abstractions, not concrete product classes'
        ],
        concepts: [
            { term: 'Product Family', definition: 'A set of related products (Chair + Table + Sofa) designed to work together in a specific style.' },
            { term: 'Abstract Factory', definition: 'Interface declaring creation methods for each product type, ensuring every family produces a full set.' },
            { term: 'Concrete Factory', definition: 'Implements creation methods to produce products of a specific variant (Modern, Victorian).' },
            { term: 'Variant Consistency', definition: 'Each factory guarantees all produced objects belong to the same family, preventing mismatched combinations.' },
            { term: 'Client Isolation', definition: 'Client receives a factory via constructor/config and never references concrete product classes directly.' }
        ],
        tradeoffs: {
            pros: [
                'Guarantees product family consistency — all objects from one factory match in style',
                'Isolates client from concrete classes — easy to swap entire families',
                'Follows Open/Closed Principle — adding new families requires no changes to existing code',
                'Centralizes creation logic — each factory is a single source of truth for its variant'
            ],
            cons: [
                'Adding a new product type (e.g., Lamp) requires changing all factory interfaces and implementations',
                'Increases number of classes significantly — each family multiplies the class count',
                'Can be over-engineered for simple scenarios with few product types',
                'Factory interfaces become rigid — hard to evolve without breaking existing families'
            ],
            whenToUse: 'When your system must create families of related objects that must be used together, and you want to enforce consistency across product variants without coupling client code to concrete classes.'
        }
    }
};

/* ===== Mode: furniture ===== */

function renderFurnitureFactory() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Abstract Factory + Concrete Factories (single row) */
            '<div class="pv-hierarchy-row" style="justify-content: space-between; width: 100%;">' +
                PV.renderClass('af-modern-factory', 'ModernFurnitureFactory', {
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: 'Concrete Factory: creates modern-style furniture'
                }) +
                PV.renderClass('af-factory', 'FurnitureFactory', {
                    stereotype: 'interface',
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: 'Abstract Factory: declares creation methods for each product in the family'
                }) +
                PV.renderClass('af-victorian-factory', 'VictorianFurnitureFactory', {
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: 'Concrete Factory: creates Victorian-style furniture'
                }) +
            '</div>' +
            PV.renderArrowConnector('creates') +
            /* Abstract Products */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('af-chair', 'Chair', {
                    stereotype: 'interface',
                    methods: ['sitOn()'],
                    tooltip: 'Abstract Product: interface for chair objects'
                }) +
                PV.renderClass('af-table', 'Table', {
                    stereotype: 'interface',
                    methods: ['putOn()'],
                    tooltip: 'Abstract Product: interface for table objects'
                }) +
                PV.renderClass('af-sofa', 'Sofa', {
                    stereotype: 'interface',
                    methods: ['lieOn()'],
                    tooltip: 'Abstract Product: interface for sofa objects'
                }) +
            '</div>' +
            PV.renderArrowConnector('implements') +
            /* Concrete Products — Modern row */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('af-modern-chair', 'ModernChair', {
                    methods: ['sitOn()'],
                    tooltip: 'Concrete Product: modern-style chair'
                }) +
                PV.renderClass('af-modern-table', 'ModernTable', {
                    methods: ['putOn()'],
                    tooltip: 'Concrete Product: modern-style table'
                }) +
                PV.renderClass('af-modern-sofa', 'ModernSofa', {
                    methods: ['lieOn()'],
                    tooltip: 'Concrete Product: modern-style sofa'
                }) +
            '</div>' +
            /* Concrete Products — Victorian row (offset for checkerboard) */
            '<div class="pv-hierarchy-row" style="padding-left: 200px;">' +
                PV.renderClass('af-victorian-chair', 'VictorianChair', {
                    methods: ['sitOn()'],
                    tooltip: 'Concrete Product: Victorian-style chair'
                }) +
                PV.renderClass('af-victorian-table', 'VictorianTable', {
                    methods: ['putOn()'],
                    tooltip: 'Concrete Product: Victorian-style table'
                }) +
                PV.renderClass('af-victorian-sofa', 'VictorianSofa', {
                    methods: ['lieOn()'],
                    tooltip: 'Concrete Product: Victorian-style sofa'
                }) +
            '</div>' +
            /* Object Instances — Modern row (hidden) */
            '<div class="pv-hierarchy-row">' +
                PV.renderObject('obj-af-mchair', ':ModernChair', { tooltip: 'Instance of ModernChair' }) +
                PV.renderObject('obj-af-mtable', ':ModernTable', { tooltip: 'Instance of ModernTable' }) +
                PV.renderObject('obj-af-msofa', ':ModernSofa', { tooltip: 'Instance of ModernSofa' }) +
            '</div>' +
            /* Object Instances — Victorian row (hidden, offset for checkerboard) */
            '<div class="pv-hierarchy-row" style="padding-left: 200px;">' +
                PV.renderObject('obj-af-vchair', ':VictorianChair', { tooltip: 'Instance of VictorianChair' }) +
                PV.renderObject('obj-af-vtable', ':VictorianTable', { tooltip: 'Instance of VictorianTable' }) +
                PV.renderObject('obj-af-vsofa', ':VictorianSofa', { tooltip: 'Instance of VictorianSofa' }) +
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
        PV.renderRelation('af-modern-factory', 'af-factory', 'inherit');
        PV.renderRelation('af-victorian-factory', 'af-factory', 'inherit');
        PV.renderRelation('af-modern-chair', 'af-chair', 'inherit');
        PV.renderRelation('af-modern-table', 'af-table', 'inherit');
        PV.renderRelation('af-modern-sofa', 'af-sofa', 'inherit');
        PV.renderRelation('af-victorian-chair', 'af-chair', 'inherit');
        PV.renderRelation('af-victorian-table', 'af-table', 'inherit');
        PV.renderRelation('af-victorian-sofa', 'af-sofa', 'inherit');
    }, 100);
}

PV['abstract-factory'].furniture = {
    init: function() {
        renderFurnitureFactory();
    },
    steps: function() {
        return [
            { elementId: 'af-factory', label: 'FurnitureFactory', description: 'Client requests a furniture set', logType: 'REQUEST', badgePosition: 'top' },
            { elementId: 'af-modern-factory', label: 'ModernFurnitureFactory', description: 'Modern factory selected for this order', logType: 'FLOW' },
            { elementId: 'af-modern-chair', label: 'createChair()', description: 'Factory calls createChair()', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-mchair', label: 'ModernChair', description: 'ModernChair instance created', logType: 'CREATE', spawnId: 'obj-af-mchair', spawnLabel: 'ModernChair', arrowFromId: 'af-modern-chair' },
            { elementId: 'af-modern-table', label: 'createTable()', description: 'Factory calls createTable()', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-mtable', label: 'ModernTable', description: 'ModernTable instance created', logType: 'CREATE', spawnId: 'obj-af-mtable', spawnLabel: 'ModernTable', arrowFromId: 'af-modern-table' },
            { elementId: 'af-modern-sofa', label: 'createSofa()', description: 'Factory calls createSofa()', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-msofa', label: 'ModernSofa', description: 'ModernSofa instance created', logType: 'CREATE', spawnId: 'obj-af-msofa', spawnLabel: 'ModernSofa', arrowFromId: 'af-modern-sofa' },
            { elementId: 'af-factory', label: 'FurnitureFactory', description: 'All modern products delivered to client', logType: 'RESPONSE', arrowFromId: 'obj-af-msofa' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Client requests Modern furniture set' };
    },
    run: function() {
        PV.animateFlow(PV['abstract-factory'].furniture.steps(), PV['abstract-factory'].furniture.stepOptions());
    }
};
