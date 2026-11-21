# Deployment

1. Check `npm test`, `npm run check`, `npm run build`; site contents in `dist`.
2. Push project to `jviola1019/hypothetical_cfb` default `main` branch.
3. Repository Settings → Pages → Source: GitHub Actions.
4. Trigger `.github/workflows/deploy-pages.yml` from `main` or manual dispatch.
5. Confirm Pages action reports success and verify `https://jviola1019.github.io/hypothetical_cfb/` in a real browser.
6. Check developer console, deep-link fragments, mobile layout, Workers and caching in published deployment. Do not assume a successful upload implies the web app is live.

GitHub Pages is static: no server-side secret proxy, trusted anti-cheat backend or cron data ETL is included.
