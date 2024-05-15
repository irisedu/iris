export default `
platform = "iris"

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

[languagetool]

serverPath = "languagetool-http-server"
port = 51293

[nunjucks]

templatePath = "templates"
`
