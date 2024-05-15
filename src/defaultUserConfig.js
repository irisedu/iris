export default `platform = "iris"

ignoredPaths = [
    "templates/**",
    "**/auto/**",
    "**/*.aux",
    "**/*.log",
    "**/*.dvi",
    "**/.#*"
]

[languagetool]

serverPath = "languagetool-http-server"
port = 51293

[nunjucks]

templatePath = "templates"
`
