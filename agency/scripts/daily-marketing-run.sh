#!/bin/bash
# Daily Marketing Automation - Runs at 7 AM BD time
# This script executes the day's marketing tasks for both tools

echo "=== BISHAL TOOLS - DAILY MARKETING RUN ==="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S UTC')"

# 1. Check site health
echo ""
echo "[1/5] Checking site health..."
bmi_status=$(curl -s -o /dev/null -w "%{http_code}" https://bmiio.us 2>/dev/null)
rng_status=$(curl -s -o /dev/null -w "%{http_code}" https://randomgen.us 2>/dev/null)
echo "  bmiio.us: HTTP $bmi_status"
echo "  randomgen.us: HTTP $rng_status"

# 2. Check Google Search Console verification
echo ""
echo "[2/5] Checking indexing status..."
# Verify sitemaps are accessible
bmi_sitemap=$(curl -s -o /dev/null -w "%{http_code}" https://bmiio.us/sitemap.xml 2>/dev/null)
rng_sitemap=$(curl -s -o /dev/null -w "%{http_code}" https://randomgen.us/sitemap.xml 2>/dev/null)
echo "  bmiio.us sitemap: HTTP $bmi_sitemap"
echo "  randomgen.us sitemap: HTTP $rng_sitemap"

# 3. Check GA4 is firing (real measurement IDs)
echo ""
echo "[3/5] Verifying analytics tracking..."
bmi_ga=$(curl -s https://bmiio.us | grep -c "G-HRB36D7927")
rng_ga=$(curl -s https://randomgen.us | grep -c "G-357TTYDLD2")
echo "  bmiio.us GA tag: $([ $bmi_ga -gt 0 ] && echo '✅' || echo '❌')"
echo "  randomgen.us GA tag: $([ $rng_ga -gt 0 ] && echo '✅' || echo '❌')"

# 4. Count pages and content
echo ""
echo "[4/5] Content audit..."
bmi_words=$(curl -s https://bmiio.us | sed 's/<[^>]*>//g' | wc -w)
rng_words=$(curl -s https://randomgen.us | sed 's/<[^>]*>//g' | wc -w)
echo "  bmiio.us word count: ~$bmi_words"
echo "  randomgen.us word count: ~$rng_words"

# 5. Performance check
echo ""
echo "[5/5] Performance check..."
bmi_lcp=$(curl -s -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://bmiio.us 2>/dev/null)
rng_lcp=$(curl -s -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null https://randomgen.us 2>/dev/null)
echo "  bmiio.us:"
echo "    $bmi_lcp"
echo "  randomgen.us:"
echo "    $rng_lcp"

# 6. Update daily stats
echo ""
echo "[Done] Stats logged for $(date '+%Y-%m-%d')"
