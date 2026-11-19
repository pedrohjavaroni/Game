'use strict';

/* =========================================================
   FIT GAME — Medidas corporais + gráfico de linha reutilizável
   Usa funções globais de app.js (state, save, render, gainXp...).
   ========================================================= */

// dir: +1 = aumentar é progresso, -1 = diminuir é progresso, 0 = neutro
const MEASURES = [
  { id: 'pescoco', n: 'Pescoço', dir: 0, tip: 'Logo abaixo do pomo de adão' },
  { id: 'ombros', n: 'Ombros', dir: 1, tip: 'Na parte mais larga, braços relaxados' },
  { id: 'peito', n: 'Peito', dir: 1, tip: 'Na linha dos mamilos, após expirar' },
  { id: 'braco_d', n: 'Braço direito', dir: 1, tip: 'Contraído, no ponto mais grosso' },
  { id: 'braco_e', n: 'Braço esquerdo', dir: 1, tip: 'Contraído, no ponto mais grosso' },
  { id: 'antebraco', n: 'Antebraço', dir: 1, tip: 'No ponto mais grosso' },
  { id: 'cintura', n: 'Cintura', dir: -1, tip: 'Na altura do umbigo, sem encolher a barriga' },
  { id: 'abdomen', n: 'Abdômen', dir: -1, tip: '2 dedos abaixo do umbigo' },
  { id: 'quadril', n: 'Quadril', dir: 0, tip: 'Na parte mais larga do glúteo' },
  { id: 'coxa_d', n: 'Coxa direita', dir: 1, tip: 'No meio da coxa' },
  { id: 'coxa_e', n: 'Coxa esquerda', dir: 1, tip: 'No meio da coxa' },
  { id: 'pant_d', n: 'Panturrilha direita', dir: 1, tip: 'No ponto mais grosso' },
  { id: 'pant_e', n: 'Panturrilha esquerda', dir: 1, tip: 'No ponto mais grosso' },
  { id: 'gordura', n: 'Gordura corporal', unit: '%', dir: -1, tip: 'Da bioimpedância ou adipômetro (opcional)' },
];

const XP_MEASURE = 20;
const MEASURE_XP_INTERVAL = 7; // dias

const mUnit = (m) => m.unit || 'cm';
const fmtM = (m, v) => `${fmtDec(v, 1)} ${mUnit(m)}`;

/* ---------- gráfico de linha (tema escuro do app) ---------- */

function svgLineChart(points, opts = {}) {
  if (!points || points.length < 2) {
    return `<p class="sys-text small">${points && points.length === 1 ? `Primeiro registro: ${fmtDec(points[0].v, 1)} ${opts.unit || ''}. Registre de novo para ver a linha de evolução.` : 'Sem registros ainda.'}</p>`;
  }
  const W = 640, H = 220, L = 42, R = 14, T = 14, B = 26;
  const vals = points.map((p) => p.v);
  if (opts.goal != null) vals.push(opts.goal);
  let min = Math.min(...vals), max = Math.max(...vals);
  const padV = Math.max(0.5, (max - min) * 0.15);
  min -= padV; max += padV;
  const t0 = parseKey(points[0].date).getTime();
  const t1 = parseKey(points[points.length - 1].date).getTime();
  const X = (k) => L + (t1 === t0 ? 0.5 : (parseKey(k).getTime() - t0) / (t1 - t0)) * (W - L - R);
  const Y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const dec = max - min < 6 ? 1 : 0;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="line-chart" xmlns="http://www.w3.org/2000/svg" font-family="Rajdhani, sans-serif" font-size="13">`;
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="rgba(76,195,255,.13)"/>`;
    s += `<text x="4" y="${(Y(v) + 4).toFixed(1)}" fill="#7d97b8">${v.toFixed(dec).replace('.', ',')}</text>`;
  }
  if (opts.goal != null) {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(opts.goal).toFixed(1)}" y2="${Y(opts.goal).toFixed(1)}" stroke="#3ef0a8" stroke-dasharray="6 5"/>`;
  }
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  s += `<path d="${d} L${X(points[points.length - 1].date).toFixed(1)},${H - B} L${L},${H - B} Z" fill="#4cc3ff" fill-opacity="0.08"/>`;
  s += `<path d="${d}" fill="none" stroke="#4cc3ff" stroke-width="2.5" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #4cc3ff)"/>`;
  points.forEach((p) => { s += `<circle cx="${X(p.date).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.5" fill="#fff"/>`; });
  const lb = (k) => { const [, m, dd] = k.split('-'); return `${dd}/${m}`; };
  s += `<text x="${L}" y="${H - 6}" fill="#7d97b8">${lb(points[0].date)}</text>`;
  s += `<text x="${W - R}" y="${H - 6}" fill="#7d97b8" text-anchor="end">${lb(points[points.length - 1].date)}</text>`;
  return `${s}</svg>`;
}

/* ---------- dados ---------- */

function measureSeries(id) {
  return (state.measures || []).filter((e) => e.v[id] > 0).map((e) => ({ date: e.date, v: e.v[id] }));
}

// primeira e última medida de cada item (opcionalmente dentro de um intervalo)
function measureSummary(range) {
  return MEASURES.map((m) => {
    let pts = measureSeries(m.id);
    if (range) {
      const before = pts.filter((p) => p.date < range.start).pop();
      pts = pts.filter((p) => p.date >= range.start && p.date <= range.end);
      if (before) pts.unshift(before);
    }
    if (!pts.length) return null;
    const first = pts[0], last = pts[pts.length - 1];
    return { m, first, last, diff: last.v - first.v, n: pts.length };
  }).filter(Boolean);
}

function measureClass(m, diff) {
  if (!m.dir || Math.abs(diff) < 0.05) return '';
  return diff * m.dir > 0 ? 'good' : 'bad';
}

function saveMeasures(date, values) {
  state.measures = state.measures || [];
  const ex = state.measures.find((e) => e.date === date);
  if (ex) Object.assign(ex.v, values); else state.measures.push({ date, v: values });
  state.measures.sort((a, b) => (a.date < b.date ? -1 : 1));

  // a cintura também alimenta o plano de saúde
  const lastWaist = state.measures.filter((e) => e.v.cintura).pop();
  if (lastWaist) state.profile.waist = lastWaist.v.cintura;

  const last = state.lastMeasureXp;
  if (!last || (parseKey(dateKey()) - parseKey(last)) / 86400000 >= MEASURE_XP_INTERVAL) {
    state.lastMeasureXp = dateKey();
    gainXp(XP_MEASURE, `Medidas registradas (${Object.keys(values).length} itens).`);
  } else {
    toast('SISTEMA', 'Medidas salvas. (XP de medidas: 1× por semana)');
  }
  checkAchievements();
  save();
  render();
}

function measureAchievementConds() {
  const ms = state.measures || [];
  const s = measureSummary();
  const get = (id) => s.find((x) => x.m.id === id);
  const arm = Math.max(...['braco_d', 'braco_e'].map((id) => (get(id) ? get(id).diff : 0)));
  const waist = get('cintura');
  return {
    measure1: ms.length >= 1,
    measure5: ms.length >= 5,
    arm1: arm >= 1,
    waist5: !!(waist && waist.diff <= -5),
  };
}

/* ---------- interface ---------- */

let measureSel = 'cintura';

function renderMeasures() {
  if (!state.profile) return;
  const form = $('#measure-inputs');
  if (!form.children.length) {
    MEASURES.forEach((m) => {
      const lab = el('label', 'measure-field');
      const top = el('span', '', `${m.n} (${mUnit(m)})`);
      const inp = el('input');
      inp.type = 'number'; inp.step = '0.1'; inp.min = '1'; inp.max = m.unit === '%' ? '70' : '250'; inp.inputMode = 'decimal';
      inp.dataset.id = m.id;
      inp.title = m.tip;
      lab.append(top, inp, el('small', 'hint', m.tip));
      form.append(lab);
    });
  }
  const sum = measureSummary();
  form.querySelectorAll('input').forEach((inp) => {
    const s = sum.find((x) => x.m.id === inp.dataset.id);
    inp.placeholder = s ? `último: ${fmtDec(s.last.v, 1)}` : '—';
  });
  if (!$('#measure-date').value) $('#measure-date').value = dateKey();
  $('#measure-date').max = dateKey();

  // tabela de evolução
  const tb = $('#measure-table');
  tb.innerHTML = '';
  if (!sum.length) {
    tb.append(el('p', 'sys-text small', 'Nenhuma medida registrada ainda. Preencha as medidas acima: não precisa preencher todas.'));
  } else {
    const t = el('table', 'm-table');
    const hr = el('tr');
    ['Medida', 'Início', 'Atual', 'Variação'].forEach((x) => hr.append(el('th', '', x)));
    t.append(hr);
    sum.forEach(({ m, first, last, diff, n }) => {
      const tr = el('tr');
      tr.append(el('td', '', m.n), el('td', 'num', fmtDec(first.v, 1)), el('td', 'num', fmtDec(last.v, 1)));
      const td = el('td', `num ${measureClass(m, diff)}`, n > 1 ? `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fmtDec(Math.abs(diff), 1)} ${mUnit(m)}` : '—');
      tr.append(td);
      tr.onclick = () => { measureSel = m.id; renderMeasures(); };
      t.append(tr);
    });
    tb.append(t);
  }

  // gráfico
  const withData = sum.map((x) => x.m.id);
  const pick = $('#measure-pick');
  pick.innerHTML = '';
  $('#measure-chart-wrap').hidden = !withData.length;
  if (withData.length) {
    if (!withData.includes(measureSel)) measureSel = withData[0];
    withData.forEach((id) => { const o = el('option', '', MEASURES.find((m) => m.id === id).n); o.value = id; pick.append(o); });
    pick.value = measureSel;
    const m = MEASURES.find((x) => x.id === measureSel);
    $('#measure-chart').innerHTML = svgLineChart(measureSeries(measureSel), { unit: mUnit(m) });
  }

  // histórico
  const hist = $('#measure-history');
  hist.innerHTML = '';
  (state.measures || []).slice().reverse().forEach((e) => {
    const li = el('li');
    li.append(el('span', '', `${fmtShortDate(e.date)} · ${Object.keys(e.v).length} medidas`));
    const right = el('span');
    const del = el('button', 'del', '✕');
    del.setAttribute('aria-label', 'Apagar registro de medidas');
    del.onclick = () => {
      if (!confirm('Apagar este registro de medidas?')) return;
      state.measures = state.measures.filter((x) => x !== e);
      save(); render();
    };
    right.append(del);
    li.append(right);
    hist.append(li);
  });
}

function initMeasures() {
  $('#measure-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const values = {};
    document.querySelectorAll('#measure-inputs input').forEach((inp) => {
      const v = parseFloat(inp.value);
      if (v > 0) values[inp.dataset.id] = Math.round(v * 10) / 10;
    });
    if (!Object.keys(values).length) { alert('Preencha pelo menos uma medida.'); return; }
    saveMeasures($('#measure-date').value || dateKey(), values);
    document.querySelectorAll('#measure-inputs input').forEach((inp) => { inp.value = ''; });
  });
  $('#measure-pick').onchange = () => { measureSel = $('#measure-pick').value; renderMeasures(); };
}
