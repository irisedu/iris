import signale from 'signale';
import FlexSearch from 'flexsearch';
import path from 'path';
import fs from 'fs-extra';
import { convert as htmlToText } from 'html-to-text';

import BuildTask from './BuildTask.js';
import { recurseDirectory } from '../utils.js';

export default class SearchIndexBuildTask extends BuildTask {
    #buildPath;

    constructor(buildPath) {
        super();
        this.#buildPath = buildPath;
    }

    async build() {
        signale.await('Building search index...');

        const searchIndexOpts = {
            tokenize: 'forward',
            document: {
                id: 'id',
                index: [
                    'title',
                    'contents',
                    'tags'
                ],
                store: true
            },
        };

        const doc = new FlexSearch.Document(searchIndexOpts);

        await recurseDirectory(this.#buildPath, async filePath => {
            const articleExt = '.md.json';
            const parsed = path.parse(filePath);

            const seriesLower = filePath.split(path.sep)[0];

            if (parsed.base === 'series.json') {
                const seriesData = JSON.parse(await fs.readFile(path.join(this.#buildPath, filePath)));

                doc.add({
                    id: seriesLower,
                    type: 'series',
                    title: seriesData.title,
                    href: `/series/${seriesLower}`
                });
            } else if (filePath.endsWith(articleExt)) {
                const articleData = JSON.parse(await fs.readFile(path.join(this.#buildPath, filePath)));
                const id = filePath.slice(0, -articleExt.length);

                doc.add({
                    id,
                    type: 'article',
                    title: articleData.data.frontmatter.title,
                    tags: articleData.data.frontmatter.tags,
                    contents: htmlToText(articleData.contents, {
                        wordwrap: false,
                        selectors: [
                            { selector: 'img', format: 'skip' },
                            { selector: '.katex-mathml', format: 'skip' },
                            { selector: 'table', format: 'skip' } // Not formatted correctly
                        ]
                    }),
                    href: `/series/${id}`
                });
            }
        });

        const index = {};

        await doc.export((key, data) => {
            index[key] = data;
        });

        await fs.writeFile(path.join(this.#buildPath, 'searchIndexOpts.json'), JSON.stringify(searchIndexOpts));
        await fs.writeFile(path.join(this.#buildPath, 'searchIndex.json'), JSON.stringify(index));
    }
}
