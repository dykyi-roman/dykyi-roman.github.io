/* ===== Internationalization (i18n) Library ===== */

(function() {
    'use strict';

    var I18N = {
        lang: 'en',
        supported: ['en', 'ru', 'fr', 'de', 'es'],
        _translations: {},
        _fallback: {},
        _loaded: false,
        _readyCallbacks: [],
        _projectId: null,

        /* ===== Language Detection ===== */
        detectLang: function() {
            var params = new URLSearchParams(window.location.search);
            var paramLang = params.get('lang');
            if (paramLang && I18N.supported.indexOf(paramLang) !== -1) {
                localStorage.setItem('i18n-lang', paramLang);
                return paramLang;
            }

            var stored = localStorage.getItem('i18n-lang');
            if (stored && I18N.supported.indexOf(stored) !== -1) {
                return stored;
            }

            var nav = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
            if (I18N.supported.indexOf(nav) !== -1) {
                return nav;
            }

            return 'en';
        },

        /* ===== Load Translations ===== */
        load: async function(projectId, basePath) {
            I18N._projectId = projectId;
            I18N.lang = I18N.detectLang();

            var uiBase = basePath + '/resources/i18n/';
            var projBase = basePath + '/projects/' + projectId + '/i18n/';

            try {
                var requests = [
                    fetch(uiBase + 'ui.en.json').then(function(r) { return r.ok ? r.json() : {}; }),
                    fetch(projBase + 'en.json').then(function(r) { return r.ok ? r.json() : {}; })
                ];

                if (I18N.lang !== 'en') {
                    requests.push(
                        fetch(uiBase + 'ui.' + I18N.lang + '.json').then(function(r) { return r.ok ? r.json() : {}; }),
                        fetch(projBase + I18N.lang + '.json').then(function(r) { return r.ok ? r.json() : {}; })
                    );
                }

                var results = await Promise.all(requests);
                var uiEn = results[0];
                var projEn = results[1];

                I18N._fallback = {};
                Object.keys(uiEn).forEach(function(k) { I18N._fallback[k] = uiEn[k]; });
                Object.keys(projEn).forEach(function(k) { I18N._fallback[k] = projEn[k]; });

                if (I18N.lang !== 'en' && results.length > 2) {
                    var uiLang = results[2];
                    var projLang = results[3];

                    I18N._translations = {};
                    Object.keys(I18N._fallback).forEach(function(k) { I18N._translations[k] = I18N._fallback[k]; });
                    Object.keys(uiLang).forEach(function(k) { I18N._translations[k] = uiLang[k]; });
                    Object.keys(projLang).forEach(function(k) { I18N._translations[k] = projLang[k]; });
                } else {
                    I18N._translations = {};
                    Object.keys(I18N._fallback).forEach(function(k) { I18N._translations[k] = I18N._fallback[k]; });
                }

                I18N._loaded = true;
                I18N._readyCallbacks.forEach(function(cb) { cb(); });
                I18N._readyCallbacks = [];
            } catch (e) {
                console.warn('I18N: Failed to load translations', e);
                I18N._loaded = true;
                I18N._readyCallbacks.forEach(function(cb) { cb(); });
                I18N._readyCallbacks = [];
            }
        },

        /* ===== Translate a Key ===== */
        t: function(key, params, fallback) {
            var val = I18N._translations[key];
            if (val === undefined) {
                val = I18N._fallback[key];
            }
            if (val === undefined) {
                return fallback !== undefined ? fallback : key;
            }
            if (typeof val !== 'string') {
                return fallback !== undefined ? fallback : key;
            }
            if (params) {
                Object.keys(params).forEach(function(p) {
                    val = val.split('{' + p + '}').join(params[p]);
                });
            }
            return val;
        },

        /* ===== Translate Array ===== */
        ta: function(key, fallback) {
            var val = I18N._translations[key];
            if (val === undefined) {
                val = I18N._fallback[key];
            }
            if (val === undefined || !Array.isArray(val)) {
                return fallback !== undefined ? fallback : [];
            }
            return val;
        },

        /* ===== Translate Object Array ===== */
        to: function(key, fallback) {
            var val = I18N._translations[key];
            if (val === undefined) {
                val = I18N._fallback[key];
            }
            if (val === undefined || !Array.isArray(val)) {
                return fallback !== undefined ? fallback : [];
            }
            return val;
        },

        /* ===== Apply data-i18n Attributes to DOM ===== */
        applyToDOM: function() {
            document.querySelectorAll('[data-i18n]').forEach(function(el) {
                var key = el.getAttribute('data-i18n');
                var translated = I18N.t(key, null, null);
                if (translated !== null && translated !== key) {
                    if (el.getAttribute('data-i18n-html') === 'true') {
                        el.innerHTML = translated;
                    } else {
                        el.textContent = translated;
                    }
                }
            });
            document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-title');
                var translated = I18N.t(key, null, null);
                if (translated !== null && translated !== key) {
                    el.setAttribute('title', translated);
                }
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-placeholder');
                var translated = I18N.t(key, null, null);
                if (translated !== null && translated !== key) {
                    el.setAttribute('placeholder', translated);
                }
            });
        },

        /* ===== Render Language Switcher ===== */
        renderSwitcher: function(containerId) {
            var container = document.getElementById(containerId);
            if (!container) return;

            var langLabels = { en: 'EN', ru: 'RU', fr: 'FR', de: 'DE', es: 'ES' };
            var html = '';
            I18N.supported.forEach(function(lang) {
                var cls = 'lang-btn' + (lang === I18N.lang ? ' active' : '');
                html += '<button class="' + cls + '" data-lang="' + lang + '" title="' + langLabels[lang] + '">' + langLabels[lang] + '</button>';
            });
            container.innerHTML = html;

            container.querySelectorAll('.lang-btn').forEach(function(btn) {
                btn.onclick = function() {
                    I18N.switchLang(btn.dataset.lang);
                };
            });
        },

        /* ===== Switch Language ===== */
        switchLang: async function(lang) {
            if (I18N.supported.indexOf(lang) === -1) return;
            if (lang === I18N.lang) return;

            I18N.lang = lang;
            localStorage.setItem('i18n-lang', lang);

            var url = new URL(window.location);
            url.searchParams.set('lang', lang);
            history.replaceState(null, '', url.toString());

            var basePath = I18N._basePath || '../..';
            var uiBase = basePath + '/resources/i18n/';
            var projBase = basePath + '/projects/' + I18N._projectId + '/i18n/';

            try {
                if (lang === 'en') {
                    I18N._translations = {};
                    Object.keys(I18N._fallback).forEach(function(k) { I18N._translations[k] = I18N._fallback[k]; });
                } else {
                    var results = await Promise.all([
                        fetch(uiBase + 'ui.' + lang + '.json').then(function(r) { return r.ok ? r.json() : {}; }),
                        fetch(projBase + lang + '.json').then(function(r) { return r.ok ? r.json() : {}; })
                    ]);

                    I18N._translations = {};
                    Object.keys(I18N._fallback).forEach(function(k) { I18N._translations[k] = I18N._fallback[k]; });
                    Object.keys(results[0]).forEach(function(k) { I18N._translations[k] = results[0][k]; });
                    Object.keys(results[1]).forEach(function(k) { I18N._translations[k] = results[1][k]; });
                }
            } catch (e) {
                console.warn('I18N: Failed to load translations for ' + lang, e);
                I18N._translations = {};
                Object.keys(I18N._fallback).forEach(function(k) { I18N._translations[k] = I18N._fallback[k]; });
            }

            I18N.applyToDOM();

            var switcher = document.getElementById('lang-switcher');
            if (switcher) {
                switcher.querySelectorAll('.lang-btn').forEach(function(btn) {
                    btn.classList.toggle('active', btn.dataset.lang === lang);
                });
            }

            var refreshFns = ['ARCHV_refresh', 'DBIV_refresh', 'MBV_refresh', 'GFV_refresh', 'PV_refresh'];
            refreshFns.forEach(function(fn) {
                if (typeof window[fn] === 'function') {
                    window[fn]();
                }
            });
        },

        /* ===== Speed Persistence ===== */
        saveSpeed: function(value) {
            localStorage.setItem('i18n-speed', value);
        },

        loadSpeed: function() {
            return localStorage.getItem('i18n-speed');
        },

        /* ===== onReady Callback ===== */
        onReady: function(callback) {
            if (I18N._loaded) {
                callback();
            } else {
                I18N._readyCallbacks.push(callback);
            }
        }
    };

    window.I18N = I18N;
})();
