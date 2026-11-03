/* Shared article navigation and author-selected formula/symbol references. */
(function () {
    'use strict';

    const navigation = document.querySelector('[data-markdown-navigation]');
    const markdownDocument = document.querySelector('.markdown-document[data-markdown-src]');
    if (!navigation || !markdownDocument) return;

    const tocList = navigation.querySelector('[data-markdown-toc-list]');
    const progressElement = navigation.querySelector('.markdown-reading-progress');
    const progressBar = navigation.querySelector('.markdown-reading-progress-bar');
    const navigationContent = navigation.querySelector('[data-markdown-navigation-content]');
    const navigationToggle = navigation.querySelector('[data-markdown-navigation-toggle]');
    if (!tocList || !progressElement || !progressBar || !navigationContent || !navigationToggle) return;

    const wideScreen = window.matchMedia('(min-width: 1200px)');
    // Download toolbars and other article siblings belong to the page shell,
    // not the two-column article layout. Keep them outside the grid.
    const layout = document.createElement('div');
    layout.className = 'markdown-article-layout';
    markdownDocument.parentNode.insertBefore(layout, markdownDocument);
    layout.appendChild(markdownDocument);
    const originalPosition = document.createComment('Article navigation returns here on smaller screens.');
    navigation.parentNode.insertBefore(originalPosition, navigation);

    const sidebar = document.createElement('aside');
    sidebar.className = 'markdown-article-sidebar';
    sidebar.setAttribute('aria-label', 'Article tools');
    const panelIds = new Set(Array.from(document.querySelectorAll('[id]'), element => element.id));
    let panelId = 'markdown-sidebar-panel', panelSuffix = 2;
    while (panelIds.has(panelId)) panelId = 'markdown-sidebar-panel-' + panelSuffix++;
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'markdown-sidebar-toggle';
    sidebarToggle.type = 'button';
    sidebarToggle.textContent = 'Navigation Bar';
    sidebarToggle.setAttribute('aria-controls', panelId);
    const sidebarPanel = document.createElement('div');
    sidebarPanel.className = 'markdown-sidebar-panel';
    sidebarPanel.setAttribute('id', panelId);
    const references = document.createElement('details');
    references.className = 'markdown-quick-reference';
    const summary = document.createElement('summary');
    summary.textContent = 'Formulas & symbols';
    const referenceList = document.createElement('div');
    referenceList.className = 'markdown-reference-list';
    references.append(summary, referenceList);
    sidebarPanel.appendChild(references);
    sidebar.append(sidebarToggle, sidebarPanel);
    layout.appendChild(sidebar);

    const navigationHeading = document.createElement('p');
    navigationHeading.className = 'markdown-sidebar-heading';
    navigationHeading.textContent = 'Navigation Bar';
    const navigationLayout = navigation.querySelector('.markdown-navigation-layout') || navigationContent.parentElement;
    navigationLayout.insertBefore(navigationHeading, navigationLayout.firstChild);

    let headings = [];
    let currentSectionId = '';
    let updateRequested = false;
    let contentResizeObserver;
    let navigationCollapsed = true;
    let desktopSidebarOpen = false;
    let hasReferences = false;

    function getMarkdownHeadings() {
        return Array.from(markdownDocument.querySelectorAll('h2, h3')).filter(heading =>
            !heading.closest('details, .markdown-quiz, .footnotes, .markdown-reference, [hidden]') &&
            Boolean(heading.textContent.trim())
        );
    }

    function prepareHeadingIds() {
        const usedIds = new Set(Array.from(document.querySelectorAll('[id]'))
            .filter(element => !headings.includes(element)).map(element => element.id));
        headings.forEach((heading, index) => {
            const base = heading.id || heading.textContent.normalize('NFKD').toLowerCase()
                .replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '')
                .trim().replace(/\s+/g, '-') || 'section-' + (index + 1);
            let id = base, suffix = 2;
            while (usedIds.has(id)) id = base + '-' + suffix++;
            heading.id = id;
            usedIds.add(id);
        });
    }

    function renderToc() {
        tocList.replaceChildren();
        headings.forEach(heading => {
            const item = document.createElement('li');
            item.setAttribute('data-toc-level', heading.tagName === 'H3' ? '3' : '2');
            const link = document.createElement('a');
            link.className = 'project-toc-link';
            link.href = '#' + heading.id;
            link.textContent = heading.textContent.trim();
            item.appendChild(link);
            tocList.appendChild(item);
        });
    }

    function buildReferences() {
        referenceList.replaceChildren();
        const sources = Array.from(markdownDocument.querySelectorAll('[data-markdown-reference]')).filter(source =>
            !source.closest('.markdown-quiz, details, .footnotes, [hidden]') &&
            !source.parentElement.closest('[data-markdown-reference]')
        );
        for (const source of sources) {
            const sourceBody = source.querySelector('.markdown-reference-body');
            if (!sourceBody || !source.id) continue;
            const card = document.createElement('section');
            card.className = 'markdown-reference-card';
            const title = document.createElement('h3');
            title.className = 'markdown-reference-card-title';
            title.textContent = source.dataset.referenceTitle || 'Reference';
            const body = sourceBody.cloneNode(true);
            // Reference cards contain static teaching content, never duplicated
            // controls, hidden answers, embedded documents, or ID destinations.
            body.querySelectorAll('form, iframe, dialog, details, input, select, textarea, button, .markdown-code-toolbar, .markdown-table-toolbar, .footnote-ref, .footnote-backref, [hidden], [data-markdown-reference]')
                .forEach(element => element.remove());
            for (const element of [body, ...body.querySelectorAll('*')]) {
                element.removeAttribute('id');
                element.removeAttribute('aria-labelledby');
                element.removeAttribute('aria-describedby');
                element.removeAttribute('aria-controls');
            }
            body.querySelectorAll('[data-math]').forEach(math => {
                if (math.dataset.mathDisplay === 'false') return;
                const group = document.createElement('div');
                group.className = 'markdown-reference-formula';
                math.parentNode.insertBefore(group, math);
                const button = document.createElement('button');
                button.className = 'markdown-reference-copy';
                button.type = 'button';
                button.setAttribute('data-reference-copy', math.dataset.math);
                button.setAttribute('aria-label', 'Copy formula');
                button.setAttribute('aria-live', 'polite');
                button.setAttribute('aria-atomic', 'true');
                button.textContent = 'Copy formula';
                group.append(math, button);
            });
            const sourceLink = document.createElement('a');
            sourceLink.className = 'markdown-reference-source';
            sourceLink.href = '#' + source.id;
            sourceLink.textContent = 'View in article';
            card.append(title, body, sourceLink);
            referenceList.appendChild(card);
        }
        hasReferences = Boolean(referenceList.children.length);
        references.hidden = !hasReferences;
        document.dispatchEvent(new CustomEvent('markdown:reference-ready', { detail: { container: referenceList } }));
    }

    function updateNavigationToggle() {
        const collapsed = !wideScreen.matches && navigationCollapsed;
        navigation.classList.toggle('is-collapsed', collapsed);
        navigationToggle.setAttribute('aria-expanded', String(!collapsed));
        navigationToggle.setAttribute('aria-label', collapsed ? 'Show section navigation' : 'Hide section navigation');
        navigationToggle.setAttribute('title', collapsed ? 'Show section navigation' : 'Hide section navigation');
        const label = navigationToggle.querySelector('.markdown-navigation-toggle-label');
        if (label) label.textContent = collapsed ? 'Sections' : 'Hide';
        document.documentElement.style.setProperty('--markdown-toc-offset',
            wideScreen.matches || collapsed || navigation.hidden ? '0px' : 'var(--toc-height)');
    }

    function updateLayout() {
        if (wideScreen.matches) sidebarPanel.insertBefore(navigation, references);
        else originalPosition.parentNode.insertBefore(navigation, originalPosition.nextSibling);
        const hasTools = Boolean(headings.length || hasReferences);
        const collapsed = wideScreen.matches && hasTools && !desktopSidebarOpen;
        navigation.hidden = !headings.length || (wideScreen.matches && hasReferences && references.open);
        sidebarPanel.hidden = wideScreen.matches && !desktopSidebarOpen;
        sidebarToggle.hidden = !wideScreen.matches || !hasTools;
        sidebarToggle.setAttribute('aria-expanded', String(!sidebarPanel.hidden));
        sidebarToggle.setAttribute('aria-label', sidebarPanel.hidden ? 'Show article navigation' : 'Hide article navigation');
        sidebarToggle.setAttribute('title', sidebarPanel.hidden ? 'Show article navigation' : 'Hide article navigation');
        sidebar.hidden = wideScreen.matches ? !hasTools : !hasReferences;
        sidebar.classList.toggle('is-collapsed', collapsed);
        layout.classList.toggle('is-sidebar-collapsed', collapsed);
        layout.classList.toggle('has-article-tools', !sidebar.hidden);
        currentSectionId = '';
        updateNavigationToggle();
        requestNavigationUpdate();
    }

    function getStickyOffset() {
        const siteHeader = document.querySelector('.site-header');
        const navigationHeight = wideScreen.matches || navigationCollapsed || navigation.hidden ? 0 : navigation.offsetHeight;
        return (siteHeader?.offsetHeight || 0) + navigationHeight + 16;
    }

    function setActiveHeading(id) {
        if (!id || currentSectionId === id) return;
        const links = Array.from(tocList.querySelectorAll('.project-toc-link'));
        const activeLink = links.find(link => {
            try { return decodeURIComponent(link.hash.slice(1)) === id; } catch { return false; }
        });
        if (!activeLink) return;
        currentSectionId = id;
        links.forEach(link => link.removeAttribute('aria-current'));
        activeLink.setAttribute('aria-current', 'location');
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        const bounds = tocList.getBoundingClientRect();
        const activeBounds = activeLink.getBoundingClientRect();
        if (wideScreen.matches) {
            const delta = activeBounds.top < bounds.top ? activeBounds.top - bounds.top :
                activeBounds.bottom > bounds.bottom ? activeBounds.bottom - bounds.bottom : 0;
            if (delta) tocList.scrollTo({ top: Math.max(0, tocList.scrollTop + delta), behavior });
        } else {
            tocList.scrollTo({ left: Math.max(0, tocList.scrollLeft + activeBounds.left - bounds.left -
                (tocList.clientWidth - activeBounds.width) / 2), behavior });
        }
    }

    function updateActiveHeading() {
        if (!headings.length) return;
        const readingLine = window.scrollY + getStickyOffset() + 1;
        let active = headings[0];
        headings.forEach(heading => {
            if (heading.getBoundingClientRect().top + window.scrollY <= readingLine) active = heading;
        });
        setActiveHeading(active.id);
    }

    function updateReadingProgress() {
        const startHeading = headings.find(heading => heading.id === 'overview') || headings[0];
        if (!startHeading) return;
        const start = startHeading.getBoundingClientRect().top + window.scrollY - getStickyOffset();
        const end = Math.max(start + 1, markdownDocument.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
        const progress = Math.min(Math.max((window.scrollY - start) / (end - start), 0), 1);
        progressBar.style.transform = 'scaleX(' + progress + ')';
        progressElement.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    function requestNavigationUpdate() {
        if (updateRequested) return;
        updateRequested = true;
        window.requestAnimationFrame(() => {
            updateRequested = false;
            updateActiveHeading();
            updateReadingProgress();
        });
    }

    function initializeNavigation() {
        headings = getMarkdownHeadings();
        navigation.hidden = !headings.length;
        prepareHeadingIds();
        renderToc();
        buildReferences();
        updateLayout();
        if (typeof ResizeObserver !== 'undefined') {
            contentResizeObserver?.disconnect();
            contentResizeObserver = new ResizeObserver(requestNavigationUpdate);
            contentResizeObserver.observe(markdownDocument);
        }
    }

    sidebarToggle.addEventListener('click', () => {
        if (!wideScreen.matches || (!headings.length && !hasReferences)) return;
        desktopSidebarOpen = !desktopSidebarOpen;
        updateLayout();
        sidebarToggle.focus({ preventScroll: true });
    });
    sidebar.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !wideScreen.matches || !desktopSidebarOpen ||
            (event.target !== sidebarToggle && !sidebarPanel.contains(event.target))) return;
        event.preventDefault();
        desktopSidebarOpen = false;
        updateLayout();
        sidebarToggle.focus({ preventScroll: true });
    });
    references.addEventListener('toggle', updateLayout);
    navigationToggle.addEventListener('click', () => {
        if (wideScreen.matches) return;
        navigationCollapsed = !navigationCollapsed;
        updateNavigationToggle();
        requestNavigationUpdate();
    });
    window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
    window.addEventListener('resize', requestNavigationUpdate);
    window.addEventListener('hashchange', () => { currentSectionId = ''; requestNavigationUpdate(); });
    if (typeof wideScreen.addEventListener === 'function') wideScreen.addEventListener('change', updateLayout);
    else wideScreen.addListener(updateLayout);
    document.addEventListener('markdown:rendered', event => {
        if (event.target === markdownDocument) initializeNavigation();
    });
    document.addEventListener('markdown:enhanced', event => {
        if (event.target === markdownDocument) requestNavigationUpdate();
    });
    markdownDocument.addEventListener('toggle', requestNavigationUpdate, true);
    if (markdownDocument.querySelector('h2, h3, [data-markdown-reference]')) initializeNavigation();
    else {
        navigation.hidden = true;
        references.hidden = true;
        updateLayout();
    }
})();
