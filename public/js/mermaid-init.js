document.addEventListener("DOMContentLoaded", function () {
  var codeBlocks = document.querySelectorAll('pre[data-language="mermaid"]');
  if (codeBlocks.length === 0) return;

  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
  script.onload = function () {
    var isDark = document.documentElement.classList.contains("dark");
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
    });

    codeBlocks.forEach(function (pre, i) {
      var code = pre.querySelector("code");
      if (!code) return;
      var text = code.textContent;
      var div = document.createElement("div");
      div.className = "mermaid";
      div.id = "mermaid-" + i;
      div.textContent = text;
      pre.replaceWith(div);
    });

    mermaid.run();
  };
  document.head.appendChild(script);
});
