import { useRef, useState } from "react";
import { Maximize, Spool, Palette, SunMoon } from "lucide-react";
import { useTheme } from "../../context/themeProvider/ThemeProvider"; // adjust path
import "./toolbar.css";

const THEME_OPTIONS = ["default", "manuscript", "typewriter", "notebook"] as const;
type ThemeId = (typeof THEME_OPTIONS)[number];

export default function Toolbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { mode, setMode, themeId, setThemeId } = useTheme();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen?.();
    }
  };

  const redeemCode = () => {
    if (!code.trim()) return;
    alert(`Code "${code}" submitted! (Hook this up to your unlock flow)`);
    setCode("");
  };

  return (
    <div className="toolbar">
      {/* Left: App Title */}
      <span className="toolbar-title">
        <Spool size={30} /> Ficweaver
      </span>

      {/* Center: Warning */}
      <div className="toolbar-warning">
        ⚠️ Ficweaver is an experimental tool. Please&nbsp;
        <strong>save</strong>&nbsp;and&nbsp;<strong>export</strong>&nbsp;often to avoid losing your work.
        &nbsp;|&nbsp;
        <a
          href="https://discord.gg/8E86tEczXb"
          target="_blank"
          rel="noreferrer"
          className="toolbar-link"
        >
        Experiencing issues? Join our tech support Discord server →
        </a>
      </div>

      {/* Right controls */}
      <div className="toolbar-right" ref={menuRef}>
        {/* Themes dropdown trigger */}
        <button
          className="toolbar-btn theme-trigger"
          onClick={() => setIsMenuOpen((o) => !o)}
          title="Themes"
        >
          <Palette size={18} />
          <span>Themes</span>
        </button>

        {/* Fullscreen Button */}
        <button
          className="toolbar-btn fullscreen-trigger"
          onClick={handleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize size={20} />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="theme-menu">
            {/* Mode Switch */}
            <button
              className="mode-switch"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            >
              <span className="mode-label">
                <SunMoon size={18} />
                {mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </span>
              <span className="mode-status">{mode === "dark" ? "Dark" : "Light"}</span>
            </button>

            {/* Themes list */}
            <div className="theme-list">
              <div className="theme-list-label">Themes</div>
              {THEME_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`theme-option ${themeId === opt ? "selected" : ""}`}
                >
                  <span>{opt}</span>
                  <input
                    type="radio"
                    name="theme"
                    checked={themeId === opt}
                    onChange={() => setThemeId(opt)}
                  />
                </label>
              ))}
            </div>

            {/* Unlock box */}
            <div className="unlock-section">
              <div className="unlock-label">Unlock more themes</div>
              <div className="unlock-input">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && redeemCode()}
                  placeholder="Enter code"
                />
                <button onClick={redeemCode}>Unlock</button>
              </div>
              <a
                href="https://gumroad.com/"
                target="_blank"
                rel="noreferrer"
                className="unlock-link"
              >
                Get more themes on Gumroad →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
