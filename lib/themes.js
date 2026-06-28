const CLASSIC = {
  '--bg':           '#1a1a2e',
  '--surface':      '#2a2a45',
  '--surface-deep': '#1a1a2e',
  '--border':       '#5555aa',
  '--border-light': '#7777cc',
  '--border-dim':   '#333355',
  '--text':         '#ffffff',
  '--text-muted':   '#8888aa',
  '--text-dim':     '#666688',
  '--accent':       '#e8ff47',
  '--accent-bg':    'rgba(232,255,71,0.10)',
  '--accent2':      '#7777cc',
  '--accent2-bg':   'rgba(119,119,204,0.15)',
  '--warning':      '#ffaa44',
  '--warning-bg':   '#2a1a00',
  '--danger':       '#ff6666',
  '--danger-bg':    'rgba(255,68,68,0.10)',
};

export const THEMES = [
  {
    name: 'Classic',
    bg: '#1a1a2e',
    accent: '#e8ff47',
    mode: 'dark',
    tokens: { ...CLASSIC },
  },
  {
    name: 'Midnight',
    bg: '#0a0a0f',
    accent: '#4fa3ff',
    mode: 'dark',
    tokens: {
      ...CLASSIC,
      '--bg':           '#0a0a0f',
      '--surface':      '#14141f',
      '--surface-deep': '#0a0a0f',
      '--border':       '#2244aa',
      '--border-light': '#3366cc',
      '--border-dim':   '#1a1a33',
      '--accent':       '#4fa3ff',
      '--accent-bg':    'rgba(79,163,255,0.10)',
    },
  },
  {
    name: 'Forest',
    bg: '#0a1a0f',
    accent: '#3dffa0',
    mode: 'dark',
    tokens: {
      ...CLASSIC,
      '--bg':           '#0a1a0f',
      '--surface':      '#142a1a',
      '--surface-deep': '#0a1a0f',
      '--border':       '#226644',
      '--border-light': '#338855',
      '--border-dim':   '#1a3322',
      '--accent':       '#3dffa0',
      '--accent-bg':    'rgba(61,255,160,0.10)',
    },
  },
  {
    name: 'Burgundy',
    bg: '#1a0a0f',
    accent: '#ff6b6b',
    mode: 'dark',
    tokens: {
      ...CLASSIC,
      '--bg':           '#1a0a0f',
      '--surface':      '#2a141a',
      '--surface-deep': '#1a0a0f',
      '--border':       '#aa2244',
      '--border-light': '#cc3355',
      '--border-dim':   '#331122',
      '--accent':       '#ff6b6b',
      '--accent-bg':    'rgba(255,107,107,0.10)',
    },
  },
  {
    name: 'Light',
    bg: '#f5f5f5',
    accent: '#1a1a2e',
    mode: 'light',
    tokens: {
      ...CLASSIC,
      '--bg':           '#f5f5f5',
      '--surface':      '#ffffff',
      '--surface-deep': '#eeeeee',
      '--border':       '#ccccdd',
      '--border-light': '#aaaacc',
      '--border-dim':   '#ddddee',
      '--text':         '#1a1a2e',
      '--text-muted':   '#555577',
      '--text-dim':     '#888899',
      '--accent':       '#1a1a2e',
      '--accent-bg':    'rgba(26,26,46,0.08)',
      '--accent2':      '#5555aa',
      '--accent2-bg':   'rgba(85,85,170,0.10)',
      '--warning-bg':   '#fff3e0',
      '--danger-bg':    'rgba(255,68,68,0.08)',
    },
  },
];

export function getThemeTokens(background, accent) {
  const match = THEMES.find(t => t.bg === background);

  let base;
  if (match) {
    base = { ...match.tokens };
  } else {
    const { surface, surfaceDeep, border, borderLight, borderDim } = deriveTokensFromBg(background);
    base = {
      ...CLASSIC,
      '--bg':           background,
      '--surface':      surface,
      '--surface-deep': surfaceDeep,
      '--border':       border,
      '--border-light': borderLight,
      '--border-dim':   borderDim,
    };
  }

  const rgb = hexToRgb(accent);
  base['--accent']    = accent;
  base['--accent-bg'] = `rgba(${rgb.join(',')},0.10)`;
  return base;
}

export function buildCssOverrides(tokens) {
  const overrides = Object.entries(tokens).filter(([k, v]) => CLASSIC[k] !== v);
  if (overrides.length === 0) return '';
  return `:root{${overrides.map(([k, v]) => `${k}:${v}`).join(';')}}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function deriveTokensFromBg(bg) {
  const [r, g, b] = hexToRgb(bg);
  const clamp = v => Math.min(255, Math.max(0, Math.round(v)));
  const hex = nums => `#${nums.map(clamp).map(v => v.toString(16).padStart(2, '0')).join('')}`;

  const surface = hex([r + 14, g + 14, b + 14]);

  const max = Math.max(r, g, b);
  const isNeutral = r === g && g === b;
  const borderR = clamp(r + (r === max ? 140 : 28));
  const borderG = clamp(g + (g === max ? 140 : 28));
  const borderB = clamp(b + (b === max ? 140 : 28));
  const border = hex([
    isNeutral ? r + 28  : borderR,
    isNeutral ? g + 28  : borderG,
    isNeutral ? b + 140 : borderB,
  ]);
  const borderLight = hex([borderR + 34, borderG + 34, borderB + 34]);
  const borderDim   = hex([r + 20, g + 20, b + 20]);

  return { surface, surfaceDeep: bg, border, borderLight, borderDim };
}
