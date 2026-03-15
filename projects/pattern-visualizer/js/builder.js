/* ===== Builder Pattern ===== */

PV['builder'] = {};

PV['builder'].modes = [
    { id: 'house', label: 'House', desc: 'Step-by-step house construction: foundation, walls, roof, interior — Director orchestrates the sequence.' }
];

PV['builder'].depRules = [
    { name: 'Director', role: 'Constructs an object using the Builder interface in a specific order' },
    { name: 'Builder (Interface)', role: 'Declares step-by-step construction methods' },
    { name: 'Concrete Builder', role: 'Implements construction steps and tracks the product being built' },
    { name: 'Product', role: 'The complex object being constructed step by step' }
];

/* ---------- Details per mode ---------- */

PV['builder'].details = {
    house: {
        principles: [
            'Separate the construction algorithm (Director) from the object representation (Builder)',
            'The Director defines the order of construction steps; the Builder knows how to perform each step',
            'Different builders produce different representations using the same construction process',
            'The Product is assembled incrementally — each step adds one component',
            'The client retrieves the finished product from the builder, not from the director'
        ],
        concepts: [
            { term: 'Director', definition: 'Orchestrates the construction sequence. Calls builder methods in a fixed order but is decoupled from concrete product details.' },
            { term: 'HouseBuilder', definition: 'Interface declaring construction steps: buildFoundation(), buildWalls(), buildRoof(), buildInterior(). Each concrete builder implements these.' },
            { term: 'WoodenHouseBuilder', definition: 'Concrete builder that constructs a wooden house with log foundation, timber walls, shingle roof, and rustic interior.' },
            { term: 'StoneHouseBuilder', definition: 'Concrete builder that constructs a stone house with concrete foundation, stone walls, tile roof, and modern interior.' },
            { term: 'House', definition: 'Product object whose properties are set one by one during construction. Retrieved via getResult() after all steps complete.' }
        ],
        tradeoffs: {
            pros: [
                'Same construction process creates different representations (wooden vs. stone house)',
                'Construction code is isolated from representation — easy to add new builder types',
                'Fine-grained control over the construction process step by step',
                'Product is always in a valid state once construction completes'
            ],
            cons: [
                'Overall complexity increases — requires Director, Builder interface, concrete builders, and Product',
                'Overkill for simple objects that can be constructed in a single step',
                'The number of classes grows with each new product variant'
            ],
            whenToUse: 'Use when construction involves multiple steps that must follow a specific order, when the same process should create different representations, or when you want to avoid a constructor with many parameters.'
        }
    }
};

/* =================================================================
   MODE: house
   ================================================================= */

function renderBuilderHouse() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Director (right-aligned) */
            '<div class="pv-hierarchy-row" style="justify-content: flex-end; width: 100%; padding-right: 100px;">' +
                PV.renderClass('cls-director', 'Director', {
                    methods: ['constructHouse(builder)'],
                    tooltip: I18N.t('builder.tooltip.director', null, 'Orchestrates the construction sequence by calling builder methods in order')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.uses', null, 'uses')) +
            /* Row 2: HouseBuilder (right-aligned) */
            '<div class="pv-hierarchy-row" style="justify-content: flex-end; width: 100%; padding-right: 40px;">' +
                PV.renderClass('cls-house-builder', 'HouseBuilder', {
                    stereotype: 'interface',
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: I18N.t('builder.tooltip.house-builder', null, 'Abstract builder interface declaring all construction steps')
                }) +
            '</div>' +
            /* Row 3: House (with checkmarks) + :House + Concrete Builders */
            '<div class="pv-hierarchy-row" style="gap: 20px; align-items: flex-start; width: 100%;">' +
                '<div style="position: relative; margin-right: 80px;">' +
                    '<div id="obj-b-house" class="pv-object" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 10px; padding: 8px 12px; font-size: 11px; white-space: nowrap;">:House</div>' +
                    '<div class="pv-class-box" id="cls-house" data-tooltip="' + I18N.t('builder.tooltip.house', null, 'Product assembled step by step — each property is set during construction') + '">' +
                        '<div class="pv-class-header">House</div>' +
                        '<div class="pv-class-section">' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-foundation" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">foundation</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-walls" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">walls</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-roof" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">roof</span>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">' +
                                '<span id="prop-interior" class="pv-object" style="display:inline;border:none;padding:0;background:none;font-size:13px;color:#10B981;border-radius:0;text-align:left;">✓</span>' +
                                '<span style="font-size:11px;font-family:inherit;color:var(--pv-text-light);">interior</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                PV.renderClass('cls-wooden-builder', 'WoodenHouseBuilder', {
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: I18N.t('builder.tooltip.wooden-builder', null, 'Builds a wooden house with log foundation, timber walls, shingle roof')
                }) +
                PV.renderClass('cls-stone-builder', 'StoneHouseBuilder', {
                    methods: ['buildFoundation()', 'buildWalls()', 'buildRoof()', 'buildInterior()', 'getResult(): House'],
                    tooltip: I18N.t('builder.tooltip.stone-builder', null, 'Builds a stone house with concrete foundation, stone walls, tile roof')
                }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.return', null, 'Return') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-wooden-builder', 'cls-house-builder', 'inherit');
        PV.renderRelation('cls-stone-builder', 'cls-house-builder', 'inherit');
        PV.renderRelation('cls-director', 'cls-house-builder', 'depend');
        PV.renderRelation('cls-house', 'cls-wooden-builder', 'depend');
    }, 100);
}

PV['builder'].house = {
    init: function() {
        renderBuilderHouse();
    },
    stepOptions: function() { return { requestLabel: I18N.t('builder.stepLabel.house', null, 'Build a wooden house step by step') }; },
    steps: function() {
        return [
            {
                elementId: 'cls-director',
                label: 'Director.constructHouse()',
                description: 'Director begins construction by calling builder methods in order',
                descriptionKey: 'builder.step.house.0',
                logType: 'REQUEST',
                noArrowFromPrev: true,
                badgePosition: 'top'
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildFoundation()',
                description: 'Builder lays the foundation — log pilings for wooden house',
                descriptionKey: 'builder.step.house.1',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: -2.0,
                arrowToOffset: -2.0
            },
            {
                elementId: 'cls-house',
                label: 'foundation set',
                description: 'Product property "foundation" is now initialized',
                descriptionKey: 'builder.step.house.2',
                logType: 'PROPERTY',
                spawnId: 'prop-foundation',
                spawnLabel: 'foundation',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: -0.45 },
                arrowToOffset: { x: 0, y: -0.45 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildWalls()',
                description: 'Builder erects walls — timber frame with insulation',
                descriptionKey: 'builder.step.house.3',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: -0.7,
                arrowToOffset: -0.7
            },
            {
                elementId: 'cls-house',
                label: 'walls set',
                description: 'Product property "walls" is now initialized',
                descriptionKey: 'builder.step.house.4',
                logType: 'PROPERTY',
                spawnId: 'prop-walls',
                spawnLabel: 'walls',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: -0.15 },
                arrowToOffset: { x: 0, y: -0.15 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildRoof()',
                description: 'Builder installs roof — wooden shingles',
                descriptionKey: 'builder.step.house.5',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: 0.7,
                arrowToOffset: 0.7
            },
            {
                elementId: 'cls-house',
                label: 'roof set',
                description: 'Product property "roof" is now initialized',
                descriptionKey: 'builder.step.house.6',
                logType: 'PROPERTY',
                spawnId: 'prop-roof',
                spawnLabel: 'roof',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: 0.15 },
                arrowToOffset: { x: 0, y: 0.15 }
            },
            {
                elementId: 'cls-wooden-builder',
                label: 'buildInterior()',
                description: 'Builder finishes interior — rustic wood paneling',
                descriptionKey: 'builder.step.house.7',
                logType: 'FLOW',
                arrowFromId: 'cls-director',
                arrowFromOffset: 2.0,
                arrowToOffset: 2.0
            },
            {
                elementId: 'cls-house',
                label: 'interior set',
                description: 'Product property "interior" is now initialized',
                descriptionKey: 'builder.step.house.8',
                logType: 'PROPERTY',
                spawnId: 'prop-interior',
                spawnLabel: 'interior',
                arrowFromId: 'cls-wooden-builder',
                arrowFromOffset: { x: 0, y: 0.45 },
                arrowToOffset: { x: 0, y: 0.45 }
            },
            {
                elementId: 'cls-director',
                label: 'getResult()',
                description: 'Builder returns the fully constructed House to Director',
                descriptionKey: 'builder.step.house.9',
                logType: 'RESPONSE',
                arrowFromId: 'cls-wooden-builder'
            },
            {
                elementId: 'obj-b-house',
                label: ':House returned',
                description: 'Fully assembled House returned to the client',
                descriptionKey: 'builder.step.house.10',
                logType: 'RESPONSE',
                spawnId: 'obj-b-house',
                spawnLabel: ':House'
            }
        ];
    },
    run: function() {
        PV.animateFlow(PV['builder'].house.steps(), { requestLabel: 'Build a wooden house step by step' });
    }
};

PV['builder'].codeExamples = {
    house: {
        php: `<?php
declare(strict_types=1);

readonly class House
{
    public function __construct(
        public string $foundation = '',
        public string $walls = '',
        public string $roof = '',
        public string $interior = '',
    ) {}
}

interface HouseBuilder
{
    public function buildFoundation(): static;
    public function buildWalls(): static;
    public function buildRoof(): static;
    public function buildInterior(): static;
    public function getResult(): House;
}

class WoodenHouseBuilder implements HouseBuilder
{
    private House $house;

    public function __construct() { $this->house = new House(); }
    public function buildFoundation(): static { $this->house = new House(foundation: 'Log pilings', walls: $this->house->walls, roof: $this->house->roof, interior: $this->house->interior); return $this; }
    public function buildWalls(): static      { $this->house = new House(foundation: $this->house->foundation, walls: 'Timber frame', roof: $this->house->roof, interior: $this->house->interior); return $this; }
    public function buildRoof(): static       { $this->house = new House(foundation: $this->house->foundation, walls: $this->house->walls, roof: 'Wooden shingles', interior: $this->house->interior); return $this; }
    public function buildInterior(): static   { $this->house = new House(foundation: $this->house->foundation, walls: $this->house->walls, roof: $this->house->roof, interior: 'Rustic wood'); return $this; }
    public function getResult(): House        { return $this->house; }
}

class StoneHouseBuilder implements HouseBuilder
{
    private House $house;

    public function __construct() { $this->house = new House(); }
    public function buildFoundation(): static { $this->house = new House(foundation: 'Concrete slab', walls: $this->house->walls, roof: $this->house->roof, interior: $this->house->interior); return $this; }
    public function buildWalls(): static      { $this->house = new House(foundation: $this->house->foundation, walls: 'Stone masonry', roof: $this->house->roof, interior: $this->house->interior); return $this; }
    public function buildRoof(): static       { $this->house = new House(foundation: $this->house->foundation, walls: $this->house->walls, roof: 'Clay tiles', interior: $this->house->interior); return $this; }
    public function buildInterior(): static   { $this->house = new House(foundation: $this->house->foundation, walls: $this->house->walls, roof: $this->house->roof, interior: 'Modern finish'); return $this; }
    public function getResult(): House        { return $this->house; }
}

class Director
{
    public function constructHouse(HouseBuilder $builder): House
    {
        $builder->buildFoundation()
                ->buildWalls()
                ->buildRoof()
                ->buildInterior();
        return $builder->getResult();
    }
}

// Client
$director = new Director();
$house = $director->constructHouse(new WoodenHouseBuilder());`,

        go: `package main

import "fmt"

type House struct {
	Foundation string
	Walls      string
	Roof       string
	Interior   string
}

type HouseBuilder interface {
	BuildFoundation() HouseBuilder
	BuildWalls() HouseBuilder
	BuildRoof() HouseBuilder
	BuildInterior() HouseBuilder
	GetResult() House
}

type WoodenHouseBuilder struct{ house House }

func (b *WoodenHouseBuilder) BuildFoundation() HouseBuilder { b.house.Foundation = "Log pilings"; return b }
func (b *WoodenHouseBuilder) BuildWalls() HouseBuilder      { b.house.Walls = "Timber frame"; return b }
func (b *WoodenHouseBuilder) BuildRoof() HouseBuilder       { b.house.Roof = "Wooden shingles"; return b }
func (b *WoodenHouseBuilder) BuildInterior() HouseBuilder   { b.house.Interior = "Rustic wood"; return b }
func (b *WoodenHouseBuilder) GetResult() House              { return b.house }

type StoneHouseBuilder struct{ house House }

func (b *StoneHouseBuilder) BuildFoundation() HouseBuilder { b.house.Foundation = "Concrete slab"; return b }
func (b *StoneHouseBuilder) BuildWalls() HouseBuilder      { b.house.Walls = "Stone masonry"; return b }
func (b *StoneHouseBuilder) BuildRoof() HouseBuilder       { b.house.Roof = "Clay tiles"; return b }
func (b *StoneHouseBuilder) BuildInterior() HouseBuilder   { b.house.Interior = "Modern finish"; return b }
func (b *StoneHouseBuilder) GetResult() House              { return b.house }

func ConstructHouse(b HouseBuilder) House {
	b.BuildFoundation().BuildWalls().BuildRoof().BuildInterior()
	return b.GetResult()
}

func main() {
	house := ConstructHouse(&WoodenHouseBuilder{})
	fmt.Printf("%+v\\n", house)
}`,

        python: `from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Self, override


@dataclass(slots=True)
class House:
    foundation: str = ""
    walls: str = ""
    roof: str = ""
    interior: str = ""


class HouseBuilder(ABC):
    @abstractmethod
    def build_foundation(self) -> Self: ...
    @abstractmethod
    def build_walls(self) -> Self: ...
    @abstractmethod
    def build_roof(self) -> Self: ...
    @abstractmethod
    def build_interior(self) -> Self: ...
    @abstractmethod
    def get_result(self) -> House: ...


class WoodenHouseBuilder(HouseBuilder):
    def __init__(self) -> None:
        self._house = House()

    @override
    def build_foundation(self) -> Self: self._house.foundation = "Log pilings"; return self
    @override
    def build_walls(self) -> Self:      self._house.walls = "Timber frame"; return self
    @override
    def build_roof(self) -> Self:       self._house.roof = "Wooden shingles"; return self
    @override
    def build_interior(self) -> Self:   self._house.interior = "Rustic wood"; return self
    @override
    def get_result(self) -> House:      return self._house


class StoneHouseBuilder(HouseBuilder):
    def __init__(self) -> None:
        self._house = House()

    @override
    def build_foundation(self) -> Self: self._house.foundation = "Concrete slab"; return self
    @override
    def build_walls(self) -> Self:      self._house.walls = "Stone masonry"; return self
    @override
    def build_roof(self) -> Self:       self._house.roof = "Clay tiles"; return self
    @override
    def build_interior(self) -> Self:   self._house.interior = "Modern finish"; return self
    @override
    def get_result(self) -> House:      return self._house


class Director:
    def construct_house(self, builder: HouseBuilder) -> House:
        builder.build_foundation().build_walls().build_roof().build_interior()
        return builder.get_result()


# Client
director = Director()
house = director.construct_house(WoodenHouseBuilder())
print(house)`,

        rust: `use std::fmt;

struct House {
    foundation: String,
    walls: String,
    roof: String,
    interior: String,
}

impl fmt::Display for House {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}, {}, {}, {}", self.foundation, self.walls, self.roof, self.interior)
    }
}

trait HouseBuilder {
    fn build_foundation(&mut self) -> &mut Self;
    fn build_walls(&mut self) -> &mut Self;
    fn build_roof(&mut self) -> &mut Self;
    fn build_interior(&mut self) -> &mut Self;
    fn get_result(self) -> House;
}

struct WoodenHouseBuilder { house: House }

impl WoodenHouseBuilder {
    fn new() -> Self {
        Self { house: House {
            foundation: String::new(), walls: String::new(),
            roof: String::new(), interior: String::new(),
        }}
    }
}

impl HouseBuilder for WoodenHouseBuilder {
    fn build_foundation(&mut self) -> &mut Self { self.house.foundation = "Log pilings".into(); self }
    fn build_walls(&mut self) -> &mut Self      { self.house.walls = "Timber frame".into(); self }
    fn build_roof(&mut self) -> &mut Self       { self.house.roof = "Wooden shingles".into(); self }
    fn build_interior(&mut self) -> &mut Self   { self.house.interior = "Rustic wood".into(); self }
    fn get_result(self) -> House                { self.house }
}

fn construct_house<B: HouseBuilder>(mut builder: B) -> House {
    builder.build_foundation().build_walls().build_roof().build_interior();
    builder.get_result()
}

fn main() {
    let house = construct_house(WoodenHouseBuilder::new());
    println!("{house}");
}`
    }
}
