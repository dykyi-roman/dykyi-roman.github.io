/* ===== Event-Driven Architecture ===== */

ARCHV.eda = {};

ARCHV.eda.modes = [
    { id: 'http', label: 'HTTP (Publish)', desc: 'HTTP request triggers an action that publishes a domain event to the Event Bus. Multiple consumers react independently. No direct coupling between producer and consumers.' },
    { id: 'choreography', label: 'Choreography', desc: 'Services react to events independently without central coordination. Each service listens for events it cares about and publishes new events. The flow emerges from individual service reactions.' },
    { id: 'orchestration', label: 'Orchestration (Saga)', desc: 'A Saga orchestrator coordinates the distributed transaction. It sends commands to services and reacts to their responses, managing the overall workflow and compensation on failure.' }
];

ARCHV.eda.depRules = [
    { from: 'Producer', to: 'Event Bus', allowed: true },
    { from: 'Event Bus', to: 'Consumer', allowed: true },
    { from: 'Saga', to: 'Service (command)', allowed: true },
    { from: 'Service', to: 'Event Bus (event)', allowed: true },
    { from: 'Producer', to: 'Consumer (direct)', allowed: false },
    { from: 'Consumer', to: 'Producer (direct)', allowed: false },
    { from: 'Consumer A', to: 'Consumer B (direct)', allowed: false }
];

function renderEDA(mode) {
    var canvas = document.getElementById('archv-canvas');
    var sagaDisplay = mode === 'orchestration' ? '' : ' style="display:none"';

    canvas.innerHTML =
        '<div class="layout-event-mesh">' +
            '<div class="archv-mesh-label">Producers</div>' +
            '<div class="archv-producers">' +
                '<div class="archv-producer" id="comp-eda-prod-order" data-tooltip="Publishes order-related domain events (OrderCreated, OrderConfirmed, etc.)"><span>&#x1F6D2;</span><span>Order Service</span></div>' +
                '<div class="archv-producer" id="comp-eda-prod-user" data-tooltip="Publishes user-related events (UserRegistered, ProfileUpdated, etc.)"><span>&#x1F464;</span><span>User Service</span></div>' +
                '<div class="archv-producer" id="comp-eda-prod-notify" data-tooltip="Sends notifications (email, SMS, push) in response to domain events"><span>&#x1F514;</span><span>Notification</span></div>' +
            '</div>' +
            '<div class="archv-saga-box" id="comp-eda-saga" data-tooltip="Central coordinator managing distributed transaction steps and compensations"' + sagaDisplay + '>&#x1F3AF; Saga Orchestrator</div>' +
            '<div class="archv-event-bus" id="comp-eda-bus" data-tooltip="Messaging infrastructure routing events from producers to interested consumers">&#x1F4E1; Event Bus / Message Broker</div>' +
            '<div class="archv-mesh-label">Consumers</div>' +
            '<div class="archv-consumers">' +
                '<div class="archv-consumer" id="comp-eda-cons-inventory" data-tooltip="Reacts to order events by reserving or releasing stock items"><span>&#x1F4E6;</span><span>Inventory</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-payment" data-tooltip="Processes payments in response to order creation events"><span>&#x1F4B3;</span><span>Payment</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-shipping" data-tooltip="Creates shipments when orders are confirmed and paid"><span>&#x1F69A;</span><span>Shipping</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-analytics" data-tooltip="Tracks metrics and builds reports from all domain events"><span>&#x1F4CA;</span><span>Analytics</span></div>' +
            '</div>' +
        '</div>';
}

ARCHV.eda.details = {
    http: {
        principles: [
            'Producers publish events without knowledge of consumers',
            'Consumers react independently to events they subscribe to',
            'Event Bus decouples producers from consumers completely',
            'Multiple consumers can process the same event for different purposes'
        ],
        concepts: [
            { term: 'Event Bus', definition: 'A messaging infrastructure that routes events from producers to interested consumers without direct coupling.' },
            { term: 'Producer', definition: 'A service that publishes domain events when something significant happens in its domain.' },
            { term: 'Consumer', definition: 'A service that subscribes to events and reacts independently, without the producer knowing.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — producers and consumers are completely independent',
                'Scalability — add consumers without modifying producers',
                'Resilience — failure in one consumer does not affect others',
                'Natural fit for asynchronous workflows and integrations'
            ],
            cons: [
                'Eventual consistency — no immediate guarantee all consumers have processed',
                'Debugging distributed event flows is significantly harder',
                'Message ordering challenges across partitions and consumers',
                'Harder to reason about the overall system behavior'
            ],
            whenToUse: 'Best when multiple independent consumers need to react to the same events, for async workflows, and when integrating loosely coupled systems or microservices.'
        }
    },
    choreography: {
        principles: [
            'No central coordinator — each service reacts and publishes independently',
            'The overall flow emerges from individual service reactions',
            'Each service owns its decision to react or not',
            'New services can join the flow by subscribing to existing events'
        ],
        concepts: [
            { term: 'Choreography', definition: 'A coordination pattern where services react to events independently, with no central orchestrator controlling the flow.' },
            { term: 'Event Chain', definition: 'A sequence of events where one service\'s reaction triggers events that other services react to, forming an implicit workflow.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — producers and consumers are completely independent',
                'Scalability — add consumers without modifying producers',
                'Resilience — failure in one consumer does not affect others',
                'Natural fit for asynchronous workflows and integrations'
            ],
            cons: [
                'Eventual consistency — no immediate guarantee all consumers have processed',
                'Debugging distributed event flows is significantly harder',
                'Message ordering challenges across partitions and consumers',
                'Harder to reason about the overall system behavior'
            ],
            whenToUse: 'Best when multiple independent consumers need to react to the same events, for async workflows, and when integrating loosely coupled systems or microservices.'
        }
    },
    orchestration: {
        principles: [
            'Saga orchestrator manages the distributed transaction lifecycle',
            'Each step sends a command and waits for a response event',
            'Compensation logic handles failures at any step',
            'The orchestrator is the single place to understand the full workflow'
        ],
        concepts: [
            { term: 'Saga', definition: 'A pattern for managing distributed transactions by coordinating a sequence of local transactions with compensating actions for rollback.' },
            { term: 'Orchestrator', definition: 'A central coordinator that sends commands to services and reacts to their response events, managing the overall workflow.' },
            { term: 'Compensation', definition: 'A rollback action executed when a step in the saga fails, undoing the effects of previously completed steps.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — producers and consumers are completely independent',
                'Scalability — add consumers without modifying producers',
                'Resilience — failure in one consumer does not affect others',
                'Natural fit for asynchronous workflows and integrations'
            ],
            cons: [
                'Eventual consistency — no immediate guarantee all consumers have processed',
                'Debugging distributed event flows is significantly harder',
                'Message ordering challenges across partitions and consumers',
                'Harder to reason about the overall system behavior'
            ],
            whenToUse: 'Best when multiple independent consumers need to react to the same events, for async workflows, and when integrating loosely coupled systems or microservices.'
        }
    }
};

ARCHV.eda.http = {
    init: function() { renderEDA('http'); },
    steps: function() {
        return [
            { elementId: 'comp-eda-prod-order', label: 'Order Service', description: 'HTTP request creates order', logType: 'REQUEST' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Publish OrderCreated event', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-inventory', label: 'Inventory', description: 'Reserve stock items', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-payment', label: 'Payment', description: 'Initiate payment', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-shipping', label: 'Shipping', description: 'Prepare shipment', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-analytics', label: 'Analytics', description: 'Track order metric', logType: 'EVENT' },
            { elementId: 'comp-eda-prod-notify', label: 'Notification', description: 'Send confirmation email', logType: 'RESPONSE' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eda.http.steps(), ARCHV.eda.http.stepOptions());
    }
};

ARCHV.eda.choreography = {
    init: function() { renderEDA('choreography'); },
    steps: function() {
        return [
            { elementId: 'comp-eda-prod-order', label: 'Order Service', description: 'OrderCreated event emitted', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Route to subscribers', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-inventory', label: 'Inventory', description: 'StockReserved emitted', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Route StockReserved', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-payment', label: 'Payment', description: 'PaymentProcessed emitted', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Route PaymentProcessed', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-shipping', label: 'Shipping', description: 'ShipmentCreated emitted', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Route ShipmentCreated', logType: 'EVENT' },
            { elementId: 'comp-eda-prod-notify', label: 'Notification', description: 'Send shipment notification', logType: 'RESPONSE' },
            { elementId: 'comp-eda-cons-analytics', label: 'Analytics', description: 'Track full order lifecycle', logType: 'FLOW' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Choreography: Order lifecycle' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eda.choreography.steps(), ARCHV.eda.choreography.stepOptions());
    }
};

ARCHV.eda.orchestration = {
    init: function() { renderEDA('orchestration'); },
    steps: function() {
        return [
            { elementId: 'comp-eda-prod-order', label: 'Order Service', description: 'Order created, start saga', logType: 'COMMAND' },
            { elementId: 'comp-eda-saga', label: 'Saga', description: 'Begin OrderSaga', logType: 'COMMAND' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Send ReserveStock command', logType: 'COMMAND' },
            { elementId: 'comp-eda-cons-inventory', label: 'Inventory', description: 'Reserve stock', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'StockReserved reply', logType: 'EVENT' },
            { elementId: 'comp-eda-saga', label: 'Saga', description: 'Step 1 done, next: payment', logType: 'COMMAND' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Send ProcessPayment command', logType: 'COMMAND' },
            { elementId: 'comp-eda-cons-payment', label: 'Payment', description: 'Process payment', logType: 'EVENT' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'PaymentProcessed reply', logType: 'EVENT' },
            { elementId: 'comp-eda-saga', label: 'Saga', description: 'Step 2 done, next: shipping', logType: 'COMMAND' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Send CreateShipment command', logType: 'COMMAND' },
            { elementId: 'comp-eda-cons-shipping', label: 'Shipping', description: 'Create shipment', logType: 'EVENT' },
            { elementId: 'comp-eda-saga', label: 'Saga', description: 'Saga completed successfully', logType: 'RESPONSE' },
            { elementId: 'comp-eda-prod-notify', label: 'Notification', description: 'Send order confirmation', logType: 'RESPONSE' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Saga: Order fulfillment' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eda.orchestration.steps(), ARCHV.eda.orchestration.stepOptions());
    }
};
