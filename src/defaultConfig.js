export default `
ignoredPaths = [
    "build/**",
    "**/.#*",
    "templates/**",
    "**/*.bib",
    "**/*.aux",
    "**/*.log",
    "**/*.dvi",
    "**/auto/**"
]

[markdown]

smartypantsFrontmatter = []

[markdown.messageTypes]

info = "Note"
warning = "Warning"
tip = "Tip"
problem = "Problem"
exercise = "Exercise"

[markdown.characters.iris]

name = "Iris"
url = "#"

[markdown.languagetool]

serverPath = "languagetool-http-server"
port = 51293

[nunjucks]

templatePath = "templates"

[network]

store = []

[schemas]
`
