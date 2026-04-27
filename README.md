# Game Industry Layoffs (2022–2025)

[Dashboard](https://game-layoffs.netlify.app/)

An interactive dashboard of known studio closures and workforce reductions across the gaming industry from 2022 to 2025.

This is meant as a demonstration of the power of web-based data visualization tools and AI-assisted data product development. The initial dashboard with 2024 data was created and hosted in less than a day with the help of [Claude Code](https://claude.ai/code).

## Features

- Summary stats: total layoff events, known jobs lost, studios affected
- Filterable by year, studio type, month, and parent company country
- Search across studio and parent company names
- Four charts: layoffs by year, by month, by studio type, and top studios by headcount
- Sortable table of all layoff events

## Local development

Requires a local server (browsers block `fetch` on `file://`):

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Project structure

```
├── index.html
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    └── data/
        ├── 2022.csv
        ├── 2023.csv
        ├── 2024.csv
        └── 2025.csv
```

## Data

Dataset credit: [Game Industry Layoffs by @dekaf](https://publish.obsidian.md/vg-layoffs/Archive/2024)

Each year has its own CSV file under `assets/data/`. All files share the same column schema:

| Column | Description |
|---|---|
| Studio | Studio name |
| Date | Date of announcement (YYYY-MM-DD) |
| Headcount | Number of jobs lost (blank if unknown) |
| Parent | Parent company, if any |
| Type | Studio type (Console, Indie, Mobile, Online, AR/VR, Publisher, Tech) |
| Studio Location | City or region of the studio |
| Parent Location | Country of the parent company |
