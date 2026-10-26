const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

export const PlayIcon = () => (
  <svg {...base}><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z" /></svg>
);
export const PauseIcon = () => (
  <svg {...base}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
);
export const LogoutIcon = () => (
  <svg {...base}><path d="M10 3a1 1 0 0 1 0 2H6v14h4a1 1 0 0 1 0 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5zm6.3 4.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4-1.4l2.3-2.3H10a1 1 0 0 1 0-2h8.6l-2.3-2.3a1 1 0 0 1 0-1.4z" /></svg>
);
export const LibraryIcon = () => (
  <svg {...base}><path d="M4 4h3v16H4zM9 4h3v16H9zM14.2 5.1l2.9-.8 3.7 14.6-2.9.8z" /></svg>
);
export const OptimizeIcon = () => (
  <svg {...base}><path d="M4 7h9.1a3 3 0 0 1 5.8 0H20a1 1 0 0 1 0 2h-1.1a3 3 0 0 1-5.8 0H4a1 1 0 0 1 0-2zm0 8h1.1a3 3 0 0 1 5.8 0H20a1 1 0 0 1 0 2h-9.1a3 3 0 0 1-5.8 0H4a1 1 0 0 1 0-2z" /></svg>
);
export const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#1ed760" />
    <g fill="#121212">
      <rect x="8" y="13" width="3.5" height="6" rx="1.75" />
      <rect x="14.25" y="8" width="3.5" height="16" rx="1.75" />
      <rect x="20.5" y="11" width="3.5" height="10" rx="1.75" />
    </g>
  </svg>
);
