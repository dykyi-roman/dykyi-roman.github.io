/* ===== Composite Pattern ===== */

PV['composite'] = {};

PV['composite'].modes = [
    { id: 'filesystem', label: 'File System', desc: 'Directory and File both implement FileSystemItem. Directories can contain Files and sub-directories, forming a tree. getSize() is called recursively \u2014 leaves return their size, composites sum their children. The client treats individual files and directories uniformly.' }
];

PV['composite'].depRules = [
    { name: 'Component (FileSystemItem)', role: 'Common interface for both leaves and composites' },
    { name: 'Leaf (File)', role: 'Has no children; implements operations directly' },
    { name: 'Composite (Directory)', role: 'Stores child components and delegates operations to them' },
    { name: 'Client', role: 'Works with all elements through the Component interface' }
];

/* ---------- Shared render functions ---------- */

function renderCompositeFilesystem() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 40px; padding: 30px 20px;">' +
            /* Row 1: FileSystemItem interface */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-cp-component', 'FileSystemItem', {
                    stereotype: 'interface',
                    methods: ['getSize(): int', 'getName(): string'],
                    tooltip: I18N.t('composite.tooltip.component', null, 'Component interface implemented by both File (leaf) and Directory (composite)')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 2: File (Leaf) + Directory (Composite) */
            '<div class="pv-hierarchy-row" style="gap: 80px;">' +
                PV.renderClass('cls-cp-leaf', 'File', {
                    fields: ['name: string', 'size: int'],
                    methods: ['getSize(): int', 'getName(): string'],
                    tooltip: I18N.t('composite.tooltip.leaf', null, 'Leaf node \u2014 represents a single file with a fixed size, no children')
                }) +
                PV.renderClass('cls-cp-composite', 'Directory', {
                    fields: ['name: string', 'children: FileSystemItem[]'],
                    methods: ['getSize(): int', 'getName(): string', 'add(item)', 'remove(item)'],
                    tooltip: I18N.t('composite.tooltip.composite', null, 'Composite node \u2014 contains children (Files and sub-Directories), delegates getSize() recursively')
                }) +
            '</div>' +
            /* Row 3: Object tree */
            '<div style="display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 30px;">' +
                /* Level 1: /root */
                '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                    PV.renderObject('obj-root', '/root :Directory', { visible: true, tooltip: I18N.t('composite.tooltip.obj-root', null, 'Root directory \u2014 composite that contains /docs and photo.jpg') }) +
                '</div>' +
                /* Level 2: /root/docs + photo.jpg */
                '<div class="pv-hierarchy-row" style="gap: 80px; justify-content: center;">' +
                    PV.renderObject('obj-docs', '/root/docs :Directory', { visible: true, tooltip: I18N.t('composite.tooltip.obj-docs', null, 'Sub-directory \u2014 composite containing readme.txt and notes.txt') }) +
                    PV.renderObject('obj-photo', 'photo.jpg :File (2048B)', { visible: true, tooltip: I18N.t('composite.tooltip.obj-photo', null, 'Leaf file \u2014 photo.jpg with size 2048 bytes') }) +
                '</div>' +
                /* Level 3: readme.txt + notes.txt */
                '<div class="pv-hierarchy-row" style="gap: 80px; justify-content: center;">' +
                    PV.renderObject('obj-readme', 'readme.txt :File (1024B)', { visible: true, tooltip: I18N.t('composite.tooltip.obj-readme', null, 'Leaf file \u2014 readme.txt with size 1024 bytes') }) +
                    PV.renderObject('obj-notes', 'notes.txt :File (512B)', { visible: true, tooltip: I18N.t('composite.tooltip.obj-notes', null, 'Leaf file \u2014 notes.txt with size 512 bytes') }) +
                '</div>' +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-cp-leaf', 'cls-cp-component', 'inherit');
        PV.renderRelation('cls-cp-composite', 'cls-cp-component', 'inherit');
        PV.renderRelation('cls-cp-composite', 'cls-cp-component', 'compose');
    }, 50);
}

/* ---------- Details ---------- */

PV['composite'].details = {
    filesystem: {
        principles: [
            'Uniform interface: treat individual objects (File) and compositions (Directory) through the same interface',
            'Recursive composition: composites contain components that may themselves be composites, forming a tree',
            'Single Responsibility: leaves handle their own data, composites handle child management and delegation',
            'Open/Closed Principle: add new leaf or composite types without modifying existing code',
            'Transparency: the client does not need to know whether it is working with a leaf or a composite'
        ],
        concepts: [
            { term: 'Component', definition: 'The common interface (FileSystemItem) that declares operations shared by both simple and complex elements of the tree. The client interacts with all elements through this interface.' },
            { term: 'Leaf', definition: 'A terminal node (File) that has no children. It implements the component interface directly \u2014 getSize() returns its own size.' },
            { term: 'Composite', definition: 'A container node (Directory) that stores child components and implements operations by delegating to its children. getSize() sums the sizes of all children recursively.' },
            { term: 'Uniform Interface', definition: 'The client calls getSize() on any FileSystemItem without knowing whether it is a File or a Directory. This eliminates type-checking conditionals in client code.' }
        ],
        tradeoffs: {
            pros: [
                'Simplifies client code \u2014 uniform treatment of individual and composite objects',
                'Easy to add new component types without changing existing client code',
                'Natural representation of tree structures (file systems, UI widgets, org charts)',
                'Recursive operations are elegant and concise'
            ],
            cons: [
                'Can make the design overly general \u2014 hard to restrict which components can be children',
                'Leaf nodes may inherit methods (add, remove) that make no sense for them',
                'Harder to enforce type constraints at compile time',
                'Deep recursive structures can cause stack overflow on very large trees'
            ],
            whenToUse: 'Use when you need to represent part-whole hierarchies of objects, when you want clients to treat individual objects and compositions uniformly, or when the structure naturally forms a tree (file systems, UI component trees, organization charts).'
        }
    }
};

/* ---------- Mode: filesystem ---------- */

PV['composite'].filesystem = {
    init: function() {
        renderCompositeFilesystem();
    },
    steps: function() {
        return [
            { elementId: 'obj-root', label: '/root', description: 'Client calls root.getSize()', descriptionKey: 'composite.step.filesystem.0', logType: 'REQUEST', spawnId: 'obj-root' },
            { elementId: 'obj-root', label: '/root', description: '/root iterates children', descriptionKey: 'composite.step.filesystem.1', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-docs', label: '/root/docs', description: 'Child \u2192 /root/docs (Directory)', descriptionKey: 'composite.step.filesystem.2', logType: 'FLOW', spawnId: 'obj-docs' },
            { elementId: 'obj-docs', label: '/root/docs', description: '/root/docs iterates children', descriptionKey: 'composite.step.filesystem.3', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-readme', label: 'readme.txt', description: 'readme.txt returns size=1024', descriptionKey: 'composite.step.filesystem.4', logType: 'RESPONSE', spawnId: 'obj-readme' },
            { elementId: 'obj-notes', label: 'notes.txt', description: 'notes.txt returns size=512', descriptionKey: 'composite.step.filesystem.5', logType: 'RESPONSE', spawnId: 'obj-notes', arrowFromId: 'obj-docs' },
            { elementId: 'obj-docs', label: '/root/docs', description: '/root/docs = 1536 bytes', descriptionKey: 'composite.step.filesystem.6', logType: 'RESPONSE', arrowFromId: 'obj-notes' },
            { elementId: 'obj-photo', label: 'photo.jpg', description: 'photo.jpg returns size=2048', descriptionKey: 'composite.step.filesystem.7', logType: 'RESPONSE', arrowFromId: 'obj-root', spawnId: 'obj-photo' },
            { elementId: 'obj-root', label: '/root', description: '/root = 1536 + 2048 = 3584', descriptionKey: 'composite.step.filesystem.8', logType: 'RESPONSE', arrowFromId: 'obj-photo' },
            { elementId: 'obj-root', label: '/root', description: 'Total size = 3584 bytes returned', descriptionKey: 'composite.step.filesystem.9', logType: 'RESPONSE', noArrowFromPrev: true, badgePosition: 'top' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('composite.stepLabel.filesystem', null, 'Calculate file system size via Composite') }; },
    run: function() {
        PV.animateFlow(PV['composite'].filesystem.steps(), PV['composite'].filesystem.stepOptions());
    }
};

PV['composite'].codeExamples = {
    filesystem: {
        php: `<?php
declare(strict_types=1);

interface FileSystemItem
{
    public function getSize(): int;
    public function getName(): string;
}

readonly class File implements FileSystemItem
{
    public function __construct(
        private string $name,
        private int $size,
    ) {}

    public function getSize(): int
    {
        return $this->size;
    }

    public function getName(): string
    {
        return $this->name;
    }
}

class Directory implements FileSystemItem
{
    /** @var FileSystemItem[] */
    private array $children = [];

    public function __construct(
        private readonly string $name,
    ) {}

    public function add(FileSystemItem $item): void
    {
        $this->children[] = $item;
    }

    public function remove(FileSystemItem $item): void
    {
        $this->children = array_values(
            array_filter($this->children, fn($c) => $c !== $item)
        );
    }

    public function getSize(): int
    {
        return array_sum(
            array_map(fn(FileSystemItem $c) => $c->getSize(), $this->children)
        );
    }

    public function getName(): string
    {
        return $this->name;
    }
}

// Client
$root = new Directory('/root');
$docs = new Directory('/root/docs');
$docs->add(new File('readme.txt', 1024));
$docs->add(new File('notes.txt', 512));
$root->add($docs);
$root->add(new File('photo.jpg', 2048));

echo $root->getSize(); // 3584`,

        go: `package main

import "fmt"

type FileSystemItem interface {
	GetSize() int
	GetName() string
}

type File struct {
	Name string
	Size int
}

func (f *File) GetSize() int    { return f.Size }
func (f *File) GetName() string { return f.Name }

type Directory struct {
	Name     string
	children []FileSystemItem
}

func (d *Directory) Add(item FileSystemItem)    { d.children = append(d.children, item) }

func (d *Directory) Remove(item FileSystemItem) {
	for i, c := range d.children {
		if c == item {
			d.children = append(d.children[:i], d.children[i+1:]...)
			return
		}
	}
}

func (d *Directory) GetSize() int {
	total := 0
	for _, c := range d.children {
		total += c.GetSize()
	}
	return total
}

func (d *Directory) GetName() string { return d.Name }

func main() {
	root := &Directory{Name: "/root"}
	docs := &Directory{Name: "/root/docs"}
	docs.Add(&File{Name: "readme.txt", Size: 1024})
	docs.Add(&File{Name: "notes.txt", Size: 512})
	root.Add(docs)
	root.Add(&File{Name: "photo.jpg", Size: 2048})

	fmt.Println(root.GetSize()) // 3584
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class FileSystemItem(ABC):
    @abstractmethod
    def get_size(self) -> int: ...

    @abstractmethod
    def get_name(self) -> str: ...


class File(FileSystemItem):
    def __init__(self, name: str, size: int) -> None:
        self._name = name
        self._size = size

    @override
    def get_size(self) -> int:
        return self._size

    @override
    def get_name(self) -> str:
        return self._name


class Directory(FileSystemItem):
    def __init__(self, name: str) -> None:
        self._name = name
        self._children: list[FileSystemItem] = []

    def add(self, item: FileSystemItem) -> None:
        self._children.append(item)

    def remove(self, item: FileSystemItem) -> None:
        self._children.remove(item)

    @override
    def get_size(self) -> int:
        return sum(c.get_size() for c in self._children)

    @override
    def get_name(self) -> str:
        return self._name


# Client
root = Directory("/root")
docs = Directory("/root/docs")
docs.add(File("readme.txt", 1024))
docs.add(File("notes.txt", 512))
root.add(docs)
root.add(File("photo.jpg", 2048))

print(root.get_size())  # 3584`,

        rust: `trait FileSystemItem {
    fn get_size(&self) -> usize;
    fn get_name(&self) -> &str;
}

struct File {
    name: String,
    size: usize,
}

impl File {
    fn new(name: &str, size: usize) -> Self {
        Self { name: name.to_string(), size }
    }
}

impl FileSystemItem for File {
    fn get_size(&self) -> usize { self.size }
    fn get_name(&self) -> &str  { &self.name }
}

struct Directory {
    name: String,
    children: Vec<Box<dyn FileSystemItem>>,
}

impl Directory {
    fn new(name: &str) -> Self {
        Self { name: name.to_string(), children: Vec::new() }
    }

    fn add(&mut self, item: Box<dyn FileSystemItem>) {
        self.children.push(item);
    }
}

impl FileSystemItem for Directory {
    fn get_size(&self) -> usize {
        self.children.iter().map(|c| c.get_size()).sum()
    }

    fn get_name(&self) -> &str { &self.name }
}

fn main() {
    let mut docs = Directory::new("/root/docs");
    docs.add(Box::new(File::new("readme.txt", 1024)));
    docs.add(Box::new(File::new("notes.txt", 512)));

    let mut root = Directory::new("/root");
    root.add(Box::new(docs));
    root.add(Box::new(File::new("photo.jpg", 2048)));

    println!("{}", root.get_size()); // 3584
}`
    }
};
