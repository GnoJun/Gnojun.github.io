// Run with: node tests/markdown.test.mjs (no packages or network required).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const context = vm.createContext({ URL, console });
for (const path of [
    'js/vendor/markdown-it-15.0.3.min.js',
    'js/vendor/markdown-it-footnote-4.0.0.min.js',
    'js/vendor/markdown-it-container-4.0.0.min.js',
    'js/markdown-engine.js'
]) vm.runInContext(await readFile(new URL(path, root), 'utf8'), context, { filename: path });

const engine = context.MarkdownArticleEngine.create({ pageURL: 'https://site.test/resources/lesson.html' });
const source = '../content/resources/lesson.md';
const render = (text, options) => engine.render(text, source, options);
const fence = String.fromCharCode(96).repeat(3);
const count = (html, pattern) => [...html.matchAll(pattern)].length;
let passed = 0;
function test(name, check) {
    check();
    passed++;
    console.log('PASS ' + name);
}

test('Inline code stays literal and source HTML cannot execute', () => {
    const html = render('Use ' + String.fromCharCode(96) + '**bold** <b> $x$' + String.fromCharCode(96) + '.\n\n<img src=x onerror=alert(1)>');
    assert.ok(html.includes('<code>**bold** &lt;b&gt; $x$</code>'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.doesNotMatch(html, /<(?:img|b)\b|data-math=/);
});
test('Nested emphasis, strikethrough and hard breaks', () => {
    const html = render('**Bold with _emphasis_** and ~~old~~.\n\nFirst  \nSecond');
    assert.ok(html.includes('<strong>Bold with <em>emphasis</em></strong>'));
    assert.ok(html.includes('<s>old</s>'));
    assert.ok(html.includes('First<br>\nSecond'));
});
test('Long fences preserve inner fences and all code punctuation', () => {
    const code = fence + 'js\nconst value = "<div>**literal** & $x$";\n' + fence + '\n';
    const html = render(fence + String.fromCharCode(96) + 'markdown\n' + code + fence + String.fromCharCode(96));
    assert.equal(count(html, /data-code-copy/g), 1);
    assert.ok(html.includes(fence + 'js\nconst value = &quot;&lt;div&gt;**literal** &amp; $x$&quot;;\n' + fence));
    assert.doesNotMatch(html, /data-math=/);
});
test('Tilde fences and indented code receive article controls', () => {
    const html = render('~~~python title="divider.py"\nprint(2.5)\n~~~\n\n    indented = true\n');
    assert.ok(html.includes('>divider.py</span>'));
    assert.equal(count(html, /data-code-wrap/g), 2);
    assert.equal(count(html, /aria-pressed="false"/g), 2);
});
test('All heading levels have unique stable IDs and one shell-owned H1', () => {
    const html = render('# Overview\n\n## Overview\n\n### Overview\n\n#### Four\n\n##### Five\n\n###### Six', { reservedIds: ['overview'] });
    assert.doesNotMatch(html, /<h1\b/);
    assert.ok(html.includes('<h2 id="overview-2">'));
    assert.ok(html.includes('<h2 id="overview-3">'));
    assert.ok(html.includes('<h3 id="overview-4">'));
    assert.doesNotMatch(html, /markdown-heading-anchor|<a\b|<svg\b/);
    assert.equal(count(html, /<h[4-6] id=/g), 3);
});
test('Unicode headings and reserved footnote IDs remain usable', () => {
    const html = render('## 电路分析\n\n## 电路分析\n\n## fn-article-1-1');
    assert.ok(html.includes('id="电路分析"'));
    assert.ok(html.includes('id="电路分析-2"'));
    assert.ok(html.includes('id="section-fn-article-1-1"'));
});
test('Fragment links stay on HTML; paths resolve from the Markdown source', () => {
    const html = render('[Jump](#worked-example) [Read](../../notes/voltage-divider.html) [Mail](mailto:hello@example.com) [Phone](tel:+1234)');
    assert.ok(html.includes('href="#worked-example"'));
    assert.ok(html.includes('href="https://site.test/notes/voltage-divider.html"'));
    assert.ok(html.includes('href="mailto:hello@example.com"'));
    assert.ok(html.includes('href="tel:+1234"'));
});
test('Reference links and automatic web links', () => {
    const html = render('[Example][ref] https://example.org\n\n[ref]: https://example.net "Reference"');
    assert.ok(html.includes('href="https://example.net/" title="Reference"'));
    assert.ok(html.includes('href="https://example.org/"'));
});
test('Executable and data URLs are rejected, including entity obfuscation', () => {
    const html = render('[bad](javascript:alert(1)) [bad](jav&#x61;script:alert(1)) ![bad](data:image/svg+xml,test) [file](file:///secret)');
    assert.doesNotMatch(html, /(?:href|src)="(?:javascript|data|file):/i);
});
test('Ordered-list starts and nested mixed lists survive parsing', () => {
    const html = render('7. First\n8. Second\n   - Child\n     1. Nested\n');
    assert.ok(html.includes('<ol start="7">'));
    assert.equal(count(html, /<ol\b/g), 2);
    assert.equal(count(html, /<ul\b/g), 1);
});
test('Nested tasks are read-only and checked state is explicit', () => {
    const html = render('- [x] Complete\n  - [ ] Pending\n- Ordinary item');
    assert.equal(count(html, /class="markdown-task-checkbox"/g), 2);
    assert.equal(count(html, /type="checkbox" disabled checked/g), 1);
    assert.equal(count(html, /class="task-list-item"/g), 2);
    assert.ok(html.includes('Ordinary item'));
});
test('Blockquotes preserve multiple paragraphs and nesting', () => {
    const html = render('> First paragraph.\n>\n> Second paragraph.\n>\n> > Nested question.');
    assert.equal(count(html, /<blockquote>/g), 2);
    assert.equal(count(html, /<p>/g), 3);
});
test('All callout types preserve rich titles and nested body blocks', () => {
    for (const kind of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'IMPLEMENTED', 'PROTOTYPE', 'TESTING', 'PLANNED']) {
        const html = render('> [!' + kind + '] **Title**\n> Paragraph one.\n>\n> Paragraph two.\n>\n> - Nested item');
        assert.ok(html.includes('markdown-callout-' + kind.toLowerCase()));
        assert.ok(html.includes('<strong>Title</strong>'));
        assert.ok(html.includes('<p>Paragraph two.</p>'));
        assert.ok(html.includes('<li>Nested item</li>'));
    }
});
test('Expandable answers support rich content and nesting inside lists', () => {
    const html = render(':::details **Answer**\n\nA paragraph.\n\n- First\n- Second\n:::\n\n1. Question\n\n   :::details Hint\n   A nested hint.\n   :::');
    assert.equal(count(html, /<details class="markdown-details">/g), 2);
    assert.ok(html.includes('<summary><strong>Answer</strong></summary>'));
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
});
test('Tables preserve alignment and escaped pipes in inline code', () => {
    const html = render('| Left | Center | Right |\n| :--- | :---: | ---: |\n| A | ' + String.fromCharCode(96) + 'mode \\| flags' + String.fromCharCode(96) + ' | 2.5 |');
    assert.ok(html.includes('data-table-copy'));
    assert.ok(html.includes('role="region"'));
    for (const align of ['left', 'center', 'right']) assert.ok(html.includes('markdown-table-align-' + align));
    assert.ok(html.includes('<code>mode | flags</code>'));
    assert.equal(count(html, /scope="col"/g), 3);
});
test('Inline math supports both delimiters without touching code', () => {
    const html = render('Ohm: $V = IR$. Also \\(R=V/I\\). ' + String.fromCharCode(96) + '$literal$' + String.fromCharCode(96));
    assert.equal(count(html, /data-math-display="false"/g), 2);
    assert.ok(html.includes('<code>$literal$</code>'));
});
test('Currency and double-dollar text do not consume following inline equations', () => {
    const html = render('Costs $5.00, with $x$ math. Prices $5 and $10. Escaped \\$5. Two $$x$$ then $y$.');
    assert.ok(html.includes('Costs $5.00, with <span'));
    assert.equal(count(html, /data-math-display="false"/g), 2);
    assert.ok(html.includes('Two $$x$$ then'));
});
test('Display equations support all documented forms', () => {
    const html = render('$$V=IR$$\n\n$$\nR=V/I\n$$\n\n\\[\nP=VI\n\\]');
    assert.equal(count(html, /data-math-display="true"/g), 3);
    assert.ok(html.includes('data-math="P=VI"'));
});
test('An unfinished display equation preserves the following article', () => {
    const html = render('$$ does not close\n\n## A later section\n\nStill readable.');
    assert.doesNotMatch(html, /data-math-display="true"/);
    assert.ok(html.includes('id="a-later-section"'));
    assert.ok(html.includes('Still readable.'));
});
test('Footnotes stay singular when callouts and details also contain rich titles', () => {
    const html = render('An assumption.[^a]\n\n> [!NOTE] **Title**\n> Body.\n\n:::details More **details**\nAnswer.\n:::\n\n[^a]: The assumption.', { documentId: 'fixture' });
    assert.equal(count(html, /<section class="footnotes">/g), 1);
    assert.equal(count(html, /id="fn-fixture-1"/g), 1);
    assert.ok(html.includes('href="#fnref-fixture-1"'));
});
test('Figures resolve source paths, captions and diagram theme classes safely', () => {
    const html = render('![A resistor diagram](../../images/circuit.diagram.svg?rev=1 "Measured output")');
    assert.ok(html.includes('src="https://site.test/images/circuit.diagram.svg?rev=1"'));
    assert.ok(html.includes('markdown-image-diagram'));
    assert.ok(html.includes('loading="lazy"'));
    assert.ok(html.includes('data-image-open'));
    assert.ok(html.includes('<figcaption>Measured output</figcaption>'));
    const inline = render('A small ![symbol](../../images/symbol.svg) in a sentence.');
    assert.doesNotMatch(inline, /<figure|data-image-open/);
});
test('Source URLs and labels cannot inject HTML attributes', () => {
    const html = render('## A "title"\n\n![A "label"](https://example.org/a.png "A &quot;caption&quot;")\n\n' + fence + 'js title="&lt;img&gt;"\n"<script>"\n' + fence);
    assert.doesNotMatch(html, /<script>|<img>/);
    assert.ok(html.includes('<h2 id="a-title">A &quot;title&quot;</h2>'));
});

const choiceQuiz = ':::quiz choice\nWhich output is **correct**?\n\n- [ ] 5 V\n- [x] $2.5$ V\n- [ ] 0 V\n\n---\n\nEqual resistors divide the input by **two**.\n:::';
const numericQuiz = ':::quiz numeric answer=2.5 unit=V tolerance=0.01\nFind the output voltage.\n\n---\n\n$V_{out}=5/2=2.5$ V.\n:::';
const quizForms = html => [...html.matchAll(/<form\b(?=[^>]*\bclass="[^"]*\bmarkdown-quiz\b)[\s\S]*?<\/form>/g)].map(match => match[0]);

test('Choice quizzes render unselected radio options and hide their explanation', () => {
    const html = render(choiceQuiz);
    const forms = quizForms(html);
    assert.equal(forms.length, 1);
    assert.match(forms[0], /data-quiz-kind="choice"/);
    assert.match(forms[0], /data-quiz-answer="1"/);
    const radios = [...forms[0].matchAll(/<input\b[^>]*\btype="radio"[^>]*>/g)].map(match => match[0]);
    assert.equal(radios.length, 3);
    assert.ok(radios.every(radio => !/\b(?:checked|disabled)\b/.test(radio)));
    assert.match(forms[0], /<strong>correct<\/strong>/);
    assert.match(forms[0], /data-math="2.5"/);
    assert.match(forms[0], /class="markdown-quiz-explanation"[^>]*\bhidden\b/);
    assert.match(forms[0], /Equal resistors divide the input by <strong>two<\/strong>/);
    assert.match(forms[0], /type="submit"[^>]*>Check answer<\/button>/);
    assert.match(forms[0], /type="reset"[^>]*>Reset<\/button>/);
    assert.doesNotMatch(forms[0], /markdown-task-checkbox|\[x\]|\[ \]/);
});

test('Numeric quizzes preserve numeric configuration and an accessible text input', () => {
    const [form] = quizForms(render(numericQuiz));
    assert.ok(form);
    assert.match(form, /data-quiz-kind="numeric"/);
    assert.match(form, /data-quiz-answer="2.5"/);
    assert.match(form, /data-quiz-unit="V"/);
    assert.match(form, /data-quiz-tolerance="0.01"/);
    assert.match(form, /<input\b[^>]*\btype="text"/);
    assert.match(form, /Your answer/);
    assert.match(form, /role="status"/);
    assert.match(form, /aria-live="polite"/);
    const feedback = form.match(/<p\b(?=[^>]*\bclass="markdown-quiz-feedback")[^>]*>/)?.[0];
    assert.ok(feedback);
    assert.doesNotMatch(feedback, /\bhidden\b/, 'The empty live region must be available before feedback is announced');
    const [dimensionless] = quizForms(render(':::quiz numeric answer=4\nHow many?\n:::'));
    assert.ok(dimensionless);
    assert.match(dimensionless, /data-quiz-tolerance="0"/);
});

test('Multiple quizzes receive independent stable radio groups and unique article IDs', () => {
    const markdown = choiceQuiz + '\n\n' + numericQuiz + '\n\n' + choiceQuiz;
    const first = render(markdown, { documentId: 'quiz-a' });
    assert.equal(quizForms(first).length, 3);
    const names = [...first.matchAll(/<input\b[^>]*type="radio"[^>]*>/g)].map(match => match[0].match(/\bname="([^"]+)"/)[1]);
    assert.equal(new Set(names).size, 2);
    assert.equal(names[0], names[1]);
    assert.notEqual(names[0], names[3]);
    const ids = [...first.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(first, render(markdown, { documentId: 'quiz-a' }));
    const other = render(markdown, { documentId: 'quiz-b' });
    assert.ok(!other.includes('name="' + names[0] + '"'));
});

test('Malformed authored quizzes report configuration errors without active forms', () => {
    const malformed = [
        ':::quiz choice\nQuestion\n\n- [ ] A\n- [ ] B\n:::',
        ':::quiz choice\nQuestion\n\n- [x] A\n- [x] B\n:::',
        ':::quiz choice\nQuestion\n\n- [x] A\n:::',
        ':::quiz numeric answer=NaN\nQuestion\n:::',
        ':::quiz numeric answer=Infinity\nQuestion\n:::',
        ':::quiz numeric answer=2 tolerance=-1\nQuestion\n:::',
        ':::quiz unsupported\nQuestion\n:::'
    ];
    for (const markdown of malformed) {
        const html = render('Before the quiz.\n\n' + markdown + '\n\nAfter the quiz.');
        assert.equal(quizForms(html).length, 0, markdown);
        assert.match(html, /markdown-quiz-error/, markdown);
        assert.ok(html.includes('Before the quiz.') && html.includes('After the quiz.'), 'An authoring error should preserve the surrounding article');
    }
});

test('Quiz source fences stay literal and ordinary task lists remain read-only', () => {
    const html = render(fence + 'markdown\n' + choiceQuiz + '\n' + fence + '\n\n- [x] Author task\n\n' + choiceQuiz);
    assert.equal(quizForms(html).length, 1);
    assert.match(html, /:::quiz choice/);
    assert.equal(count(html, /class="markdown-task-checkbox"/g), 1);
    assert.match(html, /type="checkbox" disabled checked/);
});

test('Quiz prompts, options and explanations preserve escaped content and safe links', () => {
    const markdown = ':::quiz choice\n<img src=x onerror=alert(1)>\n\n- [x] <script>alert(1)</script>\n- [ ] [bad](javascript:alert(1))\n\n---\n\n<img src=x onerror=alert(2)>\n:::';
    const [form] = quizForms(render(markdown));
    assert.ok(form);
    assert.doesNotMatch(form, /<script\b|<img\b|href="javascript:/i);
    assert.match(form, /&lt;script&gt;/);
    assert.match(form, /&lt;img src=x onerror=alert\(2\)&gt;/);
});

test('Choice quiz prompts preserve a givens list before the final answer options', () => {
    const markdown = ':::quiz choice\nGiven this voltage divider:\n\n- Input: **5 V**\n- Both resistors: **1 kohm**\n\nWhat is the unloaded output?\n\n- [ ] 5 V\n- [x] 2.5 V\n- [ ] 0 V\n\n---\n\nEqual resistors divide the input by two.\n:::';
    const html = render(markdown);
    const [form] = quizForms(html);
    assert.ok(form);
    assert.doesNotMatch(html, /markdown-quiz-error/);
    assert.match(form, /<ul>\s*<li>Input: <strong>5 V<\/strong><\/li>/);
    assert.match(form, /Both resistors: <strong>1 kohm<\/strong>/);
    assert.match(form, /What is the unloaded output\?/);
    assert.equal(count(form, /type="radio"/g), 3);
    assert.match(form, /data-quiz-answer="1"/);
});

test('Footnotes defined inside a quiz keep their reference and one complete article footer', () => {
    const markdown = ':::quiz choice\nWhich result follows from the measurements?[^data]\n\n- [ ] 5 V\n- [x] 2.5 V\n\n---\n\nThe resistors are equal.\n\n[^data]: A source defined inside the quiz.\n:::';
    const html = render(markdown, { documentId: 'quiz-local' });
    const [form] = quizForms(html);
    assert.ok(form);
    assert.match(form, /href="#fn-quiz-local-1"/);
    assert.equal(count(html, /<section class="footnotes">/g), 1);
    assert.equal(count(html, /id="fn-quiz-local-1"/g), 1);
    assert.match(html, /A source defined inside the quiz\./);
    assert.match(html, /href="#fnref-quiz-local-1"/);
    assert.doesNotMatch(form, /<section class="footnotes">/);
});

vm.runInContext(await readFile(new URL('js/vendor/highlight-11.12.0.min.js', root), 'utf8'), context);
test('Known code languages highlight; unknown or oversized blocks stay plain', () => {
    const html = render(fence + 'javascript\nconst voltage = 2.5;\n' + fence + '\n\n' + fence + 'unknown-language\n<tag>\n' + fence);
    assert.ok(html.includes('hljs-keyword'));
    assert.ok(html.includes('language-unknown-language">&lt;tag&gt;'));
    const long = render(fence + 'javascript\n' + 'const x = 1;\n'.repeat(4500) + fence);
    assert.doesNotMatch(long, /hljs-keyword/);
});

for (const file of [
    'content/resources/markdown-reference.md', 'content/resources/git-workflow.md',
    'content/resources/esp32-s3-n16r8.md', 'content/resources/eele201.md',
    'content/resources/voltage-divider.md', 'content/projects/esp32-lab-station.md',
    'content/resources/circuits-ii.md', 'content/resources/physics-i.md',
    'content/resources/physics-ii.md',
    'content/resources/_resource-template.md', 'content/resources/markdown-template.md'
]) {
    const markdown = await readFile(new URL(file, root), 'utf8');
    test('Article regression: ' + file, () => {
        const html = render(markdown, { documentId: 'regression' });
        assert.ok(html.length > 100);
        assert.doesNotMatch(html, /<h1\b|(?:href|src)="javascript:/i);
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length, 'Every article ID must be unique');
        assert.equal(count(html, /<div class="markdown-code-block">/g), count(html, /data-code-copy/g));
        assert.equal(count(html, /<aside\b/g), count(html, /<\/aside>/g));
        assert.equal(count(html, /<details\b/g), count(html, /<\/details>/g));
    });
}
console.log('\n' + passed + ' Markdown tests passed.');
