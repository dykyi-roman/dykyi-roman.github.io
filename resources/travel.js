// Countries data with flags and continent grouping
const countriesData = {
    asia: [
        {
            flag: '🇯🇵',
            name: 'Japan',
            visitDate: '2023-04',
            duration: '30 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Osaka': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CrzXBv6ybEu/',
                        'https://www.instagram.com/dykyi.roman/p/Cr2hhS1LRs7/',
                    ],
                    facebook: []
                },
                'Kyoto': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CsD_X39rasD/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CsI24yKrNHg/',
                    ],
                    facebook: []
                },
                'Tokyo': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cshj-fFyOPQ/',
                        'https://www.instagram.com/dykyi.roman/p/CskKrKhSprj/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CsvcEnVr9aT/',
                        'https://www.instagram.com/dykyi.roman/p/CsxJLPuy1LO/',
                        'https://www.instagram.com/dykyi.roman/p/Csykvz1SK2g/',
                        'https://www.instagram.com/dykyi.roman/p/CszwL3HSFK8/',
                        'https://www.instagram.com/dykyi.roman/p/Cs2JGwXy0P9/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cs3viqKL9cs/',
                    ],
                    facebook: []
                },
                'Fujinomiya': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CsoRv8OS9Xw/?img_index=1',
                    ],
                    facebook: []
                },
                'Yokohama': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Csq3NivS5D-/?img_index=1',
                    ],
                    facebook: []
                },
                'Nara': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cro8DcpyNO8/',
                    ],
                    facebook: []
                }
            },
            notes: 'Amazing culture and technology blend',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇲🇴',
            name: 'Macao',
            visitDate: '2023-04',
            duration: '1 day',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Macau': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CrjxcGZyZMN/',
                        'https://www.instagram.com/dykyi.roman/p/CrmSx6uSXPD/',
                    ],
                    facebook: []
                }
            },
            notes: 'Unique East-West fusion',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇭🇰',
            name: 'Hong Kong',
            visitDate: '2023-04',
            duration: '14 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Hong Kong': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CrW-9m7yKYA/',
                        'https://www.instagram.com/dykyi.roman/p/CrUcMSVy-ng/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CrbMDA0ytmO/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CrfXMVhrHPg/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CrhA19OSbsK/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Incredible city energy',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇲🇻',
            name: 'Maldives',
            visitDate: '2022-02',
            duration: '30 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Male': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CaKyVsgPo1n/?img_index=1',
                    ],
                    facebook: []
                },
                'Thoddoo': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CZ3si2VrBEd/?img_index=1',
                    ],
                    facebook: []
                },
                'Ukulhas': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CaKxxQaP1Sx/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Paradise on Earth',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇱🇰',
            name: 'Sri Lanka',
            visitDate: '2022-07',
            duration: '60 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Colombo': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfVSgySLLPZ/',
                    ],
                    facebook: []
                },
                'Benthota': {
                    instagram: [],
                    facebook: []
                },
                'Unawatuna': {
                    instagram: [],
                    facebook: []
                },
                'Mount Lavinia': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfUM1_8PE3M/',
                    ],
                    facebook: []
                },
                'Kandy': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfJNkp3LMMT/?img_index=1',
                    ],
                    facebook: []
                },
                'Dambulla': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfOjMv6LicW/?img_index=1',
                    ],
                    facebook: []
                },
                'Polonnaruwa': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfRA-oVrra6/?img_index=1',
                    ],
                    facebook: []
                },
                'Pinnawala': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfWvOlevU7n/?img_index=1',
                    ],
                    facebook: []
                },
                'Galle': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfHR5AOvMtJ/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CfIM6m7PaaA/?img_index=1',
                    ],
                    facebook: []
                },
                'Ella': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfJ0KZvP424/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CfMUmFxvm1q/',
                    ],
                    facebook: []
                },
            },
            notes: 'Rich history and nature',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇳🇵',
            name: 'Nepal',
            visitDate: '2024-05',
            duration: '21 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Kathmandu': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C6qozKsIz4f/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6tVCTtJ9ds/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6umuwBPHx4/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6xb-eyIF6a/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6zyCL2PV2f/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C62jTv2JRgs/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C65JL1dJmOA/?img_index=1',
                    ],
                    facebook: []
                },
                'Baktapur': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C67zwrLptKr/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6-YSwzJSxd/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7A47TiJAbb/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7DmW6WRVSq/?img_index=1',
                    ],
                    facebook: []
                },
                'Lukla': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C7GH329pKwt/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7InUIcp1_W/?img_index=1',
                    ],
                },
            },
            notes: 'Life-changing trekking experience',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇮🇳',
            name: 'India',
            visitDate: '2019-07',
            duration: '30 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'New Delhi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUAnqh8oQ72/',
                    ],
                    facebook: []
                },
                'Jaipur': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_9eTjLrAe/',
                    ],
                    facebook: []
                },
                'Varanasi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_8xBtLFXQ/',
                    ],
                    facebook: []
                },
                'Agra': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_-G5cLydv/?img_index=1',
                    ],
                    facebook: []
                },
                'Goa': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT__16hLARO/',
                    ],
                    facebook: []
                }
            },
            notes: 'Incredible diversity and chaos',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇮🇩',
            name: 'Indonesia',
            visitDate: '2022-09',
            duration: '60 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Jakarta': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CknKy_oLiun/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cko9DJ9SqQs/',
                        'https://www.instagram.com/dykyi.roman/p/Ckrc2lDy7Hj/',
                    ],
                    facebook: []
                },
                'Kuta': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CkUST3oy1YX/',
                        'https://www.instagram.com/dykyi.roman/p/CkW6jKDyGea/',
                        'https://www.instagram.com/dykyi.roman/p/CkZVov3y0i3/',
                        'https://www.instagram.com/dykyi.roman/p/CkcC55CSzoc/',
                    ],
                    facebook: []
                },
                'Ubud': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Ci6P7X_PQZp/',
                        'https://www.instagram.com/dykyi.roman/p/Ci8xkE2PG2S/',
                        'https://www.instagram.com/dykyi.roman/p/Ci_P6oDv1FS/',
                        'https://www.instagram.com/dykyi.roman/p/CjB32m5vXpY/',
                        'https://www.instagram.com/dykyi.roman/p/CjIqWeGr8PB/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CjNhqNeL5iJ/',
                        'https://www.instagram.com/dykyi.roman/p/CjVg0I5rgxw/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CjZBR62vcrg/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CjaNtvKL6rP/?img_index=1',
                    ],
                    facebook: []
                },
                'Amed': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cjl2fuzvfFj/',
                        'https://www.instagram.com/dykyi.roman/p/CjrSg9zLhEX/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CkMx-ShydtN/?img_index=1',
                    ],
                    facebook: []
                },
                'Sanur': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CiXur1Ir1mz/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CigfxnGv52K/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CijO8NpLxjd/',
                        'https://www.instagram.com/dykyi.roman/p/CipI6vuLGy2/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Ciy-04PLpMk/?img_index=1',
                    ],
                    facebook: []
                },
                'Nusa Penida': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CimtnoQL9Z9/',
                    ],
                    facebook: []
                },
            },
            notes: 'Island paradise with rich culture',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇵🇭',
            name: 'Philippines',
            visitDate: '2023-01',
            duration: '120 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Cebu City': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CobIyCQSsP6/',
                    ],
                    facebook: []
                },
                'Palawan': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cpd03DSSzE0/?img_index=1',
                    ],
                    facebook: []
                },
                'Puerto Princesa': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CpbNGVBSuXZ/',
                    ],
                    facebook: []
                },
                'Moalboal': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CoeJ4iYrlnY/?img_index=1',
                    ],
                    facebook: []
                },
                'Oslob': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CogVXuPyRfM/',
                    ],
                    facebook: []
                },
                'El Nido': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cpmk_JxLwjF/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cpqx5G1SQUL/',
                        'https://www.instagram.com/dykyi.roman/p/CptUG0yyZwz/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cpv4gZzvpaO/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CpyhzxCSMvd/?img_index=1',
                    ],
                    facebook: []
                },
                'Coron': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cp3n5MGSD3x/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cp7qGI0rZ2b/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CqKhl2SrsU4/?img_index=1',
                    ],
                    facebook: []
                },
                'Boracay': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CqT34UvSUnf/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CqWi8t7S7yJ/?img_index=1',
                    ],
                    facebook: []
                },
                'Panglao': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CpFyY05SL1y/',
                        'https://www.instagram.com/dykyi.roman/p/CpJQWGoyT_S/',
                        'https://www.instagram.com/dykyi.roman/p/CpLtho2SPhW/',
                    ],
                    facebook: []
                },
                'Manila': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cqx8h5ByCoF/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cq0OnJlLHeW/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cq6uFZtS0_0/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cq9OzwRyHos/?img_index=1',
                    ],
                    facebook: []
                },
                'Bohol': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CojxXHHLlKT/',
                        'https://www.instagram.com/dykyi.roman/p/CpG1GRnymPK/',
                    ],
                    facebook: []
                }
            },
            notes: 'Beautiful islands and friendly people',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇹🇭',
            name: 'Thailand',
            visitDate: '2022-07',
            duration: '360 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Bangkok': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CgHVtGEr4JU/',
                        'https://www.instagram.com/dykyi.roman/p/CgIlwikvoNX/',
                        'https://www.instagram.com/dykyi.roman/p/CgUdPOUrPBr/',
                        'https://www.instagram.com/dykyi.roman/p/CgVd8wyPcHN/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cghe3WBvlj9/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cgnm_5yrFMI/',
                        'https://www.instagram.com/dykyi.roman/p/Cg1PpjYLCrt/',
                        'https://www.instagram.com/dykyi.roman/p/Cg3L_zCrmjo/',
                        'https://www.instagram.com/dykyi.roman/p/CmmAIV5LMYW/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cm1zGeiyCNV/',
                        'https://www.instagram.com/dykyi.roman/p/Cv1AgTTrSvn/?img_index=1',
                    ],
                    facebook: []
                },
                'Sala Keo Kou': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CtEqy_vy5E7/',
                    ],
                    facebook: []
                },
                'Phuket': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Ck59KAYS6gd/',
                        'https://www.instagram.com/dykyi.roman/p/Ck9iun-yG0w/',
                        'https://www.instagram.com/dykyi.roman/p/ClADZhRyLKA/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cl9C5k5yDEN/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cl_gxC3Sm0J/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CmSjyzfSXNS/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CmVErbIyAMB/',
                        'https://www.instagram.com/dykyi.roman/p/CmXp7K0SimG/',
                        'https://www.instagram.com/dykyi.roman/p/CoPAn6xLoV9/', // 1 Year in Asia
                    ],
                    facebook: []
                },
                'Phi Phi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Clde8njLjgX/',
                        'https://www.instagram.com/dykyi.roman/p/Cle_nTAyLd5/',
                        'https://www.instagram.com/dykyi.roman/p/CnPaN2AybCc/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CnhepUVya9m/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cnj-IbtSnoX/',
                        'https://www.instagram.com/dykyi.roman/p/C6DZUaxpfx1/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6FbJj_Po-P/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6IM0pHo6Vm/?img_index=1',
                    ],
                    facebook: []
                },
                'Pattaya': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/ChU7ak0POcr/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/ChaAzn1Jr_p/',
                        'https://www.instagram.com/dykyi.roman/p/Ch2U5FFv7fg/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Ch4yDk-rQtn/',
                        'https://www.instagram.com/dykyi.roman/p/Ch_dC1JrqhZ/',
                        'https://www.instagram.com/dykyi.roman/p/CiClM4Erxw6/',
                        'https://www.instagram.com/dykyi.roman/p/CiMgvM5LhtB/',
                        'https://www.instagram.com/dykyi.roman/p/CiPdzCgryX1/?img_index=1',
                    ],
                    facebook: []
                },
                'Chiang Mai': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cg61Ps9rOb2/',
                        'https://www.instagram.com/dykyi.roman/p/ChGfOn6PQwt/?img_index=1',
                    ],
                    facebook: []
                },
                'Koh Lang': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CiFnuftLqNb/',
                    ],
                    facebook: []
                },
                'Chiang Rai': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cg8ZoRVL0ma/',
                        'https://www.instagram.com/dykyi.roman/p/ChBWArfvD4b/',
                        'https://www.instagram.com/dykyi.roman/p/ChJWSUErb4h/',
                    ],
                    facebook: []
                },
                'Krabi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CwPLCWqL43O/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CwY2ey6SmAH/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CweLIgwSRKE/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CwtcY-iSh03/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CwwJr4VyKkJ/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cwyl7s0SAu-/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C1kACz8JdhR/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C2Y-w3tJdkg/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C2mJlvmJwDN/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C2n9hhSPpAz/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C2qmiWbvdd-/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C24e5jFJyX6/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C25_rIVvfbt/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C3ma0ThvcBt/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C3tgOyMPkqU/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C3wK_MOJptZ/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C47FiF9JaEQ/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C5LwOFcpLwD/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C5PQz0Dy1Ol/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C5Uz2U1Jm57/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C5xcd0CJb-_/?img_index=1', // NY
                    ],
                    facebook: []
                },
                'Koh Samui': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CxkFf_9rR_w/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Czz2IEWy1A0/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cz46T6WSJYU/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C0DJowJSARl/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C0F0nXDSAf6/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C1PN_CepLPc/?img_index=1',
                    ],
                    facebook: []
                },
                'Koh Pha Ngan': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CxzBhZZywUC/?img_index=1',
                    ],
                    facebook: []
                },
                'Koh Nang': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CyXNsEBrmuR/?img_index=1',
                    ],
                    facebook: []
                },
                'Koh Tao': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cx4OjjwSw23/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cx6ti_syXWT/?img_index=1',
                    ],
                    facebook: []
                }, // close 'Koh Tao'
            }, // close 'highlights'
            notes: 'Perfect backpacking destination',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇱🇦',
            name: 'Laos',
            visitDate: '2023-06',
            duration: '30 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Vientiane': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_gXUgI1n7/',
                        'https://www.instagram.com/dykyi.roman/p/CtoM_x4LioV/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CtjiD-BSORR/',
                        'https://www.instagram.com/dykyi.roman/p/CtlkDrVr3_I/',
                    ],
                    facebook: []
                },
                'Luang Prabang': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CuI4MXdS_em/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CuLQOEnSlgo/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CuQcQeUysA0/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CuS-WCSyH5J/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CuVn8NjyTyX/?img_index=1',
                    ],
                    facebook: []
                },
                'Vang Vieng': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Ct3lTX6rYoe/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Ct5LTBBSVoL/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Ct7-IgRSynL/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Ct-T32aSy47/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CuA-0htS4lA/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Peaceful and authentic',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇻🇳',
            name: 'Vietnam',
            visitDate: '2023-07',
            duration: '30 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Hanoi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CujCoHZLTlh/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cuk_YO2y8zT/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CunpcdvSXxl/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cvd8fq0rMls/?img_index=1',
                    ],
                    facebook: []
                },
                'Halong': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cu0i578Sjyb/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cu3ElMyy6OK/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cu5qlqnyc2Z/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cu7SEJOSam5/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CvC-nWAyZlz/?img_index=1',
                    ],
                    facebook: [],
                },
                'Nin Binh': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CvLlRx7SPU3/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CvOLC5FydNc/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CvRhjtlLryI/?img_index=1',
                    ],
                    facebook: []
                },
                'Da Nang': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CvlmkfALZIf/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CvYhneDSph_/?img_index=1',
                    ],
                    facebook: []
                },
                'Hoi An': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Cvi0SUrSZMg/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Amazing food and landscapes',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇰🇭',
            name: 'Cambodia',
            visitDate: '2022-06',
            duration: '21 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Siem Reap': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CeqlpEErGUS/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CeqmGLKru_k/',
                    ],
                    facebook: []
                },
                'Phnom Penh': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/Ceqoh-WrQ_c/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CeqpeYJLeZ5/',
                        'https://www.instagram.com/dykyi.roman/p/CetVzuzLUb5/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Rich Khmer heritage',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇸🇬',
            name: 'Singapore',
            visitDate: '2022-05',
            duration: '4 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Singapore': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CeGzz_6L2U3/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Modern city-state perfection',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇲🇾',
            name: 'Malaysia',
            visitDate: '2022-07',
            duration: '70 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Kuala Lumpur': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfgXqpjLksH/',
                        'https://www.instagram.com/dykyi.roman/p/Cfi-EKxLCMf/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CfxoigvL28z/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/Cf0S5HJLOg6/',
                        'https://www.instagram.com/dykyi.roman/p/Cf1RIgSrwUQ/',
                        'https://www.instagram.com/dykyi.roman/p/Cf3CtT6L151/',
                        'https://www.instagram.com/dykyi.roman/p/C1QqzQTpJf7/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C2BVExdIUV2/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C4g_3UpPqLN/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C6bpRaUozg2/?img_index=1',
                    ],
                    facebook: []
                },
                'Malacca': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CfsVcaMvo7r/',
                    ],
                    facebook: []
                }
            },
            notes: 'Great cultural diversity',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇦🇪',
            name: 'UAE',
            visitDate: '2018-03',
            duration: '21 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Dubai': {
                    instagram: [
                        'https://www.instagram.com/p/CT-ASs6oGan/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7XLoCYo6Ae/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7bF7HWIPna/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7dQ__IIeEX/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7f37cLol25/?img_index=1',
                    ],
                    facebook: []
                },
                'Abu Dhabi': {
                    instagram: [
                        'https://www.instagram.com/p/CT-A36zojAm/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C7TE4AzI8Wr/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Modern Arabian dream',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇮🇱',
            name: 'Israel',
            visitDate: '2019-05',
            duration: '14 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Jerusalem': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_hZ4BoCfA/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/CT_iS-yoyFR/?img_index=1',
                    ],
                    facebook: []
                },
                'Tel Aviv-Yafo': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_jU7JIy56/?img_index=1',
                    ],
                    facebook: []
                },
                'Haifa': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_jbnlo-st/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Historical and spiritual journey',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇹🇷',
            name: 'Turkey',
            visitDate: '2018-05',
            duration: '14 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Istanbul': {
                    instagram: [
                        'https://www.instagram.com/p/DN3wgZ-3Pyr/?img_index=1',
                        'https://www.instagram.com/p/DN7agDViL7g/?img_index=1',
                        'https://www.instagram.com/p/CT9gkMPIgaY/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Bridge between Europe and Asia',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇬🇪',
            name: 'Georgia',
            visitDate: '2024-05',
            duration: '360 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Kutaisi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C7lQ8tCIWdm',
                        'https://www.instagram.com/dykyi.roman/p/C7nv2N4oou9',
                        'https://www.instagram.com/dykyi.roman/p/C7qNDFXot-T',
                    ],
                    facebook: []
                },
                'Vanadzia': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/DLQE-zFIgF_/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DLb_hv6ITvi/?img_index=1',
                    ],
                    facebook: []
                },
                'Batumi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C8gTZDfI6dY',
                        'https://www.instagram.com/dykyi.roman/p/C8iw5Zuo2RD/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C9C-eWjoZ26/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C9Eo3y6IW5Q/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C9WW_9Lon49/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C-KyjlvIydG/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/C-hVn3Vo5dW/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DDC3ndeoQD8/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DL34bUPoQkD/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DMCM2jDoh5W/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DMRkHgSowRw/?img_index=1',
                    ],
                    facebook: []
                },
                'Tbilisi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/DERYlJXofLc/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DFhR85vIUdm/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DFjss2zo_QT/?img_index=1',
                    ],
                    facebook: [],
                },
                'Borjomi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/DEunVoWo80N/?img_index=1'
                    ],
                    facebook: []
                },
                'Mestia': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/DA1LKymocVM/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DA2W8_zoWwE/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DA450E_oAAL/?img_index=1',
                        'https://www.instagram.com/dykyi.roman/p/DA7elW-oT4v/?img_index=1',
                    ],
                    facebook: [],
                }
            },
            notes: 'Hidden gem with great hospitality',
            instagram: [
                'https://www.instagram.com/p/DMRkHgSowRw',
                'https://www.instagram.com/p/DMCM2jDoh5W'
            ],
            facebook: [
                'https://www.facebook.com/p/1PGfzjtX9S'
            ]
        },
        {
            flag: '🇦🇿',
            name: 'Azerbaijan',
            visitDate: '2024-09',
            duration: '10 days',
            rating: '⭐⭐⭐',
            highlights: {
                'Baku': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/C_04IBJIDQN',
                        'https://www.instagram.com/dykyi.roman/p/C_3bIi2oO7f/',
                        'https://www.instagram.com/dykyi.roman/p/C_9y3FeIb11',
                        'https://www.instagram.com/dykyi.roman/p/DAAX8gQo3vs',
                        'https://www.instagram.com/dykyi.roman/p/DAEM2lzIwYz',
                        'https://www.instagram.com/dykyi.roman/p/DAK0UG4Ixsb',
                        'https://www.instagram.com/dykyi.roman/p/C_yVOj5ohBf',
                    ],
                    facebook: []
                }
            },
            notes: 'Land of fire and oil',
            instagram: [
                'https://www.instagram.com/dykyi.roman/p/C_04IBJIDQN',
                'https://www.instagram.com/dykyi.roman/p/C_3bIi2oO7f/',
                'https://www.instagram.com/dykyi.roman/p/C_9y3FeIb11',
                'https://www.instagram.com/dykyi.roman/p/DAAX8gQo3vs',
                'https://www.instagram.com/dykyi.roman/p/DAEM2lzIwYz',
                'https://www.instagram.com/dykyi.roman/p/DAK0UG4Ixsb',
                'https://www.instagram.com/dykyi.roman/p/C_yVOj5ohBf',
            ],
            facebook: []
        },
        { flag: '🇺🇿', name: 'Uzbekistan', visitDate: '2025-08', duration: '07 days', rating: '⭐⭐⭐', highlights: {
                'Tashkent': {
                    instagram: [
                        'https://www.instagram.com/p/DNSuH2fI8Lj/?img_index=1',
                        'https://www.instagram.com/p/DNUorL7ope0/?img_index=1',
                    ],
                    facebook: []
                },
                'Bukhara': {
                  instagram: [
                      'https://www.instagram.com/p/DNfAyhBovtf/?img_index=1',
                  ]
                },
                'Samarkand': {
                    instagram: [
                        'https://www.instagram.com/p/DNkUnixoU9o/?img_index=1',
                        'https://www.instagram.com/p/DNpNVFoo7j8/?img_index=1',
                        'https://www.instagram.com/p/DNrydc0UMAQ/?img_index=1',
                        'https://www.instagram.com/p/DNujNl_0OMi/?img_index=1',
                    ],
                }
            }, notes: 'Land of rivers and mountains' },
        { flag: '🇰🇿', name: 'Kazakhstan', visitDate: '2025-08', duration: '14 days', rating: '⭐⭐⭐', highlights: {
            'Almaty': {
                instagram: [
                    'https://www.instagram.com/p/DM4NsTKovon/?img_index=1',
                    'https://www.instagram.com/p/DM_6h67IMBj/?img_index=1',
                    'https://www.instagram.com/p/DNJSQa_o-fz/?img_index=1',
                    'https://www.instagram.com/p/DNLvam_okPs/?img_index=1',
                    'https://www.instagram.com/p/DNOQORBIHVV/?img_index=1',
                ],
                facebook: []
            }
        }, notes: 'Land of rivers and mountains' },
    ],
    europe: [
        {
            flag: '🇧🇾',
            name: 'Belarus',
            visitDate: '2014-06',
            duration: '7 days',
            rating: '⭐⭐⭐',
            highlights: {
                'Minsk': {
                    instagram: [
                        'https://www.instagram.com/p/CT9btReLc3g/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Last dictatorship of Europe',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇵🇱',
            name: 'Poland',
            visitDate: '2018-10',
            duration: '30 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Warsaw': {
                    instagram: [],
                    facebook: []
                },
                'Kraków': {
                    instagram: [],
                    facebook: []
                },
                'Wrocław': {
                    instagram: [
                        'https://www.instagram.com/p/CT9bKpdrN6n/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Rich history and culture',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇱🇹',
            name: 'Lithuania',
            visitDate: '2019-10',
            duration: '5 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Vilnius': {
                    instagram: [
                        'https://www.instagram.com/p/CT9-REDIPg5/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Beautiful Baltic state',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇱🇻',
            name: 'Latvia',
            visitDate: '2019-06',
            duration: '1000 days',
            rating: '⭐⭐⭐',
            highlights: {
                'Riga': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_kC2EoAI6/',
                    ],
                    facebook: []
                },
                'Jūrmala': {
                    instagram: [],
                    facebook: []
                }
            },
            notes: 'Charming medieval city',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇪🇪',
            name: 'Estonia',
            visitDate: '2019-11',
            duration: '1 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Tallinn': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_nVVPoUI6/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Most digital country',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇫🇮',
            name: 'Finland',
            visitDate: '2022-01',
            duration: '10 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Helsinki': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CYbD3x2AMQx/?img_index=1',
                    ],
                    facebook: []
                },
                'Rovaniemi': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CYbE_qooyNh/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Land of thousand lakes',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇸🇪',
            name: 'Sweden',
            visitDate: '2019-10',
            duration: '1 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Stockholm': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_mQuYoGPa/',
                    ],
                    facebook: []
                }
            },
            notes: 'Scandinavian perfection',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇩🇪',
            name: 'Germany',
            visitDate: '2017-09',
            duration: '30 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Berlin': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_3Wj8L_yC/',
                    ],
                    facebook: []
                },
                'Frankfurt am Main': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_xrSVrVNo/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Efficient and historical',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇦🇹',
            name: 'Austria',
            visitDate: '2007-01',
            duration: '7 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Vienna': {
                    instagram: [],
                    facebook: []
                }
            },
            notes: 'Musical and mountainous',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇨🇿',
            name: 'Czech Republic',
            visitDate: '2017-09',
            duration: '14 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Prague': {
                    instagram: [],
                    facebook: []
                },
                'Pilzen': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT9amNSrQaC/',
                    ],
                    facebook: []
                }
            },
            notes: 'Fairy tale architecture',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇫🇷',
            name: 'France',
            visitDate: '2017-04',
            duration: '7 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Paris': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_vWIELWxO/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Art, culture, and cuisine',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇮🇹',
            name: 'Italy',
            visitDate: '2021-09',
            duration: '21 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Milan': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHDwqnICSi/?img_index=1',
                    ],
                    facebook: []
                },
                'Treviso': {
                    instagram: [],
                    facebook: []
                },
                'Bologna': {
                    instagram: [],
                    facebook: []
                },
                'Florence': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHFw1coo2i/?img_index=1',
                    ],
                    facebook: []
                },
                'Venice': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHE-zjoy0i/?img_index=1',
                    ],
                    facebook: []
                },
                'Rimini': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHHRNXoDFL/?img_index=1',
                    ],
                    facebook: []
                },
                'Bologna': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHEdeno_e1/',
                    ],
                    facebook: []
                },
                'Pisa': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CUHGK8IoEtp/',
                    ],
                    facebook: [],
                }
            },
            notes: 'Renaissance and romance',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇳🇱',
            name: 'Netherlands',
            visitDate: '2018-03',
            duration: '7 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Amsterdam': {
                    instagram: [
                        'https://www.instagram.com/p/CT9dWDcLJtp/?img_index=1',
                    ],
                    facebook: []
                },
                'Rotterdam': {
                    instagram: [
                        'https://www.instagram.com/p/CT9dbaQr_YE/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Liberal and flat',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇸🇲',
            name: 'San Marino',
            visitDate: '2021-09',
            duration: '1 day',
            rating: '⭐⭐⭐',
            highlights: {
                'San Marino': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CULT2wBr86B/',
                    ],
                    facebook: []
                }
            },
            notes: 'Tiny mountain republic',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇬🇷',
            name: 'Greece',
            visitDate: '2017-08',
            duration: '14 days',
            rating: '⭐⭐⭐⭐⭐',
            highlights: {
                'Athens': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_fJs-o0IM/?img_index=1',
                    ],
                    facebook: []
                },
                'Kalampaka': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_fPijoxaV/?img_index=1',
                    ],
                    facebook: []
                },
                'Santorini': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT-QwHlrpRb/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Cradle of civilization',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇧🇪',
            name: 'Belgium',
            visitDate: '2016-10',
            duration: '7 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Brussels': {
                    instagram: [
                        'https://www.instagram.com/dykyi.roman/p/CT_rqssL8XT/',
                    ],
                    facebook: []
                }
            },
            notes: 'Waffles and medieval charm',
            instagram: [],
            facebook: []
        },
        {
            flag: '🇭🇺',
            name: 'Hungary',
            visitDate: '2017-01',
            duration: '7 days',
            rating: '⭐⭐⭐⭐',
            highlights: {
                'Budapest': {
                    instagram: [
                        'https://www.instagram.com/p/CT9eTYKLkyd/?img_index=1',
                    ],
                    facebook: []
                }
            },
            notes: 'Pearl of the Danube',
            instagram: [],
            facebook: []
        },
        { flag: '🇪🇸', name: 'Spain', visitDate: '2025-08', duration: 'long term', rating: '⭐⭐⭐⭐', highlights: ['Barcelona'], notes: 'Catalonia and Andalusia' }
    ],
};

// Wishlist countries - places to visit in the future
const wishlistCountries = {
    africa: [
        {flag: '🇪🇬', name: 'Egypt', wishIcon: '🌟'},
        {flag: '🇲🇬', name: 'Madagascar', wishIcon: '🌟'},
        {flag: '🇲🇺', name: 'Mauritius', wishIcon: '🌟'},
        {flag: '🇹🇿', name: 'Tanzania', wishIcon: '🌟'},
        {flag: '🇰🇪', name: 'Kenya', wishIcon: '🌟'},
        {flag: '🇪🇹', name: 'Ethiopia', wishIcon: '🌟'},
        {flag: '🇸🇦', name: 'Socotra', wishIcon: '🌟'}
    ],
    asia: [
        {flag: '🇶🇦', name: 'Qatar', wishIcon: '🌟'},
        {flag: '🇨🇳', name: 'China', wishIcon: '🌟'},
        {flag: '🇰🇷', name: 'South Korea', wishIcon: '🌟'},
        {flag: '🇾🇪', name: 'Yamen', wishIcon: '🌟'},
    ],
    oceania: [
        {flag: '🇵🇬', name: 'Papua New Guinea', wishIcon: '🌟'},
        {flag: '🇦🇺', name: 'Australia', wishIcon: '🌟'},
        {flag: '🇳🇿', name: 'New Zealand', wishIcon: '🌟'}
    ],
    america: [
        {flag: '🇨🇦', name: 'Canada', wishIcon: '🌟'},
        {flag: '🇺🇸', name: 'USA', wishIcon: '🌟'}
    ],
    'latin-america': [
        {flag: '🇧🇷', name: 'Brazil', wishIcon: '🌟'},
        {flag: '🇦🇷', name: 'Argentina', wishIcon: '🌟'},
        {flag: '🇨🇱', name: 'Chile', wishIcon: '🌟'},
        {flag: '🇨🇴', name: 'Colombia', wishIcon: '🌟'},
        {flag: '🇻🇪', name: 'Venezuela', wishIcon: '🌟'},
        {flag: '🇵🇦', name: 'Panama', wishIcon: '🌟'},
        {flag: '🇲🇽', name: 'Mexico', wishIcon: '🌟'},
        {flag: '🇬🇹', name: 'Guatemala', wishIcon: '🌟'},
        {flag: '🇵🇪', name: 'Peru', wishIcon: '🌟'},
        {flag: '🇪🇨', name: 'Ecuador', wishIcon: '🌟'},
        {flag: '🇧🇴', name: 'Bolivia', wishIcon: '🌟'},
        {flag: '🇨🇺', name: 'Cuba', wishIcon: '🌟'},
        {flag: '🇵🇷', name: 'Puerto Rico', wishIcon: '🌟'},
    ]
};

// Calculate total countries count
function getTotalCountriesCount() {
    return countriesData.asia.length + countriesData.europe.length;
}

// Calculate total wishlist countries count
function getTotalWishlistCount() {
    return Object.values(wishlistCountries).reduce((total, continent) => total + continent.length, 0);
}

// Update countries display
function updateCountriesDisplay() {
    // Update total count
    const totalCount = getTotalCountriesCount();
    const wishlistCount = getTotalWishlistCount();
    document.querySelector('.country-count').textContent = totalCount;

    // Update continent counts
    const asiaElement = document.querySelector('.continent-group.asia h5');
    const europeElement = document.querySelector('.continent-group.europe h5');
    
    console.log('Asia element:', asiaElement);
    console.log('Europe element:', europeElement);
    
    if (asiaElement) {
        asiaElement.innerHTML = `<i class="fas fa-mountain"></i> Asia (${countriesData.asia.length} countries)`;
    }
    if (europeElement) {
        europeElement.innerHTML = `<i class="fa-solid fa-chess-rook"></i></i> Europe (${countriesData.europe.length} countries)`;
    }

    // Update wishlist count
    document.querySelector('.wishlist-section .continent-group h5').innerHTML =
        `<i class="fas fa-globe"></i> Wishlist (${wishlistCount} countries)`;

    // Update country flags
    const asiaFlags = document.querySelector('.countries-by-continent .continent-group.asia .country-flags');
    const europeFlags = document.querySelector('.countries-by-continent .continent-group.europe .country-flags');

    if (asiaFlags) {
        asiaFlags.innerHTML = countriesData.asia.map(country =>
            `<span class="country-item" title="${country.name}" data-continent="Asia" data-visit-date="${country.visitDate}" data-duration="${country.duration}" data-rating="${country.rating}" data-highlights="${encodeURIComponent(JSON.stringify(country.highlights))}" data-notes="${country.notes}" data-instagram="${(country.instagram || []).join(', ')}" data-facebook="${(country.facebook || []).join(', ')}">${country.flag}</span>`
        ).join('');
    }

    if (europeFlags) {
        europeFlags.innerHTML = countriesData.europe.map(country =>
            `<span class="country-item" title="${country.name}" data-continent="Europe" data-visit-date="${country.visitDate}" data-duration="${country.duration}" data-rating="${country.rating}" data-highlights="${encodeURIComponent(JSON.stringify(country.highlights))}" data-notes="${country.notes}" data-instagram="${(country.instagram || []).join(', ')}" data-facebook="${(country.facebook || []).join(', ')}">${country.flag}</span>`
        ).join('');
    }

    // Wishlist countries
    const wishlistFlags = document.querySelector('.wishlist-section .country-flags');
    if (wishlistFlags) {
        wishlistFlags.innerHTML = Object.values(wishlistCountries).flat().map(country =>
            `<span class="wishlist-item" title="${country.name}">${country.flag}<span class="wish-icon">${country.wishIcon}</span></span>`
        ).join('');
    }

    // Update world exploration progress
    const visitedCount = totalCount;
    const totalWorldCountries = 195;
    const progressPercentage = (visitedCount / totalWorldCountries) * 100;
    document.getElementById('world-progress-fill').style.width = `${progressPercentage}%`;
    document.getElementById('world-progress-text').textContent = `${progressPercentage.toFixed(1)}%`;
    document.getElementById('visited-count').textContent = visitedCount;
    document.getElementById('total-world-countries').textContent = totalWorldCountries;

    // Add event listeners to country flags after they are created
    setTimeout(() => {
        addCountryClickListeners();
    }, 100);
}

// Function to add click listeners to country flags
function addCountryClickListeners() {
    const countryFlags = document.querySelectorAll('.country-item');
    countryFlags.forEach(flag => {
        flag.addEventListener('click', () => {
            const countryName = flag.title;
            const continent = flag.getAttribute('data-continent');
            const visitDate = flag.getAttribute('data-visit-date');
            const duration = flag.getAttribute('data-duration');
            const rating = flag.getAttribute('data-rating');
            const highlights = JSON.parse(decodeURIComponent(flag.getAttribute('data-highlights')));
            const notes = flag.getAttribute('data-notes');
            const instagram = flag.getAttribute('data-instagram').split(', ');
            const facebook = flag.getAttribute('data-facebook').split(', ');

            // Update modal content
            document.getElementById('modal-country-name').textContent = countryName;
            document.getElementById('modal-country-flag').textContent = flag.textContent;
            document.getElementById('modal-continent').textContent = continent;
            document.getElementById('modal-visit-date').textContent = visitDate;
            document.getElementById('modal-duration').textContent = duration;
            document.getElementById('modal-rating').textContent = rating;

            document.getElementById('modal-highlights').innerHTML = Object.keys(highlights).map(cityName => {
                const cityData = highlights[cityName];
                const socialIcons = [];

                // Add Instagram icons
                if (cityData.instagram && cityData.instagram.length > 0) {
                    cityData.instagram.forEach(link => {
                        socialIcons.push(`<a href="${link}" target="_blank" rel="noopener noreferrer" class="city-social-icon instagram"></a>`);
                    });
                }

                // Add Facebook icons
                if (cityData.facebook && cityData.facebook.length > 0) {
                    cityData.facebook.forEach(link => {
                        socialIcons.push(`<a href="${link}" target="_blank" rel="noopener noreferrer" class="city-social-icon facebook"></a>`);
                    });
                }

                return `
                    <div class="city-highlight">
                        <span class="city-name">${cityName}</span>
                        <div class="city-social-icons">
                            ${socialIcons.join('')}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('modal-notes').textContent = notes;

            // Show modal
            document.getElementById('country-modal').style.display = 'block';
        });
    });
}

// Initialize countries display when page loads
document.addEventListener('DOMContentLoaded', function () {
    updateCountriesDisplay();

    // Add event listener to close modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('country-modal').style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('country-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function initMap() {
    // Custom map style - travel themed
    const mapStyles = [
        {
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#444444"}]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{"color": "#f2f2f2"}]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{"saturation": -100}, {"lightness": 45}]
        },
        {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [{"visibility": "simplified"}]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{"color": "#a3ccff"}, {"visibility": "on"}]
        }
    ];

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: {lat: 20, lng: 0},
        styles: mapStyles,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        }
    });

    const locations = {
        "Ukraine": [
            {lat: 46.4749082, lng: 30.7287808, title: "Odessa, Bazarna 104"},
            {lat: 50.5101285, lng: 30.5001186, title: "Kyiv, Obolonska avenue 16a"},
        ],
        "Belarus": [
            {lat: 53.9000000, lng: 27.5666667, title: "Minsk, Gorky avenue 1"},
        ],
        "San Marino": [
            {lat: 43.9423601, lng: 12.4577739, title: "San Marino, Via del Ponte"},
        ],
        "India": [
            {lat: 28.6183389, lng: 77.2142565, title: "New Delhi, Travel by Couch-surfing"},
            {lat: 26.9130762, lng: 75.792761, title: "Jaipur"},
            {lat: 25.3207397, lng: 82.9087067, title: "Varanasi, Travel by bus"},
            {lat: 27.1761504, lng: 77.8976108, title: "Agra, Travel by Couch-surfing"},
            {lat: 15.5355982, lng: 73.7620102, title: "Goa, Calangute, Home in Calangute"},
        ],
        "Greece": [
            {lat: 37.9659202, lng: 23.7441294, title: "Athens, Pagrati"},
            {lat: 37.9575197, lng: 23.7207616, title: "Athens, Loid Tzortz Guest House"},
            {lat: 39.7074472, lng: 21.6214896, title: "Kalampaka, Aeolic Star Hotel"},
            {lat: 36.4203258, lng: 25.4218707, title: "Santorini, Santorini Camping & Hostel"},
        ],
        'Finland': [
            {lat: 60.1657988, lng: 24.9673356, title: "Helsinki, Eurohostel"},
            {lat: 66.5048301, lng: 25.716365, title: "Rovaniemi, GuestHouse Arctic Heart"},
        ],
        "Maldives": [
            {lat: 3.202778, lng: 73.220833, title: "Male, Travel by ship"},
            {lat: 4.4360125, lng: 72.9576381, title: "Thoddoo, Evila Inn - Thoddoo"},
            {lat: 4.2148307, lng: 72.8613765, title: "Ukulhas, Home in Kulhas"}, // ???
        ],
        "Turkey": [
            {lat: 41.0115158, lng: 28.9431013, title: "Istanbul, Home in Fatih"},
            { lat: 41.0063429, lng: 28.9661672, title: "Istanbul, Le Valeria Deluxe"},
        ],
        "Latvia": [
            {lat: 56.9348137, lng: 24.0352716, title: "Riga, Kalnciema Iella 135"},
            {lat: 56.950761, lng: 24.1277996, title: "Riga, Avotu Iella 6"},
            {lat: 56.9667375, lng: 23.5573685, title: "Jūrmala, Travel by train"},
        ],
        "Lithuania": [
            {lat: 54.6831074, lng: 25.2883817, title: "Vilnius, Home in Vilnius"},
            {lat: 54.6723695, lng: 25.2784091, title: "Vilnius, Hostel Oras"},
        ],
        "Netherlands": [
            {lat: 52.3343232, lng: 4.950593, title: "Amsterdam, Summer Suites Bernice"},
            {lat: 51.9215708, lng: 4.4539677, title: "Rotterdam"},
        ],
        "Italy": [
            {lat: 45.4627042, lng: 9.0953311, title: "Milan"},
            {lat: 45.6622584, lng: 12.2336997, title: "Treviso"},
            {lat: 44.4965262, lng: 11.3329664, title: "Bologna"},
            {lat: 43.7710583, lng: 11.2501702, title: "Florence"},
            {lat: 45.4390869, lng: 12.3344736, title: "Venice, Residenza Grisostomo"},
            {lat: 44.061159, lng: 12.5820507, title: "Rimini, Hotel Jana"},
        ],
        "Israel": [
            {lat: 31.7838176, lng: 35.209266, title: "Jerusalem, Home in Jerusalem"},
            {lat: 32.0708739, lng: 34.7624001, title: "Tel Aviv-Yafo, Gold Sea Hostel"},
            {lat: 32.7996157, lng: 34.9755762, title: "Haifa, Travel by bus"},
        ],
        "Georgia": [
            {lat: 42.2684883, lng: 42.7062823, title: "Kutaisi"},
            {lat: 41.6393818, lng: 41.6115515, title: "Batumi, Orbi Twin Towers"},
            {lat: 41.643333, lng: 41.625653, title: "Batumi, 38 Takaishvili Str"},
            {lat: 41.7006091, lng: 44.7976594, title: "Tbilisi"},
            {lat: 41.8383178, lng: 43.3872417, title: "Borjomi"},
            {lat: 43.0448858, lng: 42.7239988, title: "Mestia"},
        ],
        "Azerbaijan": [
            {lat: 40.3736538, lng: 49.8333648, title: "Baku"},
        ],
        "UAE": [
            {lat: 25.1927589, lng: 55.27857342, title: "Dubai, Millennium Central Downtown"},
            {lat: 24.4225781, lng: 54.4551371, title: "Abu Dhabi, Millennium Al Rawdah Hotel"},
        ],
        "Nepal": [
            {lat: 27.6731487, lng: 85.4265879, title: "Kathmandu, Tulaja Boutique Hotel"},
            {lat: 27.7150956, lng: 85.3114999, title: "Kathmandu, Oasis Kathmandu Hotel"},
        ],
        "Malaysia": [
            {lat: 3.1589606, lng: 101.7026803, title: "Kuala Lumpur, Summer Suites Bernice"},
            {lat: 3.1559413, lng: 101.7084828, title: "Kuala Lumpur, Park view"},
            {lat: 3.1566564, lng: 101.7066367, title: "Kuala Lumpur, Sky Suites by Lynn"},
            {lat: 2.239658, lng: 102.2075049, title: "Malacca, Travel by bus"},
        ],
        "Thailand": [
            {lat: 13.7674467, lng: 100.6390582, title: "Bangkok, Khet Bang Kapi"},
            {lat: 13.7419321, lng: 100.508378, title: "Bangkok, Khet Samphanthawong"},
            {lat: 13.7588358, lng: 100.505161, title: "Bangkok, Alameda Suites"},
            {lat: 7.8874916, lng: 98.3003037, title: "Phuket, Pa Tong"},
            {lat: 7.7407571, lng: 98.7749888, title: "Phi Phu, Valentines Bungalow"},
            {lat: 12.0024527, lng: 120.2060122, title: "Pattaya, Home in Pattaya City"},
            {lat: 12.932119, lng: 100.8814636, title: "Pattaya, Beach"},
            {lat: 18.7829125, lng: 98.9966371, title: "Chiang Mai, Phra Sing"},
            {lat: 8.033644, lng: 98.8296906, title: "Krabi, Ao Nang, La Belle"},
            {lat: 8.0342885, lng: 98.8267155, title: "Krabi, Ao Nang, Monotel"},
            {lat: 8.0387975, lng: 98.8198457, title: "Krabi, Ao Nang, The Rocco Ao-Nang Krabi"},
            {lat: 8.0128819, lng: 98.8421495, title: "Krabi, Railay Bay, Diamond Cave Resort"},
            {lat: 9.5542579, lng: 100.029924, title: "Koh Samui"},
            {lat: 9.458672, lng: 100.0305871, title: "Koh Samui, Lamai Viewpoint"},
            {lat: 9.7026519, lng: 100.0106684, title: "Koh Pha Ngan, The Cosy Sunset Beach Resort & Restaurant"},
            {lat: 10.0981192, lng: 99.8290426, title: "Koh Tao, Home in Koh Tao"},
            {lat: 10.1166193, lng: 99.8138068, title: "Koh Nang, Koh Nang Yuan Viewpoint"},
            {lat: 13.7244415, lng: 100.562694, title: "Bangkok, The Emporio Place"},
            {lat: 13.7118771, lng: 100.6062321, title: "Bangkok, Home in Khet Suan Luang"},
        ],
        "Japan": [
            {lat: 34.6734763, lng: 135.5228785, title: "Osaka, Home in Osaka"},
            {lat: 34.9945252, lng: 135.7568764, title: "Kyoto, Super Hotel Kyoto Karasuma Gojo"},
            {lat: 35.7039206, lng: 139.7948724, title: "Tokyo, HOTEL MYSTAYS Asakusa"},
            {lat: 35.3606246, lng: 138.7170637, title: "Fujinomiya, Mount fuji"},
            {lat: 35.446711, lng: 139.6515033, title: "Yokohama, The Gundam Factory Yokohama"},
            {lat: 34.685047, lng: 135.8404371, title: "Nara, Park Nara"},
        ],
        "Hong Kong": [
            {lat: 22.321771, lng: 114.1675655, title: "Hong Kong"},
        ],
        "Philippines": [
            {lat: 10.3329783, lng: 123.9073145, title: "Cebu City, Avida Towers"},
            {lat: 10.3166272, lng: 119.3414294, title: "Palawan, Ocean Manor Inn"},
            {lat: 9.7394999, lng: 118.7313656, title: "Puerto Princesa, Mariner's Pension House"},
            {lat: 9.9525364, lng: 123.3660057, title: "Moalboal, Dolce Vita Resort"},
            {lat: 9.5221595, lng: 123.4288375, title: "Oslob, Luna Oslob Travellers Inn"},
            {lat: 11.1827228, lng: 119.3927341, title: "El Nido, Silverise Pension"},
            {lat: 12.0024527, lng: 120.2060122, title: "Coron, Ina HomeStay"},
            {lat: 11.9523585, lng: 121.9295729, title: "Boracay, White Bitch"},
            {lat: 9.5517335, lng: 123.7746862, title: "Panglao"},
            {lat: 9.5632636, lng: 123.8035985, title: "Panglao, Tyner's Place"},
            {lat: 14.5624157, lng: 120.9908138, title: "Manila, Century Park Hotel"},
            {lat: 9.8297076, lng: 124.1293758, title: "Bohol, Chocolate Hills, Travel by car"},
        ],
        "Singapore": [
            {lat: 1.2985179, lng: 103.8548296, title: "Singapore, The Snooze Hotel at Bugis"},
        ],
        "Indonesia": [
            {lat: -8.3350301, lng: 115.6476298, title: "Bali(Amed), Home in Abang"},
            {lat: -8.7038072, lng: 115.2537278, title: "Bali(Sanur), Denpasar Selatan"},
            {lat: -6.1967763, lng: 106.8154447, title: "Jakarta, Thamrin Executive Residence"},
            {lat: -6.1185777, lng: 106.6874956, title: "Jakarta, Benda"},
            {lat: -6.1529539, lng: 106.8178944, title: "Jakarta, RedDoorz near Hayam Wuruk Plaza"},
            {lat: -8.7205673, lng: 115.1696496, title: "Bali(Kuta), OYO 4012 Ari Beach Inn"},
            {lat: -8.5032796, lng: 115.2640809, title: "Bali(Ubud), Kertayasa house"},
        ],
        "Vietnam": [
            {lat: 21.0276262, lng: 105.8346467, title: "Hanoi"},
            {lat: 16.0513323, lng: 108.2405212, title: "Da Nang"},
            {lat: 15.8827741, lng: 108.3371248, title: "Hội An"},
        ],
        "Laos": [
            {lat: 17.9678224, lng: 102.6011228, title: "Vientiane"},
            {lat: 19.8845625, lng: 102.1328626, title: "Luang Prabang, Chaliya Boutique Garden"},
            {lat: 18.928473, lng: 102.4452279, title: "Vang Vieng, Bountang Mountain View Riverside Hotel"},
        ],
        "Cambodia": [
            {lat: 13.3524143, lng: 103.8547441, title: "Siem Reap, Krong Siem Reap"},
            {lat: 11.5510929, lng: 104.9204016, title: "Phnom Penh, SKY Residence"},
        ],
        "Sri Lanka": [
            {lat: 6.4225108, lng: 79.9975638, title: "Benthota, Home in Bentota"},
            {lat: 6.0098045, lng: 80.2482118, title: "Unawatuna, Home in Unawatuna"},
            {lat: 6.8424305, lng: 79.8638464, title: "Mount Lavinia, Self order"},
            {lat: 7.2874413, lng: 80.6394468, title: "Kandy, Kandy IVY Banks Holiday Resort"},
            {lat: 7.8736801, lng: 80.6466919, title: "Dambulla, Gamagedara Resort"},
            {lat: 7.9407759, lng: 81.0153238, title: "Polonnaruwa, Thisal Guest House"},
            {lat: 6.8413057, lng: 79.8620323, title: "Mount Lavinia, Ranveli Beach Resort"},
            {lat: 7.2998006, lng: 80.3825923, title: "Pinnawala, Hotel Elephant Bay"},
        ],
        "Kazakhstan": [
            {lat: 43.2598898, lng: 76.9330709, title: "Almaty, Apartment in Almaty"},
        ],
        "Uzbekistan": [
            { lat: 41.3086111, lng: 69.2665918, title: "Tashkent, City Centre Hotel"},
            { lat: 39.6567259, lng: 66.9707512, title: "Samarkand, City Centre Hotel"},
            { lat: 39.7774923, lng: 64.4204554, title: "Bukhara, Travel by train"},
        ],
        "Spain": [
            { lat: 41.377071, lng: 2.1504022, title: "Barcelona, Home in Barcelona"},
            { lat: 39.4739172, lng: -0.3646948, title: "Valencia, Home in Valencia"},
        ],
        "Macao": [
            {lat: 22.1903224, lng: 113.543226, title: "Macau, Travel by ship"},
        ],
        "Poland": [
            {lat: 52.2296756, lng: 21.0122287, title: "Warsaw"}, // ???
            {lat: 50.0639797, lng: 19.9405603, title: "Kraków"}, // ???
            {lat: 51.1119111, lng: 17.0246375, title: "Wrocław"}, // ???
        ],
        "Estonia": [
            {lat: 58.380259, lng: 26.7205862, title: "Tallinn, Travel by bus"},
        ],
        "Sweden": [
            {lat: 59.3329783, lng: 18.9073145, title: "Stockholm, Home in Stockholm"},
        ],
        "Germany": [
            {lat: 52.520008, lng: 13.404954, title: "Berlin"}, // ???
            {lat: 50.1203354, lng: 8.6734046, title: "Frankfurt am Main"}, // ???
        ],
        "Austria": [
            {lat: 48.2081749, lng: 16.3738199, title: "Vienna"}, // ???
        ],
        "Czech Republic": [
            {lat: 50.0755391, lng: 14.4378, title: "Prague, Home in Prague"},
            {lat: 49.7448685, lng: 13.3767192, title: "Pilzen, Home in Pilzen"},
        ],
        "France": [
            {lat: 48.856614, lng: 2.3522219, title: "Paris, Travel by Couch-surfing"},
        ],
        "Belgium": [
            {lat: 50.85034, lng: 4.35171, title: "Brussels, Travel by Couch-surfing"},
        ],
        "Hungary": [
            {lat: 47.498, lng: 19.0402, title: "Budapest"},
        ],
        'Yemen': [
            {lat: 12.5063988, lng: 53.2603338, title: "Socotra (Wishlist)", wishlist: true},
        ],
        "Egypt": [
            {lat: 30.0444196, lng: 31.2357116, title: "Cairo (Wishlist)", wishlist: true},
        ],
        "Madagascar": [
            {lat: -18.8791902, lng: 47.5079055, title: "Antananarivo (Wishlist)", wishlist: true},
        ],
        "Mauritius": [
            {lat: -20.348404, lng: 57.552152, title: "Port Louis (Wishlist)", wishlist: true},
        ],
        "Tanzania": [
            {lat: -6.792354, lng: 39.208328, title: "Dar es Salaam (Wishlist)", wishlist: true},
        ],
        "Kenya": [
            {lat: -1.292066, lng: 36.821946, title: "Nairobi (Wishlist)", wishlist: true},
        ],
        "Ethiopia": [
            {lat: 9.145, lng: 40.489673, title: "Addis Ababa (Wishlist)", wishlist: true},
        ],
        "Qatar": [
            {lat: 25.276987, lng: 51.520008, title: "Doha (Wishlist)", wishlist: true},
        ],
        "China": [
            {lat: 39.904211, lng: 116.407395, title: "Beijing (Wishlist)", wishlist: true},
        ],
        "South Korea": [
            {lat: 37.566535, lng: 126.9779692, title: "Seoul (Wishlist)", wishlist: true},
        ],
        "Papua New Guinea": [
            {lat: -9.4438, lng: 147.1803, title: "Port Moresby (Wishlist)", wishlist: true},
        ],
        "Australia": [
            {lat: -33.8688, lng: 151.2093, title: "Sydney (Wishlist)", wishlist: true},
        ],
        "New Zealand": [
            {lat: -36.8485, lng: 174.7633, title: "Auckland (Wishlist)", wishlist: true},
        ],
        "Canada": [
            {lat: 45.5017, lng: -73.5673, title: "Montreal (Wishlist)", wishlist: true},
        ],
        "USA": [
            {lat: 40.7128, lng: -74.0060, title: "New York (Wishlist)", wishlist: true},
        ],
        "Brazil": [
            {lat: -22.9068, lng: -43.1729, title: "Rio de Janeiro (Wishlist)", wishlist: true},
        ],
        "Argentina": [
            {lat: -34.6118, lng: -58.3960, title: "Buenos Aires (Wishlist)", wishlist: true},
        ],
        "Chile": [
            {lat: -33.4489, lng: -70.6693, title: "Santiago (Wishlist)", wishlist: true},
        ],
        "Colombia": [
            {lat: 4.7110, lng: -74.0721, title: "Bogotá (Wishlist)", wishlist: true},
        ],
        "Venezuela": [
            {lat: 10.4806, lng: -66.9036, title: "Caracas (Wishlist)", wishlist: true},
        ],
        "Panama": [
            {lat: 8.9824, lng: -79.5199, title: "Panama City (Wishlist)", wishlist: true},
        ],
        "Mexico": [
            {lat: 19.4326, lng: -99.1332, title: "Mexico City (Wishlist)", wishlist: true},
        ],
        "Guatemala": [
            {lat: 14.6349, lng: -90.5069, title: "Guatemala City (Wishlist)", wishlist: true},
        ],
        "Peru": [
            {lat: -12.0464, lng: -77.0428, title: "Lima (Wishlist)", wishlist: true},
        ],
        "Ecuador": [
            {lat: -0.1807, lng: -78.4678, title: "Quito (Wishlist)", wishlist: true},
        ],
        "Bolivia": [
            {lat: -16.2902, lng: -63.5887, title: "Santa Cruz (Wishlist)", wishlist: true},
        ],
        "Cuba": [
            {lat: 23.1136, lng: -82.3666, title: "Havana (Wishlist)", wishlist: true},
        ],
        "Puerto Rico": [
            {lat: 18.4655, lng: -66.1057, title: "San Juan (Wishlist)", wishlist: true},
        ],
    };

    // Build continent mapping dynamically from countries in locations
    const continentMapping = {};

    // Define continent for each country that exists in locations
    const countryToContinentMap = {
        "Finland": "europe",
        "Ukraine": "europe",
        "Belarus": "europe",
        "San Marino": "europe",
        "Greece": "europe",
        "Latvia": "europe",
        "Lithuania": "europe",
        "Netherlands": "europe",
        "Italy": "europe",
        "Spain": "europe",
        "Poland": "europe",
        "Estonia": "europe",
        "Sweden": "europe",
        "Germany": "europe",
        "Austria": "europe",
        "Czech Republic": "europe",
        "France": "europe",
        "Belgium": "europe",
        "Hungary": "europe",
        "UAE": "asia",
        "Nepal": "asia",
        "India": "asia",
        "Japan": "asia",
        "Hong Kong": "asia",
        "Sri Lanka": "asia",
        "Laos": "asia",
        "Philippines": "asia",
        "Singapore": "asia",
        "Indonesia": "asia",
        "Vietnam": "asia",
        "Malaysia": "asia",
        "Thailand": "asia",
        "Cambodia": "asia",
        "Israel": "asia",
        "Turkey": "asia",
        "Kazakhstan": "asia",
        "Uzbekistan": "asia",
        "Macao": "asia",
        "Maldives": "asia",
        "Georgia": "asia",
        "Azerbaijan": "asia",
        "Egypt": "wishlist",
        "Madagascar": "wishlist",
        "Mauritius": "wishlist",
        "Tanzania": "wishlist",
        "Kenya": "wishlist",
        "Ethiopia": "wishlist",
        "Qatar": "wishlist",
        "China": "wishlist",
        "South Korea": "wishlist",
        "Papua New Guinea": "wishlist",
        "Australia": "wishlist",
        "New Zealand": "wishlist",
        "Canada": "wishlist",
        "USA": "wishlist",
        "Brazil": "wishlist",
        "Argentina": "wishlist",
        "Chile": "wishlist",
        "Colombia": "wishlist",
        "Venezuela": "wishlist",
        "Panama": "wishlist",
        "Mexico": "wishlist",
        "Guatemala": "wishlist",
        "Peru": "wishlist",
        "Ecuador": "wishlist",
        "Bolivia": "wishlist",
        "Cuba": "wishlist",
        "Puerto Rico": "wishlist",
    };

    // Build continentMapping from countryToContinentMap
    for (const [country, continent] of Object.entries(countryToContinentMap)) {
        if (!continentMapping[continent]) {
            continentMapping[continent] = [];
        }
        // Only add countries that actually exist in locations
        if (locations[country]) {
            continentMapping[continent].push(country);
        }
    }

    function getContinent(country) {
        return countryToContinentMap[country] || 'unknown';
    }

    const continentFilters = document.querySelectorAll('.map-filter-button');
    const continentFilterButtons = Array.from(continentFilters);

    // Group markers by continent for different icons
    const continentColors = {
        'asia': '#4CAF50',
        'europe': '#2196F3',
        'wishlist': '#E91E63'
    };

    // Create markers with different icons based on continent
    const markers = [];
    let i = 0;
    for (const country in locations) {
        for (const location of locations[country]) {
            const continent = getContinent(country);
            const isWishlist = location.wishlist === true;

            const marker = new google.maps.Marker({
                position: {lat: location.lat, lng: location.lng},
                map: map,
                title: location.title,
                icon: isWishlist ? {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                <text x="16" y="24" font-size="24" text-anchor="middle" fill="#FFD700">🌟</text>
                            </svg>
                        `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16)
                } : {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: continentColors[continent] || '#FF0000',
                    fillOpacity: 0.8,
                    strokeWeight: 1,
                    strokeColor: '#FFFFFF',
                    scale: 8
                },
                animation: google.maps.Animation.DROP // Add animation to markers
            });

            // Custom info window content
            const infoWindow = new google.maps.InfoWindow({
                content: `
                        <div class="custom-info-window">
                            <div class="info-location-name">${location.title} ${isWishlist ? '🌟' : ''}</div>
                            <div class="info-continent continent-${continent}">${continent ? continent.charAt(0).toUpperCase() + continent.slice(1) : 'Unknown'}</div>
                        </div>
                    `,
                maxWidth: 250
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            markers.push(marker);
        }
    }

    // Add markers to clusters for better performance and visuals
    const markerCluster = new markerClusterer.MarkerClusterer({
        map,
        markers,
        gridSize: 50,
        maxZoom: 15,
        minimumClusterSize: 2,
        styles: [
            {
                textColor: 'white',
                url: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m1.png',
                width: 53,
                height: 53
            }
        ]
    });

    // Filter markers by continent
    continentFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button UI
            continentFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Get filter value (all, asia, europe, wishlist)
            const filter = button.getAttribute('data-filter');
            console.log("Filtering by:", filter); // Debug log

            // Filter markers based on the selected continent
            let markerIndex = 0;
            for (const country in locations) {
                for (const location of locations[country]) {
                    const continent = getContinent(country);
                    const isWishlist = location.wishlist === true;
                    console.log(country, "Continent:", continent, "Wishlist:", isWishlist); // Debug log

                    let shouldShow = false;
                    if (filter === 'all') {
                        shouldShow = true;
                    } else if (filter === 'wishlist') {
                        shouldShow = isWishlist;
                    } else {
                        shouldShow = continent === filter && !isWishlist;
                    }

                    if (shouldShow) {
                        markers[markerIndex].setVisible(true);
                    } else {
                        markers[markerIndex].setVisible(false);
                    }
                    markerIndex++;
                }
            }

            // Update clusters after filtering
            markerCluster.clearMarkers();
            markerCluster.addMarkers(markers.filter(m => m.getVisible()));
        });
    });

    // Add heat map option
    const heatMapButton = document.createElement('button');
    heatMapButton.className = 'map-filter-button';
    heatMapButton.innerHTML = '<i class="fas fa-fire"></i> Heat Map';
    document.getElementById('map-controls').appendChild(heatMapButton);

    let heatmap = null;

    heatMapButton.addEventListener('click', function () {
        if (heatmap) {
            heatmap.setMap(null);
            heatmap = null;
            this.classList.remove('active');
        } else {
            const heatmapData = markers.map(marker => {
                return {
                    location: new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng()),
                    weight: 1
                };
            });

            heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map: map,
                radius: 20
            });

            this.classList.add('active');
        }
    });

    // Draw travel path - connect markers chronologically for visual travel journey
    // Exclude wishlist locations from the travel path
    const travelPathLocations = [];
    for (const country in locations) {
        for (const location of locations[country]) {
            if (!location.wishlist) {
                travelPathLocations.push({lat: location.lat, lng: location.lng});
            }
        }
    }

    const flightPath = new google.maps.Polyline({
        path: travelPathLocations,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeWeight: 2
    });

    // Add checkbox to toggle travel path
    const mapContainer = document.getElementById('map');
    const pathToggle = document.createElement('div');
    pathToggle.innerHTML = `
            <div style="position: absolute; bottom: 30px; left: 10px; z-index: 100; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="path-toggle"> 
                    <span style="margin-left: 5px;">Show travel path</span>
                </label>
            </div>
        `;
    mapContainer.appendChild(pathToggle);

    document.getElementById('path-toggle').addEventListener('change', function () {
        if (this.checked) {
            flightPath.setMap(map);
        } else {
            flightPath.setMap(null);
        }
    });

    // Journey Animation System
    let journeyAnimation = {
        isPlaying: false,
        isPaused: false,
        currentStep: 0,
        speed: 1,
        intervalId: null,
        journeyData: [],
        animatedMarkers: [],
        animatedPaths: []
    };

    // Prepare journey data - sort countries by visit date
    function prepareJourneyData() {
        const allCountries = [];

        // Collect all countries with visit dates
        Object.values(countriesData).flat().forEach(country => {
            if (country.visitDate && !country.visitDate.includes('2025')) {
                allCountries.push({
                    ...country,
                    visitYear: parseInt(country.visitDate.split('-')[0]),
                    visitMonth: parseInt(country.visitDate.split('-')[1])
                });
            }
        });

        // Sort by visit date
        allCountries.sort((a, b) => {
            if (a.visitYear !== b.visitYear) {
                return a.visitYear - b.visitYear;
            }
            return a.visitMonth - b.visitMonth;
        });

        journeyAnimation.journeyData = allCountries;

        // Update timeline labels
        if (allCountries.length > 0) {
            document.getElementById('start-year').textContent = allCountries[0].visitYear;
            document.getElementById('end-year').textContent = allCountries[allCountries.length - 1].visitYear;
        }
    }

    // Create animated marker for country
    function createAnimatedMarker(country) {
        const countryLocations = locations[country.name];
        if (!countryLocations || countryLocations.length === 0) return null;

        const location = countryLocations[0]; // Use first location
        const marker = new google.maps.Marker({
            position: {lat: location.lat, lng: location.lng},
            map: map,
            title: `${country.name} (${country.visitDate})`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#FFD700',
                fillOpacity: 1,
                strokeColor: '#FF6B35',
                strokeWeight: 3
            },
            animation: google.maps.Animation.DROP
        });

        // Add pulse animation
        setTimeout(() => {
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#FFD700',
                fillOpacity: 0.8,
                strokeColor: '#FF6B35',
                strokeWeight: 4
            });
        }, 600);

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                    <div class="custom-info-window">
                        <div class="info-location-name">${country.flag} ${country.name}</div>
                        <div class="info-visit-date">Visited: ${country.visitDate}</div>
                        <div class="info-duration">Duration: ${country.duration}</div>
                        <div class="info-rating">Rating: ${country.rating}</div>
                    </div>
                `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        return marker;
    }

    // Create animated path between two points
    function createAnimatedPath(fromMarker, toMarker) {
        if (!fromMarker || !toMarker) return null;

        const path = new google.maps.Polyline({
            path: [fromMarker.getPosition(), toMarker.getPosition()],
            geodesic: true,
            strokeColor: '#FF6B35',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: map
        });

        return path;
    }

    // Update journey UI
    function updateJourneyUI(step) {
        const progress = (step / journeyAnimation.journeyData.length) * 100;
        document.getElementById('timeline-progress').style.width = `${progress}%`;
        document.getElementById('journey-progress-percent').textContent = `${Math.round(progress)}%`;
        document.getElementById('journey-countries-count').textContent = step;

        if (step > 0 && step <= journeyAnimation.journeyData.length) {
            const currentCountry = journeyAnimation.journeyData[step - 1];
            document.getElementById('current-flag').textContent = currentCountry.flag;
            document.getElementById('current-country-name').textContent = currentCountry.name;
            document.getElementById('current-visit-date').textContent = `Visited: ${currentCountry.visitDate}`;
        }
    }

    // Play journey animation
    function playJourney() {
        if (journeyAnimation.isPlaying) return;

        journeyAnimation.isPlaying = true;
        document.getElementById('play-journey').disabled = true;
        document.getElementById('pause-journey').disabled = false;
        document.getElementById('play-journey').classList.add('active');

        const stepDuration = 2000 / journeyAnimation.speed; // 2 seconds per step divided by speed

        journeyAnimation.intervalId = setInterval(() => {
            if (journeyAnimation.currentStep >= journeyAnimation.journeyData.length) {
                stopJourney();
                return;
            }

            const country = journeyAnimation.journeyData[journeyAnimation.currentStep];
            const marker = createAnimatedMarker(country);

            if (marker) {
                journeyAnimation.animatedMarkers.push(marker);

                // Create path from previous marker
                if (journeyAnimation.animatedMarkers.length > 1) {
                    const prevMarker = journeyAnimation.animatedMarkers[journeyAnimation.animatedMarkers.length - 2];
                    const path = createAnimatedPath(prevMarker, marker);
                    if (path) {
                        journeyAnimation.animatedPaths.push(path);
                    }
                }

                // Center map on current marker
                map.panTo(marker.getPosition());

                journeyAnimation.currentStep++;
                updateJourneyUI(journeyAnimation.currentStep);
            }
        }, stepDuration);
    }

    // Pause journey animation
    function pauseJourney() {
        if (!journeyAnimation.isPlaying) return;

        journeyAnimation.isPlaying = false;
        journeyAnimation.isPaused = true;

        if (journeyAnimation.intervalId) {
            clearInterval(journeyAnimation.intervalId);
            journeyAnimation.intervalId = null;
        }

        document.getElementById('play-journey').disabled = false;
        document.getElementById('pause-journey').disabled = true;
        document.getElementById('play-journey').classList.remove('active');
        document.getElementById('play-journey').innerHTML = '<i class="fas fa-play"></i> Resume';
    }

    // Stop and reset journey animation
    function resetJourney() {
        journeyAnimation.isPlaying = false;
        journeyAnimation.isPaused = false;
        journeyAnimation.currentStep = 0;

        if (journeyAnimation.intervalId) {
            clearInterval(journeyAnimation.intervalId);
            journeyAnimation.intervalId = null;
        }

        // Clear animated markers
        journeyAnimation.animatedMarkers.forEach(marker => {
            marker.setMap(null);
        });
        journeyAnimation.animatedMarkers = [];

        // Clear animated paths
        journeyAnimation.animatedPaths.forEach(path => {
            path.setMap(null);
        });
        journeyAnimation.animatedPaths = [];

        // Reset UI
        document.getElementById('play-journey').disabled = false;
        document.getElementById('pause-journey').disabled = true;
        document.getElementById('play-journey').classList.remove('active');
        document.getElementById('play-journey').innerHTML = '<i class="fas fa-play"></i> Play';

        updateJourneyUI(0);
        document.getElementById('current-flag').textContent = '🌍';
        document.getElementById('current-country-name').textContent = 'Ready to start journey';
        document.getElementById('current-visit-date').textContent = '';

        // Reset map view
        map.setCenter({lat: 20, lng: 0});
        map.setZoom(2);
    }

    // Stop journey (used when animation completes)
    function stopJourney() {
        journeyAnimation.isPlaying = false;
        journeyAnimation.isPaused = false;

        if (journeyAnimation.intervalId) {
            clearInterval(journeyAnimation.intervalId);
            journeyAnimation.intervalId = null;
        }

        document.getElementById('play-journey').disabled = false;
        document.getElementById('pause-journey').disabled = true;
        document.getElementById('play-journey').classList.remove('active');
        document.getElementById('play-journey').innerHTML = '<i class="fas fa-play"></i> Replay';

        // Show completion message
        document.getElementById('current-country-name').textContent = 'Journey completed!';
        document.getElementById('current-visit-date').textContent = `${journeyAnimation.journeyData.length} countries visited`;
    }

    // Initialize journey animation
    function initJourneyAnimation() {
        prepareJourneyData();

        // Event listeners
        document.getElementById('play-journey').addEventListener('click', () => {
            if (journeyAnimation.currentStep >= journeyAnimation.journeyData.length) {
                resetJourney();
            }
            playJourney();
        });

        document.getElementById('pause-journey').addEventListener('click', pauseJourney);
        document.getElementById('reset-journey').addEventListener('click', resetJourney);

        // Speed control
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');

        speedSlider.addEventListener('input', (e) => {
            journeyAnimation.speed = parseFloat(e.target.value);
            speedValue.textContent = `${journeyAnimation.speed}x`;
        });

        // Initialize UI
        updateJourneyUI(0);
    }

    // Initialize journey animation after map is ready
    initJourneyAnimation();
}