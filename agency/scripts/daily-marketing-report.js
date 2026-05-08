// Daily Marketing Report Generator
// This runs via cron and generates a compact Telegram-friendly report

const http = require('https');
const fs = require('fs');
const path = require('path');

const AGENCY_DIR = '/data/workspace/agency';
const STATS_FILE = path.join(AGENCY_DIR, 'tool-stats', 'history.json');
const today = new Date().toISOString().split('T')[0];

function getDayNum() {
  const start = new Date('2026-05-07');
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
}

async function check(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start,
          body: data.substring(0, 50000),
          headers: res.headers
        });
      });
    }).on('error', (e) => {
      resolve({ status: 0, time: 0, body: '', error: e.message, headers: {} });
    });
  });
}

function stripHtml(html) {
  return ((html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function countFaqs(html) {
  const patterns = ['faq-item', 'faq-q', 'class="faq"'];
  return Math.max(...patterns.map(p => ((html || '').match(new RegExp(p, 'gi')) || []).length));
}

function loadHistory() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); }
  catch(e) { return { days: [], lastWordCounts: {} }; }
}

function saveHistory(data) {
  fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
  fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
}

async function run() {
  const dayNum = getDayNum();
  console.log(`📊 Daily Marketing Report — ${today}\n`);

  // ALL SITES TO CHECK
  const sites = {
    'bmiio.us (main)': 'https://bmiio.us',
    'bmi.bmiio.us (BMI)': 'https://bmi.bmiio.us',
    'random.bmiio.us (RNG)': 'https://random.bmiio.us',
    'randomgen.us': 'https://randomgen.us',
    'passgen.bmiio.us (Password)': 'https://passgen.bmiio.us'
  };

  const gaMap = {
    'https://bmiio.us': 'G-HRB36D7927',
    'https://bmi.bmiio.us': 'G-HRB36D7927',
    'https://random.bmiio.us': 'G-357TTYDLD2',
    'https://randomgen.us': 'G-357TTYDLD2',
    'https://passgen.bmiio.us': 'G-EE984XGR5C'
  };

  const results = {};
  for (const [name, url] of Object.entries(sites)) {
    const r = await check(url);
    results[name] = r;
  }

  // ━━ SITE HEALTH ━━
  console.log('━ SITE HEALTH ━');
  for (const [name, r] of Object.entries(results)) {
    const icon = r.status === 200 ? '✅' : r.status ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${r.status} (${r.time}ms)`);
  }

  // ━━ ANALYTICS ━━
  console.log('\n━ ANALYTICS ━');
  for (const [name, r] of Object.entries(results)) {
    const expectedGA = Object.entries(gaMap).find(([url, id]) => r.body.includes(id));
    console.log(`${expectedGA ? '✅' : '❌'} ${name}`);
  }

  // ━━ INDEXING ━━
  console.log('\n━ INDEXING ━');
  const sitemaps = ['https://bmiio.us/sitemap.xml', 'https://randomgen.us/sitemap.xml'];
  for (const url of sitemaps) {
    const s = await check(url);
    console.log(`${s.status === 200 ? '✅' : '❌'} ${url} (${s.status})`);
  }

  // ━━ CONTENT + TRAFFIC COMPARISON ━━
  const history = loadHistory();
  const lastCounts = history.lastWordCounts || {};

  console.log('\n━ CONTENT & TRAFFIC ━');

  const todayCounts = {};
  for (const [name, r] of Object.entries(results)) {
    const words = stripHtml(r.body).split(' ').length;
    const faqs = countFaqs(r.body);
    todayCounts[name] = { words, faqs };

    const prevWords = lastCounts[name] ? lastCounts[name].words : null;
    let wordChange = '';
    if (prevWords !== null) {
      const diff = words - prevWords;
      wordChange = diff > 0 ? ` 📈 +${diff}` : diff < 0 ? ` 📉 ${diff}` : ' 🔄 no change';
    }

    console.log(`${name}: ~${words} words | ${faqs} FAQs${wordChange}`);
  }

  // Save today's counts for future comparison
  history.lastWordCounts = todayCounts;
  history.days = history.days || [];
  history.days.push({ date: today, day: dayNum, wordCounts: { ...todayCounts } });
  // Keep only last 30 days
  if (history.days.length > 30) history.days = history.days.slice(-30);
  saveHistory(history);

  // Traffic note (from GA - can't access directly, but prompt user)
  console.log('\n━ TRAFFIC NOTE ━');
  console.log('📱 Check Google Analytics app on your phone for real traffic data.');
  console.log('🔍 Check Google Search Console for first search impressions.');

  // ━━ TODAY'S ACTIONS ━━
  console.log('\n━ TODAY\'S ACTIONS ━');
  console.log('1. Open Google Analytics app → check for first visitors');
  console.log('2. Open Google Search Console → check for indexing');
  console.log('3. Share one tool on social media (Reddit, Twitter)');
  console.log('4. Review yesterday\'s suggestions');
  console.log('5. Prepare backlink outreach list');

  // Generate report file
  const report = [
    `# Day ${dayNum} Report — ${today}`,
    '',
    '## Morning Health Check',
    ...Object.entries(results).map(([name, r]) =>
      `- **${name}**: ${r.status === 200 ? '✅' : '❌'} ${r.status} (${r.time}ms)`
    ),
    '',
    '## Content Stats',
    ...Object.entries(todayCounts).map(([name, c]) =>
      `- **${name}**: ~${c.words} words | ${c.faqs} FAQs`
    ),
    '',
    '## Analytics',
    '- GA check: All sites scanned',
    '- Traffic data: Check phone app',
    '',
    '## Actions for Today',
    '1. Check Search Console for first crawl data',
    '2. Monitor Google Analytics app for visitors',
    '3. Track keyword rankings',
    '4. Backlink outreach',
    '5. Content expansion',
    '',
    '---'
  ].join('\n');

  const reportPath = path.join(AGENCY_DIR, 'reports', `day-${dayNum}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Report saved: reports/day-${dayNum}.md`);
}

run().catch(e => console.error('Fatal error:', e.message));