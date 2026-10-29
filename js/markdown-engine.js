/* Pure Markdown-to-HTML engine. The article loader supplies the local vendors. */
(function (root) {
    'use strict';

    const callouts = {
        note: 'Engineering Note', tip: 'Tip', important: 'Important',
        warning: 'Warning', caution: 'Caution', implemented: 'Implemented',
        prototype: 'Prototype', testing: 'Testing', planned: 'Planned'
    };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    function resolveUrl(raw, source, pageURL, image = false) {
        const value = String(raw || '').trim();
        if (!value) return '';
        if (!image && value.startsWith('#')) return value;
        try {
            const url = new URL(value, new URL(source || pageURL, pageURL));
            const protocols = image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:'];
            return protocols.includes(url.protocol) ? url.href : '';
        } catch { return ''; }
    }

    function create(options = {}) {
        const pageURL = options.pageURL || 'https://example.invalid/';
        const md = root.markdownit({ html: false, linkify: true, typographer: false, maxNesting: 40 });
        // Titles support ordinary inline formatting, links, and math without
        // collecting another copy of the article's footnotes during rendering.
        const titleMd = root.markdownit({ html: false, linkify: true, typographer: false, maxNesting: 40 });
        md.use(root.markdownitFootnote);
        md.validateLink = titleMd.validateLink = url => Boolean(resolveUrl(url, pageURL, pageURL));

        md.use(root.markdownitContainer, 'details', {
            validate: params => /^details(?:\s+.*)?$/.test(params.trim()),
            render(tokens, index, _options, env) {
                if (tokens[index].nesting === -1) return '</div></details>\n';
                const title = tokens[index].info.trim().replace(/^details\s*/, '') || 'Show details';
                return `<details class="markdown-details"><summary>${titleMd.renderInline(title, env)}</summary><div class="markdown-details-body">\n`;
            }
        });

        // Math is tokenized before escaping, while code spans/fences stay literal.
        const inlineMath = (state, silent) => {
            const start = state.pos;
            const parens = state.src.startsWith('\\(', start);
            if (!parens && (state.src[start] !== '$' || state.src[start - 1] === '$' || state.src[start + 1] === '$' || /\s/.test(state.src[start + 1] || ' '))) return false;
            const opening = parens ? 2 : 1;
            const closing = parens ? '\\)' : '$';
            let end = start + opening;
            while ((end = state.src.indexOf(closing, end)) !== -1) {
                let slashes = 0;
                for (let i = end - 1; i >= 0 && state.src[i] === '\\'; i--) slashes++;
                if (slashes % 2) {
                    end += closing.length;
                    continue;
                }
                // An invalid first closer often belongs to a price or a later
                // expression. Do not consume through it into unrelated math.
                if (!parens && (/\s/.test(state.src[end - 1]) || /\d/.test(state.src[end + 1] || '') || state.src[end - 1] === '$' || state.src[end + 1] === '$')) return false;
                break;
            }
            if (end === -1 || end === start + opening) return false;
            if (!silent) state.push('article_math_inline', 'span', 0).content = state.src.slice(start + opening, end);
            state.pos = end + closing.length;
            return true;
        };
        md.inline.ruler.before('escape', 'article_math', inlineMath);
        titleMd.inline.ruler.before('escape', 'article_math', inlineMath);
        md.block.ruler.before('fence', 'article_math_block', (state, startLine, endLine, silent) => {
            if (state.sCount[startLine] - state.blkIndent >= 4) return false;
            const first = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]).trim();
            const parens = first.startsWith('\\[');
            if (!parens && !first.startsWith('$$')) return false;
            const close = parens ? '\\]' : '$$';
            const parts = [];
            let text = first.slice(2), line = startLine, closed = false;
            while (true) {
                if (text.trimEnd().endsWith(close)) {
                    parts.push(text.trimEnd().slice(0, -2));
                    line++;
                    closed = true;
                    break;
                }
                parts.push(text);
                line++;
                if (line >= endLine) break;
                text = state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
            }
            // A missing delimiter must not turn the rest of an article into a
            // formula. Leave it to the normal Markdown rules instead.
            if (!closed) return false;
            if (silent) return true;
            const token = state.push('article_math_block', 'div', 0);
            token.block = true;
            token.content = parts.join('\n').trim();
            token.map = [startLine, line];
            state.line = line;
            return true;
        }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
        md.renderer.rules.article_math_inline = titleMd.renderer.rules.article_math_inline = (tokens, index) => {
            const expression = tokens[index].content;
            return `<span class="markdown-math-inline" data-math="${escape(expression)}" data-math-display="false">${escape('\\(' + expression + '\\)')}</span>`;
        };
        md.renderer.rules.article_math_block = (tokens, index) => {
            const expression = tokens[index].content;
            return `<div class="markdown-equation" data-math="${escape(expression)}" data-math-display="true"><pre class="markdown-math-source">${escape(expression)}</pre></div>\n`;
        };

        // Convert alert blockquotes structurally, preserving their nested blocks.
        md.core.ruler.after('block', 'article_callouts', state => {
            for (let i = 0; i < state.tokens.length; i++) {
                const opening = state.tokens[i];
                if (opening.type !== 'blockquote_open' || state.tokens[i + 1]?.type !== 'paragraph_open') continue;
                const inline = state.tokens[i + 2];
                if (inline?.type !== 'inline') continue;
                const match = inline.content.match(/^\[!([a-z]+)\](?:[ \t]+([^\n]*))?(?:\n|$)/i);
                const kind = match?.[1].toLowerCase();
                if (!kind || !Object.hasOwn(callouts, kind)) continue;
                const ending = state.tokens.find((token, index) => index > i && token.type === 'blockquote_close' && token.level === opening.level);
                if (!ending) continue;
                opening.type = 'article_callout_open';
                opening.meta = { kind, title: match[2] || '' };
                ending.type = 'article_callout_close';
                inline.content = inline.content.slice(match[0].length);
                if (!inline.content.trim()) state.tokens.splice(i + 1, 3);
            }
        });
        md.renderer.rules.article_callout_open = (tokens, index, _opts, env) => {
            const { kind, title } = tokens[index].meta;
            return `<aside class="markdown-callout markdown-callout-${kind}" aria-label="${escape(callouts[kind])}"><div class="markdown-callout-heading"><span class="markdown-callout-label">${escape(callouts[kind])}</span>${title ? `<h3 class="markdown-callout-title">${titleMd.renderInline(title, env)}</h3>` : ''}</div><div class="markdown-callout-body">\n`;
        };
        md.renderer.rules.article_callout_close = () => '</div></aside>\n';

        md.core.ruler.after('inline', 'article_tasks', state => {
            for (let i = 2; i < state.tokens.length; i++) {
                const inline = state.tokens[i], paragraph = state.tokens[i - 1], item = state.tokens[i - 2];
                if (inline.type !== 'inline' || paragraph.type !== 'paragraph_open' || item.type !== 'list_item_open') continue;
                const first = inline.children?.[0];
                const match = first?.type === 'text' && first.content.match(/^\[([ xX])\]\s+/);
                if (!match) continue;
                first.content = first.content.slice(match[0].length);
                item.attrJoin('class', 'task-list-item');
                for (let j = i - 3; j >= 0; j--) {
                    if (['bullet_list_open', 'ordered_list_open'].includes(state.tokens[j].type) && state.tokens[j].level < item.level) {
                        state.tokens[j].attrJoin('class', 'markdown-task-list');
                        break;
                    }
                }
                const input = new state.Token('html_inline', '', 0);
                const label = inline.children.map(token => token.content || '').join('').trim() || 'Task';
                input.content = `<input class="markdown-task-checkbox" type="checkbox" disabled${match[1].toLowerCase() === 'x' ? ' checked' : ''} aria-label="${escape(label)}"> `;
                inline.children.unshift(input);
            }
        });

        md.core.ruler.after('inline', 'article_figures', state => {
            for (let i = 0; i < state.tokens.length - 2; i++) {
                if (state.tokens[i].type !== 'paragraph_open' || state.tokens[i + 1].type !== 'inline' || state.tokens[i + 2].type !== 'paragraph_close') continue;
                const children = state.tokens[i + 1].children.filter(token => token.type !== 'text' || token.content.trim());
                if (children.length !== 1 || children[0].type !== 'image') continue;
                const token = new state.Token('article_figure', 'figure', 0);
                token.block = true;
                token.meta = { image: children[0] };
                state.tokens.splice(i, 3, token);
            }
        });
        const defaultImage = md.renderer.rules.image;
        md.renderer.rules.image = titleMd.renderer.rules.image = (tokens, index, opts, env, self) => {
            const token = tokens[index];
            const url = resolveUrl(token.attrGet('src'), env.source, pageURL, true);
            if (!url) return escape(token.content);
            token.attrSet('src', url);
            token.attrJoin('class', 'markdown-image' + (/\.diagram\.svg(?:[?#]|$)/i.test(url) ? ' markdown-image-diagram' : ''));
            token.attrSet('loading', 'lazy');
            token.attrSet('decoding', 'async');
            return defaultImage(tokens, index, opts, env, self);
        };
        md.renderer.rules.article_figure = (tokens, index, opts, env, self) => {
            const token = tokens[index].meta.image;
            const caption = token.attrGet('title') || '';
            const label = token.content || caption || 'Image';
            return `<figure class="markdown-figure"><button class="markdown-image-button" type="button" data-image-open aria-label="${escape('Enlarge image: ' + label)}">${md.renderer.rules.image([token], 0, opts, env, self)}</button>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>\n`;
        };

        const defaultLink = md.renderer.rules.link_open || ((tokens, index, opts, _env, self) => self.renderToken(tokens, index, opts));
        md.renderer.rules.link_open = titleMd.renderer.rules.link_open = (tokens, index, opts, env, self) => {
            const token = tokens[index];
            token.attrSet('href', resolveUrl(token.attrGet('href'), env.source, pageURL));
            return defaultLink(tokens, index, opts, env, self);
        };

        md.core.ruler.after('inline', 'article_headings', state => {
            const used = state.env.usedIds;
            for (let i = 0; i < state.tokens.length - 2; i++) {
                const heading = state.tokens[i];
                if (heading.type !== 'heading_open') continue;
                const inline = state.tokens[i + 1];
                const text = inline.children.map(token => token.content || '').join('');
                let base = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
                if (/^fn(?:ref)?-/.test(base)) base = 'section-' + base;
                let id = base, suffix = 2;
                while (used.has(id)) id = `${base}-${suffix++}`;
                used.add(id);
                heading.attrSet('id', id);
                if (heading.tag === 'h1') { heading.tag = 'h2'; state.tokens[i + 2].tag = 'h2'; }
            }
        });

        md.renderer.rules.fence = (tokens, index) => {
            const token = tokens[index], info = token.info.trim();
            const language = (info.match(/^[\w+-]+/) || [''])[0].toLowerCase();
            const title = info.match(/\btitle=(?:"([^"]+)"|'([^']+)'|(\S+))/);
            const label = title ? (title[1] || title[2] || title[3]) : language || 'Code';
            let code = escape(token.content), highlighted = false;
            if (root.hljs && token.content.length <= 50000 && root.hljs.getLanguage(language) && !['text', 'plaintext'].includes(language)) {
                try { code = root.hljs.highlight(token.content, { language, ignoreIllegals: true }).value; highlighted = true; } catch { /* Plain code remains usable. */ }
            }
            return `<div class="markdown-code-block"><div class="markdown-code-toolbar"><span class="markdown-code-language">${escape(label)}</span><div class="markdown-code-actions"><button class="markdown-code-wrap" type="button" data-code-wrap aria-pressed="false">Wrap</button><button class="markdown-code-copy" type="button" data-code-copy aria-live="polite" aria-atomic="true">Copy</button></div></div><pre tabindex="0"><code class="${language ? 'language-' + escape(language) : ''}${highlighted ? ' hljs' : ''}"${highlighted ? ' data-highlighted="yes"' : ''}>${code}</code></pre></div>\n`;
        };
        md.renderer.rules.code_block = (tokens, index) => md.renderer.rules.fence([{ ...tokens[index], info: '' }], 0);
        md.renderer.rules.table_open = () => '<div class="markdown-table-block"><div class="markdown-table-toolbar"><span>Table</span><button class="markdown-table-copy" type="button" data-table-copy aria-live="polite" aria-atomic="true">Copy table</button></div><div class="markdown-table-wrapper" role="region" aria-label="Scrollable data table" tabindex="0"><table class="markdown-table">\n';
        md.renderer.rules.table_close = () => '</table></div></div>\n';
        for (const kind of ['th_open', 'td_open']) {
            md.renderer.rules[kind] = (tokens, index, opts, _env, self) => {
                const token = tokens[index];
                const align = token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1] || 'left';
                token.attrJoin('class', 'markdown-table-align-' + align);
                if (kind === 'th_open') token.attrSet('scope', 'col');
                return self.renderToken(tokens, index, opts);
            };
        }

        return Object.freeze({
            render(markdown, source, settings = {}) {
                const env = { source, usedIds: new Set(settings.reservedIds || []), docId: settings.documentId || 'article' };
                return md.render(String(markdown).replace(/\r\n?/g, '\n'), env);
            }
        });
    }

    root.MarkdownArticleEngine = Object.freeze({ create, resolveUrl });
})(globalThis);
