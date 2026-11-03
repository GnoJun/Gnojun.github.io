/* Article loading and accessible controls. Parsing lives in markdown-engine.js. */
(function () {
    'use strict';

    const containers = Array.from(document.querySelectorAll('[data-markdown-src]'));
    if (!containers.length) return;

    const scriptBase = new URL('.', document.currentScript.src);
    const assets = new Map();
    const resetTimers = new WeakMap();
    let enginePromise;
    let previewDialog;
    let previewOpener;

    function loadScript(path) {
        const url = new URL(path, scriptBase).href;
        if (!assets.has(url)) {
            assets.set(url, new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const timer = setTimeout(() => {
                    script.remove();
                    reject(new Error('Script timed out: ' + url));
                }, 15000);
                script.src = url;
                script.onload = () => { clearTimeout(timer); resolve(); };
                script.onerror = () => { clearTimeout(timer); reject(new Error('Script unavailable: ' + url)); };
                document.head.appendChild(script);
            }));
        }
        return assets.get(url);
    }

    function getEngine() {
        if (!enginePromise) {
            enginePromise = Promise.all([
                loadScript('vendor/markdown-it-15.0.3.min.js'),
                loadScript('vendor/markdown-it-footnote-4.0.0.min.js'),
                loadScript('vendor/markdown-it-container-4.0.0.min.js')
            ]).then(() => loadScript('markdown-engine.js')).then(() =>
                window.MarkdownArticleEngine.create({ pageURL: window.location.href })
            );
        }
        return enginePromise;
    }

    async function highlightCode(container) {
        const blocks = Array.from(container.querySelectorAll('pre > code[class*="language-"]'))
            .filter(code => !code.dataset.highlighted && code.textContent.length <= 50000 &&
                !code.matches('.language-text, .language-plaintext'));
        if (!blocks.length) return;
        if (!window.hljs) await loadScript('vendor/highlight-11.12.0.min.js');
        for (const code of blocks) {
            const language = Array.from(code.classList).find(name => name.startsWith('language-'))?.slice(9);
            if (language && window.hljs.getLanguage(language)) window.hljs.highlightElement(code);
        }
    }

    async function renderMath(container) {
        const expressions = container.querySelectorAll('[data-math]');
        if (!expressions.length) return;
        if (!window.katex) {
            if (!document.querySelector('link[href*="katex"][rel="stylesheet"]')) {
                const stylesheet = document.createElement('link');
                stylesheet.rel = 'stylesheet';
                stylesheet.href = 'https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css';
                document.head.appendChild(stylesheet);
            }
            await loadScript('https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.js');
        }
        expressions.forEach(element => {
            if (element.dataset.mathRendered === 'true') return;
            try {
                window.katex.render(element.dataset.math, element, {
                    displayMode: element.dataset.mathDisplay !== 'false',
                    throwOnError: false, trust: false, strict: 'warn'
                });
                element.dataset.mathRendered = 'true';
            } catch { /* Keep readable LaTeX if an optional enhancement fails. */ }
        });
    }

    function visitInitialFragment(container) {
        if (!window.location.hash) return;
        try {
            const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
            if (target && container.contains(target)) {
                for (let parent = target.parentElement; parent && parent !== container; parent = parent.parentElement) {
                    if (parent.tagName === 'DETAILS') parent.open = true;
                }
                target.scrollIntoView();
            }
        } catch { /* Ignore malformed URL fragments. */ }
    }

    async function loadMarkdown(container, index) {
        const source = container.dataset.markdownSrc;
        if (!source) return;
        container.setAttribute('aria-busy', 'true');
        try {
            const [response, engine] = await Promise.all([
                fetch(source, { cache: 'no-cache' }), getEngine()
            ]);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const markdown = await response.text();
            const reservedIds = Array.from(document.querySelectorAll('[id]'), element => element.id);
            container.innerHTML = engine.render(markdown, source, {
                reservedIds, documentId: 'article-' + (index + 1)
            });
            container.setAttribute('aria-busy', 'false');
            container.dispatchEvent(new CustomEvent('markdown:rendered', { bubbles: true }));
            visitInitialFragment(container);
            // The article is already readable while optional highlighting and math load.
            await Promise.allSettled([highlightCode(container), renderMath(container)]);
            container.dispatchEvent(new CustomEvent('markdown:enhanced', { bubbles: true }));
        } catch (error) {
            console.error('Markdown could not be loaded:', source, error);
            container.replaceChildren();
            const message = document.createElement('p');
            message.className = 'markdown-load-error';
            message.setAttribute('role', 'alert');
            message.textContent = 'This article could not be loaded. Please reload the page to try again.';
            container.appendChild(message);
            container.setAttribute('aria-busy', 'false');
        }
    }

    async function copyContent(button, text, selectionTarget, originalLabel, selectedLabel, manualTarget) {
        let status;
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            status = 'Copied';
        } catch {
            if (manualTarget) selectionTarget = manualTarget();
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(selectionTarget);
                selection.removeAllRanges();
                selection.addRange(range);
                status = selectedLabel;
            } else status = 'Select & copy';
        }
        button.textContent = status;
        clearTimeout(resetTimers.get(button));
        resetTimers.set(button, setTimeout(() => {
            button.textContent = originalLabel;
            resetTimers.delete(button);
        }, 1800));
    }

    function showImage(button) {
        const image = button.querySelector('img');
        if (!image) return;
        if (!previewDialog) {
            previewDialog = document.createElement('dialog');
            // Browsers without native dialogs can still open the full image.
            if (typeof previewDialog.showModal !== 'function') {
                previewDialog = null;
                window.open(image.src, '_blank', 'noopener');
                return;
            }
            previewDialog.className = 'markdown-image-dialog';
            previewDialog.setAttribute('aria-label', 'Image preview');
            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'markdown-image-close';
            close.textContent = 'Close';
            close.addEventListener('click', () => previewDialog.close());
            const preview = document.createElement('img');
            preview.className = 'markdown-image-preview';
            const caption = document.createElement('p');
            caption.className = 'markdown-image-caption';
            previewDialog.append(close, preview, caption);
            previewDialog.addEventListener('click', event => {
                if (event.target !== previewDialog) return;
                const bounds = previewDialog.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right ||
                    event.clientY < bounds.top || event.clientY > bounds.bottom) previewDialog.close();
            });
            previewDialog.addEventListener('close', () => previewOpener?.focus({ preventScroll: true }));
            document.body.appendChild(previewDialog);
        }
        previewOpener = button;
        const preview = previewDialog.querySelector('img');
        preview.src = image.currentSrc || image.src;
        preview.alt = image.alt;
        preview.classList.toggle('markdown-image-diagram', image.classList.contains('markdown-image-diagram'));
        previewDialog.querySelector('.markdown-image-caption').textContent = image.title || image.alt;
        previewDialog.showModal();
    }

    const quizPrefixes = { '': 1, p: 1e-12, n: 1e-9, u: 1e-6, '\u00b5': 1e-6, '\u03bc': 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9 };
    const quizUnits = { V: 'V', A: 'A', ohm: '\u03a9', '\u03a9': '\u03a9', F: 'F', H: 'H', Hz: 'Hz', s: 's', W: 'W' };

    function unitDefinition(unit) {
        if (Object.hasOwn(quizUnits, unit)) return { dimension: quizUnits[unit], scale: 1 };
        const prefix = unit[0];
        const base = unit.slice(1);
        if (prefix && Object.hasOwn(quizPrefixes, prefix) && Object.hasOwn(quizUnits, base)) {
            return { dimension: quizUnits[base], scale: quizPrefixes[prefix] };
        }
        return null;
    }

    function quizNumber(raw, expectedUnit) {
        const match = raw.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?:\s*([^\s]+))?$/i);
        if (!match) return null;
        let value = Number(match[1]);
        const unit = match[2] || expectedUnit;
        if (unit !== expectedUnit) {
            const actual = unitDefinition(unit), expected = unitDefinition(expectedUnit);
            if (!actual || !expected || actual.dimension !== expected.dimension) return null;
            value *= actual.scale / expected.scale;
        }
        return Number.isFinite(value) ? value : null;
    }

    function quizForm(event) {
        const form = event.target.closest?.('form.markdown-quiz');
        return form?.closest('[data-markdown-src]') ? form : null;
    }

    function clearQuiz(form) {
        const feedback = form.querySelector('.markdown-quiz-feedback');
        const explanation = form.querySelector('.markdown-quiz-explanation');
        feedback.textContent = '';
        delete feedback.dataset.state;
        delete form.dataset.quizState;
        if (explanation) explanation.hidden = true;
        form.querySelector('.markdown-quiz-input')?.removeAttribute('aria-invalid');
    }

    document.addEventListener('submit', event => {
        const form = quizForm(event);
        if (!form) return;
        event.preventDefault();
        clearQuiz(form);
        const feedback = form.querySelector('.markdown-quiz-feedback');
        const explanation = form.querySelector('.markdown-quiz-explanation');
        const numeric = form.querySelector('.markdown-quiz-input');
        let correct, state, message;
        if (form.dataset.quizKind === 'choice') {
            const selected = form.querySelector('input[type="radio"]:checked');
            if (!selected) {
                state = 'empty';
                message = 'Choose an answer before checking.';
                form.querySelector('input[type="radio"]')?.focus();
            } else correct = selected.value === form.dataset.quizAnswer;
        } else if (numeric) {
            if (!numeric.value.trim()) {
                state = 'empty';
                message = 'Enter an answer before checking.';
            } else {
                const unit = form.dataset.quizUnit || '';
                const value = quizNumber(numeric.value, unit);
                if (value === null) {
                    state = 'invalid';
                    message = unit ? `Enter a valid number in ${unit} or a compatible unit.` : 'Enter a valid number without a unit.';
                } else {
                    const answer = Number(form.dataset.quizAnswer), tolerance = Number(form.dataset.quizTolerance || 0);
                    // Allow only floating-point rounding at the inclusive boundary,
                    // scaled to the values so very small engineering units stay precise.
                    const rounding = Number.EPSILON * Math.max(Math.abs(value), Math.abs(answer), tolerance) * 8;
                    correct = Math.abs(value - answer) <= tolerance + rounding;
                }
            }
            if (state) {
                numeric.setAttribute('aria-invalid', 'true');
                numeric.focus();
            }
        } else return;
        if (typeof correct === 'boolean') {
            state = correct ? 'correct' : 'incorrect';
            message = correct ? 'Correct.' : explanation ? 'Not quite. Review the explanation and try again.' : 'Not quite. Try again.';
            form.dataset.quizState = state;
            if (explanation) explanation.hidden = false;
        }
        feedback.dataset.state = state;
        feedback.textContent = message;
    });

    document.addEventListener('reset', event => {
        const form = quizForm(event);
        if (!form) return;
        event.preventDefault();
        clearQuiz(form);
        form.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
        const numeric = form.querySelector('.markdown-quiz-input');
        if (numeric) numeric.value = '';
        (numeric || form.querySelector('input[type="radio"]'))?.focus();
    });

    document.addEventListener('markdown:reference-ready', event => {
        const container = event.detail?.container;
        if (!container?.closest('.markdown-article-sidebar')) return;
        // The reference cards share the article's lazy math loader and retain
        // readable TeX when the optional renderer is unavailable.
        void renderMath(container).catch(() => {});
    });

    document.addEventListener('click', event => {
        const button = event.target.closest?.('[data-code-copy], [data-code-wrap], [data-table-copy], [data-image-open], [data-reference-copy]');
        if (!button || (!button.closest('[data-markdown-src]') &&
            !(button.hasAttribute('data-reference-copy') && button.closest('.markdown-article-sidebar')))) return;
        if (button.hasAttribute('data-reference-copy')) {
            const group = button.closest('.markdown-reference-formula') || button.parentElement;
            const formula = group.querySelector('[data-math]') || button;
            const text = button.getAttribute('data-reference-copy');
            void copyContent(button, text, formula, 'Copy formula', 'Formula selected', () => {
                // KaTeX contains visual and MathML output. A manual selection
                // must expose the original TeX rather than that rendered text.
                let source = group.querySelector('.markdown-reference-copy-source');
                if (!source) {
                    source = document.createElement('code');
                    source.className = 'markdown-reference-copy-source';
                    source.setAttribute('tabindex', '0');
                    source.setAttribute('aria-label', 'Formula LaTeX source for manual copying');
                    group.appendChild(source);
                }
                source.textContent = text;
                return source;
            });
        } else if (button.hasAttribute('data-code-wrap')) {
            const block = button.closest('.markdown-code-block');
            const wrapped = block.classList.toggle('is-wrapped');
            button.setAttribute('aria-pressed', String(wrapped));
        } else if (button.hasAttribute('data-code-copy')) {
            const code = button.closest('.markdown-code-block').querySelector('code');
            void copyContent(button, code.textContent, code, 'Copy', 'Code selected');
        } else if (button.hasAttribute('data-table-copy')) {
            const table = button.closest('.markdown-table-block').querySelector('table');
            const text = Array.from(table.rows, row => Array.from(row.cells, cell =>
                cell.textContent.trim().replace(/\s+/g, ' ')
            ).join('\t')).join('\n');
            void copyContent(button, text, table, 'Copy table', 'Table selected');
        } else showImage(button);
    });

    window.addEventListener('hashchange', () => containers.forEach(visitInitialFragment));
    containers.forEach(loadMarkdown);
})();
