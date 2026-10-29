// Loader and control integration checks without a browser or external packages.
// The fixture models only DOM operations used by markdown-renderer.js. Native
// dialog Escape is represented by a cancel event followed by its default close.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate as nextTurn } from 'node:timers/promises';
import vm from 'node:vm';

const rendererURL = new URL('../js/markdown-renderer.js', import.meta.url);
const rendererSource = await readFile(rendererURL, 'utf8');
const results = [];

class FixtureEvent {
    constructor(type, options = {}) { Object.assign(this, { type, bubbles: false, defaultPrevented: false }, options); }
    preventDefault() { this.defaultPrevented = true; }
}

class FixtureElement {
    constructor(tag, document) {
        this.tagName = tag.toUpperCase(); this.ownerDocument = document;
        this.children = []; this.attributes = new Map(); this.dataset = {};
        this.listeners = new Map(); this.classes = new Set(); this._text = ''; this._html = '';
        this.classList = {
            contains: name => this.classes.has(name),
            add: name => this.classes.add(name),
            toggle: (name, force) => {
                const enabled = force ?? !this.classes.has(name);
                enabled ? this.classes.add(name) : this.classes.delete(name);
                return enabled;
            },
            [Symbol.iterator]: () => this.classes.values()
        };
        if (tag === 'dialog' && document.dialogSupported) {
            this.showModal = () => { this.open = true; this.modalCalls = (this.modalCalls || 0) + 1; };
            this.close = () => { this.open = false; this.dispatchEvent(new FixtureEvent('close')); };
        }
    }
    get className() { return [...this.classes].join(' '); }
    set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this._text = String(value); this.children = []; }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
        this._html = value; this._text = ''; this.children = [];
        // Explicit nodes stand in for the browser parsing the rendered HTML.
        if (this.hasAttribute('data-markdown-src')) this.ownerDocument.seedArticle?.(this);
    }
    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'class') this.className = String(value);
        if (name === 'id') this.id = String(value);
        if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    appendChild(child) {
        child.parentElement = this; this.children.push(child);
        if (this === this.ownerDocument.head && child.tagName === 'SCRIPT') this.ownerDocument.loadScript(child);
        return child;
    }
    replaceChildren(...children) { this._text = ''; this._html = ''; this.children = []; this.append(...children); }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
    matches(selector) {
        return selector.split(',').some(part => {
            part = part.trim();
            if (part === 'pre > code[class*="language-"]') return this.tagName === 'CODE' && this.parentElement?.tagName === 'PRE' && this.className.includes('language-');
            if (part === 'link[href*="katex"][rel="stylesheet"]') return this.tagName === 'LINK' && this.href?.includes('katex') && this.rel === 'stylesheet';
            if (part.startsWith('.')) return this.classList.contains(part.slice(1));
            if (/^\[[\w-]+\]$/.test(part)) return this.hasAttribute(part.slice(1, -1));
            return this.tagName.toLowerCase() === part;
        });
    }
    closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    contains(target) { return target === this || this.children.some(child => child.contains(target)); }
    addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(listener); }
    dispatchEvent(event) {
        event.target ||= this;
        for (const listener of this.listeners.get(event.type) || []) listener(event);
        if (event.bubbles && this.parentElement) this.parentElement.dispatchEvent(event);
        return !event.defaultPrevented;
    }
    focus(options) { this.ownerDocument.activeElement = this; this.focusOptions = options; }
    scrollIntoView() { this.scrolled = true; }
    getBoundingClientRect() { return { left: 20, right: 600, top: 20, bottom: 400 }; }
}

async function until(predicate) {
    for (let i = 0; i < 1000; i++) { if (predicate()) return; await nextTurn(); }
    assert.fail('Asynchronous article load did not settle');
}

async function harness({ sources = ['# Fixture\n\nArticle **content**.'], failure, clipboard = 'success', dialogSupported = true, hash = '', seedArticle, failAsset } = {}) {
    const document = new FixtureElement('document', null);
    document.ownerDocument = document; document.dialogSupported = dialogSupported;
    document.seedArticle = seedArticle;
    document.head = new FixtureElement('head', document); document.body = new FixtureElement('body', document);
    document.append(document.head, document.body);
    document.currentScript = { src: 'https://site.test/js/markdown-renderer.js' };
    document.createElement = tag => new FixtureElement(tag, document);
    document.getElementById = id => document.querySelectorAll('[id]').find(node => node.id === id);
    const selection = { ranges: [], removeAllRanges() { this.ranges = []; }, addRange(range) { this.ranges.push(range); } };
    document.createRange = () => ({ selectNodeContents(node) { this.target = node; } });
    const loaded = [], copied = [], opened = [], errors = [], events = [], fetches = [], timers = new Map();
    let timerId = 0;
    const articles = sources.map((source, index) => {
        const article = document.createElement('article'); article.setAttribute('data-markdown-src', `../content/article-${index}.md`);
        for (const type of ['markdown:rendered', 'markdown:enhanced']) article.addEventListener(type, () => events.push({ article, type }));
        document.body.appendChild(article); return article;
    });
    const sandbox = {
        document, URL, CustomEvent: FixtureEvent,
        location: { href: 'https://site.test/resources/fixture.html' + hash, hash },
        navigator: clipboard === 'absent' ? {} : { clipboard: { async writeText(text) { if (clipboard === 'reject') throw new Error('Clipboard denied'); copied.push(text); } } },
        console: { error: (...args) => errors.push(args) },
        setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        getSelection: () => selection,
        open: (...args) => opened.push(args),
        async fetch(source, options) {
            fetches.push({ source, options });
            if (failure === 'network') throw new Error('Network unavailable');
            return { ok: failure !== 'http', status: failure === 'http' ? 404 : 200, async text() { return sources[Number(source.match(/article-(\d+)/)[1])]; } };
        }
    };
    const windowEvents = new FixtureElement('window', document);
    sandbox.addEventListener = windowEvents.addEventListener.bind(windowEvents);
    sandbox.dispatchEvent = windowEvents.dispatchEvent.bind(windowEvents);
    sandbox.window = sandbox;
    const context = vm.createContext(sandbox);
    document.loadScript = script => {
        loaded.push(script.src);
        void (async () => {
            try {
                if (failAsset && script.src.includes(failAsset)) throw new Error('Simulated optional asset failure');
                const relativePath = new URL(script.src).pathname.replace(/^\/js\//, '');
                const source = await readFile(new URL('../js/' + relativePath, import.meta.url), 'utf8');
                vm.runInContext(source, context, { filename: relativePath }); script.onload();
            } catch (error) { errors.push(error); script.onerror(); }
        })();
    };
    vm.runInContext(rendererSource, context, { filename: 'markdown-renderer.js' });
    await until(() => articles.every(article => article.getAttribute('aria-busy') === 'false'));
    if (!failure && articles.length) await until(() => events.filter(event => event.type === 'markdown:enhanced').length === articles.length);
    const element = (tag, attributes = {}, text = '') => {
        const node = document.createElement(tag); Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value)); node.textContent = text; return node;
    };
    return {
        document, articles, loaded, copied, opened, errors, events, fetches, timers, selection, element,
        click(target, properties = {}) { document.dispatchEvent(new FixtureEvent('click', { target, ...properties })); },
        changeHash(hash) {
            sandbox.location.hash = hash;
            sandbox.location.href = 'https://site.test/resources/fixture.html' + hash;
            sandbox.dispatchEvent(new FixtureEvent('hashchange'));
        },
        resetLabels() { for (const [id, timer] of timers) if (timer.delay === 1800) { timers.delete(id); timer.callback(); } }
    };
}

async function check(name, callback) { await callback(); results.push(name); }

await check('Local parser assets load once for concurrent articles; real Markdown renders before enhancement', async () => {
    const h = await harness({ sources: ['# First\n\n**Readable** article.', '## Second\n\n- nested\n  - item'] });
    assert.equal(h.loaded.length, 4); assert.equal(new Set(h.loaded).size, 4);
    assert.ok(h.loaded.every(url => url.startsWith('https://site.test/js/')));
    assert.match(h.articles[0].innerHTML, /<strong>Readable<\/strong>/);
    assert.match(h.articles[1].innerHTML, /<ul>/);
    for (const article of h.articles) assert.deepEqual(h.events.filter(event => event.article === article).map(event => event.type), ['markdown:rendered', 'markdown:enhanced']);
    assert.ok(h.fetches.every(fetch => fetch.options.cache === 'no-cache'));
    assert.equal(h.errors.length, 0); assert.equal(h.timers.size, 0);
});

await check('HTTP and network failures replace loading content with an accessible message', async () => {
    for (const failure of ['http', 'network']) {
        const h = await harness({ failure }); const article = h.articles[0];
        assert.equal(article.getAttribute('aria-busy'), 'false');
        assert.equal(article.querySelector('.markdown-load-error').getAttribute('role'), 'alert');
        assert.match(article.textContent, /could not be loaded/); assert.equal(h.events.length, 0);
    }
});

await check('Initial and changed Unicode fragments open every ancestor detail before scrolling', async () => {
    const id = '測試-heading';
    const h = await harness({
        hash: '#' + encodeURIComponent(id),
        seedArticle(article) {
            const outer = article.ownerDocument.createElement('details');
            const inner = article.ownerDocument.createElement('details');
            const target = article.ownerDocument.createElement('h3'); target.setAttribute('id', id);
            inner.appendChild(target); outer.appendChild(inner); article.appendChild(outer);
        }
    });
    const target = h.document.getElementById(id); const inner = target.parentElement; const outer = inner.parentElement;
    assert.equal(inner.open, true); assert.equal(outer.open, true); assert.equal(target.scrolled, true);
    inner.open = false; outer.open = false; target.scrolled = false;
    h.changeHash('#unrelated'); assert.equal(target.scrolled, false); assert.equal(inner.open, false);
    h.changeHash('#' + encodeURIComponent(id));
    assert.equal(inner.open, true); assert.equal(outer.open, true); assert.equal(target.scrolled, true);
    assert.doesNotThrow(() => h.changeHash('#%E0%A4%A'));
});

await check('Failed optional KaTeX loading preserves readable articles and still completes enhancement', async () => {
    const h = await harness({
        sources: ['Article one with $V=IR$.', 'Article two with $P=VI$.'], failAsset: 'katex',
        seedArticle(article) {
            const expression = article.ownerDocument.createElement('span');
            expression.setAttribute('data-math', 'V=IR'); expression.setAttribute('data-math-display', 'false');
            expression.textContent = '\\(V=IR\\)'; article.appendChild(expression);
        }
    });
    assert.equal(h.loaded.filter(url => url.includes('katex')).length, 1);
    assert.equal(h.document.querySelectorAll('link[href*="katex"][rel="stylesheet"]').length, 1);
    for (const article of h.articles) {
        assert.equal(article.getAttribute('aria-busy'), 'false'); assert.match(article.innerHTML, /Article/);
        assert.equal(article.querySelector('.markdown-load-error'), null);
        assert.equal(article.querySelector('[data-math]').textContent, '\\(V=IR\\)');
        assert.equal(article.querySelector('[data-math]').dataset.mathRendered, undefined);
        assert.deepEqual(h.events.filter(event => event.article === article).map(event => event.type), ['markdown:rendered', 'markdown:enhanced']);
    }
    assert.equal(h.timers.size, 0);
});

function codeControls(h, parent = h.articles[0]) {
    const block = h.element('div', { class: 'markdown-code-block' });
    const code = h.element('code', {}, '\tconst message = "<tag>";  \n\n  next();\n');
    const copy = h.element('button', { 'data-code-copy': '' }, 'Copy');
    const wrap = h.element('button', { 'data-code-wrap': '', 'aria-pressed': 'false' }, 'Wrap');
    block.append(copy, wrap, code); parent.appendChild(block); return { block, code, copy, wrap };
}

await check('Only in-article controls act; code clipboard preserves every whitespace character', async () => {
    const h = await harness(); const outside = codeControls(h, h.document.body);
    h.click(outside.copy); h.click(outside.wrap); await nextTurn();
    assert.equal(h.copied.length, 0); assert.equal(outside.wrap.getAttribute('aria-pressed'), 'false');
    const { code, copy } = codeControls(h); const nested = h.element('span'); copy.appendChild(nested);
    h.click(nested); await nextTurn();
    assert.deepEqual(h.copied, [code.textContent]); assert.equal(copy.textContent, 'Copied');
    h.resetLabels(); assert.equal(copy.textContent, 'Copy');
});

await check('Denied or absent clipboard selects the code for manual copying', async () => {
    for (const clipboard of ['reject', 'absent']) {
        const h = await harness({ clipboard }); const { code, copy } = codeControls(h);
        h.click(copy); await nextTurn();
        assert.equal(copy.textContent, 'Code selected'); assert.equal(h.selection.ranges[0].target, code);
        h.resetLabels(); assert.equal(copy.textContent, 'Copy');
    }
});

await check('Wrap toggles its state and aria-pressed in both directions', async () => {
    const h = await harness(); const { block, wrap } = codeControls(h);
    h.click(wrap); assert.equal(wrap.getAttribute('aria-pressed'), 'true'); assert.ok(block.classList.contains('is-wrapped'));
    h.click(wrap); assert.equal(wrap.getAttribute('aria-pressed'), 'false'); assert.ok(!block.classList.contains('is-wrapped'));
});

await check('Table clipboard produces normalized tab-separated text and a manual fallback', async () => {
    for (const clipboard of ['success', 'reject']) {
        const h = await harness({ clipboard }); const block = h.element('div', { class: 'markdown-table-block' });
        const button = h.element('button', { 'data-table-copy': '' }, 'Copy table'); const table = h.element('table');
        table.rows = [[' Name ', 'Value'], ['Line\n break', ' 3\t V ']].map(cells => ({ cells: cells.map(text => h.element('td', {}, text)) }));
        block.append(button, table); h.articles[0].appendChild(block); h.click(button); await nextTurn();
        if (clipboard === 'success') { assert.deepEqual(h.copied, ['Name\tValue\nLine break\t3 V']); assert.equal(button.textContent, 'Copied'); }
        else { assert.equal(button.textContent, 'Table selected'); assert.equal(h.selection.ranges[0].target, table); }
        h.resetLabels(); assert.equal(button.textContent, 'Copy table');
    }
});

function imageControl(h, { diagram = true } = {}) {
    const button = h.element('button', { 'data-image-open': '' }); const image = h.element('img');
    Object.assign(image, { src: 'https://site.test/image.png', currentSrc: 'https://site.test/image@2x.png', alt: 'Circuit diagram', title: 'Annotated circuit' });
    if (diagram) image.classList.add('markdown-image-diagram'); button.appendChild(image); h.articles[0].appendChild(button); return button;
}

await check('Image dialog uses current source/caption, closes by control/backdrop/native cancel, and restores focus', async () => {
    const h = await harness(); const opener = imageControl(h); h.click(opener);
    const dialog = h.document.querySelector('dialog'); assert.equal(dialog.open, true); assert.equal(dialog.getAttribute('aria-label'), 'Image preview');
    const preview = dialog.querySelector('img'); assert.equal(preview.src, 'https://site.test/image@2x.png');
    assert.equal(preview.alt, 'Circuit diagram'); assert.ok(preview.classList.contains('markdown-image-diagram'));
    assert.equal(dialog.querySelector('.markdown-image-caption').textContent, 'Annotated circuit');
    dialog.querySelector('.markdown-image-close').dispatchEvent(new FixtureEvent('click'));
    assert.equal(dialog.open, false); assert.equal(h.document.activeElement, opener); assert.equal(opener.focusOptions.preventScroll, true);
    h.click(opener); dialog.dispatchEvent(new FixtureEvent('click', { clientX: 50, clientY: 50 })); assert.equal(dialog.open, true);
    dialog.dispatchEvent(new FixtureEvent('click', { clientX: 0, clientY: 0 })); assert.equal(dialog.open, false);
    const second = imageControl(h, { diagram: false }); h.click(second);
    assert.equal(h.document.querySelectorAll('dialog').length, 1); assert.ok(!preview.classList.contains('markdown-image-diagram'));
    const cancel = new FixtureEvent('cancel', { cancelable: true }); dialog.dispatchEvent(cancel);
    assert.equal(cancel.defaultPrevented, false); if (!cancel.defaultPrevented) dialog.close();
    assert.equal(dialog.open, false); assert.equal(h.document.activeElement, second);
});

await check('Browsers without native dialogs open the image with noopener', async () => {
    const h = await harness({ dialogSupported: false }); const opener = imageControl(h); h.click(opener);
    assert.deepEqual(h.opened, [['https://site.test/image.png', '_blank', 'noopener']]);
    assert.equal(h.document.querySelector('dialog'), null);
});

await check('Pages with no Markdown article load no assets or fetches', async () => {
    const h = await harness({ sources: [] }); assert.equal(h.loaded.length, 0); assert.equal(h.fetches.length, 0);
});

export { results };
console.log(`Markdown UI: ${results.length} integration checks passed.`);
