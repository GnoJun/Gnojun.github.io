## Overview

This page is a living reference for the Markdown syntax used throughout the engineering portfolio.

The important idea is simple:

- The `.md` file stores technical content.
- `markdown-renderer.js` converts supported Markdown into HTML.
- `style.css` controls how the generated HTML looks.
- `markdown-navigation.js` reads generated `h2` headings to build the sticky section navigation and reading progress.



## Main Section Headings

Use an H2 for a major document section.

### Syntax

```text

## Overview
```


The heading for this section is itself the rendered example.

### Generated HTML

```html

<h2 id="overview">
    Overview
</h2>
```

### CSS



*.markdown-document h2*


H2 headings are also the headings used by the automatic Markdown table of contents.


## Subsection Headings

Use an H3 inside a major H2 section.

### Syntax

```text

### Why I am building it
```


### Why I am building it

This is an H3 subsection inside the current Markdown document.

### CSS



*.markdown-document h3*



## Paragraphs

Normal text becomes a paragraph automatically.

### Syntax

```text

This is a normal paragraph.

A blank line begins another paragraph.
```


This is a normal paragraph written in the Markdown document.

A blank line creates another paragraph and keeps the document easy to scan.

### CSS



*.markdown-document p*



## Bold and Italic Text

Use bold for important technical terms and italic text for lighter emphasis.

### Syntax

```text

**Important value**

*Secondary emphasis*
```



**Important value**

*Secondary emphasis*

### CSS


*.markdown-document strong*


Italic text currently inherits the surrounding Markdown text styling.


## Inline Code

Use inline code for GPIO names, commands, filenames, variables, and short technical values.

### Syntax

```text

Use `GPIO 8` for SDA.

Open `markdown-renderer.js`.

Run `git status`.
```



Use `GPIO 8` for SDA.

Open `markdown-renderer.js`.

Run `git status`.

### CSS


*.markdown-document :not(pre) > code*


Inline code is especially useful for values that should visually remain distinct from normal prose.


## Links

Use standard Markdown link syntax.

### Syntax

```text

[Open the Resources page](../../resources.html)
```



[Open the Resources page](../../resources.html)

### CSS


*.markdown-document a*


## Unordered Lists

Use a hyphen or asterisk for unordered items.

### Syntax

```text

- ESP32-S3
- OLED display
- Physical buttons
- I2C peripherals
```



- ESP32-S3
- OLED display
- Physical buttons
- I2C peripherals

### CSS


*.markdown-document ul*
*.markdown-document li*


## Ordered Lists

Use numbered items when sequence matters.

### Syntax

```text

1. Build the circuit.
2. Upload the firmware.
3. Verify the output.
4. Document the result.
```



1. Build the circuit.
2. Upload the firmware.
3. Verify the output.
4. Document the result.

### CSS


*.markdown-document ol*
*.markdown-document li*



## Blockquotes

Use a blockquote for an important note that does not need a custom status block.

### Syntax

```text

> The goal is to create a portable learning tool, not replace professional laboratory equipment.
```



> The goal is to create a portable learning tool, not replace professional laboratory equipment.

### CSS



*.markdown-document blockquote*



## Code Blocks

Use fenced code blocks for commands, source code, configuration, or longer technical examples.

The opening fence is three backticks followed by an optional language name. The closing fence is another three backticks.



```cpp

const int buzzerPin = 42;

void setup() {
    pinMode(
        buzzerPin,
        OUTPUT
    );
}
```

### Generated structure

```html

<pre>
    <code class="language-cpp">
        ...
    </code>
</pre>
```

### CSS



*.markdown-document pre*
*.markdown-document pre code*


The language class is stored in the generated HTML even though syntax highlighting is not currently provided by a separate library.


## Images

Images can include alt text and an optional caption.

### Syntax

```text

![Voltage divider circuit schematic](../../images/lab-notes/voltage-divider/circuit-diagram.diagram.svg "Basic two-resistor voltage divider")
```

![Voltage divider circuit schematic](../../images/lab-notes/voltage-divider/circuit-diagram.diagram.svg "Basic two-resistor voltage divider")

### Generated structure

```html

<figure class="markdown-figure">
    <img
        class="markdown-image"
        ...
    >
    <figcaption>
        Prototype hardware layout
    </figcaption>
</figure>
```

### CSS


*.markdown-figure*

*.markdown-image*

*.markdown-figure figcaption*

An SVG filename ending in `.diagram.svg` receives the additional class:

```css

.markdown-image-diagram
```

That class is useful for theme-aware engineering diagrams.


## Display Equations

The Markdown renderer recognizes display-equation blocks surrounded by `$$`.

### Syntax concept

```text

$$

V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}

$$
```


$$
V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}
$$


### Generated structure

```html

<div
    class="markdown-equation"
    data-math="..."
    data-math-display="true"
></div>
```

The actual mathematical typesetting depends on KaTeX being loaded by the HTML page.

### Related JavaScript

```text

renderMathElements()
```

### Main CSS / HTML hook

```text

.markdown-equation
```


## Engineering Tables

Tables are a portfolio extension rather than a basic feature of the original lightweight renderer.

When table support is enabled in the current `markdown-renderer.js`, use this pattern:

### Syntax

```text

| Function | GPIO | Status |
| :--- | :---: | :--- |
| I2C SDA | GPIO 8 | Confirmed |
| I2C SCL | GPIO 9 | Confirmed |
```

| Function | GPIO | Status |
| :--- | :---: | :--- |
| I2C SDA | GPIO 8 | Confirmed |
| I2C SCL | GPIO 9 | Confirmed |

Alignment markers mean:

- `:---` = left
- `:---:` = center
- `---:` = right

Typical CSS hooks for the table extension are:

```css

.markdown-table-wrapper
.markdown-table
.markdown-table-align-left
.markdown-table-align-center
.markdown-table-align-right
```

For compact technical tokens such as `GPIO 8`, the table-specific inline-code rule should prevent unwanted wrapping on narrow screens.


## Callout and Status Blocks

Callouts are another portfolio extension used for engineering notes and project status.

### Syntax pattern

```text

> [!IMPLEMENTED] OLED Menu System
> Multi-level navigation is working.
```

Common status types used by the portfolio include:

- `NOTE`
- `WARNING`
- `IMPLEMENTED`
- `PROTOTYPE`
- `TESTING`
- `PLANNED`

Typical CSS hooks for the callout extension are:

```css

.markdown-callout
.markdown-callout-title
.markdown-callout-body
.markdown-callout-implemented
.markdown-callout-prototype
.markdown-callout-testing
.markdown-callout-planned
.markdown-callout-warning
```

Keep the status word meaningful in text so the design does not depend on color alone.


## Automatic Table of Contents

The HTML page contains an empty list:

```html

<ul
    class="project-toc-list"
    data-markdown-toc-list
></ul>
```

After Markdown is rendered, `markdown-navigation.js` finds the generated H2 headings and creates the TOC automatically.

For example:

```text

## Overview
## Code Blocks
## Images
```

becomes navigation similar to:

```text

Overview | Code Blocks | Images
```

### CSS

```css

.project-toc
.project-toc-list
.project-toc-link
```

### Main JavaScript

```text

markdown-navigation.js
```


## Reading Progress

The Markdown navigation also controls the reading progress bar.

The HTML shell provides:

```html

<div
    class="markdown-reading-progress"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="0"
>
    <span
        class="markdown-reading-progress-bar"
        aria-hidden="true"
    ></span>
</div>
```

The progress is calculated from the Markdown document rather than from unrelated footer content.

### Main hooks

```css

.markdown-reading-progress
.markdown-reading-progress-bar
```


## Markdown Navigation Toggle

On pages that use the collapsible navigation version, the HTML shell contains the navigation toggle button.

The button belongs to the HTML shell, not the Markdown document itself.

### Main hooks

```text

data-markdown-navigation-toggle
.markdown-navigation-toggle
.markdown-navigation-toggle-icon
```

The Markdown content does not need to know whether the TOC is expanded or collapsed.


## Markdown to CSS Quick Map

### H2

```text

Markdown: ## Title
HTML:     <h2>
CSS:      .markdown-document h2
```

### H3

```text

Markdown: ### Title
HTML:     <h3>
CSS:      .markdown-document h3
```

### Paragraph

```text

Markdown: normal text
HTML:     <p>
CSS:      .markdown-document p
```

### Bold

```text

Markdown: **text**
HTML:     <strong>
CSS:      .markdown-document strong
```

### Inline code

```text

Markdown: `GPIO 8`
HTML:     <code>
CSS:      .markdown-document :not(pre) > code
```

### Link

```text

Markdown: [label](url)
HTML:     <a>
CSS:      .markdown-document a
```

### Unordered list

```text

Markdown: - item
HTML:     <ul><li>
CSS:      .markdown-document ul
```

### Ordered list

```text

Markdown: 1. item
HTML:     <ol><li>
CSS:      .markdown-document ol
```

### Blockquote

```text

Markdown: > note
HTML:     <blockquote>
CSS:      .markdown-document blockquote
```

### Code block

```text

Markdown: fenced code block
HTML:     <pre><code>
CSS:      .markdown-document pre
```

### Image

```text

Markdown: ![alt](path "caption")
HTML:     <figure><img><figcaption>
CSS:      .markdown-figure
```


## Typical Project Section

A practical project section might look like this:

### Markdown pattern

```text

## Testing

### PWM Verification

Describe what was tested, the equipment used,
the expected result, and the measured result.

Use inline code for values such as GPIO 42,
1 kHz, 50%, or filenames.

Add a short list for observations:

- Output remained stable.
- Duty cycle matched the target.
- Additional low-frequency testing is required.
```



The result should visually read as:

1. Major H2 section.
2. Smaller H3 subsection.
3. Technical paragraph.
4. Inline technical tokens.
5. Supporting list or other engineering element.

This structure keeps project case studies consistent without putting presentation markup inside the Markdown file.


## Rules for This Portfolio

Use H2 only for major document sections.

Use H3 for subsections inside an H2.

Use inline code for GPIO names, filenames, commands, variables, and short measured values.

Use code blocks for multiline code or command sequences.

Use blockquotes for simple notes.

Use callouts only when a specific status or warning meaning is useful.

Use tables for structured engineering data rather than for general page layout.

Keep CSS in `style.css` and content in Markdown.

Do not put page-specific presentation HTML into the `.md` file unless the renderer intentionally supports that feature.

The Markdown system should remain controlled and predictable rather than trying to implement every possible Markdown feature.
