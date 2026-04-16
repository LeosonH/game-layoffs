// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const COLORS = {
  Console:   '#5badf0',
  Indie:     '#b380f5',
  Mobile:    '#50c878',
  Online:    '#f5a050',
  'AR/VR':   '#f080a0',
  Publisher: '#d4c050',
  Tech:      '#50d0d0',
  Unknown:   '#888',
};

Chart.defaults.color = '#8888aa';
Chart.defaults.borderColor = '#2a2a4a';

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
}

// ─── Date / type helpers ──────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
  const m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
  return null;
}

function normType(t) {
  const s = t.trim().toLowerCase();
  if (s.includes('console'))   return 'Console';
  if (s.includes('indie'))     return 'Indie';
  if (s.includes('mobile'))    return 'Mobile';
  if (s.includes('online'))    return 'Online';
  if (s.includes('ar') || s.includes('vr')) return 'AR/VR';
  if (s.includes('publisher')) return 'Publisher';
  if (s.includes('tech'))      return 'Tech';
  return t.trim() || 'Unknown';
}

// ─── Initialise app with loaded data ─────────────────────────────────────────
function init(rawData) {
  const data = rawData.map(r => {
    const date = parseDate(r['Date']);
    const hc = parseInt(r['Headcount'], 10);
    return {
      studio:    r['Studio'] || '?',
      date,
      dateStr:   date ? `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` : r['Date'],
      month:     date ? date.getMonth() : null,
      headcount: isNaN(hc) ? null : hc,
      parent:    r['Parent'] || '',
      type:      normType(r['Type']),
      studioLoc: r['Studio Location'] || '',
      parentLoc: r['Parent Location'] || '',
    };
  }).filter(r => r.date !== null || r.dateStr);

  // ─── Populate filter dropdowns ────────────────────────────────────────────
  function unique(arr) { return [...new Set(arr)].filter(Boolean).sort(); }

  const types = unique(data.map(d => d.type));
  const months = [0,1,2,3,4,5,6,7,8,9,10,11]
    .filter(m => data.some(d => d.month === m));
  const parentLocs = unique(data.map(d => d.parentLoc));

  const typeSelect  = document.getElementById('filter-type');
  const monthSelect = document.getElementById('filter-month');
  const plSelect    = document.getElementById('filter-parent-loc');
  const searchInput = document.getElementById('search');

  types.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    typeSelect.appendChild(o);
  });

  months.forEach(m => {
    const o = document.createElement('option');
    o.value = m; o.textContent = MONTH_NAMES[m];
    monthSelect.appendChild(o);
  });

  parentLocs.forEach(l => {
    const o = document.createElement('option');
    o.value = l; o.textContent = l;
    plSelect.appendChild(o);
  });

  // ─── Stats ────────────────────────────────────────────────────────────────
  function renderStats(filtered) {
    const totalHC = filtered.reduce((s, d) => s + (d.headcount || 0), 0);
    const knownHC = filtered.filter(d => d.headcount !== null).length;
    const studios = new Set(filtered.map(d => d.studio)).size;
    const bar = document.getElementById('stat-bar');
    bar.innerHTML = `
      <div class="stat">
        <span class="stat-value">${filtered.length}</span>
        <span class="stat-label">Layoff Events</span>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <span class="stat-value">${totalHC.toLocaleString()}</span>
        <span class="stat-label">Known Jobs Lost</span>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <span class="stat-value">${studios}</span>
        <span class="stat-label">Studios Affected</span>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <span class="stat-value">${filtered.length - knownHC}</span>
        <span class="stat-label">Events w/ Unknown Count</span>
      </div>
    `;
  }

  // ─── Charts ───────────────────────────────────────────────────────────────
  let chartMonth, chartType, chartTop;

  function buildMonthChart(filtered) {
    const ctx = document.getElementById('chartMonth').getContext('2d');
    const monthly = Array(12).fill(0);
    filtered.forEach(d => { if (d.month !== null && d.headcount) monthly[d.month] += d.headcount; });
    const labels = months.map(m => MONTH_NAMES[m]);
    const values = months.map(m => monthly[m]);

    if (chartMonth) chartMonth.destroy();
    chartMonth = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Jobs Lost',
          data: values,
          backgroundColor: 'rgba(233,69,96,0.7)',
          borderColor: '#e94560',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.parsed.y.toLocaleString()} jobs` } }
        },
        scales: {
          x: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa' } },
          y: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa' }, beginAtZero: true }
        }
      }
    });
  }

  function buildTypeChart(filtered) {
    const ctx = document.getElementById('chartType').getContext('2d');
    const counts = {};
    filtered.forEach(d => { counts[d.type] = (counts[d.type] || 0) + (d.headcount || 0); });
    const labels = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
    const values = labels.map(l => counts[l]);
    const colors = labels.map(l => COLORS[l] || '#888');

    if (chartType) chartType.destroy();
    chartType = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors.map(c => c + 'bb'),
                     borderColor: colors, borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { color: '#cccce0', boxWidth: 12, padding: 10 } },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed.toLocaleString()} jobs` } }
        }
      }
    });
  }

  function buildTopChart(filtered) {
    const ctx = document.getElementById('chartTop').getContext('2d');
    const sorted = filtered.filter(d => d.headcount)
      .sort((a,b) => b.headcount - a.headcount)
      .slice(0, 15);

    if (chartTop) chartTop.destroy();
    chartTop = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.studio.length > 22 ? d.studio.slice(0, 20) + '…' : d.studio),
        datasets: [{
          label: 'Headcount',
          data: sorted.map(d => d.headcount),
          backgroundColor: sorted.map(d => (COLORS[d.type] || '#888') + 'aa'),
          borderColor: sorted.map(d => COLORS[d.type] || '#888'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: c => ` ${c.parsed.x.toLocaleString()} jobs`,
            afterLabel: c => ` Type: ${sorted[c.dataIndex].type}`
          }}
        },
        scales: {
          x: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa' } },
          y: { grid: { display: false }, ticks: { color: '#cccce0', font: { size: 11 } } }
        }
      }
    });
  }

  // ─── Table ────────────────────────────────────────────────────────────────
  let sortCol = 'date';
  let sortDir = 1;

  function badgeClass(type) {
    const m = { Console: 'console', Indie: 'indie', Mobile: 'mobile', Online: 'online',
      'AR/VR': 'arvr', Publisher: 'publisher', Tech: 'tech' };
    return 'badge badge-' + (m[type] || 'other');
  }

  function renderTable(filtered) {
    const tbody = document.getElementById('table-body');
    document.getElementById('result-count').textContent =
      `Showing ${filtered.length} of ${data.length} events`;

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td class="no-results" colspan="7">No results match your filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.dateStr || '—'}</td>
        <td class="studio">${d.studio}</td>
        <td class="${d.headcount !== null ? 'headcount' : 'unknown'}">
          ${d.headcount !== null ? d.headcount.toLocaleString() : 'Unknown'}
        </td>
        <td>${d.parent || '<span class="unknown">—</span>'}</td>
        <td><span class="${badgeClass(d.type)}">${d.type}</span></td>
        <td>${d.studioLoc || '<span class="unknown">—</span>'}</td>
        <td>${d.parentLoc || '<span class="unknown">—</span>'}</td>
      </tr>
    `).join('');
  }

  // ─── Sorting ──────────────────────────────────────────────────────────────
  document.querySelectorAll('thead th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) sortDir = -sortDir;
      else { sortCol = col; sortDir = 1; }
      document.querySelectorAll('thead th').forEach(t => t.classList.remove('asc', 'desc'));
      th.classList.add(sortDir === 1 ? 'asc' : 'desc');
      refresh();
    });
  });

  function sortData(arr) {
    return [...arr].sort((a,b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'date')      { va = a.date?.getTime() ?? 0; vb = b.date?.getTime() ?? 0; }
      if (sortCol === 'headcount') { va = a.headcount ?? -1;      vb = b.headcount ?? -1; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return -sortDir;
      if (va > vb) return sortDir;
      return 0;
    });
  }

  // ─── Filter & refresh ─────────────────────────────────────────────────────
  function getFiltered() {
    const fType  = typeSelect.value;
    const fMonth = monthSelect.value;
    const fPL    = plSelect.value;
    const q      = searchInput.value.trim().toLowerCase();

    return data.filter(d => {
      if (fType  && d.type !== fType)                           return false;
      if (fMonth !== '' && d.month !== +fMonth)                 return false;
      if (fPL    && d.parentLoc !== fPL)                        return false;
      if (q && !d.studio.toLowerCase().includes(q)
             && !d.parent.toLowerCase().includes(q))            return false;
      return true;
    });
  }

  function refresh() {
    const filtered = getFiltered();
    renderStats(filtered);
    buildMonthChart(filtered);
    buildTypeChart(filtered);
    buildTopChart(sortData(filtered));
    renderTable(sortData(filtered));
  }

  typeSelect.addEventListener('change', refresh);
  monthSelect.addEventListener('change', refresh);
  plSelect.addEventListener('change', refresh);
  searchInput.addEventListener('input', refresh);

  document.getElementById('btn-reset').addEventListener('click', () => {
    typeSelect.value  = '';
    monthSelect.value = '';
    plSelect.value    = '';
    searchInput.value = '';
    refresh();
  });

  refresh();
}

// ─── Load data ────────────────────────────────────────────────────────────────
fetch('assets/data/data.csv')
  .then(r => r.text())
  .then(text => init(parseCSV(text)))
  .catch(err => console.error('Failed to load data:', err));
