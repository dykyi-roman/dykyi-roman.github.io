/* Chat Widget — Pollinations AI
   IIFE module, no global namespace pollution.
   window.CHAT_SYSTEM_PROMPT can be set by host page before this script loads.
*/
(function () {
    'use strict';

    var DEFAULT_SYSTEM_PROMPT =
        'You are a helpful AI assistant. Answer concisely and clearly.';

    var MAX_HISTORY = 20;
    var DEFAULT_API_KEY = 'pk_QsDSYhTwBGyquGmi';
    var API_NEW  = 'https://gen.pollinations.ai/text/';
    var API_BASE = 'https://text.pollinations.ai/';

    var state = {
        isOpen: false,
        isLoading: false,
        messageHistory: [],   // {role, content}
        welcomeShown: false
    };

    var dom = {
        fab: null,
        panel: null,
        messages: null,
        input: null,
        sendBtn: null,
        typingIndicator: null
    };

    /* ── SVG icons ────────────────────────────────────────────────── */
    var SVG = {
        chat: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.527 3.654 1.438 5.162L2.1 21.48a.75.75 0 0 0 .922.922l4.318-1.338A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm-1 13H7.75a.75.75 0 0 1 0-1.5H11a.75.75 0 0 1 0 1.5Zm4-4H7.75a.75.75 0 0 1 0-1.5H15a.75.75 0 0 1 0 1.5Z"/></svg>',
        close: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.364 5.636a1 1 0 0 1 0 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586l4.95-4.95a1 1 0 0 1 1.414 0Z"/></svg>',
        send: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z"/></svg>',
        clear: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 4.478v.227a49.18 49.18 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H7.083a3 3 0 0 1-2.991-2.77L3.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"/></svg>',
        ai: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.387-1 1.731V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.731A2 2 0 0 1 12 2Zm-4 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>'
    };

    /* ── Helpers ──────────────────────────────────────────────────── */
    function el(tag, attrs, children) {
        var e = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (k === 'className') { e.className = attrs[k]; }
                else if (k === 'innerHTML') { e.innerHTML = attrs[k]; }
                else { e.setAttribute(k, attrs[k]); }
            });
        }
        if (children) {
            children.forEach(function (c) {
                if (c) { e.appendChild(c); }
            });
        }
        return e;
    }

    function getSystemPrompt() {
        return (window.CHAT_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT).trim();
    }

    function scrollToBottom() {
        if (dom.messages) {
            dom.messages.scrollTop = dom.messages.scrollHeight;
        }
    }

    /* ── DOM builders ─────────────────────────────────────────────── */
    function createFAB() {
        var btn = el('button', {
            className: 'chat-fab chat-fab--pulse',
            'aria-label': 'Open AI chat',
            'aria-expanded': 'false',
            'aria-haspopup': 'dialog',
            innerHTML: SVG.chat
        });
        btn.addEventListener('click', togglePanel);
        document.body.appendChild(btn);
        dom.fab = btn;
    }

    function createPanel() {
        /* Header */
        var headerIcon = el('div', { className: 'chat-header-icon', innerHTML: SVG.ai });

        var headerTitle = el('div', { className: 'chat-header-title' });
        headerTitle.textContent = 'AI Assistant';

        var headerSubtitle = el('div', { className: 'chat-header-subtitle' });
        headerSubtitle.textContent = '';

        var titleBlock = el('div', { className: 'chat-header-title-block' });
        titleBlock.appendChild(headerTitle);
        titleBlock.appendChild(headerSubtitle);
        titleBlock.style.flex = '1';

        var clearBtn = el('button', {
            className: 'chat-header-btn',
            'aria-label': 'Clear history',
            innerHTML: SVG.clear,
            title: 'Clear chat'
        });
        clearBtn.addEventListener('click', clearHistory);

        var closeBtn = el('button', {
            className: 'chat-header-btn',
            'aria-label': 'Close chat',
            innerHTML: SVG.close,
            title: 'Close'
        });
        closeBtn.addEventListener('click', closePanel);

        var actions = el('div', { className: 'chat-header-actions' });
        actions.appendChild(clearBtn);
        actions.appendChild(closeBtn);

        var header = el('div', { className: 'chat-header' });
        header.appendChild(headerIcon);
        header.appendChild(titleBlock);
        header.appendChild(actions);

        /* Messages */
        var messages = el('div', {
            className: 'chat-messages',
            role: 'log',
            'aria-live': 'polite',
            'aria-label': 'Chat messages'
        });
        dom.messages = messages;

        /* Input area */
        var input = el('textarea', {
            className: 'chat-input',
            placeholder: 'Ask a question…',
            rows: '1',
            'aria-label': 'Message input',
            'aria-multiline': 'true'
        });
        dom.input = input;

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        input.addEventListener('input', function () {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        var sendBtn = el('button', {
            className: 'chat-send-btn',
            'aria-label': 'Send message',
            innerHTML: SVG.send
        });
        dom.sendBtn = sendBtn;
        sendBtn.addEventListener('click', sendMessage);

        var inputArea = el('div', { className: 'chat-input-area' });
        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);

        /* Panel */
        var panel = el('div', {
            className: 'chat-panel',
            role: 'dialog',
            'aria-label': 'AI Chat',
            'aria-modal': 'false'
        });
        panel.appendChild(header);
        panel.appendChild(messages);
        panel.appendChild(inputArea);

        document.body.appendChild(panel);
        dom.panel = panel;
    }

    /* ── Panel open / close ───────────────────────────────────────── */
    function openPanel() {
        if (state.isOpen) { return; }
        state.isOpen = true;

        dom.panel.classList.add('chat-panel--open');
        dom.fab.classList.remove('chat-fab--pulse');
        dom.fab.innerHTML = SVG.close;
        dom.fab.setAttribute('aria-expanded', 'true');
        dom.fab.setAttribute('aria-label', 'Close AI chat');

        if (!state.welcomeShown) {
            state.welcomeShown = true;
            appendMessage('ai', getWelcomeMessage());
        }

        setTimeout(function () {
            if (dom.input) { dom.input.focus(); }
        }, 280);
    }

    function closePanel() {
        if (!state.isOpen) { return; }
        state.isOpen = false;

        dom.panel.classList.remove('chat-panel--open');
        dom.fab.classList.add('chat-fab--pulse');
        dom.fab.innerHTML = SVG.chat;
        dom.fab.setAttribute('aria-expanded', 'false');
        dom.fab.setAttribute('aria-label', 'Open AI chat');
    }

    function togglePanel() {
        if (state.isOpen) { closePanel(); } else { openPanel(); }
    }

    /* ── Welcome message ─────────────────────────────────────────── */
    function getWelcomeMessage() {
        return 'Hi! I\'m an AI assistant. Ask me anything about what you see on this page, and I\'ll do my best to help.';
    }

    /* ── Messages ─────────────────────────────────────────────────── */
    function appendMessage(role, text) {
        var isError = (role === 'error');
        var msgRole = isError ? 'ai' : role;

        var bubble = el('div', { className: 'chat-bubble' });
        bubble.textContent = text;  // textContent — XSS-safe

        var wrapper = el('div', {
            className: 'chat-message chat-message--' + msgRole + (isError ? ' chat-message--error' : '')
        });
        wrapper.appendChild(bubble);
        dom.messages.appendChild(wrapper);
        scrollToBottom();
        return wrapper;
    }

    function appendTypingIndicator() {
        var indicator = el('div', { className: 'chat-typing-indicator' });
        for (var i = 0; i < 3; i++) {
            indicator.appendChild(el('div', { className: 'chat-typing-dot' }));
        }
        dom.messages.appendChild(indicator);
        scrollToBottom();
        dom.typingIndicator = indicator;
    }

    function removeTypingIndicator() {
        if (dom.typingIndicator && dom.typingIndicator.parentNode) {
            dom.typingIndicator.parentNode.removeChild(dom.typingIndicator);
        }
        dom.typingIndicator = null;
    }

    /* ── API ──────────────────────────────────────────────────────── */
    function stripAd(text) {
        return text
            .replace(/\s*---+\s*\*\*Support Pollinations[\s\S]*$/i, '')
            .replace(/\s*🌸[\s\S]*$/i, '')
            .trim();
    }

    function getApiKey() {
        return (window.CHAT_API_KEY || DEFAULT_API_KEY).trim();
    }

    function callWithNewApi(messages) {
        return fetch(API_NEW, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.slice(-6),
                model: 'openai-fast',
                system: getSystemPrompt(),
                seed: Math.floor(Math.random() * 9999) + 1,
                key: getApiKey()
            })
        })
            .then(function (r) {
                if (!r.ok) { throw new Error('HTTP ' + r.status); }
                return r.text();
            })
            .then(function (text) {
                if (!text || !text.trim()) { throw new Error('Empty response.'); }
                return text.trim();
            });
    }

    function callWithLegacyApi(messages) {
        return fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.slice(-6),
                model: 'openai-fast',
                system: getSystemPrompt(),
                seed: Math.floor(Math.random() * 9999) + 1
            })
        })
            .then(function (r) {
                if (!r.ok) { throw new Error('HTTP ' + r.status); }
                return r.text();
            })
            .then(function (text) {
                if (!text || !text.trim()) { throw new Error('Empty response.'); }
                var trimmed = text.trim();
                if (trimmed.charAt(0) === '{') {
                    try {
                        var obj = JSON.parse(trimmed);
                        if (obj.choices && obj.choices[0] && obj.choices[0].message) {
                            return (obj.choices[0].message.content || obj.choices[0].message.reasoning_content || '').trim();
                        }
                        if (obj.content) { return obj.content.trim(); }
                        if (obj.reasoning_content) { return obj.reasoning_content.trim(); }
                    } catch (e) { /* plain text */ }
                }
                return trimmed;
            });
    }

    function callPollinationsAI(messages) {
        var timeoutId = setTimeout(function () {}, 30000); // kept for clearTimeout calls

        return callWithNewApi(messages)
            .catch(function () {
                // new API failed (402, 401, network) — fall back to legacy
                return callWithLegacyApi(messages);
            })
            .then(function (text) { return stripAd(text); })
            .catch(function (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') { throw new Error('Request timed out. Please try again.'); }
                if (err.message === 'Failed to fetch') { throw new Error('Cannot connect to AI service.'); }
                throw err;
            });
    }

    /* ── Send ─────────────────────────────────────────────────────── */
    function setLoadingState(loading) {
        state.isLoading = loading;
        dom.input.disabled = loading;
        dom.sendBtn.disabled = loading;
        if (!loading && dom.input) {
            dom.input.focus();
        }
    }

    function sendMessage() {
        if (state.isLoading) { return; }

        var text = dom.input.value.trim();
        if (!text) { return; }

        // Reset input
        dom.input.value = '';
        dom.input.style.height = 'auto';

        // Show user message
        appendMessage('user', text);

        // Build history entry
        state.messageHistory.push({ role: 'user', content: text });

        // Trim history
        if (state.messageHistory.length > MAX_HISTORY) {
            state.messageHistory = state.messageHistory.slice(state.messageHistory.length - MAX_HISTORY);
        }

        setLoadingState(true);
        appendTypingIndicator();

        callPollinationsAI(state.messageHistory)
            .then(function (reply) {
                state.messageHistory.push({ role: 'assistant', content: reply });
                // Trim history after AI reply too
                if (state.messageHistory.length > MAX_HISTORY) {
                    state.messageHistory = state.messageHistory.slice(state.messageHistory.length - MAX_HISTORY);
                }
                removeTypingIndicator();
                appendMessage('ai', reply);
            })
            .catch(function (err) {
                removeTypingIndicator();
                appendMessage('error', 'Sorry, something went wrong. Please try again. (' + err.message + ')');
            })
            .finally(function () {
                setLoadingState(false);
            });
    }

    /* ── Clear history ────────────────────────────────────────────── */
    function clearHistory() {
        state.messageHistory = [];
        state.welcomeShown = false;
        // Clear DOM messages
        while (dom.messages.firstChild) {
            dom.messages.removeChild(dom.messages.firstChild);
        }
        // Show welcome again
        state.welcomeShown = true;
        appendMessage('ai', getWelcomeMessage());
    }

    /* ── Keyboard handler ─────────────────────────────────────────── */
    function onKeyDown(e) {
        if (e.key === 'Escape' && state.isOpen) {
            closePanel();
        }
    }

    /* ── Init ─────────────────────────────────────────────────────── */
    function init() {
        document.body.classList.add('has-chat');
        createFAB();
        createPanel();
        document.addEventListener('keydown', onKeyDown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
