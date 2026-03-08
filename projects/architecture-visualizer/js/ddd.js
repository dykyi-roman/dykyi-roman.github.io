/* ===== Domain-Driven Design ===== */

ARCHV.ddd = {};

ARCHV.ddd.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP request enters the Bounded Context through the Application layer. The Anti-Corruption Layer protects context boundaries. Domain Events propagate between contexts through the Shared Kernel or messaging.' },
    { id: 'console', label: 'Console Command', desc: 'Console command triggers a use case within a Bounded Context. Domain logic stays isolated inside the context boundary, communicating with other contexts via Domain Events.' },
    { id: 'message', label: 'Message (Cross-Context)', desc: 'Domain Event from another Bounded Context arrives through the Anti-Corruption Layer, gets translated, and processed within the local context. This demonstrates context mapping.' }
];

ARCHV.ddd.depRules = [
    { from: 'Presentation', to: 'Application', allowed: true },
    { from: 'Application', to: 'Domain', allowed: true },
    { from: 'Infrastructure', to: 'Domain', allowed: true },
    { from: 'Context A', to: 'ACL', allowed: true },
    { from: 'ACL', to: 'Context B', allowed: true },
    { from: 'Domain', to: 'Infrastructure', allowed: false },
    { from: 'Domain', to: 'Presentation', allowed: false },
    { from: 'Context A', to: 'Context B (direct)', allowed: false }
];

function renderDDD() {
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
                        ARCHV.renderComponent('comp-ddd-usecase', 'UseCase', '&#x2699;', 'Application layer orchestrator for domain operations') +
                        ARCHV.renderComponent('comp-ddd-appservice', 'AppService', '&#x1F527;', 'Coordinates use case execution without containing business logic') +
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
    }
};

ARCHV.ddd.http = {
    init: function() { renderDDD(); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'HTTP request enters Order Context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Map to command DTO', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'CreateOrder use case', logType: 'COMMAND', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-spec', label: 'Specification', description: 'Check order spec rules', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Create Order aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Add OrderLine entities', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-vo', label: 'ValueObject', description: 'Validate Money, Address VOs', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Raise OrderCreated event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist Order aggregate', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Publish OrderCreated to bus', logType: 'EVENT', layerId: 'layer-ddd-infra' },
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
    init: function() { renderDDD(); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'CLI command enters context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Parse arguments', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-appservice', label: 'AppService', description: 'Coordinate operation', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-domservice', label: 'DomainService', description: 'Complex domain logic', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Modify aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Emit event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist changes', logType: 'LAYER', layerId: 'layer-ddd-infra' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'CLI: order:recalculate' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.console.steps(), ARCHV.ddd.console.stepOptions());
    }
};

ARCHV.ddd.message = {
    init: function() { renderDDD(); },
    steps: function() {
        return [
            { elementId: 'comp-ddd-pay-handler', label: 'EventHandler', description: 'External event received', logType: 'REQUEST', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-acl', label: 'ACL', description: 'Translate to local language', logType: 'FLOW' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'Handle translated event', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Update Order status', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Mark as paid', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'OrderPaid event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist updated state', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Publish OrderPaid', logType: 'EVENT', layerId: 'layer-ddd-infra' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Message: payment.completed' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.ddd.message.steps(), ARCHV.ddd.message.stepOptions());
    }
};
