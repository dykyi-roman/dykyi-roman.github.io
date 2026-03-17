/* ===== Strategy Pattern ===== */

PV['strategy'] = {};

PV['strategy'].modes = [
    { id: 'navigation', label: 'Route Navigation', desc: 'Navigator (context) holds a reference to a RouteStrategy and delegates route calculation. DrivingStrategy, WalkingStrategy, and TransitStrategy each implement buildRoute() differently. The client can swap strategies at runtime without changing the Navigator.' }
];

PV['strategy'].depRules = [
    { name: 'Navigator (Context)', role: 'Maintains a reference to the current strategy and delegates route building' },
    { name: 'RouteStrategy (interface)', role: 'Declares the buildRoute(origin, destination) contract' },
    { name: 'DrivingStrategy', role: 'Calculates the fastest driving route' },
    { name: 'WalkingStrategy', role: 'Calculates a walking route' },
    { name: 'TransitStrategy', role: 'Calculates a public transit route' },
    { name: 'Client', role: 'Configures the Navigator with a concrete strategy' }
];

/* ---------- Shared render functions ---------- */

function renderStrategyNavigation() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-sg-client', 'Client', {
                    methods: ['setStrategy(strategy)'],
                    tooltip: I18N.t('strategy.tooltip.client', null, 'Client configures the Navigator with a concrete RouteStrategy at runtime')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.configures', null, 'configures')) +
            /* Row 2: Navigator (Context) */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-sg-context', 'Navigator', {
                    fields: ['strategy: RouteStrategy'],
                    methods: ['buildRoute(a, b): Route'],
                    tooltip: I18N.t('strategy.tooltip.context', null, 'Context that holds a RouteStrategy reference and delegates buildRoute() calls to it')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.delegates', null, 'delegates')) +
            /* Row 3: RouteStrategy interface */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-sg-strategy', 'RouteStrategy', {
                    stereotype: 'interface',
                    methods: ['buildRoute(a, b): Route'],
                    tooltip: I18N.t('strategy.tooltip.strategy', null, 'Strategy interface declaring buildRoute() — all concrete strategies implement this contract')
                }) +
            '</div>' +
            /* Row 4: Concrete strategies */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-sg-driving', 'DrivingStrategy', {
                    methods: ['buildRoute(a, b): Route'],
                    tooltip: I18N.t('strategy.tooltip.driving', null, 'Concrete strategy that calculates the fastest driving route between two points')
                }) +
                PV.renderClass('cls-sg-walking', 'WalkingStrategy', {
                    methods: ['buildRoute(a, b): Route'],
                    tooltip: I18N.t('strategy.tooltip.walking', null, 'Concrete strategy that calculates a walking route between two points')
                }) +
                PV.renderClass('cls-sg-transit', 'TransitStrategy', {
                    methods: ['buildRoute(a, b): Route'],
                    tooltip: I18N.t('strategy.tooltip.transit', null, 'Concrete strategy that calculates a public transit route between two points')
                }) +
            '</div>' +
            /* Row 5: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 20px;">' +
                PV.renderObject('obj-driving', ':DrivingStrategy', { tooltip: I18N.t('strategy.tooltip.obj-driving', null, 'Runtime instance of DrivingStrategy calculating a driving route') }) +
                PV.renderObject('obj-walking', ':WalkingStrategy', { tooltip: I18N.t('strategy.tooltip.obj-walking', null, 'Runtime instance of WalkingStrategy calculating a walking route') }) +
                PV.renderObject('obj-transit', ':TransitStrategy', { tooltip: I18N.t('strategy.tooltip.obj-transit', null, 'Runtime instance of TransitStrategy calculating a transit route') }) +
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
        PV.renderRelation('cls-sg-driving', 'cls-sg-strategy', 'inherit');
        PV.renderRelation('cls-sg-walking', 'cls-sg-strategy', 'inherit', -6);
        PV.renderRelation('cls-sg-transit', 'cls-sg-strategy', 'inherit');
        PV.renderRelation('cls-sg-context', 'cls-sg-strategy', 'compose');
    }, 50);
}

/* ---------- Details ---------- */

PV['strategy'].details = {
    navigation: {
        principles: [
            'Strategy encapsulation: each algorithm is encapsulated in its own class behind a common interface',
            'Open/Closed Principle: new strategies can be added without modifying the Navigator or existing strategies',
            'Composition over inheritance: the Navigator holds a strategy reference instead of subclassing for each algorithm',
            'Context delegation: the Navigator delegates route building entirely to the strategy object',
            'Runtime flexibility: strategies can be swapped at runtime, allowing dynamic behavior changes'
        ],
        concepts: [
            { term: 'Context', definition: 'The Navigator class that maintains a reference to a RouteStrategy and delegates the buildRoute() call. It is agnostic to the concrete strategy being used.' },
            { term: 'Strategy', definition: 'The RouteStrategy interface that declares the buildRoute(origin, destination) contract. All concrete strategies must implement this method.' },
            { term: 'Concrete Strategy', definition: 'DrivingStrategy, WalkingStrategy, and TransitStrategy each implement the RouteStrategy interface with their own algorithm for calculating a route.' },
            { term: 'Client', definition: 'The code that creates a concrete strategy and passes it to the Navigator. The client decides which strategy to use but does not implement the algorithm itself.' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates conditional logic — no if/else or switch for choosing algorithms',
                'Open/Closed Principle — add new route strategies without modifying existing code',
                'Runtime swapping — change the navigation algorithm dynamically based on user preference',
                'Testability — each strategy can be unit tested independently of the Navigator'
            ],
            cons: [
                'Clients must be aware of all available strategies to choose the right one',
                'Adds extra classes — one per algorithm, which can increase codebase size',
                'If strategies share significant logic, duplication may arise without careful design',
                'Overhead for simple cases where a single algorithm would suffice'
            ],
            whenToUse: 'Use when you have multiple algorithms for a specific task and want to switch between them at runtime, when you want to isolate algorithm logic from the code that uses it, or when a class has a large conditional that selects among behavioral variants.'
        }
    }
};

/* ---------- Mode: navigation ---------- */

PV['strategy'].navigation = {
    init: function() {
        renderStrategyNavigation();
    },
    steps: function() {
        return [
            { elementId: 'cls-sg-client', label: 'Client', description: 'Client sets DrivingStrategy on Navigator', descriptionKey: 'strategy.step.navigation.0', logType: 'REQUEST' },
            { elementId: 'cls-sg-context', label: 'Navigator', description: 'Navigator.buildRoute("A", "B") called', descriptionKey: 'strategy.step.navigation.1', logType: 'FLOW' },
            { elementId: 'cls-sg-strategy', label: 'RouteStrategy', description: 'Delegates to strategy.buildRoute()', descriptionKey: 'strategy.step.navigation.2', logType: 'FLOW' },
            { elementId: 'cls-sg-driving', label: 'DrivingStrategy', description: 'DrivingStrategy calculates fastest road route', descriptionKey: 'strategy.step.navigation.3', logType: 'FLOW' },
            { elementId: 'obj-driving', label: ':DrivingStrategy', description: 'Returns Route with 15km, 20min ETA', descriptionKey: 'strategy.step.navigation.4', logType: 'RESPONSE', spawnId: 'obj-driving' },
            { elementId: 'cls-sg-client', label: 'Client', description: 'Client swaps to WalkingStrategy', descriptionKey: 'strategy.step.navigation.5', logType: 'REQUEST', arrowFromId: 'cls-sg-client', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'obj-walking', label: ':WalkingStrategy', description: 'WalkingStrategy: 2km walk, 25min ETA', descriptionKey: 'strategy.step.navigation.6', logType: 'RESPONSE', spawnId: 'obj-walking', arrowFromId: 'cls-sg-walking' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('strategy.stepLabel.navigation', null, 'Navigate route via Strategy pattern') }; },
    run: function() {
        PV.animateFlow(PV['strategy'].navigation.steps(), PV['strategy'].navigation.stepOptions());
    }
};

PV['strategy'].codeExamples = {
    navigation: {
        php: `<?php
declare(strict_types=1);

interface RouteStrategy
{
    public function buildRoute(string $origin, string $destination): array;
}

readonly class DrivingStrategy implements RouteStrategy
{
    public function buildRoute(string $origin, string $destination): array
    {
        // Calculate fastest driving route
        return [
            'mode'     => 'driving',
            'origin'   => $origin,
            'dest'     => $destination,
            'distance' => '15km',
            'eta'      => '20min',
        ];
    }
}

readonly class WalkingStrategy implements RouteStrategy
{
    public function buildRoute(string $origin, string $destination): array
    {
        // Calculate walking route
        return [
            'mode'     => 'walking',
            'origin'   => $origin,
            'dest'     => $destination,
            'distance' => '2km',
            'eta'      => '25min',
        ];
    }
}

readonly class TransitStrategy implements RouteStrategy
{
    public function buildRoute(string $origin, string $destination): array
    {
        // Calculate public transit route
        return [
            'mode'     => 'transit',
            'origin'   => $origin,
            'dest'     => $destination,
            'distance' => '12km',
            'eta'      => '35min',
        ];
    }
}

class Navigator
{
    private RouteStrategy $strategy;

    public function setStrategy(RouteStrategy $strategy): void
    {
        $this->strategy = $strategy;
    }

    public function buildRoute(string $origin, string $destination): array
    {
        return $this->strategy->buildRoute($origin, $destination);
    }
}

// Client
$navigator = new Navigator();

$navigator->setStrategy(new DrivingStrategy());
$route = $navigator->buildRoute('Home', 'Office');
echo $route['mode'] . ': ' . $route['distance'] . ', ' . $route['eta'] . PHP_EOL;

$navigator->setStrategy(new WalkingStrategy());
$route = $navigator->buildRoute('Home', 'Park');
echo $route['mode'] . ': ' . $route['distance'] . ', ' . $route['eta'] . PHP_EOL;`,

        go: `package main

import "fmt"

type Route struct {
	Mode     string
	Origin   string
	Dest     string
	Distance string
	ETA      string
}

type RouteStrategy interface {
	BuildRoute(origin, destination string) Route
}

type DrivingStrategy struct{}

func (d *DrivingStrategy) BuildRoute(origin, destination string) Route {
	return Route{
		Mode:     "driving",
		Origin:   origin,
		Dest:     destination,
		Distance: "15km",
		ETA:      "20min",
	}
}

type WalkingStrategy struct{}

func (w *WalkingStrategy) BuildRoute(origin, destination string) Route {
	return Route{
		Mode:     "walking",
		Origin:   origin,
		Dest:     destination,
		Distance: "2km",
		ETA:      "25min",
	}
}

type TransitStrategy struct{}

func (t *TransitStrategy) BuildRoute(origin, destination string) Route {
	return Route{
		Mode:     "transit",
		Origin:   origin,
		Dest:     destination,
		Distance: "12km",
		ETA:      "35min",
	}
}

type Navigator struct {
	strategy RouteStrategy
}

func (n *Navigator) SetStrategy(s RouteStrategy) {
	n.strategy = s
}

func (n *Navigator) BuildRoute(origin, destination string) Route {
	return n.strategy.BuildRoute(origin, destination)
}

func main() {
	nav := &Navigator{}

	nav.SetStrategy(&DrivingStrategy{})
	route := nav.BuildRoute("Home", "Office")
	fmt.Printf("%s: %s, %s\\n", route.Mode, route.Distance, route.ETA)

	nav.SetStrategy(&WalkingStrategy{})
	route = nav.BuildRoute("Home", "Park")
	fmt.Printf("%s: %s, %s\\n", route.Mode, route.Distance, route.ETA)
}`,

        python: `from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import override


@dataclass(frozen=True)
class Route:
    mode: str
    origin: str
    dest: str
    distance: str
    eta: str


class RouteStrategy(ABC):
    @abstractmethod
    def build_route(self, origin: str, destination: str) -> Route: ...


class DrivingStrategy(RouteStrategy):
    @override
    def build_route(self, origin: str, destination: str) -> Route:
        return Route(
            mode="driving",
            origin=origin,
            dest=destination,
            distance="15km",
            eta="20min",
        )


class WalkingStrategy(RouteStrategy):
    @override
    def build_route(self, origin: str, destination: str) -> Route:
        return Route(
            mode="walking",
            origin=origin,
            dest=destination,
            distance="2km",
            eta="25min",
        )


class TransitStrategy(RouteStrategy):
    @override
    def build_route(self, origin: str, destination: str) -> Route:
        return Route(
            mode="transit",
            origin=origin,
            dest=destination,
            distance="12km",
            eta="35min",
        )


class Navigator:
    def __init__(self) -> None:
        self._strategy: RouteStrategy | None = None

    def set_strategy(self, strategy: RouteStrategy) -> None:
        self._strategy = strategy

    def build_route(self, origin: str, destination: str) -> Route:
        if self._strategy is None:
            raise RuntimeError("Strategy not set")
        return self._strategy.build_route(origin, destination)


# Client
navigator = Navigator()

navigator.set_strategy(DrivingStrategy())
route = navigator.build_route("Home", "Office")
print(f"{route.mode}: {route.distance}, {route.eta}")

navigator.set_strategy(WalkingStrategy())
route = navigator.build_route("Home", "Park")
print(f"{route.mode}: {route.distance}, {route.eta}")`,

        rust: `trait RouteStrategy {
    fn build_route(&self, origin: &str, destination: &str) -> Route;
}

struct Route {
    mode: String,
    origin: String,
    dest: String,
    distance: String,
    eta: String,
}

struct DrivingStrategy;

impl RouteStrategy for DrivingStrategy {
    fn build_route(&self, origin: &str, destination: &str) -> Route {
        Route {
            mode: "driving".into(),
            origin: origin.into(),
            dest: destination.into(),
            distance: "15km".into(),
            eta: "20min".into(),
        }
    }
}

struct WalkingStrategy;

impl RouteStrategy for WalkingStrategy {
    fn build_route(&self, origin: &str, destination: &str) -> Route {
        Route {
            mode: "walking".into(),
            origin: origin.into(),
            dest: destination.into(),
            distance: "2km".into(),
            eta: "25min".into(),
        }
    }
}

struct TransitStrategy;

impl RouteStrategy for TransitStrategy {
    fn build_route(&self, origin: &str, destination: &str) -> Route {
        Route {
            mode: "transit".into(),
            origin: origin.into(),
            dest: destination.into(),
            distance: "12km".into(),
            eta: "35min".into(),
        }
    }
}

struct Navigator {
    strategy: Option<Box<dyn RouteStrategy>>,
}

impl Navigator {
    fn new() -> Self {
        Self { strategy: None }
    }

    fn set_strategy(&mut self, strategy: Box<dyn RouteStrategy>) {
        self.strategy = Some(strategy);
    }

    fn build_route(&self, origin: &str, destination: &str) -> Route {
        self.strategy
            .as_ref()
            .expect("Strategy not set")
            .build_route(origin, destination)
    }
}

fn main() {
    let mut nav = Navigator::new();

    nav.set_strategy(Box::new(DrivingStrategy));
    let route = nav.build_route("Home", "Office");
    println!("{}: {}, {}", route.mode, route.distance, route.eta);

    nav.set_strategy(Box::new(WalkingStrategy));
    let route = nav.build_route("Home", "Park");
    println!("{}: {}, {}", route.mode, route.distance, route.eta);
}`
    }
};
