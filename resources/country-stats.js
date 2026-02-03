// Country statistics data for analytics
// Sources: World Bank, Global Peace Index, UNESCO, Numbeo (approximate data 2024)
const countryStatsData = {
    // Africa
    "Egypt": {
        area: 1002450,
        gdpPerCapita: 4295,
        safetyIndex: 49,
        touristsPerYear: 13.0,
        costIndex: 27,
        qualityOfLife: 48,
        unescoSites: 7,
        populationDensity: 103,
        happinessIndex: 4.3
    },

    // Asia
    "Japan": {
        area: 377975,
        gdpPerCapita: 33815,
        safetyIndex: 82,
        touristsPerYear: 31.9,
        costIndex: 83,
        qualityOfLife: 81,
        unescoSites: 25,
        populationDensity: 332,
        happinessIndex: 6.1
    },
    "Macao": {
        area: 33,
        gdpPerCapita: 43772,
        safetyIndex: 78,
        touristsPerYear: 28.0,
        costIndex: 75,
        qualityOfLife: 72,
        unescoSites: 1,
        populationDensity: 21340,
        happinessIndex: 5.5
    },
    "Hong Kong": {
        area: 1114,
        gdpPerCapita: 49800,
        safetyIndex: 76,
        touristsPerYear: 55.9,
        costIndex: 85,
        qualityOfLife: 75,
        unescoSites: 0,
        populationDensity: 6801,
        happinessIndex: 5.4
    },
    "Maldives": {
        area: 298,
        gdpPerCapita: 15183,
        safetyIndex: 70,
        touristsPerYear: 1.9,
        costIndex: 65,
        qualityOfLife: 62,
        unescoSites: 0,
        populationDensity: 1802,
        happinessIndex: 5.2
    },
    "Sri Lanka": {
        area: 65610,
        gdpPerCapita: 3815,
        safetyIndex: 55,
        touristsPerYear: 2.3,
        costIndex: 32,
        qualityOfLife: 54,
        unescoSites: 8,
        populationDensity: 341,
        happinessIndex: 4.4
    },
    "Georgia": {
        area: 69700,
        gdpPerCapita: 6671,
        safetyIndex: 68,
        touristsPerYear: 7.7,
        costIndex: 38,
        qualityOfLife: 58,
        unescoSites: 4,
        populationDensity: 57,
        happinessIndex: 5.1
    },
    "Nepal": {
        area: 147516,
        gdpPerCapita: 1336,
        safetyIndex: 58,
        touristsPerYear: 1.2,
        costIndex: 28,
        qualityOfLife: 45,
        unescoSites: 4,
        populationDensity: 203,
        happinessIndex: 5.4
    },
    "India": {
        area: 3287263,
        gdpPerCapita: 2389,
        safetyIndex: 41,
        touristsPerYear: 17.9,
        costIndex: 25,
        qualityOfLife: 43,
        unescoSites: 42,
        populationDensity: 464,
        happinessIndex: 4.0
    },
    "Indonesia": {
        area: 1904569,
        gdpPerCapita: 4788,
        safetyIndex: 53,
        touristsPerYear: 16.1,
        costIndex: 35,
        qualityOfLife: 52,
        unescoSites: 9,
        populationDensity: 151,
        happinessIndex: 5.3
    },
    "Philippines": {
        area: 300000,
        gdpPerCapita: 3685,
        safetyIndex: 48,
        touristsPerYear: 8.3,
        costIndex: 36,
        qualityOfLife: 50,
        unescoSites: 6,
        populationDensity: 368,
        happinessIndex: 5.9
    },
    "Thailand": {
        area: 513120,
        gdpPerCapita: 7066,
        safetyIndex: 56,
        touristsPerYear: 39.8,
        costIndex: 42,
        qualityOfLife: 58,
        unescoSites: 7,
        populationDensity: 137,
        happinessIndex: 6.0
    },
    "Laos": {
        area: 236800,
        gdpPerCapita: 2535,
        safetyIndex: 62,
        touristsPerYear: 4.7,
        costIndex: 30,
        qualityOfLife: 46,
        unescoSites: 3,
        populationDensity: 31,
        happinessIndex: 5.1
    },
    "Vietnam": {
        area: 331212,
        gdpPerCapita: 4163,
        safetyIndex: 60,
        touristsPerYear: 18.0,
        costIndex: 33,
        qualityOfLife: 55,
        unescoSites: 8,
        populationDensity: 314,
        happinessIndex: 5.8
    },
    "Cambodia": {
        area: 181035,
        gdpPerCapita: 1625,
        safetyIndex: 54,
        touristsPerYear: 6.6,
        costIndex: 32,
        qualityOfLife: 44,
        unescoSites: 4,
        populationDensity: 95,
        happinessIndex: 4.9
    },
    "Singapore": {
        area: 734,
        gdpPerCapita: 65233,
        safetyIndex: 84,
        touristsPerYear: 19.1,
        costIndex: 91,
        qualityOfLife: 86,
        unescoSites: 1,
        populationDensity: 8358,
        happinessIndex: 6.6
    },
    "Malaysia": {
        area: 330803,
        gdpPerCapita: 12364,
        safetyIndex: 63,
        touristsPerYear: 26.1,
        costIndex: 40,
        qualityOfLife: 64,
        unescoSites: 4,
        populationDensity: 99,
        happinessIndex: 6.0
    },
    "UAE": {
        area: 83600,
        gdpPerCapita: 43103,
        safetyIndex: 79,
        touristsPerYear: 21.0,
        costIndex: 67,
        qualityOfLife: 75,
        unescoSites: 1,
        populationDensity: 118,
        happinessIndex: 6.6
    },
    "Israel": {
        area: 22145,
        gdpPerCapita: 52170,
        safetyIndex: 45,
        touristsPerYear: 4.9,
        costIndex: 81,
        qualityOfLife: 73,
        unescoSites: 9,
        populationDensity: 400,
        happinessIndex: 7.4
    },
    "Turkey": {
        area: 783562,
        gdpPerCapita: 10616,
        safetyIndex: 47,
        touristsPerYear: 51.2,
        costIndex: 34,
        qualityOfLife: 56,
        unescoSites: 21,
        populationDensity: 110,
        happinessIndex: 4.7
    },
    "Azerbaijan": {
        area: 86600,
        gdpPerCapita: 6591,
        safetyIndex: 52,
        touristsPerYear: 3.2,
        costIndex: 36,
        qualityOfLife: 53,
        unescoSites: 3,
        populationDensity: 123,
        happinessIndex: 5.0
    },
    "Uzbekistan": {
        area: 448978,
        gdpPerCapita: 2255,
        safetyIndex: 57,
        touristsPerYear: 6.7,
        costIndex: 26,
        qualityOfLife: 47,
        unescoSites: 5,
        populationDensity: 79,
        happinessIndex: 6.0
    },
    "Kazakhstan": {
        area: 2724900,
        gdpPerCapita: 11477,
        safetyIndex: 55,
        touristsPerYear: 8.5,
        costIndex: 35,
        qualityOfLife: 56,
        unescoSites: 5,
        populationDensity: 7,
        happinessIndex: 5.9
    },

    // Europe
    "Belarus": {
        area: 207600,
        gdpPerCapita: 7888,
        safetyIndex: 42,
        touristsPerYear: 0.4,
        costIndex: 34,
        qualityOfLife: 48,
        unescoSites: 4,
        populationDensity: 45,
        happinessIndex: 5.5
    },
    "Poland": {
        area: 312696,
        gdpPerCapita: 18688,
        safetyIndex: 72,
        touristsPerYear: 21.4,
        costIndex: 45,
        qualityOfLife: 68,
        unescoSites: 17,
        populationDensity: 124,
        happinessIndex: 6.3
    },
    "Lithuania": {
        area: 65300,
        gdpPerCapita: 24030,
        safetyIndex: 74,
        touristsPerYear: 3.0,
        costIndex: 48,
        qualityOfLife: 69,
        unescoSites: 4,
        populationDensity: 43,
        happinessIndex: 6.8
    },
    "Latvia": {
        area: 64589,
        gdpPerCapita: 21148,
        safetyIndex: 73,
        touristsPerYear: 2.0,
        costIndex: 52,
        qualityOfLife: 66,
        unescoSites: 2,
        populationDensity: 30,
        happinessIndex: 6.2
    },
    "Estonia": {
        area: 45339,
        gdpPerCapita: 28247,
        safetyIndex: 76,
        touristsPerYear: 3.8,
        costIndex: 55,
        qualityOfLife: 72,
        unescoSites: 2,
        populationDensity: 31,
        happinessIndex: 6.5
    },
    "Finland": {
        area: 338424,
        gdpPerCapita: 53654,
        safetyIndex: 87,
        touristsPerYear: 3.3,
        costIndex: 78,
        qualityOfLife: 85,
        unescoSites: 7,
        populationDensity: 18,
        happinessIndex: 7.8
    },
    "Sweden": {
        area: 450295,
        gdpPerCapita: 55689,
        safetyIndex: 75,
        touristsPerYear: 7.6,
        costIndex: 76,
        qualityOfLife: 83,
        unescoSites: 15,
        populationDensity: 25,
        happinessIndex: 7.4
    },
    "Germany": {
        area: 357386,
        gdpPerCapita: 50801,
        safetyIndex: 71,
        touristsPerYear: 39.6,
        costIndex: 65,
        qualityOfLife: 79,
        unescoSites: 52,
        populationDensity: 240,
        happinessIndex: 7.0
    },
    "Austria": {
        area: 83879,
        gdpPerCapita: 53638,
        safetyIndex: 81,
        touristsPerYear: 31.9,
        costIndex: 73,
        qualityOfLife: 82,
        unescoSites: 12,
        populationDensity: 109,
        happinessIndex: 7.2
    },
    "Czech Republic": {
        area: 78865,
        gdpPerCapita: 27220,
        safetyIndex: 77,
        touristsPerYear: 14.3,
        costIndex: 50,
        qualityOfLife: 71,
        unescoSites: 17,
        populationDensity: 139,
        happinessIndex: 6.9
    },
    "France": {
        area: 643801,
        gdpPerCapita: 43659,
        safetyIndex: 62,
        touristsPerYear: 89.4,
        costIndex: 74,
        qualityOfLife: 74,
        unescoSites: 52,
        populationDensity: 119,
        happinessIndex: 6.7
    },
    "Italy": {
        area: 301340,
        gdpPerCapita: 34776,
        safetyIndex: 68,
        touristsPerYear: 65.0,
        costIndex: 68,
        qualityOfLife: 72,
        unescoSites: 59,
        populationDensity: 206,
        happinessIndex: 6.4
    },
    "Netherlands": {
        area: 41543,
        gdpPerCapita: 57025,
        safetyIndex: 75,
        touristsPerYear: 20.1,
        costIndex: 73,
        qualityOfLife: 82,
        unescoSites: 13,
        populationDensity: 508,
        happinessIndex: 7.4
    },
    "San Marino": {
        area: 61,
        gdpPerCapita: 46447,
        safetyIndex: 85,
        touristsPerYear: 2.0,
        costIndex: 70,
        qualityOfLife: 78,
        unescoSites: 1,
        populationDensity: 556,
        happinessIndex: 6.7
    },
    "Greece": {
        area: 131957,
        gdpPerCapita: 20867,
        safetyIndex: 69,
        touristsPerYear: 33.1,
        costIndex: 54,
        qualityOfLife: 66,
        unescoSites: 19,
        populationDensity: 81,
        happinessIndex: 5.9
    },
    "Belgium": {
        area: 30528,
        gdpPerCapita: 51767,
        safetyIndex: 70,
        touristsPerYear: 9.8,
        costIndex: 71,
        qualityOfLife: 76,
        unescoSites: 16,
        populationDensity: 383,
        happinessIndex: 6.8
    },
    "Hungary": {
        area: 93028,
        gdpPerCapita: 18728,
        safetyIndex: 71,
        touristsPerYear: 16.9,
        costIndex: 46,
        qualityOfLife: 65,
        unescoSites: 8,
        populationDensity: 107,
        happinessIndex: 6.0
    },
    "Spain": {
        area: 505990,
        gdpPerCapita: 30103,
        safetyIndex: 74,
        touristsPerYear: 83.7,
        costIndex: 53,
        qualityOfLife: 75,
        unescoSites: 49,
        populationDensity: 94,
        happinessIndex: 6.5
    }
};

// Analytics category definitions
const analyticsCategories = [
    {
        id: 'area',
        icon: 'fa-map',
        title: 'Territory',
        titleRu: 'Территория',
        unit: 'km²',
        format: (val) => val >= 1000000 ? (val / 1000000).toFixed(1) + 'M km²' : val >= 1000 ? Math.round(val / 1000) + 'K km²' : val + ' km²',
        higherBetter: true,
        labelTop: '🔝 Largest',
        labelBottom: '🔻 Smallest'
    },
    {
        id: 'gdpPerCapita',
        icon: 'fa-dollar-sign',
        title: 'Economy',
        titleRu: 'Экономика',
        unit: 'USD',
        format: (val) => '$' + val.toLocaleString(),
        higherBetter: true,
        labelTop: '🔝 Richest',
        labelBottom: '🔻 Poorest'
    },
    {
        id: 'safetyIndex',
        icon: 'fa-shield-alt',
        title: 'Safety',
        titleRu: 'Безопасность',
        unit: 'score',
        format: (val) => val + '/100',
        higherBetter: true,
        labelTop: '🔝 Safest',
        labelBottom: '🔻 Least safe'
    },
    {
        id: 'touristsPerYear',
        icon: 'fa-users',
        title: 'Tourism',
        titleRu: 'Туризм',
        unit: 'M/year',
        format: (val) => val.toFixed(1) + 'M/year',
        higherBetter: true,
        labelTop: '🔝 Most visited',
        labelBottom: '🔻 Least visited'
    },
    {
        id: 'costIndex',
        icon: 'fa-wallet',
        title: 'Cost of Living',
        titleRu: 'Стоимость',
        unit: 'index',
        format: (val) => val + '/100',
        higherBetter: false,
        labelTop: '🔝 Cheapest',
        labelBottom: '🔻 Most expensive'
    },
    {
        id: 'qualityOfLife',
        icon: 'fa-heart',
        title: 'Quality of Life',
        titleRu: 'Качество жизни',
        unit: 'index',
        format: (val) => val + '/100',
        higherBetter: true,
        labelTop: '🔝 Best',
        labelBottom: '🔻 Worst'
    },
    {
        id: 'unescoSites',
        icon: 'fa-landmark',
        title: 'UNESCO Sites',
        titleRu: 'Наследие ЮНЕСКО',
        unit: 'sites',
        format: (val) => val + ' sites',
        higherBetter: true,
        labelTop: '🔝 Most heritage',
        labelBottom: '🔻 Least heritage'
    },
    {
        id: 'populationDensity',
        icon: 'fa-city',
        title: 'Population Density',
        titleRu: 'Плотность населения',
        unit: 'people/km²',
        format: (val) => val.toLocaleString() + '/km²',
        higherBetter: false,
        labelTop: '🔝 Least crowded',
        labelBottom: '🔻 Most crowded'
    },
    {
        id: 'happinessIndex',
        icon: 'fa-smile',
        title: 'Happiness Index',
        titleRu: 'Индекс счастья',
        unit: 'score',
        format: (val) => val.toFixed(1) + '/10',
        higherBetter: true,
        labelTop: '🔝 Happiest',
        labelBottom: '🔻 Least happy'
    }
];
