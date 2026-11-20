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

// Busto em estilo anime: olhos grandes com brilho, cabelo espetado com
// reflexos, sombreamento "cel shading" e roupa que muda a cada rank.
const OUTFIT = {
  E: { main: '#4a5878', dark: '#333f5a', trim: '#8fb0d8' },
  D: { main: '#1d2742', dark: '#141b30', trim: '#4cc3ff' },
  C: { main: '#1a2c38', dark: '#11202a', trim: '#3ef0c8' },
  B: { main: '#1a1430', dark: '#110c22', trim: '#a77bff' },
  A: { main: '#1e1020', dark: '#140a16', trim: '#ff4d7a' },
  S: { main: '#0e0c14', dark: '#07060b', trim: '#ffd166' },
};
const EYE = { E: '#6f8fb8', D: '#3aa8ff', C: '#22d8b0', B: '#9a6bff', A: '#ff3d6e', S: '#ffc94a' };

function avatarSvg(rank, style, opts = {}) {
  const id = `av${++avatarSeq}`;
  const t = tierOf(rank);
  const locked = !!opts.locked;
  const fem = style === 'cacadora';
  const c = locked ? '#2a3a5c' : RANK_INFO[rank].color;
  const g = locked ? '#1a2440' : RANK_INFO[rank].glow;
  const o = OUTFIT[rank];
  const L = locked ? '#2a3a5c' : '#120c18'; // contorno
  const skin = locked ? '#060a16' : '#f7d9c4';
  const skinSh = locked ? '#060a16' : '#e2ad97';
  const hair = locked ? '#060a16' : fem ? '#2a2140' : '#171d2e';
  const hairSh = locked ? '#060a16' : fem ? '#1a1430' : '#0c101c';
  const hairHi = locked ? 'none' : t >= 3 ? c : fem ? '#8f7fc8' : '#6d84b8';
  const fill = (x) => (locked ? '#060a16' : x);
  const anim = opts.still || locked ? '' : ' av-anim';
  const glowF = locked ? '' : `filter="url(#${id}-glow)"`;
  const eye = EYE[rank];

  let s = `<svg viewBox="0 0 240 280" class="avatar${anim}${locked ? ' locked' : ''}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-aura" cx="50%" cy="55%" r="55%">
      <stop offset="0" stop-color="${c}" stop-opacity="${0.3 + t * 0.09}"/>
      <stop offset="0.65" stop-color="${g}" stop-opacity="${0.14 + t * 0.06}"/>
      <stop offset="1" stop-color="${g}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d0a14"/><stop offset="0.45" stop-color="${eye}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="${id}-blade" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <clipPath id="${id}-eyeL"><path d="M87,107 Q99,92 117,101 Q116,119 103,120 Q91,119 87,107 Z"/></clipPath>
    <clipPath id="${id}-face"><path d="M86,86 C86,114 94,130 106,143 L120,155 L134,143 C146,130 154,114 154,86 C154,56 138,42 120,42 C102,42 86,56 86,86 Z"/></clipPath>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>`;

  // aura
  if (!locked && t >= 1) {
    const w = 64 + t * 9;
    s += `<g class="av-aura"><ellipse cx="120" cy="${150 - t * 4}" rx="${w}" ry="${110 + t * 8}" fill="url(#${id}-aura)" filter="url(#${id}-blur)"/></g>
    <path class="av-aura2" fill="${c}" opacity="${0.06 + t * 0.03}" d="M120,${16 - t * 3} L104,58 L88,${34 - t * 2} L84,80 L60,${60 - t * 3} L64,110 L${34 - t * 3},104 L48,150 L${20 - t * 3},170 L40,200 L40,280 L200,280 L200,200 L${220 + t * 3},170 L192,150 L${206 + t * 3},104 L176,110 L${180 + t * 3},${60 - t * 3} L156,80 L152,${34 - t * 2} L136,58 Z"/>`;
  }

  // sombras serpenteando (S)
  if (!locked && t >= 5) {
    s += `<g class="av-wisps" fill="none" stroke="#6a3dff" stroke-width="4" stroke-linecap="round" opacity="0.75" ${glowF}>
      <path d="M40,270 Q14,220 34,170 Q48,136 24,104"/><path d="M200,270 Q226,220 206,170 Q192,136 216,104"/>
      <path d="M62,276 Q30,250 22,214" stroke-width="2.5"/><path d="M178,276 Q210,250 218,214" stroke-width="2.5"/></g>`;
  }

  // espada nas costas (A+)
  if (!locked && t >= 4) {
    s += `<g ${glowF}><path d="M190,22 L198,26 L176,170 L168,166 Z" fill="url(#${id}-blade)" stroke="${L}" stroke-width="1.2"/>
      <rect x="181" y="2" width="9" height="26" rx="3" transform="rotate(9 185 15)" fill="#2a1a24" stroke="${L}" stroke-width="1.2"/>
      <rect x="172" y="26" width="34" height="7" rx="3" transform="rotate(9 189 29)" fill="${c}" stroke="${L}" stroke-width="1.2"/></g>`;
  }

  // capa (S)
  if (t >= 5) {
    s += `<path class="av-coat" d="M50,196 C30,230 22,260 20,280 L220,280 C218,260 210,230 190,196 Z" fill="${fill('#1a0f2e')}" stroke="${L}" stroke-width="1.6"/>
      <path d="M50,196 C30,230 22,260 20,280" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.9"/><path d="M190,196 C210,230 218,260 220,280" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.9"/>`;
  }

  // cabelo de trás
  if (fem) {
    s += `<g class="av-hairback"><path d="M80,92 C70,140 64,200 74,252 L98,236 L120,250 L142,236 L166,252 C176,200 170,140 160,92 C158,52 142,34 120,34 C98,34 82,52 80,92 Z" fill="${hair}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M86,120 C80,170 82,210 90,240 L98,236 C92,206 90,170 94,124 Z" fill="${hairSh}"/></g>`;
  } else {
    s += `<path d="M82,112 L72,86 L60,80 L74,72 L66,52 L86,54 L86,32 L104,42 L112,18 L126,36 L140,20 L144,42 L160,32 L158,54 L178,54 L166,72 L180,80 L168,88 L158,112 Z" fill="${hair}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }

  // corpo / roupa
  s += `<g class="av-torso">
    <path d="M56,206 C66,184 94,174 108,170 L132,170 C146,174 174,184 184,206 L200,280 L40,280 Z" fill="${fill(o.main)}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M150,182 C168,190 180,200 184,206 L200,280 L156,280 C160,240 158,210 150,182 Z" fill="${fill(o.dark)}" opacity="0.9"/>`;
  if (!locked) {
    if (t === 0) {
      // moletom simples com cordões
      s += `<path d="M104,170 Q120,192 136,170" fill="${skin}" stroke="${L}" stroke-width="1.4"/>
        <path d="M98,172 Q120,200 142,172" fill="none" stroke="${o.dark}" stroke-width="5"/>
        <line x1="112" y1="190" x2="110" y2="214" stroke="${o.trim}" stroke-width="2"/><line x1="128" y1="190" x2="130" y2="214" stroke="${o.trim}" stroke-width="2"/>`;
    } else {
      // jaqueta com zíper e detalhes na cor do rank
      s += `<path d="M106,170 L120,196 L134,170" fill="${skin}" stroke="${L}" stroke-width="1.4"/>
        <path d="M120,196 L120,280" stroke="${L}" stroke-width="1.4"/><path d="M118,200 L118,280" stroke="${o.trim}" stroke-width="1.2" opacity="0.8"/>
        <path d="M66,230 L96,214 M174,230 L144,214" stroke="${o.trim}" stroke-width="2" opacity="0.8"/>`;
    }
    if (t >= 3) {
      // gola alta do sobretudo
      s += `<path d="M104,172 L92,140 L84,190 Z" fill="${o.main}" stroke="${L}" stroke-width="1.4"/><path d="M136,172 L148,140 L156,190 Z" fill="${o.dark}" stroke="${L}" stroke-width="1.4"/>
        <path d="M92,140 L86,186 M148,140 L154,186" stroke="${c}" stroke-width="1.6"/>`;
    }
  }
  s += `</g>`;

  // ombreiras (C+)
  if (t >= 2) {
    const pad = `<path d="M40,214 C40,190 54,178 78,178 L88,204 C70,206 54,212 40,222 Z" fill="${fill('#2b3a52')}" stroke="${L}" stroke-width="1.6"/>
      <path d="M46,206 C52,192 62,186 76,186" fill="none" stroke="${c}" stroke-width="2" opacity="${locked ? 0 : 0.9}"/>`;
    s += `<g>${pad}</g><g transform="translate(240,0) scale(-1,1)">${pad}</g>`;
  }

  // pescoço
  s += `<path d="M108,138 L108,174 Q120,182 132,174 L132,138 Z" fill="${skin}" stroke="${L}" stroke-width="1.4"/>
    <path d="M108,146 Q120,166 132,146 L132,158 Q120,172 108,158 Z" fill="${skinSh}"/>`;

  // cachecol (D a C)
  if (t >= 1 && t <= 2) {
    s += `<g stroke="${L}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M98,166 Q120,186 142,166 L148,182 Q120,204 92,182 Z" fill="${fill(g)}"/>
      <path d="M100,176 Q120,192 140,176" fill="none" stroke="${locked ? L : c}" stroke-width="1.4"/>
      <path class="av-scarf" d="M138,180 Q172,184 214,164 Q198,186 212,204 Q174,202 140,194 Z" fill="${fill(g)}"/>
      <path class="av-scarf" d="M150,186 Q178,188 204,176" fill="none" stroke="${locked ? L : c}" stroke-width="1.2" opacity="0.7"/></g>`;
  }

  // orelhas
  if (!locked) {
    const ear = `<path d="M88,96 C78,92 76,108 80,116 C83,122 88,120 90,116" fill="${skin}" stroke="${L}" stroke-width="1.3"/>`;
    s += ear + `<g transform="translate(240,0) scale(-1,1)">${ear}</g>`;
  }

  // rosto
  s += `<path d="M86,86 C86,114 94,130 106,143 L120,155 L134,143 C146,130 154,114 154,86 C154,56 138,42 120,42 C102,42 86,56 86,86 Z" fill="${skin}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;

  if (!locked) {
    // sombra da franja no rosto (cel shading)
    s += `<g clip-path="url(#${id}-face)"><path d="M80,74 L154,74 L158,96 L148,86 L142,100 L134,84 L126,102 L118,84 L110,100 L102,84 L96,98 L88,86 L82,98 Z" fill="${skinSh}" opacity="0.85"/>
      <path d="M140,110 C146,124 140,138 128,148 L134,143 C146,130 152,118 154,100 Z" fill="${skinSh}" opacity="0.6"/></g>`;

    // olhos (o direito é o espelho do esquerdo)
    const big = fem ? 1.08 : 1;
    const eyeG = `<g class="av-eye" transform="translate(${102 * (1 - big)},${108 * (1 - big)}) scale(${big})">
        <path d="M87,107 Q99,92 117,101 Q116,119 103,120 Q91,119 87,107 Z" fill="#fff"/>
        <g clip-path="url(#${id}-eyeL)">
          <ellipse cx="104" cy="109" rx="9" ry="12.5" fill="url(#${id}-iris)" stroke="#0d0a14" stroke-width="1" ${t >= 4 ? glowF : ''}/>
          <ellipse cx="104" cy="108" rx="4" ry="6" fill="#0d0a14"/>
          <path d="M96,114 Q104,120 112,113" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.55"/>
          <path d="M87,99 Q102,94 118,99 L118,106 Q102,100 87,107 Z" fill="#0d0a14" opacity="0.4"/>
        </g>
        <ellipse cx="100" cy="103.5" rx="3.4" ry="3" fill="#fff"/><circle cx="108" cy="113.5" r="1.6" fill="#fff" opacity="0.9"/><circle cx="96" cy="111" r="0.9" fill="#fff" opacity="0.8"/>
        <path d="M84,106 Q98,88 119,99 L120,103 Q100,94 87,109 Z" fill="${L}"/>
        ${fem ? `<path d="M86,105 L80,100 L87,102 Z M89,100 L84,93 L92,98 Z" fill="${L}"/>` : `<path d="M86,105 L82,104 L88,102 Z" fill="${L}"/>`}
        <path d="M95,120 Q103,122 111,119" fill="none" stroke="${L}" stroke-width="1" opacity="0.7"/>
      </g>
      ${fem ? `<path d="M91,89 Q103,83 115,87 L115,88.6 Q103,85.5 91.5,91 Z" fill="${L}"/>` : `<path d="M89,90 Q102,82 116,89 L115,92 Q102,87 90,94 Z" fill="${hairSh}" stroke="${L}" stroke-width="0.8"/>`}`;
    s += `<g class="av-eyes">${eyeG}<g transform="translate(240,0) scale(-1,1)">${eyeG}</g></g>`;

    // nariz e boca
    s += `<path d="M121,119 L124,126 L120,127" fill="none" stroke="${skinSh}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M112,136 Q120,${t >= 3 ? 138 : 140} 129,135" fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (fem) s += `<ellipse cx="98" cy="124" rx="6" ry="2.5" fill="#ff8fa3" opacity="0.35"/><ellipse cx="142" cy="124" rx="6" ry="2.5" fill="#ff8fa3" opacity="0.35"/>`;
    // marca de batalha no rosto (A+)
    if (t >= 4) s += `<path d="M140,116 L148,124 M143,114 L150,121" stroke="${c}" stroke-width="1.4" ${glowF}/>`;
  } else {
    s += `<text x="120" y="118" text-anchor="middle" font-family="Orbitron, sans-serif" font-size="30" fill="#2a3a5c">?</text>`;
  }

  // franja
  if (fem) {
    s += `<g class="av-bangs" stroke="${L}" stroke-width="1.6" stroke-linejoin="round">
      <path d="M84,102 C80,58 100,36 120,36 C140,36 160,58 156,102 L151,84 Q148,96 143,106 L139,80 Q133,98 126,104 L121,78 Q114,96 106,104 L103,80 Q97,94 90,106 Z" fill="${hair}"/>
      <path d="M103,80 Q99,92 96,98 L106,104 Q102,92 103,80 Z M139,80 Q137,92 134,100 L143,106 Q140,92 139,80 Z" fill="${hairSh}" stroke="none"/>
      <path d="M84,94 C78,126 80,156 88,180 L96,160 C90,138 90,116 92,100 Z" fill="${hair}"/>
      <path d="M156,94 C162,126 160,156 152,180 L144,160 C150,138 150,116 148,100 Z" fill="${hair}"/>
      <path d="M100,48 Q116,40 134,44 L132,48 Q116,46 102,53 Z" fill="${hairHi}" stroke="none" opacity="0.8"/>
      <path d="M92,62 Q96,54 104,52" fill="none" stroke="${hairHi}" stroke-width="2" opacity="0.6"/>
      ${locked ? '' : `<path d="M146,62 L156,56 L158,66 L150,70 Z" fill="${c}" stroke="${L}" stroke-width="1.2" ${glowF}/>`}
    </g>`;
  } else {
    s += `<g class="av-bangs" stroke="${L}" stroke-width="1.6" stroke-linejoin="round">
      <path class="av-ahoge" d="M116,40 Q118,18 138,10 Q126,22 126,40 Z" fill="${hair}"/>
      <path d="M82,100 L78,70 C84,48 102,36 120,36 C140,36 158,48 162,70 L158,100 L150,80 L146,102 L138,76 L130,104 L124,74 L116,102 L108,76 L102,104 L96,78 L90,100 L86,84 Z" fill="${hair}"/>
      <path d="M96,78 L102,104 L104,86 Z M124,74 L130,104 L131,84 Z" fill="${hairSh}" stroke="none"/>
      <path d="M98,50 Q114,40 134,44 L132,49 Q114,46 100,55 Z" fill="${hairHi}" stroke="none" opacity="0.85"/>
      <path d="M140,50 Q150,54 154,62" fill="none" stroke="${hairHi}" stroke-width="2.2" opacity="0.7"/>
    </g>`;
  }

  // coroa de luz (S)
  if (!locked && t >= 5) {
    s += `<g class="av-halo" ${glowF}><ellipse cx="120" cy="22" rx="30" ry="7" fill="none" stroke="${c}" stroke-width="3"/>
      <path d="M98,20 L104,4 L112,16 L120,0 L128,16 L136,4 L142,20" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  }

  // partículas
  if (!locked && !opts.still && t >= 1) {
    for (let i = 0; i < 4 + t * 2; i++) {
      const x = 50 + ((i * 41) % 140), d = (i * 0.37) % 2.4;
      s += `<circle class="av-spark" cx="${x}" cy="270" r="${1.2 + (i % 3) * 0.7}" fill="${c}" style="animation-delay:${d.toFixed(2)}s"/>`;
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
