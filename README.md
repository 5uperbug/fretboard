# Fretboard

An interactive guitar fretboard. Click frets to mark notes, then copy the diagram to the clipboard or download it as a PNG.

Live at https://fretboard.5uperbug.com

## Development

Needs Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev       # dev server at http://localhost:5173
npm test          # Vitest (watch mode locally, single run in CI)
npm run lint      # oxlint
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

Built with React 19, Vite and Sass.

## Deployment

Every push to `master` runs the lint, tests and build, then publishes `dist/` to GitHub Pages (`.github/workflows/deploy.yml`). Pull requests run the same checks without deploying (`.github/workflows/ci.yml`).

The custom domain is set in the repository's Pages settings, with a DNS `CNAME` record for `fretboard` pointing to `5uperbug.github.io`.
