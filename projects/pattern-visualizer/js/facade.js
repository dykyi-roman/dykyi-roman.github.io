/* ===== Facade Pattern ===== */

PV['facade'] = {};

PV['facade'].modes = [
    { id: 'theater', label: 'Home Theater', desc: 'HomeTheaterFacade simplifies managing a complex home theater system. Instead of calling methods on DVDPlayer, Amplifier, Projector, and Lights individually, the client calls watchMovie() on the facade, which orchestrates all subsystems in the correct order.' }
];

PV['facade'].depRules = [
    { name: 'Facade (HomeTheaterFacade)', role: 'Provides a simplified interface to the subsystem' },
    { name: 'Subsystem (DVDPlayer, Amplifier, Projector, Lights)', role: 'Complex subsystem classes that do the actual work' },
    { name: 'Client', role: 'Uses the Facade instead of calling subsystem classes directly' }
];

/* ---------- Shared render functions ---------- */

function renderFacadeTheater() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 40px; padding: 30px 20px;">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-fc-client', 'Client', {
                    methods: ['watchMovie(title)'],
                    tooltip: I18N.t('facade.tooltip.client', null, 'Client that uses the Facade to watch a movie without knowing subsystem details')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.uses', null, 'uses')) +
            /* Row 2: HomeTheaterFacade */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-fc-facade', 'HomeTheaterFacade', {
                    fields: ['dvd: DVDPlayer', 'amp: Amplifier', 'proj: Projector', 'lights: Lights'],
                    methods: ['watchMovie(title)', 'endMovie()'],
                    tooltip: I18N.t('facade.tooltip.facade', null, 'Facade that orchestrates all subsystems behind a single watchMovie() call')
                }) +
            '</div>' +
            /* Row 3: Subsystem classes */
            '<div class="pv-hierarchy-row" style="gap: 30px; margin-top: 30px;">' +
                PV.renderClass('cls-fc-dvd', 'DVDPlayer', {
                    methods: ['on()', 'play(title)', 'stop()', 'off()'],
                    tooltip: I18N.t('facade.tooltip.dvd', null, 'Subsystem class responsible for DVD playback')
                }) +
                PV.renderClass('cls-fc-amp', 'Amplifier', {
                    methods: ['on()', 'setVolume(level)', 'off()'],
                    tooltip: I18N.t('facade.tooltip.amp', null, 'Subsystem class responsible for audio amplification')
                }) +
                PV.renderClass('cls-fc-proj', 'Projector', {
                    methods: ['on()', 'setInput(src)', 'off()'],
                    tooltip: I18N.t('facade.tooltip.proj', null, 'Subsystem class responsible for video projection')
                }) +
                PV.renderClass('cls-fc-lights', 'Lights', {
                    methods: ['dim(level)', 'on()'],
                    tooltip: I18N.t('facade.tooltip.lights', null, 'Subsystem class responsible for room lighting')
                }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-fc-facade', 'cls-fc-dvd', 'compose');
        PV.renderRelation('cls-fc-facade', 'cls-fc-amp', 'compose');
        PV.renderRelation('cls-fc-facade', 'cls-fc-proj', 'compose');
        PV.renderRelation('cls-fc-facade', 'cls-fc-lights', 'compose');
        PV.renderRelation('cls-fc-client', 'cls-fc-facade', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['facade'].details = {
    theater: {
        principles: [
            'Provide a unified, higher-level interface that makes the subsystem easier to use',
            'Shield clients from subsystem complexity — the client only knows about the Facade',
            'Facade does not add new functionality — it delegates to existing subsystem classes',
            'Subsystem classes remain accessible directly for advanced use cases',
            'Promotes loose coupling between client code and the complex subsystem'
        ],
        concepts: [
            { term: 'Facade', definition: 'A class that provides a simplified interface to a complex subsystem. It delegates client requests to appropriate subsystem objects and may perform additional orchestration.' },
            { term: 'Subsystem', definition: 'A set of classes (DVDPlayer, Amplifier, Projector, Lights) that implement the actual functionality. They handle work assigned by the Facade but have no knowledge of it.' },
            { term: 'Simplified Interface', definition: 'The Facade exposes a small number of high-level methods (watchMovie, endMovie) that internally coordinate multiple subsystem calls in the correct order.' },
            { term: 'Decoupling', definition: 'The client depends only on the Facade, not on the subsystem classes directly. This reduces the number of dependencies and makes the system easier to maintain and evolve.' }
        ],
        tradeoffs: {
            pros: [
                'Simplifies usage — a single method call replaces a complex sequence of subsystem interactions',
                'Reduces coupling — clients depend on the Facade, not on individual subsystem classes',
                'Improves readability — high-level intent (watchMovie) is clearer than low-level steps',
                'Easy to change subsystem internals without affecting clients that use the Facade'
            ],
            cons: [
                'Facade can become a God Object if it accumulates too many responsibilities over time',
                'Adds an extra layer of indirection that may obscure what is actually happening',
                'Clients may lose fine-grained control over individual subsystem components',
                'If the subsystem changes significantly, the Facade must be updated to match'
            ],
            whenToUse: 'Use when you want to provide a simple interface to a complex subsystem, when there are many interdependent classes that clients should not need to understand, or when you want to layer your subsystems and define entry points to each level.'
        }
    }
};

/* ---------- Mode: theater ---------- */

PV['facade'].theater = {
    init: function() {
        renderFacadeTheater();
    },
    steps: function() {
        return [
            { elementId: 'cls-fc-client', label: 'Client', description: 'Client calls facade.watchMovie("Inception")', descriptionKey: 'facade.step.theater.0', logType: 'REQUEST' },
            { elementId: 'cls-fc-facade', label: 'HomeTheaterFacade', description: 'Facade begins orchestration', descriptionKey: 'facade.step.theater.1', logType: 'FLOW' },
            { elementId: 'cls-fc-lights', label: 'Lights', description: 'lights.dim(30)', descriptionKey: 'facade.step.theater.2', logType: 'FLOW' },
            { elementId: 'cls-fc-proj', label: 'Projector', description: 'projector.on()', descriptionKey: 'facade.step.theater.3', logType: 'FLOW' },
            { elementId: 'cls-fc-proj', label: 'Projector', description: 'projector.setInput("DVD")', descriptionKey: 'facade.step.theater.4', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-fc-amp', label: 'Amplifier', description: 'amplifier.on()', descriptionKey: 'facade.step.theater.5', logType: 'FLOW' },
            { elementId: 'cls-fc-amp', label: 'Amplifier', description: 'amplifier.setVolume(8)', descriptionKey: 'facade.step.theater.6', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-fc-dvd', label: 'DVDPlayer', description: 'dvdPlayer.on()', descriptionKey: 'facade.step.theater.7', logType: 'FLOW' },
            { elementId: 'cls-fc-dvd', label: 'DVDPlayer', description: 'dvdPlayer.play("Inception")', descriptionKey: 'facade.step.theater.8', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-fc-client', label: 'Client', description: 'Movie "Inception" is now playing', descriptionKey: 'facade.step.theater.9', logType: 'RESPONSE', arrowFromId: 'cls-fc-facade' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('facade.stepLabel.theater', null, 'Watch movie via Home Theater Facade') }; },
    run: function() {
        PV.animateFlow(PV['facade'].theater.steps(), PV['facade'].theater.stepOptions());
    }
};

PV['facade'].codeExamples = {
    theater: {
        php: `<?php
declare(strict_types=1);

class DVDPlayer
{
    public function on(): void { echo "DVD Player on\\n"; }
    public function play(string $title): void { echo "Playing \\"{$title}\\"\\n"; }
    public function stop(): void { echo "DVD Player stopped\\n"; }
    public function off(): void { echo "DVD Player off\\n"; }
}

class Amplifier
{
    public function on(): void { echo "Amplifier on\\n"; }
    public function setVolume(int $level): void { echo "Volume set to {$level}\\n"; }
    public function off(): void { echo "Amplifier off\\n"; }
}

class Projector
{
    public function on(): void { echo "Projector on\\n"; }
    public function setInput(string $source): void { echo "Input set to {$source}\\n"; }
    public function off(): void { echo "Projector off\\n"; }
}

class Lights
{
    public function dim(int $level): void { echo "Lights dimmed to {$level}%\\n"; }
    public function on(): void { echo "Lights on\\n"; }
}

class HomeTheaterFacade
{
    public function __construct(
        private readonly DVDPlayer $dvd,
        private readonly Amplifier $amp,
        private readonly Projector $proj,
        private readonly Lights $lights,
    ) {}

    public function watchMovie(string $title): void
    {
        echo "Get ready to watch \\"{$title}\\"...\\n";
        $this->lights->dim(30);
        $this->proj->on();
        $this->proj->setInput('DVD');
        $this->amp->on();
        $this->amp->setVolume(8);
        $this->dvd->on();
        $this->dvd->play($title);
    }

    public function endMovie(): void
    {
        echo "Shutting down...\\n";
        $this->dvd->stop();
        $this->dvd->off();
        $this->amp->off();
        $this->proj->off();
        $this->lights->on();
    }
}

// Client
$facade = new HomeTheaterFacade(
    new DVDPlayer(),
    new Amplifier(),
    new Projector(),
    new Lights(),
);
$facade->watchMovie('Inception');
$facade->endMovie();`,

        go: `package main

import "fmt"

type DVDPlayer struct{}

func (d *DVDPlayer) On()               { fmt.Println("DVD Player on") }
func (d *DVDPlayer) Play(title string) { fmt.Printf("Playing %q\\n", title) }
func (d *DVDPlayer) Stop()             { fmt.Println("DVD Player stopped") }
func (d *DVDPlayer) Off()              { fmt.Println("DVD Player off") }

type Amplifier struct{}

func (a *Amplifier) On()              { fmt.Println("Amplifier on") }
func (a *Amplifier) SetVolume(lv int) { fmt.Printf("Volume set to %d\\n", lv) }
func (a *Amplifier) Off()             { fmt.Println("Amplifier off") }

type Projector struct{}

func (p *Projector) On()              { fmt.Println("Projector on") }
func (p *Projector) SetInput(s string) { fmt.Printf("Input set to %s\\n", s) }
func (p *Projector) Off()             { fmt.Println("Projector off") }

type Lights struct{}

func (l *Lights) Dim(level int) { fmt.Printf("Lights dimmed to %d%%\\n", level) }
func (l *Lights) On()           { fmt.Println("Lights on") }

type HomeTheaterFacade struct {
	dvd    *DVDPlayer
	amp    *Amplifier
	proj   *Projector
	lights *Lights
}

func NewHomeTheaterFacade() *HomeTheaterFacade {
	return &HomeTheaterFacade{
		dvd:    &DVDPlayer{},
		amp:    &Amplifier{},
		proj:   &Projector{},
		lights: &Lights{},
	}
}

func (f *HomeTheaterFacade) WatchMovie(title string) {
	fmt.Printf("Get ready to watch %q...\\n", title)
	f.lights.Dim(30)
	f.proj.On()
	f.proj.SetInput("DVD")
	f.amp.On()
	f.amp.SetVolume(8)
	f.dvd.On()
	f.dvd.Play(title)
}

func (f *HomeTheaterFacade) EndMovie() {
	fmt.Println("Shutting down...")
	f.dvd.Stop()
	f.dvd.Off()
	f.amp.Off()
	f.proj.Off()
	f.lights.On()
}

func main() {
	facade := NewHomeTheaterFacade()
	facade.WatchMovie("Inception")
	facade.EndMovie()
}`,

        python: `class DVDPlayer:
    def on(self) -> None:
        print("DVD Player on")

    def play(self, title: str) -> None:
        print(f'Playing "{title}"')

    def stop(self) -> None:
        print("DVD Player stopped")

    def off(self) -> None:
        print("DVD Player off")


class Amplifier:
    def on(self) -> None:
        print("Amplifier on")

    def set_volume(self, level: int) -> None:
        print(f"Volume set to {level}")

    def off(self) -> None:
        print("Amplifier off")


class Projector:
    def on(self) -> None:
        print("Projector on")

    def set_input(self, source: str) -> None:
        print(f"Input set to {source}")

    def off(self) -> None:
        print("Projector off")


class Lights:
    def dim(self, level: int) -> None:
        print(f"Lights dimmed to {level}%")

    def on(self) -> None:
        print("Lights on")


class HomeTheaterFacade:
    def __init__(self) -> None:
        self._dvd = DVDPlayer()
        self._amp = Amplifier()
        self._proj = Projector()
        self._lights = Lights()

    def watch_movie(self, title: str) -> None:
        print(f'Get ready to watch "{title}"...')
        self._lights.dim(30)
        self._proj.on()
        self._proj.set_input("DVD")
        self._amp.on()
        self._amp.set_volume(8)
        self._dvd.on()
        self._dvd.play(title)

    def end_movie(self) -> None:
        print("Shutting down...")
        self._dvd.stop()
        self._dvd.off()
        self._amp.off()
        self._proj.off()
        self._lights.on()


# Client
facade = HomeTheaterFacade()
facade.watch_movie("Inception")
facade.end_movie()`,

        rust: `struct DVDPlayer;

impl DVDPlayer {
    fn on(&self) { println!("DVD Player on"); }
    fn play(&self, title: &str) { println!("Playing \\"{title}\\""); }
    fn stop(&self) { println!("DVD Player stopped"); }
    fn off(&self) { println!("DVD Player off"); }
}

struct Amplifier;

impl Amplifier {
    fn on(&self) { println!("Amplifier on"); }
    fn set_volume(&self, level: u8) { println!("Volume set to {level}"); }
    fn off(&self) { println!("Amplifier off"); }
}

struct Projector;

impl Projector {
    fn on(&self) { println!("Projector on"); }
    fn set_input(&self, source: &str) { println!("Input set to {source}"); }
    fn off(&self) { println!("Projector off"); }
}

struct Lights;

impl Lights {
    fn dim(&self, level: u8) { println!("Lights dimmed to {level}%"); }
    fn on(&self) { println!("Lights on"); }
}

struct HomeTheaterFacade {
    dvd: DVDPlayer,
    amp: Amplifier,
    proj: Projector,
    lights: Lights,
}

impl HomeTheaterFacade {
    fn new() -> Self {
        Self {
            dvd: DVDPlayer,
            amp: Amplifier,
            proj: Projector,
            lights: Lights,
        }
    }

    fn watch_movie(&self, title: &str) {
        println!("Get ready to watch \\"{title}\\"...");
        self.lights.dim(30);
        self.proj.on();
        self.proj.set_input("DVD");
        self.amp.on();
        self.amp.set_volume(8);
        self.dvd.on();
        self.dvd.play(title);
    }

    fn end_movie(&self) {
        println!("Shutting down...");
        self.dvd.stop();
        self.dvd.off();
        self.amp.off();
        self.proj.off();
        self.lights.on();
    }
}

fn main() {
    let facade = HomeTheaterFacade::new();
    facade.watch_movie("Inception");
    facade.end_movie();
}`
    }
};
