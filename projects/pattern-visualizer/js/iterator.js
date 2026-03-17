/* ===== Iterator Pattern ===== */

PV['iterator'] = {};

PV['iterator'].modes = [
    { id: 'playlist', label: 'Playlist', desc: 'Music playlist iteration: Playlist acts as an aggregate that creates a PlaylistIterator. The iterator traverses the song collection sequentially — hasNext() checks bounds, next() returns the current Song and advances the index.' }
];

PV['iterator'].depRules = [
    { name: 'Playlist (Aggregate)', role: 'Collection of songs that creates iterators' },
    { name: 'Iterator (Interface)', role: 'Defines hasNext() and next() traversal contract' },
    { name: 'PlaylistIterator', role: 'Concrete iterator over Playlist songs' },
    { name: 'Song', role: 'Element being iterated over' }
];

/* ---------- Render: Playlist ---------- */

function renderIteratorPlaylist() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Playlist */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-it-playlist', 'Playlist', {
                    fields: ['songs: Song[]'],
                    methods: ['createIterator(): Iterator', 'addSong(song)'],
                    tooltip: I18N.t('iterator.tooltip.playlist', null, 'Aggregate that holds a collection of songs and creates iterators for traversal')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.creates', null, 'creates')) +
            /* Row 2: Iterator interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-it-iterator', 'Iterator', {
                    stereotype: 'interface',
                    methods: ['hasNext(): bool', 'next(): Song'],
                    tooltip: I18N.t('iterator.tooltip.iterator', null, 'Iterator interface defining the traversal contract — hasNext() checks if more elements exist, next() returns the current element')
                }) +
            '</div>' +
            /* Row 3: PlaylistIterator */
            '<div class="pv-hierarchy-row" style="margin-top: 40px;">' +
                PV.renderClass('cls-it-concrete', 'PlaylistIterator', {
                    fields: ['playlist: Playlist', 'index: int'],
                    methods: ['hasNext(): bool', 'next(): Song'],
                    tooltip: I18N.t('iterator.tooltip.concrete', null, 'Concrete iterator that traverses a Playlist sequentially — tracks position with an internal index')
                }) +
            '</div>' +
            /* Row 4: Song objects + Iterator object */
            '<div class="pv-hierarchy-row" style="gap: 40px; margin-top: 20px;">' +
                PV.renderObject('obj-song1', 'Song: Bohemian Rhapsody', { tooltip: I18N.t('iterator.tooltip.song1', null, 'First song in the playlist — returned by next() at index 0') }) +
                PV.renderObject('obj-song2', 'Song: Imagine', { tooltip: I18N.t('iterator.tooltip.song2', null, 'Second song in the playlist — returned by next() at index 1') }) +
                PV.renderObject('obj-song3', 'Song: Hotel California', { tooltip: I18N.t('iterator.tooltip.song3', null, 'Third song in the playlist — returned by next() at index 2') }) +
                PV.renderObject('obj-iter', ':PlaylistIterator', { tooltip: I18N.t('iterator.tooltip.obj-iter', null, 'Runtime PlaylistIterator instance — tracks current position in the playlist') }) +
            '</div>' +
            /* Legend */
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
        PV.renderRelation('cls-it-concrete', 'cls-it-iterator', 'inherit');
        PV.renderRelation('cls-it-playlist', 'cls-it-concrete', 'compose');
        PV.renderRelation('cls-it-concrete', 'cls-it-playlist', 'depend');
    }, 100);
}

/* ---------- Details ---------- */

PV['iterator'].details = {
    playlist: {
        principles: [
            'Provide a way to access elements of a collection sequentially without exposing its underlying representation',
            'Single Responsibility: the collection (Playlist) manages storage, while the iterator (PlaylistIterator) manages traversal logic',
            'Open/Closed Principle: new iterator types (shuffle, reverse) can be added without modifying the Playlist class',
            'The client depends on the Iterator interface, not on the concrete collection structure — decoupling traversal from storage',
            'Multiple iterators can traverse the same collection independently, each maintaining its own position state'
        ],
        concepts: [
            { term: 'Aggregate', definition: 'The collection object (Playlist) that stores elements and provides a factory method (createIterator) to produce an iterator over its contents.' },
            { term: 'Iterator', definition: 'Interface defining the traversal contract: hasNext() checks whether more elements remain, next() returns the current element and advances the cursor.' },
            { term: 'Concrete Iterator', definition: 'PlaylistIterator implements the Iterator interface for a specific collection. It holds a reference to the Playlist and tracks the current index.' },
            { term: 'Element', definition: 'Song — the individual item stored in the collection and returned by the iterator during traversal.' }
        ],
        tradeoffs: {
            pros: [
                'Decouples traversal logic from the collection — clients use a uniform interface regardless of the underlying data structure',
                'Supports multiple simultaneous traversals of the same collection with independent state',
                'Open/Closed Principle — new traversal strategies (reverse, filtered, shuffled) can be added without modifying existing code',
                'Simplifies the collection interface by extracting traversal into a separate object'
            ],
            cons: [
                'Overkill for simple collections that are easily traversed with a basic loop',
                'External iterators can become invalid if the collection is modified during iteration',
                'Adds extra classes (Iterator interface + concrete iterator per collection type)',
                'Performance overhead compared to direct index access in trivial cases'
            ],
            whenToUse: 'Use when you need to traverse a complex data structure (tree, graph, composite) without exposing its internals, when you want to support multiple traversal algorithms, or when you need multiple independent iterators over the same collection.'
        }
    }
};

/* ===== Mode: playlist ===== */

PV['iterator'].playlist = {
    init: function() {
        renderIteratorPlaylist();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-it-playlist',
                label: 'Playlist',
                description: 'Client calls playlist.createIterator()',
                descriptionKey: 'iterator.step.playlist.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'cls-it-iterator',
                label: 'Iterator',
                description: 'Returns PlaylistIterator instance',
                descriptionKey: 'iterator.step.playlist.1',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-it-concrete',
                label: 'PlaylistIterator',
                description: 'hasNext() → true (index=0)',
                descriptionKey: 'iterator.step.playlist.2',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-song1',
                label: 'Bohemian Rhapsody',
                description: 'next() → Song: Bohemian Rhapsody',
                descriptionKey: 'iterator.step.playlist.3',
                logType: 'CREATE',
                spawnId: 'obj-song1'
            },
            {
                elementId: 'cls-it-concrete',
                label: 'PlaylistIterator',
                description: 'hasNext() → true (index=1)',
                descriptionKey: 'iterator.step.playlist.4',
                logType: 'FLOW',
                noArrowFromPrev: true,
                badgePosition: 'left'
            },
            {
                elementId: 'obj-song2',
                label: 'Imagine',
                description: 'next() → Song: Imagine',
                descriptionKey: 'iterator.step.playlist.5',
                logType: 'CREATE',
                spawnId: 'obj-song2'
            },
            {
                elementId: 'obj-song3',
                label: 'Hotel California',
                description: 'next() → Song: Hotel California',
                descriptionKey: 'iterator.step.playlist.6',
                logType: 'CREATE',
                spawnId: 'obj-song3',
                arrowFromId: 'cls-it-concrete'
            },
            {
                elementId: 'obj-iter',
                label: ':PlaylistIterator',
                description: 'hasNext() → false, iteration complete',
                descriptionKey: 'iterator.step.playlist.7',
                logType: 'RESPONSE',
                spawnId: 'obj-iter'
            }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('iterator.stepLabel.playlist', null, 'Iterate through playlist songs') }; },
    run: function() {
        PV.animateFlow(PV['iterator'].playlist.steps(), PV['iterator'].playlist.stepOptions());
    }
};

PV['iterator'].codeExamples = {
    playlist: {
        php: `<?php
declare(strict_types=1);

readonly class Song
{
    public function __construct(
        public string $title,
        public string $artist,
        public int $duration,
    ) {}

    public function __toString(): string
    {
        return "{$this->title} by {$this->artist}";
    }
}

interface Iterator
{
    public function hasNext(): bool;
    public function next(): Song;
}

class Playlist
{
    /** @var list<Song> */
    private array $songs = [];

    public function addSong(Song $song): void
    {
        $this->songs[] = $song;
    }

    public function createIterator(): Iterator
    {
        return new PlaylistIterator($this);
    }

    /** @return list<Song> */
    public function getSongs(): array
    {
        return $this->songs;
    }
}

class PlaylistIterator implements Iterator
{
    private int $index = 0;

    public function __construct(
        private readonly Playlist $playlist,
    ) {}

    public function hasNext(): bool
    {
        return $this->index < count($this->playlist->getSongs());
    }

    public function next(): Song
    {
        if (!$this->hasNext()) {
            throw new \\OutOfBoundsException('No more songs');
        }
        return $this->playlist->getSongs()[$this->index++];
    }
}

// Client
$playlist = new Playlist();
$playlist->addSong(new Song('Bohemian Rhapsody', 'Queen', 354));
$playlist->addSong(new Song('Imagine', 'John Lennon', 183));
$playlist->addSong(new Song('Hotel California', 'Eagles', 391));

$iterator = $playlist->createIterator();
while ($iterator->hasNext()) {
    echo $iterator->next() . "\\n";
}`,

        go: `package main

import "fmt"

type Song struct {
	Title    string
	Artist   string
	Duration int
}

func (s Song) String() string {
	return fmt.Sprintf("%s by %s", s.Title, s.Artist)
}

type Iterator interface {
	HasNext() bool
	Next() Song
}

type Playlist struct {
	songs []Song
}

func (p *Playlist) AddSong(s Song) {
	p.songs = append(p.songs, s)
}

func (p *Playlist) CreateIterator() Iterator {
	return &PlaylistIterator{playlist: p, index: 0}
}

type PlaylistIterator struct {
	playlist *Playlist
	index    int
}

func (it *PlaylistIterator) HasNext() bool {
	return it.index < len(it.playlist.songs)
}

func (it *PlaylistIterator) Next() Song {
	song := it.playlist.songs[it.index]
	it.index++
	return song
}

func main() {
	playlist := &Playlist{}
	playlist.AddSong(Song{Title: "Bohemian Rhapsody", Artist: "Queen", Duration: 354})
	playlist.AddSong(Song{Title: "Imagine", Artist: "John Lennon", Duration: 183})
	playlist.AddSong(Song{Title: "Hotel California", Artist: "Eagles", Duration: 391})

	iter := playlist.CreateIterator()
	for iter.HasNext() {
		fmt.Println(iter.Next())
	}
}`,

        python: `from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class Song:
    title: str
    artist: str
    duration: int

    def __str__(self) -> str:
        return f"{self.title} by {self.artist}"


class Iterator(Protocol):
    def has_next(self) -> bool: ...
    def next(self) -> Song: ...


class Playlist:
    def __init__(self) -> None:
        self._songs: list[Song] = []

    def add_song(self, song: Song) -> None:
        self._songs.append(song)

    def create_iterator(self) -> "PlaylistIterator":
        return PlaylistIterator(self)

    @property
    def songs(self) -> list[Song]:
        return self._songs


class PlaylistIterator:
    def __init__(self, playlist: Playlist) -> None:
        self._playlist = playlist
        self._index = 0

    def has_next(self) -> bool:
        return self._index < len(self._playlist.songs)

    def next(self) -> Song:
        if not self.has_next():
            raise StopIteration("No more songs")
        song = self._playlist.songs[self._index]
        self._index += 1
        return song

    def __iter__(self) -> "PlaylistIterator":
        return self

    def __next__(self) -> Song:
        if not self.has_next():
            raise StopIteration
        return self.next()


# Client
playlist = Playlist()
playlist.add_song(Song("Bohemian Rhapsody", "Queen", 354))
playlist.add_song(Song("Imagine", "John Lennon", 183))
playlist.add_song(Song("Hotel California", "Eagles", 391))

iterator = playlist.create_iterator()
while iterator.has_next():
    print(iterator.next())`,

        rust: `use std::fmt;

struct Song {
    title: String,
    artist: String,
    duration: u32,
}

impl fmt::Display for Song {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} by {}", self.title, self.artist)
    }
}

struct Playlist {
    songs: Vec<Song>,
}

impl Playlist {
    fn new() -> Self {
        Self { songs: Vec::new() }
    }

    fn add_song(&mut self, song: Song) {
        self.songs.push(song);
    }

    fn create_iterator(&self) -> PlaylistIterator<'_> {
        PlaylistIterator { playlist: self, index: 0 }
    }
}

struct PlaylistIterator<'a> {
    playlist: &'a Playlist,
    index: usize,
}

impl<'a> PlaylistIterator<'a> {
    fn has_next(&self) -> bool {
        self.index < self.playlist.songs.len()
    }
}

impl<'a> Iterator for PlaylistIterator<'a> {
    type Item = &'a Song;

    fn next(&mut self) -> Option<Self::Item> {
        if self.has_next() {
            let song = &self.playlist.songs[self.index];
            self.index += 1;
            Some(song)
        } else {
            None
        }
    }
}

fn main() {
    let mut playlist = Playlist::new();
    playlist.add_song(Song {
        title: "Bohemian Rhapsody".into(),
        artist: "Queen".into(),
        duration: 354,
    });
    playlist.add_song(Song {
        title: "Imagine".into(),
        artist: "John Lennon".into(),
        duration: 183,
    });
    playlist.add_song(Song {
        title: "Hotel California".into(),
        artist: "Eagles".into(),
        duration: 391,
    });

    let iter = playlist.create_iterator();
    for song in iter {
        println!("{song}");
    }
}`
    }
}
