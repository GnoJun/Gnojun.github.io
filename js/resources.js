/* One controller for notes, hardware, and references. */
(() => {
    const list = document.querySelector('#resource-list');
    if (!list || typeof resourceLibrary === 'undefined') return;
    const search = document.querySelector('#resource-search');
    const topic = document.querySelector('#resource-topic');
    const topicPicker = document.querySelector('#resource-topic-picker');
    const topicToggle = document.querySelector('#resource-topic-toggle');
    const topicValue = document.querySelector('#resource-topic-value');
    const topicMenu = document.querySelector('#resource-topic-menu');
    const sort = document.querySelector('#resource-sort');
    const clear = document.querySelector('#resource-search-clear');
    const resetInline = document.querySelector('#resource-reset-inline');
    const status = document.querySelector('#resource-status');
    const empty = document.querySelector('#resources-empty-state');
    const heading = document.querySelector('#resource-results-title');
    const total = document.querySelector('#resource-total');
    const pagination = document.querySelector('#resource-pagination');
    const previousPage = document.querySelector('#resource-page-prev');
    const nextPage = document.querySelector('#resource-page-next');
    const pageNumbers = document.querySelector('#resource-page-numbers');
    const pageStatus = document.querySelector('#resource-page-status');
    const PAGE_SIZE = 12;
    const buttons = [...document.querySelectorAll('[data-resource-type]')];
    const labels = { note: 'Note', component: 'Component', reference: 'Reference' };
    const titles = { all: 'All resources', course: 'Course notes', note: 'Notes & formulas', component: 'Components', reference: 'Tools & references' };
    const symbols = {
        note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6M8 13h8M8 17h5"></path>',
        component: '<rect x="7" y="7" width="10" height="10" rx="2"></rect><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"></path>',
        reference: '<path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1z"></path>'
    };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const normalize = value => String(value ?? '').normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const interfaces = item => Array.isArray(item.interfaces) ? item.interfaces.join(' · ') : item.interfaces || '';
    const isCourse = item => item.resourceType === 'Course Notes';
    const matchesType = (item, selected) => selected === 'all' || (selected === 'course' ? isCourse(item) : item.kind === selected);
    const items = resourceLibrary.map(item => ({ ...item, searchText: normalize([
        item.id, item.title, item.description, item.category, item.kind, item.provider,
        item.model, item.supply, interfaces(item), item.formulaSearch,
        item.resourceType, item.status, item.tags?.join(' ')
    ].join(' ')) }));
    const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    let type = 'all';
    let page = 1;
    let pageCount = 1;
    let topicOptions = [];
    let activeTopic = 0;
    let topicQuery = '';
    let lastTopicKey = 0;

    function closeTopicPicker() {
        topicMenu.hidden = true;
        topicToggle.setAttribute('aria-expanded', 'false');
        topicToggle.removeAttribute('aria-activedescendant');
        topicQuery = '';
    }

    function highlightTopic(index) {
        activeTopic = Math.max(0, Math.min(index, topicOptions.length - 1));
        topicOptions.forEach((option, optionIndex) => option.setAttribute('data-active', String(optionIndex === activeTopic)));
        const active = topicOptions[activeTopic];
        if (!active) return;
        topicToggle.setAttribute('aria-activedescendant', active.id);
        // Scroll the options, keeping the page and trigger in place.
        if (active.offsetTop < topicMenu.scrollTop) topicMenu.scrollTop = active.offsetTop;
        else if (active.offsetTop + active.offsetHeight > topicMenu.scrollTop + topicMenu.clientHeight) {
            topicMenu.scrollTop = active.offsetTop + active.offsetHeight - topicMenu.clientHeight;
        }
    }

    function openTopicPicker() {
        topicMenu.hidden = false;
        topicToggle.setAttribute('aria-expanded', 'true');
        highlightTopic([...topic.options].findIndex(option => option.value === topic.value));
    }

    function selectTopic(value) {
        topic.value = value;
        closeTopicPicker();
        page = 1;
        render();
        topicToggle.focus();
    }

    function syncTopicPicker() {
        closeTopicPicker();
        topicMenu.replaceChildren();
        topicOptions = [...topic.options].map((option, index) => {
            const choice = document.createElement('li');
            choice.id = `resource-topic-option-${index}`;
            choice.setAttribute('role', 'option');
            choice.setAttribute('data-topic-value', option.value);
            choice.setAttribute('aria-selected', String(option.value === topic.value));
            choice.textContent = option.textContent;
            choice.addEventListener('pointerdown', event => event.preventDefault());
            choice.addEventListener('click', () => selectTopic(option.value));
            topicMenu.append(choice);
            return choice;
        });
        topicValue.textContent = [...topic.options].find(option => option.value === topic.value)?.textContent || 'All topics';
    }
    // Counts describe the whole catalogue; searching never hides a collection.
    document.querySelectorAll('[data-resource-count]').forEach(counter => {
        counter.textContent = items.filter(item => matchesType(item, counter.dataset.resourceCount)).length;
    });
    total.textContent = `${items.length} resources`;
    total.hidden = false;
    function updateTopics(selected = topic.value) {
        const categories = [...new Set(items.filter(item => matchesType(item, type)).map(item => item.category))].sort();
        topic.replaceChildren();
        for (const category of ['all', ...categories]) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category === 'all' ? 'All topics' : category;
            topic.append(option);
        }
        topic.value = categories.includes(selected) ? selected : 'all';
    }
    function readState() {
        const params = new URLSearchParams(location.search);
        type = Object.hasOwn(titles, params.get('type')) ? params.get('type') : 'all';
        search.value = params.get('q') || '';
        updateTopics(params.get('topic'));
        sort.value = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
        const pageParam = params.get('page') || '';
        const requestedPage = Number(pageParam);
        page = /^[1-9]\d*$/.test(pageParam) && Number.isSafeInteger(requestedPage) ? requestedPage : 1;
    }
    function resourceRow(item) {
        let url = '';
        try {
            const resolved = new URL(item.url || '', location.href);
            if (item.url && ['http:', 'https:'].includes(resolved.protocol)) url = item.url;
        } catch { /* Resources without a link stay readable inline. */ }
        const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const title = url
            ? `<a class="resource-title-link" href="${escape(url)}"${external}>${escape(item.title)}<span class="resource-link-arrow" aria-hidden="true">${item.external ? '↗' : '→'}</span>${item.external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''}</a>`
            : escape(item.title);
        const specs = [['Model', item.model], ['Supply', item.supply], ['Interfaces', interfaces(item)]].filter(([, value]) => value);
        const formula = item.formula ? `<div class="resource-formula" data-math="${escape(item.formula)}">${escape(item.formula)}</div>` : '';
        const preview = formula || specs.length ? `<details class="resource-preview"><summary>Preview <span>${formula ? 'formula' : 'specifications'}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"></path></svg></summary><div class="resource-preview-body">${formula}${specs.length ? `<dl class="resource-detail-meta">${specs.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>` : ''}</div></details>` : '';
        const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? new Date(`${item.date}T00:00:00Z`) : null;
        const updated = date && !Number.isNaN(date.getTime()) ? `<time datetime="${escape(item.date)}" title="Updated ${escape(item.date)}">${dateFormat.format(date)}</time>` : '';
        const state = ['Starter', 'In Progress'].includes(item.status) ? `<span class="resource-state">${escape(item.status)}</span>` : '';
        return `<li class="resource-row" data-resource-id="${escape(item.id)}" data-resource-kind="${escape(item.kind)}">
            <span class="resource-row-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${symbols[item.kind] || symbols.reference}</svg></span>
            <div class="resource-row-content">
                <div class="resource-row-meta"><span class="resource-row-kind">${isCourse(item) ? 'Course notes' : escape(labels[item.kind] || 'Reference')}</span><span class="resource-row-topic">${escape(item.category)}</span>${state}${updated}</div>
                <h3>${title}</h3>
                <p class="resource-row-description">${escape(item.description)}</p>
                ${item.external && item.provider ? `<p class="resource-row-source">${escape(item.provider)} <span aria-hidden="true">↗</span></p>` : ''}
                ${preview}
            </div>
        </li>`;
    }
    function renderPagination() {
        pagination.hidden = pageCount <= 1;
        previousPage.disabled = page === 1;
        nextPage.disabled = page === pageCount;
        pageStatus.textContent = `Page ${page} of ${pageCount}`;
        pageNumbers.replaceChildren();
        if (pagination.hidden) return;
        // Keep nearby pages and both ends visible as the catalogue grows.
        const nearby = new Set([1, pageCount, page - 1, page, page + 1]);
        if (page <= 3) [2, 3, 4].forEach(number => nearby.add(number));
        if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach(number => nearby.add(number));
        let last = 0;
        [...nearby].filter(number => number >= 1 && number <= pageCount).sort((a, b) => a - b).forEach(number => {
            if (last && number - last > 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'library-page-ellipsis';
                ellipsis.textContent = '…';
                ellipsis.setAttribute('aria-hidden', 'true');
                pageNumbers.append(ellipsis);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = number;
            button.setAttribute('data-resource-page', number);
            button.setAttribute('aria-label', `Page ${number}`);
            button.setAttribute('aria-controls', 'resource-list');
            if (number === page) button.setAttribute('aria-current', 'page');
            button.addEventListener('click', () => goToPage(number));
            pageNumbers.append(button);
            last = number;
        });
    }
    function goToPage(number) {
        if (number < 1 || number > pageCount || number === page) return;
        page = number;
        render(true, 'push');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    function render(updateUrl = true, historyMode = 'replace') {
        const words = normalize(search.value).split(/\s+/).filter(Boolean);
        const visible = items.filter(item => matchesType(item, type)
            && (topic.value === 'all' || item.category === topic.value)
            && words.every(word => item.searchText.includes(word)));
        visible.sort((a, b) => (sort.value === 'newest' ? -1 : 1) * (a.date || '').localeCompare(b.date || '') || a.title.localeCompare(b.title));
        pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
        page = Math.max(1, Math.min(page, pageCount));
        const start = (page - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, visible.length);
        list.innerHTML = visible.slice(start, end).map(resourceRow).join('');
        empty.hidden = visible.length > 0;
        list.hidden = visible.length === 0;
        clear.hidden = search.value.length === 0;
        resetInline.hidden = search.value.length === 0 && type === 'all' && topic.value === 'all' && sort.value === 'newest';
        heading.textContent = titles[type];
        syncTopicPicker();
        status.textContent = visible.length ? `Showing ${start + 1}–${end} of ${visible.length} resources` : '0 resources';
        renderPagination();
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.resourceType === type)));
        if (updateUrl) {
            const url = new URL(location.href);
            for (const key of ['q', 'type', 'topic', 'sort', 'page']) url.searchParams.delete(key);
            if (search.value.trim()) url.searchParams.set('q', search.value.trim());
            if (type !== 'all') url.searchParams.set('type', type);
            if (topic.value !== 'all') url.searchParams.set('topic', topic.value);
            if (sort.value !== 'newest') url.searchParams.set('sort', sort.value);
            if (page > 1) url.searchParams.set('page', page);
            if (historyMode === 'push') history.pushState(null, '', url);
            else history.replaceState(null, '', url);
        } else {
            // Keep direct links and restored history in sync after clamping.
            const url = new URL(location.href);
            const canonicalPage = page > 1 ? String(page) : null;
            if (url.searchParams.get('page') !== canonicalPage) {
                if (canonicalPage) url.searchParams.set('page', canonicalPage);
                else url.searchParams.delete('page');
                history.replaceState(null, '', url);
            }
        }
    }
    buttons.forEach(button => button.addEventListener('click', () => {
        type = button.dataset.resourceType;
        page = 1;
        updateTopics();
        render();
    }));
    // Refresh equations when a preview opens, including after filtering.
    list.addEventListener('toggle', event => {
        if (event.target.matches('.resource-preview') && event.target.open && typeof renderMathElements === 'function') {
            renderMathElements(event.target);
        }
    }, true);
    document.addEventListener('keydown', event => {
        if (event.key !== '/' || event.repeat || event.isComposing || event.defaultPrevented
            || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target?.isContentEditable || target?.closest?.('input, textarea, select')) return;
        event.preventDefault();
        search.focus();
    });
    search.addEventListener('input', () => { page = 1; render(); });
    search.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !event.isComposing) { search.value = ''; page = 1; render(); }
    });
    document.querySelector('#library-search-form').addEventListener('submit', event => event.preventDefault());
    clear.addEventListener('click', () => { search.value = ''; page = 1; render(); search.focus(); });
    topic.addEventListener('change', () => { page = 1; render(); });
    topicToggle.addEventListener('click', () => {
        if (topicMenu.hidden) openTopicPicker();
        else closeTopicPicker();
    });
    topicToggle.addEventListener('keydown', event => {
        if (event.isComposing || event.ctrlKey || event.metaKey) return;
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const wasOpen = !topicMenu.hidden;
            if (!wasOpen) openTopicPicker();
            if (event.key === 'Home') highlightTopic(0);
            else if (event.key === 'End') highlightTopic(topicOptions.length - 1);
            else if (wasOpen) highlightTopic(activeTopic + (event.key === 'ArrowDown' ? 1 : -1));
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (topicMenu.hidden) openTopicPicker();
            else selectTopic(topic.options[activeTopic].value);
        } else if (event.key === 'Escape') {
            if (!topicMenu.hidden) event.preventDefault();
            closeTopicPicker();
        } else if (event.key === 'Tab') {
            closeTopicPicker();
        } else if (event.key.length === 1 && !event.altKey) {
            event.preventDefault();
            if (topicMenu.hidden) openTopicPicker();
            const now = Date.now();
            topicQuery = (now - lastTopicKey > 700 ? '' : topicQuery) + normalize(event.key);
            lastTopicKey = now;
            const repeated = [...topicQuery].every(char => char === topicQuery[0]);
            const prefix = repeated ? topicQuery[0] : topicQuery;
            const start = activeTopic + (repeated ? 1 : 0);
            for (let step = 0; step < topicOptions.length; step++) {
                const index = (start + step) % topicOptions.length;
                if (normalize(topicOptions[index].textContent).startsWith(prefix)) {
                    highlightTopic(index);
                    break;
                }
            }
        }
    });
    document.addEventListener('click', event => {
        if (!topicPicker.contains(event.target)) closeTopicPicker();
    });
    document.addEventListener('focusin', event => {
        if (!topicPicker.contains(event.target)) closeTopicPicker();
    });
    sort.addEventListener('change', () => { page = 1; render(); });
    previousPage.addEventListener('click', () => goToPage(page - 1));
    nextPage.addEventListener('click', () => goToPage(page + 1));
    function resetFilters() {
        search.value = ''; type = 'all'; sort.value = 'newest'; page = 1;
        updateTopics('all');
        render(); search.focus();
    }
    resetInline.addEventListener('click', resetFilters);
    document.querySelector('#resource-reset').addEventListener('click', resetFilters);
    window.addEventListener('popstate', () => { readState(); render(false); });
    readState(); render(false);
    // Enhance the native fallback only after the menu is ready.
    topic.hidden = true;
    topicToggle.hidden = false;
    document.querySelector('#resource-topic-label').setAttribute('for', topicToggle.id);
})();
