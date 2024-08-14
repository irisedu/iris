import fs from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { rehypeMinifyNoJs } from '../compile/markdown/unifiedProcessors';
import rehypeStringify from 'rehype-stringify';
import FileProcessor, { type FileProcessorArgs } from '../FileProcessor';

export default class HtmlFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
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

	override handlesFile(filePath: string) {
		return filePath.endsWith('.html');
	}
}
