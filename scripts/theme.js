// theme.js

const themeToggleBtn = document.getElementById("theme-toggle-btn");

export function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const newTheme = document.body.dataset.theme === "light" ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}
