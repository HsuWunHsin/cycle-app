// ── Data & Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'cycle_app_data';

const CYCLE_DATA = {
  e2:          [30,32,36,42,50,62,78,95,118,142,165,185,200,195,90,75,70,68,65,62,58,52,46,40,35,30,27,24],
  p4:          [1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,8,14,18,21,20,18,14,10,7,4,2,1,1],
  lh:          [4,4,4,5,5,6,6,7,8,10,14,22,40,90// ── Data & Constants ──────────────────────────────────────────────
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
  weightChartInstance: null,
  logDate: null,
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
  ['home','chart','weight','log'].forEach(v => {
    const icons = {home:'🌙', chart:'📊', weight:'⚖️', log:'✏️'};
    const labels = {home:'總覽', chart:'曲線', weight:'體重', log:'記錄'};
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

  if (state.currentView === 'home')   renderHome(main, user);
  if (state.currentView === 'chart')  renderChart(main, user);
  if (state.currentView === 'weight') renderWeightAnalysis(main, user);
  if (state.currentView === 'log')    renderLog(main, user);
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

  // ── Date selector ──
  const head = el('div', 'log-head');
  const maxDate = today;
  // default to today; if state.logDate set, use it
  if (!state.logDate) state.logDate = today;
  const activeDate = state.logDate;
  const existing = user.logs && user.logs[activeDate] || {};

  // Compute cycle day for selected date
  const cycleLen = user.cycleLen || 28;
  const startMs  = new Date(user.cycleStart).getTime();
  const selMs    = new Date(activeDate).getTime();
  const diff     = Math.floor((selMs - startMs) / 86400000);
  const selDay   = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
  const selPhase = phaseOf(selDay);

  head.innerHTML = `
    <div class="log-head-title">記錄日誌</div>
    <div class="log-date-row">
      <button class="date-nav-btn" id="btn-prev-day">‹</button>
      <div class="log-date-center">
        <input type="date" id="log-date-picker" value="${activeDate}" max="${maxDate}" class="date-picker-input">
        <div class="log-date-sub" style="color:${selPhase.color}">第 ${selDay} 天 · ${selPhase.name}</div>
      </div>
      <button class="date-nav-btn" id="btn-next-day" ${activeDate>=today?'disabled':''}>›</button>
    </div>`;
  container.appendChild(head);

  // date picker & nav events (set after DOM)
  setTimeout(() => {
    const picker = document.getElementById('log-date-picker');
    if (picker) picker.onchange = e => { state.logDate = e.target.value; renderLog(container, user); container.scrollTop=0; };
    const prev = document.getElementById('btn-prev-day');
    const next = document.getElementById('btn-next-day');
    if (prev) prev.onclick = () => {
      const d = new Date(state.logDate); d.setDate(d.getDate()-1);
      state.logDate = d.toISOString().slice(0,10); renderLog(container, user); container.scrollTop=0;
    };
    if (next) next.onclick = () => {
      if (state.logDate >= today) return;
      const d = new Date(state.logDate); d.setDate(d.getDate()+1);
      state.logDate = d.toISOString().slice(0,10); renderLog(container, user); container.scrollTop=0;
    };
  }, 0);

  // ── Form ──
  const form = el('div', 'log-form');

  // Weight
  form.appendChild(formRow('⚖️','體重', `<input type="number" id="f-weight" step="0.1" min="30" max="150" placeholder="kg" value="${existing.weight||''}">`));
  // BBT
  form.appendChild(formRow('🌡️','基礎體溫 BBT', `<input type="number" id="f-bbt" step="0.01" min="35" max="38.5" placeholder="°C" value="${existing.bbt||''}">`));
  // Mood
  const mood = existing.mood || 0;
  const moodStars = [1,2,3,4,5].map(i =>
    `<button class="star-btn ${mood>=i?'active':''}" onclick="setMood(${i})" id="star-${i}">★</button>`
  ).join('');
  window._mood = mood;
  form.appendChild(formRow('😊','心情', `<div class="star-row">${moodStars}</div>`));

  // Symptoms
  const symOpts = ['脹氣','偏頭痛','痙攣','腰痠','乳房脹痛','噁心','疲倦','情緒波動'];
  const checked = existing.symptoms || [];
  const symHtml = symOpts.map(s =>
    `<label class="sym-check ${checked.includes(s)?'active':''}"><input type="checkbox" value="${s}" ${checked.includes(s)?'checked':''} onchange="toggleSym(this)"> ${s}</label>`
  ).join('');
  const symRow = el('div', 'form-row-full');
  symRow.innerHTML = `<div class="form-label">🩺 今日症狀</div><div class="sym-checks">${symHtml}</div>`;
  form.appendChild(symRow);

  // Note
  form.appendChild(formRow('📝','備註', `<textarea id="f-note" rows="3" placeholder="記錄這天的感受...">${existing.note||''}</textarea>`));

  const saveBtn = el('button', 'save-btn');
  const isToday = activeDate === today;
  saveBtn.textContent = isToday ? '儲存今日記錄' : `儲存 ${activeDate} 記錄`;
  saveBtn.onclick = () => saveLog(user, activeDate);
  form.appendChild(saveBtn);

  // Quick weight batch entry hint
  if (weightDataCount(user) < 5) {
    const tip = el('div', 'batch-tip');
    tip.innerHTML = `<div class="batch-tip-text">💡 點左邊 ‹ 可以補填過去每天的體重，記錄越多天，體重週期分析越準確！</div>`;
    form.appendChild(tip);
  }

  container.appendChild(form);

  // ── History list ──
  const allLogs = Object.entries(user.logs||{}).sort((a,b)=>b[0].localeCompare(a[0]));
  if (allLogs.length > 0) {
    const hist = el('div', 'log-history');
    const showing = el('div','');
    showing.innerHTML = `<div class="hist-title">所有記錄（${allLogs.length} 天）</div>`;
    hist.appendChild(showing);

    allLogs.forEach(([date, log]) => {
      const ms   = new Date(date).getTime();
      const d2   = Math.floor((ms - startMs) / 86400000);
      const dNum = ((d2 % cycleLen) + cycleLen) % cycleLen + 1;
      const ph   = phaseOf(dNum);
      const row  = el('div', 'hist-row hist-row-tap');
      row.innerHTML = `
        <div>
          <span class="hist-date">${date}</span>
          <span class="hist-phase-tag" style="color:${ph.color}">第${dNum}天</span>
        </div>
        <div class="hist-right">
          <span class="hist-vals">${log.weight?log.weight+'kg · ':''} ${log.bbt?log.bbt+'°C · ':''} ${'★'.repeat(log.mood||0)}</span>
          <button class="hist-edit-btn" onclick="jumpToDate('${date}')">編輯</button>
        </div>`;
      hist.appendChild(row);
    });
    container.appendChild(hist);
  }
}

window.jumpToDate = function(date) {
  state.logDate = date;
  const container = document.querySelector('.main-content');
  if (container) { container.innerHTML = ''; renderLog(container, getUser()); container.scrollTop=0; }
};

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

// ── Weight Cycle Analysis ─────────────────────────────────────────

// Given a user's logs, map each log entry to its cycle day, return
// an array of 28 slots, each containing all recorded weights for that day.
function weightByDay(user) {
  const slots = Array.from({length:28}, () => []);
  if (!user || !user.cycleStart || !user.logs) return slots;
  const cycleLen = user.cycleLen || 28;
  const startMs = new Date(user.cycleStart).getTime();

  Object.entries(user.logs).forEach(([dateStr, log]) => {
    if (!log.weight) return;
    const w = parseFloat(log.weight);
    if (isNaN(w)) return;
    const dayMs = new Date(dateStr).getTime();
    const diff = Math.floor((dayMs - startMs) / 86400000);
    const dayInCycle = ((diff % cycleLen) + cycleLen) % cycleLen; // 0-indexed
    if (dayInCycle < 28) slots[dayInCycle].push(w);
  });
  return slots;
}

// Compute per-cycle-day average weight (absolute kg), returns array of 28
// nulls where no data, numbers where data exists.
function avgWeightCurve(user) {
  const slots = weightByDay(user);
  return slots.map(arr => arr.length === 0 ? null : +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2));
}

// Compute weight change relative to user's personal cycle-day-1 average baseline
function deltaWeightCurve(user) {
  const avg = avgWeightCurve(user);
  // Find baseline: average of days 1-5 that have data
  const baseline = avg.slice(0,5).filter(v=>v!==null);
  if (baseline.length === 0) return avg; // no baseline yet, return absolute
  const base = baseline.reduce((a,b)=>a+b,0) / baseline.length;
  return avg.map(v => v === null ? null : +(v - base).toFixed(2));
}

// How many cycle days have at least 1 weight entry
function weightDataCount(user) {
  return weightByDay(user).filter(arr => arr.length > 0).length;
}

// Predict next cycle's weight for a given day using personal curve + reference
function predictWeight(user, day) {
  const delta = deltaWeightCurve(user);
  const refDelta = CYCLE_DATA.weight; // reference template
  const d = delta[day-1];
  // If we have personal data use it, otherwise fall back to reference
  return d !== null ? d : refDelta[day-1];
}

// Render the weight analysis view
function renderWeightAnalysis(container, user) {
  const dataCount = weightDataCount(user);
  const avg = avgWeightCurve(user);
  const delta = deltaWeightCurve(user);
  const day = cycleDay(user);

  const head = el('div', 'chart-head');
  head.innerHTML = `<div class="chart-title">⚖️ 體重週期分析</div>
    <div class="chart-daybadge">${dataCount} 天有資料</div>`;
  container.appendChild(head);

  // Progress hint
  const hint = el('div', 'weight-hint');
  if (dataCount < 7) {
    hint.innerHTML = `<div class="hint-bar hint-warn">已記錄 ${dataCount}/28 天 · 累積 7 天以上可看出個人趨勢，28天可推算完整週期</div>`;
  } else if (dataCount < 20) {
    hint.innerHTML = `<div class="hint-bar hint-ok">已記錄 ${dataCount}/28 天 · 個人週期曲線正在成形 📈</div>`;
  } else {
    hint.innerHTML = `<div class="hint-bar hint-great">已記錄 ${dataCount}/28 天 · 個人化週期曲線完整度高 ✓</div>`;
  }
  container.appendChild(hint);

  // Stats cards
  const filledAvg = avg.filter(v=>v!==null);
  if (filledAvg.length > 0) {
    const minW = Math.min(...filledAvg).toFixed(1);
    const maxW = Math.max(...filledAvg).toFixed(1);
    const range = (maxW - minW).toFixed(1);
    const peakDay = avg.indexOf(avg.filter(v=>v!==null).reduce((a,b)=>a>b?a:b, -Infinity)) + 1;
    const lowDay  = avg.indexOf(avg.filter(v=>v!==null).reduce((a,b)=>a<b?a:b, Infinity)) + 1;

    const stats = el('div', 'weight-stats');
    stats.innerHTML = `
      <div class="wstat-card"><div class="wstat-val">${minW} kg</div><div class="wstat-label">最低（第${lowDay}天）</div></div>
      <div class="wstat-card"><div class="wstat-val">${maxW} kg</div><div class="wstat-label">最高（第${peakDay}天）</div></div>
      <div class="wstat-card"><div class="wstat-val">±${(range/2).toFixed(1)} kg</div><div class="wstat-label">週期波動幅度</div></div>
      <div class="wstat-card"><div class="wstat-val" style="color:#4db896">${predictWeight(user,day)>0?'+':''}${predictWeight(user,day).toFixed(1)} kg</div><div class="wstat-label">今天預測變化</div></div>`;
    container.appendChild(stats);
  }

  // Chart
  const wrap = el('div', 'canvas-wrap');
  wrap.style.height = '240px';
  const canvas = document.createElement('canvas');
  canvas.id = 'weightChart';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','個人體重週期曲線與參考曲線對比圖');
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  // Legend
  const legend = el('div', 'chart-legend');
  legend.style.padding = '6px 14px 10px';
  legend.innerHTML = `
    <span class="legend-item"><span class="leg-swatch" style="background:#7fa8e8"></span>個人實測平均</span>
    <span class="legend-item"><span class="leg-swatch" style="background:rgba(127,168,232,0.3)"></span>個人預測（推算）</span>
    <span class="legend-item"><span class="leg-swatch" style="background:#888;border-top:2px dashed #888;background:none"></span>參考曲線</span>
    <span class="legend-item"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e87fa0;margin-right:3px"></span>今天位置</span>`;
  container.appendChild(legend);

  // Per-day table (last 14 days of logs)
  const recentLogs = Object.entries(user.logs||{})
    .filter(([,l])=>l.weight)
    .sort((a,b)=>b[0].localeCompare(a[0]))
    .slice(0,10);

  if (recentLogs.length > 0) {
    const table = el('div', 'weight-table');
    table.innerHTML = `<div class="hist-title" style="padding:0 14px;margin-bottom:8px">最近體重記錄</div>`;
    recentLogs.forEach(([date, log]) => {
      const cycleLen = user.cycleLen || 28;
      const startMs = new Date(user.cycleStart).getTime();
      const diff = Math.floor((new Date(date).getTime() - startMs) / 86400000);
      const d = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
      const phase = phaseOf(d);
      const row = el('div', 'hist-row');
      row.style.padding = '8px 14px';
      row.innerHTML = `
        <span class="hist-date">${date} <span style="font-size:10px;color:${phase.color}">第${d}天</span></span>
        <span class="hist-vals">${parseFloat(log.weight).toFixed(1)} kg</span>`;
      table.appendChild(row);
    });
    container.appendChild(table);
  }

  // Draw chart after DOM ready
  setTimeout(() => {
    if (state.weightChartInstance) { state.weightChartInstance.destroy(); state.weightChartInstance = null; }
    const days = Array.from({length:28},(_,i)=>i+1);
    const refDelta = CYCLE_DATA.weight;

    // Separate measured vs predicted
    const measured   = delta.map((v,i) => v !== null ? v : null);
    const predicted  = delta.map((v,i) => v === null ? refDelta[i] : null);

    // Today marker overlay
    const todayOverlay = {
      id:'todayDot',
      afterDatasetsDraw(chart) {
        const {ctx, scales} = chart;
        const x = scales.x.getPixelForValue(day-1);
        const yVal = measured[day-1] !== null ? measured[day-1] : refDelta[day-1];
        const y = scales.y.getPixelForValue(yVal);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI*2);
        ctx.fillStyle = '#e87fa0';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    };

    state.weightChartInstance = new Chart(canvas, {
      type: 'line',
      plugins: [todayOverlay],
      data: {
        labels: days,
        datasets: [
          {
            label: '個人實測平均',
            data: measured,
            borderColor: '#7fa8e8',
            backgroundColor: 'rgba(127,168,232,0.12)',
            borderWidth: 2.5,
            pointRadius: measured.map(v => v!==null ? 4 : 0),
            pointBackgroundColor: '#7fa8e8',
            tension: 0.4, fill: true,
            spanGaps: false,
          },
          {
            label: '推算補全',
            data: predicted,
            borderColor: 'rgba(127,168,232,0.4)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [4,4],
            pointRadius: 0,
            tension: 0.4,
            spanGaps: false,
          },
          {
            label: '參考曲線',
            data: refDelta,
            borderColor: 'rgba(180,180,180,0.3)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3,3],
            pointRadius: 0,
            tension: 0.4,
          },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor: 'rgba(20,8,16,0.95)',
            titleColor:'#fff', bodyColor:'#bbb',
            borderColor:'rgba(255,255,255,0.1)', borderWidth:1, padding:10,
            callbacks: {
              title: items => `第 ${items[0].label} 天 · ${phaseOf(parseInt(items[0].label)).name}`,
              label: item => {
                const labels = ['個人均值','推算值','參考值'];
                const v = item.raw;
                if (v===null) return null;
                return ` ${labels[item.datasetIndex]}: ${v>=0?'+':''}${v} kg`;
              },
              filter: item => item.raw !== null,
            }
          }
        },
        scales: {
          x: { ticks:{color:'#888',font:{size:10}, callback:(v,i)=>(i+1)%7===0||(i+1)===1?`第${i+1}天`:''}, grid:{color:'rgba(255,255,255,0.04)'} },
          y: { ticks:{color:'#888',font:{size:10}, callback: v=>(v>=0?'+':'')+v.toFixed(1)+' kg'}, grid:{color:'rgba(255,255,255,0.05)'},
               title:{display:true, text:'相對基準體重變化 (kg)', color:'#888', font:{size:10}} },
        },
        animation:{duration:400},
      }
    });
  }, 50);
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
,25,8,5,5,4,4,4,4,4,4,4,4,4,5],
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
