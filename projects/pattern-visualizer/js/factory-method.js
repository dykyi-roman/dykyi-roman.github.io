/* ===== Factory Method Pattern ===== */

PV['factory-method'] = {};

PV['factory-method'].modes = [
    { id: 'logistics', label: 'Logistics', desc: 'Logistics app where each transport type has its own creator subclass implementing createTransport(). The parent Logistics class defines planDelivery() which calls the abstract createTransport() — each subclass decides which Transport to instantiate.' }
];

PV['factory-method'].depRules = [
    { name: 'Creator (Abstract)', role: 'Declares the factory method returning a Product; may provide default implementation' },
    { name: 'Concrete Creator', role: 'Overrides factory method to return specific Product type' },
    { name: 'Product (Interface)', role: 'Common interface for all objects the factory method creates' },
    { name: 'Concrete Product', role: 'Implements the Product interface' }
];

/* ===== Render: Logistics ===== */
function renderFactoryMethodLogistics() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 45px; padding: 30px 20px;">' +
            /* Row 1: Abstract Creator + Product Interface */
            '<div class="pv-hierarchy-row" style="gap: 140px;">' +
                PV.renderClass('fm-logistics', 'Logistics', {
                    stereotype: 'abstract',
                    methods: ['createTransport(): Transport', 'planDelivery()'],
                    tooltip: 'Abstract creator that declares the factory method createTransport() and uses it inside planDelivery()'
                }) +
                PV.renderClass('fm-transport', 'Transport', {
                    stereotype: 'interface',
                    methods: ['deliver()'],
                    tooltip: 'Product interface defining the contract all concrete transports must implement'
                }) +
            '</div>' +
            /* Row 2: Creators with instances (left) | Products (right) */
            '<div style="display: flex; gap: 30px; justify-content: center; align-items: flex-start; margin-top: 60px;">' +
                /* SeaLogistics + :Ship */
                '<div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">' +
                    PV.renderClass('fm-sea-logistics', 'SeaLogistics', {
                        methods: ['createTransport(): Ship'],
                        tooltip: 'Concrete creator that overrides createTransport() to return a Ship instance'
                    }) +
                    PV.renderObject('obj-fm-ship', ':Ship', { tooltip: 'Runtime Ship instance created by SeaLogistics' }) +
                '</div>' +
                /* RoadLogistics + :Truck */
                '<div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">' +
                    PV.renderClass('fm-road-logistics', 'RoadLogistics', {
                        methods: ['createTransport(): Truck'],
                        tooltip: 'Concrete creator that overrides createTransport() to return a Truck instance'
                    }) +
                    PV.renderObject('obj-fm-truck', ':Truck', { tooltip: 'Runtime Truck instance created by RoadLogistics' }) +
                '</div>' +
                /* Spacer */
                '<div style="width: 60px;"></div>' +
                /* Truck */
                PV.renderClass('fm-truck', 'Truck', {
                    methods: ['deliver()'],
                    tooltip: 'Concrete product implementing Transport — delivers goods by road'
                }) +
                /* Ship */
                PV.renderClass('fm-ship', 'Ship', {
                    methods: ['deliver()'],
                    tooltip: 'Concrete product implementing Transport — delivers goods by sea'
                }) +
            '</div>' +
            /* Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Flow</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> Create</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Response</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> Inherit</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> Uses</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('fm-road-logistics', 'fm-logistics', 'inherit');
        PV.renderRelation('fm-sea-logistics', 'fm-logistics', 'inherit');
        PV.renderRelation('fm-truck', 'fm-transport', 'inherit');
        PV.renderRelation('fm-ship', 'fm-transport', 'inherit');
        PV.renderRelation('fm-logistics', 'fm-transport', 'depend');
    }, 50);
}

/* ===== Details ===== */
PV['factory-method'].details = {
    logistics: {
        principles: [
            'The Creator class declares a factory method that subclasses override to produce different Products',
            'Client code works with the abstract Creator and Product types — never depends on concrete classes',
            'Open/Closed Principle: new transport types are added by creating new creator subclasses without modifying existing code',
            'Single Responsibility: each Concrete Creator is responsible for exactly one product type',
            'planDelivery() in the Creator relies on the factory method — the Template Method pattern cooperates with Factory Method'
        ],
        concepts: [
            { term: 'Factory Method', definition: 'An abstract method declared in the Creator that returns a Product. Each Concrete Creator provides its own implementation.' },
            { term: 'Creator', definition: 'Abstract class containing the factory method and business logic (planDelivery) that depends on the product returned by the factory method.' },
            { term: 'Concrete Creator', definition: 'Subclass of Creator that overrides the factory method to return a specific Concrete Product (e.g., RoadLogistics returns Truck).' },
            { term: 'Product', definition: 'Interface or abstract class that declares the operations all concrete products must implement (e.g., deliver()).' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates tight coupling between Creator and Concrete Products',
                'Open/Closed Principle — extend without modifying existing code',
                'Single Responsibility — each creator handles one product type',
                'Supports the Dependency Inversion Principle — high-level code depends on abstractions'
            ],
            cons: [
                'Requires a parallel class hierarchy (creator per product), increasing class count',
                'More indirection than direct construction — harder to trace which object is created',
                'Overkill if the product family is small and unlikely to grow',
                'Subclassing solely for object creation can feel heavyweight'
            ],
            whenToUse: 'Use when the exact type of object to create is determined by subclasses, when you want to provide a hook for extensions, or when a class delegates instantiation responsibility to one of several helper subclasses.'
        }
    }
};

/* ===== Mode: logistics ===== */
PV['factory-method'].logistics = {
    init: function() {
        renderFactoryMethodLogistics();
    },
    steps: function() {
        return [
            { elementId: 'fm-logistics', label: 'Client calls planDelivery()', description: 'Client invokes planDelivery() on the abstract Logistics reference', logType: 'REQUEST', badgePosition: 'top' },
            { elementId: 'fm-logistics', label: 'Logistics.planDelivery()', description: 'planDelivery() internally calls the abstract createTransport() factory method', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'fm-road-logistics', label: 'RoadLogistics.createTransport()', description: 'Concrete creator overrides createTransport() to instantiate a Truck', logType: 'FLOW', arrowFromId: 'fm-logistics' },
            { elementId: 'fm-truck', label: 'new Truck()', description: 'Truck constructor is invoked by RoadLogistics', logType: 'CREATE', spawnId: 'obj-fm-truck', spawnLabel: ':Truck', arrowFromId: 'fm-road-logistics' },
            { elementId: 'obj-fm-truck', label: ':Truck', description: 'Truck instance is returned to planDelivery()', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'fm-transport', label: 'Transport.deliver()', description: 'planDelivery() calls deliver() on the returned Transport reference', logType: 'FLOW', arrowFromId: 'fm-logistics', badgePosition: 'top' },
            { elementId: 'obj-fm-truck', label: 'Truck.deliver()', description: 'Concrete Truck executes delivery by road', logType: 'FLOW', arrowFromId: 'fm-transport' },
            { elementId: 'fm-logistics', label: 'Delivery complete', description: 'planDelivery() finishes — goods delivered by Truck', logType: 'RESPONSE', arrowFromId: 'obj-fm-truck' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Client: logistics.planDelivery()' }; },
    run: function() {
        PV.animateFlow(PV['factory-method'].logistics.steps(), PV['factory-method'].logistics.stepOptions());
    }
};
