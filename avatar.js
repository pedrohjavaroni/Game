'use strict';

/* =========================================================
   FIT GAME — Personagem que evolui com o rank + cenas animadas
   Personagens originais desenhados em SVG (silhueta estilo anime
   com contorno luminoso). Cada rank adiciona equipamento e aura.
   ========================================================= */

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];
const RANK_INFO = {
  E: { color: '#8fb0d8', glow: '#5d7fae', lvl: 1, form: 'Despertado', gear: 'Roupa de treino' },
  D: { color: '#4cc3ff', glow: '#1b6dff', lvl: 10, form: 'Caçador', gear: 'Cachecol de batalha' },
  C: { color: '#3ef0c8', glow: '#0fae8c', lvl: 20, form: 'Guardião', gear: 'Ombreiras + círculo mágico' },
  B: { color: '#a77bff', glow: '#6a3dff', lvl: 30, form: 'Cavaleiro Arcano', gear: 'Sobretudo de combate' },
  A: { color: '#ff4d7a', glow: '#c2185b', lvl: 45, form: 'Lâmina Carmesim', gear: 'Espada lendária' },
  S: { color: '#ffd166', glow: '#b8860b', lvl: 60, form: 'Soberano', gear: 'Coroa de luz + sombras' },
};

const AVATARS = {
  cacador: { label: 'Caçador' },
  cacadora: { label: 'Caçadora' },
};

let avatarSeq = 0;

function avatarStyle() {
  const p = state.profile || {};
  return p.avatar || (p.sex === 'F' ? 'cacadora' : 'cacador');
}

// rank -> nível de equipamento (0..5)
const tierOf = (rank) => RANK_ORDER.indexOf(rank);

function avatarSvg(rank, style, opts = {}) {
  const id = `av${++avatarSeq}`;
  const t = tierOf(rank);
  const locked = !!opts.locked;
  const c = locked ? '#2a3a5c' : RANK_INFO[rank].color;
  const g = locked ? '#1a2440' : RANK_INFO[rank].glow;
  const fem = style === 'cacadora';
  const body = locked ? '#060a16' : '#0b1226';
  const glow = locked ? '' : `filter="url(#${id}-glow)"`;
  const anim = opts.still || locked ? '' : ' av-anim';
  let s = `<svg viewBox="0 0 200 260" class="avatar${anim}${locked ? ' locked' : ''}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-aura" cx="50%" cy="60%" r="55%">
      <stop offset="0" stop-color="${c}" stop-opacity="${0.25 + t * 0.09}"/>
      <stop offset="0.6" stop-color="${g}" stop-opacity="${0.12 + t * 0.06}"/>
      <stop offset="1" stop-color="${g}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-blade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${c}"/>
    </linearGradient>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`;

  // aura em chamas (cresce a cada rank)
  if (!locked && t >= 1) {
    const w = 38 + t * 8, top = 34 - t * 5;
    s += `<g class="av-aura"><path filter="url(#${id}-blur)" fill="url(#${id}-aura)" d="M100,${top} Q${100 - w * 0.5},${top + 50} ${100 - w},${150} Q${100 - w - 4},${238} 100,${248} Q${100 + w + 4},${238} ${100 + w},${150} Q${100 + w * 0.5},${top + 50} 100,${top} Z"/>
    <path class="av-aura2" fill="${c}" opacity="${0.05 + t * 0.025}" d="M100,${top + 12} L${88 - t * 2},${top + 44} L${80 - t * 3},${top + 30} L${72 - t * 4},${top + 78} L${62 - t * 4},${top + 62} L${58 - t * 4},150 Q60,240 100,246 Q140,240 ${142 + t * 4},150 L${138 + t * 4},${top + 62} L${128 + t * 4},${top + 78} L${120 + t * 3},${top + 30} L${112 + t * 2},${top + 44} Z"/></g>`;
  }

  // círculo mágico no chão (C+)
  if (!locked && t >= 2) {
    s += `<g class="av-circle" opacity="0.85" ${glow}>
      <ellipse cx="100" cy="240" rx="${54 + t * 4}" ry="11" fill="none" stroke="${c}" stroke-width="1.6"/>
      <ellipse class="av-circle-dash" cx="100" cy="240" rx="${44 + t * 4}" ry="8" fill="none" stroke="${c}" stroke-width="1.2" stroke-dasharray="6 5"/>
    </g>`;
  } else {
    s += `<ellipse cx="100" cy="240" rx="46" ry="7" fill="${c}" opacity="${locked ? 0.08 : 0.18}"/>`;
  }

  s += `<g class="av-body">`;

  // sombras serpenteando (S)
  if (!locked && t >= 5) {
    s += `<g class="av-wisps" fill="none" stroke="#7b4dff" stroke-width="3" stroke-linecap="round" opacity="0.8" ${glow}>
      <path d="M62,200 Q34,170 46,130 Q56,104 40,80"/><path d="M138,200 Q166,170 154,130 Q144,104 160,80"/>
      <path d="M70,232 Q40,224 30,196" stroke-width="2"/><path d="M130,232 Q160,224 170,196" stroke-width="2"/>
    </g>`;
  }

  // espada nas costas (A+)
  if (!locked && t >= 4) {
    s += `<g ${glow}><line x1="146" y1="28" x2="62" y2="214" stroke="url(#${id}-blade)" stroke-width="6" stroke-linecap="round"/>
      <line x1="138" y1="44" x2="156" y2="52" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
      <line x1="146" y1="28" x2="152" y2="15" stroke="${c}" stroke-width="5" stroke-linecap="round"/></g>`;
  }

  // sobretudo (B+)
  if (t >= 3) {
    s += `<path class="av-coat" d="M${fem ? 70 : 64},90 L56,234 L86,226 L100,172 L114,226 L144,234 L${fem ? 130 : 136},90 Z" fill="#070b18" stroke="${c}" stroke-width="1.4" ${glow}/>`;
  }

  // cabelo longo atrás (caçadora)
  if (fem) {
    s += `<path d="M79,50 Q72,92 82,126 L100,116 L118,126 Q128,92 121,50 Z" fill="${body}" stroke="${c}" stroke-width="1.4" ${glow}/>`;
  }

  // corpo
  const torso = fem ? 'M74,92 Q100,84 126,92 L120,148 Q100,154 80,148 Z' : 'M67,90 Q100,80 133,90 L126,150 Q100,156 74,150 Z';
  const armL = fem ? 'M74,93 Q66,98 64,122 L62,158 Q66,164 71,158 L75,124 L80,106 Z' : 'M67,92 Q59,96 57,120 L55,160 Q59,166 65,160 L69,124 L75,104 Z';
  const armR = fem ? 'M126,93 Q134,98 136,122 L138,158 Q134,164 129,158 L125,124 L120,106 Z' : 'M133,92 Q141,96 143,120 L145,160 Q141,166 135,160 L131,124 L125,104 Z';
  s += `<g fill="${body}" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" ${glow}>
    <path d="M${fem ? 80 : 76},146 L${fem ? 76 : 72},234 L${fem ? 92 : 90},234 L98,158 Z"/>
    <path d="M${fem ? 120 : 124},146 L${fem ? 124 : 128},234 L${fem ? 108 : 110},234 L102,158 Z"/>
    <path d="${torso}"/>
    <path d="${armL}"/><path d="${armR}"/>
    <circle cx="${fem ? 66 : 60}" cy="${fem ? 160 : 162}" r="${fem ? 5 : 6}"/><circle cx="${fem ? 134 : 140}" cy="${fem ? 160 : 162}" r="${fem ? 5 : 6}"/>
    <rect x="95" y="74" width="10" height="12" rx="3"/>
    <ellipse cx="100" cy="58" rx="${fem ? 16 : 17}" ry="${fem ? 19 : 20}"/>
  </g>`;

  // detalhes da roupa: zíper / cinto
  if (!locked) s += `<g stroke="${c}" stroke-width="1" opacity="0.6"><line x1="100" y1="92" x2="100" y2="148"/><line x1="${fem ? 81 : 75}" y1="140" x2="${fem ? 119 : 125}" y2="140"/></g>`;

  // ombreiras (C+)
  if (t >= 2) {
    const o = fem ? 6 : 0;
    s += `<g fill="${c}" fill-opacity="0.3" stroke="${c}" stroke-width="1.4" ${glow}>
      <path d="M${62 + o},86 L${82 + o},83 L${80 + o},98 L${60 + o},101 Z"/><path d="M${138 - o},86 L${118 - o},83 L${120 - o},98 L${140 - o},101 Z"/></g>`;
  }

  // cachecol esvoaçante (D+)
  if (t >= 1) {
    s += `<g fill="${locked ? body : g}" stroke="${c}" stroke-width="1.3" ${glow}>
      <path d="M88,80 Q100,90 112,80 L114,88 Q100,97 86,88 Z"/>
      <path class="av-scarf" d="M110,86 Q132,96 158,86 Q148,96 156,104 Q130,104 112,94 Z"/></g>`;
  }

  // cabelo da frente
  const hair = fem
    ? 'M82,58 Q82,36 100,35 Q119,35 119,58 L114,46 L109,58 L103,45 L97,58 L91,46 Z'
    : 'M80,58 L77,34 L87,42 L89,24 L98,37 L103,19 L109,36 L117,26 L118,42 L126,36 L120,58 L114,48 L110,60 L104,48 L100,61 L95,48 L90,60 L85,49 Z';
  s += `<path d="${hair}" fill="${body}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" ${glow}/>`;

  // olhos brilhantes
  if (!locked) {
    const eye = t >= 5 ? '#ffd166' : t >= 3 ? c : '#d8f3ff';
    s += `<g class="av-eyes" fill="${eye}" filter="url(#${id}-glow)">
      <path d="M89,61 L97,62.5 L96,65 L90,64 Z"/><path d="M111,61 L103,62.5 L104,65 L110,64 Z"/></g>`;
  } else {
    s += `<text x="100" y="70" text-anchor="middle" font-family="Orbitron, sans-serif" font-size="22" fill="#2a3a5c">?</text>`;
  }

  // coroa de luz (S)
  if (!locked && t >= 5) {
    s += `<g class="av-halo" ${glow}><ellipse cx="100" cy="24" rx="20" ry="5" fill="none" stroke="${c}" stroke-width="2.5"/>
      <path d="M86,22 L90,12 L95,20 L100,8 L105,20 L110,12 L114,22" fill="none" stroke="${c}" stroke-width="2"/></g>`;
  }

  s += `</g>`;

  // partículas subindo
  if (!locked && !opts.still && t >= 1) {
    for (let i = 0; i < 4 + t * 2; i++) {
      const x = 60 + ((i * 37) % 80), d = (i * 0.37) % 2.4;
      s += `<circle class="av-spark" cx="${x}" cy="230" r="${1 + (i % 3) * 0.6}" fill="${c}" style="animation-delay:${d.toFixed(2)}s"/>`;
    }
  }
  return `${s}</svg>`;
}

/* ---------- painel do personagem (Status) ---------- */

function renderHero() {
  if (!state.profile) return;
  const rank = rankFor(state.level);
  const style = avatarStyle();
  const info = RANK_INFO[rank];
  const box = $('#hero');
  box.style.setProperty('--rank', info.color);
  box.querySelector('.hero-art').innerHTML = avatarSvg(rank, style);
  box.querySelector('.hero-form').textContent = `${AVATARS[style].label} · ${info.form}`;
  box.querySelector('.hero-rank').textContent = `RANK ${rank}`;
  const next = RANK_ORDER[tierOf(rank) + 1];
  const nx = box.querySelector('.hero-next');
  if (next) {
    const from = info.lvl, to = RANK_INFO[next].lvl;
    nx.textContent = `Próxima forma: ${RANK_INFO[next].form} (Rank ${next}) no nível ${to} · faltam ${to - state.level} nível(is)`;
    box.querySelector('.hero-bar i').style.width = `${clamp((state.level - from) / (to - from), 0, 1) * 100}%`;
  } else {
    nx.textContent = 'Forma máxima alcançada. Você é uma lenda.';
    box.querySelector('.hero-bar i').style.width = '100%';
  }

  const path = $('#evo-path');
  path.innerHTML = '';
  RANK_ORDER.forEach((r) => {
    const unlocked = tierOf(r) <= tierOf(rank);
    const card = el('div', `evo-card${r === rank ? ' current' : ''}${unlocked ? '' : ' locked'}`);
    card.style.setProperty('--rank', RANK_INFO[r].color);
    const art = el('div', 'evo-art');
    art.innerHTML = avatarSvg(r, style, { locked: !unlocked, still: true });
    card.append(art, el('b', '', `RANK ${r}`), el('small', '', unlocked ? RANK_INFO[r].form : `Nível ${RANK_INFO[r].lvl}`));
    card.title = `${RANK_INFO[r].form}: ${RANK_INFO[r].gear}`;
    path.append(card);
  });
}

/* ---------- cenas animadas ---------- */

const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sceneQueue = [];
let sceneOpen = false;

function playScene(kind, data) {
  sceneQueue.push({ kind, data });
  if (!sceneOpen) nextScene();
}

function nextScene() {
  const sc = sceneQueue.shift();
  if (!sc) { sceneOpen = false; return; }
  sceneOpen = true;
  const rank = rankFor(state.level);
  const color = RANK_INFO[rank].color;
  const ov = el('div', `scene scene-${sc.kind}${reduceMotion() ? ' calm' : ''}`);
  ov.style.setProperty('--rank', color);
  let title = '', sub = '', extra = '';
  if (sc.kind === 'levelup') {
    title = 'LEVEL UP!';
    sub = `Nível ${sc.data.from} → <b>${sc.data.to}</b>`;
    extra = `+${sc.data.points} pontos de atributo`;
  } else if (sc.kind === 'rankup') {
    title = `RANK ${rank}`;
    sub = `Nova forma: <b>${RANK_INFO[rank].form}</b>`;
    extra = `Desbloqueado: ${RANK_INFO[rank].gear}`;
  } else if (sc.kind === 'daily') {
    title = 'MISSÃO COMPLETA';
    sub = `Sequência: <b>${sc.data.streak}</b> dia(s)`;
    extra = `+${sc.data.xp} XP`;
  }
  ov.innerHTML = `<div class="scene-lines"></div><div class="scene-flash"></div>
    <div class="scene-content">
      <div class="scene-art">${avatarSvg(rank, avatarStyle())}</div>
      <div class="scene-title" data-text="${title}">${title}</div>
      <div class="scene-sub">${sub}</div>
      <div class="scene-extra">${escapeHtml(extra)}</div>
      <div class="scene-tap">toque para continuar</div>
    </div>`;
  document.body.append(ov);
  if (navigator.vibrate) navigator.vibrate(sc.kind === 'rankup' ? [80, 60, 80, 60, 240] : [60, 40, 120]);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    ov.classList.add('out');
    setTimeout(() => { ov.remove(); nextScene(); }, 350);
  };
  ov.addEventListener('click', close);
  setTimeout(close, sc.kind === 'rankup' ? 5200 : 3600);
}

/* ---------- partículas de mana no fundo ---------- */

function initParticles() {
  const box = $('#mana');
  if (!box || box.children.length || reduceMotion()) return;
  for (let i = 0; i < 16; i++) {
    const p = el('span');
    p.style.left = `${(i * 61) % 100}%`;
    p.style.animationDuration = `${9 + (i % 5) * 2.3}s`;
    p.style.animationDelay = `${-(i * 1.7)}s`;
    p.style.width = p.style.height = `${2 + (i % 3)}px`;
    box.append(p);
  }
}
