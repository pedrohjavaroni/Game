'use strict';

/* =========================================================
   O SISTEMA — gamificação de emagrecimento
   Todos os dados ficam no localStorage deste aparelho.
   ========================================================= */

const STORAGE_KEY = 'sistema-save-v1';

const QUESTS = [
  { id: 'pushups', name: 'Flexões', sub: 'Vale com joelho apoiado', stat: 'FOR', base: 10, step: 3, max: 100, incs: [1, 5, 10], scale: true },
  { id: 'situps', name: 'Abdominais', sub: 'Qualquer variação', stat: 'VIT', base: 10, step: 3, max: 100, incs: [1, 5, 10], scale: true },
  { id: 'squats', name: 'Agachamentos', sub: 'Desça até onde for confortável', stat: 'FOR', base: 10, step: 3, max: 100, incs: [1, 5, 10], scale: true },
  { id: 'walk', name: 'Caminhada / Corrida', sub: 'Distância total do dia', stat: 'AGI', unit: ' km', base: 1, step: 0.25, max: 10, incs: [0.5, 1], scale: true, decimal: true },
  { id: 'water', name: 'Hidratação', sub: 'Copos de 250 ml', stat: 'VIT', base: 8, step: 0, max: 8, incs: [1] },
  { id: 'diet', name: 'Alimentação limpa', sub: 'Sem doces, refrigerante e fast food', stat: 'INT', check: true },
  { id: 'sleep', name: 'Recuperação', sub: 'Dormir 7 horas ou mais', stat: 'PER', check: true },
];

const STATS = [
  { id: 'FOR', name: 'FORÇA' },
  { id: 'AGI', name: 'AGILIDADE' },
  { id: 'VIT', name: 'VITALIDADE' },
  { id: 'PER', name: 'PERCEPÇÃO' },
  { id: 'INT', name: 'INTELIGÊNCIA' },
];

const DIFF_MULT = { iniciante: 0.5, normal: 1, dificil: 1.5 };

const XP_PER_QUEST = 15;
const XP_DAILY_BONUS = 50;
const XP_WEIGH_IN = 10;
const XP_PER_KG = 100;
const XP_DUNGEON = 300;
const POINTS_PER_LEVEL = 3;
const DUNGEON_TARGET = 5;

const PENALTIES = [
  'Sobreviva: caminhe 40 minutos sem parar',
  'Sobreviva: 4 séries de 15 polichinelos + 1 min de prancha',
  'Sobreviva: suba e desça escadas por 15 minutos',
  'Sobreviva: 30 minutos de caminhada rápida + 20 agachamentos',
];

const ACHIEVEMENTS = [
  { id: 'awaken', title: 'O Despertado', desc: 'Conclua sua primeira Missão Diária' },
  { id: 'streak3', title: 'Persistente', desc: '3 dias seguidos de Missão Diária' },
  { id: 'streak7', title: 'Inabalável', desc: '7 dias seguidos' },
  { id: 'streak30', title: 'Soberano da Disciplina', desc: '30 dias seguidos' },
  { id: 'lvl5', title: 'Novato Promissor', desc: 'Alcance o nível 5' },
  { id: 'lvl10', title: 'Caçador', desc: 'Alcance o nível 10 (Rank D)' },
  { id: 'lvl30', title: 'Veterano', desc: 'Alcance o nível 30 (Rank B)' },
  { id: 'lvl60', title: 'Lenda Viva', desc: 'Alcance o nível 60 (Rank S)' },
  { id: 'kg1', title: 'Primeiro Passo', desc: 'Perca 1 kg' },
  { id: 'kg5', title: 'Metamorfose', desc: 'Perca 5 kg' },
  { id: 'kg10', title: 'Corpo Forjado', desc: 'Perca 10 kg' },
  { id: 'goal', title: 'Renascido', desc: 'Alcance o peso meta' },
  { id: 'penalty', title: 'Sobrevivente', desc: 'Conclua uma Missão de Penalidade' },
  { id: 'dungeon1', title: 'Explorador de Masmorras', desc: 'Conquiste uma Masmorra Semanal' },
  { id: 'dungeon4', title: 'Conquistador', desc: 'Conquiste 4 Masmorras Semanais' },
  { id: 'weigh10', title: 'Analista', desc: 'Registre o peso 10 vezes' },
];

/* ---------------- utilidades ---------------- */

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
const fmtKg = (n) => (n == null ? '-' : `${n.toFixed(1).replace('.', ',')} kg`);
const fmtNum = (n, dec) => (dec ? String(+n.toFixed(2)).replace('.', ',') : String(n));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function weekStart(k) {
  const d = parseKey(k);
  const dow = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dow);
  return dateKey(d);
}

/* ---------------- estado ---------------- */

let state = load();

function defaultState() {
  return {
    profile: null,
    level: 1,
    xp: 0,
    totalXp: 0,
    statPoints: 0,
    stats: { FOR: 10, AGI: 10, VIT: 10, PER: 10, INT: 10 },
    days: {},
    weights: [],
    minWeight: null,
    streak: 0,
    bestStreak: 0,
    dailiesDone: 0,
    penalty: null,
    penaltiesDone: 0,
    dungeons: {},
    achievements: {},
    title: null,
    lastDay: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* armazenamento indisponível */ }
  return defaultState();
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

/* ---------------- regras do jogo ---------------- */

const xpToNext = (lvl) => 80 + 40 * lvl;

function rankFor(lvl) {
  if (lvl >= 60) return 'S';
  if (lvl >= 45) return 'A';
  if (lvl >= 30) return 'B';
  if (lvl >= 20) return 'C';
  if (lvl >= 10) return 'D';
  return 'E';
}

function classFor(lvl) {
  if (lvl >= 60) return 'Soberano';
  if (lvl >= 45) return 'Mestre de Batalha';
  if (lvl >= 30) return 'Guerreiro de Elite';
  if (lvl >= 20) return 'Caçador Veterano';
  if (lvl >= 10) return 'Caçador';
  return 'Jogador';
}

function questTarget(q, lvl, diff) {
  if (q.check) return 1;
  let t = Math.min(q.max, q.base + (lvl - 1) * q.step);
  if (q.scale) t *= DIFF_MULT[diff] || 1;
  if (q.decimal) return Math.max(0.5, Math.round(t * 2) / 2);
  return Math.max(5, Math.round(t));
}

function makeDay() {
  const diff = state.profile ? state.profile.difficulty : 'normal';
  const targets = {};
  QUESTS.forEach((q) => { targets[q.id] = questTarget(q, state.level, diff); });
  return { targets, progress: {}, rewarded: {}, completed: false };
}

function today() {
  const k = dateKey();
  if (!state.days[k]) state.days[k] = makeDay();
  return state.days[k];
}

function gainXp(amount, reason) {
  let amt = amount;
  if (state.penalty) amt = Math.ceil(amt / 2);
  state.xp += amt;
  state.totalXp += amt;
  if (reason) toast('SISTEMA', `${reason} <b>+${amt} XP</b>${state.penalty ? ' <small>(penalidade: ½)</small>' : ''}`);
  let leveled = false;
  while (state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    const oldRank = rankFor(state.level);
    state.level += 1;
    state.statPoints += POINTS_PER_LEVEL;
    leveled = true;
    const newRank = rankFor(state.level);
    toast('LEVEL UP!', `Você alcançou o <b>nível ${state.level}</b>. +${POINTS_PER_LEVEL} pontos de atributo.`, 'levelup');
    if (newRank !== oldRank) toast('RECLASSIFICAÇÃO', `Seu rank subiu para <b>${newRank}</b>. Nova classe: <b>${classFor(state.level)}</b>.`, 'levelup');
  }
  if (leveled) checkAchievements();
}

/* Avalia dias que passaram desde a última abertura */
function rollover() {
  const t = dateKey();
  if (!state.profile) { state.lastDay = t; return; }
  if (state.lastDay && state.lastDay !== t) {
    let failed = false;
    for (let k = state.lastDay; k < t; k = addDays(k, 1)) {
      const d = state.days[k];
      if (!d || !d.completed) { failed = true; break; }
    }
    if (failed) {
      if (state.streak > 0) toast('SISTEMA', `Sua sequência de <b>${state.streak}</b> dias foi quebrada.`, 'bad');
      state.streak = 0;
      if (!state.penalty) {
        state.penalty = { since: t, text: PENALTIES[Math.floor(Math.random() * PENALTIES.length)] };
        toast('⚠ PENALIDADE', 'A Missão Diária não foi concluída. Uma Missão de Penalidade foi atribuída.', 'bad');
      }
    }
  }
  state.lastDay = t;
  today();
  save();
}

function updateQuest(id, delta) {
  const q = QUESTS.find((x) => x.id === id);
  const d = today();
  const target = d.targets[id];
  let v = (d.progress[id] || 0) + delta;
  if (q.check) v = clamp(v, 0, 1);
  v = Math.max(0, Math.round(v * 100) / 100);
  d.progress[id] = v;

  if (v >= target && !d.rewarded[id]) {
    d.rewarded[id] = true;
    gainXp(XP_PER_QUEST, `Missão "${q.name}" concluída.`);
  }

  const allDone = QUESTS.every((x) => (d.progress[x.id] || 0) >= d.targets[x.id]);
  if (allDone && !d.completed) {
    d.completed = true;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.dailiesDone += 1;
    const bonus = XP_DAILY_BONUS + 5 * Math.min(state.streak, 20);
    gainXp(bonus, `MISSÃO DIÁRIA COMPLETA! Sequência: ${state.streak} dia(s).`);
    checkAchievements();
  }
  save();
  render();
}

function addStat(id) {
  if (state.statPoints <= 0) return;
  state.statPoints -= 1;
  state.stats[id] += 1;
  save();
  render();
}

function completePenalty() {
  if (!state.penalty) return;
  if (!confirm('Você realmente concluiu a Missão de Penalidade?')) return;
  state.penalty = null;
  state.penaltiesDone += 1;
  toast('SISTEMA', 'Você sobreviveu à Missão de Penalidade. O ganho de XP voltou ao normal.');
  checkAchievements();
  save();
  render();
}

function logWeight(kg) {
  const k = dateKey();
  const d = today();
  const existing = state.weights.find((w) => w.date === k);
  if (existing) existing.kg = kg; else state.weights.push({ date: k, kg });
  state.weights.sort((a, b) => (a.date < b.date ? -1 : 1));

  if (!d.weighed) {
    d.weighed = true;
    gainXp(XP_WEIGH_IN, 'Pesagem registrada.');
  }
  if (state.minWeight == null) state.minWeight = state.profile.startWeight;
  if (kg < state.minWeight) {
    const lost = state.minWeight - kg;
    state.minWeight = kg;
    gainXp(Math.round(lost * XP_PER_KG), `Novo recorde: ${fmtKg(kg)}!`);
  }
  checkAchievements();
  save();
  render();
}

function currentWeight() {
  if (state.weights.length) return state.weights[state.weights.length - 1].kg;
  return state.profile ? state.profile.startWeight : null;
}

function dungeonInfo() {
  const t = dateKey();
  const ws = weekStart(t);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i);
    days.push({ k, ok: !!(state.days[k] && state.days[k].completed), today: k === t });
  }
  const count = days.filter((x) => x.ok).length;
  return { ws, days, count, claimed: !!state.dungeons[ws] };
}

function claimDungeon() {
  const info = dungeonInfo();
  if (info.claimed || info.count < DUNGEON_TARGET) return;
  state.dungeons[info.ws] = true;
  gainXp(XP_DUNGEON, 'MASMORRA CONQUISTADA!');
  checkAchievements();
  save();
  render();
}

function checkAchievements() {
  if (!state.profile) return;
  const lost = state.profile.startWeight - (state.minWeight ?? state.profile.startWeight);
  const dungeons = Object.keys(state.dungeons).length;
  const cond = {
    awaken: state.dailiesDone >= 1,
    streak3: state.bestStreak >= 3,
    streak7: state.bestStreak >= 7,
    streak30: state.bestStreak >= 30,
    lvl5: state.level >= 5,
    lvl10: state.level >= 10,
    lvl30: state.level >= 30,
    lvl60: state.level >= 60,
    kg1: lost >= 1,
    kg5: lost >= 5,
    kg10: lost >= 10,
    goal: (state.minWeight ?? Infinity) <= state.profile.goalWeight,
    penalty: state.penaltiesDone >= 1,
    dungeon1: dungeons >= 1,
    dungeon4: dungeons >= 4,
    weigh10: state.weights.length >= 10,
  };
  ACHIEVEMENTS.forEach((a) => {
    if (cond[a.id] && !state.achievements[a.id]) {
      state.achievements[a.id] = dateKey();
      toast('CONQUISTA DESBLOQUEADA', `Título obtido: <b>「${a.title}」</b>`, 'levelup');
      if (!state.title) state.title = a.id;
    }
  });
}

/* ---------------- notificações ---------------- */

function toast(head, html, kind = '') {
  const t = el('div', `toast ${kind}`);
  const h = el('div', 't-head', `[ ${head} ]`);
  const b = el('div', 't-body');
  b.innerHTML = html; // conteúdo gerado internamente, nunca dados do usuário
  t.append(h, b);
  const box = $('#toasts');
  box.append(t);
  while (box.children.length > 3) box.firstElementChild.remove();
  if (navigator.vibrate && kind === 'levelup') navigator.vibrate([60, 40, 120]);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, kind === 'levelup' ? 4500 : 3000);
}

/* ---------------- renderização ---------------- */

function render() {
  if (!state.profile) return;
  renderStatus();
  renderQuests();
  renderDungeon();
  renderWeight();
  renderAchievements();
}

function renderStatus() {
  const p = state.profile;
  const rank = rankFor(state.level);
  const badge = $('#rank-badge');
  badge.textContent = rank;
  badge.className = `rank-badge r-${rank}`;
  $('#st-name').textContent = p.name;
  $('#st-level').textContent = state.level;
  const t = ACHIEVEMENTS.find((a) => a.id === state.title);
  $('#st-title').textContent = t ? t.title : 'Nenhum';
  $('#st-class').textContent = classFor(state.level);
  const need = xpToNext(state.level);
  $('#st-xp').textContent = `${state.xp} / ${need}`;
  $('#st-xp-bar').style.width = `${(state.xp / need) * 100}%`;

  const cw = currentWeight();
  const total = p.startWeight - p.goalWeight;
  const prog = total > 0 ? clamp((p.startWeight - cw) / total, 0, 1) : 1;
  $('#st-body').textContent = `${Math.round(prog * 100)}%`;
  $('#st-body-bar').style.width = `${prog * 100}%`;
  $('#st-weight').textContent = fmtKg(cw);
  $('#st-goal').textContent = fmtKg(p.goalWeight);
  const bmi = cw / ((p.height / 100) ** 2);
  $('#st-bmi').textContent = bmi.toFixed(1).replace('.', ',');
  $('#st-streak').textContent = `${state.streak} 🔥`;

  $('#st-points').textContent = state.statPoints > 0 ? `· ${state.statPoints} PONTOS DISPONÍVEIS` : '';
  const list = $('#stats-list');
  list.innerHTML = '';
  STATS.forEach((s) => {
    const row = el('div', 'stat');
    const name = el('div', 's-name', s.id);
    name.append(el('small', '', s.name));
    const val = el('div', 's-val', String(state.stats[s.id]));
    if (state.statPoints > 0) {
      const b = el('button', 'plus', '+');
      b.setAttribute('aria-label', `Adicionar ponto em ${s.name}`);
      b.onclick = () => addStat(s.id);
      val.append(b);
    }
    row.append(name, val);
    list.append(row);
  });

  const pp = $('#penalty-panel');
  pp.hidden = !state.penalty;
  if (state.penalty) $('#penalty-text').textContent = state.penalty.text;
}

function renderQuests() {
  const d = today();
  const list = $('#quest-list');
  list.innerHTML = '';
  QUESTS.forEach((q) => {
    const target = d.targets[q.id];
    const v = d.progress[q.id] || 0;
    const done = v >= target;
    const row = el('div', `quest${done ? ' done' : ''}`);
    const info = el('div', 'q-info');
    const name = el('div', 'q-name', q.name);
    if (done) name.append(el('span', 'q-check', ' ✔'));
    info.append(name, el('div', 'q-sub', q.sub));
    if (!q.check) {
      info.append(el('div', 'q-prog', `[${fmtNum(v, q.decimal)}/${fmtNum(target, q.decimal)}${q.unit || ''}]`));
      const bar = el('div', 'qbar');
      const fill = el('div');
      fill.style.width = `${clamp(v / target, 0, 1) * 100}%`;
      bar.append(fill);
      info.append(bar);
    }
    const btns = el('div', 'q-btns');
    if (q.check) {
      const b = el('button', `btn mini${done ? ' gold' : ''}`, done ? 'FEITO' : 'CONCLUIR');
      b.onclick = () => updateQuest(q.id, done ? -1 : 1);
      btns.append(b);
    } else {
      const minus = el('button', 'btn mini', '−');
      minus.setAttribute('aria-label', 'Desfazer');
      minus.disabled = v <= 0;
      minus.onclick = () => updateQuest(q.id, -q.incs[0]);
      btns.append(minus);
      q.incs.forEach((inc) => {
        const b = el('button', 'btn mini', `+${fmtNum(inc, q.decimal)}`);
        b.onclick = () => updateQuest(q.id, inc);
        btns.append(b);
      });
    }
    row.append(info, btns);
    list.append(row);
  });

  const r = $('#daily-reward');
  const bonus = XP_DAILY_BONUS + 5 * Math.min(state.streak + (d.completed ? 0 : 1), 20);
  if (d.completed) {
    r.className = 'daily-reward claimed';
    r.textContent = '✔ Missão Diária completa. Recompensa recebida. Descanse, Jogador.';
  } else {
    const n = QUESTS.filter((q) => (d.progress[q.id] || 0) >= d.targets[q.id]).length;
    r.className = 'daily-reward';
    r.textContent = `Recompensa ao completar tudo: +${bonus} XP (bônus de sequência) · ${n}/${QUESTS.length} concluídas`;
  }
}

function renderDungeon() {
  const info = dungeonInfo();
  const box = $('#dungeon');
  box.innerHTML = '';
  box.append(el('p', 'sys-text', `Complete a Missão Diária em ${DUNGEON_TARGET} dos 7 dias desta semana para conquistar a masmorra. Recompensa: +${XP_DUNGEON} XP.`));
  const days = el('div', 'dungeon-days');
  const names = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  info.days.forEach((x, i) => {
    days.append(el('div', `dday${x.ok ? ' ok' : ''}${x.today ? ' today' : ''}`, `${names[i]}${x.ok ? ' ✔' : ''}`));
  });
  box.append(days);
  const b = el('button', 'btn full gold');
  if (info.claimed) { b.textContent = '✔ MASMORRA CONQUISTADA'; b.disabled = true; }
  else if (info.count >= DUNGEON_TARGET) { b.textContent = 'REIVINDICAR RECOMPENSA'; b.onclick = claimDungeon; }
  else { b.textContent = `PROGRESSO ${info.count}/${DUNGEON_TARGET}`; b.disabled = true; }
  box.append(b);
}

function renderWeight() {
  const p = state.profile;
  const hist = $('#weight-history');
  hist.innerHTML = '';
  const ws = state.weights.slice().reverse();
  if (!ws.length) hist.append(el('li', 'sys-text small', 'Nenhum registro ainda.'));
  ws.forEach((w, i) => {
    const li = el('li');
    const [y, m, d] = w.date.split('-');
    li.append(el('span', '', `${d}/${m}/${y}`));
    const right = el('span');
    const prev = ws[i + 1];
    if (prev) {
      const diff = w.kg - prev.kg;
      if (Math.abs(diff) >= 0.05) right.append(el('small', diff < 0 ? 'down' : 'up', `${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.', ',')}  `));
    }
    right.append(el('b', '', fmtKg(w.kg)));
    const del = el('button', 'del', '✕');
    del.setAttribute('aria-label', 'Apagar registro');
    del.onclick = () => {
      if (!confirm('Apagar este registro?')) return;
      state.weights = state.weights.filter((x) => x.date !== w.date);
      save(); render();
    };
    right.append(del);
    li.append(right);
    hist.append(li);
  });

  const cw = currentWeight();
  const lost = p.startWeight - cw;
  const remain = cw - p.goalWeight;
  const sum = $('#weight-summary');
  sum.innerHTML = '';
  [['INICIAL', fmtKg(p.startWeight)], ['ATUAL', fmtKg(cw)], ['PERDIDO', fmtKg(Math.max(0, lost))], ['FALTAM', fmtKg(Math.max(0, remain))]]
    .forEach(([l, v]) => { const d = el('div'); d.append(el('span', 'lbl', l), el('b', '', v)); sum.append(d); });

  drawChart();
}

function drawChart() {
  const c = $('#weight-chart');
  if (!c.offsetParent) return; // aba oculta
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = 220;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const p = state.profile;
  const pts = [{ date: p.startDate, kg: p.startWeight }, ...state.weights.filter((x) => x.date !== p.startDate)];
  pts.sort((a, b) => (a.date < b.date ? -1 : 1));
  const vals = pts.map((x) => x.kg).concat([p.goalWeight]);
  let min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const padL = 40, padR = 10, padT = 10, padB = 24;
  const X = (i) => padL + (pts.length === 1 ? (w - padL - padR) / 2 : (i / (pts.length - 1)) * (w - padL - padR));
  const Y = (v) => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);

  ctx.font = '12px Rajdhani, sans-serif';
  ctx.fillStyle = '#7d97b8';
  ctx.strokeStyle = 'rgba(76,195,255,.12)';
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    const y = Y(v);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(v.toFixed(0), 6, y + 4);
  }
  // meta
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#3ef0a8';
  ctx.beginPath(); ctx.moveTo(padL, Y(p.goalWeight)); ctx.lineTo(w - padR, Y(p.goalWeight)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#3ef0a8';
  ctx.fillText('META', w - padR - 30, Y(p.goalWeight) - 5);

  // linha
  ctx.strokeStyle = '#4cc3ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4cc3ff'; ctx.shadowBlur = 8;
  ctx.beginPath();
  pts.forEach((pt, i) => (i ? ctx.lineTo(X(i), Y(pt.kg)) : ctx.moveTo(X(i), Y(pt.kg))));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  pts.forEach((pt, i) => { ctx.beginPath(); ctx.arc(X(i), Y(pt.kg), 3, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = '#7d97b8';
  const lbl = (k) => { const [, m, d] = k.split('-'); return `${d}/${m}`; };
  ctx.fillText(lbl(pts[0].date), padL, h - 6);
  if (pts.length > 1) { const t = lbl(pts[pts.length - 1].date); ctx.fillText(t, w - padR - ctx.measureText(t).width, h - 6); }
}

function renderAchievements() {
  const g = $('#achievements');
  g.innerHTML = '';
  ACHIEVEMENTS.forEach((a) => {
    const un = !!state.achievements[a.id];
    const box = el('div', `ach${un ? ' unlocked' : ''}${state.title === a.id ? ' equipped' : ''}`);
    box.append(el('b', '', un ? `「${a.title}」` : '「 ??? 」'), el('small', '', a.desc));
    if (un) box.onclick = () => { state.title = a.id; save(); render(); toast('SISTEMA', `Título 「${a.title}」 equipado.`); };
    g.append(box);
  });

  const rec = $('#records');
  rec.innerHTML = '';
  const startDays = Math.floor((parseKey(dateKey()) - parseKey(state.profile.startDate)) / 86400000) + 1;
  [['XP TOTAL', state.totalXp], ['MELHOR SEQUÊNCIA', `${state.bestStreak} dias`], ['DIÁRIAS COMPLETAS', state.dailiesDone],
    ['MASMORRAS', Object.keys(state.dungeons).length], ['PENALIDADES', state.penaltiesDone], ['DIA DA JORNADA', startDays]]
    .forEach(([l, v]) => { const d = el('div'); d.append(el('span', 'lbl', l), el('b', '', String(v))); rec.append(d); });
}

function fillSettings() {
  const p = state.profile;
  $('#cfg-name').value = p.name;
  $('#cfg-height').value = p.height;
  $('#cfg-goal').value = p.goalWeight;
  $('#cfg-diff').value = p.difficulty;
}

/* ---------------- relógio de reset ---------------- */

function tick() {
  const now = new Date();
  const mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const s = Math.floor((mid - now) / 1000);
  $('#reset-clock').textContent = `RESET ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  if (state.profile && state.lastDay !== dateKey()) { rollover(); render(); }
}

/* ---------------- eventos ---------------- */

function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  window.scrollTo(0, 0);
  if (name === 'weight') drawChart();
  if (name === 'settings') fillSettings();
}

document.querySelectorAll('.tabbar button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

$('#ob-accept').onclick = () => { $('#ob-step1').hidden = true; $('#ob-form').hidden = false; };

$('#ob-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const start = parseFloat($('#ob-weight').value);
  const goal = parseFloat($('#ob-goal').value);
  if (goal >= start) { alert('O peso meta precisa ser menor que o peso atual.'); return; }
  state = defaultState();
  state.profile = {
    name: $('#ob-name').value.trim(),
    height: parseFloat($('#ob-height').value),
    startWeight: start,
    goalWeight: goal,
    difficulty: $('#ob-diff').value,
    startDate: dateKey(),
  };
  state.minWeight = start;
  state.weights = [{ date: dateKey(), kg: start }];
  state.lastDay = dateKey();
  today();
  save();
  $('#onboarding').hidden = true;
  render();
  toast('SISTEMA', `Bem-vindo, Jogador <b>${escapeHtml(state.profile.name)}</b>. Sua primeira Missão Diária foi atribuída.`);
  showView('quests');
});

$('#weight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = parseFloat($('#weight-input').value);
  if (!(v > 0)) return;
  logWeight(v);
  $('#weight-input').value = '';
});

$('#penalty-done').onclick = completePenalty;

$('#settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const p = state.profile;
  p.name = $('#cfg-name').value.trim() || p.name;
  p.height = parseFloat($('#cfg-height').value) || p.height;
  p.goalWeight = parseFloat($('#cfg-goal').value) || p.goalWeight;
  const oldDiff = p.difficulty;
  p.difficulty = $('#cfg-diff').value;
  if (oldDiff !== p.difficulty) {
    // recalcula metas de hoje sem perder o progresso já feito
    const d = today();
    QUESTS.forEach((q) => { d.targets[q.id] = questTarget(q, state.level, p.difficulty); });
  }
  checkAchievements();
  save();
  render();
  toast('SISTEMA', 'Perfil atualizado.');
});

$('#export-btn').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sistema-backup-${dateKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

$('#import-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || !data.profile) throw new Error('inválido');
    if (!confirm('Substituir seus dados atuais por este backup?')) return;
    state = Object.assign(defaultState(), data);
    save();
    rollover();
    render();
    toast('SISTEMA', 'Backup restaurado.');
  } catch (err) {
    alert('Arquivo de backup inválido.');
  } finally {
    e.target.value = '';
  }
});

$('#reset-btn').onclick = () => {
  if (!confirm('Isso apaga TODO o seu progresso. Tem certeza?')) return;
  if (!confirm('Última chance. Apagar tudo?')) return;
  state = defaultState();
  save();
  location.reload();
};

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

window.addEventListener('resize', () => { if (state.profile) drawChart(); });

/* ---------------- início ---------------- */

if (!state.profile) {
  $('#onboarding').hidden = false;
} else {
  rollover();
  render();
}
tick();
setInterval(tick, 1000);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
