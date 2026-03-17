/* ===== Template Method Pattern ===== */

PV['template-method'] = {};

PV['template-method'].modes = [
    { id: 'mining', label: 'Mining', desc: 'Data mining pipeline where DataMiner defines the template method mine() with a fixed algorithm skeleton. Concrete miners (CSV, JSON, XML) override individual steps while the base class controls the overall flow.' }
];

PV['template-method'].depRules = [
    { name: 'DataMiner (Abstract Class)', role: 'Defines the template method mine() with algorithm skeleton' },
    { name: 'CSVMiner', role: 'Overrides steps for CSV file processing' },
    { name: 'JSONMiner', role: 'Overrides steps for JSON file processing' },
    { name: 'XMLMiner', role: 'Overrides steps for XML file processing' }
];

/* ===== Render: Mining ===== */
function renderTemplateMining() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Abstract DataMiner */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-tm-abstract', 'DataMiner', {
                    stereotype: 'abstract',
                    methods: ['mine()', 'openFile()', 'extractData()', 'parseData()', 'analyze()', 'sendReport()'],
                    tooltip: I18N.t('template-method.tooltip.abstract', null, 'Abstract class defining the template method mine() — controls the algorithm skeleton while subclasses override individual steps')
                }) +
            '</div>' +
            /* Row 2: Concrete miners */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-tm-csv', 'CSVMiner', {
                    methods: ['openFile()', 'extractData()', 'parseData()'],
                    tooltip: I18N.t('template-method.tooltip.csv', null, 'Concrete class that overrides openFile(), extractData(), and parseData() for CSV file processing')
                }) +
                PV.renderClass('cls-tm-json', 'JSONMiner', {
                    methods: ['openFile()', 'extractData()', 'parseData()'],
                    tooltip: I18N.t('template-method.tooltip.json', null, 'Concrete class that overrides openFile(), extractData(), and parseData() for JSON file processing')
                }) +
                PV.renderClass('cls-tm-xml', 'XMLMiner', {
                    methods: ['openFile()', 'extractData()', 'parseData()'],
                    tooltip: I18N.t('template-method.tooltip.xml', null, 'Concrete class that overrides openFile(), extractData(), and parseData() for XML file processing')
                }) +
            '</div>' +
            /* Row 3: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 20px;">' +
                PV.renderObject('obj-csv', ':CSVMiner', { tooltip: I18N.t('template-method.tooltip.obj-csv', null, 'Runtime CSVMiner instance executing the mining pipeline') }) +
                PV.renderObject('obj-json', ':JSONMiner', { tooltip: I18N.t('template-method.tooltip.obj-json', null, 'Runtime JSONMiner instance — same template method, different data format') }) +
                PV.renderObject('obj-xml', ':XMLMiner', { tooltip: I18N.t('template-method.tooltip.obj-xml', null, 'Runtime XMLMiner instance — same template method, different data format') }) +
            '</div>' +
            /* Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.return', null, 'Return') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">&#x2713;</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-tm-csv', 'cls-tm-abstract', 'inherit');
        PV.renderRelation('cls-tm-json', 'cls-tm-abstract', 'inherit', -6);
        PV.renderRelation('cls-tm-xml', 'cls-tm-abstract', 'inherit');
    }, 100);
}

/* ===== Details ===== */
PV['template-method'].details = {
    mining: {
        principles: [
            'The template method mine() defines the algorithm skeleton in the base class — subclasses cannot change the overall sequence',
            'Subclasses override only the varying steps (openFile, extractData, parseData) while common logic (analyze, sendReport) stays in the base class',
            'Hollywood Principle: "Don\'t call us, we\'ll call you" — the base class calls subclass methods, not the other way around',
            'Open/Closed Principle: new data formats (e.g., YAMLMiner) can be added without modifying DataMiner or existing miners',
            'Code duplication is eliminated — shared steps live in one place (the abstract class) instead of being copied across every miner'
        ],
        concepts: [
            { term: 'Template Method', definition: 'A method in the abstract class (mine()) that defines the algorithm skeleton by calling a sequence of steps — some abstract, some concrete. Subclasses fill in the blanks.' },
            { term: 'Abstract Class', definition: 'DataMiner declares the template method and provides default implementations for common steps (analyze, sendReport) while leaving format-specific steps abstract.' },
            { term: 'Concrete Class', definition: 'CSVMiner, JSONMiner, XMLMiner — each implements the abstract steps for its specific data format without altering the algorithm structure.' },
            { term: 'Hook Method', definition: 'An optional step with a default (often empty) implementation in the base class that subclasses may override for additional customization points.' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates code duplication — common algorithm logic lives in one place',
                'Easy to extend: add new data formats by subclassing without modifying existing code',
                'Enforces a consistent algorithm structure across all implementations',
                'Subclasses focus only on format-specific logic, reducing complexity per class'
            ],
            cons: [
                'Rigid algorithm structure — steps cannot be reordered or skipped by subclasses',
                'Inheritance-based: tightly couples subclasses to the base class implementation',
                'Can violate Liskov Substitution Principle if subclass overrides change expected behavior',
                'Debugging can be harder — control flow bounces between base class and subclasses'
            ],
            whenToUse: 'Use when multiple classes share the same algorithm structure but differ in specific steps, when you want to enforce an invariant sequence of operations, or when you need to let subclasses extend specific parts of an algorithm without changing its overall structure.'
        }
    }
};

/* ===== Mode: mining ===== */
PV['template-method'].mining = {
    init: function() {
        renderTemplateMining();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-tm-abstract',
                label: 'DataMiner',
                description: 'Call mine() template method on CSVMiner',
                descriptionKey: 'template-method.step.mining.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'cls-tm-csv',
                label: 'CSVMiner',
                description: 'Step 1: openFile("data.csv")',
                descriptionKey: 'template-method.step.mining.1',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-tm-csv',
                label: 'CSVMiner',
                description: 'Step 2: extractData() \u2192 raw CSV rows',
                descriptionKey: 'template-method.step.mining.2',
                logType: 'FLOW',
                noArrowFromPrev: true,
                badgePosition: 'right'
            },
            {
                elementId: 'cls-tm-csv',
                label: 'CSVMiner',
                description: 'Step 3: parseData() \u2192 structured records',
                descriptionKey: 'template-method.step.mining.3',
                logType: 'FLOW',
                noArrowFromPrev: true,
                badgePosition: 'left'
            },
            {
                elementId: 'cls-tm-abstract',
                label: 'DataMiner',
                description: 'Step 4: analyze() \u2014 common logic in base class',
                descriptionKey: 'template-method.step.mining.4',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-tm-abstract',
                label: 'DataMiner',
                description: 'Step 5: sendReport() \u2014 common logic in base class',
                descriptionKey: 'template-method.step.mining.5',
                logType: 'FLOW',
                noArrowFromPrev: true,
                badgePosition: 'right'
            },
            {
                elementId: 'obj-csv',
                label: ':CSVMiner',
                description: 'Mining pipeline complete for CSV',
                descriptionKey: 'template-method.step.mining.6',
                logType: 'RESPONSE',
                spawnId: 'obj-csv'
            },
            {
                elementId: 'obj-json',
                label: ':JSONMiner',
                description: 'Same template works for JSON/XML miners',
                descriptionKey: 'template-method.step.mining.7',
                logType: 'CREATE',
                spawnId: 'obj-json',
                arrowFromId: 'cls-tm-abstract'
            }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('template-method.stepLabel.mining', null, 'Run data mining pipeline via template method') }; },
    run: function() {
        PV.animateFlow(PV['template-method'].mining.steps(), PV['template-method'].mining.stepOptions());
    }
};

PV['template-method'].codeExamples = {
    mining: {
        php: `<?php
declare(strict_types=1);

abstract class DataMiner
{
    /** Template method — defines the algorithm skeleton */
    final public function mine(string $path): string
    {
        $file    = $this->openFile($path);
        $rawData = $this->extractData($file);
        $data    = $this->parseData($rawData);
        $analysis = $this->analyze($data);
        $this->sendReport($analysis);

        return $analysis;
    }

    abstract protected function openFile(string $path): mixed;
    abstract protected function extractData(mixed $file): string;
    abstract protected function parseData(string $rawData): array;

    protected function analyze(array $data): string
    {
        return sprintf('Analyzed %d records', count($data));
    }

    protected function sendReport(string $analysis): void
    {
        // Send report via email — common for all miners
    }
}

class CSVMiner extends DataMiner
{
    protected function openFile(string $path): mixed
    {
        return fopen($path, 'r');
    }

    protected function extractData(mixed $file): string
    {
        $content = stream_get_contents($file);
        fclose($file);
        return $content;
    }

    protected function parseData(string $rawData): array
    {
        $lines = explode("\\n", trim($rawData));
        $headers = str_getcsv(array_shift($lines));
        return array_map(
            fn(string $line) => array_combine($headers, str_getcsv($line)),
            $lines
        );
    }
}

class JSONMiner extends DataMiner
{
    protected function openFile(string $path): mixed
    {
        return file_get_contents($path);
    }

    protected function extractData(mixed $file): string
    {
        return $file;
    }

    protected function parseData(string $rawData): array
    {
        return json_decode($rawData, true, 512, JSON_THROW_ON_ERROR);
    }
}

class XMLMiner extends DataMiner
{
    protected function openFile(string $path): mixed
    {
        return simplexml_load_file($path);
    }

    protected function extractData(mixed $file): string
    {
        return $file->asXML();
    }

    protected function parseData(string $rawData): array
    {
        $xml = simplexml_load_string($rawData);
        return json_decode(json_encode($xml), true);
    }
}

// Client
$miner = new CSVMiner();
echo $miner->mine('data.csv');`,

        go: `package main

import (
	"encoding/csv"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"strings"
)

// Steps interface — each miner implements these
type MiningSteps interface {
	OpenFile(path string) (any, error)
	ExtractData(file any) (string, error)
	ParseData(raw string) ([]map[string]any, error)
}

// Template function — defines the algorithm skeleton
func Mine(s MiningSteps, path string) (string, error) {
	file, err := s.OpenFile(path)
	if err != nil {
		return "", err
	}
	raw, err := s.ExtractData(file)
	if err != nil {
		return "", err
	}
	data, err := s.ParseData(raw)
	if err != nil {
		return "", err
	}
	analysis := Analyze(data)
	SendReport(analysis)
	return analysis, nil
}

func Analyze(data []map[string]any) string {
	return fmt.Sprintf("Analyzed %d records", len(data))
}

func SendReport(analysis string) {
	// Send report via email
}

// CSVMiner
type CSVMiner struct{}

func (c CSVMiner) OpenFile(path string) (any, error) {
	return os.Open(path)
}

func (c CSVMiner) ExtractData(file any) (string, error) {
	f := file.(*os.File)
	defer f.Close()
	buf, err := os.ReadFile(f.Name())
	return string(buf), err
}

func (c CSVMiner) ParseData(raw string) ([]map[string]any, error) {
	r := csv.NewReader(strings.NewReader(raw))
	records, err := r.ReadAll()
	if err != nil || len(records) < 2 {
		return nil, err
	}
	headers := records[0]
	var result []map[string]any
	for _, row := range records[1:] {
		m := make(map[string]any)
		for i, h := range headers {
			m[h] = row[i]
		}
		result = append(result, m)
	}
	return result, nil
}

// JSONMiner
type JSONMiner struct{}

func (j JSONMiner) OpenFile(path string) (any, error) {
	return os.ReadFile(path)
}

func (j JSONMiner) ExtractData(file any) (string, error) {
	return string(file.([]byte)), nil
}

func (j JSONMiner) ParseData(raw string) ([]map[string]any, error) {
	var data []map[string]any
	err := json.Unmarshal([]byte(raw), &data)
	return data, err
}

// XMLMiner
type XMLMiner struct{}

func (x XMLMiner) OpenFile(path string) (any, error) {
	return os.ReadFile(path)
}

func (x XMLMiner) ExtractData(file any) (string, error) {
	return string(file.([]byte)), nil
}

func (x XMLMiner) ParseData(raw string) ([]map[string]any, error) {
	var result struct {
		Items []map[string]any \`xml:"item"\`
	}
	err := xml.Unmarshal([]byte(raw), &result)
	return result.Items, err
}

func main() {
	miner := CSVMiner{}
	result, _ := Mine(miner, "data.csv")
	fmt.Println(result)
}`,

        python: `from abc import ABC, abstractmethod
from typing import Any, override
import csv
import json
import xml.etree.ElementTree as ET
from io import StringIO


class DataMiner(ABC):
    """Abstract class with the template method mine()."""

    def mine(self, path: str) -> str:
        """Template method — defines the algorithm skeleton."""
        file = self.open_file(path)
        raw_data = self.extract_data(file)
        data = self.parse_data(raw_data)
        analysis = self.analyze(data)
        self.send_report(analysis)
        return analysis

    @abstractmethod
    def open_file(self, path: str) -> Any: ...

    @abstractmethod
    def extract_data(self, file: Any) -> str: ...

    @abstractmethod
    def parse_data(self, raw_data: str) -> list[dict]: ...

    def analyze(self, data: list[dict]) -> str:
        return f"Analyzed {len(data)} records"

    def send_report(self, analysis: str) -> None:
        pass  # Send report via email


class CSVMiner(DataMiner):
    @override
    def open_file(self, path: str) -> Any:
        return open(path, newline="")

    @override
    def extract_data(self, file: Any) -> str:
        with file:
            return file.read()

    @override
    def parse_data(self, raw_data: str) -> list[dict]:
        reader = csv.DictReader(StringIO(raw_data))
        return [dict(row) for row in reader]


class JSONMiner(DataMiner):
    @override
    def open_file(self, path: str) -> Any:
        return open(path)

    @override
    def extract_data(self, file: Any) -> str:
        with file:
            return file.read()

    @override
    def parse_data(self, raw_data: str) -> list[dict]:
        return json.loads(raw_data)


class XMLMiner(DataMiner):
    @override
    def open_file(self, path: str) -> Any:
        return ET.parse(path)

    @override
    def extract_data(self, file: Any) -> str:
        return ET.tostring(file.getroot(), encoding="unicode")

    @override
    def parse_data(self, raw_data: str) -> list[dict]:
        root = ET.fromstring(raw_data)
        return [{child.tag: child.text for child in item} for item in root]


# Client
miner = CSVMiner()
print(miner.mine("data.csv"))`,

        rust: `use std::fs;
use std::error::Error;

trait DataMiner {
    /// Template method — defines the algorithm skeleton
    fn mine(&self, path: &str) -> Result<String, Box<dyn Error>> {
        let file = self.open_file(path)?;
        let raw = self.extract_data(&file)?;
        let data = self.parse_data(&raw)?;
        let analysis = self.analyze(&data);
        self.send_report(&analysis);
        Ok(analysis)
    }

    fn open_file(&self, path: &str) -> Result<String, Box<dyn Error>>;
    fn extract_data(&self, file: &str) -> Result<String, Box<dyn Error>>;
    fn parse_data(&self, raw: &str) -> Result<Vec<Vec<String>>, Box<dyn Error>>;

    fn analyze(&self, data: &[Vec<String>]) -> String {
        format!("Analyzed {} records", data.len())
    }

    fn send_report(&self, _analysis: &str) {
        // Send report via email
    }
}

struct CSVMiner;

impl DataMiner for CSVMiner {
    fn open_file(&self, path: &str) -> Result<String, Box<dyn Error>> {
        Ok(fs::read_to_string(path)?)
    }

    fn extract_data(&self, file: &str) -> Result<String, Box<dyn Error>> {
        Ok(file.to_string())
    }

    fn parse_data(&self, raw: &str) -> Result<Vec<Vec<String>>, Box<dyn Error>> {
        let mut lines = raw.lines();
        let _headers = lines.next(); // skip header row
        Ok(lines
            .map(|line| line.split(',').map(String::from).collect())
            .collect())
    }
}

struct JSONMiner;

impl DataMiner for JSONMiner {
    fn open_file(&self, path: &str) -> Result<String, Box<dyn Error>> {
        Ok(fs::read_to_string(path)?)
    }

    fn extract_data(&self, file: &str) -> Result<String, Box<dyn Error>> {
        Ok(file.to_string())
    }

    fn parse_data(&self, raw: &str) -> Result<Vec<Vec<String>>, Box<dyn Error>> {
        // Simplified: parse JSON array of arrays
        let data: Vec<Vec<String>> = serde_json::from_str(raw)?;
        Ok(data)
    }
}

struct XMLMiner;

impl DataMiner for XMLMiner {
    fn open_file(&self, path: &str) -> Result<String, Box<dyn Error>> {
        Ok(fs::read_to_string(path)?)
    }

    fn extract_data(&self, file: &str) -> Result<String, Box<dyn Error>> {
        Ok(file.to_string())
    }

    fn parse_data(&self, raw: &str) -> Result<Vec<Vec<String>>, Box<dyn Error>> {
        // Simplified: extract text content from XML elements
        let records: Vec<Vec<String>> = raw
            .lines()
            .filter(|l| l.contains("</"))
            .map(|l| vec![l.trim().to_string()])
            .collect();
        Ok(records)
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let miner = CSVMiner;
    let result = miner.mine("data.csv")?;
    println!("{result}");
    Ok(())
}`
    }
};
