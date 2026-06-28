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
    const derived = deriveTokensFromBg(background);
    base = { ...CLASSIC, ...derived };
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

export function getLuminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8)  & 255) / 255;
  const b = (           n & 255) / 255;
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function isDark(hex) {
  return getLuminance(hex) < 0.18;
}

function deriveTokensFromBg(bg) {
  const [r, g, b] = hexToRgb(bg);
  const clamp = v => Math.min(255, Math.max(0, Math.round(v)));
  const toHex = arr => '#' + arr.map(v => clamp(v).toString(16).padStart(2, '0')).join('');

  const surface     = toHex([r + 14, g + 14, b + 14]);
  const surfaceDeep = bg;

  const max       = Math.max(r, g, b);
  const isNeutral = r === g && g === b;
  const border    = toHex([
    r + (isNeutral ? 28  : r === max ? 140 : 28),
    g + (isNeutral ? 28  : g === max ? 140 : 28),
    b + (isNeutral ? 140 : b === max ? 140 : 28),
  ]);
  const [br, bg2, bb] = [
    clamp(r + (isNeutral ? 28  : r === max ? 140 : 28)),
    clamp(g + (isNeutral ? 28  : g === max ? 140 : 28)),
    clamp(b + (isNeutral ? 140 : b === max ? 140 : 28)),
  ];
  const borderLight = toHex([br + 34, bg2 + 34, bb + 34]);
  const borderDim   = toHex([r + 20,  g + 20,   b + 20]);

  const dark = isDark(bg);
  return {
    '--bg':           bg,
    '--surface':      surface,
    '--surface-deep': surfaceDeep,
    '--border':       border,
    '--border-light': borderLight,
    '--border-dim':   borderDim,
    '--text':         dark ? '#ffffff'               : '#1a1a2e',
    '--text-muted':   dark ? '#8888aa'               : '#555577',
    '--text-dim':     dark ? '#666688'               : '#888899',
    '--warning':      dark ? '#ffaa44'               : '#cc7700',
    '--warning-bg':   dark ? '#2a1a00'               : '#fff3e0',
    '--danger':       dark ? '#ff6666'               : '#cc2222',
    '--danger-bg':    dark ? 'rgba(255,68,68,0.10)'  : 'rgba(204,34,34,0.08)',
  };
}
