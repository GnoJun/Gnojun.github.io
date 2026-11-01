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
        md.use(root.markdownitContainer, 'quiz', {
            validate: params => /^quiz(?:\s|$)/.test(params.trim())
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
                input.meta = { articleTaskChecked: match[1].toLowerCase() === 'x' };
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

        // Extract quizzes after ordinary inline, task, figure, and heading rules.
        // Their content still uses the same safe Markdown renderer as the article.
        md.core.ruler.after('footnote_tail', 'article_quizzes', state => {
            for (let i = 0; i < state.tokens.length; i++) {
                const opening = state.tokens[i];
                if (opening.type !== 'container_quiz_open') continue;
                const end = state.tokens.findIndex((token, index) => index > i &&
                    token.type === 'container_quiz_close' && token.level === opening.level);
                if (end < 0) continue;
                const body = state.tokens.slice(i + 1, end);
                const level = opening.level + 1;
                const token = new state.Token('article_quiz', '', 0);
                token.block = true;
                token.meta = { kind: '', prompt: [], choices: [], explanation: [], fallback: body, error: '' };
                const quiz = token.meta;
                const header = opening.info.trim().match(/^quiz\s+(choice|numeric)(?:\s+(.*))?$/);
                if (!header) quiz.error = 'Use :::quiz choice or :::quiz numeric answer=... .';
                else {
                    quiz.kind = header[1];
                    let remaining = header[2] || '';
                    const attributes = {};
                    while (remaining && !quiz.error) {
                        const match = remaining.match(/^([a-z]+)=(?:"([^"]*)"|'([^']*)'|(\S+))(?:\s+|$)/);
                        if (!match || Object.hasOwn(attributes, match[1])) {
                            quiz.error = 'Quiz settings must be unique name=value pairs.';
                            break;
                        }
                        attributes[match[1]] = match[2] ?? match[3] ?? match[4];
                        remaining = remaining.slice(match[0].length);
                    }
                    if (quiz.kind === 'choice' && Object.keys(attributes).length) {
                        quiz.error = 'Choice quizzes do not take numeric settings.';
                    } else if (quiz.kind === 'numeric') {
                        const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
                        const finite = value => typeof value === 'string' && number.test(value) && Number.isFinite(Number(value));
                        if (Object.keys(attributes).some(key => !['answer', 'unit', 'tolerance'].includes(key)) ||
                            !finite(attributes.answer) ||
                            (attributes.tolerance !== undefined && (!finite(attributes.tolerance) || Number(attributes.tolerance) < 0))) {
                            quiz.error = 'Numeric quizzes need a finite answer and an optional non-negative tolerance.';
                        }
                        quiz.answer = Number(attributes.answer);
                        quiz.unit = attributes.unit || '';
                        quiz.tolerance = Number(attributes.tolerance || 0);
                        if (/\s/.test(quiz.unit)) quiz.error = 'Use a unit without spaces, such as V, mA, or ohm.';
                    }
                }
                if (body.some(part => part.type === 'container_quiz_open')) {
                    quiz.error = 'Place each quiz in its own block; quizzes cannot contain other quizzes.';
                }
                const divider = body.findIndex(part => part.type === 'hr' && part.level === level);
                const question = divider < 0 ? body : body.slice(0, divider);
                quiz.explanation = divider < 0 ? [] : body.slice(divider + 1);
                if (quiz.kind === 'choice' && !quiz.error) {
                    let listStart = -1;
                    question.forEach((part, index) => {
                        if (part.type === 'bullet_list_open' && part.level === level) listStart = index;
                    });
                    const listEnd = question.findIndex((part, index) => index > listStart &&
                        part.type === 'bullet_list_close' && part.level === level);
                    if (listStart < 0 || listEnd !== question.length - 1) {
                        quiz.error = 'End the choice question with a list of - [ ] options and one - [x] answer.';
                    } else {
                        quiz.prompt = question.slice(0, listStart);
                        const items = question.slice(listStart + 1, listEnd);
                        for (let j = 0; j < items.length && !quiz.error;) {
                            const itemEnd = items.findIndex((part, index) => index > j &&
                                part.type === 'list_item_close' && part.level === items[j].level);
                            const content = items.slice(j + 1, itemEnd);
                            const inline = content[1];
                            const marker = inline?.children?.[0];
                            if (items[j].type !== 'list_item_open' || itemEnd < 0 || content.length !== 3 ||
                                content[0].type !== 'paragraph_open' || inline.type !== 'inline' ||
                                typeof marker?.meta?.articleTaskChecked !== 'boolean' || !inline.content.replace(/^\[[ xX]\]\s*/, '').trim()) {
                                quiz.error = 'Each choice must be one non-empty Markdown paragraph beginning with - [ ] or - [x].';
                                break;
                            }
                            quiz.choices.push({ correct: marker.meta.articleTaskChecked, children: inline.children.slice(1) });
                            j = itemEnd + 1;
                        }
                        if (quiz.choices.length < 2 || quiz.choices.filter(choice => choice.correct).length !== 1) {
                            quiz.error ||= 'Provide at least two choices and mark exactly one correct answer with [x].';
                        }
                        quiz.answer = quiz.choices.findIndex(choice => choice.correct);
                    }
                } else quiz.prompt = question;
                if (!quiz.prompt.some(part => part.type === 'inline' && part.content.trim())) {
                    quiz.error ||= 'Add a question before the choices or explanation.';
                }
                if (!quiz.error) {
                    let id;
                    const suffixes = ['', '-title', '-prompt', '-input', '-hint', '-feedback'];
                    do { id = 'quiz-' + String(state.env.docId).replace(/[^\w-]/g, '-') + '-' + (++state.env.quizIndex); }
                    while (suffixes.some(suffix => state.env.usedIds.has(id + suffix)));
                    suffixes.forEach(suffix => state.env.usedIds.add(id + suffix));
                    quiz.id = id;
                }
                state.tokens.splice(i, end - i + 1, token);
            }
        });
        md.renderer.rules.article_quiz = (tokens, index, opts, env, self) => {
            const quiz = tokens[index].meta;
            if (quiz.error) return `<aside class="markdown-quiz-error" role="note"><strong>Quiz setup needs attention.</strong> ${escape(quiz.error)}${self.render(quiz.fallback, opts, env)}</aside>\n`;
            const id = escape(quiz.id);
            const render = parts => self.render(parts, opts, env);
            const controls = quiz.kind === 'choice'
                ? `<div class="markdown-quiz-options">${quiz.choices.map((choice, choiceIndex) =>
                    `<label class="markdown-quiz-option"><input type="radio" name="${id}-choice" value="${choiceIndex}"><span class="markdown-quiz-option-text">${self.renderInline(choice.children, opts, env)}</span></label>`
                ).join('')}</div>`
                : `<label class="markdown-quiz-input-label" for="${id}-input">Your answer<input class="markdown-quiz-input" id="${id}-input" name="answer" type="text" autocomplete="off" spellcheck="false" aria-describedby="${id}-hint ${id}-feedback"></label><p class="markdown-quiz-hint" id="${id}-hint">${quiz.unit ? `Enter a number in ${escape(quiz.unit)}, or include a compatible unit.` : 'Enter a number without a unit.'} Scientific notation is accepted.</p>`;
            return `<form class="markdown-quiz" id="${id}" data-quiz-kind="${quiz.kind}" data-quiz-answer="${escape(quiz.answer)}"${quiz.kind === 'numeric' ? ` data-quiz-unit="${escape(quiz.unit)}" data-quiz-tolerance="${escape(quiz.tolerance)}"` : ''} aria-labelledby="${id}-title" novalidate><fieldset class="markdown-quiz-fieldset" aria-describedby="${id}-prompt"><legend class="markdown-quiz-title" id="${id}-title">Quick check</legend><div class="markdown-quiz-prompt" id="${id}-prompt">${render(quiz.prompt)}</div>${controls}<div class="markdown-quiz-actions"><button class="markdown-quiz-submit" type="submit">Check answer</button><button class="markdown-quiz-reset" type="reset">Reset</button></div><p class="markdown-quiz-feedback" id="${id}-feedback" role="status" aria-live="polite" aria-atomic="true"></p>${quiz.explanation.length ? `<div class="markdown-quiz-explanation" hidden><strong>Explanation</strong>${render(quiz.explanation)}</div>` : ''}</fieldset></form>\n`;
        };

        return Object.freeze({
            render(markdown, source, settings = {}) {
                const env = { source, usedIds: new Set(settings.reservedIds || []), docId: settings.documentId || 'article', quizIndex: 0 };
                return md.render(String(markdown).replace(/\r\n?/g, '\n'), env);
            }
        });
    }

    root.MarkdownArticleEngine = Object.freeze({ create, resolveUrl });
})(globalThis);
