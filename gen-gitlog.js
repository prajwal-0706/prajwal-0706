const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'assets');
fs.mkdirSync(outDir, { recursive: true });

const commits = [
  { hash: '9f3c1a2', refs: 'HEAD -> main, tag: v2026.10', msg: 'ship three open-source fixes in one week', lane: 0, date: 'Oct 2026' },
  { hash: '4d8e77b', msg: 'feat: licensing control plane for self-hosted customers', lane: 0, date: '2026' },
  { hash: 'b21c0de', msg: 'feat: Budget AI, an LLM gateway from blank spec to prod beta', lane: 0, date: 'Sep 2026' },
  { hash: 'e7a9c44', msg: 'chore: join ANTS Platform as founding engineer', lane: 0, date: 'Jan 2026' },
  { hash: '8c7e5d3', msg: 'docs: B.E. Computer Science, CGPA 9.48', lane: 0, date: 'May 2025' },
  { hash: 'c5d0f1e', msg: 'side: Fusion Flow, a no-code scraping SaaS', lane: 1, date: 'Apr 2025' },
  { hash: '1b4d2c9', msg: 'feat: WhatsApp inside the CRM at Sell.Do, 32+ clients', lane: 0, date: 'Jan 2025' },
  { hash: '7a2b9ee', msg: 'side: Lingo, a language app with AI voice lessons', lane: 1, date: 'Apr 2024' },
  { hash: '5e4d3c2', msg: 'side: Keep Up, a real-time notes editor', lane: 1, date: 'Dec 2023' },
  { hash: '2f1a6b4', msg: 'feat: ranked #1 at CodeQuest, Techfest 2023', lane: 0, date: '2023' },
  { hash: '6d9c0e2', msg: 'feat: led 20+ events as COMPSA technical head', lane: 0, date: '2023' },
  { hash: '0a1b2c3', msg: 'init: hello world, Pune', lane: 0, date: '2021' },
];

const themes = {
  dark: { bg: '#0d1117', win: '#161b22', border: '#30363d', text: '#c9d1d9', muted: '#8b949e', refs: '#d29922', main: '#58a6ff', side: '#bc8cff', prompt: '#3fb950', dot: '#ff5f56', dot2: '#ffbd2e', dot3: '#27c93f' },
  light: { bg: '#ffffff', win: '#f6f8fa', border: '#d0d7de', text: '#24292f', muted: '#57606a', refs: '#9a6700', main: '#0969da', side: '#8250df', prompt: '#1a7f37', dot: '#ff5f56', dot2: '#ffbd2e', dot3: '#27c93f' },
};

const W = 900;
const rowStart = 100;
const rowStep = 21;
const laneX = [52, 76];
const textX = 100;
const H = rowStart + rowStep * commits.length + 44;
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(t) {
  const rowY = (i) => rowStart + rowStep * i;
  const sideRows = commits.map((c, i) => (c.lane === 1 ? i : -1)).filter((i) => i >= 0);
  const sideTop = sideRows[0];
  const sideBottom = sideRows[sideRows.length - 1];

  let graph = '';
  graph += `<line x1="${laneX[0]}" y1="${rowY(0) - 6}" x2="${laneX[0]}" y2="${rowY(commits.length - 1) + 6}" stroke="${t.main}" stroke-width="2" stroke-opacity="0.7"/>`;
  graph += `<path d="M${laneX[0]} ${rowY(sideTop - 1)} C${laneX[0]} ${rowY(sideTop - 1) + 12} ${laneX[1]} ${rowY(sideTop) - 12} ${laneX[1]} ${rowY(sideTop)}" fill="none" stroke="${t.side}" stroke-width="2" stroke-opacity="0.8"/>`;
  graph += `<line x1="${laneX[1]}" y1="${rowY(sideTop)}" x2="${laneX[1]}" y2="${rowY(sideBottom)}" stroke="${t.side}" stroke-width="2" stroke-opacity="0.8"/>`;
  graph += `<path d="M${laneX[1]} ${rowY(sideBottom)} C${laneX[1]} ${rowY(sideBottom) + 12} ${laneX[0]} ${rowY(sideBottom + 1) - 12} ${laneX[0]} ${rowY(sideBottom + 1)}" fill="none" stroke="${t.side}" stroke-width="2" stroke-opacity="0.8"/>`;

  let rows = '';
  commits.forEach((c, i) => {
    const y = rowY(i);
    const begin = (0.6 + i * 0.32).toFixed(2);
    const color = c.lane === 1 ? t.side : t.main;
    const refs = c.refs ? `<tspan fill="${t.refs}">(${esc(c.refs)}) </tspan>` : '';
    rows += `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="${begin}s" fill="freeze"/>`;
    rows += `<circle cx="${laneX[c.lane]}" cy="${y}" r="4.5" fill="${t.win}" stroke="${color}" stroke-width="2"/>`;
    rows += `<text x="${textX}" y="${y + 4}" font-family="${mono}" font-size="13" fill="${t.text}"><tspan fill="${t.muted}">${c.hash}</tspan> ${refs}${esc(c.msg)}</text>`;
    rows += `<text x="${W - 36}" y="${y + 4}" text-anchor="end" font-family="${mono}" font-size="12" fill="${t.muted}">${esc(c.date)}</text>`;
    rows += '</g>';
  });

  const endBegin = (0.6 + commits.length * 0.32 + 0.2).toFixed(2);
  const promptY = rowY(commits.length) + 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="git log of Prajwal Gadhave: founding engineer in 2026, three open-source fixes shipped, Budget AI gateway, Sell.Do, CodeQuest winner, COMPSA technical head, started in Pune in 2021">
  <rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="${t.bg}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${t.win}" stroke="${t.border}"/>
  <rect x="1" y="1" width="${W - 2}" height="38" rx="14" fill="${t.bg}"/>
  <rect x="1" y="24" width="${W - 2}" height="15" fill="${t.bg}"/>
  <line x1="1" y1="39" x2="${W - 1}" y2="39" stroke="${t.border}"/>
  <circle cx="22" cy="20" r="6" fill="${t.dot}"/>
  <circle cx="42" cy="20" r="6" fill="${t.dot2}"/>
  <circle cx="62" cy="20" r="6" fill="${t.dot3}"/>
  <text x="${W / 2}" y="25" text-anchor="middle" font-family="${mono}" font-size="12.5" fill="${t.muted}">prajwal@pune: ~/life</text>
  <text x="36" y="72" font-family="${mono}" font-size="13" fill="${t.text}"><tspan fill="${t.prompt}">$</tspan> git log --graph --oneline --date=short</text>
  <g>${graph}</g>
  ${rows}
  <g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="${endBegin}s" fill="freeze"/>
    <text x="36" y="${promptY}" font-family="${mono}" font-size="13" fill="${t.text}"><tspan fill="${t.prompt}">$</tspan> git push origin main</text>
    <rect x="${36 + 8 * 23}" y="${promptY - 12}" width="8" height="15" fill="${t.text}"><animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/></rect>
  </g>
</svg>
`;
}

for (const [name, t] of Object.entries(themes)) {
  const file = path.join(outDir, `gitlog-${name}.svg`);
  fs.writeFileSync(file, render(t));
  console.log('wrote', file);
}
