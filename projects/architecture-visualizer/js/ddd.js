/* ===== Domain-Driven Design ===== */

ARCHV.ddd = {};

ARCHV.ddd.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP request enters the Bounded Context through the Presentation layer (Controller). UseCase orchestrates domain logic and persists the Aggregate via Repository. Domain Events propagate between contexts through the EventBus.' },
    { id: 'console', label: 'Console', desc: 'Console command triggers a use case within a Bounded Context. Domain logic stays isolated inside the context boundary, communicating with other contexts via Domain Events.' },
    { id: 'message', label: 'Message', desc: 'Domain Event from another Bounded Context arrives through the Anti-Corruption Layer, gets translated, and processed within the local context. This demonstrates context mapping.' },
    { id: 'context-map', label: 'Context Map', desc: 'Bird\'s-eye view of all Bounded Contexts and their strategic relationships: ACL, Shared Kernel, Customer-Supplier, Conformist. Before writing code, define how contexts relate to each other.' },
    { id: 'open-host', label: 'Open Host', desc: 'A context publishes a formal API (Open Host Service) with Published Language (OpenAPI/Protobuf). Multiple downstream contexts consume the same standardized contract instead of point-to-point translations.' },
    { id: 'saga', label: 'Saga ✓', desc: 'Saga/Process Manager coordinates a business process spanning multiple Bounded Contexts. Each context owns its local transaction; the Saga orchestrates the overall workflow. All steps succeed: Order → Payment → Shipment → COMPLETED.' },
    { id: 'saga-fail', label: 'Saga ✗', desc: 'Payment fails after Order is confirmed. Saga Orchestrator triggers compensating transactions in reverse order: CancelOrder undoes the committed step. State machine reaches COMPENSATED instead of COMPLETED.' },
    { id: 'domain-events', label: 'Domain Events', desc: 'A Domain Event propagates through the Event Bus to multiple contexts. Each consumer translates the event through its own ACL/Translator into its local Ubiquitous Language, demonstrating eventual consistency.' }
];

ARCHV.ddd.depRules = [
    { from: 'Presentation', to: 'Application', allowed: true },
    { from: 'Application', to: 'Domain', allowed: true },
    { from: 'Infrastructure', to: 'Domain', allowed: true },
    { from: 'Context A', to: 'ACL', allowed: true },
    { from: 'ACL', to: 'Context B', allowed: true },
    { from: 'Upstream', to: 'OHS / Published Language', allowed: true },
    { from: 'OHS', to: 'Downstream (any)', allowed: true },
    { from: 'Shared Kernel', to: 'Both Contexts', allowed: true },
    { from: 'Customer (upstream)', to: 'Supplier (downstream)', allowed: true },
    { from: 'Conformist', to: 'Upstream (no translation)', allowed: true },
    { from: 'Domain', to: 'Infrastructure', allowed: false },
    { from: 'Domain', to: 'Presentation', allowed: false },
    { from: 'Context A', to: 'Context B (direct)', allowed: false }
];

function renderDDD(opts) {
    opts = opts || {};
    var appComponents = '';
    if (opts.showUseCase !== false) {
        appComponents += ARCHV.renderComponent('comp-ddd-usecase', 'UseCase', '&#x2699;', 'Application layer orchestrator for domain operations');
    }
    if (opts.showAppService !== false) {
        appComponents += ARCHV.renderComponent('comp-ddd-appservice', 'AppService', '&#x1F527;', 'Coordinates use case execution without containing business logic');
    }

    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-vertical">' +
            '<div class="archv-bounded-context" id="ctx-order">' +
                '<span class="archv-context-label">Order Context</span>' +
                '<div class="archv-layer" id="layer-ddd-presentation">' +
                    '<div class="archv-layer-name">Presentation</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-controller', 'Controller', '&#x1F310;', 'Presentation entry point receiving requests into the Bounded Context') +
                        ARCHV.renderComponent('comp-ddd-dto', 'DTO', '&#x1F4E6;', 'Data Transfer Object for cross-layer communication') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-application">' +
                    '<div class="archv-layer-name">Application</div>' +
                    '<div class="archv-components">' +
                        appComponents +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-domain">' +
                    '<div class="archv-layer-name">Domain</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-aggregate', 'Aggregate', '&#x1F4E6;', 'Cluster of domain objects treated as a transactional consistency boundary') +
                        ARCHV.renderComponent('comp-ddd-entity', 'Entity', '&#x1F4CB;', 'Domain object with unique identity and lifecycle') +
                        ARCHV.renderComponent('comp-ddd-vo', 'ValueObject', '&#x1F4CE;', 'Immutable object defined by its attributes, encapsulates validation') +
                        ARCHV.renderComponent('comp-ddd-domservice', 'DomainService', '&#x1F3AF;', 'Stateless logic spanning multiple aggregates or entities') +
                        ARCHV.renderComponent('comp-ddd-event', 'DomainEvent', '&#x1F514;', 'Record of something significant that happened in the domain') +
                        ARCHV.renderComponent('comp-ddd-spec', 'Specification', '&#x1F50D;', 'Encapsulates a business rule as a reusable boolean predicate') +
                        ARCHV.renderComponent('comp-ddd-repo-iface', 'Repository (I)', '&#x1F4DC;', 'Domain interface defining persistence contract — implemented in Infrastructure') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-infra">' +
                    '<div class="archv-layer-name">Infrastructure</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-repo', 'Repository', '&#x1F5C4;', 'Persistence abstraction for storing and retrieving aggregates') +
                        ARCHV.renderComponent('comp-ddd-eventbus', 'EventBus', '&#x1F4E8;', 'Infrastructure for publishing domain events across contexts') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-acl" id="comp-ddd-acl" data-tooltip="Translation layer protecting context boundaries from foreign model concepts">&#x1F6E1; Anti-Corruption Layer</div>' +
            '<div class="archv-bounded-context" id="ctx-payment">' +
                '<span class="archv-context-label">Payment Context</span>' +
                '<div class="archv-layer" id="layer-ddd-pay">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-pay-handler', 'EventHandler', '&#x1F4E5;', 'Receives and processes domain events from other Bounded Contexts') +
                        ARCHV.renderComponent('comp-ddd-pay-service', 'PaymentService', '&#x1F4B3;', 'Domain service handling payment processing logic') +
                        ARCHV.renderComponent('comp-ddd-pay-entity', 'Payment', '&#x1F4CB;', 'Payment entity within the Payment Bounded Context') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

function renderDDDContextMap() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="context-map-wrapper">' +
            '<div class="layout-context-map">' +
                '<div class="archv-bounded-context ctx-left" id="ctx-cm-crm">' +
                    '<span class="archv-context-label">CRM Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cm-crm-customer', 'Customer', '&#x1F464;', 'Customer entity in CRM context') +
                        ARCHV.renderComponent('comp-cm-crm-segment', 'Segment', '&#x1F3AF;', 'Customer segmentation logic') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context ctx-core" id="ctx-cm-order">' +
                    '<span class="archv-context-label">Order Context (Core)</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cm-order-agg', 'Order', '&#x1F4E6;', 'Order aggregate — the core domain') +
                        ARCHV.renderComponent('comp-cm-order-event', 'OrderPlaced', '&#x1F514;', 'Domain event signaling order creation') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context ctx-right" id="ctx-cm-payment">' +
                    '<span class="archv-context-label">Payment Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cm-pay-service', 'PaymentService', '&#x1F4B3;', 'Payment processing service') +
                        ARCHV.renderComponent('comp-cm-pay-acl', 'ACL', '&#x1F6E1;', 'Anti-Corruption Layer translating Order concepts') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context ctx-bottom-left" id="ctx-cm-inventory">' +
                    '<span class="archv-context-label">Inventory Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cm-inv-stock', 'Stock', '&#x1F4E6;', 'Stock management aggregate') +
                        ARCHV.renderComponent('comp-cm-inv-shared', 'ProductId (SK)', '&#x1F91D;', 'Shared Kernel value object') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context ctx-bottom-right" id="ctx-cm-shipping">' +
                    '<span class="archv-context-label">Shipping Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cm-ship-delivery', 'Delivery', '&#x1F69A;', 'Delivery aggregate in Shipping context') +
                        ARCHV.renderComponent('comp-cm-ship-tracking', 'Tracking', '&#x1F4CD;', 'Shipment tracking service') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-ctx-relationships" id="ctx-cm-relationships">' +
                '<span class="archv-ctx-relationship rel-acl" id="rel-acl" data-tooltip="Payment protects itself from Order model changes via ACL">&#x1F6E1; ACL: Order &#x2192; Payment</span>' +
                '<span class="archv-ctx-relationship rel-shared-kernel" id="rel-shared-kernel" data-tooltip="ProductId jointly owned by Order and Inventory teams">&#x1F91D; Shared Kernel: Order &#x2194; Inventory</span>' +
                '<span class="archv-ctx-relationship rel-customer-supplier" id="rel-customer-supplier" data-tooltip="Order (downstream) negotiates API with Shipping (upstream)">&#x1F4E6; Customer-Supplier: Order &#x2193; &#x2192; Shipping &#x2191;</span>' +
                '<span class="archv-ctx-relationship rel-conformist" id="rel-conformist" data-tooltip="CRM conforms to Order model without any translation">&#x1F4CB; Conformist: Order &#x2192; CRM</span>' +
            '</div>' +
            '<div class="archv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ACL (Order &#x2192; Payment)</div>' +
                '<div class="legend-item"><span class="legend-line-async"></span> Shared Kernel (Order &#x2194; Inventory)</div>' +
                '<div class="legend-item"><span class="legend-line-write"></span> Customer-Supplier (Order &#x2192; Shipping)</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Conformist (Order &#x2192; CRM)</div>' +
            '</div>' +
        '</div>';
}

function renderDDDOpenHost() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-ddd-ohs">' +
            '<div class="archv-bounded-context" id="ctx-ohs-order">' +
                '<span class="archv-context-label">Order Context (Upstream)</span>' +
                '<div class="archv-layer" id="layer-ohs-app">' +
                    '<div class="archv-layer-name">Application</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ohs-usecase', 'PlaceOrder', '&#x2699;', 'Use case orchestrating order creation') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ohs-domain">' +
                    '<div class="archv-layer-name">Domain</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ohs-aggregate', 'Order', '&#x1F4E6;', 'Order aggregate root') +
                        ARCHV.renderComponent('comp-ohs-event', 'OrderPlaced', '&#x1F514;', 'Domain event raised when order is placed') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ohs-infra">' +
                    '<div class="archv-layer-name">Infrastructure</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ohs-publisher', 'EventPublisher', '&#x1F4E8;', 'Infrastructure adapter publishing events through OHS contract') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-ohs" id="comp-ohs-service" data-tooltip="Open Host Service exposes a formal API with Published Language (OpenAPI/Protobuf schema)">&#x1F310; Open Host Service / Published Language (OpenAPI Schema)</div>' +
            '<div class="archv-consumers">' +
                '<div class="archv-consumer" id="comp-ohs-payment">' +
                    '<span class="comp-icon">&#x1F4B3;</span> Payment' +
                    '<div class="archv-local-event">PaymentRequired</div>' +
                '</div>' +
                '<div class="archv-consumer" id="comp-ohs-shipping">' +
                    '<span class="comp-icon">&#x1F69A;</span> Shipping' +
                    '<div class="archv-local-event">ShipmentRequested</div>' +
                '</div>' +
                '<div class="archv-consumer" id="comp-ohs-analytics">' +
                    '<span class="comp-icon">&#x1F4CA;</span> Analytics' +
                    '<div class="archv-local-event">SaleRecorded</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

function renderDDDSaga() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-ddd-saga">' +
            '<div class="archv-saga-box" id="comp-saga-orchestrator" data-tooltip="Saga Orchestrator coordinates the cross-context business process and manages compensating actions">' +
                '&#x1F3AF; Saga Orchestrator' +
                '<div style="font-size:10px;color:var(--archv-text-light);margin-top:2px" id="comp-saga-state">State: IDLE</div>' +
            '</div>' +
            '<div class="archv-saga-contexts">' +
                '<div class="archv-bounded-context" id="ctx-saga-order">' +
                    '<span class="archv-context-label">Order Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-saga-order-cmd', 'CreateOrder', '&#x2699;', 'Command to create order') +
                        ARCHV.renderComponent('comp-saga-order-event', 'OrderConfirmed', '&#x1F514;', 'Event confirming order creation') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context" id="ctx-saga-payment">' +
                    '<span class="archv-context-label">Payment Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-saga-pay-cmd', 'ProcessPayment', '&#x1F4B3;', 'Command to process payment') +
                        ARCHV.renderComponent('comp-saga-pay-event', 'PaymentCompleted', '&#x1F514;', 'Event confirming payment') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context" id="ctx-saga-shipping">' +
                    '<span class="archv-context-label">Shipping Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-saga-ship-cmd', 'CreateShipment', '&#x1F69A;', 'Command to create shipment') +
                        ARCHV.renderComponent('comp-saga-ship-event', 'ShipmentCreated', '&#x1F514;', 'Event confirming shipment creation') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-event-bus" id="comp-saga-eventbus" data-tooltip="Event Bus carries commands from Saga to contexts and events back to Saga">&#x1F4E8; Event Bus</div>' +
        '</div>';
}

function renderDDDSagaFail() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-ddd-saga">' +
            '<div class="archv-saga-box" id="comp-sagaf-orchestrator" data-tooltip="Saga Orchestrator detects failure and triggers compensating transactions in reverse order">' +
                '&#x1F3AF; Saga Orchestrator' +
                '<div style="font-size:10px;color:var(--archv-text-light);margin-top:2px" id="comp-sagaf-state">State: IDLE</div>' +
            '</div>' +
            '<div class="archv-saga-contexts">' +
                '<div class="archv-bounded-context" id="ctx-sagaf-order">' +
                    '<span class="archv-context-label">Order Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-sagaf-order-cmd', 'CreateOrder', '&#x2699;', 'Command to create order') +
                        ARCHV.renderComponent('comp-sagaf-order-event', 'OrderConfirmed', '&#x1F514;', 'Event confirming order creation') +
                        ARCHV.renderComponent('comp-sagaf-cancel-cmd', 'CancelOrder', '&#x274C;', 'Compensating command to cancel order') +
                        ARCHV.renderComponent('comp-sagaf-cancel-event', 'OrderCancelled', '&#x1F514;', 'Event confirming order cancellation') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context" id="ctx-sagaf-payment">' +
                    '<span class="archv-context-label">Payment Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-sagaf-pay-cmd', 'ProcessPayment', '&#x1F4B3;', 'Command to process payment') +
                        ARCHV.renderComponent('comp-sagaf-pay-fail', 'PaymentFailed', '&#x1F6A8;', 'Payment rejected — insufficient funds') +
                    '</div>' +
                '</div>' +
                '<div class="archv-bounded-context" id="ctx-sagaf-shipping">' +
                    '<span class="archv-context-label">Shipping Context</span>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-sagaf-ship-cmd', 'CreateShipment', '&#x1F69A;', 'Command to create shipment (never reached)') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-event-bus" id="comp-sagaf-eventbus" data-tooltip="Event Bus carries commands and events between Saga and contexts">&#x1F4E8; Event Bus</div>' +
        '</div>';
}

function renderDDDDomainEvents() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-ddd-events">' +
            '<div class="archv-bounded-context" id="ctx-de-order">' +
                '<span class="archv-context-label">Order Context (Producer)</span>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-de-place', 'Order.place()', '&#x2699;', 'Business method that places an order') +
                    ARCHV.renderComponent('comp-de-event', 'OrderPlaced', '&#x1F514;', 'Domain event raised after order is placed') +
                    ARCHV.renderComponent('comp-de-publisher', 'EventPublisher', '&#x1F4E8;', 'Publishes domain event to event bus') +
                '</div>' +
            '</div>' +
            '<div class="archv-event-bus" id="comp-de-eventbus" data-tooltip="Event Bus distributes domain events to all subscribed contexts">&#x1F4E8; Event Bus &mdash; OrderPlaced</div>' +
            '<div class="archv-consumers">' +
                '<div class="archv-consumer" id="comp-de-payment">' +
                    '<span class="comp-icon">&#x1F4B3;</span> Payment' +
                    '<div class="archv-translator" id="comp-de-pay-acl" data-tooltip="ACL translates OrderPlaced into PaymentRequired">&#x1F6E1; ACL</div>' +
                    '<div class="archv-local-event" id="comp-de-pay-local">&#x2192; PaymentRequired</div>' +
                '</div>' +
                '<div class="archv-consumer" id="comp-de-inventory">' +
                    '<span class="comp-icon">&#x1F4E6;</span> Inventory' +
                    '<div class="archv-translator" id="comp-de-inv-acl" data-tooltip="ACL translates OrderPlaced into StockReservationNeeded">&#x1F6E1; ACL</div>' +
                    '<div class="archv-local-event" id="comp-de-inv-local">&#x2192; StockReservationNeeded</div>' +
                '</div>' +
                '<div class="archv-consumer" id="comp-de-notification">' +
                    '<span class="comp-icon">&#x1F4E7;</span> Notification' +
                    '<div class="archv-translator" id="comp-de-notif-acl" data-tooltip="ACL translates OrderPlaced into OrderConfirmationEmail">&#x1F6E1; ACL</div>' +
                    '<div class="archv-local-event" id="comp-de-notif-local">&#x2192; OrderConfirmationEmail</div>' +
                '</div>' +
                '<div class="archv-consumer" id="comp-de-analytics">' +
                    '<span class="comp-icon">&#x1F4CA;</span> Analytics' +
                    '<div class="archv-translator" id="comp-de-analytics-acl" data-tooltip="ACL translates OrderPlaced into SaleRecorded">&#x1F6E1; ACL</div>' +
                    '<div class="archv-local-event" id="comp-de-analytics-local">&#x2192; SaleRecorded</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.ddd.details = {
    http: {
        principles: [
            'Bounded Contexts define clear ownership boundaries for domain models',
            'Ubiquitous Language ensures developers and domain experts share the same vocabulary',
            'Anti-Corruption Layer protects context boundaries from external model pollution',
            'Aggregates enforce transactional consistency within a boundary'
        ],
        concepts: [
            { term: 'Bounded Context', definition: 'A boundary within which a particular domain model is defined and applicable. Each context has its own Ubiquitous Language.' },
            { term: 'Aggregate', definition: 'A cluster of domain objects treated as a unit for data changes. Has a root entity that controls access.' },
            { term: 'Anti-Corruption Layer', definition: 'A translation layer that isolates a Bounded Context from external models, preventing foreign concepts from leaking in.' },
            { term: 'Domain Event', definition: 'A record of something significant that happened in the domain. Used for cross-context communication.' }
        ],
        tradeoffs: {
            pros: [
                'Rich domain models that closely reflect business reality',
                'Ubiquitous Language bridges communication between devs and domain experts',
                'Bounded Contexts enable team autonomy and independent deployability',
                'Complex domain logic is well organized within aggregates and services'
            ],
            cons: [
                'Steep learning curve — requires deep understanding of strategic and tactical patterns',
                'Overkill for simple CRUD applications with little business logic',
                'Significant upfront modeling effort before writing code',
                'Aggregate boundary design is notoriously difficult to get right'
            ],
            whenToUse: 'Best for complex business domains with many rules, multiple teams working on different subdomains, and evolving requirements where the cost of misunderstanding the domain is high.'
        }
    },
    console: {
        principles: [
            'Console and HTTP share the same domain model within a Bounded Context',
            'Domain Services coordinate logic that spans multiple aggregates',
            'Events propagate state changes without coupling contexts directly',
            'Application layer orchestrates use cases without containing business rules'
        ],
        concepts: [
            { term: 'Domain Service', definition: 'A stateless service that encapsulates domain logic which does not naturally belong to a single Entity or Value Object.' },
            { term: 'Application Service', definition: 'Orchestrates use case execution, coordinates domain objects, but contains no business logic itself.' }
        ],
        tradeoffs: {
            pros: [
                'Rich domain models that closely reflect business reality',
                'Ubiquitous Language bridges communication between devs and domain experts',
                'Bounded Contexts enable team autonomy and independent deployability',
                'Complex domain logic is well organized within aggregates and services'
            ],
            cons: [
                'Steep learning curve — requires deep understanding of strategic and tactical patterns',
                'Overkill for simple CRUD applications with little business logic',
                'Significant upfront modeling effort before writing code',
                'Aggregate boundary design is notoriously difficult to get right'
            ],
            whenToUse: 'Best for complex business domains with many rules, multiple teams working on different subdomains, and evolving requirements where the cost of misunderstanding the domain is high.'
        }
    },
    message: {
        principles: [
            'Context Mapping defines relationships between Bounded Contexts',
            'ACL translates external events into local domain language',
            'Domain Events are the primary mechanism for cross-context communication',
            'Each context maintains its own model integrity'
        ],
        concepts: [
            { term: 'Context Map', definition: 'A visual and conceptual representation of how Bounded Contexts relate to each other (Shared Kernel, Customer-Supplier, Conformist, ACL).' },
            { term: 'Event-Driven Integration', definition: 'Contexts communicate asynchronously through domain events rather than direct API calls, reducing coupling.' }
        ],
        tradeoffs: {
            pros: [
                'Rich domain models that closely reflect business reality',
                'Ubiquitous Language bridges communication between devs and domain experts',
                'Bounded Contexts enable team autonomy and independent deployability',
                'Complex domain logic is well organized within aggregates and services'
            ],
            cons: [
                'Steep learning curve — requires deep understanding of strategic and tactical patterns',
                'Overkill for simple CRUD applications with little business logic',
                'Significant upfront modeling effort before writing code',
                'Aggregate boundary design is notoriously difficult to get right'
            ],
            whenToUse: 'Best for complex business domains with many rules, multiple teams working on different subdomains, and evolving requirements where the cost of misunderstanding the domain is high.'
        }
    },
    'context-map': {
        principles: [
            'Context Map is the first strategic artifact — draw it before writing code',
            'Each relationship type implies a different integration strategy and team dynamics',
            'Power asymmetry between teams determines relationship type (upstream/downstream)',
            'Relationships evolve over time as teams and domains change'
        ],
        concepts: [
            { term: 'Anti-Corruption Layer (ACL)', definition: 'Downstream context builds a translation layer to protect itself from upstream model changes. Maximum isolation, highest development cost.' },
            { term: 'Shared Kernel', definition: 'Two contexts share a subset of the domain model (code/schema). Changes require agreement from both teams. Tight coupling but reduces duplication.' },
            { term: 'Customer-Supplier', definition: 'Upstream (supplier) provides what downstream (customer) needs. Customer can negotiate requirements. Formal interface with versioning.' },
            { term: 'Conformist', definition: 'Downstream context accepts the upstream model as-is without translation. Simplest integration but no protection from upstream changes.' },
            { term: 'Context Map', definition: 'A visual representation of all Bounded Contexts in the system and the relationships between them. The starting point for strategic DDD.' }
        ],
        tradeoffs: {
            pros: [
                'Gives a bird\'s-eye view of the entire system architecture',
                'Makes team relationships and power dynamics explicit',
                'Guides integration strategy decisions before coding',
                'Helps identify problematic coupling early'
            ],
            cons: [
                'Requires organization-wide understanding of domain boundaries',
                'Relationships can be subjective and debatable',
                'Map must be maintained as the system evolves',
                'Does not capture runtime behavior or data flow'
            ],
            whenToUse: 'Essential for any multi-team, multi-context system. Draw the Context Map first when starting a new project or onboarding into an existing one.'
        }
    },
    'open-host': {
        principles: [
            'Open Host Service provides a single formal API for all consumers',
            'Published Language defines a shared schema (OpenAPI, Protobuf, Avro)',
            'Upstream context owns and versions the contract independently',
            'Consumers are decoupled from the internal domain model of the provider'
        ],
        concepts: [
            { term: 'Open Host Service (OHS)', definition: 'A well-defined, public API that a Bounded Context exposes for consumption. Unlike point-to-point integrations, OHS serves all consumers uniformly.' },
            { term: 'Published Language', definition: 'A shared data format (JSON Schema, Protobuf, Avro) that defines the contract. It is the "lingua franca" between contexts.' },
            { term: 'Contract-First Design', definition: 'The API schema is designed before implementation. Consumers can start integration work in parallel with provider development.' }
        ],
        tradeoffs: {
            pros: [
                'Single contract serves multiple consumers — reduces integration effort',
                'Published Language provides clear documentation and versioning',
                'Consumers are insulated from internal model changes',
                'Enables parallel development across teams'
            ],
            cons: [
                'Contract evolution requires careful versioning strategy',
                'One-size-fits-all API may not suit every consumer optimally',
                'Upstream team bears the cost of maintaining the public API',
                'Schema changes can have widespread downstream impact'
            ],
            whenToUse: 'When a context has 3+ consumers and you want to avoid building custom integrations for each. Standard approach for platform/core services.'
        }
    },
    saga: {
        principles: [
            'Each Bounded Context owns its local transaction — no distributed transactions',
            'Saga Orchestrator coordinates the overall workflow by sending commands',
            'Each step produces an event that the Saga listens to for state transitions',
            'Compensation actions are defined for each step to handle failures'
        ],
        concepts: [
            { term: 'Saga Orchestrator', definition: 'A stateful process manager that coordinates a multi-step business process. It sends commands to contexts and reacts to their events.' },
            { term: 'Compensating Transaction', definition: 'The reverse operation for a previously completed step. Used to maintain consistency when a later step fails (e.g., refund payment if shipping fails).' },
            { term: 'Saga State', definition: 'The orchestrator tracks its progress through the workflow (e.g., ORDER_CONFIRMED → PAYMENT_COMPLETED → SHIPMENT_CREATED).' },
            { term: 'Eventual Consistency', definition: 'The system reaches a consistent state eventually, not immediately. Each local transaction is committed independently.' }
        ],
        tradeoffs: {
            pros: [
                'Avoids distributed transactions (2PC) which don\'t scale',
                'Each context remains autonomous with its own database',
                'Clear compensation logic for failure handling',
                'Orchestrator provides single point of workflow visibility'
            ],
            cons: [
                'Complex to implement — requires careful state machine design',
                'Compensation logic can be as complex as the happy path',
                'Debugging distributed workflows is challenging',
                'Eventual consistency requires UI/UX patterns (e.g., "processing...")'
            ],
            whenToUse: 'When a business process spans 3+ Bounded Contexts and you need consistency without distributed transactions. Common in e-commerce, booking, and financial systems.'
        }
    },
    'saga-fail': {
        principles: [
            'Compensating transactions undo committed steps in reverse order',
            'Each compensation must be idempotent — safe to retry on failure',
            'Orchestrator tracks which steps succeeded to know what to compensate',
            'Compensations are semantic inverses, not database rollbacks (e.g., CancelOrder vs. undo)',
            'The system reaches COMPENSATED state — consistent, not broken'
        ],
        concepts: [
            { term: 'Compensating Transaction', definition: 'An operation that semantically undoes a previously committed local transaction. CancelOrder reverses CreateOrder, but it is a new command, not a rollback.' },
            { term: 'Backward Recovery', definition: 'Executing compensating transactions in reverse order of the original saga steps. Only committed steps need compensation.' },
            { term: 'Saga State Machine', definition: 'States include COMPENSATING and COMPENSATED in addition to happy path states. The orchestrator transitions to COMPENSATING on any step failure.' },
            { term: 'Semantic Undo', definition: 'Unlike database rollback, compensation creates new domain events (OrderCancelled) that other contexts can react to.' }
        ],
        tradeoffs: {
            pros: [
                'Guarantees eventual consistency even on partial failures',
                'Each context remains autonomous — no distributed locks needed',
                'Failure handling is explicit and auditable via saga state machine',
                'Compensations produce domain events that other contexts can consume'
            ],
            cons: [
                'Every step must have a well-defined compensation — doubles implementation effort',
                'Compensations themselves can fail, requiring retry and dead-letter strategies',
                'Intermediate inconsistency is visible during compensation execution',
                'State machine complexity grows with each step added to the saga'
            ],
            whenToUse: 'Essential when distributed transactions can fail at any step. Design compensations from the start — retrofitting them into an existing saga is extremely difficult.'
        }
    },
    'domain-events': {
        principles: [
            'Domain Events represent facts — something that already happened',
            'Each consumer interprets the event in its own Ubiquitous Language via ACL',
            'Event Bus decouples producer from consumers — producer doesn\'t know who listens',
            'Eventual consistency is the natural outcome of event-driven integration'
        ],
        concepts: [
            { term: 'Domain Event', definition: 'An immutable record of a significant business occurrence (e.g., OrderPlaced). Named in past tense using domain language.' },
            { term: 'ACL / Translator', definition: 'Each consumer translates the incoming event into its local domain concept. OrderPlaced becomes PaymentRequired in Payment context.' },
            { term: 'Event Bus', definition: 'Infrastructure that routes events from producers to consumers. Can be RabbitMQ, Kafka, or any message broker.' },
            { term: 'Ubiquitous Language', definition: 'The same real-world fact means different things in different contexts. The ACL bridges these language differences.' }
        ],
        tradeoffs: {
            pros: [
                'Maximum decoupling — producer doesn\'t know its consumers',
                'New consumers can subscribe without changing the producer',
                'Each context maintains its own model integrity through ACL',
                'Natural fit for microservices and distributed systems'
            ],
            cons: [
                'Eventual consistency requires careful handling in UIs',
                'Event ordering and idempotency must be explicitly managed',
                'Debugging event chains across contexts is difficult',
                'Event schema evolution needs a versioning strategy'
            ],
            whenToUse: 'When a single business fact triggers reactions in multiple contexts. The go-to pattern for cross-context communication in DDD. Prefer over synchronous calls for loose coupling.'
        }
    }
};

ARCHV.ddd.http = {
    init: function() { renderDDD({ showAppService: false }); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'HTTP request enters Order Context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Map to CreateOrderCommand DTO', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'CreateOrder use case orchestrates flow', logType: 'COMMAND', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-spec', label: 'Specification', description: 'Check order spec rules', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Create Order aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Add OrderLine entities', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-vo', label: 'ValueObject', description: 'Validate Money, Address VOs', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Aggregate raises OrderCreated event internally', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo-iface', label: 'Repository (I)', description: 'UseCase calls domain Repository interface', logType: 'LAYER', layerId: 'layer-ddd-domain', arrowFromId: 'comp-ddd-usecase' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Infrastructure implements persistence', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Dispatch OrderCreated after persist', logType: 'EVENT', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-acl', label: 'ACL', description: 'Translate event for Payment Context', logType: 'FLOW' },
            { elementId: 'comp-ddd-pay-handler', label: 'EventHandler', description: 'Payment context receives event', logType: 'EVENT', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-pay-service', label: 'PaymentService', description: 'Process payment', logType: 'LAYER', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-pay-entity', label: 'Payment', description: 'Create Payment entity', logType: 'LAYER', layerId: 'layer-ddd-pay' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.http.steps(), ARCHV.ddd.http.stepOptions());
    }
};

ARCHV.ddd.console = {
    init: function() { renderDDD({ showUseCase: false }); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'CLI command enters context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Parse arguments', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-appservice', label: 'AppService', description: 'Coordinate operation', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-domservice', label: 'DomainService', description: 'Complex domain logic', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Modify aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Emit event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo-iface', label: 'Repository (I)', description: 'AppService calls domain Repository interface', logType: 'LAYER', layerId: 'layer-ddd-domain', arrowFromId: 'comp-ddd-appservice' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Infrastructure persists changes', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Dispatch domain events after persist', logType: 'EVENT', layerId: 'layer-ddd-infra' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'CLI: order:recalculate' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.console.steps(), ARCHV.ddd.console.stepOptions());
    }
};

ARCHV.ddd.message = {
    init: function() { renderDDD({ showAppService: false }); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-pay-handler', label: 'EventHandler', description: 'External event received', logType: 'REQUEST', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-acl', label: 'ACL', description: 'Translate to local language', logType: 'FLOW' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'Handle translated event', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Update Order status', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Mark as paid', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'OrderPaid event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-domservice', label: 'DomainService', description: 'Recalculate order totals after payment', logType: 'LAYER', layerId: 'layer-ddd-domain', arrowFromId: 'comp-ddd-usecase' },
            { elementId: 'comp-ddd-repo-iface', label: 'Repository (I)', description: 'DomainService calls Repository interface', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Infrastructure persists updated state', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Publish OrderPaid', logType: 'EVENT', layerId: 'layer-ddd-infra' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Message: payment.completed' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.message.steps(), ARCHV.ddd.message.stepOptions());
    }
};

/* ===== Context Map Mode ===== */
ARCHV.ddd['context-map'] = {
    init: function() { renderDDDContextMap(); },
    steps: function() {
        return [
            // 1. Core domain highlight
            { elementId: 'ctx-cm-order', label: 'Order (Core)',
              description: 'Core domain — Order Context is the strategic nucleus of the system',
              logType: 'LAYER', noArrowFromPrev: true, badgePosition: 'top' },

            // 2. ACL: Order → Payment (right neighbor)
            { elementId: 'ctx-cm-payment', label: 'Payment (ACL)',
              description: 'Payment builds an Anti-Corruption Layer to protect itself from Order model changes. ACL translates Order concepts into Payment\'s own Ubiquitous Language',
              logType: 'FLOW', arrowFromId: 'ctx-cm-order', arrowFromOffset: 0.2 },

            // 3. Shared Kernel: Order ↔ Inventory (bottom-left)
            { elementId: 'ctx-cm-inventory', label: 'Inventory (Shared Kernel)',
              description: 'Order and Inventory jointly own the ProductId value object. Both teams must coordinate and agree before changing the shared code',
              logType: 'ASYNC', arrowFromId: 'ctx-cm-order', arrowFromOffset: -0.2 },

            // 4. Customer-Supplier: Order → Shipping (bottom-right)
            { elementId: 'ctx-cm-shipping', label: 'Shipping (Supplier)',
              description: 'Order (downstream customer) negotiates the API contract with Shipping (upstream supplier). Shipping provides delivery capabilities on Order\'s terms',
              logType: 'WRITE_EVENT', arrowFromId: 'ctx-cm-order', arrowFromOffset: 0.2 },

            // 5. Conformist: Order → CRM (left neighbor)
            { elementId: 'ctx-cm-crm', label: 'CRM (Conformist)',
              description: 'CRM conforms to Order\'s model as-is — no ACL, no translation. CRM reuses Order\'s Ubiquitous Language (OrderId, OrderStatus) directly in its Customer and Segment entities',
              logType: 'RESPONSE', arrowFromId: 'ctx-cm-order', arrowFromOffset: -0.2 }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Context Map: Strategic Overview' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd['context-map'].steps(), ARCHV.ddd['context-map'].stepOptions());
    }
};

/* ===== Open Host Service Mode ===== */
ARCHV.ddd['open-host'] = {
    init: function() { renderDDDOpenHost(); },
    steps: function() {
        return [
            { elementId: 'comp-ohs-usecase', label: 'PlaceOrder', description: 'Use case orchestrates order creation', logType: 'COMMAND', layerId: 'layer-ohs-app' },
            { elementId: 'comp-ohs-aggregate', label: 'Order', description: 'Aggregate processes command and raises event', logType: 'REQUEST', layerId: 'layer-ohs-domain' },
            { elementId: 'comp-ohs-event', label: 'OrderPlaced', description: 'Domain event raised by aggregate', logType: 'EVENT', layerId: 'layer-ohs-domain' },
            { elementId: 'comp-ohs-publisher', label: 'EventPublisher', description: 'Infrastructure adapter publishes event through OHS', logType: 'EVENT', layerId: 'layer-ohs-infra' },
            { elementId: 'comp-ohs-service', label: 'OHS', description: 'Open Host Service exposes Published Language (OpenAPI)', logType: 'FLOW' },
            { elementId: 'comp-ohs-payment', label: 'Payment', description: 'Payment receives OrderPlaced via OHS', logType: 'ASYNC', arrowFromId: 'comp-ohs-service' },
            { elementId: 'comp-ohs-shipping', label: 'Shipping', description: 'Shipping receives OrderPlaced via OHS', logType: 'ASYNC', parallel: true, arrowFromId: 'comp-ohs-service' },
            { elementId: 'comp-ohs-analytics', label: 'Analytics', description: 'Analytics receives OrderPlaced via OHS', logType: 'ASYNC', parallel: true, arrowFromId: 'comp-ohs-service' },
            { elementId: 'comp-ohs-payment', label: 'Payment', description: 'Translates to PaymentRequired in local language', logType: 'LAYER', arrowFromId: 'comp-ohs-service', arrowFromOffset: -0.15, arrowToOffset: 0.2 },
            { elementId: 'comp-ohs-shipping', label: 'Shipping', description: 'Translates to ShipmentRequested in local language', logType: 'LAYER', parallel: true, arrowFromId: 'comp-ohs-service', arrowFromOffset: 0.05, arrowToOffset: 0.2 },
            { elementId: 'comp-ohs-analytics', label: 'Analytics', description: 'Translates to SaleRecorded in local language', logType: 'LAYER', parallel: true, arrowFromId: 'comp-ohs-service', arrowFromOffset: 0.15, arrowToOffset: -0.2 }
        ];
    },
    stepOptions: function() { return { requestLabel: 'OHS: Order.place() → Published Language' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd['open-host'].steps(), ARCHV.ddd['open-host'].stepOptions());
    }
};

/* ===== Saga Mode ===== */
ARCHV.ddd.saga = {
    init: function() { renderDDDSaga(); },
    steps: function() {
        return [
            { elementId: 'comp-saga-orchestrator', label: 'Saga', description: 'Saga starts: state → ORDER_PENDING', logType: 'REQUEST' },
            { elementId: 'comp-saga-order-cmd', label: 'CreateOrder', description: 'Saga sends CreateOrder command', logType: 'COMMAND', arrowFromId: 'comp-saga-orchestrator', arrowFromOffset: -0.2 },
            { elementId: 'comp-saga-order-event', label: 'OrderConfirmed', description: 'Order context confirms: OrderConfirmed event', logType: 'EVENT' },
            { elementId: 'comp-saga-eventbus', label: 'EventBus', description: 'Event routed through bus to Saga', logType: 'ASYNC' },
            { elementId: 'comp-saga-orchestrator', label: 'Saga', description: 'Saga state → ORDER_CONFIRMED', logType: 'FLOW', arrowFromId: 'comp-saga-eventbus', arrowFromOffset: -0.15, arrowToOffset: -0.15 },
            { elementId: 'comp-saga-pay-cmd', label: 'ProcessPayment', description: 'Saga sends ProcessPayment command', logType: 'COMMAND', arrowFromId: 'comp-saga-orchestrator' },
            { elementId: 'comp-saga-pay-event', label: 'PaymentCompleted', description: 'Payment context confirms: PaymentCompleted event', logType: 'EVENT' },
            { elementId: 'comp-saga-eventbus', label: 'EventBus', description: 'Event routed through bus to Saga', logType: 'ASYNC' },
            { elementId: 'comp-saga-orchestrator', label: 'Saga', description: 'Saga state → PAYMENT_COMPLETED', logType: 'FLOW', arrowFromId: 'comp-saga-eventbus', arrowFromOffset: 0.15, arrowToOffset: 0.15 },
            { elementId: 'comp-saga-ship-cmd', label: 'CreateShipment', description: 'Saga sends CreateShipment command', logType: 'COMMAND', arrowFromId: 'comp-saga-orchestrator', arrowFromOffset: 0.2 },
            { elementId: 'comp-saga-ship-event', label: 'ShipmentCreated', description: 'Shipping context confirms: ShipmentCreated event', logType: 'EVENT' },
            { elementId: 'comp-saga-orchestrator', label: 'Saga', description: 'Saga state → COMPLETED. All steps successful.', logType: 'RESPONSE', arrowFromId: 'comp-saga-ship-event' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Saga: PlaceOrder workflow' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.saga.steps(), ARCHV.ddd.saga.stepOptions());
    }
};

/* ===== Saga Failure Mode: Compensating Transactions ===== */
ARCHV.ddd['saga-fail'] = {
    init: function() { renderDDDSagaFail(); },
    steps: function() {
        return [
            { elementId: 'comp-sagaf-orchestrator', label: 'Saga', description: 'Saga starts: state → ORDER_PENDING', logType: 'REQUEST' },
            { elementId: 'comp-sagaf-order-cmd', label: 'CreateOrder', description: 'Saga sends CreateOrder command', logType: 'COMMAND', arrowFromId: 'comp-sagaf-orchestrator', arrowFromOffset: -0.2 },
            { elementId: 'comp-sagaf-order-event', label: 'OrderConfirmed', description: 'Order context confirms: OrderConfirmed event ✓', logType: 'EVENT' },
            { elementId: 'comp-sagaf-eventbus', label: 'EventBus', description: 'Event routed through bus to Saga', logType: 'ASYNC' },
            { elementId: 'comp-sagaf-orchestrator', label: 'Saga', description: 'Saga state → ORDER_CONFIRMED', logType: 'FLOW', arrowFromId: 'comp-sagaf-eventbus', arrowFromOffset: -0.45, arrowToOffset: -0.4 },
            { elementId: 'comp-sagaf-pay-cmd', label: 'ProcessPayment', description: 'Saga sends ProcessPayment command', logType: 'COMMAND', arrowFromId: 'comp-sagaf-orchestrator' },
            { elementId: 'comp-sagaf-pay-fail', label: 'PaymentFailed', description: 'Payment rejected — insufficient funds!', logType: 'ERROR' },
            { elementId: 'comp-sagaf-eventbus', label: 'EventBus', description: 'PaymentFailed event routed to Saga', logType: 'ASYNC' },
            { elementId: 'comp-sagaf-orchestrator', label: 'Saga', description: 'Saga state → COMPENSATING. Starting backward recovery.', logType: 'ERROR', arrowFromId: 'comp-sagaf-eventbus' },
            { elementId: 'comp-sagaf-cancel-cmd', label: 'CancelOrder', description: 'Compensate: Saga sends CancelOrder command (undo Step 1)', logType: 'COMPENSATE', arrowFromId: 'comp-sagaf-orchestrator', arrowFromOffset: 0.2 },
            { elementId: 'comp-sagaf-cancel-event', label: 'OrderCancelled', description: 'Order context confirms: OrderCancelled event', logType: 'COMPENSATE' },
            { elementId: 'comp-sagaf-eventbus', label: 'EventBus', description: 'OrderCancelled event routed to Saga', logType: 'ASYNC' },
            { elementId: 'comp-sagaf-orchestrator', label: 'Saga', description: 'Saga state → COMPENSATED. All compensations done.', logType: 'ERROR', arrowFromId: 'comp-sagaf-eventbus', arrowFromOffset: 0.45, arrowToOffset: 0.4 }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Saga: PlaceOrder workflow (failure)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd['saga-fail'].steps(), ARCHV.ddd['saga-fail'].stepOptions());
    }
};

/* ===== Domain Events Propagation Mode ===== */
ARCHV.ddd['domain-events'] = {
    init: function() { renderDDDDomainEvents(); },
    steps: function() {
        return [
            { elementId: 'comp-de-place', label: 'Order.place()', description: 'Business method creates order', logType: 'REQUEST' },
            { elementId: 'comp-de-event', label: 'OrderPlaced', description: 'Domain event raised: OrderPlaced', logType: 'EVENT' },
            { elementId: 'comp-de-publisher', label: 'EventPublisher', description: 'Publish event to Event Bus', logType: 'EVENT' },
            { elementId: 'comp-de-eventbus', label: 'EventBus', description: 'Event Bus distributes OrderPlaced to all subscribers', logType: 'ASYNC' },
            { elementId: 'comp-de-payment', label: 'Payment', description: 'Payment context receives OrderPlaced', logType: 'ASYNC', arrowFromId: 'comp-de-eventbus' },
            { elementId: 'comp-de-pay-acl', label: 'ACL', description: 'ACL translates OrderPlaced → PaymentRequired', logType: 'FLOW' },
            { elementId: 'comp-de-inventory', label: 'Inventory', description: 'Inventory context receives OrderPlaced', logType: 'ASYNC', noArrowFromPrev: true, arrowFromId: 'comp-de-eventbus' },
            { elementId: 'comp-de-inv-acl', label: 'ACL', description: 'ACL translates OrderPlaced → StockReservationNeeded', logType: 'FLOW' },
            { elementId: 'comp-de-notification', label: 'Notification', description: 'Notification context receives OrderPlaced', logType: 'ASYNC', noArrowFromPrev: true, arrowFromId: 'comp-de-eventbus' },
            { elementId: 'comp-de-notif-acl', label: 'ACL', description: 'ACL translates OrderPlaced → OrderConfirmationEmail', logType: 'FLOW' },
            { elementId: 'comp-de-analytics', label: 'Analytics', description: 'Analytics context receives OrderPlaced', logType: 'ASYNC', noArrowFromPrev: true, arrowFromId: 'comp-de-eventbus' },
            { elementId: 'comp-de-analytics-acl', label: 'ACL', description: 'ACL translates OrderPlaced → SaleRecorded', logType: 'FLOW' },
            { elementId: 'comp-de-eventbus', label: 'EventBus', description: 'All consumers processed — eventual consistency achieved', logType: 'RESPONSE', noArrowFromPrev: true }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Event: OrderPlaced propagation' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd['domain-events'].steps(), ARCHV.ddd['domain-events'].stepOptions());
    }
};
