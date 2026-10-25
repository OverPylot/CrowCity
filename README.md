# CrowCity

CrowCity is a browser-based, seeded city and dungeon map workshop for tabletop game masters. The interface supports **English and Hungarian**. No backend, API key, package installation or paid mapping service is required.

## Run locally

Install Node.js 20 or newer, then run:

```sh
npm start
```

Open <http://localhost:8080>. Run `npm run check` to execute syntax checks and the generator, compatibility, translation and gesture tests.

The application is the static `dist/` directory. You can serve that directory with another HTTP server as well. Use an HTTP server instead of opening `index.html` directly, because the application uses JavaScript modules.

## Upload to GitHub

1. Create or open your GitHub repository.
2. Upload the contents of this project, preserving the `dist/`, `tests/`, `scripts/` and `.github/workflows/` folders.
3. Keep the main branch named `main`, or adjust `.github/workflows/pages.yml` to match your branch.
4. To publish the website, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. Run **Publish CrowCity** in Actions, or push another commit to `main`.

The included workflow publishes only `dist/`. Its relative asset paths also work at GitHub Pages project URLs. Repository visibility, account eligibility and Pages access are controlled by GitHub.

Official instructions: [custom GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [publishing source settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Features

- Reproducible city and dungeon maps from a seed and settings.
- Street layouts with buildable frontages, dry bridges and gate roads extending to the map edge.
- Optional landmark buildings, hand-drawn districts, markers, labels and GM notes.
- Woodland groves, mountain ranges, meadows, grouped farmland and mixed landscapes.
- English / Magyar language selection, saved on each device.
- Phone layout with Map, Generator and Markers tabs; pinch zoom, panning and full-screen map mode.
- SVG / PNG exports, JSON saves, seed links, undo and redo.
- Compatibility with earlier Ködvidék map saves.

## Your maps

Maps and notes stay in the browser's local storage. They are not uploaded to GitHub or synchronized between devices. Export JSON backups to transfer them. A seed link shares the generated base and settings; a JSON save includes your annotations and GM notes.

## Magyar útmutató

A CrowCity seedalapú város- és dungeongenerátor, magyar és angol felülettel. Helyben az `npm start` paranccsal indítható; a címe <http://localhost:8080>.

GitHubra a projekt teljes tartalmát töltsd fel, a `.github/workflows/pages.yml` fájllal együtt. A weboldal közzétételéhez a repó **Settings → Pages** oldalán válaszd a **GitHub Actions** forrást. A mellékelt folyamat a `dist/` mappát publikálja.

A mentések az adott böngészőben maradnak. Másik eszközre JSON-exporttal vihetők át. A GitHubra feltöltött forráskód nem tartalmazza a saját térképeidet vagy mesélői jegyzeteidet.
