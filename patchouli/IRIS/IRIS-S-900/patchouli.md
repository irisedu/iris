---
title = "Patchouli"
authors = [ "kyo" ]
---

Patchouli is the repository containing the majority of Iris' content. It uses
[remark](https://remark.js.org/) to lint and compile Markdown articles to HTML.

## Conventions

Articles should pass lint checks (ignoring erroneous warnings). Additional
guidelines include:

- Follow appropriate English grammar and [typography](https://practicaltypography.com/)
  rules.
- Long lines should break *before* they reach past 80 columns in length.
  - Links can reach past 80 columns if their display content fits within 80
    columns.
  - Directives and code blocks can reach past 80 columns.
  - Many code editors such as [Emacs](https://www.gnu.org/software/emacs/) and
    [Visual Studio Code](https://code.visualstudio.com/) allow visual column
    lines to be added.
- Multi-line content (particularly list items and footnotes) should be indented
  to line up with the beginning of the first line.
- All headings should begin at the second level `##`. The topmost heading `#` is
  handled by the frontmatter.
- Don't use heading levels greater than four (`####`).
- Capitalization rules:
  - Series titles should use Title Case.
  - Chapter titles, article titles, and headings should use Sentence case.

## File structure

Series must follow the following file structure:

- The folder's name must be the same as the series code.
- `series.toml`, which contains series metadata, must be present and follow the
  schema provided in `schema/`.
- `series.toml` links chapters to articles; the articles should be placed in
  folders corresponding to their chapter (or optionally at the series root if
  the chapter they are in is top-level).
- `assets/`, if present, should contain any assets which will be copied without
  alteration when the series is built. You can refer to these assets using the
  [link system](#links-and-assets-within-iris) explained below.
- `assets-compiled/`, if present, should contain any assets which require
  compilation before use (e.g. TeX files).

## Markdown extensions

Patchouli and Iris use many Markdown extensions to provide rich content. They
are documented here.

### GitHub Flavored Markdown

Patchouli adopts GitHub Flavored Markdown:

- Strikethrough is delimited by `~~`.
- Tables are supported and are documented in depth [here](https://github.github.com/gfm/#tables-extension-).
- Footnotes are denoted `[^x]` where `x` is a number. Footnotes should be listed
  at the end of the file with `[^x]: <content>`.

### Links and assets within Iris

Patchouli has two special link prefixes: `@` for cross-series links, and `$`
for links within the current series.

- A link to `@iris-s-900/test-page` resolves to `/series/iris-s-900/test-page`,
  and an asset (e.g. an image) pointing to `@iris-s-900/assets/test.png`
  resolves to the one at `iris-s-900/assets/test.png`.
- Assuming the current series is IRIS-S-900, `$test-page` and `$assets/test.png`
  resolve to the same locations as above.

These prefixes should immediately precede a file name (do not add a `/` after).
All asset names, page names, and links within Iris should be lowercase and use
hyphens as word delimiters.

### Frontmatter

All Patchouli files must have frontmatter in [TOML](https://toml.io/en/) with
information including title and author. The frontmatter follows a fixed schema
in `schemas/frontmatter.schema.json`. Frontmatter is delimited by `---`.

### Directives

Directives are flexible extensions to Markdown syntax. Patchouli defines several
directives, separated by type. Directive syntax is documented in detail [here](https://github.com/micromark/micromark-extension-directive#syntax).

A text directive, designed to be used within sentences, has syntax
`:name[label]{attributes}`. The following text directives are supported:

- `abbr`: an abbreviation, such as
  `:abbr[USA]{title="United States of America"}`. The value of the `title`
  attribute will be shown on hover.

A leaf directive, designed to be used as a standalone block with no content, has
syntax `::name[label]{attributes}`. The following leaf directives are supported:

- `teximg`: a $$\TeX$$ image, with `src` attribute for the $$\TeX$$ source path
  in `assets-compiled/` and an `alt` attribute for the image's alt text.
- `iframe`: an generic embedded page, with `src` attribute for the embed URL and
  `width` and `height` attributes for sizing.
- `summary`: the summary for a `details` directive.

A container directive, designed to be a block with content, begins with
`:::name[label]{attributes}` with the end of the block indicated by `:::`.
Additional colons may be used for nested blocks. The following container
directives are supported:

- [`note`](#notes)
- [`comment`](#comments)
- `figure`: labeled figures. To be used with `figcaption`.
- `figcaption`: the caption for a figure. To be used inside `figure`.
- `details`: content which is hidden by default. To be used with `summary`.

#### Notes

Container directive for special notes determined by class name.

:::note{.info}
`:::note{.info}`
:::

:::note{.warning}
`:::note{.warning}`
:::

:::note{.tip}
`:::note{.tip}`
:::

::::note{.problem}
`:::note{.problem}`

:::details
::summary[Hint 1]

Here is a hint:

```md
**What?**
```
:::

:::details
::summary[Hint 2]

No spoonfeeding here...
:::

Got it?
::::

:::note{.exercise}
`:::note{.exercise}`
:::

#### Comments

Container directive for comments from the author as various characters.

:::comment{.iris.thinking}
`:::comment{.iris.thinking}`
:::

### Smartypants

Some symbols and character sequences are automatically converted to special
characters:

- Single/double quotes become curly quotes and apostrophes wherever appropriate.
- `--` becomes an en dash.
- `---` becomes an em dash.
- `...` becomes ellipsis.

These symbols should be used according to proper typography rules.

:::note{.warning}
Smartypants will not convert punctuation in the frontmatter (i.e. the title).
You will need to use the proper symbols manually.
:::

### Gemoji

[GitHub emoji codes](https://github.com/ikatyang/emoji-cheat-sheet/) are
converted to accessible emojis.

### MathJax

Math typesetting through [MathJax](https://www.mathjax.org/) is supported with
the `$$` delimiter. When `$$` is present on separate lines, the math is typeset
in display mode. Otherwise, it is typeset as inline. Proper best practices for
TeX-style code and math typesetting should be followed.
