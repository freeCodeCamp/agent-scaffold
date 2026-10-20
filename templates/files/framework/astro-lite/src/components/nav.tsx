import "./nav.css";
import { useEffect, useState } from "react";
import { Button } from "./button";
import cfg from "../../donation-config.json";

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "theme";

const THEME_CLASS: Record<Theme, string> = {
  dark: "dark-palette",
  light: "light-palette",
};

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.body.classList.remove(THEME_CLASS.dark, THEME_CLASS.light);
  document.body.classList.add(THEME_CLASS[theme]);
}

type NavProps = {
  brand: string;
};

export function Nav({ brand }: NavProps) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function handleToggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav aria-label="Main" className="nav">
        <div className="nav-start">
          <a href="/" className="brand">
            {brand}
          </a>
        </div>

        <div className="nav-actions">
          <div className="nav-links">
            <a href="/placeholder" className="nav-link">
              Placeholder
            </a>
          </div>

          <span className="nav-divider" aria-hidden="true"></span>

          <Button variant="secondary" onClick={handleToggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>

          <Button
            variant="primary"
            href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign=test-2026&medium=web`}
          >
            Donate
          </Button>
        </div>
      </nav>
    </>
  );
}
