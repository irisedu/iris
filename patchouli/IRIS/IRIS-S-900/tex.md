---
title = "Including TeX documents"
authors = [ "kyo" ]
---

The `teximg` directive allows $$\TeX$$ documents to be included inside a
Patchouli article. Typically, this should be used for PGF/Ti*k*Z drawings.

To create a suitable $$\TeX$$ document, use the `standalone` document class:

```tex
\documentclass[tikz]{standalone}

\begin{document}
\begin{tikzpicture}
  %% Draw something here
\end{tikzpicture}
\end{document}
```

`.tex` files should be placed in the `assets-compiled/` where they will be
automatically compiled by Patchouli. In the corresponding article, the file
should be referred to using the [Iris internal link syntax]($patchouli#links-and-assets-within-iris).
