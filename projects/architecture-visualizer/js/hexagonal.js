/* ===== Hexagonal Architecture (Ports & Adapters) ===== */

ARCHV.hexagonal = {};

ARCHV.hexagonal.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP adapter (driving) receives request, calls input port, domain processes logic, output port delegates to driven adapter (database). Ports define the interface, adapters implement it.' },
    { id: 'console', label: 'Console Command', desc: 'CLI adapter (driving) triggers the same input port. The domain core is completely agnostic to whether it was triggered by HTTP, CLI, or message.' },
    { id: 'message', label: 'Message Consumer', desc: 'Message adapter (driving) consumes from queue. The hexagonal core processes identically - only the driving adapter differs.' }
];

ARCHV.hexagonal.depRules = [
    { from: 'HTTP Adapter', to: 'Input Port', allowed: true },
    { from: 'CLI Adapter', to: 'Input Port', allowed: true },
    { from: 'Message Adapter', to: 'Input Port', allowed: true },
    { from: 'Domain', to: 'Output Port', allowed: true },
    { from: 'DB Adapter', to: 'Output Port', allowed: true },
    { from: 'Domain', to: 'HTTP Adapter', allowed: false },
    { from: 'Domain', to: 'DB Adapter', allowed: false },
    { from: 'DB Adapter', to: 'Domain', allowed: false }
];

function renderHexagonal(activeAdapter) {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-hexagonal">' +
            '<div class="archv-hex-side" id="side-driving">' +
                '<div class="archv-hex-side-label">Driving (Left)</div>' +
                ARCHV.renderComponent('comp-hex-http', 'HTTP Adapter', '&#x1F310;') +
                ARCHV.renderComponent('comp-hex-cli', 'CLI Adapter', '&#x1F4BB;') +
                ARCHV.renderComponent('comp-hex-msg', 'Message Adapter', '&#x1F4E9;') +
            '</div>' +
            '<div class="archv-hex-core" id="hex-core">' +
                '<div class="archv-hex-core-inner">' +
                    '<div class="archv-hex-core-label">Domain Core</div>' +
                    '<div class="archv-port" id="comp-hex-input-port">Input Port</div>' +
                    ARCHV.renderComponent('comp-hex-service', 'DomainService', '&#x1F3AF;') +
                    ARCHV.renderComponent('comp-hex-entity', 'Entity', '&#x1F4CB;') +
                    '<div class="archv-port" id="comp-hex-output-port">Output Port</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-hex-side" id="side-driven">' +
                '<div class="archv-hex-side-label">Driven (Right)</div>' +
                ARCHV.renderComponent('comp-hex-db', 'DB Adapter', '&#x1F4BE;') +
                ARCHV.renderComponent('comp-hex-cache', 'Cache Adapter', '&#x26A1;') +
                ARCHV.renderComponent('comp-hex-queue', 'Queue Adapter', '&#x1F4E8;') +
                ARCHV.renderComponent('comp-hex-api', 'External API', '&#x1F30D;') +
            '</div>' +
        '</div>';
}

ARCHV.hexagonal.http = {
    init: function() { renderHexagonal('http'); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-hex-http', label: 'HTTP Adapter', description: 'Driving adapter receives HTTP request', logType: 'REQUEST' },
            { elementId: 'comp-hex-input-port', label: 'Input Port', description: 'Call input port interface', logType: 'FLOW' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Execute domain logic', logType: 'LAYER' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Apply business rules', logType: 'LAYER' },
            { elementId: 'comp-hex-output-port', label: 'Output Port', description: 'Call output port interface', logType: 'FLOW' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Driven adapter persists data', logType: 'LAYER' },
            { elementId: 'comp-hex-cache', label: 'Cache Adapter', description: 'Update cache', logType: 'LAYER' },
            { elementId: 'comp-hex-input-port', label: 'Input Port', description: 'Return result through port', logType: 'RESPONSE' },
            { elementId: 'comp-hex-http', label: 'HTTP Adapter', description: 'Send HTTP response', logType: 'RESPONSE' }
        ], { requestLabel: 'HTTP PUT /api/products/42' });
    }
};

ARCHV.hexagonal.console = {
    init: function() { renderHexagonal('cli'); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-hex-cli', label: 'CLI Adapter', description: 'CLI command received', logType: 'REQUEST' },
            { elementId: 'comp-hex-input-port', label: 'Input Port', description: 'Call input port', logType: 'FLOW' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Domain logic', logType: 'LAYER' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Business rules', logType: 'LAYER' },
            { elementId: 'comp-hex-output-port', label: 'Output Port', description: 'Output port call', logType: 'FLOW' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Persist to database', logType: 'LAYER' },
            { elementId: 'comp-hex-input-port', label: 'Input Port', description: 'Return result', logType: 'RESPONSE' },
            { elementId: 'comp-hex-cli', label: 'CLI Adapter', description: 'Print output', logType: 'RESPONSE' }
        ], { requestLabel: 'CLI: product:import' });
    }
};

ARCHV.hexagonal.message = {
    init: function() { renderHexagonal('msg'); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-hex-msg', label: 'Message Adapter', description: 'Message consumed from queue', logType: 'REQUEST' },
            { elementId: 'comp-hex-input-port', label: 'Input Port', description: 'Call input port', logType: 'FLOW' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Process domain logic', logType: 'LAYER' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Apply rules', logType: 'LAYER' },
            { elementId: 'comp-hex-output-port', label: 'Output Port', description: 'Output port call', logType: 'FLOW' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Save to storage', logType: 'LAYER' },
            { elementId: 'comp-hex-queue', label: 'Queue Adapter', description: 'Publish result event', logType: 'EVENT' }
        ], { requestLabel: 'Message: inventory.updated' });
    }
};
