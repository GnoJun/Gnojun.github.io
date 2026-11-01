# Resources

Course notes, engineering notes, components, and references share one library and one publishing workflow.

## Files

- `resources.html`: searchable library with sidebar categories, a course filter, and always-visible topic and date-sorting controls.
- `js/resources-data.js`: the single `resourceLibrary` catalogue, also used on the homepage.
- `js/resources.js`: search, category counts, topic filtering, sorting, and combined formula/specification previews.
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

The sidebar groups resources by type and shows each category's total count. Course notes have a dedicated filter. Topic and sort controls stay visible beside the search results; topic choices narrow to the selected type, and switching types clears an incompatible topic. The topic menu always opens below its button and scrolls internally for long lists. Use arrow keys, Home/End, or type a topic prefix to navigate, Enter/Space to select, and Escape to close without changing the selection. Each result shows its essential metadata, while formulas and specifications share a single expandable **Preview**. On small screens, categories become a horizontally scrollable row.

`?type=course`, `?type=note`, `?type=component`, `?type=reference`, `?q=ESP32`, `?topic=Display`, and `?sort=oldest` can be combined to share a filtered view. Sorting offers **Newest first** (the default) and **Oldest first**, based on each resource's date. The default newest order omits `sort` from the URL; legacy `sort=title` and invalid values fall back to newest first. Resetting filters also restores newest first. `type=course` selects note entries with `resourceType: "Course Notes"`; `type=note` continues to include every `kind: "note"` entry, including course notes.

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

The HTML shell owns the page's single H1. Begin major Markdown sections with `##`; these sections drive the automatic navigation and reading progress. Smaller headings use `###` through `######`. A Markdown `#` is rendered as H2.

Supported features include emphasis, strikethrough, literal inline code, safe inline/reference/bare links, nested lists, ordered-list start values, read-only task lists, multi-paragraph blockquotes, separators, aligned tables, footnotes, and source-relative images with captions and zoom. Raw HTML is displayed as text.

- Code fences accept backticks or tildes and an optional title, for example `cpp title="divider.cpp"`. Code blocks offer Copy and Wrap controls. Common languages have syntax highlighting; unknown languages use plain text. Use four backticks outside an example that contains triple backticks.
- Tables offer Copy table to export tab-separated values. Escape table-cell pipes with `\|`, including pipes inside inline code.
- Math supports `$...$`, `\(...\)`, `$$...$$`, and `\[...\]`. The math renderer loads when needed.
- Callouts use `> [!TYPE] Optional title` and support paragraphs and lists. Types are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, `IMPLEMENTED`, `PROTOTYPE`, `TESTING`, and `PLANNED`.
- Expandable answers use `:::details Summary`, Markdown content, and a closing `:::`. Indent the whole block when nesting it in a list.

Keep filenames and paths in the catalogue relative to the site root. Resolve Markdown links and images from the `.md` file's directory. A fragment such as `#worked-example` always points to a heading in the current HTML article. Article content needs no separate JavaScript file.
