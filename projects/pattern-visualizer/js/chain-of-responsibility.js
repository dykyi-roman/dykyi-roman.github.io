/* ===== Chain of Responsibility Pattern ===== */

PV['chain-of-responsibility'] = {};

PV['chain-of-responsibility'].modes = [
    { id: 'middleware', label: 'Middleware', desc: 'HTTP middleware pipeline: each handler (Auth, Validation, Throttle) processes the request and passes it to the next handler in the chain. If all handlers pass, the response is returned to the client.' }
];

PV['chain-of-responsibility'].depRules = [
    { name: 'Handler', role: 'Declares handle(request) and setNext(handler) — the common interface for all chain links' },
    { name: 'AuthHandler', role: 'Validates authentication tokens (JWT) before passing the request forward' },
    { name: 'ValidationHandler', role: 'Validates request data (body, params) before passing the request forward' },
    { name: 'ThrottleHandler', role: 'Checks rate limiting — rejects requests that exceed the allowed rate' },
    { name: 'Client', role: 'Sends HTTP request through the chain and receives the final response' }
];

/* ---------- Render: Middleware ---------- */

function renderChainMiddleware() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-cr-client', 'Client', {
                    methods: ['send(request)'],
                    tooltip: I18N.t('chain-of-responsibility.tooltip.client', null, 'Sends HTTP request into the middleware chain and receives the final response')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.sends_to', null, 'sends to')) +
            /* Row 2: Handler interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-cr-handler', 'Handler', {
                    stereotype: 'interface',
                    methods: ['handle(request): Response', 'setNext(handler): Handler'],
                    tooltip: I18N.t('chain-of-responsibility.tooltip.handler', null, 'Common interface for all handlers — declares handle() and setNext() to build the chain')
                }) +
            '</div>' +
            /* Row 3: Concrete handlers */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-cr-auth', 'AuthHandler', {
                    fields: ['next: Handler'],
                    methods: ['handle(request): Response'],
                    tooltip: I18N.t('chain-of-responsibility.tooltip.auth', null, 'Validates JWT authentication token — passes to next handler if valid, rejects with 401 otherwise')
                }) +
                PV.renderClass('cls-cr-valid', 'ValidationHandler', {
                    fields: ['next: Handler'],
                    methods: ['handle(request): Response'],
                    tooltip: I18N.t('chain-of-responsibility.tooltip.valid', null, 'Validates request body and parameters — passes to next handler if valid, rejects with 422 otherwise')
                }) +
                PV.renderClass('cls-cr-throttle', 'ThrottleHandler', {
                    fields: ['next: Handler'],
                    methods: ['handle(request): Response'],
                    tooltip: I18N.t('chain-of-responsibility.tooltip.throttle', null, 'Checks rate limit — passes to next handler if within limit, rejects with 429 otherwise')
                }) +
            '</div>' +
            /* Row 4: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 20px;">' +
                PV.renderObject('obj-auth', ':AuthHandler', { tooltip: I18N.t('chain-of-responsibility.tooltip.obj-auth', null, 'Runtime AuthHandler instance — token validated successfully') }) +
                PV.renderObject('obj-valid', ':ValidationHandler', { tooltip: I18N.t('chain-of-responsibility.tooltip.obj-valid', null, 'Runtime ValidationHandler instance — request data validated successfully') }) +
                PV.renderObject('obj-throttle', ':ThrottleHandler', { tooltip: I18N.t('chain-of-responsibility.tooltip.obj-throttle', null, 'Runtime ThrottleHandler instance — rate limit check passed') }) +
                PV.renderObject('obj-response', ':Response', { tooltip: I18N.t('chain-of-responsibility.tooltip.obj-response', null, 'Final HTTP 200 OK response — all middleware handlers passed') }) +
            '</div>' +
            /* Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.return', null, 'Return') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-cr-auth', 'cls-cr-handler', 'inherit');
        PV.renderRelation('cls-cr-valid', 'cls-cr-handler', 'inherit', -6);
        PV.renderRelation('cls-cr-throttle', 'cls-cr-handler', 'inherit');
        PV.renderRelation('cls-cr-auth', 'cls-cr-valid', 'depend', 8);
        PV.renderRelation('cls-cr-valid', 'cls-cr-throttle', 'depend', 8);
        PV.renderRelation('cls-cr-client', 'cls-cr-handler', 'depend');
    }, 100);
}

/* ---------- Details ---------- */

PV['chain-of-responsibility'].details = {
    middleware: {
        principles: [
            'Each handler decides whether to process the request or pass it to the next handler in the chain',
            'The client is decoupled from the concrete handlers — it sends the request to the chain, not to a specific handler',
            'Open/Closed Principle: new middleware handlers can be added without modifying existing handlers or client code',
            'Single Responsibility: each handler focuses on one concern (auth, validation, throttling)',
            'The order of handlers in the chain matters — authentication should precede validation, which precedes rate limiting'
        ],
        concepts: [
            { term: 'Handler Interface', definition: 'Declares handle(request) and setNext(handler). Every concrete handler implements this interface and holds a reference to the next handler in the chain.' },
            { term: 'Middleware Pipeline', definition: 'A chain of handlers where each handler processes the request and either passes it to the next handler or short-circuits with an error response.' },
            { term: 'Chain Link', definition: 'Each handler is a link in the chain. It processes the request and delegates to the next link via this.next.handle(request). The last link returns the final response.' },
            { term: 'Short-Circuit', definition: 'A handler can reject the request early (e.g., 401 Unauthorized, 422 Unprocessable, 429 Too Many Requests) without passing it further down the chain.' }
        ],
        tradeoffs: {
            pros: [
                'Decouples sender from receivers — the client does not know which handler will process the request',
                'Flexible chain composition — handlers can be added, removed, or reordered at runtime',
                'Single Responsibility — each handler encapsulates one processing concern',
                'Open/Closed — new handlers extend behavior without modifying existing code'
            ],
            cons: [
                'Request can go unhandled if no handler in the chain processes it',
                'Debugging is harder — the request passes through multiple handlers making the flow less obvious',
                'Performance overhead — each request traverses the entire chain even when early handlers could finalize',
                'Order dependency — incorrect handler ordering can lead to subtle bugs (e.g., validating before authenticating)'
            ],
            whenToUse: 'Use when multiple objects may handle a request and the handler is not known in advance, when you want to issue a request to one of several handlers without specifying the receiver explicitly, or when the set of handlers should be assembled dynamically (e.g., HTTP middleware pipelines, event processing, logging chains).'
        }
    }
};

/* =================================================================
   MODE: middleware
   ================================================================= */

PV['chain-of-responsibility'].middleware = {
    init: function() {
        renderChainMiddleware();
    },
    stepOptions: function() { return { requestLabel: I18N.t('chain-of-responsibility.stepLabel.middleware', null, 'HTTP request through auth → validation → throttle middleware') }; },
    steps: function() {
        return [
            {
                elementId: 'cls-cr-client',
                label: 'Client',
                description: 'Client sends HTTP request to the middleware chain',
                descriptionKey: 'chain-of-responsibility.step.middleware.0',
                logType: 'REQUEST',
                noArrowFromPrev: true,
                badgePosition: 'top'
            },
            {
                elementId: 'cls-cr-handler',
                label: 'Handler',
                description: 'Request enters the middleware chain via the Handler interface',
                descriptionKey: 'chain-of-responsibility.step.middleware.1',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-cr-auth',
                label: 'AuthHandler',
                description: 'AuthHandler checks JWT token validity',
                descriptionKey: 'chain-of-responsibility.step.middleware.2',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-auth',
                label: ':AuthHandler',
                description: 'Token valid — pass request to next handler in the chain',
                descriptionKey: 'chain-of-responsibility.step.middleware.3',
                logType: 'CREATE',
                spawnId: 'obj-auth'
            },
            {
                elementId: 'cls-cr-valid',
                label: 'ValidationHandler',
                description: 'ValidationHandler validates request body and parameters',
                descriptionKey: 'chain-of-responsibility.step.middleware.4',
                logType: 'FLOW',
                arrowFromId: 'cls-cr-auth'
            },
            {
                elementId: 'obj-valid',
                label: ':ValidationHandler',
                description: 'Validation passed — pass request to next handler in the chain',
                descriptionKey: 'chain-of-responsibility.step.middleware.5',
                logType: 'CREATE',
                spawnId: 'obj-valid'
            },
            {
                elementId: 'cls-cr-throttle',
                label: 'ThrottleHandler',
                description: 'ThrottleHandler checks rate limit for the client',
                descriptionKey: 'chain-of-responsibility.step.middleware.6',
                logType: 'FLOW',
                arrowFromId: 'cls-cr-valid'
            },
            {
                elementId: 'obj-response',
                label: ':Response',
                description: 'All handlers passed — return 200 OK response to the client',
                descriptionKey: 'chain-of-responsibility.step.middleware.7',
                logType: 'RESPONSE',
                spawnId: 'obj-response'
            }
        ];
    },
    run: function() {
        PV.animateFlow(PV['chain-of-responsibility'].middleware.steps(), PV['chain-of-responsibility'].middleware.stepOptions());
    }
};

/* ---------- Code Examples ---------- */

PV['chain-of-responsibility'].codeExamples = {
    middleware: {
        php: `<?php
declare(strict_types=1);

interface Handler
{
    public function setNext(self $handler): self;
    public function handle(array $request): array;
}

abstract class AbstractHandler implements Handler
{
    private ?Handler $next = null;

    public function setNext(Handler $handler): Handler
    {
        $this->next = $handler;
        return $handler;
    }

    public function handle(array $request): array
    {
        if ($this->next !== null) {
            return $this->next->handle($request);
        }
        return ['status' => 200, 'body' => 'OK'];
    }
}

class AuthHandler extends AbstractHandler
{
    public function handle(array $request): array
    {
        $token = $request['headers']['Authorization'] ?? '';
        if (!str_starts_with($token, 'Bearer ')) {
            return ['status' => 401, 'body' => 'Unauthorized'];
        }
        return parent::handle($request);
    }
}

class ValidationHandler extends AbstractHandler
{
    public function handle(array $request): array
    {
        if (empty($request['body']['name'])) {
            return ['status' => 422, 'body' => 'Validation failed: name required'];
        }
        return parent::handle($request);
    }
}

class ThrottleHandler extends AbstractHandler
{
    private int $requests = 0;
    private readonly int $limit;

    public function __construct(int $limit = 100)
    {
        $this->limit = $limit;
    }

    public function handle(array $request): array
    {
        if (++$this->requests > $this->limit) {
            return ['status' => 429, 'body' => 'Too Many Requests'];
        }
        return parent::handle($request);
    }
}

// Build the chain: Auth -> Validation -> Throttle
$auth = new AuthHandler();
$validation = new ValidationHandler();
$throttle = new ThrottleHandler(limit: 100);

$auth->setNext($validation)->setNext($throttle);

// Client sends request through the chain
$request = [
    'headers' => ['Authorization' => 'Bearer abc123'],
    'body'    => ['name' => 'John'],
];
$response = $auth->handle($request);
// ['status' => 200, 'body' => 'OK']`,

        go: `package main

import "fmt"

type Request struct {
	Headers map[string]string
	Body    map[string]string
}

type Response struct {
	Status int
	Body   string
}

type Handler interface {
	SetNext(handler Handler) Handler
	Handle(req Request) Response
}

type BaseHandler struct {
	next Handler
}

func (b *BaseHandler) SetNext(handler Handler) Handler {
	b.next = handler
	return handler
}

func (b *BaseHandler) HandleNext(req Request) Response {
	if b.next != nil {
		return b.next.Handle(req)
	}
	return Response{Status: 200, Body: "OK"}
}

type AuthHandler struct{ BaseHandler }

func (h *AuthHandler) Handle(req Request) Response {
	token := req.Headers["Authorization"]
	if len(token) < 7 || token[:7] != "Bearer " {
		return Response{Status: 401, Body: "Unauthorized"}
	}
	return h.HandleNext(req)
}

type ValidationHandler struct{ BaseHandler }

func (h *ValidationHandler) Handle(req Request) Response {
	if req.Body["name"] == "" {
		return Response{Status: 422, Body: "Validation failed: name required"}
	}
	return h.HandleNext(req)
}

type ThrottleHandler struct {
	BaseHandler
	limit    int
	requests int
}

func (h *ThrottleHandler) Handle(req Request) Response {
	h.requests++
	if h.requests > h.limit {
		return Response{Status: 429, Body: "Too Many Requests"}
	}
	return h.HandleNext(req)
}

func main() {
	auth := &AuthHandler{}
	validation := &ValidationHandler{}
	throttle := &ThrottleHandler{limit: 100}

	auth.SetNext(validation).SetNext(throttle)

	req := Request{
		Headers: map[string]string{"Authorization": "Bearer abc123"},
		Body:    map[string]string{"name": "John"},
	}
	resp := auth.Handle(req)
	fmt.Printf("Status: %d, Body: %s\\n", resp.Status, resp.Body)
}`,

        python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Self, override


@dataclass(slots=True)
class Request:
    headers: dict[str, str] = field(default_factory=dict)
    body: dict[str, str] = field(default_factory=dict)


@dataclass(slots=True)
class Response:
    status: int = 200
    body: str = "OK"


class Handler(ABC):
    _next: Self | None = None

    def set_next(self, handler: Self) -> Self:
        self._next = handler
        return handler

    @abstractmethod
    def handle(self, request: Request) -> Response: ...

    def handle_next(self, request: Request) -> Response:
        if self._next is not None:
            return self._next.handle(request)
        return Response(status=200, body="OK")


class AuthHandler(Handler):
    @override
    def handle(self, request: Request) -> Response:
        token = request.headers.get("Authorization", "")
        if not token.startswith("Bearer "):
            return Response(status=401, body="Unauthorized")
        return self.handle_next(request)


class ValidationHandler(Handler):
    @override
    def handle(self, request: Request) -> Response:
        if not request.body.get("name"):
            return Response(status=422, body="Validation failed: name required")
        return self.handle_next(request)


class ThrottleHandler(Handler):
    def __init__(self, limit: int = 100) -> None:
        super().__init__()
        self._limit = limit
        self._requests = 0

    @override
    def handle(self, request: Request) -> Response:
        self._requests += 1
        if self._requests > self._limit:
            return Response(status=429, body="Too Many Requests")
        return self.handle_next(request)


# Build the chain: Auth -> Validation -> Throttle
auth = AuthHandler()
validation = ValidationHandler()
throttle = ThrottleHandler(limit=100)

auth.set_next(validation).set_next(throttle)

# Client sends request through the chain
request = Request(
    headers={"Authorization": "Bearer abc123"},
    body={"name": "John"},
)
response = auth.handle(request)
print(f"Status: {response.status}, Body: {response.body}")`,

        rust: `use std::fmt;

struct Request {
    headers: Vec<(&'static str, String)>,
    body: Vec<(&'static str, String)>,
}

impl Request {
    fn header(&self, key: &str) -> Option<&str> {
        self.headers.iter().find(|(k, _)| *k == key).map(|(_, v)| v.as_str())
    }

    fn body_field(&self, key: &str) -> Option<&str> {
        self.body.iter().find(|(k, _)| *k == key).map(|(_, v)| v.as_str())
    }
}

struct Response {
    status: u16,
    body: String,
}

impl fmt::Display for Response {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Status: {}, Body: {}", self.status, self.body)
    }
}

trait Handler {
    fn set_next(&mut self, next: Box<dyn Handler>);
    fn handle(&mut self, req: &Request) -> Response;
}

struct AuthHandler {
    next: Option<Box<dyn Handler>>,
}

impl AuthHandler {
    fn new() -> Self { Self { next: None } }
}

impl Handler for AuthHandler {
    fn set_next(&mut self, next: Box<dyn Handler>) { self.next = Some(next); }

    fn handle(&mut self, req: &Request) -> Response {
        let token = req.header("Authorization").unwrap_or("");
        if !token.starts_with("Bearer ") {
            return Response { status: 401, body: "Unauthorized".into() };
        }
        match &mut self.next {
            Some(next) => next.handle(req),
            None => Response { status: 200, body: "OK".into() },
        }
    }
}

struct ValidationHandler {
    next: Option<Box<dyn Handler>>,
}

impl ValidationHandler {
    fn new() -> Self { Self { next: None } }
}

impl Handler for ValidationHandler {
    fn set_next(&mut self, next: Box<dyn Handler>) { self.next = Some(next); }

    fn handle(&mut self, req: &Request) -> Response {
        if req.body_field("name").unwrap_or("").is_empty() {
            return Response { status: 422, body: "Validation failed: name required".into() };
        }
        match &mut self.next {
            Some(next) => next.handle(req),
            None => Response { status: 200, body: "OK".into() },
        }
    }
}

struct ThrottleHandler {
    next: Option<Box<dyn Handler>>,
    limit: u32,
    requests: u32,
}

impl ThrottleHandler {
    fn new(limit: u32) -> Self { Self { next: None, limit, requests: 0 } }
}

impl Handler for ThrottleHandler {
    fn set_next(&mut self, next: Box<dyn Handler>) { self.next = Some(next); }

    fn handle(&mut self, req: &Request) -> Response {
        self.requests += 1;
        if self.requests > self.limit {
            return Response { status: 429, body: "Too Many Requests".into() };
        }
        match &mut self.next {
            Some(next) => next.handle(req),
            None => Response { status: 200, body: "OK".into() },
        }
    }
}

fn main() {
    let throttle = ThrottleHandler::new(100);
    let mut validation = ValidationHandler::new();
    validation.set_next(Box::new(throttle));
    let mut auth = AuthHandler::new();
    auth.set_next(Box::new(validation));

    let req = Request {
        headers: vec![("Authorization", "Bearer abc123".into())],
        body: vec![("name", "John".into())],
    };
    let resp = auth.handle(&req);
    println!("{resp}");
}`
    }
};
