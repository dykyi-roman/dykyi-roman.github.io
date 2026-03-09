/* ===== Microservices Architecture ===== */

ARCHV.microservices = {};

ARCHV.microservices.modes = [
    { id: 'sync', label: 'Sync (REST/gRPC)', desc: 'Synchronous request flows through the API Gateway to individual services. The gateway authenticates, routes, and aggregates responses. Services communicate via REST or gRPC through the gateway — never directly.' },
    { id: 'async', label: 'Async (Events)', desc: 'Event-driven communication between services via a Message Queue. Services publish domain events after state changes. Other services consume relevant events and react independently. No direct service-to-service calls.' },
    { id: 'saga', label: 'Saga Pattern', desc: 'Distributed transaction coordinated by a Saga Orchestrator. Each step is a local transaction in a service. On failure, compensating transactions are executed in reverse order to maintain data consistency.' }
];

ARCHV.microservices.depRules = [
    { from: 'Client', to: 'API Gateway', allowed: true },
    { from: 'API Gateway', to: 'Any Service', allowed: true },
    { from: 'Service', to: 'Service (via Gateway)', allowed: true },
    { from: 'Service', to: 'Service (direct)', allowed: false },
    { from: 'Service', to: 'Database (own)', allowed: true },
    { from: 'Service', to: 'Database (other)', allowed: false },
    { from: 'Service', to: 'Message Queue (publish)', allowed: true },
    { from: 'Message Queue', to: 'Service (consume)', allowed: true }
];

function renderMicroservicesDb(name) {
    return '<span class="archv-ms-db"><span class="archv-ms-db-icon">&#x1F4BE;</span>' + name + '</span>';
}

function renderMicroservices(mode) {
    var canvas = document.getElementById('archv-canvas');
    var isAsync = mode === 'async';
    var isSaga = mode === 'saga';
    var meshLabel = isAsync ? '' : 'Service Mesh (Istio / Linkerd)';

    var servicesHtml =
        '<div class="archv-ms-service-box" id="svc-user">' +
            '<div class="archv-ms-service-label">User Service</div>' +
            '<div class="archv-ms-service-components">' +
                ARCHV.renderComponent('comp-ms-user-svc', 'User Service', '&#x1F464;', 'Manages user accounts, authentication, and profile data. Owns its own user database.') +
            '</div>' +
            renderMicroservicesDb('users_db') +
        '</div>' +
        '<div class="archv-ms-service-box" id="svc-order">' +
            '<div class="archv-ms-service-label">Order Service</div>' +
            '<div class="archv-ms-service-components">' +
                ARCHV.renderComponent('comp-ms-order-svc', 'Order Service', '&#x1F6D2;', 'Handles order creation, status tracking, and order lifecycle. Orchestrates calls to Inventory and Payment via Gateway.') +
            '</div>' +
            renderMicroservicesDb('orders_db') +
        '</div>' +
        '<div class="archv-ms-service-box" id="svc-inventory">' +
            '<div class="archv-ms-service-label">Inventory Service</div>' +
            '<div class="archv-ms-service-components">' +
                ARCHV.renderComponent('comp-ms-inventory-svc', 'Inventory Service', '&#x1F4E6;', 'Manages product stock levels, reservations, and warehouse operations. Owns the inventory database.') +
            '</div>' +
            renderMicroservicesDb('inventory_db') +
        '</div>' +
        '<div class="archv-ms-service-box" id="svc-payment">' +
            '<div class="archv-ms-service-label">Payment Service</div>' +
            '<div class="archv-ms-service-components">' +
                ARCHV.renderComponent('comp-ms-payment-svc', 'Payment Service', '&#x1F4B3;', 'Processes payments, manages transactions, and handles refunds. Owns the payments database.') +
            '</div>' +
            renderMicroservicesDb('payments_db') +
        '</div>' +
        '<div class="archv-ms-service-box" id="svc-notification">' +
            '<div class="archv-ms-service-label">Notification Service</div>' +
            '<div class="archv-ms-service-components">' +
                ARCHV.renderComponent('comp-ms-notification-svc', 'Notification Service', '&#x1F514;', 'Sends emails, SMS, and push notifications. Consumes events from the Message Queue — never called directly.') +
            '</div>' +
            renderMicroservicesDb('notifications_db') +
        '</div>';

    var clientHtml =
        '<div class="archv-ms-client" id="ms-client-area">' +
            ARCHV.renderComponent('comp-ms-client', 'Client', '&#x1F4F1;', 'External client application (web, mobile, or API consumer).') +
        '</div>';

    var gatewayHtml =
        '<div class="archv-ms-gateway" id="ms-gateway-area">' +
            ARCHV.renderComponent('comp-ms-gateway', 'API Gateway', '&#x1F6E1;', 'Single entry point for all client requests. Handles routing, authentication, rate limiting, and response aggregation.') +
        '</div>';

    var queueHtml =
        '<div class="archv-ms-queue-area" id="ms-queue-area">' +
            '<div class="archv-ms-queue-box" id="ms-queue-box">' +
                ARCHV.renderComponent('comp-ms-queue', 'Message Queue', '&#x1F4E1;', 'Kafka / RabbitMQ — asynchronous message routing. Decouples producers from consumers for reliable event delivery.') +
            '</div>' +
        '</div>';

    var meshLayerOpen = !isAsync
        ? '<div class="archv-ms-mesh-layer" id="ms-mesh-layer"><span class="archv-ms-mesh-label">' + meshLabel + '</span>'
        : '<div>';
    var meshLayerClose = '</div>';

    canvas.innerHTML =
        '<div class="layout-microservices">' +
            clientHtml +
            gatewayHtml +
            meshLayerOpen +
                '<div class="archv-ms-services" id="ms-services">' +
                    servicesHtml +
                '</div>' +
            meshLayerClose +
            queueHtml +
        '</div>';
}

ARCHV.microservices.details = {
    sync: {
        principles: [
            'API Gateway is the single entry point — clients never call services directly',
            'Each service owns its data store (Database per Service pattern)',
            'Service Mesh is an infrastructure layer (sidecar proxies), not a separate service',
            'All inter-service communication goes through the gateway — no direct service-to-service calls',
            'Order Service orchestrates the workflow: calls Inventory, then Payment, then responds',
            'Use timeouts, retries, and circuit breakers to handle failures gracefully'
        ],
        concepts: [
            { term: 'API Gateway', definition: 'Reverse proxy that routes requests to appropriate services, handles authentication, rate limiting, and response aggregation.' },
            { term: 'Service Mesh', definition: 'Infrastructure layer (e.g., Istio, Linkerd) — sidecar proxies at each service managing discovery, load balancing, TLS, and observability. Not a separate node in the call chain.' },
            { term: 'Database per Service', definition: 'Each microservice owns its private database. No direct database sharing between services.' },
            { term: 'Circuit Breaker', definition: 'Pattern that prevents cascading failures by detecting failures and short-circuiting calls to unhealthy services.' }
        ],
        tradeoffs: {
            pros: [
                'Simple request-response model, easy to understand and debug',
                'Strong consistency within a single request chain',
                'Familiar HTTP/gRPC tooling and infrastructure',
                'Straightforward error handling with status codes'
            ],
            cons: [
                'Temporal coupling — caller is blocked until all downstream services respond',
                'Cascading failures if one service is slow or unavailable',
                'Increased latency with each hop in the call chain',
                'Tight coupling through API contracts'
            ],
            whenToUse: 'Best for queries and operations that need immediate, consistent responses. Use when the client expects a synchronous result and the call chain is short (2-3 hops max).'
        }
    },
    async: {
        principles: [
            'Services communicate via events through a Message Queue — no direct calls',
            'Message Queue (Kafka/RabbitMQ) ensures reliable delivery and decouples producers from consumers',
            'Notification Service is a pure event consumer — never called synchronously',
            'Each service reacts to events it cares about independently',
            'Eventual consistency — state converges over time, not immediately',
            'Events are immutable facts describing what happened, not commands'
        ],
        concepts: [
            { term: 'Domain Event', definition: 'An immutable record of something that happened in a service (e.g., OrderCreated, PaymentProcessed).' },
            { term: 'Message Queue', definition: 'Infrastructure (e.g., Kafka, RabbitMQ) that routes events from producers to interested consumers asynchronously.' },
            { term: 'Eventual Consistency', definition: 'Data across services will become consistent over time as events are processed, but may be temporarily inconsistent.' },
            { term: 'Idempotency', definition: 'Consumers must handle duplicate events safely. Processing the same event twice should produce the same result.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — services are fully independent',
                'High resilience — failures in one service do not cascade',
                'Better scalability — services process events at their own pace',
                'Natural audit trail from event streams'
            ],
            cons: [
                'Eventual consistency makes reasoning about state harder',
                'Debugging distributed event flows is challenging',
                'Message ordering and duplicate handling add complexity',
                'No immediate response to the caller'
            ],
            whenToUse: 'Best for workflows where services can react independently and immediate consistency is not required. Ideal for high-throughput systems with varying processing speeds.'
        }
    },
    saga: {
        principles: [
            'Distributed transactions are broken into a sequence of local transactions',
            'Each step has a compensating transaction to undo its effects on failure',
            'Saga Orchestrator coordinates the sequence and handles failures',
            'No distributed locks — each service commits locally',
            'Compensations must be idempotent and safe to retry'
        ],
        concepts: [
            { term: 'Saga Orchestrator', definition: 'Central coordinator that manages the saga workflow: sends commands, waits for replies, triggers compensations on failure.' },
            { term: 'Compensating Transaction', definition: 'An operation that semantically undoes a previously committed transaction (e.g., refund payment, release inventory).' },
            { term: 'Local Transaction', definition: 'Each service commits changes to its own database independently, without a global distributed transaction.' },
            { term: 'Saga Step', definition: 'A single local transaction in the saga sequence. Each step has a corresponding compensation action.' }
        ],
        tradeoffs: {
            pros: [
                'Maintains data consistency across services without distributed locks',
                'Clear workflow visibility through the orchestrator',
                'Each service remains autonomous with local transactions',
                'Failure handling is explicit and well-defined'
            ],
            cons: [
                'Complex to implement — each step needs a compensating action',
                'Eventual consistency during saga execution',
                'Orchestrator can become a single point of failure',
                'Debugging failed sagas across multiple services is difficult'
            ],
            whenToUse: 'Best for business operations that span multiple services and require data consistency (e.g., order fulfillment, booking). Use when two-phase commit is not feasible.'
        }
    }
};

/* ===== Sync Mode: Correct request/response chain ===== */
ARCHV.microservices.sync = {
    init: function() { renderMicroservices('sync'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-client', label: 'Client', description: 'HTTP POST /api/orders', logType: 'REQUEST', layerId: 'ms-client-area' },
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Receive request, authenticate via User Service', logType: 'FLOW', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-user-svc', label: 'User Service', description: 'Validate JWT token, return user context', logType: 'FLOW', layerId: 'svc-user' },
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Auth OK, route to Order Service', logType: 'RESPONSE', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-user-svc' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Create order, check inventory', logType: 'COMMAND', layerId: 'svc-order' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Check stock availability via REST', logType: 'FLOW', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Stock OK, process payment', logType: 'RESPONSE', layerId: 'svc-order', arrowFromId: 'comp-ms-inventory-svc' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Process payment via gRPC', logType: 'FLOW', layerId: 'svc-payment' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Payment confirmed, finalize order', logType: 'RESPONSE', layerId: 'svc-order', arrowFromId: 'comp-ms-payment-svc' },
            { elementId: 'comp-ms-queue', label: 'Message Queue', description: 'Publish OrderCreated event', logType: 'ASYNC', layerId: 'ms-queue-area' },
            { elementId: 'comp-ms-notification-svc', label: 'Notification Service', description: 'Consume event, send confirmation email', logType: 'EVENT', layerId: 'svc-notification' },
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Return response to client', logType: 'RESPONSE', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-order-svc' },
            { elementId: 'comp-ms-client', label: 'Client', description: 'Receive order confirmation', logType: 'RESPONSE', layerId: 'ms-client-area' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders (sync)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.sync.steps(), ARCHV.microservices.sync.stepOptions());
    }
};

/* ===== Async Mode: Event-driven via Message Queue ===== */
ARCHV.microservices.async = {
    init: function() { renderMicroservices('async'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Order created, publish OrderCreated event', logType: 'EVENT', layerId: 'svc-order' },
            { elementId: 'comp-ms-queue', label: 'Message Queue', description: 'Route OrderCreated to subscribers', logType: 'ASYNC', layerId: 'ms-queue-area' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Consume event, reserve stock', logType: 'EVENT', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-queue', label: 'Message Queue', description: 'Publish StockReserved event', logType: 'ASYNC', layerId: 'ms-queue-area', arrowFromId: 'comp-ms-inventory-svc' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Consume event, process payment', logType: 'EVENT', layerId: 'svc-payment' },
            { elementId: 'comp-ms-queue', label: 'Message Queue', description: 'Publish PaymentProcessed event', logType: 'ASYNC', layerId: 'ms-queue-area', arrowFromId: 'comp-ms-payment-svc' },
            { elementId: 'comp-ms-notification-svc', label: 'Notification Service', description: 'Consume events, send confirmation email', logType: 'EVENT', layerId: 'svc-notification' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Consume PaymentProcessed, finalize order', logType: 'EVENT', layerId: 'svc-order', arrowFromId: 'comp-ms-queue' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Event: OrderCreated (async)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.async.steps(), ARCHV.microservices.async.stepOptions());
    }
};

/* ===== Saga Mode: Orchestrator pattern ===== */
ARCHV.microservices.saga = {
    init: function() { renderMicroservices('saga'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Initiate order saga', logType: 'REQUEST', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Step 1: Reserve inventory (local tx)', logType: 'COMMAND', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Inventory reserved, proceed to payment', logType: 'RESPONSE', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-inventory-svc' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Step 2: Process payment (local tx)', logType: 'COMMAND', layerId: 'svc-payment' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Payment processed, confirm order', logType: 'RESPONSE', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-payment-svc' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Step 3: Confirm order (local tx)', logType: 'COMMAND', layerId: 'svc-order' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Order confirmed, send notification', logType: 'RESPONSE', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-order-svc' },
            { elementId: 'comp-ms-queue', label: 'Message Queue', description: 'Publish OrderCompleted event', logType: 'ASYNC', layerId: 'ms-queue-area' },
            { elementId: 'comp-ms-notification-svc', label: 'Notification Service', description: 'Consume event, send notification', logType: 'EVENT', layerId: 'svc-notification' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'If failure: compensating transactions in reverse', logType: 'ERROR', layerId: 'ms-gateway-area', arrowFromId: 'comp-ms-notification-svc' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Saga completed successfully', logType: 'RESPONSE', layerId: 'ms-gateway-area' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Saga: Order fulfillment' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.saga.steps(), ARCHV.microservices.saga.stepOptions());
    }
};