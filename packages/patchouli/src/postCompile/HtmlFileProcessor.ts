import fs from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { rehypeMinifyNoJs } from '../compile/markdown/unifiedProcessors';
import rehypeStringify from 'rehype-stringify';
import FileProcessor from '../FileProcessor';

export default class HtmlFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const contents = await fs.readFile(inPath);
		const minified = await unified()
			.use(rehypeParse)
			.use(rehypeMinifyNoJs)
			.use(rehypeStringify)
			.process(contents);

		await fs.writeFile(outPath, minified.value);
	}

	handlesFile(filePath) {
		return filePath.endsWith('.html');
	}
}
