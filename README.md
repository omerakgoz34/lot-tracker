# DEPO LOT TAKİP

Artikel → LOT lookup. Load a Google Sheet or an Excel/CSV file, then search. Works offline in the browser.

## GitHub Pages at `/lot-tracker/`

This repo publishes a static site on the `gh-pages` branch (`index.html` at the branch root). Add it as a submodule of your user site:

```bash
cd omerakgoz34.github.io
git submodule add -b gh-pages https://github.com/omerakgoz34/lot-tracker.git lot-tracker
git commit -m "Add lot-tracker submodule"
git push
```

The app is then served at `https://omerakgoz34.github.io/lot-tracker/`.

The parent Pages build must check out submodules (GitHub Actions: `actions/checkout` with `submodules: true`, or Pages setting “Include submodules”).

You can also enable Pages on **this** repo from the `gh-pages` branch — same URL for a project site.

## Build

```bash
pnpm install
pnpm run build:portable
```

Output is in `public/` (`index.html`, hashed JS/CSS, fonts, lazy `xlsx-*.js`).
