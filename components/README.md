# Component Detail Workflow

This folder contains the detail pages for the Components Database.

## Update Process


1. git status

2. git add .

3. git commit -m "描述本次修改"

4. git push

## Create a New Component Page

1. Copy `_component-template.html`.
2. Rename the file using lowercase kebab-case.
3. Update the page title and meta description.
4. Remove the `noindex` meta tag.
5. Update the breadcrumb and component name.
6. Replace all component-specific content.
7. Remove sections that are not relevant.
8. Keep section numbers continuous.
9. Add `detailsUrl` to `js/components-data.js`.
10. Test desktop, tablet, and mobile layouts.

## File Naming

Use lowercase kebab-case:

- `esp32-s3-n16r8.html`
- `pn532-nfc-module.html`
- `sh1106-oled.html`
- `basys-3.html`

## Relative Paths

A page inside `components/` uses:

- CSS: `../css/style.css`
- JavaScript: `../js/main.js`
- Home: `../index.html`
- Components list: `../components.html`
- Projects: `../projects/project-name.html`
- Images: `../images/components/component-slug/file.webp`

## Component Data Link

The corresponding object in `components-data.js` should use:

```javascript
detailsUrl:
    "components/component-slug.html",

