// ── Data & Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'cycle_app_data';

const CYCLE_DATA = {
  e2:          [30,32,36,42,50,62,78,95,118,142,165,185,200,195,90,75,70,68,65,62,58,52,46,40,35,30,27,24],
  p4:          [1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,8,14,18,21,20,18,14,10,7,4,2,1,1],
  lh:          [4,4,4,5,5,6,6,7,8,10,14,22,40,90// ── Data & Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'cycle_app_data';
// ═══════════════════════════════════════════════════════════════
//  月之週期 App — app.js  (完整版 v3)
//  功能：多使用者 · 月經歷史 · 體重週期 · 記住登入狀態
// ═══════════════════════════════════════════════════════════════

// ── 參考資料（28天標準週期）────────────────────────────────────
const REF = {
  e2:          [30,32,36,42,50,62,78,95,118,142,165,185,200,195,90,75,70,68,65,62,58,52,46,40,35,30,27,24],
  p4:          [1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,8,14,18,21,20,18,14,10,7,4,2,1,1],
  lh:          [4,4,4,5,5,6,6,7,8,10,14,22,40,90,25,8,5,5,4,4,4,4,4,4,4,4,4,5],
  fsh:         [8,9,10,11,11,10,9,9,9,9,9,10,11,13,8,5,4,4,4,4,4,4,5,5,6,7,8,9],
  bbt:         [36.4,36.3,36.4,36.3,36.4,36.5,36.5,36.6,36.6,36.6,36.7,36.6,36.6,36.5,36.8,37.0,37.1,37.1,37.2,37.1,37.0,37.1,37.0,36.9,36.8,36.7,36.6,36.4],
  weight:      [0,-0.1,-0.3,-0.5,-0.6,-0.5,-0.4,-0.3,-0.2,-0.1,0,0.1,0.2,0.3,0.4,0.6,0.8,1.0,1.2,1.4,1.6,1.6,1.7,1.5,1.2,0.8,0.4,0.2],
  bloat:       [4,5,5,4,3,2,1,1,1,1,1,1,1,2,3,4,5,6,7,7,7,6,5,4,3,3,2,2],
  migraine:    [3,4,5,4,3,2,1,1,1,1,1,1,1,1,2,3,3,3,4,4,4,4,4,5,5,4,3,3],
  fertile:     [0,0,0,0,0,0,1,2,3,5,7,9,10,10,5,2,1,0,0,0,0,0,0,0,0,0,0,0],
  endometrium: [2,2,2,2,2,2,3,4,5,6,7,8,9,10,10,11,12,12,13,13,14,13,12,11,10,8,6,3],
};

const PHASES = [
  { name:'月經期', range:[1,5],   color:'#c0576a', bg:'rgba(192,87,106,0.15)' },
  { name:'卵泡期', range:[6,13],  color:'#8b7fd4', bg:'rgba(139,127,212,0.12)' },
  { name:'排卵期', range:[14,14], color:'#4db896', bg:'rgba(77,184,150,0.15)' },
  { name:'黃體期', range:[15,28], color:'#d4974d', bg:'rgba(212,151,77,0.12)' },
];

const CHART_GROUPS = {
  '賀爾蒙': {
    keys: ['e2','p4','lh','fsh'],
    meta: {
      e2:  { label:'雌激素 E2',      color:'#a89ae8', dash:false, unit:'pg/mL' },
      p4:  { label:'黃體素 P4×10',   color:'#e8835a', dash:true,  unit:'' },
      lh:  { label:'LH',             color:'#4db896', dash:false, unit:'mIU/mL' },
      fsh: { label:'FSH',            color:'#d4a84d', dash:true,  unit:'mIU/mL' },
    }
  },
  '體溫體重': {
    keys: ['bbt','weight'],
    meta: {
      bbt:    { label:'基礎體溫 BBT', color:'#e87fa0', dash:false, unit:'°C', axis:'y'  },
      weight: { label:'體重變化',      color:'#7fa8e8', dash:true,  unit:'kg', axis:'y2' },
    }
  },
  '症狀': {
    keys: ['bloat','migraine'],
    meta: {
      bloat:    { label:'脹氣程度',   color:'#e8a85a', dash:false, unit:'/10' },
      migraine: { label:'偏頭痛風險', color:'#e87070', dash:true,  unit:'/10' },
    }
  },
  '生育指標': {
    keys: ['fertile','endometrium'],
    meta: {
      fertile:     { label:'受孕機率',    color:'#4db896', dash:false, unit:'/10' },
      endometrium: { label:'子宮內膜厚度', color:'#e87fa0', dash:true,  unit:'mm'  },
    }
  },
};

// ── 狀態 ──────────────────────────────────────────────────────
const STORE_KEY = 'cycle_v3';

let S = {
  users:       [],
  activeUser:  0,          // index into users[]
  view:        'home',     // home | chart | weight | log | period | settings
  chartGroup:  '賀爾蒙',
  chartHidden: new Set(),
  chartInst:   null,
  weightInst:  null,
  periodInst:  null,
  logDate:     null,       // date string currently selected in log view
};

// ── 持久化 ────────────────────────────────────────────────────
function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    users: S.users,
    activeUser: S.activeUser,
  }));
}

function hydrate() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (d && Array.isArray(d.users)) {
      S.users      = d.users;
      S.activeUser = d.activeUser || 0;
    }
  } catch(e) {}
}

// ── 工具函數 ──────────────────────────────────────────────────
const u = () => S.users[S.activeUser] || null;

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function today() { return new Date().toISOString().slice(0,10); }

function cycleDay(user) {
  if (!user?.cycleStart) return 1;
  const len  = user.cycleLen || 28;
  const diff = Math.floor((Date.now() - new Date(user.cycleStart).getTime()) / 86400000);
  return ((diff % len) + len) % len + 1;
}

function dayPhase(day) {
  return PHASES.find(p => day >= p.range[0] && day <= p.range[1]) || PHASES[3];
}

function dateToCycleDay(user, dateStr) {
  const len   = user.cycleLen || 28;
  const start = new Date(user.cycleStart).getTime();
  const tgt   = new Date(dateStr).getTime();
  const diff  = Math.floor((tgt - start) / 86400000);
  return ((diff % len) + len) % len + 1;
}

function symLevel(v) {
  if (v <= 2) return { label:'輕微', color:'#4db896' };
  if (v <= 5) return { label:'中等', color:'#d4a84d' };
  return { label:'嚴重', color:'#e87070' };
}

// ── 月經歷史統計 ──────────────────────────────────────────────
function calcPeriodStats(history) {
  const sorted = [...(history||[])].sort((a,b) => a.start.localeCompare(b.start));
  const cycles = [], lengths = [];
  for (let i=1; i<sorted.length; i++) {
    const d = Math.round((new Date(sorted[i].start) - new Date(sorted[i-1].start)) / 86400000);
    if (d >= 18 && d <= 50) cycles.push(d);
  }
  sorted.forEach(h => {
    if (h.end) {
      const n = Math.round((new Date(h.end) - new Date(h.start)) / 86400000) + 1;
      if (n >= 2 && n <= 12) lengths.push(n);
    }
  });
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const std = (arr, m) => arr.length >= 2
    ? Math.sqrt(arr.map(v=>(v-m)**2).reduce((a,b)=>a+b,0)/arr.length)
    : null;
  const avgCycle  = avg(cycles);
  const avgPeriod = avg(lengths);
  const s = std(cycles, avgCycle);
  const regularity = s === null ? '—' : s <= 2 ? '規律 ✓' : s <= 5 ? '略不規律' : '不規律';
  return { avgCycle, avgPeriod, regularity, count: sorted.length,
           minCycle: cycles.length ? Math.min(...cycles) : null,
           maxCycle: cycles.length ? Math.max(...cycles) : null };
}

function applyStatsToUser(user) {
  const stats = calcPeriodStats(user.periodHistory);
  const sorted = [...(user.periodHistory||[])].sort((a,b)=>a.start.localeCompare(b.start));
  if (sorted.length > 0) user.cycleStart = sorted[sorted.length-1].start;
  if (stats.avgCycle)  user.cycleLen  = stats.avgCycle;
  if (stats.avgPeriod) user.periodLen = stats.avgPeriod;
}

// ── 體重分析 ──────────────────────────────────────────────────
function weightSlots(user) {
  const slots = Array.from({length:28}, ()=>[]);
  if (!user?.cycleStart || !user?.logs) return slots;
  const len   = user.cycleLen || 28;
  const start = new Date(user.cycleStart).getTime();
  Object.entries(user.logs).forEach(([ds, log]) => {
    const w = parseFloat(log.weight);
    if (isNaN(w)) return;
    const diff = Math.floor((new Date(ds).getTime() - start) / 86400000);
    const idx  = ((diff % len) + len) % len;
    if (idx < 28) slots[idx].push(w);
  });
  return slots;
}

function weightAvgCurve(user) {
  return weightSlots(user).map(arr =>
    arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : null
  );
}

function weightDeltaCurve(user) {
  const avg = weightAvgCurve(user);
  const base = avg.slice(0,5).filter(v=>v!==null);
  if (!base.length) return REF.weight.map((v,i) => avg[i] !== null ? avg[i] : null);
  const b = base.reduce((a,c)=>a+c,0)/base.length;
  return avg.map(v => v === null ? null : +(v-b).toFixed(2));
}

// ── Render 主控 ────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const user = u();

  // 沒有使用者 → 設定畫面
  if (!user || S.view === 'settings') { renderSettings(app); return; }

  // Nav
  const nav = el('nav','nav-bar');
  [
    { id:'home',    icon:'🌙', label:'總覽'  },
    { id:'chart',   icon:'📊', label:'曲線'  },
    { id:'weight',  icon:'⚖️', label:'體重'  },
    { id:'log',     icon:'✏️', label:'記錄'  },
    { id:'period',  icon:'🩸', label:'月經史'},
    { id:'settings',icon:'⚙️', label:'設定'  },
  ].forEach(({ id, icon, label }) => {
    const btn = el('button', 'nav-btn' + (S.view===id?' active':''));
    btn.innerHTML = `<span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>`;
    btn.onclick = () => { S.view = id; render(); };
    nav.appendChild(btn);
  });
  app.appendChild(nav);

  const main = el('main','main-content');
  app.appendChild(main);

  if (S.view==='home')    renderHome(main, user);
  if (S.view==='chart')   renderChart(main, user);
  if (S.view==='weight')  renderWeight(main, user);
  if (S.view==='log')     renderLog(main, user);
  if (S.view==='period')  renderPeriod(main, user);
}

// ── 總覽 ───────────────────────────────────────────────────────
function renderHome(c, user) {
  const day   = cycleDay(user);
  const phase = dayPhase(day);

  // Header
  const hdr = el('div','home-header');
  hdr.style.background = phase.bg;

  if (S.users.length > 1) {
    const sw = el('div','user-switcher');
    S.users.forEach((usr,i) => {
      const d = el('button','user-dot'+(i===S.activeUser?' active':''));
      d.textContent = usr.name[0];
      d.style.background = usr.color||'#c0576a';
      d.onclick = () => { S.activeUser=i; persist(); render(); };
      sw.appendChild(d);
    });
    hdr.appendChild(sw);
  }

  const moon = el('div','moon-circle');
  moon.style.borderColor = phase.color;
  moon.innerHTML = `<span class="day-num">${day}</span><span class="day-label">第 ${day} 天</span>`;
  hdr.appendChild(moon);

  const badge = el('div','phase-badge');
  badge.style.cssText = `background:${phase.color}33;color:${phase.color}`;
  badge.textContent = phase.name;
  hdr.appendChild(badge);

  // Progress bar
  const barWrap = el('div','cycle-bar-wrap');
  const bar = el('div','cycle-bar');
  PHASES.forEach(p => {
    const len = p.range[1]-p.range[0]+1;
    const seg = el('div','cycle-seg');
    seg.style.width  = `${(len/28)*100}%`;
    seg.style.background = phase===p ? p.color+'cc' : p.color+'44';
    bar.appendChild(seg);
  });
  const ind = el('div','cycle-indicator');
  ind.style.left = `${((day-1)/28)*100}%`;
  bar.appendChild(ind);
  barWrap.appendChild(bar);
  const bl = el('div','bar-labels');
  PHASES.forEach(p => {
    const s=el('span',''); s.style.cssText=`width:${((p.range[1]-p.range[0]+1)/28)*100}%;color:${p.color}`;
    s.textContent=p.name; bl.appendChild(s);
  });
  barWrap.appendChild(bl);
  hdr.appendChild(barWrap);
  c.appendChild(hdr);

  // Cards
  const grid = el('div','sym-grid');
  [
    { icon:'💊', name:'雌激素', val:REF.e2[day-1].toFixed(0)+' pg/mL', sub:day===14?'峰值':'正常' },
    { icon:'🌡️', name:'體溫BBT', val:REF.bbt[day-1].toFixed(2)+'°C',   sub:day>=15?'升高':'基礎' },
    { icon:'⚖️', name:'體重變化', val:(REF.weight[day-1]>=0?'+':'')+REF.weight[day-1].toFixed(1)+'kg',
      sub:REF.weight[day-1]>1.2?'注意水腫':'穩定' },
    { icon:'🫧', name:'脹氣',     val:symLevel(REF.bloat[day-1]).label,
      sub:`${REF.bloat[day-1]}/10`, color:symLevel(REF.bloat[day-1]).color },
    { icon:'🧠', name:'偏頭痛',   val:symLevel(REF.migraine[day-1]).label,
      sub:`風險 ${REF.migraine[day-1]}/10`, color:symLevel(REF.migraine[day-1]).color },
    { icon:'🌸', name:'受孕機率', val:REF.fertile[day-1]>=8?'極高':REF.fertile[day-1]>=5?'高':REF.fertile[day-1]>=2?'中':'低',
      sub:`${REF.fertile[day-1]*10}%`, color:REF.fertile[day-1]>=8?'#4db896':'#d4a84d' },
    { icon:'🫀', name:'子宮內膜', val:REF.endometrium[day-1]+' mm', sub:day<=5?'剝落中':day>=15?'增厚':'增厚中' },
    { icon:'🔴', name:'黃體素',   val:REF.p4[day-1].toFixed(0)+' ng/mL', sub:day>=15?'上升':'低' },
  ].forEach(d => {
    const card = el('div','sym-card');
    card.innerHTML = `<div class="sym-icon">${d.icon}</div>
      <div class="sym-name">${d.name}</div>
      <div class="sym-val"${d.color?` style="color:${d.color}"`:''} >${d.val}</div>
      <div class="sym-sub">${d.sub}</div>`;
    grid.appendChild(card);
  });
  c.appendChild(grid);

  // Today log preview
  const log = user.logs?.[today()];
  const lp  = el('div','log-preview');
  if (log) {
    lp.innerHTML = `<div class="log-preview-title">今日已記錄 ✓</div>
      <div class="log-preview-row">${log.weight?'體重 '+log.weight+'kg &nbsp;':''}${log.bbt?'體溫 '+log.bbt+'°C &nbsp;':''}${'★'.repeat(log.mood||0)}${log.note?'<br><span class="log-note">'+log.note+'</span>':''}</div>`;
  } else {
    lp.innerHTML = `<div class="log-preview-title">今日尚未記錄</div>
      <button class="log-now-btn" onclick="S.view='log';render()">立刻記錄今天 →</button>`;
  }
  c.appendChild(lp);

  // Insight
  const tips = {
    '月經期':'黃體素和雌激素降至最低，脹氣與偏頭痛風險較高。多補充鐵質，熱敷緩解痙攣。',
    '卵泡期':'雌激素逐漸上升，精力與情緒都在回升，脹氣和偏頭痛風險低，適合運動和計畫。',
    '排卵期':'雌激素達到峰值，LH 急速飆升，受孕機率最高，今天通常精力和情緒最佳！',
    '黃體期':'黃體素主導，體溫升高、脹氣和體重上升屬正常現象，月經前數天偏頭痛風險最高。',
  };
  const tip = el('div','insight-tip');
  tip.style.borderColor = phase.color;
  tip.innerHTML = `<div class="tip-phase" style="color:${phase.color}">${phase.name}</div>
    <div class="tip-text">${tips[phase.name]}</div>`;
  c.appendChild(tip);

  // Period prediction
  const ph = (user.periodHistory||[]);
  if (ph.length >= 2) {
    const stats = calcPeriodStats(ph);
    if (stats.avgCycle) {
      const lastStart = new Date(user.cycleStart);
      const nextDate  = new Date(lastStart.getTime() + stats.avgCycle*86400000);
      const daysLeft  = Math.round((nextDate.getTime() - Date.now()) / 86400000);
      const pred = el('div','pred-card');
      pred.innerHTML = `<div class="pred-label">🔮 下次月經預測</div>
        <div class="pred-date">${nextDate.toISOString().slice(0,10)}</div>
        <div class="pred-days">${daysLeft>0?'還有 '+daysLeft+' 天':daysLeft===0?'可能今天':'預計已到'}</div>`;
      c.appendChild(pred);
    }
  }
}

// ── 曲線圖 ────────────────────────────────────────────────────
function renderChart(c, user) {
  const day = cycleDay(user);
  c.innerHTML = '';

  const head = el('div','chart-head');
  head.innerHTML = `<div class="chart-title">28天週期曲線</div>
    <div class="chart-daybadge">今天第 ${day} 天</div>`;
  c.appendChild(head);

  const pbar = el('div','phase-bar-chart');
  PHASES.forEach(p => {
    const seg = el('div','pbar-seg');
    seg.style.cssText = `width:${((p.range[1]-p.range[0]+1)/28)*100}%;background:${p.color}44;color:${p.color}`;
    seg.textContent = p.name;
    pbar.appendChild(seg);
  });
  c.appendChild(pbar);

  const tabs = el('div','chart-tabs');
  Object.keys(CHART_GROUPS).forEach(g => {
    const btn = el('button','chart-tab'+(S.chartGroup===g?' active':''));
    btn.textContent = g;
    btn.onclick = () => { S.chartGroup=g; S.chartHidden=new Set(); renderChart(c,user); };
    tabs.appendChild(btn);
  });
  c.appendChild(tabs);

  const grp = CHART_GROUPS[S.chartGroup];
  const legend = el('div','chart-legend');
  grp.keys.forEach(k => {
    const m = grp.meta[k];
    const item = el('div','legend-item');
    item.style.opacity = S.chartHidden.has(k)?'0.35':'1';
    item.innerHTML = `<span class="leg-swatch"${m.dash?` style="background:none;border-top:2px dashed ${m.color}"`:` style="background:${m.color}"`}></span>${m.label}`;
    item.onclick = () => {
      S.chartHidden.has(k) ? S.chartHidden.delete(k) : S.chartHidden.add(k);
      item.style.opacity = S.chartHidden.has(k)?'0.35':'1';
      if (S.chartInst) {
        S.chartInst.data.datasets.forEach((ds,i)=>{
          S.chartInst.setDatasetVisibility(i,!S.chartHidden.has(grp.keys[i]));
        });
        S.chartInst.update();
      }
    };
    legend.appendChild(item);
  });
  c.appendChild(legend);

  const wrap = el('div','canvas-wrap');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label','28天週期曲線圖');
  wrap.appendChild(canvas);
  c.appendChild(wrap);

  const todayLinePlugin = {
    id:'todayLine',
    beforeDraw(chart) {
      const {ctx,chartArea,scales} = chart;
      const x = scales.x.getPixelForValue(day-1);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x,chartArea.top); ctx.lineTo(x,chartArea.bottom);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      ctx.stroke(); ctx.restore();
    }
  };

  setTimeout(() => {
    if (S.chartInst) { S.chartInst.destroy(); S.chartInst=null; }
    const days = Array.from({length:28},(_,i)=>i+1);
    const scales = {};
    if (S.chartGroup==='體溫體重') {
      scales.y  = {position:'left', min:35.8,max:37.6, ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
      scales.y2 = {position:'right',min:-1,  max:2.5,  ticks:{color:'#888',font:{size:10}}, grid:{display:false}};
    } else if (S.chartGroup==='賀爾蒙') {
      scales.y  = {min:0,max:220, ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
    } else {
      scales.y  = {min:0,max:16,  ticks:{color:'#888',font:{size:10}}, grid:{color:'rgba(255,255,255,0.05)'}};
    }
    scales.x = {ticks:{color:'#888',font:{size:10},callback:(v,i)=>(i+1)%7===0||(i+1)===1?`第${i+1}天`:''}, grid:{color:'rgba(255,255,255,0.04)'}};

    const datasets = grp.keys.map(k => {
      const m = grp.meta[k];
      const data = S.chartGroup==='賀爾蒙'&&k==='p4' ? REF[k].map(v=>v*10) : REF[k].map(v=>+v.toFixed(2));
      return {
        label:m.label, data,
        borderColor:m.color, backgroundColor:m.color+'18',
        borderWidth:2.5, borderDash:m.dash?[6,4]:[],
        pointRadius:days.map((_,i)=>i+1===day?5:2),
        pointBackgroundColor:days.map((_,i)=>i+1===day?'#fff':m.color),
        pointBorderColor:m.color, pointBorderWidth:days.map((_,i)=>i+1===day?2:0),
        tension:0.45, fill:false,
        yAxisID:m.axis||'y',
        hidden:S.chartHidden.has(k),
      };
    });

    S.chartInst = new Chart(canvas, {
      type:'line', plugins:[todayLinePlugin],
      data:{labels:days, datasets},
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{backgroundColor:'rgba(16,4,12,0.95)',titleColor:'#fff',bodyColor:'#bbb',
            borderColor:'rgba(255,255,255,0.1)',borderWidth:1,padding:10,
            callbacks:{
              title:items=>`第 ${items[0].label} 天 · ${dayPhase(parseInt(items[0].label)).name}`,
              label:item=>item.raw!==null?` ${item.dataset.label}: ${item.raw}`:null,
              filter:item=>item.raw!==null,
            }
          }
        },
        scales, animation:{duration:400},
      }
    });
  }, 50);
}

// ── 體重分析 ──────────────────────────────────────────────────
function renderWeight(c, user) {
  c.innerHTML = '';
  const delta = weightDeltaCurve(user);
  const avg   = weightAvgCurve(user);
  const day   = cycleDay(user);
  const filled = avg.filter(v=>v!==null);
  const dataCount = weightSlots(user).filter(s=>s.length>0).length;

  const head = el('div','chart-head');
  head.innerHTML = `<div class="chart-title">⚖️ 體重週期分析</div>
    <div class="chart-daybadge">${dataCount}/28 天有資料</div>`;
  c.appendChild(head);

  // Hint bar
  const hint = el('div','weight-hint');
  const [hcls,htxt] = dataCount<7
    ? ['hint-warn',`已記錄 ${dataCount} 天，累積 7 天以上可看到個人趨勢`]
    : dataCount<20
    ? ['hint-ok',  `已記錄 ${dataCount} 天，個人週期曲線成形中 📈`]
    : ['hint-great',`已記錄 ${dataCount} 天，個人化曲線完整度高 ✓`];
  hint.innerHTML = `<div class="hint-bar ${hcls}">${htxt}</div>`;
  c.appendChild(hint);

  // Stats
  if (filled.length > 0) {
    const minW = Math.min(...filled), maxW = Math.max(...filled);
    const peakDay = avg.indexOf(filled.reduce((a,b)=>a>b?a:b,  -Infinity))+1;
    const lowDay  = avg.indexOf(filled.reduce((a,b)=>a<b?a:b,   Infinity))+1;
    const curDelta = delta[day-1] ?? REF.weight[day-1];
    const stat = el('div','weight-stats');
    stat.innerHTML = `
      <div class="wstat-card"><div class="wstat-val">${minW.toFixed(1)} kg</div><div class="wstat-label">最低（第${lowDay}天）</div></div>
      <div class="wstat-card"><div class="wstat-val">${maxW.toFixed(1)} kg</div><div class="wstat-label">最高（第${peakDay}天）</div></div>
      <div class="wstat-card"><div class="wstat-val">±${((maxW-minW)/2).toFixed(1)} kg</div><div class="wstat-label">週期波動</div></div>
      <div class="wstat-card"><div class="wstat-val" style="color:#4db896">${curDelta>=0?'+':''}${curDelta.toFixed(1)} kg</div><div class="wstat-label">今日預測</div></div>`;
    c.appendChild(stat);
  }

  // Chart
  const wrap = el('div','canvas-wrap'); wrap.style.height='230px';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label','個人體重週期曲線');
  wrap.appendChild(canvas);
  c.appendChild(wrap);

  const leg = el('div','chart-legend'); leg.style.padding='6px 14px 10px';
  leg.innerHTML = `
    <span class="legend-item"><span class="leg-swatch" style="background:#7fa8e8"></span>個人實測</span>
    <span class="legend-item"><span class="leg-swatch" style="background:rgba(127,168,232,0.35)"></span>推算補全</span>
    <span class="legend-item"><span class="leg-swatch" style="background:none;border-top:2px dashed #666"></span>參考曲線</span>`;
  c.appendChild(leg);

  const todayDotPlugin = {
    id:'todayDot',
    afterDatasetsDraw(chart){
      const {ctx,scales} = chart;
      const yVal = delta[day-1]!==null ? delta[day-1] : REF.weight[day-1];
      const x = scales.x.getPixelForValue(day-1);
      const y = scales.y.getPixelForValue(yVal);
      ctx.save();
      ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2);
      ctx.fillStyle='#e87fa0'; ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
    }
  };

  setTimeout(() => {
    if (S.weightInst) { S.weightInst.destroy(); S.weightInst=null; }
    const days = Array.from({length:28},(_,i)=>i+1);
    const measured  = delta.map(v=>v!==null?v:null);
    const predicted = delta.map((v,i)=>v===null?REF.weight[i]:null);
    S.weightInst = new Chart(canvas, {
      type:'line', plugins:[todayDotPlugin],
      data:{ labels:days, datasets:[
        {label:'個人實測',data:measured,borderColor:'#7fa8e8',backgroundColor:'rgba(127,168,232,0.12)',
         borderWidth:2.5,pointRadius:measured.map(v=>v!==null?4:0),pointBackgroundColor:'#7fa8e8',
         tension:0.4,fill:true,spanGaps:false},
        {label:'推算',data:predicted,borderColor:'rgba(127,168,232,0.4)',backgroundColor:'transparent',
         borderWidth:1.5,borderDash:[4,4],pointRadius:0,tension:0.4,spanGaps:false},
        {label:'參考',data:REF.weight,borderColor:'rgba(180,180,180,0.3)',backgroundColor:'transparent',
         borderWidth:1,borderDash:[3,3],pointRadius:0,tension:0.4},
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{backgroundColor:'rgba(16,4,12,0.95)',titleColor:'#fff',bodyColor:'#bbb',
            borderColor:'rgba(255,255,255,0.1)',borderWidth:1,padding:10,
            callbacks:{
              title:items=>`第 ${items[0].label} 天 · ${dayPhase(parseInt(items[0].label)).name}`,
              label:item=>item.raw!==null?` ${['個人均值','推算值','參考值'][item.datasetIndex]}: ${item.raw>=0?'+':''}${item.raw} kg`:null,
              filter:item=>item.raw!==null,
            }
          }
        },
        scales:{
          x:{ticks:{color:'#888',font:{size:10},callback:(v,i)=>(i+1)%7===0||(i+1)===1?`第${i+1}天`:''},grid:{color:'rgba(255,255,255,0.04)'}},
          y:{ticks:{color:'#888',font:{size:10},callback:v=>(v>=0?'+':'')+v.toFixed(1)+' kg'},grid:{color:'rgba(255,255,255,0.05)'}},
        },
        animation:{duration:400},
      }
    });
  }, 50);

  // Recent weight logs
  const recentW = Object.entries(user.logs||{})
    .filter(([,l])=>l.weight).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
  if (recentW.length > 0) {
    const hist = el('div','log-history');
    hist.innerHTML = '<div class="hist-title">最近體重記錄</div>';
    recentW.forEach(([date,log]) => {
      const d = dateToCycleDay(user, date);
      const ph = dayPhase(d);
      const row = el('div','hist-row');
      row.innerHTML = `<div><span class="hist-date">${date}</span>
        <span style="font-size:10px;color:${ph.color};margin-left:6px">第${d}天 ${ph.name}</span></div>
        <span class="hist-vals">${parseFloat(log.weight).toFixed(1)} kg</span>`;
      hist.appendChild(row);
    });
    c.appendChild(hist);
  }
}

// ── 日誌記錄（含日期導覽）────────────────────────────────────
function renderLog(c, user) {
  if (!S.logDate) S.logDate = today();
  const selDate = S.logDate;
  const existing = user.logs?.[selDate] || {};
  const selDay   = dateToCycleDay(user, selDate);
  const selPhase = dayPhase(selDay);

  c.innerHTML = '';

  const head = el('div','log-head');
  head.innerHTML = `
    <div class="log-head-title">日誌記錄</div>
    <div class="log-date-row">
      <button class="date-nav-btn" id="btn-prev">‹</button>
      <div class="log-date-center">
        <input type="date" id="log-picker" value="${selDate}" max="${today()}" class="date-picker-input">
        <div class="log-date-sub" style="color:${selPhase.color}">第 ${selDay} 天 · ${selPhase.name}</div>
      </div>
      <button class="date-nav-btn" id="btn-next" ${selDate>=today()?'disabled':''}>›</button>
    </div>`;
  c.appendChild(head);

  setTimeout(() => {
    document.getElementById('log-picker').onchange = e => {
      S.logDate = e.target.value; renderLog(c,user);
    };
    document.getElementById('btn-prev').onclick = () => {
      const d=new Date(S.logDate); d.setDate(d.getDate()-1);
      S.logDate=d.toISOString().slice(0,10); renderLog(c,user);
    };
    document.getElementById('btn-next').onclick = () => {
      if(S.logDate>=today())return;
      const d=new Date(S.logDate); d.setDate(d.getDate()+1);
      S.logDate=d.toISOString().slice(0,10); renderLog(c,user);
    };
  }, 0);

  window._mood = existing.mood || 0;
  const form = el('div','log-form');

  form.appendChild(fRow('⚖️','體重',
    `<input type="number" id="f-weight" step="0.1" min="30" max="150" placeholder="kg" value="${existing.weight||''}">`));
  form.appendChild(fRow('🌡️','基礎體溫 BBT',
    `<input type="number" id="f-bbt" step="0.01" min="35" max="38.5" placeholder="°C" value="${existing.bbt||''}">`));

  const stars = [1,2,3,4,5].map(i=>
    `<button class="star-btn ${window._mood>=i?'active':''}" onclick="setMood(${i})" id="star-${i}">★</button>`
  ).join('');
  form.appendChild(fRow('😊','心情', `<div class="star-row">${stars}</div>`));

  const SYMS = ['脹氣','偏頭痛','痙攣','腰痠','乳房脹痛','噁心','疲倦','情緒波動'];
  const chk  = existing.symptoms||[];
  const symRow = el('div','form-row-full');
  symRow.innerHTML = `<div class="form-label">🩺 症狀</div>
    <div class="sym-checks">${SYMS.map(s=>
      `<label class="sym-check ${chk.includes(s)?'active':''}">
        <input type="checkbox" value="${s}" ${chk.includes(s)?'checked':''} onchange="this.closest('label').classList.toggle('active',this.checked)"> ${s}
      </label>`
    ).join('')}</div>`;
  form.appendChild(symRow);

  form.appendChild(fRow('📝','備註',
    `<textarea id="f-note" rows="3" placeholder="記錄這天的感受...">${existing.note||''}</textarea>`));

  const saveBtn = el('button','save-btn');
  saveBtn.textContent = selDate===today() ? '儲存今日記錄' : `儲存 ${selDate} 記錄`;
  saveBtn.onclick = () => {
    if (!user.logs) user.logs = {};
    const syms = [];
    document.querySelectorAll('.sym-checks input:checked').forEach(el2=>syms.push(el2.value));
    user.logs[selDate] = {
      weight: document.getElementById('f-weight').value||null,
      bbt:    document.getElementById('f-bbt').value||null,
      mood:   window._mood||0, symptoms:syms,
      note:   document.getElementById('f-note').value||null,
    };
    persist(); S.view='home'; render();
  };
  form.appendChild(saveBtn);
  c.appendChild(form);

  // History
  const all = Object.entries(user.logs||{}).sort((a,b)=>b[0].localeCompare(a[0]));
  if (all.length > 0) {
    const hist = el('div','log-history');
    hist.innerHTML = `<div class="hist-title">所有記錄（${all.length} 天）</div>`;
    all.forEach(([date,log]) => {
      const d = dateToCycleDay(user, date);
      const ph = dayPhase(d);
      const row = el('div','hist-row');
      row.style.cursor='pointer';
      row.innerHTML = `
        <div><span class="hist-date">${date}</span>
          <span style="font-size:10px;color:${ph.color};margin-left:5px">第${d}天</span></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="hist-vals">${log.weight?log.weight+'kg ':''} ${log.bbt?log.bbt+'°C ':''} ${'★'.repeat(log.mood||0)}</span>
          <button class="hist-edit-btn" onclick="S.logDate='${date}';renderLog(document.querySelector('.main-content'),u())">編輯</button>
        </div>`;
      hist.appendChild(row);
    });
    c.appendChild(hist);
  }
}

function fRow(icon, label, inputHtml) {
  const r = el('div','form-row');
  r.innerHTML = `<div class="form-label">${icon} ${label}</div>${inputHtml}`;
  return r;
}

window.setMood = n => {
  window._mood = n;
  [1,2,3,4,5].forEach(i => document.getElementById(`star-${i}`)?.classList.toggle('active',i<=n));
};

// ── 月經歷史 ──────────────────────────────────────────────────
function renderPeriod(c, user) {
  c.innerHTML = '';
  const history = [...(user.periodHistory||[])].sort((a,b)=>a.start.localeCompare(b.start));
  const stats   = calcPeriodStats(history);

  const head = el('div','chart-head');
  head.innerHTML = `<div class="chart-title">🩸 月經歷史</div>
    <div class="chart-daybadge">${history.length} 次記錄</div>`;
  c.appendChild(head);

  // Stats row
  const sbar = el('div','period-stats-bar');
  sbar.innerHTML = `
    <div class="pstat"><div class="pstat-val">${stats.count}</div><div class="pstat-label">記錄次數</div></div>
    <div class="pstat"><div class="pstat-val" style="color:#c0576a">${stats.avgCycle??'—'}<span style="font-size:10px">天</span></div><div class="pstat-label">平均週期</div></div>
    <div class="pstat"><div class="pstat-val" style="color:#8b7fd4">${stats.avgPeriod??'—'}<span style="font-size:10px">天</span></div><div class="pstat-label">平均經期</div></div>
    <div class="pstat"><div class="pstat-val" style="font-size:13px;color:#4db896">${stats.regularity}</div><div class="pstat-label">規律性</div></div>`;
  c.appendChild(sbar);

  // Range info
  if (stats.minCycle && stats.maxCycle) {
    const range = el('div','period-range');
    range.innerHTML = `週期範圍：${stats.minCycle} – ${stats.maxCycle} 天`;
    c.appendChild(range);
  }

  // Sync tip
  if (stats.avgCycle && stats.avgCycle !== user.cycleLen) {
    const tip = el('div','sync-tip');
    tip.innerHTML = `建議將週期長度更新為 <strong>${stats.avgCycle} 天</strong>（來自 ${history.length} 次記錄）
      <button class="sync-btn" onclick="syncStats()">套用</button>`;
    c.appendChild(tip);
  }

  // Mini chart
  if (history.length >= 2) {
    const chartWrap = el('div','mini-chart-wrap');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label','歷史週期長度折線圖');
    chartWrap.appendChild(canvas);
    c.appendChild(chartWrap);

    const leg2 = el('div','period-chart-legend');
    leg2.innerHTML = `<span><span style="display:inline-block;width:10px;height:3px;background:#c0576a;border-radius:2px;vertical-align:middle;margin-right:4px"></span>週期長度</span>
      <span><span style="display:inline-block;width:10px;height:3px;background:#8b7fd4;border-radius:2px;vertical-align:middle;margin-right:4px"></span>經期天數</span>`;
    c.appendChild(leg2);

    setTimeout(() => {
      if (S.periodInst) { S.periodInst.destroy(); S.periodInst=null; }
      const labels   = history.map((_,i)=>`第${i+1}次`);
      const cycles   = history.map((h,i)=>i===0?null:Math.round((new Date(h.start)-new Date(history[i-1].start))/86400000));
      const periods  = history.map(h=>h.end?Math.round((new Date(h.end)-new Date(h.start))/86400000)+1:null);
      S.periodInst = new Chart(canvas, {
        type:'line',
        data:{labels, datasets:[
          {label:'週期長度',data:cycles, borderColor:'#c0576a',backgroundColor:'rgba(192,87,106,0.1)',
           borderWidth:2,pointRadius:4,pointBackgroundColor:'#c0576a',tension:0.3,spanGaps:true},
          {label:'經期天數',data:periods,borderColor:'#8b7fd4',backgroundColor:'rgba(139,127,212,0.1)',
           borderWidth:2,pointRadius:4,pointBackgroundColor:'#8b7fd4',tension:0.3,spanGaps:true},
        ]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},
            tooltip:{backgroundColor:'rgba(16,4,12,0.95)',titleColor:'#fff',bodyColor:'#bbb',padding:8}},
          scales:{
            x:{ticks:{color:'#888',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
            y:{min:0,max:45,ticks:{color:'#888',font:{size:10}},grid:{color:'rgba(255,255,255,0.05)'}},
          },animation:{duration:400}}
      });
    }, 60);
  }

  // Add form
  const addSec = el('div','add-period-section');
  addSec.innerHTML = `
    <div class="settings-subtitle">➕ 新增一次月經紀錄</div>
    <div class="period-add-form">
      <div class="period-add-row">
        <label class="period-add-label">開始日</label>
        <input type="date" id="ps-start" max="${today()}" class="period-date-input">
      </div>
      <div class="period-add-row">
        <label class="period-add-label">結束日</label>
        <input type="date" id="ps-end" max="${today()}" class="period-date-input">
      </div>
      <div class="period-add-row">
        <label class="period-add-label">備註</label>
        <input type="text" id="ps-note" placeholder="如：痛經、量多…" class="period-date-input">
      </div>
      <button class="add-period-btn" onclick="addPeriod()">新增</button>
    </div>`;
  c.appendChild(addSec);

  // List
  if (history.length > 0) {
    const listWrap = el('div','period-list-wrap');
    listWrap.innerHTML = `<div class="settings-subtitle" style="margin-top:16px">所有紀錄（最新在上）</div>`;
    [...history].reverse().forEach((h, ri) => {
      const origIdx = history.length-1-ri;
      const pLen = h.end ? Math.round((new Date(h.end)-new Date(h.start))/86400000)+1 : null;
      const prevH = history[origIdx-1];
      const cycleLen2 = prevH ? Math.round((new Date(h.start)-new Date(prevH.start))/86400000) : null;
      const row = el('div','period-row');
      row.innerHTML = `
        <div class="period-row-left">
          <div class="period-row-date">${h.start}${h.end?' → '+h.end:''}</div>
          <div class="period-row-sub">
            ${pLen?`經期 ${pLen} 天`:'結束日未填'}
            ${cycleLen2?` ・ 距上次 ${cycleLen2} 天`:''}
            ${h.note?` ・ ${h.note}`:''}
          </div>
        </div>
        <button class="period-del-btn" onclick="delPeriod(${origIdx})">✕</button>`;
      listWrap.appendChild(row);
    });
    c.appendChild(listWrap);
  } else {
    const empty = el('div','period-empty');
    empty.innerHTML = `<div class="period-empty-text">還沒有月經記錄<br>補填越多，預測越準確！<br><span style="font-size:11px;color:var(--text3)">建議至少補填最近 3–6 次</span></div>`;
    c.appendChild(empty);
  }
}

window.addPeriod = () => {
  const start = document.getElementById('ps-start').value;
  const end   = document.getElementById('ps-end').value;
  const note  = document.getElementById('ps-note').value.trim();
  if (!start) { alert('請選擇月經開始日'); return; }
  if (end && end < start) { alert('結束日不能早於開始日'); return; }
  const user = u();
  if (!user.periodHistory) user.periodHistory = [];
  if (user.periodHistory.find(h=>h.start===start)) {
    if (!confirm(`${start} 已有記錄，要覆蓋嗎？`)) return;
    user.periodHistory = user.periodHistory.filter(h=>h.start!==start);
  }
  user.periodHistory.push({start, end:end||null, note:note||null});
  applyStatsToUser(user);
  persist(); renderPeriod(document.querySelector('.main-content'), user);
};

window.delPeriod = i => {
  const user = u();
  if (!confirm(`確定刪除 ${user.periodHistory[i].start} 的記錄？`)) return;
  user.periodHistory.splice(i,1);
  applyStatsToUser(user);
  persist(); renderPeriod(document.querySelector('.main-content'), user);
};

window.syncStats = () => {
  applyStatsToUser(u()); persist(); render();
};

// ── 設定 ──────────────────────────────────────────────────────
function renderSettings(app) {
  app.innerHTML = '';
  const wrap = el('div','settings-wrap');

  if (S.users.length > 0) {
    wrap.innerHTML = `<div class="settings-title">⚙️ 設定</div>`;

    // Current users
    const userSec = el('div','');
    userSec.innerHTML = `<div class="settings-subtitle">使用者</div>`;
    S.users.forEach((usr,i) => {
      const row = el('div','user-row');
      row.innerHTML = `
        <div class="user-avatar" style="background:${usr.color}">${usr.name[0]}</div>
        <div class="user-info">
          <div class="user-name">${usr.name} ${i===S.activeUser?'<span style="font-size:10px;color:#4db896">● 目前使用</span>':''}</div>
          <div class="user-sub">週期 ${usr.cycleLen??28}天 ・ 經期 ${usr.periodLen??5}天</div>
        </div>
        <div class="user-actions">
          ${i!==S.activeUser?`<button onclick="S.activeUser=${i};persist();render()">切換</button>`:''}
          ${S.users.length>1?`<button onclick="delUser(${i})">刪除</button>`:''}
        </div>`;
      userSec.appendChild(row);
    });
    wrap.appendChild(userSec);

    // Add family member
    const addFam = el('div','add-period-section');
    addFam.innerHTML = `<div class="settings-subtitle" style="margin-top:20px">+ 新增家人帳號</div>`;
    addFam.appendChild(buildAddUserForm());
    wrap.appendChild(addFam);

    const back = el('button','back-btn');
    back.textContent='← 返回';
    back.onclick=()=>{ S.view='home'; render(); };
    wrap.appendChild(back);
  } else {
    wrap.innerHTML = `<div class="settings-title">👋 歡迎使用月之週期</div>
      <div class="settings-subtitle">先建立你的個人檔案</div>`;
    wrap.appendChild(buildAddUserForm());
  }

  app.appendChild(wrap);
  setTimeout(()=>{
    const f=document.querySelector('.color-dot:first-child');
    if(f&&!document.querySelector('.color-dot.selected')){f.classList.add('selected');window._selColor='#c0576a';}
  },50);
}

function buildAddUserForm() {
  const f = el('div','add-form');
  f.innerHTML = `
    <input type="text" id="new-name" placeholder="姓名（如：小雅）" maxlength="10">
    <input type="date" id="new-start" max="${today()}">
    <div class="form-label-sm">最近一次月經開始日</div>
    <div class="inline-inputs">
      <label>週期長度 <input type="number" id="new-cycle" value="28" min="18" max="45"> 天</label>
      <label>經期長度 <input type="number" id="new-period" value="5" min="1" max="12"> 天</label>
    </div>
    <div class="color-row">
      ${['#c0576a','#8b7fd4','#4db896','#d4974d','#e87fa0','#7fa8e8'].map(c=>
        `<button class="color-dot" style="background:${c}" onclick="pickColor('${c}',this)"></button>`
      ).join('')}
    </div>
    <button class="add-user-btn" onclick="addUser()">建立</button>`;
  return f;
}

window.pickColor = (c, btn) => {
  document.querySelectorAll('.color-dot').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected'); window._selColor = c;
};

window.addUser = () => {
  const name   = document.getElementById('new-name').value.trim();
  const start  = document.getElementById('new-start').value;
  const cycle  = parseInt(document.getElementById('new-cycle').value)||28;
  const period = parseInt(document.getElementById('new-period').value)||5;
  if (!name)  { alert('請輸入姓名'); return; }
  if (!start) { alert('請選擇月經開始日'); return; }
  S.users.push({ id:Date.now(), name, cycleStart:start, cycleLen:cycle, periodLen:period,
    color: window._selColor||'#c0576a', logs:{}, periodHistory:[] });
  S.activeUser = S.users.length-1;
  persist(); S.view='home'; render();
};

window.delUser = i => {
  if (!confirm(`確定刪除「${S.users[i].name}」的所有資料？`)) return;
  S.users.splice(i,1);
  if (S.activeUser >= S.users.length) S.activeUser = Math.max(0, S.users.length-1);
  persist(); render();
};

// ── 初始化 ────────────────────────────────────────────────────
function init() {
  hydrate();
  // 如果已有使用者，直接進主畫面；沒有才進設定
  S.view = S.users.length > 0 ? 'home' : 'settings';
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

document.addEventListener('DOMContentLoaded', init);

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
