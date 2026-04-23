// ── Data & Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'cycle_app_data';

const CYCLE_DATA = {
  e2:          [30,32,36,42,50,62,78,95,118,142,165,185,200,195,90,75,70,68,65,62,58,52,46,40,35,30,27,24],
  p4:          [1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,8,14,18,21,20,18,14,10,7,4,2,1,1],
  lh:          [4,4,4,5,5,6,6,7,8,10,14,22,40,90,25,8,5,5,4,4,4,4,4,4,4,4,4,5],
  fsh:         [8,9,10,11,11,10,9,9,9,9,9,10,11,13,8,5,4,4,4,4,4,4,5,5,6,7,8,9],
  bbt:         [36.4,36.3,36.4,36.3,36.4,36.5,36.5,36.6,36.6,36.6,36.7,36.6,36.6,36.5,36.8,37.0,37.1,37.1,37.2,37.1,37.0,37.1,37.0,36.9,36.8,36.7,36.6,36.4],
  weight:      [0,-0.1,-0.3,-0.5,-0.6,-0.5,-0.4,-0.3,-0.2,-0.1,0,0.1,0.2,0.3,0.4,0.5,0.7,0.9,1.1,1.3,1.5,1.6,1.7,1.5,1.2,0.8,0.4,0.2],
  bloat:       [4,5,5,4,3,2,1,1,1,1,1,1,1,2,3,4,5,6,7,7,7,6,5,4,3,3,2,2],
  migraine:    [3,4,5,4,3,2,1,1,1,1,1,1,1,1,2,3,3,3,4,4,4,4,4,5,5,4,3,3],
  fertile:     [0,0,0,0,0,0,1,2,3,5,7,9,10,10,5,2,1,0,0,0,0,0,0,0,0,0,0,0],
  endometrium: [2,2,2,2,2,2,3,4,5,6,7,8,9,10,10,11,12,12,13,13,14,13,12,11,10,8,6,3],
};

const PHASES = [
  {name:'月經期', days:[1,5],   color:'#c0576a', bg:'#3d1520'},
  {name:'卵泡期', days:[6,13],  color:'#8b7fd4', bg:'#1e1a3d'},
  {name:'排卵期', days:[14,14], color:'#4db896', bg:'#0d2e24'},
  {name:'黃體期', days:[15,28], color:'#d4974d', bg:'#2e1f0a'},
];

const GROUPS = {
  '賀爾蒙': {
    keys: ['e2','p4','lh','fsh'],
    meta: {
      e2:  {label:'雌激素 E2',      color:'#a89ae8', dash:false, unit:'pg/mL'},
      p4:  {label:'黃體素 P4',      color:'#e8835a', dash:true,  unit:'ng/mL×10'},
      lh:  {label:'LH 黃體生成素',  color:'#4db896', dash:false, unit:'mIU/mL'},
      fsh: {label:'FSH 卵泡刺激素', color:'#d4a84d', dash:true,  unit:'mIU/mL'},
    }
  },
  '體溫體重': {
    keys: ['bbt','weight'],
    meta: {
      bbt:    {label:'基礎體溫 BBT', color:'#e87fa0', dash:false, unit:'°C'},
      weight: {label:'體重變化',      color:'#7fa8e8', dash:true,  unit:'kg'},
    }
  },
  '症狀': {
    keys: ['bloat','migraine'],
    meta: {
      bloat:    {label:'脹氣程度',   color:'#e8a85a', dash:false, unit:'(0-10)'},
      migraine: {label:'偏頭痛風險', color:'#e87070', dash:true,  unit:'(0-10)'},
    }
  },
  '生育指標': {
    keys: ['fertile','endometrium'],
    meta: {
      fertile:     {label:'受孕機率',    color:'#4db896', dash:false, unit:'(0-10)'},
      endometrium: {label:'子宮內膜厚度', color:'#e87fa0', dash:true,  unit:'mm'},
    }
  },
};

// ── State ─────────────────────────────────────────────────────────
let state = {
  users: [],           // [{id, name, color, cycleStart, cycleLen, periodLen, logs: {}}]
  activeUser: 0,
  currentView: 'home', // home | chart | log | settings
  chartGroup: '賀爾蒙',
  chartHidden: new Set(),
  chartInstance: null,
};

// ── Storage ───────────────────────────────────────────────────────
function save() {
  const d = { users: state.users, activeUser: state.activeUser };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (d) { state.users = d.users; state.activeUser = d.activeUser; }
  } catch(e) {}
}

// ── Helpers ───────────────────────────────────────────────────────
function getUser() { return state.users[state.activeUser] || null; }

function cycleDay(user) {
  if (!user || !user.cycleStart) return 1;
  const start = new Date(user.cycleStart);
  const today = new Date();
  const diff = Math.floor((today - start) / 86400000);
  const len = user.cycleLen || 28;
  return ((diff % len) + len) % len + 1;
}

function phaseOf(day) {
  if (day <= 5)  return PHASES[0];
  if (day <= 13) return PHASES[1];
  if (day === 14) return PHASES[2];
  return PHASES[3];
}

function todayKey() {
  return new Date().toISOString().slice(0,10);
}

function symptomLevel(val) {
  if (val <= 2) return {label:'輕微', color:'#4db896'};
  if (val <= 5) return {label:'中等', color:'#d4a84d'};
  return {label:'嚴重', color:'#e87070'};
}

// ── Render ────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const user = getUser();

  if (state.users.length === 0 || state.currentView === 'settings') {
    renderSettings(app, user);
    return;
  }

  // Nav bar
  const nav = el('nav', 'nav-bar');
  ['home','chart','log'].forEach(v => {
    const icons = {home:'🌙', chart:'📊', log:'✏️'};
    const labels = {home:'總覽', chart:'曲線', log:'記錄'};
    const btn = el('button', 'nav-btn' + (state.currentView===v?' active':''));
    btn.innerHTML = `<span class="nav-icon">${icons[v]}</span><span class="nav-label">${labels[v]}</span>`;
    btn.onclick = () => { state.currentView = v; render(); };
    nav.appendChild(btn);
  });
  // Settings btn
  const sbtn = el('button', 'nav-btn' + (state.currentView==='settings'?' active':''));
  sbtn.innerHTML = `<span class="nav-icon">⚙</span><span class="nav-label">設定</span>`;
  sbtn.onclick = () => { state.currentView = 'settings'; render(); };
  nav.appendChild(sbtn);
  app.appendChild(nav);

  const main = el('main', 'main-content');
  app.appendChild(main);

  if (state.currentView === 'home')  renderHome(main, user);
  if (state.currentView === 'chart') renderChart(main, user);
  if (state.currentView === 'log')   renderLog(main, user);
}

function renderHome(container, user) {
  const day = cycleDay(user);
  const phase = phaseOf(day);

  // Header
  const header = el('div', 'home-header');
  header.style.background = phase.bg;

  // User switcher
  if (state.users.length > 1) {
    const switcher = el('div', 'user-switcher');
    state.users.forEach((u,i) => {
      const dot = el('button', 'user-dot' + (i===state.activeUser?' active':''));
      dot.textContent = u.name[0];
      dot.style.background = u.color || '#c0576a';
      dot.onclick = () => { state.activeUser = i; render(); };
      switcher.appendChild(dot);
    });
    header.appendChild(switcher);
  }

  const moon = el('div', 'moon-circle');
  moon.style.borderColor = phase.color;
  moon.innerHTML = `<span class="day-num">${day}</span><span class="day-label">第 ${day} 天</span>`;
  header.appendChild(moon);

  const phaseBadge = el('div', 'phase-badge');
  phaseBadge.style.background = phase.color + '33';
  phaseBadge.style.color = phase.color;
  phaseBadge.textContent = phase.name;
  header.appendChild(phaseBadge);

  const cycleBar = el('div', 'cycle-bar-wrap');
  const bar = el('div', 'cycle-bar');
  PHASES.forEach(p => {
    const len = p.days[1] - p.days[0] + 1;
    const seg = el('div', 'cycle-seg');
    seg.style.width = `${(len/28)*100}%`;
    seg.style.background = p.color + (day >= p.days[0] && day <= p.days[1] ? 'cc' : '44');
    bar.appendChild(seg);
  });
  const indicator = el('div', 'cycle-indicator');
  indicator.style.left = `${((day-1)/28)*100}%`;
  bar.appendChild(indicator);
  cycleBar.appendChild(bar);

  const barLabels = el('div', 'bar-labels');
  PHASES.forEach(p => {
    const s = el('span','');
    s.style.width = `${((p.days[1]-p.days[0]+1)/28)*100}%`;
    s.style.color = p.color;
    s.textContent = p.name;
    barLabels.appendChild(s);
  });
  cycleBar.appendChild(barLabels);
  header.appendChild(cycleBar);
  container.appendChild(header);

  // Symptom cards
  const grid = el('div', 'sym-grid');
  const todayData = [
    {icon:'💊', name:'雌激素', val: CYCLE_DATA.e2[day-1].toFixed(0)+' pg/mL', sub: day===14?'峰值':'正常'},
    {icon:'🌡️', name:'體溫 BBT', val: CYCLE_DATA.bbt[day-1].toFixed(2)+'°C', sub: day>=15?'升高':'基礎'},
    {icon:'⚖️', name:'體重變化', val: (CYCLE_DATA.weight[day-1]>=0?'+':'')+CYCLE_DATA.weight[day-1].toFixed(1)+' kg', sub: CYCLE_DATA.weight[day-1]>1?'注意水腫':'穩定'},
    {icon:'🫧', name:'脹氣', val: symptomLevel(CYCLE_DATA.bloat[day-1]).label, sub: `嚴重度 ${CYCLE_DATA.bloat[day-1]}/10`, color: symptomLevel(CYCLE_DATA.bloat[day-1]).color},
    {icon:'🧠', name:'偏頭痛風險', val: symptomLevel(CYCLE_DATA.migraine[day-1]).label, sub: `風險 ${CYCLE_DATA.migraine[day-1]}/10`, color: symptomLevel(CYCLE_DATA.migraine[day-1]).color},
    {icon:'🌸', name:'受孕機率', val: CYCLE_DATA.fertile[day-1]>=8?'極高':CYCLE_DATA.fertile[day-1]>=5?'高':CYCLE_DATA.fertile[day-1]>=2?'中':'低', sub: `${CYCLE_DATA.fertile[day-1]*10}%`, color: CYCLE_DATA.fertile[day-1]>=8?'#4db896':'#d4a84d'},
    {icon:'🫀', name:'子宮內膜', val: CYCLE_DATA.endometrium[day-1]+' mm', sub: day<=5?'剝落中':day>=15?'增厚':'增厚中'},
    {icon:'🩸', name:'黃體素', val: CYCLE_DATA.p4[day-1].toFixed(0)+' ng/mL', sub: day>=15?'上升':'低'},
  ];
  todayData.forEach(d => {
    const card = el('div', 'sym-card');
    card.innerHTML = `
      <div class="sym-icon">${d.icon}</div>
      <div class="sym-name">${d.name}</div>
      <div class="sym-val" style="${d.color?'color:'+d.color:''}">${d.val}</div>
      <div class="sym-sub">${d.sub}</div>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // Today's log summary
  const user2 = getUser();
  const log = user2.logs && user2.logs[todayKey()];
  const logSection = el('div', 'log-preview');
  if (log) {
    logSection.innerHTML = `<div class="log-preview-title">今日記錄 ✓</div>
      <div class="log-preview-row">${log.weight?'體重 '+log.weight+'kg · ':''}${log.bbt?'體溫 '+log.bbt+'°C · ':''}${log.mood?'心情 '+'★'.repeat(log.mood):''}${log.note?'<br><span class="log-note">'+log.note+'</span>':''}</div>`;
  } else {
    logSection.innerHTML = `<div class="log-preview-title">今日尚未記錄</div>
      <button class="log-now-btn" onclick="state.currentView='log';render()">立刻記錄今天 →</button>`;
  }
  container.appendChild(logSection);

  // Insight tip
  const tip = el('div', 'insight-tip');
  tip.style.borderColor = phase.color;
  const tips = {
    '月經期': '現在是月經期，黃體素和雌激素都降至最低，脹氣和偏頭痛風險較高。多補充鐵質和暖身飲食。',
    '卵泡期': '卵泡期雌激素逐漸升高，精力開始恢復，脹氣和偏頭痛風險低，是運動和計畫的好時機。',
    '排卵期': '今天是排卵日！雌激素達到峰值，LH 急速飆升，受孕機率最高，體力和情緒通常最佳。',
    '黃體期': '黃體期黃體素主導，體溫升高、脹氣和體重上升是正常現象，月經前幾天偏頭痛風險最高。',
  };
  tip.innerHTML = `<div class="tip-phase" style="color:${phase.color}">${phase.name}</div><div class="tip-text">${tips[phase.name]}</div>`;
  container.appendChild(tip);
}

function renderChart(container, user) {
  const day = cycleDay(user);

  const head = el('div', 'chart-head');
  head.innerHTML = `<div class="chart-title">28天週期曲線</div><div class="chart-daybadge">今天第 ${day} 天</div>`;
  container.appendChild(head);

  // Phase bar
  const pbar = el('div', 'phase-bar-chart');
  PHASES.forEach(p => {
    const seg = el('div', 'pbar-seg');
    seg.style.cssText = `width:${((p.days[1]-p.days[0]+1)/28)*100}%;background:${p.color}44;color:${p.color};`;
    seg.textContent = p.name;
    pbar.appendChild(seg);
  });
  container.appendChild(pbar);

  // Group tabs
  const tabs = el('div', 'chart-tabs');
  Object.keys(GROUPS).forEach(g => {
    const btn = el('button', 'chart-tab' + (state.chartGroup===g?' active':''));
    btn.textContent = g;
    btn.onclick = () => { state.chartGroup = g; state.chartHidden = new Set(); renderChart(container, user); };
    tabs.appendChild(btn);
  });
  container.appendChild(tabs);

  // Legend
  const grp = GROUPS[state.chartGroup];
  const legend = el('div', 'chart-legend');
  grp.keys.forEach(k => {
    const m = grp.meta[k];
    const item = el('div', 'legend-item');
    item.style.opacity = state.chartHidden.has(k) ? '0.35' : '1';
    item.innerHTML = `<span class="leg-swatch" style="background:${m.color};${m.dash?'background:none;border-top:2px dashed '+m.color+';':''}"></span>${m.label}`;
    item.onclick = () => {
      state.chartHidden.has(k) ? state.chartHidden.delete(k) : state.chartHidden.add(k);
      document.querySelectorAll('.legend-item').forEach((el2,i) => {
        el2.style.opacity = state.chartHidden.has(grp.keys[i]) ? '0.35' : '1';
      });
      if (state.chartInstance) {
        state.chartInstance.data.datasets.forEach((ds,i) => {
          state.chartInstance.setDatasetVisibility(i, !state.chartHidden.has(grp.keys[i]));
        });
        state.chartInstance.update();
      }
    };
    legend.appendChild(item);
  });
  container.appendChild(legend);

  // Chart canvas
  const wrap = el('div', 'canvas-wrap');
  const canvas = document.createElement('canvas');
  canvas.id = 'mainChart';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','28天生理週期曲線圖');
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  // Today line annotation data
  setTimeout(() => {
    if (state.chartInstance) { state.chartInstance.destroy(); state.chartInstance = null; }
    const days = Array.from({length:28},(_,i)=>i+1);
    const datasets = grp.keys.map(k => {
      const m = grp.meta[k];
      const vals = CYCLE_DATA[k].map(v => +v.toFixed(2));
      return {
        label: m.label, data: vals,
        borderColor: m.color, backgroundColor: m.color+'18',
        borderWidth: 2.5,
        borderDash: m.dash ? [6,4] : [],
        pointRadius: days.map((_,i) => i+1===day ? 6 : 2),
        pointBackgroundColor: days.map((_,i) => i+1===day ? '#fff' : m.color),
        pointBorderColor: days.map((_,i) => i+1===day ? m.color : m.color),
        pointBorderWidth: days.map((_,i) => i+1===day ? 2.5 : 0),
        tension: 0.45, fill: false,
        hidden: state.chartHidden.has(k),
      };
    });

    const yScales = {};
    if (state.chartGroup === '體溫體重') {
      yScales.y = {position:'left', min:35.8, max:37.6, ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
      yScales.y2 = {position:'right', min:-1, max:2.5, ticks:{color:'#888',font:{size:10}}, grid:{display:false}};
      datasets[0].yAxisID = 'y';
      datasets[1].yAxisID = 'y2';
    } else if (state.chartGroup === '賀爾蒙') {
      yScales.y = {min:0, max:220, ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
    } else {
      yScales.y = {min:0, max:16, ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
    }

    // Today vertical line plugin
    const todayLine = {
      id:'todayLine',
      beforeDraw(chart) {
        const {ctx, chartArea, scales} = chart;
        const x = scales.x.getPixelForValue(day-1);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4,3]);
        ctx.stroke();
        ctx.restore();
      }
    };

    state.chartInstance = new Chart(canvas, {
      type: 'line',
      plugins: [todayLine],
      data: { labels: days, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor: 'rgba(20,8,16,0.95)',
            titleColor: '#fff',
            bodyColor: '#bbb',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: items => `第 ${items[0].label} 天`,
              label: item => ` ${item.dataset.label}: ${item.raw}`,
            }
          }
        },
        scales: {
          x: { ticks: { color:'#888', font:{size:10}, callback:(v,i) => (i+1)%7===0||(i+1)===1?`第${i+1}天`:'' }, grid:{color:'rgba(255,255,255,0.04)'} },
          ...yScales,
        },
        animation: { duration:400 },
      }
    });
  }, 50);
}

function renderLog(container, user) {
  const today = todayKey();
  const existing = user.logs && user.logs[today] || {};

  const head = el('div', 'log-head');
  head.innerHTML = `<div class="log-head-title">今日記錄</div><div class="log-head-date">${today}</div>`;
  container.appendChild(head);

  const form = el('div', 'log-form');

  // Weight
  form.appendChild(formRow('⚖️','體重', `<input type="number" id="f-weight" step="0.1" min="30" max="150" placeholder="kg" value="${existing.weight||''}">`));
  // BBT
  form.appendChild(formRow('🌡️','基礎體溫 BBT', `<input type="number" id="f-bbt" step="0.01" min="35" max="38.5" placeholder="°C" value="${existing.bbt||''}">`));
  // Mood
  const moodStars = [1,2,3,4,5].map(i =>
    `<button class="star-btn ${(existing.mood||0)>=i?'active':''}" onclick="setMood(${i})" id="star-${i}">★</button>`
  ).join('');
  form.appendChild(formRow('😊','心情', `<div class="star-row">${moodStars}</div>`));

  // Symptoms checkboxes
  const symOpts = ['脹氣','偏頭痛','痙攣','腰痠','乳房脹痛','噁心','疲倦','情緒波動'];
  const checked = existing.symptoms || [];
  const symHtml = symOpts.map(s =>
    `<label class="sym-check ${checked.includes(s)?'active':''}"><input type="checkbox" value="${s}" ${checked.includes(s)?'checked':''} onchange="toggleSym(this)"> ${s}</label>`
  ).join('');
  const symRow = el('div', 'form-row-full');
  symRow.innerHTML = `<div class="form-label">🩺 今日症狀</div><div class="sym-checks">${symHtml}</div>`;
  form.appendChild(symRow);

  // Note
  form.appendChild(formRow('📝','備註', `<textarea id="f-note" rows="3" placeholder="記錄今天的感受...">${existing.note||''}</textarea>`));

  const saveBtn = el('button', 'save-btn');
  saveBtn.textContent = '儲存今日記錄';
  saveBtn.onclick = () => saveLog(user, today);
  form.appendChild(saveBtn);

  container.appendChild(form);

  // Past 7 logs
  const pastLogs = Object.entries(user.logs||{}).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7);
  if (pastLogs.length > 0) {
    const hist = el('div', 'log-history');
    hist.innerHTML = '<div class="hist-title">最近記錄</div>';
    pastLogs.forEach(([date, log]) => {
      const row = el('div', 'hist-row');
      row.innerHTML = `<span class="hist-date">${date}</span>
        <span class="hist-vals">${log.weight?log.weight+'kg':''} ${log.bbt?log.bbt+'°C':''} ${'★'.repeat(log.mood||0)}</span>`;
      hist.appendChild(row);
    });
    container.appendChild(hist);
  }
}

function renderSettings(container, user) {
  const wrap = el('div', 'settings-wrap');
  wrap.innerHTML = `<div class="settings-title">👤 使用者管理</div>`;

  // User list
  if (state.users.length > 0) {
    state.users.forEach((u,i) => {
      const row = el('div', 'user-row');
      row.innerHTML = `
        <div class="user-avatar" style="background:${u.color}">${u.name[0]}</div>
        <div class="user-info"><div class="user-name">${u.name}</div><div class="user-sub">週期 ${u.cycleLen}天 · 經期 ${u.periodLen}天</div></div>
        <div class="user-actions">
          <button onclick="editUser(${i})">編輯</button>
          ${state.users.length>1?`<button onclick="deleteUser(${i})">刪除</button>`:''}
        </div>`;
      wrap.appendChild(row);
    });
  }

  // Add user form
  const addSection = el('div', 'add-user-section');
  addSection.innerHTML = `
    <div class="settings-subtitle">${state.users.length===0?'新增第一位使用者':'新增家人'}</div>
    <div class="add-form">
      <input type="text" id="new-name" placeholder="姓名（如：小雅）" maxlength="10">
      <input type="date" id="new-start" placeholder="最近一次月經開始日">
      <div class="form-label-sm">月經開始日</div>
      <div class="inline-inputs">
        <label>週期長度 <input type="number" id="new-cycle" value="28" min="21" max="40"> 天</label>
        <label>經期長度 <input type="number" id="new-period" value="5" min="2" max="10"> 天</label>
      </div>
      <div class="color-row">
        ${['#c0576a','#8b7fd4','#4db896','#d4974d','#e87fa0','#7fa8e8'].map(c=>
          `<button class="color-dot" style="background:${c}" onclick="selectColor('${c}',this)"></button>`
        ).join('')}
      </div>
      <button class="add-user-btn" onclick="addUser()">新增使用者</button>
    </div>`;
  wrap.appendChild(addSection);

  if (state.users.length > 0) {
    const backBtn = el('button', 'back-btn');
    backBtn.textContent = '← 返回';
    backBtn.onclick = () => { state.currentView = 'home'; render(); };
    wrap.appendChild(backBtn);
  }

  container.appendChild(wrap);

  // Pre-select first color
  setTimeout(() => {
    const first = document.querySelector('.color-dot');
    if (first) { first.classList.add('selected'); window._selectedColor = '#c0576a'; }
  }, 50);
}

// ── Form helpers ──────────────────────────────────────────────────
function formRow(icon, label, inputHtml) {
  const row = el('div', 'form-row');
  row.innerHTML = `<div class="form-label">${icon} ${label}</div>${inputHtml}`;
  return row;
}

window.setMood = function(val) {
  [1,2,3,4,5].forEach(i => {
    const s = document.getElementById(`star-${i}`);
    if(s) s.classList.toggle('active', i<=val);
  });
  window._mood = val;
};

window.toggleSym = function(el2) {
  el2.closest('label').classList.toggle('active', el2.checked);
};

window.selectColor = function(color, btn) {
  document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._selectedColor = color;
};

window.editUser = function(i) {
  const u = state.users[i];
  const name = prompt('姓名', u.name);
  if (!name) return;
  const cycle = parseInt(prompt('週期長度（天）', u.cycleLen));
  const period = parseInt(prompt('經期長度（天）', u.periodLen));
  if (isNaN(cycle)||isNaN(period)) return;
  state.users[i] = {...u, name, cycleLen:cycle, periodLen:period};
  save(); render();
};

window.deleteUser = function(i) {
  if (!confirm(`確定刪除「${state.users[i].name}」的資料？`)) return;
  state.users.splice(i,1);
  if (state.activeUser >= state.users.length) state.activeUser = 0;
  save(); render();
};

function addUser() {
  const name = document.getElementById('new-name').value.trim();
  const start = document.getElementById('new-start').value;
  const cycle = parseInt(document.getElementById('new-cycle').value);
  const period = parseInt(document.getElementById('new-period').value);
  if (!name) { alert('請輸入姓名'); return; }
  if (!start) { alert('請輸入月經開始日'); return; }
  state.users.push({
    id: Date.now(),
    name, cycleStart: start,
    cycleLen: cycle||28, periodLen: period||5,
    color: window._selectedColor || '#c0576a',
    logs: {},
  });
  state.activeUser = state.users.length - 1;
  save();
  state.currentView = 'home';
  render();
}

function saveLog(user, date) {
  if (!user.logs) user.logs = {};
  const symptoms = [];
  document.querySelectorAll('.sym-checks input:checked').forEach(el2 => symptoms.push(el2.value));
  user.logs[date] = {
    weight: document.getElementById('f-weight').value || null,
    bbt: document.getElementById('f-bbt').value || null,
    mood: window._mood || 0,
    symptoms,
    note: document.getElementById('f-note').value || null,
  };
  save();
  state.currentView = 'home';
  render();
}

// ── Utils ─────────────────────────────────────────────────────────
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

// ── Init ──────────────────────────────────────────────────────────
function init() {
  load();
  if (state.users.length === 0) state.currentView = 'settings';
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
}

document.addEventListener('DOMContentLoaded', init);
