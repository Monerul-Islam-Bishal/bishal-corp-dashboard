// Morning Improvement Suggestions Script
// Runs daily at 8 AM BD time (2 AM UTC)

const https = require('https');
const http = require('http');

const sites = {
  'bmiio.us (Main Hub)': { url: 'https://bmiio.us', kw: 'free online tools, problem-solving, online utilities', ga: 'G-HRB36D7927' },
  'bmi.bmiio.us (BMI)': { url: 'https://bmi.bmiio.us', kw: 'BMI, body mass index, healthy weight', ga: 'G-HRB36D7927' },
  'randomgen.us (RNG)': { url: 'https://randomgen.us', kw: 'random number generator, RNG, random generator', ga: 'G-357TTYDLD2' },
  'passgen.bmiio.us (Password)': { url: 'https://passgen.bmiio.us', kw: 'password generator, secure password, strong password', ga: 'G-EE984XGR5C' }
};

function check(url) {
  return new Promise(r => {
    const mod = url.startsWith('https') ? https : http;
    const start = Date.now();
    mod.get(url, { timeout: 10000 }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => r({ status: res.statusCode, time: Date.now() - start, body: d }));
    }).on('error', e => r({ status: 0, body: '', error: e.message }));
  });
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countFaqs(html) {
  // Count FAQ items regardless of class naming
  const patterns = ['faq-item', 'faq-q', 'class="faq"', 'class="faq-item"', 'faq-question', 'faq_question'];
  const counts = patterns.map(p => (html.match(new RegExp(p, 'gi')) || []).length);
  // Also count schema.org FAQPage questions
  const schemaQuestions = (html.match(/"name"\s*:/g) || []).length;
  if (schemaQuestions > 0) {
    // Schema FAQs, return the count
    return Math.max(...counts, schemaQuestions);
  }
  return Math.max(...counts);
}

async function run() {
  const today = new Date().toISOString().split('T')[0];
  let report = `🏹 **Daily Improvement — ${today}**\n\n`;

  // Phase calculator
  const start = new Date('2026-05-07');
  const now = new Date();
  const day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

  report += `📆 **Day ${day}** | Phase ${day <= 3 ? '1: Foundation' : day <= 8 ? '2: Visibility' : '3: Growth'}\n\n`;

  // Check all sites
  for (const [name, info] of Object.entries(sites)) {
    const r = await check(info.url);
    const words = stripHtml(r.body || '').split(' ').length;
    const faqs = countFaqs(r.body || '');
    const hasGA = (r.body || '').includes(info.ga);
    const icon = r.status === 200 ? '✅' : '❌';
    report += `${icon} **${name}** — ${r.status || 'DOWN'}\n`;
    report += `   Words: ~${words} | FAQ: ${faqs} | GA: ${hasGA ? '✅' : '❌'}\n`;
    report += `   Keywords: ${info.kw}\n`;

    // Suggestions per site
    if (words < 2000) report += `   ⚠️ **Content gap:** Only ~${words} words, target 2500+\n`;
    if (faqs < 5) report += `   ⚠️ **FAQ gap:** Only ${faqs} FAQ items, target 8+\n`;

    report += '\n';
  }

  // Phase-specific suggestions
  report += `━━━ **${day <= 3 ? 'FOUNDATION TIPS' : day <= 8 ? 'VISIBILITY TIPS' : 'GROWTH TIPS'}** ━━━\n\n`;

  if (day <= 3) {
    report += `🔹 **Content** — Expand each page to 3000+ words\n`;
    report += `🔹 **Indexing** — Check Search Console for first crawls\n`;
    report += `🔹 **Internal Links** — Link tools to each other\n`;
    report += `🔹 **Keywords** — Research "People Also Ask" for each tool\n`;
  } else if (day <= 8) {
    report += `🔹 **Backlinks** — Submit to free directories\n`;
    report += `🔹 **Social** — Share tools on Reddit, Twitter, LinkedIn\n`;
    report += `🔹 **Guest Posts** — Write on Medium/Dev.to\n`;
    report += `🔹 **Schema** — Add review/FAQ markup\n`;
  } else {
    report += `🔹 **AdSense** — Apply if traffic > 200/day\n`;
    report += `🔹 **New Tools** — Build more pages (more content = more SEO)\n`;
    report += `🔹 **Core Web Vitals** — Optimize PageSpeed scores\n`;
  }

  // Quick wins
  report += `\n━━━ **QUICK WINS TODAY** ━━━\n\n`;
  report += `1. Share one tool on Reddit (r/Tools, r/InternetIsBeautiful)\n`;
  report += `2. Add one new FAQ question to the lowest-FAQ page\n`;
  report += `3. Check Google Analytics for first visitors\n`;
  report += `4. Review Search Console for new issues\n`;
  report += `5. Cross-link all tools to each other\n`;

  console.log(report);
}

run().catch(e => console.error('Error:', e.message));
