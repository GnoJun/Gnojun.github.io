/* One controller for notes, hardware, and references. */
(() => {
    const list = document.querySelector('#resource-list');
    if (!list || typeof resourceLibrary === 'undefined') return;
    const search = document.querySelector('#resource-search');
    const topic = document.querySelector('#resource-topic');
    const sort = document.querySelector('#resource-sort');
    const clear = document.querySelector('#resource-search-clear');
    const resetInline = document.querySelector('#resource-reset-inline');
    const status = document.querySelector('#resource-status');
    const empty = document.querySelector('#resources-empty-state');
    const filterOptions = document.querySelector('#resource-filter-options');
    const filterSummary = document.querySelector('#resource-filter-summary');
    const buttons = [...document.querySelectorAll('[data-resource-type]')];
    const labels = { note: 'Note', component: 'Component', reference: 'Reference' };
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
    const items = resourceLibrary.map(item => ({ ...item, searchText: normalize([
        item.title, item.description, item.category, item.kind, item.provider,
        item.model, item.supply, interfaces(item), item.formulaSearch,
        item.tags?.join(' ')
    ].join(' ')) }));
    let type = 'all';
    [...new Set(items.map(item => item.category))].sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        topic.append(option);
    });
    function readState() {
        const params = new URLSearchParams(location.search);
        type = Object.hasOwn(labels, params.get('type')) ? params.get('type') : 'all';
        search.value = params.get('q') || '';
        topic.value = [...topic.options].some(option => option.value === params.get('topic')) ? params.get('topic') : 'all';
        sort.value = ['newest', 'oldest'].includes(params.get('sort')) ? params.get('sort') : 'title';
        filterOptions.open = topic.value !== 'all' || sort.value !== 'title';
    }
    function resourceRow(item) {
        let url = '';
        try {
            const resolved = new URL(item.url || '', location.href);
            if (item.url && ['http:', 'https:'].includes(resolved.protocol)) url = item.url;
        } catch { /* Resources without a link stay readable inline. */ }
        const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const title = url
            ? `<a class="text-link" href="${escape(url)}"${external}><span class="link-label">${escape(item.title)}</span> <span class="link-arrow" aria-hidden="true">${item.external ? '↗' : '→'}</span>${item.external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''}</a>`
            : escape(item.title);
        const specs = [item.model, item.supply, interfaces(item)].filter(Boolean);
        const formula = item.formula ? `<div class="resource-formula" data-math="${escape(item.formula)}">${escape(item.formula)}</div>` : '';
        const details = formula || specs.length ? `<details class="resource-inline-detail"><summary>${formula ? 'View formula' : 'View specifications'}</summary>${formula}${specs.length ? `<p>${specs.map(escape).join(' · ')}</p>` : ''}</details>` : '';
        const metadata = [
            ['Topic', item.category],
            ['Updated', item.date],
            ['Status', item.status],
            ['Source', item.provider],
            ['Tags', item.tags?.join(', ')]
        ].filter(([, value]) => value);
        const more = metadata.length ? `<details class="resource-more-details"><summary>Details</summary><dl class="resource-detail-meta">${metadata.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${label === 'Updated' ? `<time datetime="${escape(value)}">${escape(value)}</time>` : escape(value)}</dd></div>`).join('')}</dl></details>` : '';
        return `<li class="resource-row">
            <span class="resource-row-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${symbols[item.kind] || symbols.reference}</svg></span>
            <div class="resource-row-content">
                <div class="resource-row-heading"><h3>${title}</h3><span class="resource-row-kind">${escape(labels[item.kind])}</span></div>
                <p class="resource-row-description">${escape(item.description)}</p>
                ${details || more ? `<div class="resource-row-actions">${details}${more}</div>` : ''}
            </div>
        </li>`;
    }
    function render(updateUrl = true) {
        const words = normalize(search.value).split(/\s+/).filter(Boolean);
        const visible = items.filter(item => (type === 'all' || item.kind === type)
            && (topic.value === 'all' || item.category === topic.value)
            && words.every(word => item.searchText.includes(word)));
        visible.sort((a, b) => sort.value === 'title' ? a.title.localeCompare(b.title)
            : (sort.value === 'newest' ? -1 : 1) * (a.date || '').localeCompare(b.date || '') || a.title.localeCompare(b.title));
        list.innerHTML = visible.map(resourceRow).join('');
        empty.hidden = visible.length > 0;
        list.hidden = visible.length === 0;
        clear.hidden = search.value.length === 0;
        resetInline.hidden = search.value.length === 0 && type === 'all' && topic.value === 'all' && sort.value === 'title';
        status.textContent = visible.length === items.length
            ? `${items.length} resources`
            : `${visible.length} of ${items.length} resources`;
        const activeFilters = Number(topic.value !== 'all') + Number(sort.value !== 'title');
        filterSummary.textContent = activeFilters ? ` (${activeFilters})` : '';
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.resourceType === type)));
        if (typeof renderMathElements === 'function') renderMathElements(list);
        if (updateUrl) {
            const url = new URL(location.href);
            for (const key of ['q', 'type', 'topic', 'sort']) url.searchParams.delete(key);
            if (search.value.trim()) url.searchParams.set('q', search.value.trim());
            if (type !== 'all') url.searchParams.set('type', type);
            if (topic.value !== 'all') url.searchParams.set('topic', topic.value);
            if (sort.value !== 'title') url.searchParams.set('sort', sort.value);
            history.replaceState(null, '', url);
        }
    }
    buttons.forEach(button => button.addEventListener('click', () => {
        type = button.dataset.resourceType; render();
    }));
    document.addEventListener('keydown', event => {
        if (event.key !== '/' || event.repeat || event.isComposing || event.defaultPrevented
            || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target?.isContentEditable || target?.closest?.('input, textarea, select')) return;
        event.preventDefault();
        search.focus();
    });
    search.addEventListener('input', () => render());
    search.addEventListener('keydown', event => {
        if (event.key === 'Escape') { search.value = ''; render(); }
    });
    document.querySelector('#library-search-form').addEventListener('submit', event => event.preventDefault());
    clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
    topic.addEventListener('change', () => render());
    sort.addEventListener('change', () => render());
    function resetFilters() {
        search.value = ''; type = 'all'; topic.value = 'all'; sort.value = 'title';
        filterOptions.open = false;
        render(); search.focus();
    }
    resetInline.addEventListener('click', resetFilters);
    document.querySelector('#resource-reset').addEventListener('click', resetFilters);
    window.addEventListener('popstate', () => { readState(); render(false); });
    readState(); render(false);
})();
