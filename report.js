'use strict';

/* =========================================================
   FIT GAME — Relatório de Evolução
   Gera um relatório (tela + PDF via impressão + arquivo HTML)
   e uma planilha CSV com os dados brutos.
   Usa funções globais de app.js, health.js e gym.js.
   ========================================================= */

const REPORT_CSS = `
.rep { background:#fff; color:#14213d; font-family:'Rajdhani',system-ui,sans-serif; font-size:15px; line-height:1.35; padding:22px 20px; max-width:760px; margin:0 auto; }
.rep h1 { font-family:'Orbitron',sans-serif; font-size:20px; letter-spacing:2px; margin:0; color:#0b3d91; }
.rep h2 { font-family:'Orbitron',sans-serif; font-size:13px; letter-spacing:2px; color:#0b3d91; border-bottom:2px solid #2fa8ff; padding-bottom:4px; margin:22px 0 10px; }
.rep .r-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; border-bottom:3px solid #0b3d91; padding-bottom:10px; }
.rep .r-head img { width:46px; height:46px; }
.rep .r-sub { color:#5a6b85; font-size:14px; }
.rep .r-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.rep .r-card { border:1px solid #cfdcf0; border-radius:6px; padding:8px 10px; background:#f6f9ff; }
.rep .r-card span { display:block; font-size:11px; letter-spacing:1px; color:#5a6b85; text-transform:uppercase; }
.rep .r-card b { font-family:'Orbitron',sans-serif; font-size:16px; color:#14213d; }
.rep .r-card small { display:block; color:#5a6b85; font-size:12px; }
.rep .good { color:#0a8f5c !important; } .rep .bad { color:#c62d48 !important; }
.rep table { width:100%; border-collapse:collapse; font-size:14px; }
.rep th, .rep td { text-align:left; padding:5px 6px; border-bottom:1px solid #e1e8f3; }
.rep th { font-size:11px; letter-spacing:1px; color:#5a6b85; text-transform:uppercase; }
.rep td.num, .rep th.num { text-align:right; white-space:nowrap; }
.rep .r-scroll { overflow-x:auto; }
.rep .r-bar { height:8px; background:#e6edf8; border-radius:4px; overflow:hidden; margin-top:4px; }
.rep .r-bar i { display:block; height:100%; background:linear-gradient(90deg,#1b6dff,#2fa8ff); }
.rep svg { width:100%; height:auto; display:block; }
.rep .r-tags { display:flex; flex-wrap:wrap; gap:6px; }
.rep .r-tags span { border:1px solid #b9cbe8; border-radius:12px; padding:2px 9px; font-size:13px; background:#f6f9ff; }
.rep .r-foot { margin-top:22px; font-size:12px; color:#5a6b85; border-top:1px solid #cfdcf0; padding-top:8px; }
.rep .empty { color:#5a6b85; font-style:italic; }
@media (max-width:480px) { .rep .r-grid { grid-template-columns:repeat(2,1fr); } .rep { padding:16px 12px; } }
@media print { .rep { padding:0; max-width:none; } .rep h2 { break-after:avoid; } .rep table, .rep .r-grid, .rep svg { break-inside:avoid; } }
`;

let reportPeriod = 'all';

function periodRange(period) {
  const end = dateKey();
  const start0 = state.profile.startDate;
  if (period === 'all') return { start: start0, end };
  const s = addDays(end, -(parseInt(period, 10) - 1));
  return { start: s < start0 ? start0 : s, end };
}

const inRange = (k, r) => k >= r.start && k <= r.end;
const fmtDate = (k) => { const [y, m, d] = k.split('-'); return `${d}/${m}/${y}`; };
const fmtShort = (k) => { const [, m, d] = k.split('-'); return `${d}/${m}`; };
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000) + 1;
const signKg = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtDec(Math.abs(n))} kg`;

function weightSeries() {
  const p = state.profile;
  const pts = [{ date: p.startDate, kg: p.startWeight }, ...state.weights.filter((w) => w.date !== p.startDate)];
  return pts.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function weightAt(k) {
  // último peso registrado até a data k
  let v = null;
  for (const w of weightSeries()) { if (w.date <= k) v = w.kg; else break; }
  return v;
}

function collectReport(period) {
  const p = state.profile;
  const r = periodRange(period);
  const nDays = daysBetween(r.start, r.end);
  const series = weightSeries();
  const wIn = series.filter((w) => inRange(w.date, r));
  const wStart = weightAt(r.start) ?? p.startWeight;
  const wEnd = currentWeight();
  const hM = p.height / 100;

  // missões diárias
  let completed = 0, best = 0, run = 0;
  for (let k = r.start; k <= r.end; k = addDays(k, 1)) {
    const d = state.days[k];
    if (d && d.completed) { completed += 1; run += 1; best = Math.max(best, run); } else if (k !== r.end) run = 0;
  }

  // academia
  const g = state.gym || { sessions: {}, setup: null, perfectWeeks: {} };
  const sess = Object.entries(g.sessions).filter(([k, s]) => inRange(k, r) && s.checkIn).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const expected = g.setup ? Math.round((g.setup.days.length * nDays) / 7) : 0;
  const finishedS = sess.filter(([, s]) => s.finished);
  const avgMin = finishedS.length ? Math.round(finishedS.reduce((a, [, s]) => a + (s.finished - s.checkIn) / 60000, 0) / finishedS.length) : 0;
  const perfect = Object.keys(g.perfectWeeks || {}).filter((k) => inRange(k, r)).length;

  // evolução de cargas: primeira carga no período × maior carga no período
  const loads = {};
  sess.forEach(([k, s]) => Object.entries(s.log || {}).forEach(([id, l]) => {
    if (!(l.kg > 0) || !EXERCISES[id]) return;
    if (!loads[id]) loads[id] = { first: l.kg, firstDate: k, max: l.kg, count: 0 };
    loads[id].max = Math.max(loads[id].max, l.kg);
    loads[id].count += 1;
  }));

  // médias semanais de peso
  const weeks = {};
  wIn.forEach((w) => { const ws = weekStart(w.date); (weeks[ws] = weeks[ws] || []).push(w.kg); });
  const weekly = Object.keys(weeks).sort().map((ws) => ({ ws, avg: weeks[ws].reduce((a, b) => a + b, 0) / weeks[ws].length, n: weeks[ws].length }));

  const ach = ACHIEVEMENTS.filter((a) => state.achievements[a.id] && inRange(state.achievements[a.id], r));

  return {
    r, nDays, p, series, wIn, wStart, wEnd,
    delta: wEnd - wStart,
    totalLost: p.startWeight - wEnd,
    goalProgress: clamp((p.startWeight - wEnd) / Math.max(0.1, p.startWeight - p.goalWeight), 0, 1),
    bmiStart: wStart / (hM * hM), bmiEnd: wEnd / (hM * hM),
    weeklyRate: nDays >= 7 ? ((wStart - wEnd) / nDays) * 7 : null,
    completed, best,
    sess, expected, finished: finishedS.length, avgMin, perfect, loads,
    weekly, ach, plan: getPlan(),
  };
}

function weightChartSvg(data) {
  const pts = data.series.filter((w) => inRange(w.date, data.r));
  const before = data.series.filter((w) => w.date < data.r.start).pop();
  if (before) pts.unshift({ date: data.r.start, kg: before.kg });
  if (pts.length < 2) return '<p class="empty">Registre o peso em pelo menos 2 dias para ver o gráfico.</p>';
  const W = 700, H = 230, L = 44, R = 12, T = 14, B = 28;
  const goal = data.p.goalWeight;
  const vals = pts.map((x) => x.kg).concat([goal]);
  const min = Math.floor(Math.min(...vals) - 1), max = Math.ceil(Math.max(...vals) + 1);
  const t0 = parseKey(pts[0].date).getTime(), t1 = parseKey(pts[pts.length - 1].date).getTime() || t0 + 1;
  const X = (k) => L + ((parseKey(k).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const Y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Rajdhani, sans-serif" font-size="12">`;
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e1e8f3"/><text x="6" y="${Y(v) + 4}" fill="#5a6b85">${v.toFixed(0)}</text>`;
  }
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#0a8f5c" stroke-dasharray="6 5" stroke-width="1.5"/>`;
  s += `<text x="${W - R - 4}" y="${Y(goal) - 5}" fill="#0a8f5c" text-anchor="end">META ${fmtDec(goal)} kg</text>`;
  const path = pts.map((x, i) => `${i ? 'L' : 'M'}${X(x.date).toFixed(1)},${Y(x.kg).toFixed(1)}`).join(' ');
  s += `<path d="${path} L${X(pts[pts.length - 1].date).toFixed(1)},${H - B} L${L},${H - B} Z" fill="#2fa8ff" fill-opacity="0.10"/>`;
  s += `<path d="${path}" fill="none" stroke="#1b6dff" stroke-width="2.5" stroke-linejoin="round"/>`;
  pts.forEach((x) => { s += `<circle cx="${X(x.date).toFixed(1)}" cy="${Y(x.kg).toFixed(1)}" r="3" fill="#1b6dff"/>`; });
  s += `<text x="${L}" y="${H - 8}" fill="#5a6b85">${fmtShort(pts[0].date)}</text>`;
  s += `<text x="${W - R}" y="${H - 8}" fill="#5a6b85" text-anchor="end">${fmtShort(pts[pts.length - 1].date)}</text>`;
  return s + '</svg>';
}

function esc(s) { return escapeHtml(String(s)); }

function card(label, value, note, cls = '') {
  return `<div class="r-card"><span>${label}</span><b class="${cls}">${value}</b>${note ? `<small>${note}</small>` : ''}</div>`;
}

function reportHtml(period) {
  const d = collectReport(period);
  const p = d.p;
  const periodLabel = { 30: 'Últimos 30 dias', 90: 'Últimos 90 dias', all: 'Desde o início' }[period];
  const iconUrl = new URL('fitgame-icon.svg', location.href).href;
  let h = `<div class="rep">`;
  h += `<div class="r-head"><div><h1>RELATÓRIO DE EVOLUÇÃO</h1>
    <div class="r-sub">Jogador: <b>${esc(p.name)}</b> · ${periodLabel}: ${fmtDate(d.r.start)} a ${fmtDate(d.r.end)} (${d.nDays} dias)</div>
    <div class="r-sub">Nível ${state.level} · Rank ${rankFor(state.level)} · ${classFor(state.level)} · ${fmtInt(state.totalXp)} XP no total</div></div>
    <img src="${iconUrl}" alt=""></div>`;

  // Corpo
  h += `<h2>CORPO</h2><div class="r-grid">`;
  h += card('Peso no início do período', fmtKg(d.wStart));
  h += card('Peso atual', fmtKg(d.wEnd));
  h += card('Variação no período', signKg(d.wEnd - d.wStart), '', d.delta < 0 ? 'good' : d.delta > 0 ? 'bad' : '');
  h += card('IMC', `${fmtDec(d.bmiStart)} → ${fmtDec(d.bmiEnd)}`, bmiCategory(d.bmiEnd).label);
  h += card('Ritmo médio', d.weeklyRate != null ? `${fmtDec(d.weeklyRate, 2)} kg/sem` : '—', 'perda por semana');
  h += card('Meta', fmtKg(p.goalWeight), `${Math.round(d.goalProgress * 100)}% do caminho · total perdido ${fmtKg(Math.max(0, d.totalLost))}`);
  if (p.waist) h += card('Cintura (último registro)', `${fmtDec(p.waist, 0)} cm`, waistRisk(p.sex, p.waist).label);
  h += `</div><div class="r-bar" style="margin-top:10px"><i style="width:${d.goalProgress * 100}%"></i></div>`;
  h += `<h2>GRÁFICO DE PESO</h2>${weightChartSvg(d)}`;

  if (d.weekly.length) {
    h += `<h2>MÉDIA SEMANAL DE PESO</h2><table><tr><th>Semana de</th><th class="num">Pesagens</th><th class="num">Média</th><th class="num">Variação</th></tr>`;
    d.weekly.forEach((w, i) => {
      const prev = d.weekly[i - 1];
      const diff = prev ? w.avg - prev.avg : null;
      h += `<tr><td>${fmtDate(w.ws)}</td><td class="num">${w.n}</td><td class="num">${fmtKg(w.avg)}</td><td class="num ${diff == null ? '' : diff < 0 ? 'good' : diff > 0 ? 'bad' : ''}">${diff == null ? '—' : signKg(diff)}</td></tr>`;
    });
    h += `</table>`;
  }

  // Hábitos
  h += `<h2>MISSÕES E HÁBITOS</h2><div class="r-grid">`;
  h += card('Missões diárias completas', `${d.completed} / ${d.nDays}`, `${Math.round((d.completed / d.nDays) * 100)}% dos dias`);
  h += card('Melhor sequência', `${d.best} dias`, `recorde geral: ${state.bestStreak} dias`);
  h += card('Sequência atual', `${state.streak} dias`);
  h += `</div>`;

  // Academia
  h += `<h2>ACADEMIA</h2>`;
  if (!state.gym || !state.gym.setup) {
    h += `<p class="empty">Plano de academia não configurado.</p>`;
  } else {
    const freq = d.expected ? Math.round((d.sess.length / d.expected) * 100) : 0;
    h += `<div class="r-grid">`;
    h += card('Presenças', `${d.sess.length} / ${d.expected}`, `${freq}% da meta (${state.gym.setup.days.length}×/semana)`, freq >= 80 ? 'good' : '');
    h += card('Treinos finalizados', String(d.finished), d.avgMin ? `duração média ${d.avgMin} min` : '');
    h += card('Semanas perfeitas', String(d.perfect));
    h += `</div>`;
    const ids = Object.keys(d.loads);
    if (ids.length) {
      h += `<h2>EVOLUÇÃO DE CARGAS</h2><table><tr><th>Exercício</th><th class="num">Inicial</th><th class="num">Maior</th><th class="num">Ganho</th></tr>`;
      ids.sort((a, b) => (d.loads[b].max - d.loads[b].first) - (d.loads[a].max - d.loads[a].first)).forEach((id) => {
        const l = d.loads[id];
        const gain = l.max - l.first;
        const pct = l.first > 0 ? Math.round((gain / l.first) * 100) : 0;
        h += `<tr><td>${esc(EXERCISES[id].n)}</td><td class="num">${fmtNum(l.first, true)} kg</td><td class="num">${fmtNum(l.max, true)} kg</td><td class="num ${gain > 0 ? 'good' : ''}">${gain > 0 ? `+${fmtNum(gain, true)} kg (${pct}%)` : '—'}</td></tr>`;
      });
      h += `</table>`;
    }
    if (d.sess.length) {
      const workouts = buildWorkouts();
      h += `<h2>TREINOS REALIZADOS</h2><table><tr><th>Data</th><th>Treino</th><th class="num">Séries</th><th class="num">Duração</th></tr>`;
      d.sess.slice().reverse().slice(0, 40).forEach(([k, s]) => {
        const w = workouts[s.workout] || workouts[0];
        const total = w.ex.reduce((a, e) => a + e.sets, 0);
        const done = w.ex.reduce((a, e) => a + ((s.log[e.id] && s.log[e.id].sets.filter(Boolean).length) || 0), 0);
        h += `<tr><td>${fmtDate(k)}</td><td>${w.letter} — ${esc(w.name)}</td><td class="num">${done}/${total}</td><td class="num">${s.finished ? `${Math.round((s.finished - s.checkIn) / 60000)} min` : '—'}</td></tr>`;
      });
      h += `</table>`;
    }
  }

  // Conquistas
  h += `<h2>CONQUISTAS NO PERÍODO</h2>`;
  h += d.ach.length ? `<div class="r-tags">${d.ach.map((a) => `<span>「${esc(a.title)}」 ${fmtShort(state.achievements[a.id])}</span>`).join('')}</div>` : '<p class="empty">Nenhuma conquista nova no período.</p>';

  // Plano atual
  if (d.plan) {
    h += `<h2>PLANO ATUAL</h2><div class="r-grid">`;
    h += card('Calorias', `${fmtInt(d.plan.kcal)} kcal`, `gasto estimado ${fmtInt(d.plan.tdee)} kcal`);
    h += card('Proteína', `${d.plan.protein} g`);
    h += card('Água', fmtL(d.plan.waterMl));
    h += `</div>`;
  }

  h += `<div class="r-foot">Gerado pelo Fit Game em ${new Date().toLocaleString('pt-BR')}. Os valores são estimativas e não substituem a avaliação de médico, nutricionista ou educador físico. Leve este relatório às suas consultas para acompanhar a evolução.</div>`;
  return h + '</div>';
}

function openReport(period = reportPeriod) {
  reportPeriod = period;
  $('#report-body').innerHTML = reportHtml(period);
  document.querySelectorAll('#report-period button').forEach((b) => b.classList.toggle('active', b.dataset.p === String(period)));
  $('#report-view').hidden = false;
  document.body.classList.add('report-open');
  $('#report-view').scrollTop = 0;
}

function closeReport() {
  $('#report-view').hidden = true;
  document.body.classList.remove('report-open');
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function downloadReportHtml() {
  const body = reportHtml(reportPeriod);
  const doc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório Fit Game — ${esc(state.profile.name)} — ${dateKey()}</title>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@600;800&display=swap" rel="stylesheet">
<style>body{margin:0;background:#eef3fb}${REPORT_CSS}</style></head><body>${body}</body></html>`;
  downloadFile(`fitgame-relatorio-${dateKey()}.html`, doc, 'text/html');
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv() {
  const r = periodRange(reportPeriod);
  const workouts = state.gym && state.gym.setup ? buildWorkouts() : [];
  const wByDate = Object.fromEntries(weightSeries().map((w) => [w.date, w.kg]));
  const rows = [['data', 'peso_kg', 'missao_diaria_completa', 'missoes_feitas', 'missoes_total', 'academia_presenca', 'treino', 'series_feitas', 'duracao_min']];
  for (let k = r.start; k <= r.end; k = addDays(k, 1)) {
    const d = state.days[k];
    const aq = d ? activeQuests(d) : [];
    const done = d ? aq.filter((q) => (d.progress[q.id] || 0) >= d.targets[q.id]).length : '';
    const s = state.gym && state.gym.sessions[k];
    let treino = '', series = '', dur = '';
    if (s && s.checkIn && workouts.length) {
      const w = workouts[s.workout] || workouts[0];
      treino = `${w.letter} - ${w.name}`;
      series = w.ex.reduce((a, e) => a + ((s.log[e.id] && s.log[e.id].sets.filter(Boolean).length) || 0), 0);
      dur = s.finished ? Math.round((s.finished - s.checkIn) / 60000) : '';
    }
    rows.push([k, wByDate[k] != null ? String(wByDate[k]).replace('.', ',') : '', d ? (d.completed ? 'sim' : 'nao') : '', done, d ? aq.length : '', s && s.checkIn ? 'sim' : 'nao', treino, series, dur]);
  }
  // ; como separador abre direto no Excel/Sheets em português
  const csv = '﻿' + rows.map((r2) => r2.map(csvCell).join(';')).join('\n');
  downloadFile(`fitgame-dados-${dateKey()}.csv`, csv, 'text/csv;charset=utf-8');
}

async function shareReportSummary() {
  const d = collectReport(reportPeriod);
  const text = `Fit Game — minha evolução (${fmtDate(d.r.start)} a ${fmtDate(d.r.end)})\n`
    + `Peso: ${fmtKg(d.wStart)} → ${fmtKg(d.wEnd)} (${signKg(d.wEnd - d.wStart)})\n`
    + `Meta: ${Math.round(d.goalProgress * 100)}% do caminho\n`
    + `Missões diárias: ${d.completed}/${d.nDays} dias\n`
    + (state.gym && state.gym.setup ? `Academia: ${d.sess.length} treinos\n` : '')
    + `Nível ${state.level} · Rank ${rankFor(state.level)}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Minha evolução no Fit Game', text }); } catch (e) { /* cancelado */ }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    toast('SISTEMA', 'Resumo copiado. Cole onde quiser.');
  }
}

function initReport() {
  const st = document.createElement('style');
  st.textContent = REPORT_CSS;
  document.head.append(st);
  document.querySelectorAll('.open-report').forEach((b) => { b.onclick = () => openReport(); });
  document.querySelectorAll('#report-period button').forEach((b) => { b.onclick = () => openReport(b.dataset.p); });
  $('#report-close').onclick = closeReport;
  $('#report-print').onclick = () => window.print();
  $('#report-html').onclick = downloadReportHtml;
  $('#report-csv').onclick = downloadCsv;
  $('#report-share').onclick = shareReportSummary;
}
