# Lab Note Workflow

This folder contains the technical detail pages for the Lab Notes
knowledge base.

## Create a New Note

1. Copy `_note-template.html`.
2. Rename the copy using a lowercase kebab-case slug.
3. Update the page title and meta description.
4. Remove the `noindex` meta tag.
5. Replace all `NOTE_` placeholders.
6. Remove sections that are not relevant.
7. Add the note object to `js/lab-notes-data.js`.
8. Add real media only after the file exists.
9. Test desktop and mobile layouts.
10. Commit the new note.

## File Naming

Use lowercase kebab-case:

- `rc-time-constant.html`
- `led-current-limiting.html`
- `esp32-i2c-test.html`

Do not use:

- `RC Time Constant.html`
- `newnote.html`
- `final-note-2.html`

## Media Directory

Use a separate folder for each note:

images/
└── notes/
    └── note-slug/
        ├── circuit-diagram.webp
        ├── prototype.webp
        ├── waveform.webp
        ├── demonstration.mp4
        └── poster.webp

Create the media folder only when the first media file exists.

## Relative Paths

A note page inside `notes/` uses:

- CSS: `../css/style.css`
- JavaScript: `../js/main.js`
- Home: `../index.html`
- Lab Notes: `../lab-notes.html`
- Media: `../images/notes/note-slug/file.webp`

The note URL stored in `lab-notes-data.js` uses:

`notes/note-slug.html`

## Required Data Fields

- `id`
- `type`
- `category`
- `title`
- `summary`
- `date`
- `status`
- `tags`

## Optional Data Fields

- `formula`
- `formulaSearch`
- `url`

A note without a completed detail page can omit `url`.