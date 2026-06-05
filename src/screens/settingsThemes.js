// Theme tables — extracted out of Settings.jsx so main.jsx can read them
// SYNCHRONOUSLY on first render (the theme-application effects in main.jsx
// run before any route is mounted). Settings.jsx now lazy-loads as a route
// chunk, so without this split main would have to wait on the Settings
// chunk before it could even paint the accent + background colors.
//
// Settings.jsx re-exports these names so its own consumers (and any tests
// importing from '../screens/Settings.jsx') keep working unchanged.

// Accent presets — these flip the --accent-amber CSS var (see main.jsx).
export const ACCENT_PRESETS = {
  amber: { name: 'Amber',  color: '#F5B842', dim: '#C99634' },
  sage:  { name: 'Sage',   color: '#8FA876', dim: '#6E8758' },
  rose:  { name: 'Rose',   color: '#E08F8F', dim: '#B96A6A' },
  sky:   { name: 'Sky',    color: '#7B9FB5', dim: '#5A7A8E' },
};
export const ACCENT_KEYS = Object.keys(ACCENT_PRESETS);

// Background themes — each one rewrites the bg/border CSS vars in main.jsx.
// Each entry must define every color the app reads from these vars so the
// switch is total (no half-themed cards).
//
// Optional fields (text*, accent, accentDim) let a theme also flip the
// foreground palette — essential for the light/sepia/paper reading modes
// brought back from deployment v13, where dark text on light paper is
// required for legibility. Themes that omit these inherit the defaults
// from theme.css :root.
export const BG_THEMES = {
  amber:    { name: 'Amber Dark',    desc: 'Warm dark. The original InfraLearn default.', base: '#0B0A08', elev: '#13110E', card: '#17140F', cardHover: '#1D1A14', subtle: '#2A2620', border: '#3A352C', strong: '#5A5244', textPrimary: '#F4EFE3', textSecondary: '#C7BFA9', textTertiary: '#8E8773', textQuaternary: '#5C574A', accent: '#F5B842', accentDim: '#C99230' },
  light:    { name: 'Light',         desc: 'Cream paper feel. Long-read friendly.',      base: '#E8E3D5', elev: '#DED7C5', card: '#D2CAB4', cardHover: '#C7BFA6', subtle: '#B8AC8C', border: '#A1957A', strong: '#877C66', textPrimary: '#221E18', textSecondary: '#4B4338', textTertiary: '#6E6452', textQuaternary: '#918672' },
  sepia:    { name: 'Sepia',         desc: 'Easy on the eyes. Long-read friendly.',      base: '#DDCFAF', elev: '#D2C39E', card: '#C6B68C', cardHover: '#B9A87A', subtle: '#A89866', border: '#8A7D52', strong: '#6D6240', textPrimary: '#2A2010', textSecondary: '#4B3A20', textTertiary: '#685433', textQuaternary: '#8B7858', accent: '#9C5F1F', accentDim: '#80501A' },
  paper:    { name: 'Paper',         desc: 'Like a Kindle. Lowest eye fatigue.',         base: '#DDD4BA', elev: '#D1C7A8', card: '#C5BB95', cardHover: '#B7AC83', subtle: '#A8997A', border: '#8C7E61', strong: '#6D6248', textPrimary: '#1F1A10', textSecondary: '#43381F', textTertiary: '#645737', textQuaternary: '#877A56', accent: '#855616', accentDim: '#693F0F' },
  hicon:    { name: 'High Contrast', desc: 'Black + bright. Maximum legibility.',        base: '#000000', elev: '#0A0A0A', card: '#141414', cardHover: '#1F1F1F', subtle: '#404040', border: '#606060', strong: '#808080', textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', textTertiary: '#B0B0B0', textQuaternary: '#808080', accent: '#FFC93F', accentDim: '#E0A930' },
  'solarized-dark': { name: 'Solarized', desc: 'The developer classic. Cool teal base.', base: '#002B36', elev: '#073642', card: '#0A4554', cardHover: '#0D5567', subtle: '#1D4A55', border: '#2B5A66', strong: '#4E7178', textPrimary: '#FDF6E3', textSecondary: '#93A1A1', textTertiary: '#839496', textQuaternary: '#586E75', accent: '#B58900', accentDim: '#8A6800' },
  nord:     { name: 'Nord',          desc: 'Cool muted blues. Calming for long sessions.', base: '#2E3440', elev: '#3B4252', card: '#434C5E', cardHover: '#4C566A', subtle: '#4C566A', border: '#5E6779', strong: '#7587A3', textPrimary: '#ECEFF4', textSecondary: '#D8DEE9', textTertiary: '#A9B1C0', textQuaternary: '#7C8499', accent: '#EBCB8B', accentDim: '#D4B16A' },
  gruvbox:  { name: 'Gruvbox',       desc: 'Warm retro. Lower contrast, easier focus.',  base: '#282828', elev: '#32302F', card: '#3C3836', cardHover: '#504945', subtle: '#504945', border: '#665C54', strong: '#7C6F64', textPrimary: '#FBF1C7', textSecondary: '#EBDBB2', textTertiary: '#BDAE93', textQuaternary: '#928374', accent: '#FABD2F', accentDim: '#D79921' },
};
export const BG_KEYS = Object.keys(BG_THEMES);
