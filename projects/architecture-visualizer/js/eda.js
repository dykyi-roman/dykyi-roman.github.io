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
                '<div class="archv-producer" id="comp-eda-prod-order"><span>&#x1F6D2;</span><span>Order Service</span></div>' +
                '<div class="archv-producer" id="comp-eda-prod-user"><span>&#x1F464;</span><span>User Service</span></div>' +
                '<div class="archv-producer" id="comp-eda-prod-notify"><span>&#x1F514;</span><span>Notification</span></div>' +
            '</div>' +
            '<div class="archv-saga-box" id="comp-eda-saga"' + sagaDisplay + '>&#x1F3AF; Saga Orchestrator</div>' +
            '<div class="archv-event-bus" id="comp-eda-bus">&#x1F4E1; Event Bus / Message Broker</div>' +
            '<div class="archv-mesh-label">Consumers</div>' +
            '<div class="archv-consumers">' +
                '<div class="archv-consumer" id="comp-eda-cons-inventory"><span>&#x1F4E6;</span><span>Inventory</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-payment"><span>&#x1F4B3;</span><span>Payment</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-shipping"><span>&#x1F69A;</span><span>Shipping</span></div>' +
                '<div class="archv-consumer" id="comp-eda-cons-analytics"><span>&#x1F4CA;</span><span>Analytics</span></div>' +
            '</div>' +
        '</div>';
}

ARCHV.eda.http = {
    init: function() { renderEDA('http'); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-eda-prod-order', label: 'Order Service', description: 'HTTP request creates order', logType: 'REQUEST' },
            { elementId: 'comp-eda-bus', label: 'Event Bus', description: 'Publish OrderCreated event', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-inventory', label: 'Inventory', description: 'Reserve stock items', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-payment', label: 'Payment', description: 'Initiate payment', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-shipping', label: 'Shipping', description: 'Prepare shipment', logType: 'EVENT' },
            { elementId: 'comp-eda-cons-analytics', label: 'Analytics', description: 'Track order metric', logType: 'EVENT' },
            { elementId: 'comp-eda-prod-notify', label: 'Notification', description: 'Send confirmation email', logType: 'RESPONSE' }
        ], { requestLabel: 'HTTP POST /api/orders' });
    }
};

ARCHV.eda.choreography = {
    init: function() { renderEDA('choreography'); },
    run: function() {
        ARCHV.animateFlow([
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
        ], { requestLabel: 'Choreography: Order lifecycle' });
    }
};

ARCHV.eda.orchestration = {
    init: function() { renderEDA('orchestration'); },
    run: function() {
        ARCHV.animateFlow([
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
        ], { requestLabel: 'Saga: Order fulfillment' });
    }
};
