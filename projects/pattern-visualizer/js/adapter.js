/* ===== Adapter Pattern ===== */

PV['adapter'] = {};

PV['adapter'].modes = [
    { id: 'payment', label: 'Payment Gateway', desc: 'StripeAdapter adapts the StripeAPI to the PaymentProcessor interface. The client calls pay(amount) on the processor without knowing the underlying payment service. The adapter translates the call into the Stripe-specific createCharge() method.' }
];

PV['adapter'].depRules = [
    { name: 'Target (PaymentProcessor)', role: 'Defines the interface the client expects' },
    { name: 'Adapter (StripeAdapter)', role: 'Converts the Target interface to the Adaptee interface' },
    { name: 'Adaptee (StripeAPI)', role: 'The existing class with an incompatible interface' },
    { name: 'Client', role: 'Uses the Target interface to interact with the Adaptee through the Adapter' }
];

/* ---------- Shared render functions ---------- */

function renderAdapterPayment() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-ad-client', 'Client', {
                    methods: ['processPayment(amount)'],
                    tooltip: I18N.t('adapter.tooltip.client', null, 'Client calls pay(amount) on the PaymentProcessor interface without knowing the concrete implementation')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.uses', null, 'uses')) +
            /* Row 2: PaymentProcessor interface */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-ad-target', 'PaymentProcessor', {
                    stereotype: 'interface',
                    methods: ['pay(amount): bool'],
                    tooltip: I18N.t('adapter.tooltip.target', null, 'Target interface that the client expects — defines pay(amount) contract')
                }) +
            '</div>' +
            /* Row 3: StripeAdapter + StripeAPI */
            '<div class="pv-hierarchy-row" style="gap: 100px; margin-top: 40px;">' +
                PV.renderClass('cls-ad-adapter', 'StripeAdapter', {
                    fields: ['stripeApi: StripeAPI'],
                    methods: ['pay(amount): bool'],
                    tooltip: I18N.t('adapter.tooltip.adapter', null, 'Adapter that implements PaymentProcessor and delegates to StripeAPI by converting the call')
                }) +
                PV.renderClass('cls-ad-adaptee', 'StripeAPI', {
                    methods: ['createCharge(cents, currency): string'],
                    tooltip: I18N.t('adapter.tooltip.adaptee', null, 'Adaptee with an incompatible interface — accepts cents and currency instead of a simple amount')
                }) +
            '</div>' +
            /* Row 4: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 100px; margin-top: 20px;">' +
                PV.renderObject('obj-adapter', ':StripeAdapter', { tooltip: I18N.t('adapter.tooltip.obj-adapter', null, 'Runtime instance of StripeAdapter processing the payment') }) +
                PV.renderObject('obj-adaptee', ':StripeAPI', { tooltip: I18N.t('adapter.tooltip.obj-adaptee', null, 'Runtime instance of StripeAPI executing the charge') }) +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-aggregate"></span> ' + I18N.t('ui.legend.aggregate', null, 'Aggregate') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-ad-adapter', 'cls-ad-target', 'inherit');
        PV.renderRelation('cls-ad-adapter', 'cls-ad-adaptee', 'aggregate');
        PV.renderRelation('cls-ad-client', 'cls-ad-target', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['adapter'].details = {
    payment: {
        principles: [
            'Interface conversion: the Adapter translates one interface into another that the client expects',
            'Single Responsibility: the Adapter has one job — convert between interfaces without adding business logic',
            'Open/Closed Principle: new adapters can be added for different payment services without modifying existing code',
            'Composition over inheritance: the Adapter holds a reference to the Adaptee rather than extending it',
            'Dependency Inversion: the client depends on the PaymentProcessor abstraction, not on StripeAPI directly'
        ],
        concepts: [
            { term: 'Target Interface', definition: 'The interface the client expects (PaymentProcessor). All adapters must implement this interface, enabling polymorphic usage.' },
            { term: 'Adapter', definition: 'The class that bridges the gap between Target and Adaptee. It implements the Target interface and delegates calls to the Adaptee after converting parameters.' },
            { term: 'Adaptee', definition: 'The existing class with an incompatible interface (StripeAPI). It has useful functionality but cannot be used directly by the client.' },
            { term: 'Object Adapter vs Class Adapter', definition: 'Object Adapter uses composition (holds a reference to the Adaptee). Class Adapter uses multiple inheritance (not available in most languages). Object Adapter is more flexible and widely preferred.' }
        ],
        tradeoffs: {
            pros: [
                'Decouples client from third-party APIs — swap payment providers without changing client code',
                'Single Responsibility — conversion logic is isolated in one class',
                'Open/Closed Principle — add new adapters for PayPal, Square, etc. without touching existing code',
                'Testability — easily mock the PaymentProcessor interface in unit tests'
            ],
            cons: [
                'Adds an extra layer of indirection — more classes to navigate',
                'Can mask performance issues in the Adaptee behind a simple interface',
                'If the Adaptee interface changes frequently, the Adapter must be updated too',
                'Overuse can lead to too many thin wrapper classes that add little value'
            ],
            whenToUse: 'Use when you need to integrate a class with an incompatible interface into your system, when wrapping third-party or legacy APIs, or when you want to create a reusable class that cooperates with unrelated classes having incompatible interfaces.'
        }
    }
};

/* ---------- Mode: payment ---------- */

PV['adapter'].payment = {
    init: function() {
        renderAdapterPayment();
    },
    steps: function() {
        return [
            { elementId: 'cls-ad-client', label: 'Client', description: 'Client calls processor.pay(100)', descriptionKey: 'adapter.step.payment.0', logType: 'REQUEST' },
            { elementId: 'cls-ad-target', label: 'PaymentProcessor', description: 'Polymorphic call: PaymentProcessor resolves to StripeAdapter', descriptionKey: 'adapter.step.payment.1', logType: 'FLOW' },
            { elementId: 'cls-ad-adapter', label: 'StripeAdapter', description: 'StripeAdapter.pay(100) received', descriptionKey: 'adapter.step.payment.2', logType: 'FLOW' },
            { elementId: 'cls-ad-adapter', label: 'StripeAdapter', description: 'Translate: cents = amount * 100', descriptionKey: 'adapter.step.payment.3', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-ad-adaptee', label: 'StripeAPI', description: 'Call stripeApi.createCharge(10000, "usd")', descriptionKey: 'adapter.step.payment.4', logType: 'FLOW' },
            { elementId: 'obj-adaptee', label: 'StripeAPI', description: 'StripeAPI processes charge', descriptionKey: 'adapter.step.payment.5', logType: 'FLOW', spawnId: 'obj-adaptee' },
            { elementId: 'obj-adapter', label: 'StripeAdapter', description: 'StripeAPI returns charge ID "ch_1234"', descriptionKey: 'adapter.step.payment.6', logType: 'RESPONSE', spawnId: 'obj-adapter' },
            { elementId: 'cls-ad-client', label: 'Client', description: 'StripeAdapter returns true to Client', descriptionKey: 'adapter.step.payment.7', logType: 'RESPONSE', arrowFromId: 'obj-adapter' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('adapter.stepLabel.payment', null, 'Adapt payment via Adapter pattern') }; },
    run: function() {
        PV.animateFlow(PV['adapter'].payment.steps(), PV['adapter'].payment.stepOptions());
    }
};

PV['adapter'].codeExamples = {
    payment: {
        php: `<?php
declare(strict_types=1);

interface PaymentProcessor
{
    public function pay(float $amount): bool;
}

readonly class StripeAPI
{
    public function createCharge(int $cents, string $currency): string
    {
        // Stripe-specific logic
        return 'ch_' . bin2hex(random_bytes(4));
    }
}

readonly class StripeAdapter implements PaymentProcessor
{
    public function __construct(
        private StripeAPI $stripeApi,
    ) {}

    public function pay(float $amount): bool
    {
        $cents = (int) ($amount * 100);
        $chargeId = $this->stripeApi->createCharge($cents, 'usd');

        return $chargeId !== '';
    }
}

// Client
$stripeApi = new StripeAPI();
$processor = new StripeAdapter($stripeApi);
$success = $processor->pay(100.00);
echo $success ? 'Payment succeeded' : 'Payment failed';`,

        go: `package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

type PaymentProcessor interface {
	Pay(amount float64) bool
}

type StripeAPI struct{}

func (s *StripeAPI) CreateCharge(cents int, currency string) string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return "ch_" + hex.EncodeToString(b)
}

type StripeAdapter struct {
	stripeApi *StripeAPI
}

func NewStripeAdapter(api *StripeAPI) *StripeAdapter {
	return &StripeAdapter{stripeApi: api}
}

func (a *StripeAdapter) Pay(amount float64) bool {
	cents := int(amount * 100)
	chargeId := a.stripeApi.CreateCharge(cents, "usd")
	return chargeId != ""
}

func main() {
	api := &StripeAPI{}
	var processor PaymentProcessor = NewStripeAdapter(api)
	if processor.Pay(100.00) {
		fmt.Println("Payment succeeded")
	} else {
		fmt.Println("Payment failed")
	}
}`,

        python: `from abc import ABC, abstractmethod
from typing import override
import secrets


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool: ...


class StripeAPI:
    def create_charge(self, cents: int, currency: str) -> str:
        # Stripe-specific logic
        return f"ch_{secrets.token_hex(4)}"


class StripeAdapter(PaymentProcessor):
    def __init__(self, stripe_api: StripeAPI) -> None:
        self._stripe_api = stripe_api

    @override
    def pay(self, amount: float) -> bool:
        cents = int(amount * 100)
        charge_id = self._stripe_api.create_charge(cents, "usd")
        return charge_id != ""


# Client
stripe_api = StripeAPI()
processor: PaymentProcessor = StripeAdapter(stripe_api)
success = processor.pay(100.00)
print("Payment succeeded" if success else "Payment failed")`,

        rust: `use rand::Rng;

trait PaymentProcessor {
    fn pay(&self, amount: f64) -> bool;
}

struct StripeAPI;

impl StripeAPI {
    fn create_charge(&self, cents: i64, _currency: &str) -> String {
        let id: u32 = rand::thread_rng().gen();
        format!("ch_{:08x}", id)
    }
}

struct StripeAdapter {
    stripe_api: StripeAPI,
}

impl StripeAdapter {
    fn new(stripe_api: StripeAPI) -> Self {
        Self { stripe_api }
    }
}

impl PaymentProcessor for StripeAdapter {
    fn pay(&self, amount: f64) -> bool {
        let cents = (amount * 100.0) as i64;
        let charge_id = self.stripe_api.create_charge(cents, "usd");
        !charge_id.is_empty()
    }
}

fn main() {
    let api = StripeAPI;
    let processor = StripeAdapter::new(api);
    if processor.pay(100.00) {
        println!("Payment succeeded");
    } else {
        println!("Payment failed");
    }
}`
    }
};
