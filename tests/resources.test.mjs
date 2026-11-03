// Run with: node tests/resources.test.mjs (no packages or network required).
// The small fixture exercises the library controller, not browser layout.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const EXPECTED_PAGE_SIZE = 10;
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
        this.disabled = false;
        this.open = false;
        this.scrollTop = 0;
        this._value = '';
        this._html = '';
        this.textContent = '';
        this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
        const styleProperties = new Map();
        this.style = {
            setProperty(name, value) { styleProperties.set(name, String(value)); },
            getPropertyValue(name) { return styleProperties.get(name) || ''; }
        };
        if (this.tagName === 'DIALOG') {
            this.showModal = () => {
                this.open = true;
                this.attributes.set('open', '');
                this.modalCalls = (this.modalCalls || 0) + 1;
            };
            this.close = () => {
                const wasOpen = this.open;
                this.open = false;
                this.attributes.delete('open');
                if (wasOpen) this.dispatch('close');
            };
        }
        Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
    }
    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'id') this.id = String(value);
        if (name === 'value') this._value = String(value);
        if (name === 'hidden') this.hidden = true;
        if (name === 'disabled') this.disabled = true;
        if (name === 'open') this.open = true;
        if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = String(value);
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) {
        this.attributes.delete(name);
        if (name === 'disabled') this.disabled = false;
        if (name === 'open') this.open = false;
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
        this.children.forEach(child => { child.parentElement = null; });
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
            if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(node => node !== child);
            child.parentElement = this;
            this.children.push(child);
            if (this.tagName === 'SELECT' && this.children.length === 1) this._value = child.value;
        });
    }
    prepend(...children) {
        children.forEach(child => {
            if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(node => node !== child);
            child.parentElement = this;
        });
        this.children.unshift(...children);
    }
    appendChild(child) { this.append(child); return child; }
    replaceChildren(...children) {
        this.children.forEach(child => { child.parentElement = null; });
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
        if (name === 'cancel' && this.tagName === 'DIALOG' && !event.defaultPrevented) this.close();
        return event;
    }
    dispatchEvent(event) {
        if (!event.target) event.target = this;
        for (const handler of this.listeners.get(event.type) || []) handler(event);
        return !event.defaultPrevented;
    }
    focus(options) { this.ownerDocument.activeElement = this; this.focusOptions = options; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    getBoundingClientRect() {
        return {
            height: this.rectHeight ?? 0, width: this.rectWidth ?? 0,
            left: this.rectLeft ?? 0, bottom: this.rectBottom ?? 0
        };
    }
    scrollIntoView(options) { this.scrollCalls = (this.scrollCalls || 0) + 1; this.scrollOptions = options; }
    matches(selector) {
        if (selector.includes(',')) return selector.split(',').some(part => this.matches(part.trim()));
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        if (selector.startsWith('.')) return (this.getAttribute('class') || '').split(/\s+/).includes(selector.slice(1));
        const data = selector.match(/^(\w+)?\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
        if (data) return (!data[1] || this.tagName === data[1].toUpperCase()) && this.hasAttribute(data[2]) && (data[3] === undefined || this.getAttribute(data[2]) === data[3]);
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

function createLibrary(query = '', mutateItems, environment = {}) {
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
    window.innerWidth = environment.innerWidth ?? 1280;
    window.innerHeight = environment.innerHeight ?? 800;
    const makeViewport = matches => {
        const listeners = [];
        return {
            matches,
            addEventListener(type, listener) { if (type === 'change') listeners.push(listener); },
            update(next) {
                this.matches = next;
                listeners.forEach(listener => listener(new FixtureEvent('change', { matches: next })));
            }
        };
    };
    const shortViewport = makeViewport(Boolean(environment.shortViewport));
    const mobileViewport = makeViewport(Boolean(environment.mobileViewport));
    if ('shortViewport' in environment || 'mobileViewport' in environment) window.matchMedia = query => query.includes('max-width') ? mobileViewport : shortViewport;
    const setShortViewport = matches => shortViewport.update(matches);
    const setMobileViewport = matches => mobileViewport.update(matches);
    const replacedURLs = [];
    const pushedURLs = [];
    const context = vm.createContext({
        document, window, location, URL, URLSearchParams, console, Event: FixtureEvent,
        history: {
            replaceState(_state, _title, url) { location.href = String(url); replacedURLs.push(String(url)); },
            pushState(_state, _title, url) { location.href = String(url); pushedURLs.push(String(url)); }
        },
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
    return { document, window, location, items, get, button, search, change, replacedURLs, pushedURLs, setShortViewport, setMobileViewport };
}

const rows = library => [...library.get('resource-list').innerHTML.matchAll(/<li\b[^>]*class="resource-row\b[\s\S]*?<\/li>/g)].map(match => match[0]);
const rowIDs = library => [...library.get('resource-list').innerHTML.matchAll(/data-resource-id="([^"]+)"/g)].map(match => match[1]);
const pageButton = (library, number) => library.get('resource-page-numbers').querySelector(`[data-resource-page="${number}"]`);
function collectPages(library) {
    const allRows = [...rows(library)];
    let visited = 1;
    while (!library.get('resource-page-next').disabled) {
        assert.ok(visited++ < 100, 'Pagination must eventually reach its final page');
        library.get('resource-page-next').dispatch('click');
        allRows.push(...rows(library));
    }
    return allRows;
}
function expectOnlyResultsScrollReset(library) {
    const results = library.get('resource-results-scroll');
    assert.ok(results, 'Results must have a dedicated scroll region');
    results.scrollTop = 360;
    const outer = [...new Set([
        library.document.querySelector('html'), library.document.querySelector('body'),
        library.document.querySelector('.library-sidebar'), library.get('resource-controls'),
        results.parentElement
    ].filter(Boolean))].map((element, index) => {
        element.scrollTop = 40 + index * 10;
        return { element, top: element.scrollTop, scrollCalls: element.scrollCalls || 0 };
    });
    return () => {
        assert.equal(results.scrollTop, 0, 'Result changes should return only the result region to its top');
        for (const { element, top, scrollCalls } of outer) {
            assert.equal(element.scrollTop, top, 'Outer layout scroll positions must stay unchanged');
            assert.equal(element.scrollCalls || 0, scrollCalls, 'Outer elements must not be scrolled into view');
        }
        assert.equal(library.get('resource-results-title').scrollCalls || 0, 0, 'Focusing the result heading must not scroll outer containers');
    };
}
let passed = 0;
function test(name, check) { check(); passed++; console.log('PASS ' + name); }

test('The default library shows ten items newest first and offers only date sorting', () => {
    const library = createLibrary();
    assert.equal(rows(library).length, Math.min(EXPECTED_PAGE_SIZE, library.items.length));
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
    const noteCount = notes.items.filter(item => item.kind === 'note').length;
    assert.equal(rows(notes).length, Math.min(EXPECTED_PAGE_SIZE, noteCount));
    assert.equal(notes.get('resource-pagination').hidden, noteCount <= EXPECTED_PAGE_SIZE);
    const noteRows = collectPages(notes);
    assert.equal(noteRows.length, noteCount);
    assert.match(noteRows.join(''), /Circuits I/);
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
    assert.equal(rows(library).length, Math.min(EXPECTED_PAGE_SIZE, library.items.length));
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
    assert.equal(rows(library).length, Math.min(EXPECTED_PAGE_SIZE, library.items.length));
});

test('Inline references retain formula and specifications previews without fake links', () => {
    const library = createLibrary();
    library.search('ohms-law');
    const ohms = rows(library).find(row => row.includes("Ohm&#39;s Law"));
    assert.ok(ohms);
    assert.match(ohms, /<details\b/);
    assert.match(ohms, /data-math="V = IR"/);
    assert.doesNotMatch(ohms, /<a\b/);
    library.search('pn532');
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
    library.search('kicad');
    const external = rows(library).find(row => row.includes('href="https://docs.kicad.org/"'));
    assert.ok(external);
    assert.match(external, /target="_blank"/);
    assert.match(external, /rel="noopener noreferrer"/);
    library.search('unsafe');
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
    const sortedIDs = () => collectPages(library).map(row => row.match(/data-resource-id="([^"]+)"/)[1]);
    const expectedOrder = direction => [...library.items].sort((a, b) => direction * (a.date || '').localeCompare(b.date || '') || a.title.localeCompare(b.title)).map(item => item.id);
    assert.deepEqual(sortedIDs(), expectedOrder(-1));
    library.change('resource-sort', 'oldest');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
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
        assert.equal(rows(library).length, Math.min(EXPECTED_PAGE_SIZE, library.items.length));
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

test('Pagination visits every resource exactly once with at most ten entries per page', () => {
    const library = createLibrary();
    const expectedPages = Math.ceil(library.items.length / EXPECTED_PAGE_SIZE);
    assert.equal(library.get('resource-pagination').hidden, false);
    assert.equal(library.get('resource-page-prev').disabled, true);
    assert.equal(library.get('resource-page-next').disabled, false);
    assert.equal(library.get('resource-page-status').textContent, `Page 1 of ${expectedPages}`);
    assert.equal(pageButton(library, 1).getAttribute('aria-current'), 'page');
    const visited = [];
    for (let page = 1; page <= expectedPages; page++) {
        const start = (page - 1) * EXPECTED_PAGE_SIZE;
        const end = Math.min(page * EXPECTED_PAGE_SIZE, library.items.length);
        assert.equal(rows(library).length, end - start);
        assert.equal(library.get('resource-status').textContent, `Showing ${start + 1}–${end} of ${library.items.length} resources`);
        visited.push(...rowIDs(library));
        if (page < expectedPages) library.get('resource-page-next').dispatch('click');
    }
    assert.equal(visited.length, library.items.length);
    assert.equal(new Set(visited).size, library.items.length);
    assert.deepEqual([...visited].sort(), [...library.items].map(item => item.id).sort());
    assert.equal(library.get('resource-page-next').disabled, true);
    assert.equal(library.get('resource-page-prev').disabled, false);
    assert.equal(library.get('resource-page-status').textContent, `Page ${expectedPages} of ${expectedPages}`);
    assert.equal(pageButton(library, expectedPages).getAttribute('aria-current'), 'page');
});

test('Page URLs restore middle pages, clamp out of range values, and reject invalid pages', () => {
    const first = createLibrary();
    const expected = collectPages(first).map(row => row.match(/data-resource-id="([^"]+)"/)[1]);
    const middle = createLibrary('?page=2');
    assert.deepEqual(rowIDs(middle), expected.slice(EXPECTED_PAGE_SIZE, EXPECTED_PAGE_SIZE * 2));
    assert.equal(middle.get('resource-page-status').textContent, `Page 2 of ${Math.ceil(expected.length / EXPECTED_PAGE_SIZE)}`);
    assert.equal(middle.replacedURLs.length, 0);
    assert.equal(middle.pushedURLs.length, 0);
    const overflow = createLibrary('?page=999&utm_source=bookmark#library');
    const lastPage = Math.ceil(expected.length / EXPECTED_PAGE_SIZE);
    assert.deepEqual(rowIDs(overflow), expected.slice((lastPage - 1) * EXPECTED_PAGE_SIZE));
    assert.equal(overflow.get('resource-page-status').textContent, `Page ${lastPage} of ${lastPage}`);
    assert.equal(overflow.location.searchParams.get('page'), String(lastPage));
    assert.equal(overflow.location.searchParams.get('utm_source'), 'bookmark');
    assert.equal(overflow.location.hash, '#library');
    assert.equal(overflow.replacedURLs.length, 1);
    assert.equal(overflow.pushedURLs.length, 0);
    for (const value of ['', '0', '1', '-1', '1.5', 'invalid', 'Infinity', '9007199254740992', '999999999999999999999999999999999999999999']) {
        const library = createLibrary('?page=' + value);
        assert.deepEqual(rowIDs(library), expected.slice(0, EXPECTED_PAGE_SIZE));
        assert.equal(library.get('resource-page-status').textContent, `Page 1 of ${lastPage}`);
        assert.equal(library.location.searchParams.has('page'), false);
        assert.equal(library.replacedURLs.length, 1);
        assert.equal(library.pushedURLs.length, 0);
    }
});

test('Exact page boundaries avoid empty pages and one-page or empty results hide navigation', () => {
    for (const count of [EXPECTED_PAGE_SIZE, EXPECTED_PAGE_SIZE + 1, EXPECTED_PAGE_SIZE * 2, EXPECTED_PAGE_SIZE * 2 + 1]) {
        const library = createLibrary('', items => items.splice(count));
        assert.equal(library.get('resource-pagination').hidden, count <= EXPECTED_PAGE_SIZE);
        assert.equal(library.get('resource-page-numbers').querySelectorAll('[data-resource-page]').length, count > EXPECTED_PAGE_SIZE ? Math.ceil(count / EXPECTED_PAGE_SIZE) : 0);
        const visited = collectPages(library);
        assert.equal(visited.length, count);
        assert.ok(rows(library).length > 0);
    }
    const library = createLibrary('?type=course&page=2');
    assert.equal(rows(library).length, 4);
    assert.equal(library.get('resource-pagination').hidden, true);
    assert.equal(library.location.searchParams.has('page'), false);
    assert.equal(library.location.searchParams.get('type'), 'course');
    assert.equal(library.replacedURLs.length, 1);
    assert.equal(library.pushedURLs.length, 0);
    library.search('nothing-matches-987654321');
    assert.equal(rows(library).length, 0);
    assert.equal(library.get('resource-pagination').hidden, true);
    assert.equal(library.get('resources-empty-state').hidden, false);
    assert.equal(library.get('resource-status').textContent, '0 resources');
});

test('Page navigation restores only result scrolling, retains history and filters, and focuses the heading', () => {
    const library = createLibrary('?sort=oldest&utm_source=bookmark#library');
    pageButton(library, 1).dispatch('click');
    library.get('resource-page-prev').dispatch('click');
    assert.equal(library.pushedURLs.length, 0);
    let checkScroll = expectOnlyResultsScrollReset(library);
    library.get('resource-page-next').dispatch('click');
    checkScroll();
    const secondPageIDs = rowIDs(library);
    const secondPageURL = library.location.href;
    assert.equal(library.location.searchParams.get('page'), '2');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
    assert.equal(library.location.searchParams.get('utm_source'), 'bookmark');
    assert.equal(library.location.hash, '#library');
    assert.equal(library.pushedURLs.length, 1);
    assert.equal(library.document.activeElement?.id, 'resource-results-title');
    const heading = library.get('resource-results-title');
    assert.equal(heading.scrollCalls || 0, 0);
    assert.equal(heading.focusOptions.preventScroll, true);
    assert.equal(heading.getAttribute('tabindex'), '-1');
    library.get('resource-page-next').dispatch('click');
    checkScroll = expectOnlyResultsScrollReset(library);
    library.get('resource-page-prev').dispatch('click');
    checkScroll();
    assert.deepEqual(rowIDs(library), secondPageIDs);
    pageButton(library, 1).dispatch('click');
    assert.equal(library.location.searchParams.has('page'), false);
    const pushes = library.pushedURLs.length;
    const replacements = library.replacedURLs.length;
    library.location.href = secondPageURL;
    checkScroll = expectOnlyResultsScrollReset(library);
    library.window.dispatch('popstate');
    checkScroll();
    assert.deepEqual(rowIDs(library), secondPageIDs);
    assert.equal(library.get('resource-page-status').textContent, `Page 2 of ${Math.ceil(library.items.length / EXPECTED_PAGE_SIZE)}`);
    assert.equal(library.pushedURLs.length, pushes);
    assert.equal(library.replacedURLs.length, replacements);
    library.location.href = 'https://site.test/resources.html?page=999&sort=oldest&utm_source=history#library';
    checkScroll = expectOnlyResultsScrollReset(library);
    library.window.dispatch('popstate');
    checkScroll();
    const lastPage = Math.ceil(library.items.length / EXPECTED_PAGE_SIZE);
    assert.equal(library.location.searchParams.get('page'), String(lastPage));
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
    assert.equal(library.location.searchParams.get('utm_source'), 'history');
    assert.equal(library.location.hash, '#library');
    assert.equal(library.get('resource-page-status').textContent, `Page ${lastPage} of ${lastPage}`);
    assert.equal(library.replacedURLs.length, replacements + 1);
    assert.equal(library.pushedURLs.length, pushes);
});

test('Search, filters, sorting, and reset return to page one without moving outer containers', () => {
    const cases = [
        library => library.search('eele201'),
        library => library.button('note').dispatch('click'),
        library => library.change('resource-topic', 'Display'),
        library => {
            library.get('resource-topic-toggle').dispatch('click');
            library.get('resource-topic-menu').querySelector('[data-topic-value="Display"]').dispatch('click');
        },
        library => library.change('resource-sort', 'oldest')
    ];
    for (const update of cases) {
        const library = createLibrary('?page=2');
        const checkScroll = expectOnlyResultsScrollReset(library);
        update(library);
        checkScroll();
        assert.equal(library.location.searchParams.has('page'), false);
        assert.match(library.get('resource-page-status').textContent, /^Page 1 of /);
    }
    for (const reset of [
        library => library.get('resource-reset-inline').dispatch('click'),
        library => library.get('resource-search-clear').dispatch('click'),
        library => library.get('resource-search').dispatch('keydown', { key: 'Escape' })
    ]) {
        const library = createLibrary('?q=a&page=2');
        assert.match(library.get('resource-page-status').textContent, /^Page 2 of /);
        const checkScroll = expectOnlyResultsScrollReset(library);
        reset(library);
        checkScroll();
        assert.equal(library.location.searchParams.has('page'), false);
        assert.equal(library.location.searchParams.has('q'), false);
        assert.match(library.get('resource-page-status').textContent, /^Page 1 of /);
    }
});

test('Search considers resources outside the current page and preserves catalogue counts', () => {
    const library = createLibrary();
    const initialIDs = rowIDs(library);
    const target = library.items.find(item => !initialIDs.includes(item.id));
    assert.ok(target);
    const countsBefore = library.document.querySelectorAll('[data-resource-count]').map(counter => Number(counter.textContent));
    library.get('resource-page-next').dispatch('click');
    library.search(target.id);
    assert.ok(rowIDs(library).includes(target.id));
    assert.equal(library.location.searchParams.has('page'), false);
    assert.equal(library.get('resource-pagination').hidden, true);
    assert.deepEqual(library.document.querySelectorAll('[data-resource-count]').map(counter => Number(counter.textContent)), countsBefore);
    assert.equal(library.get('resource-total').textContent, `${library.items.length} resources`);
});

test('Combined filtering runs before pagination and page changes retain every filter', () => {
    const library = createLibrary('?type=reference&topic=Pagination%20fixture&q=paginationfixture&sort=oldest&page=2', items => {
        for (let number = 1; number <= 14; number++) items.push({
            id: `paginationfixture-${number}`, kind: 'reference', category: 'Pagination fixture',
            title: `Pagination fixture ${String(number).padStart(2, '0')}`,
            description: 'A fixture for checking filtered pagination.', date: `2026-10-${String(number).padStart(2, '0')}`
        });
    });
    assert.deepEqual(rowIDs(library), Array.from({ length: 14 - EXPECTED_PAGE_SIZE }, (_, index) => `paginationfixture-${EXPECTED_PAGE_SIZE + index + 1}`));
    assert.equal(library.get('resource-page-status').textContent, 'Page 2 of 2');
    assert.equal(library.get('resource-status').textContent, `Showing ${EXPECTED_PAGE_SIZE + 1}–14 of 14 resources`);
    assert.equal(library.get('resource-page-next').disabled, true);
    library.get('resource-page-prev').dispatch('click');
    assert.equal(rows(library).length, EXPECTED_PAGE_SIZE);
    assert.equal(library.location.searchParams.has('page'), false);
    assert.equal(library.location.searchParams.get('type'), 'reference');
    assert.equal(library.location.searchParams.get('topic'), 'Pagination fixture');
    assert.equal(library.location.searchParams.get('q'), 'paginationfixture');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
});

test('Large catalogues keep compact page controls with reachable ends and complete coverage', () => {
    const expectedPages = 240 / EXPECTED_PAGE_SIZE;
    const library = createLibrary('?page=10', items => {
        while (items.length < 240) {
            const number = items.length + 1;
            items.push({
                id: `large-catalogue-${number}`, kind: 'reference', category: 'Pagination fixture',
                title: `Large catalogue fixture ${String(number).padStart(3, '0')}`,
                description: 'A fixture for checking compact page controls.', date: '2026-11-01'
            });
        }
    });
    const controls = library.get('resource-page-numbers');
    const pageControls = controls.querySelectorAll('[data-resource-page]');
    const visiblePages = pageControls.map(button => Number(button.dataset.resourcePage));
    assert.ok(pageControls.length <= 7, 'Numeric page controls should stay compact for a large catalogue');
    for (const number of [1, 9, 10, 11, expectedPages]) assert.ok(visiblePages.includes(number));
    assert.equal(new Set(visiblePages).size, visiblePages.length);
    assert.ok(visiblePages.every(number => number >= 1 && number <= expectedPages));
    assert.ok(controls.children.some(child => child.textContent === '…'));
    assert.equal(controls.querySelectorAll('[aria-current="page"]').length, 1);
    assert.equal(controls.querySelector('[aria-current="page"]').dataset.resourcePage, '10');
    pageButton(library, expectedPages).dispatch('click');
    assert.equal(library.location.searchParams.get('page'), String(expectedPages));
    assert.equal(library.get('resource-page-status').textContent, `Page ${expectedPages} of ${expectedPages}`);
    assert.equal(rows(library).length, EXPECTED_PAGE_SIZE);
    assert.equal(library.get('resource-page-next').disabled, true);
    assert.equal(pageButton(library, expectedPages).getAttribute('aria-current'), 'page');
    pageButton(library, 1).dispatch('click');
    assert.equal(library.location.searchParams.has('page'), false);
    assert.equal(library.get('resource-page-status').textContent, `Page 1 of ${expectedPages}`);
    assert.equal(library.get('resource-page-prev').disabled, true);
    const visited = collectPages(library).map(row => row.match(/data-resource-id="([^"]+)"/)[1]);
    assert.equal(visited.length, 240);
    assert.equal(new Set(visited).size, 240);
    assert.deepEqual([...visited].sort(), [...library.items].map(item => item.id).sort());
});

test('Short viewports move filters into results while keeping search and outer scroll positions fixed', () => {
    const library = createLibrary('', undefined, { shortViewport: true });
    const results = library.get('resource-results-scroll');
    const controls = library.get('resource-controls');
    const toolbar = library.document.querySelector('.library-toolbar');
    assert.ok(toolbar.parentElement === results);
    assert.ok(results.children[0] === toolbar);
    assert.equal(controls.contains(library.get('library-search-form')), true);
    assert.equal(library.document.querySelectorAll('.library-toolbar').length, 1);
    let checkScroll = expectOnlyResultsScrollReset(library);
    library.get('resource-topic-toggle').dispatch('click');
    checkScroll();
    assert.equal(library.get('resource-topic-menu').hidden, false);
    checkScroll = expectOnlyResultsScrollReset(library);
    library.setShortViewport(false);
    checkScroll();
    assert.ok(toolbar.parentElement === controls);
    assert.equal(results.contains(toolbar), false);
    assert.equal(library.get('resource-topic-menu').hidden, true);
    checkScroll = expectOnlyResultsScrollReset(library);
    library.setShortViewport(true);
    checkScroll();
    assert.ok(toolbar.parentElement === results);
    assert.equal(library.document.querySelectorAll('.library-toolbar').length, 1);
});

test('The resource page has no footer and its controller works without footer elements', () => {
    const library = createLibrary('?page=2&sort=oldest');
    for (const selector of ['footer', '#resource-footer', '.library-footer', '.site-footer']) {
        assert.equal(library.document.querySelector(selector), null);
    }
    assert.doesNotMatch(controllerSource, /resource-footer|footerToggle/);
    library.document.dispatch('click', { target: library.get('resource-search') });
    library.document.dispatch('focusin', { target: library.get('resource-search') });
    assert.equal(library.location.searchParams.get('page'), '2');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
});

test('The topic menu floats outside scrolling panels and fits the viewport below its trigger', () => {
    const library = createLibrary('', undefined, { shortViewport: true, innerWidth: 640, innerHeight: 240 });
    const toggle = library.get('resource-topic-toggle');
    const menu = library.get('resource-topic-menu');
    const results = library.get('resource-results-scroll');
    assert.ok(menu.parentElement === library.document.querySelector('body'));
    assert.equal(results.contains(menu), false);
    toggle.rectBottom = 210; toggle.rectLeft = 24; toggle.rectWidth = 220; toggle.rectHeight = 44;
    toggle.dispatch('click');
    const top = Number.parseFloat(menu.style.getPropertyValue('top'));
    const maxHeight = Number.parseFloat(menu.style.getPropertyValue('max-height'));
    assert.equal(top, toggle.rectBottom + 6);
    assert.ok(maxHeight >= 0 && maxHeight <= library.window.innerHeight - top);
    assert.ok(maxHeight < 44, 'A short viewport must not force a minimum height beyond its remaining space');
    assert.equal(menu.style.getPropertyValue('left'), '24px');
    assert.equal(menu.style.getPropertyValue('width'), '220px');
    library.document.dispatch('click', { target: menu });
    assert.equal(menu.hidden, false, 'Clicking blank space inside the floating menu must keep it open');
    toggle.rectBottom = 180;
    results.scrollTop = 100;
    results.dispatch('scroll');
    assert.equal(menu.style.getPropertyValue('top'), '186px');
    assert.equal(results.scrollTop, 100);
    assert.equal(menu.hidden, false);
    library.window.innerHeight = 800;
    library.window.dispatch('resize');
    assert.equal(menu.style.getPropertyValue('max-height'), '288px');
});

test('Mobile Filters keeps every category, topic, and sorting control available until results are requested', () => {
    const library = createLibrary('', undefined, { mobileViewport: true, innerWidth: 390, innerHeight: 844 });
    const dialog = library.get('resource-filters-dialog');
    const panel = library.get('resource-mobile-filters-body');
    const navigation = library.document.querySelector('.library-sidebar-navigation');
    const toolbar = library.document.querySelector('.library-toolbar');
    assert.equal(dialog.open, false);
    assert.ok(panel.contains(navigation));
    assert.ok(panel.contains(toolbar));
    assert.equal(dialog.contains(library.get('library-search-form')), false);
    library.get('resource-filters-open').dispatch('click');
    assert.equal(dialog.open, true);
    assert.equal(dialog.modalCalls, 1);
    library.button('course').dispatch('click');
    assert.equal(dialog.open, true);
    assert.equal(rows(library).length, 4);
    library.get('resource-topic-toggle').dispatch('click');
    assert.ok(dialog.contains(library.get('resource-topic-menu')), 'The open menu must be within the active modal layer');
    library.get('resource-topic-menu').querySelector('[data-topic-value="Physics"]').dispatch('click');
    library.change('resource-sort', 'oldest');
    assert.equal(dialog.open, true);
    assert.equal(rows(library).length, 2);
    assert.equal(String(library.get('resource-filters-count').textContent), '3');
    assert.match(library.get('resource-filters-apply').textContent, /2/);
    library.get('resource-filters-apply').dispatch('click');
    assert.equal(dialog.open, false);
    assert.equal(library.document.activeElement?.id, 'resource-filters-open');
    assert.equal(library.get('resource-filters-open').focusOptions.preventScroll, true);
    assert.equal(library.location.searchParams.get('type'), 'course');
    assert.equal(library.location.searchParams.get('topic'), 'Physics');
    assert.equal(library.location.searchParams.get('sort'), 'oldest');
    assert.equal(library.get('resource-topic-value').textContent, 'Physics');
    assert.equal(library.get('resource-topic-menu').hidden, true);
});

test('Closing or cancelling mobile Filters restores focus and preserves the current results', () => {
    const library = createLibrary('?type=component&q=oled', undefined, { mobileViewport: true, innerWidth: 390, innerHeight: 844 });
    const dialog = library.get('resource-filters-dialog');
    const open = library.get('resource-filters-open');
    const url = library.location.href;
    const visibleIDs = rowIDs(library);
    open.dispatch('click');
    library.get('resource-filters-close').dispatch('click');
    assert.equal(dialog.open, false);
    assert.equal(library.document.activeElement?.id, open.id);
    assert.equal(open.focusOptions.preventScroll, true);
    open.dispatch('click');
    library.get('resource-topic-toggle').dispatch('click');
    assert.equal(dialog.dispatch('cancel').defaultPrevented, true);
    assert.equal(dialog.open, true);
    assert.equal(library.get('resource-topic-menu').hidden, true);
    dialog.dispatch('cancel');
    assert.equal(dialog.open, false);
    assert.equal(library.document.activeElement?.id, open.id);
    assert.equal(library.location.href, url);
    assert.deepEqual(rowIDs(library), visibleIDs);
    assert.equal(library.get('resource-search').value, 'oled');
    assert.equal(library.button('component').getAttribute('aria-pressed'), 'true');
    open.dispatch('click');
    library.get('resource-filters-reset').dispatch('click');
    assert.equal(dialog.open, true);
    assert.equal(library.document.activeElement?.id, 'resource-filters-reset');
    assert.equal(library.get('resource-filters-reset').focusOptions.preventScroll, true);
    assert.equal(library.get('resource-search').value, '');
    assert.equal(library.button('all').getAttribute('aria-pressed'), 'true');
    assert.equal(library.get('resource-filters-count').hidden, true);
    library.get('resource-filters-apply').dispatch('click');
    assert.equal(dialog.open, false);
    assert.equal(library.document.activeElement?.id, open.id);
});

test('Viewport changes relocate existing filters without duplication or loss of selected state', () => {
    const library = createLibrary('?type=component&topic=Display&sort=oldest', undefined, { mobileViewport: false, shortViewport: false });
    const navigation = library.document.querySelector('.library-sidebar-navigation');
    const navigationHome = navigation.parentElement;
    const toolbar = library.document.querySelector('.library-toolbar');
    const controls = library.get('resource-controls');
    const panel = library.get('resource-mobile-filters-body');
    const results = library.get('resource-results-scroll');
    const dialog = library.get('resource-filters-dialog');
    const url = library.location.href;
    const visibleIDs = rowIDs(library);
    let checkScroll = expectOnlyResultsScrollReset(library);
    library.setMobileViewport(true);
    checkScroll();
    assert.ok(panel.contains(navigation));
    assert.ok(panel.contains(toolbar));
    library.get('resource-filters-open').dispatch('click');
    library.get('resource-topic-toggle').dispatch('click');
    checkScroll = expectOnlyResultsScrollReset(library);
    library.setMobileViewport(false);
    checkScroll();
    assert.equal(dialog.open, false);
    assert.ok(navigation.parentElement === navigationHome);
    assert.ok(toolbar.parentElement === controls);
    assert.equal(library.get('resource-topic-menu').hidden, true);
    library.setShortViewport(true);
    assert.ok(toolbar.parentElement === results);
    library.setMobileViewport(true);
    assert.ok(panel.contains(toolbar));
    assert.ok(panel.contains(navigation));
    library.setMobileViewport(false);
    assert.ok(toolbar.parentElement === results);
    library.setShortViewport(false);
    assert.ok(toolbar.parentElement === controls);
    assert.equal(library.document.querySelectorAll('.library-sidebar-navigation').length, 1);
    assert.equal(library.document.querySelectorAll('.library-toolbar').length, 1);
    assert.equal(library.location.href, url);
    assert.deepEqual(rowIDs(library), visibleIDs);
    assert.equal(library.get('resource-topic').value, 'Display');
    assert.equal(library.get('resource-sort').value, 'oldest');
    assert.equal(library.button('component').getAttribute('aria-pressed'), 'true');
});

console.log(`\n${passed} resources checks passed.`);

