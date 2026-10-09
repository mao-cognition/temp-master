import { THEME_OPTIONS, useTheme, type ThemePreference } from '../theme/ThemeContext'

const ICONS: Record<ThemePreference, string> = {
  light: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  system: 'M3 5h18v11H3zM8 20h8m-4-4v4',
}

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="theme-switcher" role="group" aria-label="テーマ切替">
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="theme-switcher__btn"
          aria-pressed={preference === opt.value}
          data-theme-option={opt.value}
          title={`${opt.label}テーマ`}
          onClick={() => setPreference(opt.value)}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d={ICONS[opt.value]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="theme-switcher__label">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
