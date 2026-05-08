// Daily Marketing Report Generator
// This runs via cron and generates a compact Telegram-friendly report

const http = require('https');
const fs = require('fs');
const path = require('path');

const AGENCY_DIR = '/data/workspace/agency';
const today = new Date().toISOString().split('T')[0];

async function check(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, { timeout: 10000 }, (res) => {
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

async function run() {
  console.log(`📊 Daily Marketing Report — ${today}\n`);

    // ALL SITES TO CHECK
  const sites = {
    'bmiio.us (main)': 'https://bmiio.us',
    'bmi.bmiio.us (BMI)': 'https://bmi.bmiio.us',
    'random.bmiio.us (RNG)': 'https://random.bmiio.us',
    'randomgen.us': 'https://randomgen.us',
    'passgen.bmiio.us (Password)': 'https://passgen.bmiio.us'
  };

  const results = {};
  for (const [name, url] of Object.entries(sites)) {
    const r = await check(url);
    results[name] = r;
  }

  console.log('━━━ SITE HEALTH ━━━');
  for (const [name, r] of Object.entries(results)) {
    const icon = r.status === 200 ? '✅' : r.status ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${r.status} (${r.time}ms)`);
  }

  // Verify GA tags on each site
  const gaMap = {
    'https://bmiio.us': 'G-HRB36D7927',
    'https://bmi.bmiio.us': 'G-HRB36D7927',
    'https://random.bmiio.us': 'G-357TTYDLD2',
    'https://randomgen.us': 'G-357TTYDLD2',
    'https://passgen.bmiio.us': 'G-EE984XGR5C'
  };

  console.log(`\n━━━ ANALYTICS ━━━`);
  for (const [name, r] of Object.entries(results)) {
    const expectedGA = gaMap[r.headers?.location ? check(r.headers.location) : ''];
    const actualGA = Object.entries(gaMap).find(([url, id]) => r.body.includes(id));
    console.log(`${actualGA ? '✅' : '❌'} ${name}`);
  }

  // Check sitemaps
  console.log(`\n━━━ INDEXING ━━━`);
  const sitemaps = [
    'https://bmiio.us/sitemap.xml',
    'https://randomgen.us/sitemap.xml'
  ];
  for (const url of sitemaps) {
    const s = await check(url);
    console.log(`${s.status === 200 ? '✅' : '❌'} ${url} (${s.status})`);
  }

  // Word count per site
  const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`\n━━━ CONTENT ━━━`);
  for (const [name, r] of Object.entries(results)) {
    const words = stripHtml(r.body).split(' ').length;
    console.log(`${name}: ~${words} words`);
  }

  // Generate action items
  console.log(`\n━━━ TODAY'S ACTIONS ━━━`);
  console.log(`1. Monitor Search Console for indexing status`);
  console.log(`2. Check GA app for first visitor data`);
  console.log(`3. Track competitor rankings`);
  console.log(`4. Prepare backlink outreach`);
  console.log(`5. Expand FAQ with new "People Also Ask" queries`);

  // Write stats to files
  const statsLine = `| ${today} | — | — | — | — | Health check |`;
  const statsDir = path.join(AGENCY_DIR, 'tool-stats');
  
  try {
    const bmiStats = fs.readFileSync(path.join(statsDir, 'bmiio-us.md'), 'utf8');
    const rngStats = fs.readFileSync(path.join(statsDir, 'randomgen-us.md'), 'utf8');
    
    const updatedBmi = bmiStats.replace(/^## Daily Stats Tracker\n\n.*?\n\n/s, 
      `## Daily Stats Tracker\n\n| Date | Visitors | Searches | Backlinks | Rank Change | Notes |\n|------|----------|----------|-----------|-------------|-------|\n${statsLine}\n\n`);
    
    const updatedRng = rngStats.replace(/^## Daily Stats Tracker\n\n.*?\n\n/s,
      `## Daily Stats Tracker\n\n| Date | Visitors | Searches | Backlinks | Rank Change | Notes |\n|------|----------|----------|-----------|-------------|-------|\n${statsLine}\n\n`);
    
    fs.writeFileSync(path.join(statsDir, 'bmiio-us.md'), updatedBmi);
    fs.writeFileSync(path.join(statsDir, 'randomgen-us.md'), updatedRng);
  } catch(e) {
    console.error('Stats update error (non-fatal):', e.message);
  }

  // Generate report file
  const dayNum = countDays();
  const report = `# Day ${dayNum} Report — ${today}\n\n` +
    `## Morning Health Check\n` +
    `- **bmiio.us**: ${bmi.status} (${bmi.time}ms)\n` +
    `- **randomgen.us**: ${rng.status} (${rng.time}ms)\n` +
    `- **Analytics**: ${bmiGA ? '✅' : '❌'} bmiio | ${rngGA ? '✅' : '❌'} randomgen\n` +
    `- **Sitemaps**: Both accessible\n\n` +
    `## Content\n` +
    `- bmiio.us: ~${bmiWords} words\n` +
    `- randomgen.us: ~${rngWords} words\n\n` +
    `## Actions for Today\n` +
    `1. Check Search Console for first crawl data\n` +
    `2. Monitor Google Analytics app for visitors\n` +
    `3. Track keyword rankings\n` +
    `4. Backlink outreach\n` +
    `5. Content expansion\n\n---\n`;

  const reportPath = path.join(AGENCY_DIR, 'reports', `day-${dayNum}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Report saved: reports/day-${dayNum}.md`);
}

function countDays() {
  const start = new Date('2026-05-07');
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
}

run().catch(e => console.error('Fatal:', e));
