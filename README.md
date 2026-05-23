# India Market Compass

A calm, beginner-friendly Indian stock market dashboard that avoids overwhelming new investors with dense charts and noisy numbers.

The site highlights:

- 5 Indian stocks with the strongest growth over roughly the last 4 weeks
- 5 major India-focused market indices and their recent trend
- 1 beginner lesson based on a recent real-world India-market news example
- A clean visual experience designed for insight first, not trading overload

Live site: https://shreyaskupsad.github.io/stock-market-station/

## Why This Exists

Most finance dashboards are built for people who already know what they are looking for. This project is for beginners who want a gentler first read of the Indian market: what is moving, where the broad market is leaning, and what lesson can be learned from recent events.

This is not financial advice. It is an educational market-awareness tool.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js local server
- GitHub Pages for free static hosting
- GitHub Actions for daily data refreshes

## Data

The local server fetches public India-market data and news. The GitHub Pages version reads from static JSON files in `data/`, which are refreshed by the scheduled GitHub Action in `.github/workflows/update-data.yml`.

## Run Locally

```bash
node server.js
```

Then open:

```text
http://localhost:3000
```

If you have npm available, you can also run:

```bash
npm start
```

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── server.js
├── data/
│   ├── market.json
│   └── lesson.json
├── scripts/
│   └── fetch-data.js
└── .github/workflows/
    └── update-data.yml
```

## Contributing

Contributions are welcome through pull requests. Please keep the project focused on beginner-friendly investing education, clean design, and India-only market context.

Good contribution ideas:

- Improve accessibility
- Refine mobile layout
- Add clearer beginner explanations
- Improve data resilience
- Polish visual design without adding clutter

The `main` branch is intended to stay stable. Open a pull request for proposed changes so the repo owner can review and merge when ready.
