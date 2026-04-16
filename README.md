# Game Industry Layoffs (2024)

[Dashboard](https://game-layoffs.netlify.app/)

An interactive dashboard of known studio closures and workforce reductions across the gaming industry in 2024. This is meant as a demonstration of the power of web-based data visualization tools, and AI-assisted data analysis. The initial dashboard and web page with only 2024 data was created and hosted in less than a day with the help of [Claude Code](https://code.claude.com/docs/en/overview).

## Features

- Summary stats: total layoff events, known jobs lost, studios affected
- Filterable by studio type, month, and parent company country
- Full-text search across studio and parent company names
- Three charts: layoffs by month, by studio type, and top studios by headcount

## Local development

Requires a local server:

```bash
python3 -m http.server
```

Then open http://localhost:8000.


## Data

Dataset credit: [Game Industry Layoffs by @dekaf](https://publish.obsidian.md/vg-layoffs/Archive/2024)

`assets/data/data.csv` contains all layoff records. Each row has:

| Column | Description |
|---|---|
| Studio | Studio name |
| Date | Date of announcement (M/D/YYYY) |
| Headcount | Number of jobs lost (blank if unknown) |
| Parent | Parent company, if any |
| Type | Studio type (Console, Indie, Mobile, Online, AR/VR, Publisher, Tech) |
| Studio Location | City or region of the studio |
| Parent Location | Country of the parent company |
