document.addEventListener("DOMContentLoaded", function () {
  const codeBlocks = document.querySelectorAll("pre > code.language-mermaid");
  if (codeBlocks.length === 0) return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
  script.onload = function () {
    codeBlocks.forEach(function (code) {
      const pre = code.parentElement;
      const div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = code.textContent;
      pre.replaceWith(div);
    });

    const isDark = document.documentElement.classList.contains("dark");
    mermaid.initialize({
      startOnLoad: true,
      theme: isDark ? "dark" : "default",
    });
  };
  document.head.appendChild(script);
});
