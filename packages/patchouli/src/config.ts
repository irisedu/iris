export interface UserConfig {
	ignoredPaths: string[];
	nunjucks: {
		templatePath: string;
	};
}

export const defaultUserConfig = `ignoredPaths = [
    "templates/**",
    "**/auto/**",
    "**/*.aux",
    "**/*.log",
    "**/*.dvi",
    "**/.#*"
]

[nunjucks]

templatePath = "templates"
`;
