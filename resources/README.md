# Resources

Course notes, engineering notes, components, and references share one library and one publishing workflow.

## Files

- `resources.html`: searchable library with sidebar categories, a course filter, and always-visible topic and date-sorting controls.
- `js/resources-data.js`: the single `resourceLibrary` catalogue, also used on the homepage.
- `js/resources.js`: search, category counts, topic filtering, sorting, pagination, and combined formula/specification previews.
- `content/resources/`: all resource Markdown articles.
- `resources/_resource-template.html`: common article shell.
- `content/resources/_resource-template.md`: Markdown starting point.
- `resources/markdown-template.html`: live English writing guide with copyable source and rendered examples.
- `content/resources/markdown-template.md`: downloadable source for the complete guide.

Existing article URLs in `notes/` and `components/` stay valid. Their Markdown now lives in `content/resources/`. The former `lab-notes.html` and `components.html` indexes redirect to the corresponding type in Resources.

## How resources work

`resources.html` loads the `resourceLibrary` array from `js/resources-data.js`, then `js/resources.js` builds the list and its filters. The library does **not** scan `content/resources/` or discover Markdown files automatically. Creating a Markdown file alone does not add a resource to the library.

Each internal article has three separate parts:

| Part | Where to edit | What it controls |
| :--- | :--- | :--- |
| Catalogue metadata | The resource's object in `js/resources-data.js` | Library title, description, type, topic, tags, date, search keywords, preview, and destination URL |
| Article shell | Its `.html` page in `resources/`, `notes/`, or `components/` | Browser title, page heading, introduction, navigation, and the `data-markdown-src` path |
| Article body | Its `.md` file in `content/resources/` | The rendered article, equations, examples, tables, and section navigation |

These parts are maintained separately. For example, editing `content/resources/eele201.md` changes the Circuits I article body, but does not change its library description or date. Update the `eele201` catalogue entry to change those fields; update `notes/eele201.html` to change the article's heading or introduction. Library search uses the catalogue metadata, not the full Markdown body.

**All topics is generated automatically.** The controller collects the `category` values from resources in the selected type, removes duplicate values, sorts them alphabetically, and adds the **All topics** option. You do not maintain a separate topic list. Reusing `category: "Analog Circuits"` puts another resource in that topic; using a new category creates another topic. Keep category spelling and capitalization consistent to avoid near-duplicate topics. **All topics** includes every topic within the selected type, and changing type removes an incompatible topic selection.

`kind` selects the primary type: `note`, `component`, or `reference`. The course filter is a subset for entries marked `resourceType: "Course Notes"`; keep their `kind` as `note`. This makes them appear in both **Course notes** and **All notes & formulas**.

`date` is a manually maintained `YYYY-MM-DD` value. It controls the displayed update date and the default **Newest first** order; **Oldest first** reverses the date order, and equal dates are ordered by title. Editing an article does not automatically change its date. Update the catalogue date when you want that resource to move in the date order.

The homepage's **Latest resources** section automatically shows the three newest catalogue entries using the same date and title ordering. Its titles and descriptions come directly from the catalogue; no separate featured list is maintained. Entries without an article URL link to their filtered view in Resources so readers can access inline formulas or specifications.

## Browse the library

Resources uses a layout sized to the viewport. On desktop, the left panel extends from below the site navigation to the bottom of the viewport, containing the page title, resource count, introduction, and **Browse library** categories. Search stays at the top of the right column. Only the results region scrolls, so reaching its top or bottom does not move either column. The left column has no separate scrolling area; shorter desktop windows use tighter spacing and a compact category layout. On phones, only search and a filter button remain above the results; categories, topic, and sort move into the filter dialog.

The sidebar groups resources by type and shows each category's total count. Course notes have a dedicated filter. Topic choices narrow to the selected type, and switching types clears an incompatible topic. The topic menu always opens below its button and scrolls internally for long lists. Use arrow keys, Home/End, or type a topic prefix to navigate, Enter/Space to select, and Escape to close without changing the selection. Each result shows its essential metadata, while formulas and specifications share a single expandable **Preview**.

On desktop, search, topic, and sort controls are outside the results scroller. In short desktop windows, topic and sort move into the results region while search stays in place. Changing pages, filtering, or restoring a history entry returns only the results region to its top; it does not scroll the page, sidebar, or search controls. The results region is keyboard focusable for native scrolling.

On phones, tap the filter button beside search to open the category, topic, and sort controls. Its badge counts active filters. Changes apply immediately; **Show resources**, Close, or Escape dismisses the dialog while keeping the selected conditions. **Reset filters** clears search and filters. The dialog shows the matching resource count and scrolls internally when needed. Returning to desktop restores the same controls and selections to their desktop positions.

`?type=course`, `?type=note`, `?type=component`, `?type=reference`, `?q=ESP32`, `?topic=Display`, `?sort=oldest`, and `?page=2` can be combined to share a filtered view and its page. Sorting offers **Newest first** (the default) and **Oldest first**, based on each resource's date. The default newest order omits `sort` from the URL; legacy `sort=title` and invalid values fall back to newest first. Resetting filters also restores newest first. `type=course` selects note entries with `resourceType: "Course Notes"`; `type=note` continues to include every `kind: "note"` entry, including course notes.

### Pagination

The library shows up to **10 resources per page**. Search, type and topic filters, and sorting apply to the entire catalogue before the matching results are divided into pages. Results on later pages remain searchable; pagination does not limit the data being filtered. The result count describes the full matching set, while the current-page status identifies the page being displayed.

Use **Previous**, **Next**, or a numbered page control to move through results. The current page is marked in the controls. Pagination is hidden when the matching results fit on one page; when nothing matches, the library shows its existing empty state without pagination.

The Resources page has no footer or bottom disclosure bar. The results region ends at the pagination, and the workspace uses the available height below the site navigation. Footers on other pages are unchanged.

Changing the search, resource type, topic, or sort order returns to page 1. Clearing the search or resetting all filters also returns to page 1. Later pages are stored in the URL as `page=2`, `page=3`, and so on; page 1 omits the `page` parameter. For example, `resources.html?page=2&sort=oldest` opens the second page in oldest-first order. Browser Back and Forward restore the page together with its search, filters, and sort order. Invalid page values fall back to page 1; pages beyond the available results are clamped to the last page. These corrections also update the URL without adding a history entry.

To change the number of resources per page, edit the `PAGE_SIZE` constant in `js/resources.js`. The catalogue entries and article files do not need to change.

## Course notes

The Courses dropdown and the library's course filter link to these pages. Edit the corresponding Markdown file to update a course's article; each new course page also offers a source download.

| Course page | Markdown source |
| :--- | :--- |
| [Circuits I](../notes/eele201.html) | [eele201.md](../content/resources/eele201.md) |
| [Circuits II](../notes/circuits-ii.html) | [circuits-ii.md](../content/resources/circuits-ii.md) |
| [Physics I](../notes/physics-i.html) | [physics-i.md](../content/resources/physics-i.md) |
| [Physics II](../notes/physics-ii.html) | [physics-ii.md](../content/resources/physics-ii.md) |

The new courses begin with editable study outlines and starter notes. Their HTML shells own the page title, introduction, and active Courses link.

The site's **Courses** navigation dropdown is maintained separately in the HTML pages. Adding `resourceType: "Course Notes"` to the catalogue includes the resource in the library's course filter, but does not add it to the navigation dropdown. Update the navigation links in the relevant HTML pages when adding a course there.

## Add a resource

Create an internal article in three steps. This example uses `rc-low-pass-filter` as the slug:

1. **Create the HTML page.** Copy `resources/_resource-template.html` to `resources/rc-low-pass-filter.html`. Update its browser title, description, heading, introduction, breadcrumb, and `data-markdown-src="../content/resources/rc-low-pass-filter.md"`. Remove the shell's `noindex, nofollow` metadata when the article is ready for indexing.
2. **Write the Markdown body.** Copy `content/resources/_resource-template.md` to `content/resources/rc-low-pass-filter.md` and replace the sample content. Start major sections with `##`, because the HTML shell supplies the H1.
3. **Register the resource.** Add the following object inside the `resourceLibrary` array in `js/resources-data.js`. Separate it from neighboring objects with a comma. The `id` must be unique, and the `url` must point to the HTML page you created.

```js
{
    id: "rc-low-pass-filter",
    kind: "note",
    category: "Analog Circuits",
    title: "RC Low-Pass Filter",
    description: "Cutoff frequency, circuit behavior, and a worked example for a first-order RC low-pass filter.",
    tags: ["RC", "Filters", "Frequency Response"],
    url: "resources/rc-low-pass-filter.html",
    external: false,
    date: "2026-10-31",
    status: "Documented",
    resourceType: "Technical Note",
    formula: "f_c = \\frac{1}{2\\pi RC}",
    formulaSearch: "fc cutoff frequency resistor capacitor RC low pass filter"
}
```

`formula`, `formulaSearch`, `status`, `provider`, `resourceType`, and the specification fields `model`, `supply`, and `interfaces` are optional. Interfaces may be a string or an array. JavaScript strings need doubled backslashes for LaTeX, as in the example above. Formulas and specifications appear together in the result's **Preview**.

For an **external website**, only add a catalogue object: use `kind: "reference"`, its full `https://` URL, and `external: true`. No local HTML page or Markdown file is required. Add `provider` to identify the source.

For an **inline reference**, omit `url`. The resource remains visible in the library without a title link. Put the useful information in its description, formula, or specifications; no article files are required.

Use URLs relative to the site root in the catalogue, e.g. `resources/rc-low-pass-filter.html`. Markdown images resolve relative to their Markdown file, e.g. `../../images/example.webp`.

After adding a resource, check its article, images, topic selection, search, Preview, keyboard navigation, both themes, and mobile layout through the local website server. `responsive-test.html` includes 320–1024 px checks.

## Authoring articles

Open [Markdown Article Template](markdown-template.html) through the local website server for a complete source-to-result guide. Its download buttons provide both the guide's Markdown and a shorter teaching starter. Article pages fetch their Markdown; opening a shell as a `file://` URL may fail.

The HTML shell owns the page's single H1. Begin major Markdown sections with `##` and subsections with `###`; these drive the automatic directory and reading progress. Smaller headings use `####` through `######`. A Markdown `#` is rendered as H2. On screens at least 1200 px wide, the right panel starts hidden. Its small **Navigation Bar** button opens or closes the whole panel, including the vertical directory and formula references. The open panel is 220 px wide and uses the available height below the site header, with internal scrolling and current-section highlighting. On narrower screens, the top **Navigation Bar** also starts collapsed. The desktop panel and mobile navigation retain separate open or closed choices through resizing and article rerendering on the current page; reloading starts collapsed again.

### Formula and symbol quick reference

Use `:::reference Title`, a formula and concise symbol definitions, then a closing `:::` to mark material for **Formulas & symbols**. The original block stays in the article, while the sidebar collects a reference card with **View in article** and **Copy formula** controls for display equations. Copy provides the original LaTeX; when clipboard access is unavailable, the card shows and selects that source for manual copying. The list follows article order and only includes explicitly marked, visible blocks; references inside quizzes or expandable answers are excluded. On narrow screens the reference list moves below the article as a collapsible section. Articles without marked references have no empty reference list.

```markdown
:::reference Ohm's law
$$
V = IR
$$

- `V`: voltage across the resistor, in volts.
- `I`: current entering its positive terminal, in amperes.
- `R`: resistance, in ohms.
:::
```

**Formulas & symbols** starts collapsed on all screen sizes. On wide screens, first open the panel with **Navigation Bar**. Expanding the reference list hides the directory inside the panel and gives the references that space; closing the list restores the directory. The outer **Navigation Bar** button remains accessible to close the whole panel in either view. On narrow screens, opening references below the article leaves the independent top navigation available.

Use this block for key formulas, assumptions, and variable units; keep intermediate calculations in the normal article body. See the template's **Formula and symbol quick reference** section for copyable source and a live example.

Supported features include emphasis, strikethrough, literal inline code, safe inline/reference/bare links, nested lists, ordered-list start values, read-only task lists, multi-paragraph blockquotes, separators, aligned tables, footnotes, and source-relative images with captions and zoom. Raw HTML is displayed as text.

- Code fences accept backticks or tildes and an optional title, for example `cpp title="divider.cpp"`. Code blocks offer Copy and Wrap controls. Common languages have syntax highlighting; unknown languages use plain text. Use four backticks outside an example that contains triple backticks.
- Tables offer Copy table to export tab-separated values. Escape table-cell pipes with `\|`, including pipes inside inline code.
- Math supports `$...$`, `\(...\)`, `$$...$$`, and `\[...\]`. The math renderer loads when needed.
- Callouts use `> [!TYPE] Optional title` and support paragraphs and lists. Types are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, `IMPLEMENTED`, `PROTOTYPE`, `TESTING`, and `PLANNED`.
- Expandable answers use `:::details Summary`, Markdown content, and a closing `:::`. Indent the whole block when nesting it in a list.
- Images use `![Alternative text](../../images/example.webp "Optional caption")`. Put an image in its own paragraph for a captioned, zoomable figure. Black-and-white diagrams opt into the existing light/dark adaptation with `.diagram` before the extension: `.diagram.svg`, `.diagram.png`, `.diagram.jpg`, `.diagram.jpeg`, `.diagram.webp`, `.diagram.gif`, or `.diagram.avif`. Provide one light-mode source image with black lines on white or transparent; CSS inverts it in dark mode, including the zoom preview. Ordinary photos keep their normal filenames and colors.
- Interactive quizzes use one `:::quiz choice` or `:::quiz numeric answer=2.5 unit=V tolerance=0.01` block per question and close with `:::`. Leave a blank line before and after `---` to separate the question from the explanation. Choice questions use one task list with at least two options and exactly one `[x]` correct answer; numerical questions accept unit conversions such as `2500 mV` for `2.5 V`. `tolerance` is an absolute margin in the declared unit and defaults to zero. Readers receive feedback and an explanation after submitting a valid answer, can retry or reset, and start fresh after reloading. See the template's **Interactive quizzes** section for copyable source and live examples.
- Quiz questions and explanations accept the same standalone image paragraphs, captions, zoom, and diagram theme adaptation as articles. Place a question image before the choice list and `---`; place an answer image after `---` so it is revealed with the explanation. Paths resolve from the `.md` file's directory. The template's **Images in a quiz** subsection explains image placement and uses `images/quizzes/circuit-1.diagram.png` in working examples that calculate the downward current through R3.

Keep filenames and paths in the catalogue relative to the site root. Resolve Markdown links and images from the `.md` file's directory. A fragment such as `#worked-example` always points to a heading in the current HTML article. Article content needs no separate JavaScript file.
