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
const pdfBlock = (settings, body = '') => [':::pdf ' + settings, '', body, ':::'].join('\n');

test('PDF cards resolve article paths and offer open, download, and collapsed preview controls', () => {
    const html = render(pdfBlock('src="../../files/courses/phsx220/practice-exam-a.pdf" title="Practice Exam A" download="220-Final Exam-Practice Exam A.pdf"',
        '**12 pages.** Read the [review](#review) and check $x=3$.\n\n- Questions: pages 1-6\n- Solutions: pages 7-12'));
    assert.match(html, /class="markdown-pdf"/);
    assert.match(html, /<h3\b[^>]*class="markdown-pdf-title"[^>]*>Practice Exam A<\/h3>/);
    assert.equal(count(html, /href="https:\/\/site\.test\/files\/courses\/phsx220\/practice-exam-a\.pdf"/g), 2);
    assert.match(html, /<a\b[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
    assert.match(html, /download="220-Final Exam-Practice Exam A\.pdf"/);
    assert.match(html, /<details\b[^>]*class="markdown-details"/);
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
    assert.match(html, /<iframe\b[^>]*class="markdown-pdf-preview"/);
    assert.match(html, /src="https:\/\/site\.test\/files\/courses\/phsx220\/practice-exam-a\.pdf#view=FitH"/);
    assert.match(html, /<iframe\b[^>]*title="[^"]*Practice Exam A[^"]*"/);
    assert.match(html, /<iframe\b[^>]*loading="lazy"/);
    assert.match(html, /<strong>12 pages\.<\/strong>/);
    assert.match(html, /href="#review"/);
    assert.match(html, /data-math="x=3"/);
    assert.match(html, /<li>Questions: pages 1-6<\/li>/);
});

test('PDF defaults use the decoded filename and preserve external query strings and preview fragments', () => {
    const html = render(pdfBlock("src='https://example.org/Practice%20Exam.PDF?version=2&part=all#page=3'"));
    assert.match(html, /class="markdown-pdf-title"[^>]*>Practice Exam\.PDF<\/h3>/);
    assert.match(html, /download="Practice Exam\.PDF"/);
    assert.match(html, /src="https:\/\/example\.org\/Practice%20Exam\.PDF\?version=2&amp;part=all#page=3"/);
    assert.doesNotMatch(html, /#page=3#|#page=3&amp;view=/);
    const plain = render(pdfBlock('src=http://example.org/exam.pdf'));
    assert.match(plain, /href="http:\/\/example\.org\/exam\.pdf"/);
    assert.match(plain, /src="http:\/\/example\.org\/exam\.pdf#view=FitH"/);
});

test('Malformed PDF settings preserve surrounding content without creating active file controls', () => {
    for (const settings of [
        '', 'title="Missing file"', 'src=""', 'src="../../files/exam.pdf',
        'src="../../files/exam.pdf" src="../../files/other.pdf"',
        'src="../../files/exam.pdf" unknown=setting',
        'src="../../files/exam.pdf" stray text',
        'src="javascript:alert(1)"', 'src="jav&#x61;script:alert(1)"',
        'src="data:application/pdf;base64,JVBERi0="', 'src="file:///private/exam.pdf"',
        'src="mailto:exam.pdf@example.org"', 'src="https://example.org/page.html?file=exam.pdf"',
        'src="https://example.org/exam.pdf/"'
    ]) {
        const html = render('Before the PDF.\n\n' + pdfBlock(settings, '**Description remains readable.**') + '\n\nAfter the PDF.');
        assert.match(html, /markdown-pdf-error/, settings);
        assert.doesNotMatch(html, /<(?:iframe|a)\b|\bdownload=/, settings);
        assert.ok(html.includes('Before the PDF.') && html.includes('After the PDF.'), settings);
        assert.match(html, /<strong>Description remains readable\.<\/strong>/, settings);
    }
});

test('PDF labels and descriptions cannot inject HTML or executable attributes', () => {
    const html = render(pdfBlock("src='../../files/exam.pdf' title='<img src=x onerror=alert(1)>' download='Exam & Review.pdf'",
        '<script>alert(2)</script>\n\n<img src=x onerror=alert(3)>'));
    assert.doesNotMatch(html, /<(?:script|img)\b/);
    const preview = html.match(/<iframe\b([^>]*)>/)?.[1];
    assert.ok(preview);
    const attributes = [...preview.matchAll(/(?:^|\s)([\w:-]+)="[^"]*"/g)].map(match => match[1]);
    assert.ok(attributes.every(name => !/^on/i.test(name)), 'Escaped title text must not become an event attribute');
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
    assert.match(html, /download="Exam &amp; Review\.pdf"/);
});

test('PDF cards remain usable in details and lists, and code examples stay literal', () => {
    const markdown = '::::details Course files\n\n' + pdfBlock('src="../../files/a.pdf" title="Shared title"') + '\n::::\n\n' +
        '1. Read the next file.\n\n' + pdfBlock('src="../../files/b.pdf" title="Shared title"').split('\n').map(line => '   ' + line).join('\n') +
        '\n\n' + fence + 'markdown\n' + pdfBlock('src="../../files/example.pdf"') + '\n' + fence;
    const html = render(markdown);
    assert.equal(count(html, /<iframe\b/g), 2);
    assert.equal(count(html, /<details\b/g), 3);
    assert.equal(count(html, /<details\b/g), count(html, /<\/details>/g));
    assert.match(html, /<ol>\s*<li>/);
    assert.match(html, /:::pdf src=&quot;\.\.\/\.\.\/files\/example\.pdf&quot;/);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
});

test('Footnotes in PDF descriptions retain one complete article footnote section', () => {
    const html = render(pdfBlock('src="../../files/exam.pdf" title="Exam"', 'Original answer key included.[^key]\n\n[^key]: Check the corrections in the review.'), { documentId: 'pdf-notes' });
    assert.match(html, /href="#fn-pdf-notes-1"/);
    assert.match(html, /href="#fnref-pdf-notes-1"/);
    assert.equal(count(html, /<section class="footnotes">/g), 1);
    assert.equal(count(html, /id="fn-pdf-notes-1"/g), 1);
    assert.match(html, /Check the corrections in the review\./);
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

test('Monochrome diagram opt-in supports raster images and preserves ordinary photos', () => {
    for (const extension of ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'PNG', 'SVG']) {
        const path = `../../images/circuit.diagram.${extension}?revision=2#detail`;
        const html = render(`![A monochrome circuit](${path})`);
        assert.match(html, /class="markdown-image markdown-image-diagram"/, extension);
        assert.ok(html.includes(`src="https://site.test/images/circuit.diagram.${extension}?revision=2#detail"`), extension);
    }
    for (const filename of ['hardware.webp', 'circuit.png', 'diagram.svg', 'circuit.diagram.png.backup', 'photo.jpg?name=circuit.diagram.png']) {
        const html = render(`![Ordinary image](../../images/${filename})`);
        assert.match(html, /class="markdown-image"/, filename);
        assert.doesNotMatch(html, /markdown-image-diagram/, filename);
    }
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

test('Quiz question and explanation images keep source paths, captions, zoom, and theme opt-in', () => {
    for (const settings of ['choice', 'numeric answer=2.5 unit=V']) {
        const choices = settings === 'choice' ? '\n\n- [ ] 5 V\n- [x] 2.5 V' : '';
        const markdown = ':::quiz ' + settings + '\nFind the output of this divider.\n\n' +
            '![A divider diagram](../../images/question.diagram.png "Question circuit")' + choices +
            '\n\n---\n\nCompare the predicted value with this measurement.\n\n' +
            '![A measured circuit](../../images/measurement.webp "Measured output")\n:::';
        const [form] = quizForms(render(markdown));
        assert.ok(form, settings);
        assert.equal(count(form, /<figure class="markdown-figure">/g), 2);
        assert.equal(count(form, /data-image-open/g), 2);
        const prompt = form.slice(form.indexOf('class="markdown-quiz-prompt"'), form.indexOf('class="markdown-quiz-actions"'));
        assert.match(prompt, /src="https:\/\/site\.test\/images\/question\.diagram\.png"/);
        assert.match(prompt, /markdown-image-diagram/);
        assert.match(prompt, /<figcaption>Question circuit<\/figcaption>/);
        const explanation = form.slice(form.indexOf('class="markdown-quiz-explanation"'));
        assert.match(explanation, /^class="markdown-quiz-explanation" hidden>/);
        assert.match(explanation, /src="https:\/\/site\.test\/images\/measurement\.webp"/);
        assert.match(explanation, /<figcaption>Measured output<\/figcaption>/);
        assert.doesNotMatch(explanation, /markdown-image-diagram/);
    }
});

test('A standalone image can be the complete choice or numeric quiz prompt', () => {
    for (const settings of ['choice', 'numeric answer=2.5 unit=V']) {
        const choices = settings === 'choice' ? '\n\n- [ ] 5 V\n- [x] 2.5 V' : '';
        const markdown = ':::quiz ' + settings + '\n' +
            '![Calculate the voltage shown by the divider](../../images/circuit.diagram.svg)' + choices +
            '\n\n---\n\nEqual resistors divide the voltage by two.\n:::';
        const html = render(markdown);
        const [form] = quizForms(html);
        assert.ok(form, settings);
        assert.doesNotMatch(html, /markdown-quiz-error/);
        assert.match(form, /<figure class="markdown-figure">/);
        assert.match(form, /alt="Calculate the voltage shown by the divider"/);
        assert.match(form, /data-image-open/);
    }
});

test('Quiz image URLs cannot enable executable content', () => {
    const markdown = ':::quiz numeric answer=2.5\nInspect the circuit.\n\n' +
        '![Bad](data:image/svg+xml,boom)\n\n---\n\n' +
        '![Bad](javascript:alert(1))\n\n![Bad](file:///private/circuit.diagram.png)\n:::';
    const [form] = quizForms(render(markdown));
    assert.ok(form);
    assert.doesNotMatch(form, /(?:src|href)="(?:data|javascript|file):/i);
    assert.doesNotMatch(form, /<script\b|\bonerror=/i);
});

const formulaReference = ':::reference Ohm\'s law\n$$\nV = IR\n$$\n\n| Symbol | Meaning | Unit |\n| --- | --- | --- |\n| $V$ | Voltage | V |\n| $I$ | Current | A |\n| $R$ | Resistance | ohm |\n\n[Read the note](../../notes/voltage-divider.html)\n:::';

test('Author-selected references preserve equations, symbol tables and source links', () => {
    const html = render(formulaReference);
    assert.match(html, /class="markdown-reference"/);
    assert.match(html, /\bdata-markdown-reference(?:="[^"]*")?/);
    assert.match(html, /data-reference-title="Ohm(?:&#39;|')s law"/);
    assert.match(html, /class="markdown-reference-body"/);
    assert.match(html, /data-math="V = IR"/);
    assert.match(html, /<th[^>]*>Symbol<\/th>/);
    assert.match(html, /Resistance/);
    assert.match(html, /href="https:\/\/site\.test\/notes\/voltage-divider\.html"/);
    assert.doesNotMatch(html, /<h1\b/);
});

test('Reference anchors stay unique and stable beside matching headings and reserved IDs', () => {
    const markdown = '## Reference Ohms Law\n\n' + formulaReference + '\n\n' + formulaReference;
    const settings = { reservedIds: ['reference-ohms-law'], documentId: 'reference-fixture' };
    const html = render(markdown, settings);
    const sections = [...html.matchAll(/<section\b(?=[^>]*\bdata-markdown-reference)[^>]*\bid="([^"]+)"[^>]*>/g)];
    assert.equal(sections.length, 2);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(sections.every(match => match[1] !== 'reference-ohms-law'));
    assert.equal(html, render(markdown, settings));
});

test('Reference examples in fences remain literal and titles cannot inject attributes', () => {
    const html = render(fence + 'markdown\n' + formulaReference + '\n' + fence + '\n\n:::reference <img src=x onerror=alert(1)>\nA safe explanation and $I$.\n:::');
    assert.equal(count(html, /\bdata-markdown-reference(?:[\s=>])/g), 1);
    assert.match(html, /:::reference Ohm/);
    assert.doesNotMatch(html, /<img\b|<script\b/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
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
