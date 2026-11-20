'use strict';

/* =========================================================
   FIT GAME — Personagem que evolui com o rank + cenas animadas
   Personagens originais desenhados em SVG (silhueta estilo anime
   com contorno luminoso). Cada rank adiciona equipamento e aura.
   ========================================================= */

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];
// cores seguem os selos da arte dos personagens
const RANK_INFO = {
  E: { color: '#c9c9c9', glow: '#7d7d7d', lvl: 1, form: ['Novato', 'Novata'], gear: 'Roupas gastas e ataduras' },
  D: { color: '#e0b58a', glow: '#9a6b40', lvl: 10, form: ['Aprendiz', 'Aprendiz'], gear: 'Jaqueta de caçador e cintos de couro' },
  C: { color: '#f5a742', glow: '#c26d10', lvl: 20, form: ['Avançado', 'Avançada'], gear: 'Ombreira de aço, cachecol carmesim e espada' },
  B: { color: '#ff5a3c', glow: '#c0281a', lvl: 30, form: ['Elite', 'Elite'], gear: 'Armadura pesada e capa de batalha' },
  A: { color: '#b866ff', glow: '#7a2bd6', lvl: 45, form: ['Especial', 'Especial'], gear: 'Armadura negra com runas douradas' },
  S: { color: '#c77dff', glow: '#8f3dff', lvl: 60, form: ['Lendário', 'Lendária'], gear: 'Poder lendário: aura arcana e círculo mágico' },
};

const AVATARS = {
  cacador: { label: 'Caçador' },
  cacadora: { label: 'Caçadora' },
};

function avatarStyle() {
  const p = state.profile || {};
  return p.avatar || (p.sex === 'F' ? 'cacadora' : 'cacador');
}

const tierOf = (rank) => RANK_ORDER.indexOf(rank);
const formName = (rank, style) => RANK_INFO[rank].form[style === 'cacadora' ? 1 : 0];
const artSrc = (rank, style) => `img/${style}-${rank.toLowerCase()}.webp`;

// arte do personagem (ilustração recortada) com aura e partículas na cor do rank
function avatarArt(rank, style, opts = {}) {
  const locked = !!opts.locked;
  const t = tierOf(rank);
  const anim = opts.still || locked ? '' : ' av-anim';
  let sparks = '';
  if (!locked && !opts.still && t >= 1) {
    for (let i = 0; i < 3 + t * 2; i++) {
      sparks += `<i style="left:${12 + ((i * 37) % 76)}%;animation-delay:${((i * 0.41) % 2.6).toFixed(2)}s;animation-duration:${(2.2 + (i % 3) * 0.5).toFixed(1)}s"></i>`;
    }
  }
  return `<div class="avatar-img tier-${t}${locked ? ' locked' : ''}${anim}" style="--rank:${RANK_INFO[rank].color};--glow:${RANK_INFO[rank].glow}">
    <div class="av-glow"></div>
    <img src="${artSrc(rank, style)}" alt="${locked ? 'Forma bloqueada' : `${AVATARS[style].label} ${formName(rank, style)}`}" decoding="async" draggable="false">
    ${locked ? '<span class="av-lock">?</span>' : ''}
    <div class="av-sparks">${sparks}</div>
  </div>`;
}

// pré-carrega a arte do rank atual e do próximo
function preloadArt() {
  if (!state.profile) return;
  const r = rankFor(state.level);
  const next = RANK_ORDER[tierOf(r) + 1];
  [r, next].filter(Boolean).forEach((x) => { const im = new Image(); im.src = artSrc(x, avatarStyle()); });
}

/* ---------- painel do personagem (Status) ---------- */

function renderHero() {
  if (!state.profile) return;
  const rank = rankFor(state.level);
  const style = avatarStyle();
  const info = RANK_INFO[rank];
  const box = $('#hero');
  box.style.setProperty('--rank', info.color);
  box.querySelector('.hero-art').innerHTML = avatarArt(rank, style);
  box.querySelector('.hero-form').textContent = `${AVATARS[style].label} · ${formName(rank, style)}`;
  box.querySelector('.hero-rank').textContent = `RANK ${rank}`;
  const next = RANK_ORDER[tierOf(rank) + 1];
  const nx = box.querySelector('.hero-next');
  if (next) {
    const from = info.lvl, to = RANK_INFO[next].lvl;
    nx.textContent = `Próxima forma: ${formName(next, style)} (Rank ${next}) no nível ${to} · faltam ${to - state.level} nível(is)`;
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
    art.innerHTML = avatarArt(r, style, { locked: !unlocked, still: true });
    card.append(art, el('b', '', `RANK ${r}`), el('small', '', unlocked ? formName(r, style) : `Nível ${RANK_INFO[r].lvl}`));
    card.title = `${formName(r, style)}: ${RANK_INFO[r].gear}`;
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
    sub = `Nova forma: <b>${formName(rank, avatarStyle())}</b>`;
    extra = `Desbloqueado: ${RANK_INFO[rank].gear}`;
  } else if (sc.kind === 'daily') {
    title = 'MISSÃO COMPLETA';
    sub = `Sequência: <b>${sc.data.streak}</b> dia(s)`;
    extra = `+${sc.data.xp} XP`;
  }
  ov.innerHTML = `<div class="scene-lines"></div><div class="scene-flash"></div>
    <div class="scene-content">
      <div class="scene-art">${avatarArt(rank, avatarStyle())}</div>
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
