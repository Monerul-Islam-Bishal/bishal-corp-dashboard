# Performance Monitor

## Role
Ensure both tools load fast, pass Core Web Vitals, and deliver excellent user experience. Slow sites lose rankings — this role prevents that.

## Daily Responsibilities

### Morning (Every Day)
1. **Check uptime** — Are both domains loading correctly?
2. **PageSpeed check** — Run Lighthouse or PageSpeed Insights
3. **Mobile check** — Test on mobile viewport
4. **Console errors** — Check browser console for JS errors

### Weekly Tasks
1. **Core Web Vitals audit** — Check LCP, FID/INP, CLS scores
2. **Image optimization** — Compress any new images
3. **Cache verification** — Ensure Vercel edge caching works
4. **CDN performance** — Check response times from different regions
5. **Bundle size check** — Ensure no bloat (our tools are mostly static HTML)

### Monthly Tasks
1. **Full performance report** — Trend analysis over 30 days
2. **Competitor speed comparison** — How fast are competing tools?
3. **Technology review** — Check if any upgrades (new HTML/CSS features) can improve speed
4. **Redundancy test** — Can the site survive traffic spikes?

## Performance Targets

| Metric | Target | Current (bmiio.us) | Current (randomgen.us) |
|--------|--------|-------------------|----------------------|
| LCP | <2.5s | — | — |
| FID/INP | <100ms | — | — |
| CLS | <0.1 | — | — |
| TTFB | <800ms | — | — |
| Mobile Score | 90+ | — | — |
| Desktop Score | 95+ | — | — |
| Uptime | 99.9% | ✅ Vercel | ✅ Vercel |

## Optimization Checklist

### Speed Wins (30-min fixes)
- [x] Static HTML (no JS framework overhead)
- [x] Vercel CDN (edge caching)
- [x] Minimal CSS (no frameworks)
- [x] No external fonts (system fonts)
- [x] No images (pure CSS design)
- [ ] Enable Brotli compression (Vercel does this by default ✅)
- [ ] Add resource hints (preconnect/preload)

### Medium Effort
- [ ] Inline critical CSS
- [ ] Lazy load below-fold content
- [ ] Add service worker for offline caching
- [ ] Implement link prefetching for related pages

### Long Term
- [ ] HTTP/3 (QUIC) support
- [ ] Real User Monitoring (RUM) with GA4
- [ ] CDN custom rules for cache tuning

## How to Self-Improve

1. **Monitor web.dev** — Follow Chrome team's performance recommendations
2. **Read case studies** — How other sites improved Core Web Vitals
3. **LAB test data** — Real user monitoring > lab tests
4. **Stay lean** — Every byte counts, especially on mobile
5. **Test regularly** — Performance regressions happen silently

## Tools Used
- Google PageSpeed Insights
- Lighthouse CI
- WebPageTest
- Chrome DevTools (Performance tab)
- GTmetrix
