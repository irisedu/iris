export interface UserConfig {
	ignoredPaths: string[];
	nunjucks: {
		templatePath: string;
	};
	schemas: Record<string, string>;
}

export const defaultUserConfig = `ignoredPaths = [
    "templates/**",
    "**/auto/**",
    "**/*.aux",
    "**/*.log",
    "**/*.dvi",
    "**/.#*",
    "**/*.schema.json"
]

[nunjucks]

templatePath = "templates"

[schemas]
`;
