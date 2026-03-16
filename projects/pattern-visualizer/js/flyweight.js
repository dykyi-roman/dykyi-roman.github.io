/* ===== Flyweight Pattern ===== */

PV['flyweight'] = {};

PV['flyweight'].modes = [
    { id: 'forest', label: 'Forest Rendering', desc: 'TreeFactory shares TreeType objects (intrinsic state: name, color, texture) across many Tree instances (extrinsic state: x, y coordinates). When the factory receives a request for an existing type, it returns the cached object instead of creating a new one — drastically reducing memory usage.' }
];

PV['flyweight'].depRules = [
    { name: 'Flyweight (TreeType)', role: 'Stores intrinsic (shared) state that can be reused across contexts' },
    { name: 'FlyweightFactory (TreeFactory)', role: 'Creates and manages flyweight objects, ensuring sharing' },
    { name: 'Context (Tree)', role: 'Stores extrinsic (unique) state and references a flyweight' },
    { name: 'Client', role: 'Maintains references to flyweights and computes/stores extrinsic state' }
];

/* ---------- Shared render functions ---------- */

function renderFlyweightForest() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 40px; padding: 30px 20px;">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-fw-client', 'Client', {
                    methods: ['plantTree(x, y, name, color, texture)'],
                    tooltip: I18N.t('flyweight.tooltip.client', null, 'Client that plants trees by providing extrinsic coordinates and intrinsic type data to the factory')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.uses', null, 'uses')) +
            /* Row 2: TreeFactory */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-fw-factory', 'TreeFactory', {
                    fields: ['cache: Map&lt;string, TreeType&gt;'],
                    methods: ['getTreeType(name, color, texture): TreeType'],
                    tooltip: I18N.t('flyweight.tooltip.factory', null, 'FlyweightFactory that caches TreeType objects — returns existing instance on cache hit, creates new one on miss')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.creates', null, 'creates')) +
            /* Row 3: TreeType (Flyweight) */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-fw-flyweight', 'TreeType', {
                    fields: ['name: string', 'color: string', 'texture: string'],
                    methods: ['render(x, y)'],
                    tooltip: I18N.t('flyweight.tooltip.flyweight', null, 'Flyweight object storing intrinsic (shared) state — name, color, texture. Immutable and reused across many Tree contexts')
                }) +
            '</div>' +
            /* Row 4: Tree objects referencing TreeType objects */
            '<div class="pv-hierarchy-row" style="gap: 30px; margin-top: 20px; flex-wrap: wrap; justify-content: center;">' +
                PV.renderObject('obj-oak-type', ':TreeType("Oak")', { tooltip: I18N.t('flyweight.tooltip.obj-oak-type', null, 'Shared flyweight for Oak trees — cached and reused by all Oak Tree instances') }) +
                PV.renderObject('obj-tree1', 'Tree(10,20)', { tooltip: I18N.t('flyweight.tooltip.obj-tree1', null, 'Tree at (10,20) referencing the shared OakType flyweight') }) +
                PV.renderObject('obj-tree2', 'Tree(50,70)', { tooltip: I18N.t('flyweight.tooltip.obj-tree2', null, 'Tree at (50,70) reusing the same OakType flyweight — no new TreeType created') }) +
                PV.renderObject('obj-pine-type', ':TreeType("Pine")', { tooltip: I18N.t('flyweight.tooltip.obj-pine-type', null, 'Shared flyweight for Pine trees — a separate cached type') }) +
                PV.renderObject('obj-tree3', 'Tree(30,40)', { tooltip: I18N.t('flyweight.tooltip.obj-tree3', null, 'Tree at (30,40) referencing the shared PineType flyweight') }) +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">&#x2713;</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-fw-factory', 'cls-fw-flyweight', 'depend');
        PV.renderRelation('cls-fw-client', 'cls-fw-factory', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['flyweight'].details = {
    forest: {
        principles: [
            'Separate intrinsic (shared) state from extrinsic (context-specific) state to minimize memory usage',
            'Flyweight objects must be immutable — once created, their intrinsic state never changes',
            'The factory is the single point of flyweight creation and lookup — clients never instantiate flyweights directly',
            'Extrinsic state lives in the Context (Tree) and is passed to the flyweight at render time',
            'Trading CPU for RAM: the lookup and parameter passing overhead is negligible compared to the memory savings when thousands of objects share the same flyweight'
        ],
        concepts: [
            { term: 'Intrinsic State', definition: 'Data that is shared across many contexts and stored inside the flyweight (TreeType: name, color, texture). It is context-independent and immutable.' },
            { term: 'Extrinsic State', definition: 'Data that varies per context and is stored outside the flyweight (Tree: x, y coordinates). It is passed to the flyweight when operations are invoked.' },
            { term: 'Flyweight Factory', definition: 'A factory that manages a pool of flyweight objects. It returns an existing flyweight if one with the requested intrinsic state exists, or creates and caches a new one otherwise.' },
            { term: 'Immutability', definition: 'Flyweight objects must be immutable so they can be safely shared. Any mutable state must be extrinsic and managed by the context.' }
        ],
        tradeoffs: {
            pros: [
                'Dramatically reduces memory usage when many objects share identical intrinsic state',
                'Centralizes object creation in the factory — easy to track and manage shared instances',
                'Transparent to clients — Tree objects behave the same whether their TreeType is shared or unique',
                'Scales well — adding thousands of trees costs only the extrinsic state per tree, not the full object'
            ],
            cons: [
                'Increases code complexity — intrinsic vs. extrinsic state must be carefully identified and separated',
                'Context objects must pass extrinsic state on every operation call, adding parameter overhead',
                'Debugging is harder — multiple contexts reference the same flyweight object, making identity checks confusing',
                'Not beneficial when few objects exist or when most state is extrinsic — the overhead outweighs the savings'
            ],
            whenToUse: 'Use when an application creates a huge number of similar objects that consume significant memory, and most of their state can be extracted as shared intrinsic state — e.g., rendering forests, particle systems, character glyphs in a text editor.'
        }
    }
};

/* ---------- Mode: forest ---------- */

PV['flyweight'].forest = {
    init: function() {
        renderFlyweightForest();
    },
    steps: function() {
        return [
            { elementId: 'cls-fw-client', label: 'Client', description: 'Client needs tree "Oak" at (10,20)', descriptionKey: 'flyweight.step.forest.0', logType: 'REQUEST' },
            { elementId: 'cls-fw-factory', label: 'TreeFactory', description: 'factory.getTreeType("Oak", "green", "oak.png")', descriptionKey: 'flyweight.step.forest.1', logType: 'FLOW' },
            { elementId: 'cls-fw-factory', label: 'TreeFactory', description: 'Check cache — MISS', descriptionKey: 'flyweight.step.forest.2', logType: 'CACHE', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-oak-type', label: 'TreeType("Oak")', description: 'TreeType("Oak") created & cached', descriptionKey: 'flyweight.step.forest.3', logType: 'CREATE', spawnId: 'obj-oak-type' },
            { elementId: 'obj-tree1', label: 'Tree(10,20)', description: 'Tree(10, 20, oakType) created', descriptionKey: 'flyweight.step.forest.4', logType: 'CREATE', spawnId: 'obj-tree1', arrowFromId: 'obj-oak-type' },
            { elementId: 'cls-fw-client', label: 'Client', description: 'Tree(10,20) planted successfully', descriptionKey: 'flyweight.step.forest.5', logType: 'RESPONSE', arrowFromId: 'obj-tree1' },
            { elementId: 'cls-fw-client', label: 'Client', description: 'Client needs "Oak" at (50,70)', descriptionKey: 'flyweight.step.forest.6', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'cls-fw-factory', label: 'TreeFactory', description: 'factory.getTreeType("Oak"...)', descriptionKey: 'flyweight.step.forest.7', logType: 'FLOW' },
            { elementId: 'cls-fw-factory', label: 'TreeFactory', description: 'Check cache — HIT (same object reused)', descriptionKey: 'flyweight.step.forest.8', logType: 'CACHE', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-oak-type', label: 'TreeType("Oak")', description: 'Same TreeType returned from cache', descriptionKey: 'flyweight.step.forest.9', logType: 'RESPONSE', arrowFromId: 'cls-fw-factory' },
            { elementId: 'obj-tree2', label: 'Tree(50,70)', description: 'Tree(50, 70, oakType) reuses flyweight', descriptionKey: 'flyweight.step.forest.10', logType: 'CREATE', spawnId: 'obj-tree2', arrowFromId: 'obj-oak-type' },
            { elementId: 'cls-fw-client', label: 'Client', description: 'Tree(50,70) planted — shared TreeType', descriptionKey: 'flyweight.step.forest.11', logType: 'RESPONSE', arrowFromId: 'obj-tree2' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('flyweight.stepLabel.forest', null, 'Render forest with shared Flyweight objects') }; },
    run: function() {
        PV.animateFlow(PV['flyweight'].forest.steps(), PV['flyweight'].forest.stepOptions());
    }
};

PV['flyweight'].codeExamples = {
    forest: {
        php: `<?php
declare(strict_types=1);

readonly class TreeType
{
    public function __construct(
        public string $name,
        public string $color,
        public string $texture,
    ) {}

    public function render(int $x, int $y): string
    {
        return "{$this->name} at ({$x},{$y}) [{$this->color}, {$this->texture}]";
    }
}

class TreeFactory
{
    /** @var array<string, TreeType> */
    private array $cache = [];

    public function getTreeType(string $name, string $color, string $texture): TreeType
    {
        $key = "{$name}_{$color}_{$texture}";

        return $this->cache[$key] ??= new TreeType($name, $color, $texture);
    }
}

class Tree
{
    public function __construct(
        private readonly int $x,
        private readonly int $y,
        private readonly TreeType $type,
    ) {}

    public function render(): string
    {
        return $this->type->render($this->x, $this->y);
    }
}

// Client
$factory = new TreeFactory();
$oakType = $factory->getTreeType('Oak', 'green', 'oak.png');

$tree1 = new Tree(10, 20, $oakType);
$tree2 = new Tree(50, 70, $factory->getTreeType('Oak', 'green', 'oak.png'));
$tree3 = new Tree(30, 40, $factory->getTreeType('Pine', 'dark-green', 'pine.png'));

echo $tree1->render(); // Oak at (10,20) [green, oak.png]
echo $tree2->render(); // Oak at (50,70) [green, oak.png]
// $oakType === the TreeType inside $tree2 — same object, shared via cache`,

        go: `package main

import "fmt"

// TreeType — Flyweight (intrinsic state)
type TreeType struct {
	Name    string
	Color   string
	Texture string
}

func (t *TreeType) Render(x, y int) string {
	return fmt.Sprintf("%s at (%d,%d) [%s, %s]", t.Name, x, y, t.Color, t.Texture)
}

// TreeFactory — FlyweightFactory
type TreeFactory struct {
	cache map[string]*TreeType
}

func NewTreeFactory() *TreeFactory {
	return &TreeFactory{cache: make(map[string]*TreeType)}
}

func (f *TreeFactory) GetTreeType(name, color, texture string) *TreeType {
	key := name + "_" + color + "_" + texture
	if tt, ok := f.cache[key]; ok {
		return tt
	}
	tt := &TreeType{Name: name, Color: color, Texture: texture}
	f.cache[key] = tt
	return tt
}

// Tree — Context (extrinsic state)
type Tree struct {
	X, Y     int
	TreeType *TreeType
}

func (t *Tree) Render() string {
	return t.TreeType.Render(t.X, t.Y)
}

func main() {
	factory := NewTreeFactory()
	oakType := factory.GetTreeType("Oak", "green", "oak.png")

	tree1 := &Tree{X: 10, Y: 20, TreeType: oakType}
	tree2 := &Tree{X: 50, Y: 70, TreeType: factory.GetTreeType("Oak", "green", "oak.png")}
	tree3 := &Tree{X: 30, Y: 40, TreeType: factory.GetTreeType("Pine", "dark-green", "pine.png")}

	fmt.Println(tree1.Render()) // Oak at (10,20) [green, oak.png]
	fmt.Println(tree2.Render()) // Oak at (50,70) [green, oak.png]
	fmt.Println(tree3.Render()) // Pine at (30,40) [dark-green, pine.png]
	fmt.Println(oakType == tree2.TreeType) // true — same pointer
}`,

        python: `from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TreeType:
    """Flyweight — stores intrinsic (shared) state."""
    name: str
    color: str
    texture: str

    def render(self, x: int, y: int) -> str:
        return f"{self.name} at ({x},{y}) [{self.color}, {self.texture}]"


class TreeFactory:
    """FlyweightFactory — caches and reuses TreeType objects."""

    def __init__(self) -> None:
        self._cache: dict[str, TreeType] = {}

    def get_tree_type(self, name: str, color: str, texture: str) -> TreeType:
        key = f"{name}_{color}_{texture}"
        if key not in self._cache:
            self._cache[key] = TreeType(name, color, texture)
        return self._cache[key]


@dataclass(slots=True)
class Tree:
    """Context — stores extrinsic (unique) state."""
    x: int
    y: int
    tree_type: TreeType

    def render(self) -> str:
        return self.tree_type.render(self.x, self.y)


# Client
factory = TreeFactory()
oak_type = factory.get_tree_type("Oak", "green", "oak.png")

tree1 = Tree(10, 20, oak_type)
tree2 = Tree(50, 70, factory.get_tree_type("Oak", "green", "oak.png"))
tree3 = Tree(30, 40, factory.get_tree_type("Pine", "dark-green", "pine.png"))

print(tree1.render())  # Oak at (10,20) [green, oak.png]
print(tree2.render())  # Oak at (50,70) [green, oak.png]
print(oak_type is tree2.tree_type)  # True — same object`,

        rust: `use std::collections::HashMap;
use std::fmt;
use std::rc::Rc;

/// Flyweight — stores intrinsic (shared) state.
#[derive(Debug, PartialEq, Eq, Hash)]
struct TreeType {
    name: String,
    color: String,
    texture: String,
}

impl TreeType {
    fn render(&self, x: i32, y: i32) -> String {
        format!("{} at ({},{}) [{}, {}]", self.name, x, y, self.color, self.texture)
    }
}

impl fmt::Display for TreeType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "TreeType({}, {}, {})", self.name, self.color, self.texture)
    }
}

/// FlyweightFactory — caches and reuses TreeType objects.
struct TreeFactory {
    cache: HashMap<String, Rc<TreeType>>,
}

impl TreeFactory {
    fn new() -> Self {
        Self { cache: HashMap::new() }
    }

    fn get_tree_type(&mut self, name: &str, color: &str, texture: &str) -> Rc<TreeType> {
        let key = format!("{name}_{color}_{texture}");
        self.cache
            .entry(key)
            .or_insert_with(|| {
                Rc::new(TreeType {
                    name: name.to_string(),
                    color: color.to_string(),
                    texture: texture.to_string(),
                })
            })
            .clone()
    }
}

/// Context — stores extrinsic (unique) state.
struct Tree {
    x: i32,
    y: i32,
    tree_type: Rc<TreeType>,
}

impl Tree {
    fn render(&self) -> String {
        self.tree_type.render(self.x, self.y)
    }
}

fn main() {
    let mut factory = TreeFactory::new();
    let oak_type = factory.get_tree_type("Oak", "green", "oak.png");

    let tree1 = Tree { x: 10, y: 20, tree_type: oak_type.clone() };
    let tree2 = Tree { x: 50, y: 70, tree_type: factory.get_tree_type("Oak", "green", "oak.png") };
    let tree3 = Tree { x: 30, y: 40, tree_type: factory.get_tree_type("Pine", "dark-green", "pine.png") };

    println!("{}", tree1.render()); // Oak at (10,20) [green, oak.png]
    println!("{}", tree2.render()); // Oak at (50,70) [green, oak.png]
    println!("{}", tree3.render()); // Pine at (30,40) [dark-green, pine.png]
    println!("{}", Rc::ptr_eq(&oak_type, &tree2.tree_type)); // true — same Rc
}`
    }
};
