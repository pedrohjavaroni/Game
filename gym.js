'use strict';

/* =========================================================
   FIT GAME — Módulo de Academia
   Divisão semanal gerada pelos dias escolhidos e pela experiência,
   check-in de presença, registro de cargas, recordes e metas.
   Usa funções globais de app.js (state, save, render, gainXp, toast...).
   ========================================================= */

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

const GYM_XP = { checkin: 20, finish: 60, pr: 25, perfectWeek: 150 };
const MAX_PR_XP_PER_SESSION = 3;

// t: lower = membros inferiores, upper = superiores, core = abdômen (sem carga)
const EXERCISES = {
  agach: { n: 'Agachamento livre', t: 'lower' },
  goblet: { n: 'Agachamento goblet (halter)', t: 'lower' },
  legpress: { n: 'Leg press 45°', t: 'lower' },
  terra_rom: { n: 'Levantamento terra romeno', t: 'lower' },
  cadeira_ext: { n: 'Cadeira extensora', t: 'lower' },
  mesa_flex: { n: 'Mesa flexora', t: 'lower' },
  afundo: { n: 'Afundo com halteres', t: 'lower' },
  elev_pelvica: { n: 'Elevação pélvica', t: 'lower' },
  panturrilha: { n: 'Panturrilha em pé', t: 'lower' },
  supino_h: { n: 'Supino reto com halteres', t: 'upper' },
  supino_inc: { n: 'Supino inclinado', t: 'upper' },
  crucifixo: { n: 'Crucifixo na máquina', t: 'upper' },
  puxada: { n: 'Puxada frontal', t: 'upper' },
  remada_b: { n: 'Remada baixa', t: 'upper' },
  remada_u: { n: 'Remada unilateral com halter', t: 'upper' },
  desenv: { n: 'Desenvolvimento com halteres', t: 'upper' },
  elev_lat: { n: 'Elevação lateral', t: 'upper' },
  face_pull: { n: 'Face pull', t: 'upper' },
  triceps: { n: 'Tríceps na polia', t: 'upper' },
  rosca: { n: 'Rosca direta', t: 'upper' },
  prancha: { n: 'Prancha', t: 'core', time: true },
  elev_pernas: { n: 'Elevação de pernas', t: 'core' },
  abd_polia: { n: 'Abdominal na polia', t: 'core' },
};

const TEMPLATES = {
  FB_A: { name: 'Corpo inteiro A', ex: ['legpress', 'supino_h', 'puxada', 'desenv', 'mesa_flex', 'prancha'] },
  FB_B: { name: 'Corpo inteiro B', ex: ['agach', 'remada_b', 'supino_inc', 'terra_rom', 'elev_lat', 'elev_pernas'] },
  FB_C: { name: 'Corpo inteiro C', ex: ['afundo', 'remada_u', 'crucifixo', 'elev_pelvica', 'face_pull', 'prancha'] },
  UP_A: { name: 'Superiores A', ex: ['supino_h', 'puxada', 'desenv', 'remada_b', 'triceps', 'rosca'] },
  LO_A: { name: 'Inferiores A', ex: ['agach', 'terra_rom', 'cadeira_ext', 'mesa_flex', 'panturrilha', 'prancha'] },
  UP_B: { name: 'Superiores B', ex: ['supino_inc', 'remada_u', 'elev_lat', 'crucifixo', 'face_pull', 'rosca'] },
  LO_B: { name: 'Inferiores B', ex: ['legpress', 'afundo', 'elev_pelvica', 'mesa_flex', 'panturrilha', 'elev_pernas'] },
  PUSH: { name: 'Empurrar (peito, ombro, tríceps)', ex: ['supino_h', 'supino_inc', 'desenv', 'elev_lat', 'crucifixo', 'triceps'] },
  PULL: { name: 'Puxar (costas, bíceps)', ex: ['puxada', 'remada_b', 'remada_u', 'face_pull', 'rosca', 'abd_polia'] },
  LEGS: { name: 'Pernas', ex: ['agach', 'legpress', 'terra_rom', 'cadeira_ext', 'mesa_flex', 'panturrilha'] },
};

const GYM_LEVELS = {
  iniciante: { label: 'Iniciante — menos de 6 meses de treino', sets: 3, reps: '12', core: '30 s', rest: '60–90 s', cardio: 15 },
  intermediario: { label: 'Intermediário — 6 meses a 2 anos', sets: 3, reps: '10', core: '45 s', rest: '90 s', cardio: 20 },
  avancado: { label: 'Avançado — mais de 2 anos', sets: 4, reps: '8–10', core: '60 s', rest: '2 min', cardio: 20 },
};

function splitFor(nDays, level) {
  switch (nDays) {
    case 1: return ['FB_A'];
    case 2: return ['FB_A', 'FB_B'];
    case 3: return level === 'iniciante' ? ['FB_A', 'FB_B', 'FB_C'] : ['PUSH', 'PULL', 'LEGS'];
    case 4: return ['UP_A', 'LO_A', 'UP_B', 'LO_B'];
    case 5: return ['UP_A', 'LO_A', 'PUSH', 'PULL', 'LEGS'];
    default: return ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS'];
  }
}

function lowImpact() {
  const plan = typeof getPlan === 'function' ? getPlan() : null;
  return !!(plan && (plan.bmi >= 35 || state.profile.conditions || state.profile.pregnancy !== 'nao'));
}

function buildWorkouts() {
  const g = state.gym;
  if (!g.setup) return [];
  const lv = GYM_LEVELS[g.setup.level] || GYM_LEVELS.iniciante;
  const low = lowImpact();
  return splitFor(g.setup.days.length, g.setup.level).map((key, i) => {
    const tpl = TEMPLATES[key];
    const ex = tpl.ex.map((id) => {
      // iniciante: troca agachamento livre por goblet (mais fácil de aprender)
      const real = id === 'agach' && g.setup.level === 'iniciante' ? 'goblet' : id;
      const e = EXERCISES[real];
      return { id: real, name: e.n, type: e.t, sets: lv.sets, reps: e.t === 'core' ? (e.time ? lv.core : '15') : lv.reps, rest: lv.rest, time: !!e.time };
    });
    const cardio = low
      ? `${lv.cardio} min de bicicleta ou elíptico em ritmo moderado`
      : g.setup.level === 'avancado'
        ? `${lv.cardio} min intervalado (1 min forte / 1 min leve)`
        : `${lv.cardio} min de caminhada inclinada na esteira`;
    return { key, letter: String.fromCharCode(65 + i), name: tpl.name, ex, cardio };
  });
}

/* ------------- agenda ------------- */

const dow = (k) => (parseKey(k).getDay() + 6) % 7; // segunda = 0

function isGymDay(k) {
  const g = state.gym;
  return !!(g && g.setup && g.setup.days.includes(dow(k)));
}

function workoutIndexFor(k) {
  const days = state.gym.setup.days.slice().sort((a, b) => a - b);
  const pos = days.indexOf(dow(k));
  return pos < 0 ? 0 : pos % buildWorkouts().length;
}

function weekAttendance(ws) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const s = state.gym.sessions[addDays(ws, i)];
    if (s && s.checkIn) n += 1;
  }
  return n;
}

function monthAttendance() {
  const t = dateKey();
  const prefix = t.slice(0, 7);
  return Object.entries(state.gym.sessions).filter(([k, s]) => k.startsWith(prefix) && s.checkIn).length;
}

function monthGoal() {
  const t = parseKey(dateKey());
  const daysInMonth = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return Math.round((state.gym.setup.days.length * daysInMonth) / 7);
}

function perfectWeekStreak() {
  let ws = weekStart(dateKey());
  const goal = state.gym.setup.days.length;
  // semana atual conta só se já bateu a meta
  let n = weekAttendance(ws) >= goal ? 1 : 0;
  ws = addDays(ws, -7);
  while (weekAttendance(ws) >= goal && n < 520) { n += 1; ws = addDays(ws, -7); }
  return n;
}

function lastLogFor(exId, beforeKey) {
  const keys = Object.keys(state.gym.sessions).filter((k) => k < beforeKey).sort().reverse();
  for (const k of keys) {
    const l = state.gym.sessions[k].log && state.gym.sessions[k].log[exId];
    if (l && l.kg > 0) return l;
  }
  return null;
}

function suggestion(ex, last) {
  if (!last) return 'Primeira vez: escolha uma carga em que as últimas 2 repetições fiquem difíceis, sem perder a postura.';
  const allDone = last.sets && last.sets.length && last.sets.every(Boolean);
  if (allDone) {
    const inc = ex.type === 'lower' ? 5 : 2.5;
    return `Última vez: ${fmtNum(last.kg, true)} kg com todas as séries. Tente ${fmtNum(last.kg + inc, true)} kg.`;
  }
  return `Última vez: ${fmtNum(last.kg, true)} kg. Mantenha até completar todas as séries.`;
}

/* ------------- ações ------------- */

function saveGymSetup(days, level) {
  state.gym.setup = { days: days.sort((a, b) => a - b), level };
  const d = today();
  if (!d.completed) {
    const gymNow = isGymDay(dateKey());
    d.gymDay = gymNow;
  }
  save();
  render();
  toast('SISTEMA', `Plano de treino gerado: <b>${days.length}×</b> por semana.`);
}

function startSession(idx) {
  const k = dateKey();
  if (state.gym.sessions[k] && state.gym.sessions[k].checkIn) return;
  state.gym.sessions[k] = { workout: idx, checkIn: Date.now(), finished: null, log: {}, cardio: false };
  state.gym.totalCheckins = (state.gym.totalCheckins || 0) + 1;
  gainXp(GYM_XP.checkin, 'Check-in na academia registrado.');
  checkAchievements();
  save();
  render();
}

function toggleSet(exId, i, sets) {
  const s = state.gym.sessions[dateKey()];
  if (!s || s.finished) return;
  const l = s.log[exId] || (s.log[exId] = { kg: 0, sets: Array(sets).fill(false) });
  l.sets[i] = !l.sets[i];
  save();
  renderGym();
  if (l.sets[i]) startRest();
}

function setLoad(exId, kg, sets) {
  const s = state.gym.sessions[dateKey()];
  if (!s || s.finished) return;
  const l = s.log[exId] || (s.log[exId] = { kg: 0, sets: Array(sets).fill(false) });
  l.kg = kg > 0 ? Math.round(kg * 10) / 10 : 0;
  save();
}

function finishSession() {
  const k = dateKey();
  const s = state.gym.sessions[k];
  if (!s || s.finished) return;
  const ws_ = buildWorkouts();
  const w = ws_[s.workout] || ws_[0];
  const total = w.ex.reduce((a, e) => a + e.sets, 0);
  const done = w.ex.reduce((a, e) => a + ((s.log[e.id] && s.log[e.id].sets.filter(Boolean).length) || 0), 0);
  if (done < total / 2 && !confirm(`Você marcou ${done} de ${total} séries. Finalizar mesmo assim?`)) return;
  s.finished = Date.now();
  clearInterval(restTimer);
  $('#rest-timer').hidden = true;
  state.gym.finished = (state.gym.finished || 0) + 1;
  gainXp(GYM_XP.finish, `Treino ${w.letter} finalizado (${done}/${total} séries).`);

  // recordes pessoais (só conta quando supera uma carga anterior)
  let prs = 0;
  w.ex.forEach((e) => {
    const l = s.log[e.id];
    if (!l || !(l.kg > 0)) return;
    const prev = state.gym.prs[e.id];
    if (prev == null) { state.gym.prs[e.id] = l.kg; return; }
    if (l.kg > prev) {
      state.gym.prs[e.id] = l.kg;
      state.gym.prCount = (state.gym.prCount || 0) + 1;
      if (prs < MAX_PR_XP_PER_SESSION) gainXp(GYM_XP.pr, `NOVO RECORDE: ${e.name} ${fmtNum(l.kg, true)} kg!`);
      prs += 1;
    }
  });

  const d = today();
  if (d.gymDay) updateQuest('gym', 1); // também salva e renderiza
  checkAchievements();
  save();
  render();
}

function claimPerfectWeek() {
  const ws = weekStart(dateKey());
  if (state.gym.perfectWeeks[ws] || weekAttendance(ws) < state.gym.setup.days.length) return;
  state.gym.perfectWeeks[ws] = true;
  gainXp(GYM_XP.perfectWeek, 'SEMANA PERFEITA NA ACADEMIA!');
  checkAchievements();
  save();
  render();
}

function gymAchievementConds() {
  const g = state.gym;
  return {
    gym1: (g.totalCheckins || 0) >= 1,
    gym10: (g.totalCheckins || 0) >= 10,
    gym50: (g.totalCheckins || 0) >= 50,
    gym100: (g.totalCheckins || 0) >= 100,
    gymweek: Object.keys(g.perfectWeeks).length >= 1,
    gymweek4: Object.keys(g.perfectWeeks).length >= 4,
    pr1: (g.prCount || 0) >= 1,
    pr10: (g.prCount || 0) >= 10,
  };
}

/* ------------- cronômetro de descanso ------------- */

let restTimer = null;
function startRest() {
  const s = state.gym.sessions[dateKey()];
  const all = buildWorkouts();
  const w = all[s.workout] || all[0];
  const sec = /2 min/.test(w.ex[0].rest) ? 120 : /60/.test(w.ex[0].rest) ? 75 : 90;
  const end = Date.now() + sec * 1000;
  clearInterval(restTimer);
  const box = $('#rest-timer');
  box.hidden = false;
  const upd = () => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    box.textContent = left > 0 ? `DESCANSO ${Math.floor(left / 60)}:${pad(left % 60)} · toque para pular` : 'PRÓXIMA SÉRIE!';
    if (left <= 0) {
      clearInterval(restTimer);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => { box.hidden = true; }, 2500);
    }
  };
  upd();
  restTimer = setInterval(upd, 250);
  box.onclick = () => { clearInterval(restTimer); box.hidden = true; };
}

/* ------------- renderização ------------- */

function renderGym() {
  if (!state.profile) return;
  const g = state.gym;
  const setupPanel = $('#gym-setup');
  const main = $('#gym-main');
  const editing = setupPanel.dataset.editing === '1';
  setupPanel.hidden = !!g.setup && !editing;
  main.hidden = !g.setup || editing;
  if (!g.setup || editing) { fillGymSetup(); return; }

  const workouts = buildWorkouts();
  const t = dateKey();
  const ws = weekStart(t);

  // agenda semanal
  const week = $('#gym-week');
  week.innerHTML = '';
  const sortedDays = g.setup.days.slice().sort((a, b) => a - b);
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i);
    const sch = sortedDays.indexOf(i);
    const sess = g.sessions[k];
    const went = sess && sess.checkIn;
    const cell = el('div', `dday${went ? ' ok' : ''}${k === t ? ' today' : ''}${sch < 0 ? ' rest' : ''}`);
    cell.append(el('div', '', WEEKDAYS[i]));
    const letter = sch >= 0 ? workouts[sch % workouts.length].letter : (went ? (workouts[sess.workout] || workouts[0]).letter : '–');
    cell.append(el('b', '', went ? `${letter}✔` : letter));
    week.append(cell);
  }
  const att = weekAttendance(ws);
  const goal = g.setup.days.length;
  $('#gym-week-goal').textContent = `Presença na semana: ${att}/${goal}`;
  const pwBtn = $('#gym-perfect');
  if (g.perfectWeeks[ws]) { pwBtn.textContent = '✔ SEMANA PERFEITA CONQUISTADA'; pwBtn.disabled = true; pwBtn.onclick = null; }
  else if (att >= goal) { pwBtn.textContent = `REIVINDICAR SEMANA PERFEITA (+${GYM_XP.perfectWeek} XP)`; pwBtn.disabled = false; pwBtn.onclick = claimPerfectWeek; }
  else { pwBtn.textContent = `SEMANA PERFEITA: FALTAM ${goal - att}`; pwBtn.disabled = true; pwBtn.onclick = null; }

  renderTodayWorkout(workouts, t);

  // metas
  const m = monthAttendance(), mg = monthGoal();
  const meta = $('#gym-goals');
  meta.innerHTML = '';
  const bar = (label, v, max) => {
    const w = el('div', 'bar-wrap');
    const lb = el('div', 'bar-label');
    lb.append(el('span', '', label), el('span', '', `${v} / ${max}`));
    const b = el('div', 'bar');
    const f = el('div', 'bar-fill xp');
    f.style.width = `${clamp(v / max, 0, 1) * 100}%`;
    b.append(f);
    w.append(lb, b);
    return w;
  };
  meta.append(bar('PRESENÇA NO MÊS', m, mg), bar('PRESENÇA NA SEMANA', att, goal));
  const grid = el('div', 'mini-stats');
  grid.append(
    statBox('FREQUÊNCIA NO MÊS', `${Math.round((m / Math.max(1, mg)) * 100)}%`, 'da meta mensal'),
    statBox('SEMANAS PERFEITAS', `${perfectWeekStreak()} seguidas`, `${Object.keys(g.perfectWeeks).length} no total`),
    statBox('TREINOS', String(g.totalCheckins || 0), 'check-ins no total'),
    statBox('RECORDES', String(g.prCount || 0), 'cargas superadas'),
  );
  meta.append(grid);

  // recordes
  const pr = $('#gym-prs');
  pr.innerHTML = '';
  const entries = Object.entries(g.prs).filter(([id]) => EXERCISES[id]);
  if (!entries.length) pr.append(el('li', 'sys-text small', 'Registre as cargas durante o treino para criar seus recordes.'));
  entries.sort((a, b) => b[1] - a[1]).forEach(([id, kg]) => {
    const li = el('li');
    li.append(el('span', '', EXERCISES[id].n), el('b', '', `${fmtNum(kg, true)} kg`));
    pr.append(li);
  });

  // histórico
  const hist = $('#gym-history');
  hist.innerHTML = '';
  const ks = Object.keys(g.sessions).sort().reverse().slice(0, 12);
  if (!ks.length) hist.append(el('li', 'sys-text small', 'Nenhum treino ainda.'));
  ks.forEach((k) => {
    const s = g.sessions[k];
    const w = workouts[s.workout] || { letter: '?', name: '', ex: [] };
    const total = w.ex.reduce((a, e) => a + e.sets, 0);
    const done = w.ex.reduce((a, e) => a + ((s.log[e.id] && s.log[e.id].sets.filter(Boolean).length) || 0), 0);
    const [, mm, dd] = k.split('-');
    const li = el('li');
    li.append(el('span', '', `${dd}/${mm} · Treino ${w.letter}`));
    const dur = s.finished ? `${Math.round((s.finished - s.checkIn) / 60000)} min · ` : 'em andamento · ';
    li.append(el('small', s.finished ? 'down' : '', `${dur}${done}/${total} séries`));
    hist.append(li);
  });

  // lista do plano
  const pl = $('#gym-plan');
  pl.innerHTML = '';
  workouts.forEach((w, i) => {
    const det = el('details', 'workout');
    const sum = el('summary');
    const dayNames = sortedDays.filter((_, j) => j % workouts.length === i).map((d) => WEEKDAYS[d]).join(', ');
    sum.append(el('b', '', `Treino ${w.letter} — ${w.name}`), el('small', '', dayNames));
    det.append(sum);
    const ul = el('ul', 'ex-list');
    w.ex.forEach((e) => ul.append(el('li', '', `${e.name} — ${e.sets} × ${e.reps}`)));
    ul.append(el('li', 'cardio', `Cardio final: ${w.cardio}`));
    det.append(ul);
    pl.append(det);
  });
}

function renderTodayWorkout(workouts, t) {
  const box = $('#gym-today');
  box.innerHTML = '';
  const g = state.gym;
  const s = g.sessions[t];
  const scheduled = isGymDay(t);

  if (!s) {
    const idx = scheduled ? workoutIndexFor(t) : 0;
    if (scheduled) {
      const w = workouts[idx];
      box.append(el('p', 'sys-text center big-sys', `Hoje: Treino ${w.letter}`), el('p', 'sys-text center', w.name));
      const b = el('button', 'btn full gold', `✔ CHECK-IN NA ACADEMIA (+${GYM_XP.checkin} XP)`);
      b.onclick = () => startSession(idx);
      box.append(b);
    } else {
      box.append(el('p', 'sys-text center big-sys', 'Dia de descanso'),
        el('p', 'sys-text small center', 'Recuperação também é treino: o músculo cresce no descanso. Uma caminhada leve e alongamento ajudam.'));
      const row = el('div', 'inline-form');
      const sel = el('select');
      sel.id = 'gym-extra-select';
      workouts.forEach((w, i) => { const o = el('option', '', `Treino ${w.letter} — ${w.name}`); o.value = i; sel.append(o); });
      const b = el('button', 'btn', 'TREINAR');
      b.onclick = () => startSession(parseInt(sel.value, 10));
      row.append(sel, b);
      box.append(el('p', 'sys-text small', 'Quer treinar mesmo assim? Conta como presença extra.'), row);
    }
    return;
  }

  const w = workouts[s.workout] || workouts[0];
  box.append(el('p', 'sys-text center big-sys', `Treino ${w.letter} — ${w.name}`));
  const started = new Date(s.checkIn);
  box.append(el('p', 'sys-text small center', `Check-in às ${pad(started.getHours())}:${pad(started.getMinutes())}${s.finished ? ' · finalizado' : ''} · descanso entre séries: ${w.ex[0].rest}`));

  w.ex.forEach((e) => {
    const l = s.log[e.id] || { kg: 0, sets: Array(e.sets).fill(false) };
    const row = el('div', 'exercise');
    const head = el('div', 'ex-head');
    head.append(el('b', '', e.name), el('span', 'q-sub', `${e.sets} × ${e.reps}`));
    row.append(head);
    const ctr = el('div', 'ex-ctrl');
    if (e.type !== 'core') {
      const inp = el('input');
      inp.type = 'number'; inp.step = '0.5'; inp.min = '0'; inp.inputMode = 'decimal';
      inp.placeholder = 'kg';
      inp.value = l.kg > 0 ? l.kg : '';
      inp.disabled = !!s.finished;
      inp.className = 'kg-input';
      inp.onchange = () => setLoad(e.id, parseFloat(inp.value), e.sets);
      ctr.append(inp);
    }
    const chips = el('div', 'set-chips');
    for (let i = 0; i < e.sets; i++) {
      const c = el('button', `set-chip${l.sets[i] ? ' on' : ''}`, l.sets[i] ? '✔' : String(i + 1));
      c.disabled = !!s.finished;
      c.setAttribute('aria-label', `Série ${i + 1}`);
      c.onclick = () => toggleSet(e.id, i, e.sets);
      chips.append(c);
    }
    ctr.append(chips);
    row.append(ctr);
    if (e.type !== 'core') row.append(el('div', 'ex-hint', suggestion(e, lastLogFor(e.id, t))));
    box.append(row);
  });

  const cr = el('div', 'exercise');
  const ch = el('div', 'ex-head');
  ch.append(el('b', '', 'Cardio final'), el('span', 'q-sub', w.cardio));
  const cb = el('button', `btn mini${s.cardio ? ' gold' : ''}`, s.cardio ? 'FEITO' : 'CONCLUIR');
  cb.disabled = !!s.finished;
  cb.onclick = () => { s.cardio = !s.cardio; save(); renderGym(); };
  cr.append(ch, cb);
  cr.classList.add('cardio-row');
  box.append(cr);

  if (!s.finished) {
    const fb = el('button', 'btn full gold', `FINALIZAR TREINO (+${GYM_XP.finish} XP)`);
    fb.onclick = finishSession;
    box.append(fb);
  } else {
    box.append(el('div', 'daily-reward claimed', `✔ Treino concluído em ${Math.round((s.finished - s.checkIn) / 60000)} min. Bom trabalho, Jogador.`));
  }
  if (lowImpact()) box.append(el('p', 'sys-text small', '⚠ Pelo seu perfil de saúde, o cardio foi ajustado para baixo impacto. Ajuste as cargas com cuidado e pare se sentir dor, tontura ou falta de ar.'));
}

function fillGymSetup() {
  const g = state.gym;
  const box = $('#gym-days');
  if (!box.children.length) {
    WEEKDAYS.forEach((d, i) => {
      const lab = el('label', 'day-pick');
      const cb = el('input');
      cb.type = 'checkbox'; cb.value = i;
      lab.append(cb, el('span', '', d));
      box.append(lab);
    });
    const sel = $('#gym-level');
    Object.entries(GYM_LEVELS).forEach(([k, v]) => { const o = el('option', '', v.label); o.value = k; sel.append(o); });
  }
  const days = g.setup ? g.setup.days : [0, 2, 4];
  box.querySelectorAll('input').forEach((cb) => { cb.checked = days.includes(+cb.value); });
  $('#gym-level').value = g.setup ? g.setup.level : 'iniciante';
  $('#gym-cancel').hidden = !g.setup;
}

function initGymEvents() {
  $('#gym-setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const days = [...document.querySelectorAll('#gym-days input:checked')].map((c) => +c.value);
    if (!days.length) { alert('Escolha pelo menos 1 dia de treino.'); return; }
    $('#gym-setup').dataset.editing = '0';
    saveGymSetup(days, $('#gym-level').value);
  });
  $('#gym-edit').onclick = () => { $('#gym-setup').dataset.editing = '1'; renderGym(); window.scrollTo(0, 0); };
  $('#gym-cancel').onclick = () => { $('#gym-setup').dataset.editing = '0'; renderGym(); };
}
