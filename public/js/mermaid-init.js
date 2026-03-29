window.addEventListener("load", function () {
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
      // Extract text line by line from span.line elements
      var lines = code.querySelectorAll(".line");
      var text = "";
      if (lines.length > 0) {
        lines.forEach(function (line) {
          text += line.textContent + "\n";
        });
      } else {
        text = code.textContent;
      }
      var div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = text.trim();
      pre.replaceWith(div);
    });

    mermaid.run();
  };
  document.head.appendChild(script);
});
