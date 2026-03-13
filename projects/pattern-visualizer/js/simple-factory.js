/* ===== Simple Factory Pattern ===== */

PV['simple-factory'] = {};

PV['simple-factory'].modes = [
    { id: 'transport', label: 'Transport', desc: 'A TransportFactory creates delivery vehicles based on a type parameter. The client requests a Transport object without knowing whether it gets a Truck, Ship, or Plane. The factory encapsulates all instantiation logic behind a single create() method.' }
];

PV['simple-factory'].depRules = [
    { name: 'Factory', role: 'Creates objects without exposing creation logic to the client' },
    { name: 'Product (Interface)', role: 'Common interface for all objects the factory can create' },
    { name: 'Concrete Products', role: 'Specific implementations returned by the factory' },
    { name: 'Client', role: 'Uses the factory to get objects, unaware of concrete classes' }
];

/* ---------- Shared render functions ---------- */

function renderTransport() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            '<div class="layout-pattern-flow" style="gap: 80px;">' +
                PV.renderClass('cls-sf-factory', 'TransportFactory', {
                    methods: ['create(type): Transport'],
                    tooltip: 'Factory class that encapsulates object creation logic based on a type parameter'
                }) +
                PV.renderArrowConnector('creates') +
                PV.renderClass('cls-sf-product', 'Transport', {
                    stereotype: 'interface',
                    methods: ['deliver()'],
                    tooltip: 'Common interface for all transport types returned by the factory'
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="gap: 80px; margin-top: 30px;">' +
                PV.renderClass('cls-sf-truck', 'Truck', {
                    methods: ['deliver()'],
                    tooltip: 'Concrete product: delivers cargo by road'
                }) +
                PV.renderClass('cls-sf-ship', 'Ship', {
                    methods: ['deliver()'],
                    tooltip: 'Concrete product: delivers cargo by sea'
                }) +
                PV.renderClass('cls-sf-plane', 'Plane', {
                    methods: ['deliver()'],
                    tooltip: 'Concrete product: delivers cargo by air'
                }) +
            '</div>' +
            '<div class="pv-hierarchy-row" style="gap: 100px;">' +
                PV.renderObject('obj-truck', '\uD83D\uDE9B :Truck', { tooltip: 'Runtime instance of Truck created by factory' }) +
                PV.renderObject('obj-ship', '\uD83D\uDEA2 :Ship', { tooltip: 'Runtime instance of Ship created by factory' }) +
                PV.renderObject('obj-plane', '\u2708\uFE0F :Plane', { tooltip: 'Runtime instance of Plane created by factory' }) +
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
        PV.renderRelation('cls-sf-truck', 'cls-sf-product', 'inherit');
        PV.renderRelation('cls-sf-ship', 'cls-sf-product', 'inherit');
        PV.renderRelation('cls-sf-plane', 'cls-sf-product', 'inherit');
    }, 50);
}

/* ---------- Details ---------- */

PV['simple-factory'].details = {
    transport: {
        principles: [
            'Encapsulate object creation: the client never uses the new keyword for concrete products',
            'Program to an interface (Transport), not an implementation (Truck, Ship, Plane)',
            'Single Responsibility: factory owns all instantiation logic in one place',
            'Open for extension: adding a new transport type requires only modifying the factory',
            'Loose coupling: client depends on the abstraction, not on concrete classes'
        ],
        concepts: [
            { term: 'Simple Factory', definition: 'A class with a single creation method that returns different types of objects based on a parameter. Not a GoF pattern per se, but a widely used idiom that simplifies object creation.' },
            { term: 'Product Interface', definition: 'The common type (Transport) that all concrete products implement. The client codes against this interface, enabling polymorphism.' },
            { term: 'Parameterized Creation', definition: 'The factory method accepts a type string or enum and uses conditional logic (switch/if) to decide which concrete class to instantiate.' },
            { term: 'Concrete Product', definition: 'A specific implementation (Truck, Ship, Plane) of the product interface. The factory is the only place that references these classes directly.' }
        ],
        tradeoffs: {
            pros: [
                'Centralizes creation logic — one place to add or change product types',
                'Client code stays clean and decoupled from concrete classes',
                'Easy to understand — simpler than Factory Method or Abstract Factory',
                'Reduces duplication of instantiation code across the codebase'
            ],
            cons: [
                'Violates Open/Closed Principle — adding new types requires modifying the factory method',
                'Factory can grow into a large switch/if block as product types increase',
                'Single point of failure — all creation funnels through one class',
                'Not as flexible as Factory Method pattern for extensibility via inheritance'
            ],
            whenToUse: 'Best when you have a small, stable set of product types, the creation logic is straightforward, and you want to hide instantiation details from the client without the overhead of a full Factory Method or Abstract Factory hierarchy.'
        }
    }
};

/* ---------- Mode: transport ---------- */

PV['simple-factory'].transport = {
    init: function() {
        renderTransport();
    },
    steps: function() {
        return [
            { elementId: 'cls-sf-factory', label: 'TransportFactory', description: 'Client calls factory.create("truck")', logType: 'REQUEST' },
            { elementId: 'cls-sf-factory', label: 'TransportFactory', description: 'Factory receives type="truck"', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-sf-truck', label: 'Truck', description: 'Factory selects Truck class based on type', logType: 'FLOW' },
            { elementId: 'obj-truck', label: 'Truck instance', description: 'new Truck() created', logType: 'CREATE', spawnId: 'obj-truck', spawnLabel: '\uD83D\uDE9B :Truck' },
            { elementId: 'cls-sf-product', label: 'Transport', description: 'Truck returned as Transport interface', logType: 'FLOW', arrowFromId: 'obj-truck' },
            { elementId: 'cls-sf-factory', label: 'TransportFactory', description: 'Factory returns Transport to client', logType: 'RESPONSE', arrowFromId: 'cls-sf-product', badgePosition: 'top' },
            { elementId: 'obj-truck', label: 'Truck.deliver()', description: 'Client calls deliver() on returned object', logType: 'FLOW', arrowFromId: 'cls-sf-factory' },
            { elementId: 'cls-sf-factory', label: 'TransportFactory', description: 'Delivery completed successfully', logType: 'RESPONSE', arrowFromId: 'obj-truck' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Client: factory.create("truck")' }; },
    run: function() {
        PV.animateFlow(PV['simple-factory'].transport.steps(), PV['simple-factory'].transport.stepOptions());
    }
};
