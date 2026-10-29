# Resources

Notes, components, and references now share one library and one publishing workflow.

## Files

- `resources.html`: searchable list with type, topic, and date/title filters.
- `js/resources-data.js`: the single `resourceLibrary` catalogue, also used on the homepage.
- `js/resources.js`: search, filtering, sorting, formula previews, and inline specifications.
- `content/resources/`: all resource Markdown articles.
- `resources/_resource-template.html`: common article shell.
- `content/resources/_resource-template.md`: Markdown starting point.
- `resources/markdown-template.html`: live English writing guide with copyable source and rendered examples.
- `content/resources/markdown-template.md`: downloadable source for the complete guide.

Existing article URLs in `notes/` and `components/` stay valid. Their Markdown now lives in `content/resources/`. The former `lab-notes.html` and `components.html` indexes redirect to the corresponding type in Resources.

## Add a resource

1. Copy `_resource-template.html` into `resources/your-slug.html`.
2. Copy the Markdown template into `content/resources/your-slug.md`.
3. Update the HTML title, description, heading, introduction, breadcrumb, and `data-markdown-src`. Remove the shell's `noindex, nofollow` metadata when the article is ready for indexing.
4. Add one entry to `resourceLibrary` with a unique `id`, `kind` (`note`, `component`, or `reference`), `category`, `title`, `description`, `tags`, `date` (`YYYY-MM-DD`), `url`, and `external`.
5. Add optional `formula` (LaTeX), `formulaSearch`, `status`, `provider`, or `model`/`supply`/`interfaces`. Interfaces may be a string or an array. Entries without an article URL appear as inline references; provide their useful information directly in the description, formula, or specifications.
6. Use URLs relative to the site root in the catalogue, e.g. `resources/your-slug.html`. Markdown images resolve relative to their Markdown file, e.g. `../../images/example.webp`.
7. Check the article, its images, the library filters, keyboard navigation, both themes, and the mobile layout. `responsive-test.html` includes 320–1024 px checks.

`?type=note`, `?type=component`, `?type=reference`, `?q=ESP32`, `?topic=Display`, and `?sort=newest` can be combined to share a filtered view. Default sorting is by title.

## Authoring articles

Open [Markdown Article Template](markdown-template.html) through the local website server for a complete source-to-result guide. Its download buttons provide both the guide's Markdown and a shorter teaching starter. Article pages fetch their Markdown; opening a shell as a `file://` URL may fail.

The HTML shell owns the page's single H1. Begin major Markdown sections with `##`; these sections drive the automatic navigation and reading progress. Smaller headings use `###` through `######`. A Markdown `#` is rendered as H2.

Supported features include emphasis, strikethrough, literal inline code, safe inline/reference/bare links, nested lists, ordered-list start values, read-only task lists, multi-paragraph blockquotes, separators, aligned tables, footnotes, and source-relative images with captions and zoom. Raw HTML is displayed as text.

- Code fences accept backticks or tildes and an optional title, for example `cpp title="divider.cpp"`. Code blocks offer Copy and Wrap controls. Common languages have syntax highlighting; unknown languages use plain text. Use four backticks outside an example that contains triple backticks.
- Tables offer Copy table to export tab-separated values. Escape table-cell pipes with `\|`, including pipes inside inline code.
- Math supports `$...$`, `\(...\)`, `$$...$$`, and `\[...\]`. The math renderer loads when needed.
- Callouts use `> [!TYPE] Optional title` and support paragraphs and lists. Types are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, `IMPLEMENTED`, `PROTOTYPE`, `TESTING`, and `PLANNED`.
- Expandable answers use `:::details Summary`, Markdown content, and a closing `:::`. Indent the whole block when nesting it in a list.

Keep filenames and paths in the catalogue relative to the site root. Resolve Markdown links and images from the `.md` file's directory. A fragment such as `#worked-example` always points to a heading in the current HTML article. Article content needs no separate JavaScript file.
