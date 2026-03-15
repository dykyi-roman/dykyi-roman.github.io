/* ===== Abstract Factory Pattern ===== */

PV['abstract-factory'] = {};

PV['abstract-factory'].modes = [
    { id: 'furniture', label: 'Furniture', desc: 'Furniture store: each style (Modern, Victorian) creates matching Chair, Table, and Sofa.' }
];

PV['abstract-factory'].depRules = [
    { name: 'Abstract Factory', role: 'Declares creation methods for each product in the family' },
    { name: 'Concrete Factory', role: 'Implements creation methods for a specific product family/variant' },
    { name: 'Abstract Product', role: 'Interface for a type of product' },
    { name: 'Concrete Product', role: 'Implements abstract product for a specific variant' },
    { name: 'Client', role: 'Uses factories and products through abstract interfaces only' }
];

/* ===== Details ===== */
PV['abstract-factory'].details = {
    furniture: {
        principles: [
            'Program to interfaces: client code depends only on FurnitureFactory, Chair, Table, and Sofa abstractions',
            'Product families guarantee consistency: ModernFurnitureFactory always produces matching modern products',
            'Open/Closed Principle: new furniture styles (e.g., ArtDeco) can be added without modifying existing code',
            'Single Responsibility: each concrete factory encapsulates creation logic for one product family',
            'Dependency Inversion: high-level client depends on abstractions, not concrete product classes'
        ],
        concepts: [
            { term: 'Product Family', definition: 'A set of related products (Chair + Table + Sofa) designed to work together in a specific style.' },
            { term: 'Abstract Factory', definition: 'Interface declaring creation methods for each product type, ensuring every family produces a full set.' },
            { term: 'Concrete Factory', definition: 'Implements creation methods to produce products of a specific variant (Modern, Victorian).' },
            { term: 'Variant Consistency', definition: 'Each factory guarantees all produced objects belong to the same family, preventing mismatched combinations.' },
            { term: 'Client Isolation', definition: 'Client receives a factory via constructor/config and never references concrete product classes directly.' }
        ],
        tradeoffs: {
            pros: [
                'Guarantees product family consistency — all objects from one factory match in style',
                'Isolates client from concrete classes — easy to swap entire families',
                'Follows Open/Closed Principle — adding new families requires no changes to existing code',
                'Centralizes creation logic — each factory is a single source of truth for its variant'
            ],
            cons: [
                'Adding a new product type (e.g., Lamp) requires changing all factory interfaces and implementations',
                'Increases number of classes significantly — each family multiplies the class count',
                'Can be over-engineered for simple scenarios with few product types',
                'Factory interfaces become rigid — hard to evolve without breaking existing families'
            ],
            whenToUse: 'When your system must create families of related objects that must be used together, and you want to enforce consistency across product variants without coupling client code to concrete classes.'
        }
    }
};

/* ===== Mode: furniture ===== */

function renderFurnitureFactory() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Abstract Factory + Concrete Factories (single row) */
            '<div class="pv-hierarchy-row" style="justify-content: space-between; width: 100%;">' +
                PV.renderClass('af-modern-factory', 'ModernFurnitureFactory', {
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: I18N.t('abstract-factory.tooltip.modern-factory', null, 'Concrete Factory: creates modern-style furniture')
                }) +
                PV.renderClass('af-factory', 'FurnitureFactory', {
                    stereotype: 'interface',
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: I18N.t('abstract-factory.tooltip.factory', null, 'Abstract Factory: declares creation methods for each product in the family')
                }) +
                PV.renderClass('af-victorian-factory', 'VictorianFurnitureFactory', {
                    methods: ['createChair(): Chair', 'createTable(): Table', 'createSofa(): Sofa'],
                    tooltip: I18N.t('abstract-factory.tooltip.victorian-factory', null, 'Concrete Factory: creates Victorian-style furniture')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.creates', null, 'creates')) +
            /* Abstract Products */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('af-chair', 'Chair', {
                    stereotype: 'interface',
                    methods: ['sitOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.chair', null, 'Abstract Product: interface for chair objects')
                }) +
                PV.renderClass('af-table', 'Table', {
                    stereotype: 'interface',
                    methods: ['putOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.table', null, 'Abstract Product: interface for table objects')
                }) +
                PV.renderClass('af-sofa', 'Sofa', {
                    stereotype: 'interface',
                    methods: ['lieOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.sofa', null, 'Abstract Product: interface for sofa objects')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Concrete Products — Modern row */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('af-modern-chair', 'ModernChair', {
                    methods: ['sitOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.modern-chair', null, 'Concrete Product: modern-style chair')
                }) +
                PV.renderClass('af-modern-table', 'ModernTable', {
                    methods: ['putOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.modern-table', null, 'Concrete Product: modern-style table')
                }) +
                PV.renderClass('af-modern-sofa', 'ModernSofa', {
                    methods: ['lieOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.modern-sofa', null, 'Concrete Product: modern-style sofa')
                }) +
            '</div>' +
            /* Concrete Products — Victorian row (offset for checkerboard) */
            '<div class="pv-hierarchy-row" style="padding-left: 200px;">' +
                PV.renderClass('af-victorian-chair', 'VictorianChair', {
                    methods: ['sitOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.victorian-chair', null, 'Concrete Product: Victorian-style chair')
                }) +
                PV.renderClass('af-victorian-table', 'VictorianTable', {
                    methods: ['putOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.victorian-table', null, 'Concrete Product: Victorian-style table')
                }) +
                PV.renderClass('af-victorian-sofa', 'VictorianSofa', {
                    methods: ['lieOn()'],
                    tooltip: I18N.t('abstract-factory.tooltip.victorian-sofa', null, 'Concrete Product: Victorian-style sofa')
                }) +
            '</div>' +
            /* Object Instances — Modern row (hidden) */
            '<div class="pv-hierarchy-row">' +
                PV.renderObject('obj-af-mchair', ':ModernChair', { tooltip: I18N.t('abstract-factory.tooltip.obj-mchair', null, 'Instance of ModernChair') }) +
                PV.renderObject('obj-af-mtable', ':ModernTable', { tooltip: I18N.t('abstract-factory.tooltip.obj-mtable', null, 'Instance of ModernTable') }) +
                PV.renderObject('obj-af-msofa', ':ModernSofa', { tooltip: I18N.t('abstract-factory.tooltip.obj-msofa', null, 'Instance of ModernSofa') }) +
            '</div>' +
            /* Object Instances — Victorian row (hidden, offset for checkerboard) */
            '<div class="pv-hierarchy-row" style="padding-left: 200px;">' +
                PV.renderObject('obj-af-vchair', ':VictorianChair', { tooltip: I18N.t('abstract-factory.tooltip.obj-vchair', null, 'Instance of VictorianChair') }) +
                PV.renderObject('obj-af-vtable', ':VictorianTable', { tooltip: I18N.t('abstract-factory.tooltip.obj-vtable', null, 'Instance of VictorianTable') }) +
                PV.renderObject('obj-af-vsofa', ':VictorianSofa', { tooltip: I18N.t('abstract-factory.tooltip.obj-vsofa', null, 'Instance of VictorianSofa') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('af-modern-factory', 'af-factory', 'inherit');
        PV.renderRelation('af-victorian-factory', 'af-factory', 'inherit');
        PV.renderRelation('af-modern-chair', 'af-chair', 'inherit');
        PV.renderRelation('af-modern-table', 'af-table', 'inherit');
        PV.renderRelation('af-modern-sofa', 'af-sofa', 'inherit');
        PV.renderRelation('af-victorian-chair', 'af-chair', 'inherit');
        PV.renderRelation('af-victorian-table', 'af-table', 'inherit');
        PV.renderRelation('af-victorian-sofa', 'af-sofa', 'inherit');
    }, 100);
}

PV['abstract-factory'].furniture = {
    init: function() {
        renderFurnitureFactory();
    },
    steps: function() {
        return [
            { elementId: 'af-factory', label: 'FurnitureFactory', description: 'Client requests a furniture set', descriptionKey: 'abstract-factory.step.furniture.0', logType: 'REQUEST', badgePosition: 'top' },
            { elementId: 'af-modern-factory', label: 'ModernFurnitureFactory', description: 'Modern factory selected for this order', descriptionKey: 'abstract-factory.step.furniture.1', logType: 'FLOW' },
            { elementId: 'af-modern-chair', label: 'createChair()', description: 'Factory calls createChair()', descriptionKey: 'abstract-factory.step.furniture.2', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-mchair', label: 'ModernChair', description: 'ModernChair instance created', descriptionKey: 'abstract-factory.step.furniture.3', logType: 'CREATE', spawnId: 'obj-af-mchair', spawnLabel: 'ModernChair', arrowFromId: 'af-modern-chair' },
            { elementId: 'af-modern-table', label: 'createTable()', description: 'Factory calls createTable()', descriptionKey: 'abstract-factory.step.furniture.4', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-mtable', label: 'ModernTable', description: 'ModernTable instance created', descriptionKey: 'abstract-factory.step.furniture.5', logType: 'CREATE', spawnId: 'obj-af-mtable', spawnLabel: 'ModernTable', arrowFromId: 'af-modern-table' },
            { elementId: 'af-modern-sofa', label: 'createSofa()', description: 'Factory calls createSofa()', descriptionKey: 'abstract-factory.step.furniture.6', logType: 'FLOW', arrowFromId: 'af-modern-factory' },
            { elementId: 'obj-af-msofa', label: 'ModernSofa', description: 'ModernSofa instance created', descriptionKey: 'abstract-factory.step.furniture.7', logType: 'CREATE', spawnId: 'obj-af-msofa', spawnLabel: 'ModernSofa', arrowFromId: 'af-modern-sofa' },
            { elementId: 'af-factory', label: 'FurnitureFactory', description: 'All modern products delivered to client', descriptionKey: 'abstract-factory.step.furniture.8', logType: 'RESPONSE', arrowFromId: 'obj-af-msofa' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: I18N.t('abstract-factory.stepLabel.furniture', null, 'Client requests Modern furniture set') };
    },
    run: function() {
        PV.animateFlow(PV['abstract-factory'].furniture.steps(), PV['abstract-factory'].furniture.stepOptions());
    }
};

PV['abstract-factory'].codeExamples = {
    furniture: {
        php: `<?php
declare(strict_types=1);

interface Chair  { public function sitOn(): string; }
interface Table  { public function putOn(): string; }
interface Sofa   { public function lieOn(): string; }

readonly class ModernChair implements Chair {
    public function sitOn(): string { return 'Sitting on modern chair'; }
}
readonly class ModernTable implements Table {
    public function putOn(): string { return 'Putting on modern table'; }
}
readonly class ModernSofa implements Sofa {
    public function lieOn(): string { return 'Lying on modern sofa'; }
}

readonly class VictorianChair implements Chair {
    public function sitOn(): string { return 'Sitting on Victorian chair'; }
}
readonly class VictorianTable implements Table {
    public function putOn(): string { return 'Putting on Victorian table'; }
}
readonly class VictorianSofa implements Sofa {
    public function lieOn(): string { return 'Lying on Victorian sofa'; }
}

interface FurnitureFactory
{
    public function createChair(): Chair;
    public function createTable(): Table;
    public function createSofa(): Sofa;
}

readonly class ModernFurnitureFactory implements FurnitureFactory
{
    public function createChair(): Chair { return new ModernChair(); }
    public function createTable(): Table { return new ModernTable(); }
    public function createSofa(): Sofa  { return new ModernSofa(); }
}

readonly class VictorianFurnitureFactory implements FurnitureFactory
{
    public function createChair(): Chair { return new VictorianChair(); }
    public function createTable(): Table { return new VictorianTable(); }
    public function createSofa(): Sofa  { return new VictorianSofa(); }
}

// Client
$factory = new ModernFurnitureFactory();
echo $factory->createChair()->sitOn();
echo $factory->createTable()->putOn();
echo $factory->createSofa()->lieOn();`,

        go: `package main

import "fmt"

type Chair interface{ SitOn() string }
type Table interface{ PutOn() string }
type Sofa interface{ LieOn() string }

type ModernChair struct{}
func (c ModernChair) SitOn() string { return "Sitting on modern chair" }

type ModernTable struct{}
func (t ModernTable) PutOn() string { return "Putting on modern table" }

type ModernSofa struct{}
func (s ModernSofa) LieOn() string { return "Lying on modern sofa" }

type VictorianChair struct{}
func (c VictorianChair) SitOn() string { return "Sitting on Victorian chair" }

type VictorianTable struct{}
func (t VictorianTable) PutOn() string { return "Putting on Victorian table" }

type VictorianSofa struct{}
func (s VictorianSofa) LieOn() string { return "Lying on Victorian sofa" }

type FurnitureFactory interface {
	CreateChair() Chair
	CreateTable() Table
	CreateSofa() Sofa
}

type ModernFurnitureFactory struct{}

func (f ModernFurnitureFactory) CreateChair() Chair { return ModernChair{} }
func (f ModernFurnitureFactory) CreateTable() Table { return ModernTable{} }
func (f ModernFurnitureFactory) CreateSofa() Sofa   { return ModernSofa{} }

type VictorianFurnitureFactory struct{}

func (f VictorianFurnitureFactory) CreateChair() Chair { return VictorianChair{} }
func (f VictorianFurnitureFactory) CreateTable() Table { return VictorianTable{} }
func (f VictorianFurnitureFactory) CreateSofa() Sofa   { return VictorianSofa{} }

func main() {
	var factory FurnitureFactory = ModernFurnitureFactory{}
	fmt.Println(factory.CreateChair().SitOn())
	fmt.Println(factory.CreateTable().PutOn())
	fmt.Println(factory.CreateSofa().LieOn())
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Chair(ABC):
    @abstractmethod
    def sit_on(self) -> str: ...

class Table(ABC):
    @abstractmethod
    def put_on(self) -> str: ...

class Sofa(ABC):
    @abstractmethod
    def lie_on(self) -> str: ...


class ModernChair(Chair):
    @override
    def sit_on(self) -> str: return "Sitting on modern chair"

class ModernTable(Table):
    @override
    def put_on(self) -> str: return "Putting on modern table"

class ModernSofa(Sofa):
    @override
    def lie_on(self) -> str: return "Lying on modern sofa"


class VictorianChair(Chair):
    @override
    def sit_on(self) -> str: return "Sitting on Victorian chair"

class VictorianTable(Table):
    @override
    def put_on(self) -> str: return "Putting on Victorian table"

class VictorianSofa(Sofa):
    @override
    def lie_on(self) -> str: return "Lying on Victorian sofa"


class FurnitureFactory(ABC):
    @abstractmethod
    def create_chair(self) -> Chair: ...
    @abstractmethod
    def create_table(self) -> Table: ...
    @abstractmethod
    def create_sofa(self) -> Sofa: ...


class ModernFurnitureFactory(FurnitureFactory):
    @override
    def create_chair(self) -> Chair: return ModernChair()
    @override
    def create_table(self) -> Table: return ModernTable()
    @override
    def create_sofa(self) -> Sofa:  return ModernSofa()


class VictorianFurnitureFactory(FurnitureFactory):
    @override
    def create_chair(self) -> Chair: return VictorianChair()
    @override
    def create_table(self) -> Table: return VictorianTable()
    @override
    def create_sofa(self) -> Sofa:  return VictorianSofa()


# Client
factory: FurnitureFactory = ModernFurnitureFactory()
print(factory.create_chair().sit_on())
print(factory.create_table().put_on())
print(factory.create_sofa().lie_on())`,

        rust: `trait Chair { fn sit_on(&self) -> &str; }
trait Table { fn put_on(&self) -> &str; }
trait Sofa  { fn lie_on(&self) -> &str; }

struct ModernChair;
impl Chair for ModernChair { fn sit_on(&self) -> &str { "Sitting on modern chair" } }
struct ModernTable;
impl Table for ModernTable { fn put_on(&self) -> &str { "Putting on modern table" } }
struct ModernSofa;
impl Sofa for ModernSofa { fn lie_on(&self) -> &str { "Lying on modern sofa" } }

struct VictorianChair;
impl Chair for VictorianChair { fn sit_on(&self) -> &str { "Sitting on Victorian chair" } }
struct VictorianTable;
impl Table for VictorianTable { fn put_on(&self) -> &str { "Putting on Victorian table" } }
struct VictorianSofa;
impl Sofa for VictorianSofa { fn lie_on(&self) -> &str { "Lying on Victorian sofa" } }

trait FurnitureFactory {
    fn create_chair(&self) -> Box<dyn Chair>;
    fn create_table(&self) -> Box<dyn Table>;
    fn create_sofa(&self) -> Box<dyn Sofa>;
}

struct ModernFurnitureFactory;
impl FurnitureFactory for ModernFurnitureFactory {
    fn create_chair(&self) -> Box<dyn Chair> { Box::new(ModernChair) }
    fn create_table(&self) -> Box<dyn Table> { Box::new(ModernTable) }
    fn create_sofa(&self) -> Box<dyn Sofa>   { Box::new(ModernSofa) }
}

struct VictorianFurnitureFactory;
impl FurnitureFactory for VictorianFurnitureFactory {
    fn create_chair(&self) -> Box<dyn Chair> { Box::new(VictorianChair) }
    fn create_table(&self) -> Box<dyn Table> { Box::new(VictorianTable) }
    fn create_sofa(&self) -> Box<dyn Sofa>   { Box::new(VictorianSofa) }
}

fn main() {
    let factory: Box<dyn FurnitureFactory> = Box::new(ModernFurnitureFactory);
    println!("{}", factory.create_chair().sit_on());
    println!("{}", factory.create_table().put_on());
    println!("{}", factory.create_sofa().lie_on());
}`
    }
}
