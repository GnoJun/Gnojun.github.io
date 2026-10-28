/* One controller for notes, hardware, and references. */
(() => {
    const list = document.querySelector('#resource-list');
    if (!list || typeof resourceLibrary === 'undefined') return;
    const search = document.querySelector('#resource-search');
    const topic = document.querySelector('#resource-topic');
    const sort = document.querySelector('#resource-sort');
    const clear = document.querySelector('#resource-search-clear');
    const status = document.querySelector('#resource-status');
    const empty = document.querySelector('#resources-empty-state');
    const filterOptions = document.querySelector('#resource-filter-options');
    const filterSummary = document.querySelector('#resource-filter-summary');
    const buttons = [...document.querySelectorAll('[data-resource-type]')];
    const labels = { note: 'Note', component: 'Component', reference: 'Reference' };
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
    search.addEventListener('input', () => render());
    search.addEventListener('keydown', event => {
        if (event.key === 'Escape') { search.value = ''; render(); }
    });
    document.querySelector('#library-search-form').addEventListener('submit', event => event.preventDefault());
    clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
    topic.addEventListener('change', () => render());
    sort.addEventListener('change', () => render());
    document.querySelector('#resource-reset').addEventListener('click', () => {
        search.value = ''; type = 'all'; topic.value = 'all'; sort.value = 'title';
        filterOptions.open = false;
        render(); search.focus();
    });
    window.addEventListener('popstate', () => { readState(); render(false); });
    readState(); render(false);
})();
