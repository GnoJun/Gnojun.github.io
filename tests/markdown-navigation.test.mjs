// Article navigation behavior without external packages or a browser layout engine.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const navigationSource = await readFile(new URL('../js/markdown-navigation.js', import.meta.url), 'utf8');

class Event {
    constructor(type, options = {}) { Object.assign(this, { type, bubbles: false }, options); }
    preventDefault() { this.defaultPrevented = true; }
}

class Element {
    constructor(tag, document, nodeType = 1) {
        this.tagName = tag.toUpperCase(); this.nodeType = nodeType; this.ownerDocument = document;
        this.childNodes = []; this.attrs = new Map(); this.listeners = new Map(); this.classes = new Set();
        this._text = ''; this.hidden = false; this.open = false; this.parentNode = null;
        this.scrollTop = 0; this.scrollLeft = 0; this.clientWidth = 240; this.offsetHeight = 58;
        this.rect = { top: 0, bottom: 40, left: 0, right: 240, width: 240, height: 40 };
        this.style = { setProperty(name, value) { this[name] = value; } };
        this.dataset = new Proxy({}, { set: (data, key, value) => {
            data[key] = String(value); this.attrs.set('data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), String(value)); return true;
        } });
        this.classList = {
            add: (...names) => names.forEach(name => this.classes.add(name)),
            remove: (...names) => names.forEach(name => this.classes.delete(name)),
            contains: name => this.classes.has(name),
            toggle: (name, force) => { const enabled = force ?? !this.classes.has(name); enabled ? this.classes.add(name) : this.classes.delete(name); return enabled; }
        };
    }
    get children() { return this.childNodes.filter(node => node.nodeType === 1); }
    get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
    get firstChild() { return this.childNodes[0] || null; }
    get nextSibling() { return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] || null; }
    get className() { return [...this.classes].join(' '); }
    set className(value) { this.classes = new Set(String(value).split(/\s+/).filter(Boolean)); }
    get id() { return this.attrs.get('id') || ''; }
    set id(value) { this.attrs.set('id', String(value)); }
    get href() { return this.attrs.get('href') || ''; }
    set href(value) { this.attrs.set('href', String(value)); }
    get hash() { return new URL(this.href, 'https://site.test/lesson.html').hash; }
    get textContent() { return this._text + this.childNodes.map(node => node.textContent).join(''); }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    setAttribute(name, value) {
        this.attrs.set(name, String(value));
        if (name === 'class') this.className = value;
        if (name === 'hidden') this.hidden = true;
        if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    }
    getAttribute(name) { return name === 'class' ? this.className || null : this.attrs.get(name) ?? null; }
    hasAttribute(name) { return name === 'class' ? this.classes.size > 0 : this.attrs.has(name); }
    removeAttribute(name) {
        this.attrs.delete(name);
        if (name === 'hidden') this.hidden = false;
        if (name.startsWith('data-')) delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
    }
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
    appendChild(node) { return this.insertBefore(node, null); }
    insertBefore(node, next) {
        if (node.nodeType === 11) { [...node.childNodes].forEach(child => this.insertBefore(child, next)); return node; }
        if (node === next) return node;
        node.remove();
        const index = next ? this.childNodes.indexOf(next) : this.childNodes.length;
        assert.ok(index >= 0, 'insertBefore reference belongs to its parent');
        this.childNodes.splice(index, 0, node); node.parentNode = this; return node;
    }
    remove() {
        if (this.parentNode) this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1);
        this.parentNode = null;
    }
    replaceChildren(...nodes) { [...this.childNodes].forEach(node => node.remove()); this._text = ''; this.append(...nodes); }
    contains(target) { return this === target || this.childNodes.some(child => child.contains(target)); }
    matches(selector) {
        if (this.nodeType !== 1) return false;
        return selector.split(',').some(part => {
            part = part.trim(); let matches = true;
            part = part.replace(/\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g, (_, name, quoted, single, bare) => {
                const expected = quoted ?? single ?? bare;
                matches &&= expected === undefined ? this.hasAttribute(name) : this.getAttribute(name) === expected; return '';
            });
            part = part.replace(/#([\w-]+)/g, (_, id) => { matches &&= this.id === id; return ''; });
            part = part.replace(/\.([\w-]+)/g, (_, name) => { matches &&= this.classes.has(name); return ''; });
            return matches && (!part || part === '*' || this.tagName.toLowerCase() === part);
        });
    }
    closest(selector) { for (let node = this; node; node = node.parentNode) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) { return this.childNodes.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    cloneNode(deep = false) {
        const copy = new Element(this.tagName, this.ownerDocument, this.nodeType);
        for (const [key, value] of this.attrs) copy.setAttribute(key, value);
        copy.className = this.className; copy._text = this._text; copy.hidden = this.hidden; copy.open = this.open;
        if (deep) this.childNodes.forEach(node => copy.appendChild(node.cloneNode(true)));
        return copy;
    }
    addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(callback); }
    dispatchEvent(event) {
        event.target ||= this;
        (this.listeners.get(event.type) || []).forEach(callback => callback(event));
        if (event.bubbles && this.parentNode) this.parentNode.dispatchEvent(event);
    }
    focus(options) { this.ownerDocument.activeElement = this; this.focusOptions = options; }
    getBoundingClientRect() {
        const scroll = this.ownerDocument?.window?.scrollY || 0;
        return { ...this.rect, top: this.rect.top - scroll, bottom: this.rect.bottom - scroll };
    }
    scrollTo(options) { this.lastScroll = options; if (options.top !== undefined) this.scrollTop = options.top; if (options.left !== undefined) this.scrollLeft = options.left; }
}

// Parse the repository's static shells into the fixture instead of assuming that
// the article is its container's only child. Scripts are never evaluated here.
function parseShell(html, document) {
    const stack = [document];
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const tags = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;
    for (const match of html.matchAll(tags)) {
        if (!match[1]) continue;
        const tag = match[1].toLowerCase();
        if (match[0].startsWith('</')) {
            const index = stack.findLastIndex(node => node.tagName?.toLowerCase() === tag);
            if (index > 0) stack.length = index;
            continue;
        }
        const node = document.createElement(tag);
        const attributes = match[0].slice(match[0].indexOf(match[1]) + match[1].length).replace(/\/?\s*>$/, '');
        for (const attribute of attributes.matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s'"=<>`]+)))?/g)) {
            node.setAttribute(attribute[1], attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
        }
        stack.at(-1).appendChild(node);
        if (!voidTags.has(tag) && !match[0].endsWith('/>')) stack.push(node);
    }
    document.documentElement = document.querySelector('html');
    document.body = document.querySelector('body');
}

function harness({ desktop = true, content = true, reference = true, legacyMedia = false, shellSource, siblings = false, implementation = navigationSource } = {}) {
    const document = new Element('document', null, 9); document.ownerDocument = document;
    document.createElement = tag => new Element(tag, document);
    document.getElementById = id => document.querySelectorAll('[id]').find(node => node.id === id) || null;
    document.createComment = text => { const node = new Element('comment', document, 8); node._text = text; return node; };
    const make = (tag, attributes = {}, text = '') => {
        const node = document.createElement(tag); Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value)); node.textContent = text; return node;
    };
    let header, main, navigation, toc, progress, bar, toggle, section, originalContainer, article;
    if (shellSource) {
        parseShell(shellSource, document);
        header = document.querySelector('.site-header'); main = document.querySelector('main');
        navigation = document.querySelector('[data-markdown-navigation]');
        article = document.querySelector('.markdown-document[data-markdown-src]');
        assert.ok(article && navigation, 'The real article shell contains both article and navigation');
        toc = navigation.querySelector('[data-markdown-toc-list]'); progress = navigation.querySelector('.markdown-reading-progress');
        bar = navigation.querySelector('.markdown-reading-progress-bar'); toggle = navigation.querySelector('[data-markdown-navigation-toggle]');
        section = article.closest('.article-section'); originalContainer = article.parentElement;
        article.replaceChildren();
    } else {
        document.documentElement = document.createElement('html'); document.body = document.createElement('body');
        document.appendChild(document.documentElement); document.documentElement.appendChild(document.body);
        header = make('header', { class: 'site-header' });
        main = make('main'); document.body.append(header, main);
        navigation = make('nav', { class: 'project-toc markdown-toc', 'data-markdown-navigation': '' });
        const navigationLayout = make('div', { class: 'container markdown-navigation-layout' });
        const navigationContent = make('div', { 'data-markdown-navigation-content': '' });
        toc = make('ul', { class: 'project-toc-list', 'data-markdown-toc-list': '' });
        progress = make('div', { class: 'markdown-reading-progress', role: 'progressbar', 'aria-valuenow': '0' });
        bar = make('span', { class: 'markdown-reading-progress-bar' }); progress.appendChild(bar);
        toggle = make('button', { 'data-markdown-navigation-toggle': '' }); toggle.appendChild(make('span', { class: 'markdown-navigation-toggle-label' }));
        navigationContent.append(toc, progress); navigationLayout.append(navigationContent, toggle); navigation.appendChild(navigationLayout);
        section = make('section', { class: 'article-section' });
        originalContainer = make('div', { class: 'container' });
        article = make('article', { class: 'markdown-document', 'data-markdown-src': '../content/resources/lesson.md' });
        originalContainer.appendChild(article); section.appendChild(originalContainer); main.append(navigation, section);
    }
    header.offsetHeight = 76;
    article.rect = { top: 200, bottom: 2400, left: 0, right: 800, width: 800, height: 2200 };
    let before, after;
    if (siblings) {
        before = make('div', { class: 'markdown-demo-tools' }, 'Download Markdown');
        after = make('div', { class: 'article-actions' }, 'Read another article');
        originalContainer.insertBefore(before, article); originalContainer.appendChild(after);
    }
    const originalSiblings = [...originalContainer.children].filter(node => node !== article);
    const originalOrder = [...originalContainer.children];
    const headings = [];
    function heading(tag, text, top, parent = article) {
        const node = make(tag, {}, text); node.rect = { top, bottom: top + 40, left: 0, right: 700, width: 700, height: 40 };
        parent.appendChild(node); headings.push(node); return node;
    }
    function sourceReference(parent = article, id = 'reference-ohms-law') {
        const source = make('section', { class: 'markdown-reference', id, 'data-markdown-reference': '', 'data-reference-title': "Ohm's law" });
        const body = make('div', { class: 'markdown-reference-body', id: id + '-body' });
        const math = make('div', { 'data-math': 'V = IR', 'data-math-display': 'true', id: id + '-equation' }, 'V = IR');
        const symbols = make('p', {}, 'V: voltage (V); I: current (A); R: resistance (ohm).');
        body.append(math, symbols); source.appendChild(body); parent.appendChild(source); return source;
    }
    if (content) {
        const overview = heading('h2', 'Overview', 200); overview.id = 'overview';
        heading('h3', 'Choose a model', 500);
        heading('h2', 'Worked example', 1200);
        const details = make('details'); article.appendChild(details); heading('h2', 'Hidden details heading', 1400, details);
        const quiz = make('form', { class: 'markdown-quiz' }); article.appendChild(quiz); heading('h3', 'Quiz answer', 1450, quiz);
        const hidden = make('div', { hidden: '' }); article.appendChild(hidden); heading('h2', 'Hidden answer', 1500, hidden);
        if (reference) {
            sourceReference();
            sourceReference(quiz, 'reference-secret-answer');
            sourceReference(details, 'reference-detail-answer');
            sourceReference(hidden, 'reference-hidden-answer');
        }
    }
    const frames = []; const mediaListeners = [];
    const media = { matches: desktop, addEventListener(_type, callback) { mediaListeners.push(callback); }, addListener(callback) { mediaListeners.push(callback); } };
    if (legacyMedia) delete media.addEventListener;
    const window = new Element('window', document, 0);
    Object.assign(window, { scrollY: 0, innerHeight: 800, matchMedia: query => query.includes('min-width') ? media : { matches: true }, requestAnimationFrame: callback => frames.push(callback) });
    document.window = window;
    const referenceEvents = [];
    document.addEventListener('markdown:reference-ready', event => referenceEvents.push(event.detail.container));
    const context = vm.createContext({ document, window, URL, CustomEvent: Event });
    vm.runInContext(implementation, context, { filename: 'markdown-navigation.js' });
    function flush() { let count = 0; while (frames.length) { assert.ok(count++ < 20); frames.shift()(); } }
    flush();
    const layout = article.parentElement;
    const sidebar = layout.querySelector('.markdown-article-sidebar');
    const sidebarPanel = sidebar.querySelector('.markdown-sidebar-panel');
    const sidebarToggle = sidebar.querySelector('.markdown-sidebar-toggle');
    return {
        document, window, main, navigation, section, layout, originalContainer, originalSiblings, originalOrder, before, after, article, headings, toc, progress, bar, toggle, sidebarPanel, sidebarToggle, make, heading, sourceReference, referenceEvents, flush,
        breakpoint(wide) { media.matches = wide; mediaListeners.forEach(callback => callback({ matches: wide })); flush(); },
        rendered() { article.dispatchEvent(new Event('markdown:rendered', { bubbles: true })); flush(); },
        toggleReferences(open) {
            const references = layout.querySelector('.markdown-quick-reference');
            references.open = open;
            references.dispatchEvent(new Event('toggle'));
            flush();
        },
        scroll(top) { window.scrollY = top; window.dispatchEvent(new Event('scroll')); flush(); },
        keydown(target, key) { target.dispatchEvent(new Event('keydown', { key, bubbles: true })); flush(); },
        click(node) { node.dispatchEvent(new Event('click', { bubbles: true })); flush(); }
    };
}

const results = [];
function check(name, callback) { callback(); results.push(name); }

check('Desktop reuses one existing navigation and lists visible H2/H3 only', () => {
    const h = harness(); const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    assert.equal(h.navigation.parentElement, h.sidebarPanel);
    assert.equal(h.sidebarPanel.parentElement, sidebar);
    assert.equal(h.sidebarPanel.hidden, true);
    assert.equal(h.sidebarToggle.textContent, 'Navigation Bar');
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'false');
    assert.equal(h.sidebarToggle.getAttribute('aria-controls'), h.sidebarPanel.id);
    assert.ok(h.layout.classList.contains('is-sidebar-collapsed'));
    assert.ok(sidebar.classList.contains('is-collapsed'));
    assert.equal(h.document.querySelectorAll('[data-markdown-navigation]').length, 1);
    assert.ok(h.layout.classList.contains('markdown-article-layout'));
    const links = h.toc.querySelectorAll('a');
    assert.deepEqual(links.map(link => link.textContent), ['Overview', 'Choose a model', 'Worked example']);
    assert.deepEqual(h.toc.children.map(item => item.dataset.tocLevel), ['2', '3', '2']);
    assert.equal(links[0].getAttribute('aria-current'), 'location');
    assert.equal(h.document.documentElement.style['--markdown-toc-offset'], '0px');
});

check('Crossing the breakpoint restores navigation order and narrow-screen collapse controls', () => {
    const h = harness(); const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    h.breakpoint(false);
    assert.equal(h.navigation.parentElement, h.main);
    assert.equal(h.navigation.nextSibling, h.section);
    assert.equal(sidebar.querySelector('[data-markdown-navigation]'), null);
    assert.equal(sidebar.querySelector('.markdown-quick-reference').open, false);
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'false');
    assert.ok(h.navigation.classList.contains('is-collapsed'));
    h.click(h.toggle);
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(h.document.documentElement.style['--markdown-toc-offset'], 'var(--toc-height)');
    h.click(h.toggle);
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(h.document.documentElement.style['--markdown-toc-offset'], '0px');
    h.breakpoint(true);
    assert.equal(h.navigation.parentElement, h.sidebarPanel);
    assert.equal(sidebar.querySelector('.markdown-quick-reference').open, false);
    assert.equal(h.document.querySelectorAll('.markdown-article-sidebar').length, 1);
});

check('The desktop Navigation Bar launcher opens and closes the whole panel while formulas stay independent', () => {
    const h = harness();
    assert.equal(h.sidebarPanel.hidden, true);
    h.click(h.sidebarToggle);
    assert.equal(h.sidebarPanel.hidden, false);
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'true');
    assert.equal(h.layout.classList.contains('is-sidebar-collapsed'), false);
    assert.equal(h.navigation.hidden, false);
    h.toggleReferences(true);
    assert.equal(h.navigation.hidden, true);
    assert.equal(h.sidebarToggle.hidden, false);
    h.click(h.sidebarToggle);
    assert.equal(h.sidebarPanel.hidden, true);
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'false');
    h.click(h.sidebarToggle);
    assert.equal(h.sidebarPanel.hidden, false);
    assert.equal(h.layout.querySelector('.markdown-quick-reference').open, true);
    assert.equal(h.navigation.hidden, true);
    h.toggleReferences(false); assert.equal(h.navigation.hidden, false);
});

check('Desktop panel state survives rerender and remains independent of the mobile section toggle', () => {
    const h = harness(); h.click(h.sidebarToggle); h.rendered();
    assert.equal(h.sidebarPanel.hidden, false);
    h.breakpoint(false);
    assert.equal(h.sidebarPanel.hidden, false, 'Mobile references remain visible below the article');
    assert.equal(h.sidebarToggle.hidden, true);
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'false');
    h.click(h.toggle); assert.equal(h.toggle.getAttribute('aria-expanded'), 'true');
    h.breakpoint(true);
    assert.equal(h.sidebarPanel.hidden, false);
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'true');
    h.click(h.sidebarToggle); h.rendered();
    assert.equal(h.sidebarPanel.hidden, true);
    h.breakpoint(false);
    assert.equal(h.sidebarPanel.hidden, false);
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'true', 'The mobile section choice is preserved');
    h.breakpoint(true);
    assert.equal(h.sidebarPanel.hidden, true);
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'false');
});

check('Escape closes an open desktop Navigation Bar and returns keyboard focus to its launcher', () => {
    const h = harness(); h.click(h.sidebarToggle);
    const link = h.toc.querySelector('a'); link.focus();
    h.keydown(link, 'Escape');
    assert.equal(h.sidebarPanel.hidden, true);
    assert.equal(h.sidebarToggle.getAttribute('aria-expanded'), 'false');
    assert.equal(h.document.activeElement, h.sidebarToggle);
});

check('Formula references start closed and preserve the reader choice across layouts and renders', () => {
    for (const desktop of [true, false]) {
        const h = harness({ desktop });
        const references = h.layout.querySelector('.markdown-quick-reference');
        assert.equal(references.open, false, 'References start collapsed on either screen size');
        h.rendered(); assert.equal(references.open, false);
        // Reflect the native details toggle that the reader activates.
        references.open = true;
        h.breakpoint(!desktop); assert.equal(references.open, true);
        h.rendered(); assert.equal(references.open, true);
        h.breakpoint(desktop); assert.equal(references.open, true);
        references.open = false;
        h.rendered(); h.breakpoint(!desktop);
        assert.equal(references.open, false, 'A reader-collapsed reference stays collapsed');
    }
});

check('Opening desktop formula references hides the whole section navigation and closing restores it', () => {
    const h = harness(); const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    h.click(h.sidebarToggle);
    assert.equal(h.sidebarPanel.hidden, false);
    assert.equal(h.navigation.hidden, false);
    h.toggleReferences(true);
    assert.equal(h.navigation.hidden, true, 'The complete section navigation is hidden while references are open');
    assert.equal(sidebar.hidden, false);
    assert.equal(h.layout.querySelector('.markdown-quick-reference').open, true);
    assert.equal(h.toc.querySelectorAll('a').length, 3, 'Section links remain available when navigation is restored');
    assert.equal(h.sidebarToggle.hidden, false, 'The outer launcher stays available while formulas are open');
    h.toggleReferences(false);
    assert.equal(h.navigation.hidden, false);
    assert.equal(h.toc.querySelectorAll('a').filter(link => link.getAttribute('aria-current') === 'location').length, 1);
});

check('Reference expansion leaves mobile navigation available and preserves its collapsed state across breakpoints', () => {
    const h = harness({ desktop: false });
    assert.ok(h.navigation.classList.contains('is-collapsed'));
    h.toggleReferences(true);
    assert.equal(h.navigation.hidden, false, 'References below the article do not hide mobile navigation');
    assert.equal(h.navigation.parentElement, h.main);
    assert.ok(h.navigation.classList.contains('is-collapsed'));
    h.breakpoint(true);
    assert.equal(h.navigation.hidden, true);
    assert.equal(h.sidebarPanel.hidden, true, 'Desktop launcher starts closed independently of mobile references');
    h.breakpoint(false);
    assert.equal(h.navigation.hidden, false);
    assert.ok(h.navigation.classList.contains('is-collapsed'));
    assert.equal(h.toggle.getAttribute('aria-expanded'), 'false');
    h.toggleReferences(false);
    assert.equal(h.navigation.hidden, false);
    assert.ok(h.navigation.classList.contains('is-collapsed'));
});

check('Closing references keeps navigation hidden when an article has no section headings', () => {
    const h = harness({ content: false });
    h.sourceReference(); h.rendered();
    assert.equal(h.navigation.hidden, true);
    h.toggleReferences(true); assert.equal(h.navigation.hidden, true);
    h.toggleReferences(false); assert.equal(h.navigation.hidden, true);
    assert.equal(h.layout.querySelector('.markdown-article-sidebar').hidden, false);
});

check('Scrolling updates the active subsection and accessible reading progress', () => {
    const h = harness(); h.scroll(600);
    const active = h.toc.querySelectorAll('a').filter(link => link.getAttribute('aria-current') === 'location');
    assert.equal(active.length, 1); assert.equal(active[0].textContent, 'Choose a model');
    const progress = Number(h.progress.getAttribute('aria-valuenow'));
    assert.ok(progress > 0 && progress < 100);
    assert.match(h.bar.style.transform, /^scaleX\(/);
    h.scroll(2400); assert.equal(h.progress.getAttribute('aria-valuenow'), '100');
});

check('Reference cards copy selected formulas and symbols without hidden quiz answers or duplicate IDs', () => {
    const h = harness(); const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    const cards = sidebar.querySelectorAll('.markdown-reference-card');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].querySelector('.markdown-reference-card-title').textContent, "Ohm's law");
    assert.match(cards[0].textContent, /Resistance|resistance/);
    assert.equal(cards[0].querySelectorAll('[id]').length, 0);
    assert.equal(cards[0].querySelector('.markdown-reference-source').hash, '#reference-ohms-law');
    const copy = cards[0].querySelector('[data-reference-copy]');
    assert.equal(copy.dataset.referenceCopy, 'V = IR');
    assert.equal(copy.getAttribute('aria-label'), 'Copy formula');
    assert.equal(h.article.querySelector('#reference-ohms-law-equation').id, 'reference-ohms-law-equation');
    assert.ok(h.referenceEvents.includes(sidebar.querySelector('.markdown-reference-list')));
});

check('Repeated Markdown renders replace cards and links without duplicating controls or anchors', () => {
    const h = harness(); const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    h.rendered(); h.rendered();
    assert.equal(h.document.querySelectorAll('.markdown-article-sidebar').length, 1);
    assert.equal(h.document.querySelectorAll('[data-markdown-navigation]').length, 1);
    assert.equal(h.toc.querySelectorAll('a').length, 3);
    assert.equal(sidebar.querySelectorAll('.markdown-reference-card').length, 1);
    assert.equal(sidebar.querySelectorAll('[data-reference-copy]').length, 1);
    const ids = h.document.querySelectorAll('[id]').map(element => element.id);
    assert.equal(ids.length, new Set(ids).size);
});

check('Reference card clones retain teaching content while removing active controls and hidden material', () => {
    const h = harness(); const source = h.article.querySelector('#reference-ohms-law');
    const body = source.querySelector('.markdown-reference-body');
    body.append(
        h.make('form', {}, 'A quiz answer that must not be copied'),
        h.make('iframe', { src: 'https://example.test/document.pdf' }),
        h.make('details', {}, 'An expandable hidden explanation'),
        h.make('span', { class: 'footnote-ref' }, 'Footnote duplicate'),
        h.make('div', { hidden: '' }, 'Hidden text'),
        h.make('p', { id: 'symbol-definition', 'aria-describedby': 'symbol-note' }, 'A preserved symbol definition')
    );
    h.rendered();
    const card = h.layout.querySelector('.markdown-reference-card');
    assert.match(card.textContent, /A preserved symbol definition/);
    assert.doesNotMatch(card.textContent, /quiz answer|hidden explanation|Footnote duplicate|Hidden text/);
    assert.equal(card.querySelectorAll('form, iframe, details, [hidden], [id], [aria-describedby]').length, 0);
    assert.equal(body.querySelector('#symbol-definition').getAttribute('aria-describedby'), 'symbol-note');
    assert.equal(body.querySelectorAll('form, iframe').length, 2, 'Source content remains intact');
});

check('Deferred Markdown loading activates the same navigation and reference tools after rendering', () => {
    const h = harness({ content: false });
    assert.equal(h.navigation.hidden, true);
    h.heading('h2', 'Loaded section', 300); h.sourceReference(); h.rendered();
    assert.equal(h.navigation.hidden, false);
    assert.deepEqual(h.toc.querySelectorAll('a').map(link => link.textContent), ['Loaded section']);
    assert.equal(h.layout.querySelector('.markdown-article-sidebar').hidden, false);
    assert.equal(h.layout.querySelectorAll('.markdown-reference-card').length, 1);
});

check('Pages without references hide their empty tools below the article on narrow screens', () => {
    const h = harness({ desktop: false, reference: false, legacyMedia: true });
    const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    assert.equal(h.navigation.parentElement, h.main); assert.equal(sidebar.hidden, true);
    h.breakpoint(true); assert.equal(sidebar.hidden, false);
    assert.equal(h.navigation.parentElement, h.sidebarPanel);
    const empty = harness({ content: false });
    assert.equal(empty.navigation.hidden, true);
    assert.equal(empty.layout.querySelector('.markdown-article-sidebar').hidden, true);
    assert.equal(empty.sidebarToggle.hidden, true);
});

function assertIsolatedArticleLayout(h) {
    const sidebar = h.layout.querySelector('.markdown-article-sidebar');
    assert.notEqual(h.layout, h.originalContainer, 'The article tools need a dedicated wrapper inside the original container');
    assert.ok(h.layout.classList.contains('markdown-article-layout'));
    assert.ok(!h.originalContainer.classList.contains('markdown-article-layout'), 'Downloads and other original siblings must not become article grid columns');
    assert.deepEqual(h.layout.children, [h.article, sidebar], 'Only the article and sidebar are direct grid children');
    const expectedOrder = h.originalOrder.map(node => node === h.article ? h.layout : node);
    assert.deepEqual(h.originalContainer.children, expectedOrder, 'The wrapper occupies the original article position');
    h.originalSiblings.forEach(sibling => assert.equal(sibling.parentElement, h.originalContainer));
}

check('Download tools and following article actions remain outside the two-column article layout', () => {
    const h = harness({ siblings: true });
    assertIsolatedArticleLayout(h);
    assert.equal(h.before.nextSibling, h.layout); assert.equal(h.layout.nextSibling, h.after);
    h.breakpoint(false); h.rendered(); h.breakpoint(true); h.rendered();
    assertIsolatedArticleLayout(h);
    assert.equal(h.document.querySelectorAll('.markdown-article-layout').length, 1);
    h.article.replaceChildren(); h.rendered();
    assertIsolatedArticleLayout(h);
    assert.equal(h.layout.classList.contains('has-article-tools'), false);
    assert.equal(h.layout.querySelector('.markdown-article-sidebar').hidden, true);
});

const shellCases = [];
for (const directory of ['notes', 'resources', 'components', 'projects']) {
    for (const filename of await readdir(new URL('../' + directory + '/', import.meta.url))) {
        if (!filename.endsWith('.html')) continue;
        const path = directory + '/' + filename;
        const html = await readFile(new URL('../' + path, import.meta.url), 'utf8');
        if (/\bdata-markdown-src\s*=/.test(html)) shellCases.push({ path, html });
    }
}
assert.ok(shellCases.some(shell => shell.path === 'notes/eele201.html'));
assert.ok(shellCases.some(shell => shell.path === 'notes/physics-i.html'));
assert.ok(shellCases.some(shell => shell.path === 'notes/circuits-ii.html'));
assert.ok(shellCases.some(shell => shell.path === 'resources/markdown-template.html'));
for (const { path, html } of shellCases) {
    check('Real article shell preserves its tools and content layout: ' + path, () => {
        const h = harness({ shellSource: html });
        assertIsolatedArticleLayout(h);
        assert.equal(h.navigation.parentElement, h.sidebarPanel);
        assert.equal(h.sidebarPanel.hidden, true);
        assert.equal(h.toc.querySelectorAll('a').length, 3);
        assert.equal(h.layout.querySelectorAll('.markdown-reference-card').length, 1);
        h.rendered(); h.breakpoint(false); h.breakpoint(true);
        assertIsolatedArticleLayout(h);
        assert.equal(h.document.querySelectorAll('.markdown-article-layout').length, 1);
        assert.equal(h.document.querySelectorAll('[data-markdown-navigation]').length, 1);
        assert.equal(h.document.querySelectorAll('.markdown-sidebar-panel').length, 1);
        assert.equal(h.document.querySelectorAll('.markdown-sidebar-toggle').length, 1);
    });
}

export { results, harness, assertIsolatedArticleLayout, navigationSource };
console.log(`Markdown navigation: ${results.length} integration checks passed.`);
