;; -*- lexical-binding: t; -*-

(TeX-add-style-hook
 "magicswitch"
 (lambda ()
   (TeX-add-to-alist 'LaTeX-provided-package-options
                     '(("ifthen" "") ("environ" "") ("draftwatermark" "")))
   (TeX-run-style-hooks
    "ifthen"
    "environ"
    "draftwatermark")
   (TeX-add-symbols
    '("solution" ["argument"] 1))
   (LaTeX-add-environments
    '("hide")
    "Solution"
    "Question"))
 :latex)

