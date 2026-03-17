/* ===== State Pattern ===== */

PV['state'] = {};

PV['state'].modes = [
    { id: 'order', label: 'Order', desc: 'Order lifecycle state machine: an Order transitions through DraftState → PaidState → ShippedState → DeliveredState. Each state encapsulates its own behavior and decides the next transition, eliminating complex conditionals.' }
];

PV['state'].depRules = [
    { name: 'Order (Context)', role: 'Maintains current state and delegates behavior' },
    { name: 'OrderState (interface)', role: 'Declares pay(), ship(), deliver() methods' },
    { name: 'DraftState', role: 'Initial state, can transition to Paid' },
    { name: 'PaidState', role: 'Payment received, can transition to Shipped' },
    { name: 'ShippedState', role: 'In transit, can transition to Delivered' },
    { name: 'DeliveredState', role: 'Final state' }
];

/* ---------- Shared render functions ---------- */

function renderStateOrder() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Order (Context) */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-st-context', 'Order', {
                    fields: ['state: OrderState'],
                    methods: ['pay()', 'ship()', 'deliver()', 'setState(state)'],
                    tooltip: I18N.t('state.tooltip.context', null, 'Context — maintains a reference to the current state and delegates all behavior to it')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('state.arrow.delegates', null, 'delegates to')) +
            /* Row 2: OrderState interface */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-st-state', 'OrderState', {
                    stereotype: 'interface',
                    methods: ['pay(order)', 'ship(order)', 'deliver(order)'],
                    tooltip: I18N.t('state.tooltip.state', null, 'State interface — declares methods for each possible action; concrete states implement transition logic')
                }) +
            '</div>' +
            /* Row 3: Concrete states */
            '<div class="pv-hierarchy-row" style="gap: 40px; margin-top: 40px;">' +
                PV.renderClass('cls-st-draft', 'DraftState', {
                    methods: ['pay(order)'],
                    tooltip: I18N.t('state.tooltip.draft', null, 'Initial state — only pay() triggers a transition to PaidState')
                }) +
                PV.renderClass('cls-st-paid', 'PaidState', {
                    methods: ['ship(order)'],
                    tooltip: I18N.t('state.tooltip.paid', null, 'Payment received — only ship() triggers a transition to ShippedState')
                }) +
                PV.renderClass('cls-st-shipped', 'ShippedState', {
                    methods: ['deliver(order)'],
                    tooltip: I18N.t('state.tooltip.shipped', null, 'In transit — only deliver() triggers a transition to DeliveredState')
                }) +
                PV.renderClass('cls-st-delivered', 'DeliveredState', {
                    methods: [],
                    tooltip: I18N.t('state.tooltip.delivered', null, 'Final state — no further transitions allowed')
                }) +
            '</div>' +
            /* Row 4: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 40px; margin-top: 20px;">' +
                PV.renderObject('obj-draft', ':DraftState', { tooltip: I18N.t('state.tooltip.obj-draft', null, 'Runtime DraftState instance — handles pay() and transitions to PaidState') }) +
                PV.renderObject('obj-paid', ':PaidState', { tooltip: I18N.t('state.tooltip.obj-paid', null, 'Runtime PaidState instance — handles ship() and transitions to ShippedState') }) +
                PV.renderObject('obj-shipped', ':ShippedState', { tooltip: I18N.t('state.tooltip.obj-shipped', null, 'Runtime ShippedState instance — handles deliver() and transitions to DeliveredState') }) +
                PV.renderObject('obj-delivered', ':DeliveredState', { tooltip: I18N.t('state.tooltip.obj-delivered', null, 'Runtime DeliveredState instance — final state, order complete') }) +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-st-draft', 'cls-st-state', 'inherit');
        PV.renderRelation('cls-st-paid', 'cls-st-state', 'inherit', -4);
        PV.renderRelation('cls-st-shipped', 'cls-st-state', 'inherit', 4);
        PV.renderRelation('cls-st-delivered', 'cls-st-state', 'inherit');
        PV.renderRelation('cls-st-context', 'cls-st-state', 'compose');
    }, 50);
}

/* ---------- Details ---------- */

PV['state'].details = {
    order: {
        principles: [
            'State encapsulation: each state class contains only the behavior relevant to that state, hiding internal transition logic from the Context',
            'Eliminating conditionals: instead of long if/else or switch blocks on a status field, behavior is dispatched polymorphically via the current state object',
            'Open/Closed Principle: new states can be added without modifying existing state classes or the Context',
            'Single Responsibility per state: DraftState knows only how to handle pay(), PaidState only ship(), etc. — each class has one reason to change',
            'Explicit state transitions: transitions are visible in code as setState() calls inside concrete states, making the lifecycle easy to trace and debug'
        ],
        concepts: [
            { term: 'Context', definition: 'The object (Order) whose behavior changes depending on its internal state. It holds a reference to the current state and delegates method calls to it.' },
            { term: 'State', definition: 'An interface (OrderState) that declares all actions the Context can perform. Each concrete state implements these methods differently.' },
            { term: 'Concrete State', definition: 'A class (DraftState, PaidState, ShippedState, DeliveredState) that implements the State interface for a specific lifecycle phase.' },
            { term: 'Transition', definition: 'The act of replacing the current state with a new one via setState(). Triggered from within a concrete state when a valid action occurs.' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates complex conditional logic — behavior is cleanly distributed across state classes',
                'Easy to add new states without modifying existing ones (Open/Closed Principle)',
                'Each state class is small, focused, and independently testable',
                'State transitions are explicit and traceable — no hidden side effects'
            ],
            cons: [
                'Increases the number of classes — one class per state can be verbose for simple lifecycles',
                'Transitions are scattered across state classes — harder to see the full state machine at a glance',
                'Overkill when an object has only two or three states with trivial logic',
                'Context and states are tightly coupled — states must know about the Context to call setState()'
            ],
            whenToUse: 'Use when an object\'s behavior depends on its state and must change at runtime, when state-specific logic is spread across many conditionals, or when you need a clear, extensible model of an object lifecycle (e.g., order processing, document workflow, UI components).'
        }
    }
};

/* ---------- Mode: order ---------- */

PV['state'].order = {
    init: function() {
        renderStateOrder();
    },
    steps: function() {
        return [
            { elementId: 'cls-st-context', label: 'Order', description: 'New order created in DraftState', descriptionKey: 'state.step.order.0', logType: 'REQUEST' },
            { elementId: 'cls-st-draft', label: 'DraftState', description: 'Current state: Draft', descriptionKey: 'state.step.order.1', logType: 'FLOW' },
            { elementId: 'obj-draft', label: ':DraftState', description: 'DraftState: order.pay() → transition to PaidState', descriptionKey: 'state.step.order.2', logType: 'CREATE', spawnId: 'obj-draft' },
            { elementId: 'cls-st-paid', label: 'PaidState', description: 'State changed to PaidState', descriptionKey: 'state.step.order.3', logType: 'FLOW', arrowFromId: 'cls-st-draft' },
            { elementId: 'obj-paid', label: ':PaidState', description: 'PaidState: order.ship() → transition to ShippedState', descriptionKey: 'state.step.order.4', logType: 'CREATE', spawnId: 'obj-paid' },
            { elementId: 'cls-st-shipped', label: 'ShippedState', description: 'State changed to ShippedState', descriptionKey: 'state.step.order.5', logType: 'FLOW', arrowFromId: 'cls-st-paid' },
            { elementId: 'obj-shipped', label: ':ShippedState', description: 'ShippedState: order.deliver() → transition to DeliveredState', descriptionKey: 'state.step.order.6', logType: 'CREATE', spawnId: 'obj-shipped' },
            { elementId: 'obj-delivered', label: ':DeliveredState', description: 'DeliveredState: order complete, no more transitions', descriptionKey: 'state.step.order.7', logType: 'RESPONSE', spawnId: 'obj-delivered', arrowFromId: 'cls-st-delivered' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('state.stepLabel.order', null, 'Order lifecycle state transitions') }; },
    run: function() {
        PV.animateFlow(PV['state'].order.steps(), PV['state'].order.stepOptions());
    }
};

PV['state'].codeExamples = {
    order: {
        php: `<?php
declare(strict_types=1);

interface OrderState
{
    public function pay(Order $order): void;
    public function ship(Order $order): void;
    public function deliver(Order $order): void;
}

class Order
{
    private OrderState $state;

    public function __construct()
    {
        $this->state = new DraftState();
    }

    public function setState(OrderState $state): void
    {
        $this->state = $state;
    }

    public function getState(): OrderState
    {
        return $this->state;
    }

    public function pay(): void
    {
        $this->state->pay($this);
    }

    public function ship(): void
    {
        $this->state->ship($this);
    }

    public function deliver(): void
    {
        $this->state->deliver($this);
    }
}

class DraftState implements OrderState
{
    public function pay(Order $order): void
    {
        echo "Payment accepted. Transitioning to PaidState.\\n";
        $order->setState(new PaidState());
    }

    public function ship(Order $order): void
    {
        throw new \\RuntimeException('Cannot ship: order not paid yet.');
    }

    public function deliver(Order $order): void
    {
        throw new \\RuntimeException('Cannot deliver: order not shipped yet.');
    }
}

class PaidState implements OrderState
{
    public function pay(Order $order): void
    {
        throw new \\RuntimeException('Already paid.');
    }

    public function ship(Order $order): void
    {
        echo "Order shipped. Transitioning to ShippedState.\\n";
        $order->setState(new ShippedState());
    }

    public function deliver(Order $order): void
    {
        throw new \\RuntimeException('Cannot deliver: order not shipped yet.');
    }
}

class ShippedState implements OrderState
{
    public function pay(Order $order): void
    {
        throw new \\RuntimeException('Already paid.');
    }

    public function ship(Order $order): void
    {
        throw new \\RuntimeException('Already shipped.');
    }

    public function deliver(Order $order): void
    {
        echo "Order delivered. Transitioning to DeliveredState.\\n";
        $order->setState(new DeliveredState());
    }
}

class DeliveredState implements OrderState
{
    public function pay(Order $order): void
    {
        throw new \\RuntimeException('Order already delivered.');
    }

    public function ship(Order $order): void
    {
        throw new \\RuntimeException('Order already delivered.');
    }

    public function deliver(Order $order): void
    {
        throw new \\RuntimeException('Order already delivered.');
    }
}

// Client
$order = new Order();
$order->pay();     // Draft → Paid
$order->ship();    // Paid → Shipped
$order->deliver(); // Shipped → Delivered
echo get_class($order->getState()); // DeliveredState`,

        go: `package main

import "fmt"

type OrderState interface {
	Pay(order *Order)
	Ship(order *Order)
	Deliver(order *Order)
}

type Order struct {
	state OrderState
}

func NewOrder() *Order {
	return &Order{state: &DraftState{}}
}

func (o *Order) SetState(s OrderState) { o.state = s }
func (o *Order) Pay()                  { o.state.Pay(o) }
func (o *Order) Ship()                 { o.state.Ship(o) }
func (o *Order) Deliver()              { o.state.Deliver(o) }

// DraftState

type DraftState struct{}

func (s *DraftState) Pay(order *Order) {
	fmt.Println("Payment accepted. Transitioning to PaidState.")
	order.SetState(&PaidState{})
}
func (s *DraftState) Ship(order *Order)    { panic("Cannot ship: order not paid yet.") }
func (s *DraftState) Deliver(order *Order) { panic("Cannot deliver: order not shipped yet.") }

// PaidState

type PaidState struct{}

func (s *PaidState) Pay(order *Order) { panic("Already paid.") }
func (s *PaidState) Ship(order *Order) {
	fmt.Println("Order shipped. Transitioning to ShippedState.")
	order.SetState(&ShippedState{})
}
func (s *PaidState) Deliver(order *Order) { panic("Cannot deliver: order not shipped yet.") }

// ShippedState

type ShippedState struct{}

func (s *ShippedState) Pay(order *Order)  { panic("Already paid.") }
func (s *ShippedState) Ship(order *Order) { panic("Already shipped.") }
func (s *ShippedState) Deliver(order *Order) {
	fmt.Println("Order delivered. Transitioning to DeliveredState.")
	order.SetState(&DeliveredState{})
}

// DeliveredState

type DeliveredState struct{}

func (s *DeliveredState) Pay(order *Order)     { panic("Order already delivered.") }
func (s *DeliveredState) Ship(order *Order)    { panic("Order already delivered.") }
func (s *DeliveredState) Deliver(order *Order) { panic("Order already delivered.") }

func main() {
	order := NewOrder()
	order.Pay()     // Draft → Paid
	order.Ship()    // Paid → Shipped
	order.Deliver() // Shipped → Delivered
	fmt.Printf("Final state: %T\\n", order.state)
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class OrderState(ABC):
    @abstractmethod
    def pay(self, order: "Order") -> None: ...

    @abstractmethod
    def ship(self, order: "Order") -> None: ...

    @abstractmethod
    def deliver(self, order: "Order") -> None: ...


class Order:
    def __init__(self) -> None:
        self._state: OrderState = DraftState()

    @property
    def state(self) -> OrderState:
        return self._state

    def set_state(self, state: OrderState) -> None:
        self._state = state

    def pay(self) -> None:
        self._state.pay(self)

    def ship(self) -> None:
        self._state.ship(self)

    def deliver(self) -> None:
        self._state.deliver(self)


class DraftState(OrderState):
    @override
    def pay(self, order: Order) -> None:
        print("Payment accepted. Transitioning to PaidState.")
        order.set_state(PaidState())

    @override
    def ship(self, order: Order) -> None:
        raise RuntimeError("Cannot ship: order not paid yet.")

    @override
    def deliver(self, order: Order) -> None:
        raise RuntimeError("Cannot deliver: order not shipped yet.")


class PaidState(OrderState):
    @override
    def pay(self, order: Order) -> None:
        raise RuntimeError("Already paid.")

    @override
    def ship(self, order: Order) -> None:
        print("Order shipped. Transitioning to ShippedState.")
        order.set_state(ShippedState())

    @override
    def deliver(self, order: Order) -> None:
        raise RuntimeError("Cannot deliver: order not shipped yet.")


class ShippedState(OrderState):
    @override
    def pay(self, order: Order) -> None:
        raise RuntimeError("Already paid.")

    @override
    def ship(self, order: Order) -> None:
        raise RuntimeError("Already shipped.")

    @override
    def deliver(self, order: Order) -> None:
        print("Order delivered. Transitioning to DeliveredState.")
        order.set_state(DeliveredState())


class DeliveredState(OrderState):
    @override
    def pay(self, order: Order) -> None:
        raise RuntimeError("Order already delivered.")

    @override
    def ship(self, order: Order) -> None:
        raise RuntimeError("Order already delivered.")

    @override
    def deliver(self, order: Order) -> None:
        raise RuntimeError("Order already delivered.")


# Client
order = Order()
order.pay()     # Draft → Paid
order.ship()    # Paid → Shipped
order.deliver() # Shipped → Delivered
print(type(order.state).__name__)  # DeliveredState`,

        rust: `trait OrderState {
    fn pay(self: Box<Self>, order: &mut Order);
    fn ship(self: Box<Self>, order: &mut Order);
    fn deliver(self: Box<Self>, order: &mut Order);
    fn name(&self) -> &'static str;
}

struct Order {
    state: Option<Box<dyn OrderState>>,
}

impl Order {
    fn new() -> Self {
        Self { state: Some(Box::new(DraftState)) }
    }

    fn set_state(&mut self, state: Box<dyn OrderState>) {
        self.state = Some(state);
    }

    fn pay(&mut self) {
        if let Some(s) = self.state.take() {
            s.pay(self);
        }
    }

    fn ship(&mut self) {
        if let Some(s) = self.state.take() {
            s.ship(self);
        }
    }

    fn deliver(&mut self) {
        if let Some(s) = self.state.take() {
            s.deliver(self);
        }
    }

    fn state_name(&self) -> &'static str {
        self.state.as_ref().map_or("None", |s| s.name())
    }
}

// DraftState

struct DraftState;

impl OrderState for DraftState {
    fn pay(self: Box<Self>, order: &mut Order) {
        println!("Payment accepted. Transitioning to PaidState.");
        order.set_state(Box::new(PaidState));
    }
    fn ship(self: Box<Self>, _order: &mut Order) {
        panic!("Cannot ship: order not paid yet.");
    }
    fn deliver(self: Box<Self>, _order: &mut Order) {
        panic!("Cannot deliver: order not shipped yet.");
    }
    fn name(&self) -> &'static str { "DraftState" }
}

// PaidState

struct PaidState;

impl OrderState for PaidState {
    fn pay(self: Box<Self>, _order: &mut Order) {
        panic!("Already paid.");
    }
    fn ship(self: Box<Self>, order: &mut Order) {
        println!("Order shipped. Transitioning to ShippedState.");
        order.set_state(Box::new(ShippedState));
    }
    fn deliver(self: Box<Self>, _order: &mut Order) {
        panic!("Cannot deliver: order not shipped yet.");
    }
    fn name(&self) -> &'static str { "PaidState" }
}

// ShippedState

struct ShippedState;

impl OrderState for ShippedState {
    fn pay(self: Box<Self>, _order: &mut Order) {
        panic!("Already paid.");
    }
    fn ship(self: Box<Self>, _order: &mut Order) {
        panic!("Already shipped.");
    }
    fn deliver(self: Box<Self>, order: &mut Order) {
        println!("Order delivered. Transitioning to DeliveredState.");
        order.set_state(Box::new(DeliveredState));
    }
    fn name(&self) -> &'static str { "ShippedState" }
}

// DeliveredState

struct DeliveredState;

impl OrderState for DeliveredState {
    fn pay(self: Box<Self>, _order: &mut Order) {
        panic!("Order already delivered.");
    }
    fn ship(self: Box<Self>, _order: &mut Order) {
        panic!("Order already delivered.");
    }
    fn deliver(self: Box<Self>, _order: &mut Order) {
        panic!("Order already delivered.");
    }
    fn name(&self) -> &'static str { "DeliveredState" }
}

fn main() {
    let mut order = Order::new();
    order.pay();     // Draft → Paid
    order.ship();    // Paid → Shipped
    order.deliver(); // Shipped → Delivered
    println!("Final state: {}", order.state_name());
}`
    }
};
