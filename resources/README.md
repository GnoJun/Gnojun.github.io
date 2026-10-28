# Resources

Notes, components, and references now share one library and one publishing workflow.

## Files

- `resources.html`: searchable list with type, topic, and date/title filters.
- `js/resources-data.js`: the single `resourceLibrary` catalogue, also used on the homepage.
- `js/resources.js`: search, filtering, sorting, formula previews, and inline specifications.
- `content/resources/`: all resource Markdown articles.
- `resources/_resource-template.html`: common article shell.
- `content/resources/_resource-template.md`: Markdown starting point.

Existing article URLs in `notes/` and `components/` stay valid. Their Markdown now lives in `content/resources/`. The former `lab-notes.html` and `components.html` indexes redirect to the corresponding type in Resources.

## Add a resource

1. Copy `_resource-template.html` into `resources/your-slug.html`.
2. Copy the Markdown template into `content/resources/your-slug.md`.
3. Update the HTML title, description, heading, introduction, breadcrumb, and `data-markdown-src`.
4. Add one entry to `resourceLibrary` with a unique `id`, `kind` (`note`, `component`, or `reference`), `category`, `title`, `description`, `tags`, `date` (`YYYY-MM-DD`), `url`, and `external`.
5. Add optional `formula` (LaTeX), `formulaSearch`, `status`, `provider`, or `model`/`supply`/`interfaces`. Interfaces may be a string or an array. Entries without an article URL appear as inline references; provide their useful information directly in the description, formula, or specifications.
6. Use URLs relative to the site root in the catalogue, e.g. `resources/your-slug.html`. Markdown images resolve relative to their Markdown file, e.g. `../../images/example.webp`.
7. Check the article, its images, the library filters, keyboard navigation, both themes, and the mobile layout. `responsive-test.html` includes 320–1024 px checks.

`?type=note`, `?type=component`, `?type=reference`, `?q=ESP32`, `?topic=Display`, and `?sort=newest` can be combined to share a filtered view. Default sorting is by title.
