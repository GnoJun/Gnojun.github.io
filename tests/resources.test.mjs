// Run with: node tests/resources.test.mjs (no packages or network required).
// The small fixture exercises the library controller, not browser layout.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const [pageSource, dataSource, controllerSource] = await Promise.all([
    readFile(new URL('resources.html', root), 'utf8'),
    readFile(new URL('js/resources-data.js', root), 'utf8'),
    readFile(new URL('js/resources.js', root), 'utf8')
]);

class FixtureEvent {
    constructor(type, options = {}) { Object.assign(this, { type, defaultPrevented: false }, options); }
    preventDefault() { this.defaultPrevented = true; }
}

class FixtureElement {
    constructor(tag = 'div', attributes = {}) {
        this.tagName = tag.toUpperCase();
        this.attributes = new Map();
        this.dataset = new Proxy({}, {
            set: (dataset, name, value) => {
                dataset[name] = String(value);
                this.attributes.set('data-' + name.replace(/[A-Z]/g, char => '-' + char.toLowerCase()), String(value));
                return true;
            }
        });
        this.children = [];
        this.listeners = new Map();
        this.hidden = false;
        this.open = false;
        this._value = '';
        this._html = '';
        this.textContent = '';
        this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
        Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
    }
    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'id') this.id = String(value);
        if (name === 'value') this._value = String(value);
        if (name === 'hidden') this.hidden = true;
        if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = String(value);
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) {
        this.attributes.delete(name);
        if (name.startsWith('data-')) delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())];
    }
    get value() { return this._value; }
    set value(value) {
        this._value = this.tagName !== 'SELECT' || this.options.some(option => option.value === String(value)) ? String(value) : '';
    }
    get options() { return this.children.filter(child => child.tagName === 'OPTION'); }
    get selectedIndex() { return this.options.findIndex(option => option.value === this.value); }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
        this._html = String(value);
        this.children = [];
        if (this.tagName === 'SELECT') {
            this._value = '';
            for (const match of this._html.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)) {
                const option = new FixtureElement('option', parseAttributes(match[1]));
                option.textContent = match[2];
                this.append(option);
            }
        }
    }
    append(...children) {
        children.forEach(child => {
            child.parentElement = this;
            this.children.push(child);
            if (this.tagName === 'SELECT' && this.children.length === 1) this._value = child.value;
        });
    }
    appendChild(child) { this.append(child); return child; }
    replaceChildren(...children) {
        this.children = []; this._html = '';
        if (this.tagName === 'SELECT') this._value = '';
        this.append(...children);
    }
    addEventListener(name, handler) {
        if (!this.listeners.has(name)) this.listeners.set(name, []);
        this.listeners.get(name).push(handler);
    }
    dispatch(name, attributes = {}) {
        const event = new FixtureEvent(name, { target: this, ...attributes });
        this.dispatchEvent(event);
        return event;
    }
    dispatchEvent(event) {
        if (!event.target) event.target = this;
        for (const handler of this.listeners.get(event.type) || []) handler(event);
        return !event.defaultPrevented;
    }
    focus() { this.ownerDocument.activeElement = this; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    scrollIntoView() { this.scrollCalls = (this.scrollCalls || 0) + 1; }
    matches(selector) {
        if (selector.includes(',')) return selector.split(',').some(part => this.matches(part.trim()));
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        if (selector.startsWith('.')) return (this.getAttribute('class') || '').split(/\s+/).includes(selector.slice(1));
        const data = selector.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
        if (data) return this.hasAttribute(data[1]) && (data[2] === undefined || this.getAttribute(data[1]) === data[2]);
        return selector.split(',').some(tag => this.tagName === tag.trim().toUpperCase());
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
        return this.children.flatMap(child => [ ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector) ]);
    }
}

function parseAttributes(source) {
    const attributes = {};
    for (const match of source.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)) attributes[match[1]] = match[2] ?? match[3] ?? '';
    return attributes;
}

function createLibrary(query = '', mutateItems) {
    const document = new FixtureElement('document');
    document.activeElement = null;
    document.ownerDocument = document;
    const stack = [document];
    const voidTags = new Set(['input', 'meta', 'link', 'img', 'br', 'hr', 'path', 'circle', 'rect']);
    for (const match of pageSource.matchAll(/<(\/)?([a-z][\w-]*)\b([^>]*?)>/gi)) {
        const tag = match[2].toLowerCase();
        if (match[1]) {
            const index = stack.findLastIndex(node => node.tagName === tag.toUpperCase());
            if (index > 0) stack.length = index;
            continue;
        }
        const node = new FixtureElement(tag, parseAttributes(match[3]));
        node.ownerDocument = document;
        stack.at(-1).append(node);
        if (!voidTags.has(tag) && !match[3].endsWith('/')) stack.push(node);
    }
    document.createElement = tag => { const element = new FixtureElement(tag); element.ownerDocument = document; return element; };
    const location = new URL('https://site.test/resources.html' + query);
    const window = new FixtureElement('window');
    const replacedURLs = [];
    const context = vm.createContext({
        document, window, location, URL, URLSearchParams, console, Event: FixtureEvent,
        history: { replaceState(_state, _title, url) { location.href = String(url); replacedURLs.push(String(url)); } },
        renderMathElements(element) { element.mathRenderCalls = (element.mathRenderCalls || 0) + 1; }
    });
    vm.runInContext(dataSource, context, { filename: 'resources-data.js' });
    const items = vm.runInContext('resourceLibrary', context);
    mutateItems?.(items);
    vm.runInContext(controllerSource, context, { filename: 'resources.js' });
    const get = id => document.querySelector('#' + id);
    const button = type => document.querySelector(`[data-resource-type="${type}"]`);
    const search = value => { get('resource-search').value = value; get('resource-search').dispatch('input'); };
    const change = (id, value) => { get(id).value = value; get(id).dispatch('change'); };
    return { document, window, location, items, get, button, search, change, replacedURLs };
}

const rows = library => [...library.get('resource-list').innerHTML.matchAll(/<li\b[^>]*class="resource-row\b[\s\S]*?<\/li>/g)].map(match => match[0]);
let passed = 0;
function test(name, check) { check(); passed++; console.log('PASS ' + name); }

test('The default library shows every item newest first and offers only date sorting', () => {
    const library = createLibrary();
    assert.equal(rows(library).length, library.items.length);
    assert.equal(library.get('resources-empty-state').hidden, true);
    assert.equal(library.button('all').getAttribute('aria-pressed'), 'true');
    assert.equal(library.get('resource-list').mathRenderCalls, undefined);
    assert.equal(library.get('resource-sort').value, 'newest');
    assert.deepEqual(library.get('resource-sort').options.map(option => option.value), ['newest', 'oldest']);
    const dates = rows(library).map(row => row.match(/<time datetime="([^"]+)"/)[1]);
    assert.deepEqual(dates, [...dates].sort().reverse());
    assert.equal(library.location.searchParams.has('sort'), false);
});

test('Course search accepts both the compact ID and spaced course code', () => {
    const library = createLibrary();
    for (const query of ['eele201', 'EELE 201']) {
        library.search(query);
        assert.equal(rows(library).length, 1);
        assert.match(library.get('resource-list').innerHTML, /Circuits I/);
        assert.equal(library.location.searchParams.get('q'), query);
    }
});

test('The course collection shows four courses and the note filter retains all notes', () => {
    const courses = createLibrary('?type=course');
    assert.equal(rows(courses).length, 4);
    for (const title of ['Circuits I', 'Circuits II', 'Physics I', 'Physics II']) assert.match(courses.get('resource-list').innerHTML, new RegExp(title));
    assert.equal(courses.button('course').getAttribute('aria-pressed'), 'true');
    const notes = createLibrary('?type=note');
    assert.equal(rows(notes).length, notes.items.filter(item => item.kind === 'note').length);
    assert.match(notes.get('resource-list').innerHTML, /Circuits I/);
});

test('Topics follow the selected type and an incompatible topic resets on type change', () => {
    const library = createLibrary('?type=component&topic=Display');
    assert.ok(rows(library).length > 0);
    assert.equal(library.get('resource-topic').value, 'Display');
    library.button('course').dispatch('click');
    assert.equal(library.get('resource-topic').value, 'all');
    assert.equal(rows(library).length, 4);
    assert.equal(library.location.searchParams.has('topic'), false);
    assert.equal(library.get('resource-topic').options.some(option => option.value === 'Display'), false);
    assert.equal(library.get('resource-topic').options.some(option => option.value === 'Physics'), true);
});

test('Zero matches announces an empty state and reset restores the library', () => {
    const library = createLibrary();
    library.change('resource-sort', 'oldest');
    library.search('no-such-resource-987654');
    assert.equal(rows(library).length, 0);
    assert.equal(library.get('resources-empty-state').hidden, false);
    assert.equal(library.get('resource-list').hidden, true);
    assert.equal(library.get('resource-reset-inline').hidden, false);
    library.get('resource-reset').dispatch('click');
    assert.equal(rows(library).length, library.items.length);
    assert.equal(library.get('resource-search').value, '');
    assert.equal(library.location.search, '');
    assert.equal(library.get('resources-empty-state').hidden, true);
    assert.equal(library.get('resource-sort').value, 'newest');
    assert.equal(library.get('resource-reset-inline').hidden, true);
});

test('Clearing search retains the type and the search receives focus', () => {
    const library = createLibrary('?type=component');
    library.search('oled');
    assert.equal(rows(library).length, 2);
    library.get('resource-search-clear').dispatch('click');
    assert.equal(rows(library).length, library.items.filter(item => item.kind === 'component').length);
    assert.equal(library.location.searchParams.get('type'), 'component');
    assert.equal(library.document.activeElement?.id, 'resource-search');
});

test('Slash focuses search, typing shortcuts are ignored, and Escape clears it', () => {
    const library = createLibrary();
    const slash = library.document.dispatch('keydown', { key: '/' });
    assert.equal(slash.defaultPrevented, true);
    assert.equal(library.document.activeElement?.id, 'resource-search');
    for (const attributes of [{ target: library.get('resource-search') }, { ctrlKey: true }, { isComposing: true }]) {
        const event = library.document.dispatch('keydown', { key: '/', ...attributes });
        assert.equal(event.defaultPrevented, false);
    }
    library.search('esp32');
    library.get('resource-search').dispatch('keydown', { key: 'Escape', isComposing: true });
    assert.equal(library.get('resource-search').value, 'esp32');
    library.get('resource-search').dispatch('keydown', { key: 'Escape' });
    assert.equal(library.get('resource-search').value, '');
    assert.equal(rows(library).length, library.items.length);
});

test('Inline references retain formula and specifications previews without fake links', () => {
    const library = createLibrary();
    const ohms = rows(library).find(row => row.includes("Ohm&#39;s Law"));
    assert.ok(ohms);
    assert.match(ohms, /<details\b/);
    assert.match(ohms, /data-math="V = IR"/);
    assert.doesNotMatch(ohms, /<a\b/);
    const pn532 = rows(library).find(row => row.includes('PN532 NFC Module'));
    assert.match(pn532, /<details\b/);
    assert.match(pn532, /PN532-based NFC reader module/);
    assert.doesNotMatch(pn532, /<a\b/);
});

test('External links have safe attributes and executable catalogue URLs are rejected', () => {
    const library = createLibrary('', items => items.push({
        id: 'unsafe', kind: 'reference', category: 'Tools', title: '<unsafe> & "quoted"',
        description: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', external: true
    }));
    const external = rows(library).find(row => row.includes('href="https://docs.kicad.org/"'));
    assert.ok(external);
    assert.match(external, /target="_blank"/);
    assert.match(external, /rel="noopener noreferrer"/);
    const unsafe = rows(library).find(row => row.includes('&lt;unsafe&gt;'));
    assert.ok(unsafe);
    assert.match(unsafe, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(unsafe, /<a\b|<img\b|href="javascript:/);
});

test('Sorting updates shareable state while preserving unrelated URL state', () => {
    const library = createLibrary('?utm_source=bookmark#library');
    assert.equal(library.get('resource-sort').value, 'newest');
    assert.equal(library.location.searchParams.has('sort'), false);
    assert.equal(library.location.searchParams.get('utm_source'), 'bookmark');
    assert.equal(library.location.hash, '#library');
    const newest = library.get('resource-list').innerHTML;
    const sortedIDs = () => [...library.get('resource-list').innerHTML.matchAll(/data-resource-id="([^"]+)"/g)].map(match => match[1]);
    const expectedOrder = direction => [...library.items].sort((a, b) => direction * (a.date || '').localeCompare(b.date || '') || a.title.localeCompare(b.title)).map(item => item.id);
    assert.deepEqual(sortedIDs(), expectedOrder(-1));
    library.change('resource-sort', 'oldest');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
    assert.notEqual(library.get('resource-list').innerHTML, newest);
    assert.deepEqual(sortedIDs(), expectedOrder(1));
    library.change('resource-sort', 'newest');
    assert.equal(library.location.searchParams.has('sort'), false);
    assert.equal(library.location.searchParams.get('utm_source'), 'bookmark');
    assert.equal(library.location.hash, '#library');
    assert.deepEqual(sortedIDs(), expectedOrder(-1));
});

test('History navigation restores type, topic, query, and sorting without rewriting history', () => {
    const library = createLibrary();
    library.search('git');
    const writesBeforeNavigation = library.replacedURLs.length;
    library.location.href = 'https://site.test/resources.html?type=component&topic=Display&q=oled&sort=oldest';
    library.window.dispatch('popstate');
    assert.equal(library.get('resource-search').value, 'oled');
    assert.equal(library.get('resource-topic').value, 'Display');
    assert.equal(library.get('resource-sort').value, 'oldest');
    assert.equal(library.button('component').getAttribute('aria-pressed'), 'true');
    assert.equal(rows(library).length, 2);
    assert.equal(library.replacedURLs.length, writesBeforeNavigation);
});

test('Invalid filters and legacy title sorting fall back to the full library newest first', () => {
    for (const sort of ['invalid', 'title']) {
        const library = createLibrary(`?type=unknown&topic=missing&sort=${sort}`);
        assert.equal(rows(library).length, library.items.length);
        assert.equal(library.get('resource-topic').value, 'all');
        assert.equal(library.get('resource-sort').value, 'newest');
        assert.equal(library.button('all').getAttribute('aria-pressed'), 'true');
        const dates = rows(library).map(row => row.match(/<time datetime="([^"]+)"/)[1]);
        assert.deepEqual(dates, [...dates].sort().reverse());
        library.search('circuits');
        assert.equal(library.location.searchParams.has('sort'), false);
    }
});

test('Collection counts describe the catalogue and remain stable while filtering', () => {
    const library = createLibrary();
    const counts = () => Object.fromEntries(library.document.querySelectorAll('[data-resource-count]').map(counter => [counter.dataset.resourceCount, Number(counter.textContent)]));
    const expected = {
        all: library.items.length,
        course: library.items.filter(item => item.resourceType === 'Course Notes').length,
        note: library.items.filter(item => item.kind === 'note').length,
        component: library.items.filter(item => item.kind === 'component').length,
        reference: library.items.filter(item => item.kind === 'reference').length
    };
    assert.deepEqual(counts(), expected);
    assert.equal(library.get('resource-total').textContent, `${library.items.length} resources`);
    assert.equal(library.get('resource-total').hidden, false);
    library.search('oled');
    library.button('component').dispatch('click');
    library.change('resource-topic', 'Display');
    assert.deepEqual(counts(), expected);
});

test('Formula rendering waits for an open preview and ignores closed or unrelated toggles', () => {
    const library = createLibrary();
    const list = library.get('resource-list');
    assert.equal(list.mathRenderCalls, undefined);
    const preview = new FixtureElement('details', { class: 'resource-preview' });
    preview.ownerDocument = library.document;
    list.dispatch('toggle', { target: preview });
    assert.equal(preview.mathRenderCalls, undefined);
    preview.open = true;
    list.dispatch('toggle', { target: preview });
    assert.equal(preview.mathRenderCalls, 1);
    const unrelated = new FixtureElement('details');
    unrelated.open = true;
    list.dispatch('toggle', { target: unrelated });
    assert.equal(unrelated.mathRenderCalls, undefined);
});

test('The enhanced topic picker opens a labelled list and mouse selection filters resources', () => {
    const library = createLibrary();
    const toggle = library.get('resource-topic-toggle');
    const menu = library.get('resource-topic-menu');
    assert.equal(toggle.getAttribute('role'), 'combobox');
    assert.equal(toggle.getAttribute('aria-controls'), menu.id);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(menu.hidden, true);
    assert.equal(library.get('resource-topic-value').textContent, 'All topics');
    assert.equal(menu.querySelectorAll('[role="option"]').length, library.get('resource-topic').options.length);
    assert.equal(library.get('resource-topic').hidden, true);
    assert.equal(toggle.hidden, false);
    toggle.focus();
    toggle.dispatch('click');
    assert.equal(menu.hidden, false);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(library.document.activeElement?.id, toggle.id);
    const display = menu.querySelector('[data-topic-value="Display"]');
    assert.ok(display);
    assert.equal(display.dispatch('pointerdown').defaultPrevented, true);
    display.dispatch('click');
    assert.equal(library.get('resource-topic').value, 'Display');
    assert.equal(library.get('resource-topic-value').textContent, 'Display');
    assert.equal(library.location.searchParams.get('topic'), 'Display');
    assert.equal(rows(library).length, library.items.filter(item => item.category === 'Display').length);
    assert.equal(menu.hidden, true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(menu.querySelector('[data-topic-value="Display"]').getAttribute('aria-selected'), 'true');
});

test('Topic keyboard navigation supports boundaries, arrows, Enter, and Space', () => {
    const library = createLibrary();
    const toggle = library.get('resource-topic-toggle');
    const menu = library.get('resource-topic-menu');
    const options = () => menu.querySelectorAll('[role="option"]');
    const active = () => options().find(option => option.id === toggle.getAttribute('aria-activedescendant'));
    toggle.dispatch('click');
    toggle.dispatch('keydown', { key: 'Home' });
    assert.equal(active()?.id, options()[0].id);
    toggle.dispatch('keydown', { key: 'ArrowDown' });
    assert.equal(active()?.id, options()[1].id);
    toggle.dispatch('keydown', { key: 'End' });
    assert.equal(active()?.id, options().at(-1).id);
    toggle.dispatch('keydown', { key: 'ArrowUp' });
    const selected = options().at(-2).dataset.topicValue;
    assert.equal(active()?.id, options().at(-2).id);
    toggle.dispatch('keydown', { key: 'Enter' });
    assert.equal(library.get('resource-topic').value, selected);
    assert.equal(menu.hidden, true);
    toggle.dispatch('keydown', { key: 'ArrowDown' });
    assert.equal(menu.hidden, false);
    toggle.dispatch('keydown', { key: 'Home' });
    toggle.dispatch('keydown', { key: ' ' });
    assert.equal(library.get('resource-topic').value, 'all');
    assert.equal(menu.hidden, true);
    assert.equal(library.location.searchParams.has('topic'), false);
});

test('Escape closes the topic menu without applying a pending keyboard choice', () => {
    const library = createLibrary('?topic=Display');
    const toggle = library.get('resource-topic-toggle');
    toggle.dispatch('click');
    toggle.dispatch('keydown', { key: 'Home' });
    toggle.dispatch('keydown', { key: 'Escape' });
    assert.equal(library.get('resource-topic-menu').hidden, true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.hasAttribute('aria-activedescendant'), false);
    assert.equal(library.get('resource-topic').value, 'Display');
    assert.equal(library.get('resource-topic-value').textContent, 'Display');
    assert.equal(library.location.searchParams.get('topic'), 'Display');
});

test('Tab, outside clicks, and focus leaving the topic picker close its menu', () => {
    const library = createLibrary();
    const toggle = library.get('resource-topic-toggle');
    const menu = library.get('resource-topic-menu');
    toggle.focus();
    toggle.dispatch('click');
    library.document.dispatch('click', { target: library.get('resource-topic-value') });
    library.document.dispatch('focusin', { target: toggle });
    assert.equal(menu.hidden, false);
    const tab = toggle.dispatch('keydown', { key: 'Tab' });
    assert.equal(tab.defaultPrevented, false);
    assert.equal(menu.hidden, true);
    toggle.dispatch('click');
    library.document.dispatch('click', { target: library.get('resource-search') });
    assert.equal(menu.hidden, true);
    toggle.dispatch('click');
    library.document.dispatch('focusin', { target: library.get('resource-search') });
    assert.equal(menu.hidden, true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.hasAttribute('aria-activedescendant'), false);
});

test('Topic typeahead jumps to a matching category without committing it', () => {
    const library = createLibrary();
    const toggle = library.get('resource-topic-toggle');
    const menu = library.get('resource-topic-menu');
    toggle.dispatch('keydown', { key: 'p', isComposing: true });
    assert.equal(menu.hidden, true);
    toggle.dispatch('click');
    toggle.dispatch('keydown', { key: 'p' });
    const active = menu.querySelectorAll('[role="option"]').find(option => option.id === toggle.getAttribute('aria-activedescendant'));
    assert.ok(active);
    assert.match(active.textContent.toLowerCase(), /^p/);
    assert.equal(library.get('resource-topic').value, 'all');
    toggle.dispatch('keydown', { key: 'Enter' });
    assert.equal(library.get('resource-topic').value, active.dataset.topicValue);
});

test('Topic labels and selected options stay in sync with URL state, category changes, and reset', () => {
    const library = createLibrary('?type=component&topic=Display');
    assert.equal(library.get('resource-topic-value').textContent, 'Display');
    assert.equal(library.get('resource-topic-menu').querySelector('[data-topic-value="Display"]').getAttribute('aria-selected'), 'true');
    library.button('course').dispatch('click');
    assert.equal(library.get('resource-topic-value').textContent, 'All topics');
    assert.equal(library.get('resource-topic-menu').querySelector('[data-topic-value="Display"]'), null);
    library.change('resource-topic', 'EELE 201');
    assert.equal(library.get('resource-topic-value').textContent, 'EELE 201');
    assert.equal(library.get('resource-topic-menu').querySelector('[data-topic-value="EELE 201"]').getAttribute('aria-selected'), 'true');
    library.location.href = 'https://site.test/resources.html?type=course&topic=Physics';
    library.window.dispatch('popstate');
    assert.equal(library.get('resource-topic-value').textContent, 'Physics');
    library.get('resource-reset-inline').dispatch('click');
    assert.equal(library.get('resource-topic-value').textContent, 'All topics');
    assert.equal(library.get('resource-topic-menu').hidden, true);
    assert.equal(library.get('resource-topic-menu').querySelector('[data-topic-value="all"]').getAttribute('aria-selected'), 'true');
});

console.log(`\n${passed} resources checks passed.`);

