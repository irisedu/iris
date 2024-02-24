import signale from 'signale';
import path from 'path';
import fs from 'fs-extra';

import BuildTask from './BuildTask.js';
import { recurseDirectory } from '../utils.js';

export default class NetworkBuildTask extends BuildTask {
    #buildPath;

    constructor(buildPath) {
        super();
        this.#buildPath = buildPath;
    }

    async build() {
        signale.await('Building network data...');

        const groups = [];
        const network = {
            nodes: [],
            links: []
        };

        const backlinks = {};

        await recurseDirectory(this.#buildPath, async filePath => {
            const ext = '.md.json';

            if (!filePath.endsWith(ext))
                return;

            const id = filePath.slice(0, -ext.length);
            const groupLower = filePath.split(path.sep)[0];
            const group = groupLower.toUpperCase();
            const articleData = JSON.parse(await fs.readFile(path.join(this.#buildPath, filePath)));

            if (!groups.includes(group)) {
                const seriesMeta = JSON.parse(await fs.readFile(path.join(this.#buildPath, groupLower, 'series.json')));

                network.nodes.push({
                    id: groupLower,
                    title: seriesMeta.title,
                    href: `/series/${groupLower}`
                });

                groups.push(group);
            }

            network.nodes.push({
                id,
                group,
                href: `/series/${id}`,
                title: articleData.data.frontmatter.title
            });

            network.links.push({
                source: groupLower,
                target: id
            });

            if (articleData.data.links) {
                for (const otherId of articleData.data.links) {
                    const links = backlinks[otherId] || (backlinks[otherId] = []);
                    links.push(id);

                    if (network.links.some(l => l.from === id && l.to === otherId || l.from === otherId && l.to === id))
                        continue;

                    network.links.push({
                        source: id,
                        target: otherId
                    });
                }
            }
        });

        await fs.writeFile(path.join(this.#buildPath, 'network.json'), JSON.stringify(network));
        await fs.writeFile(path.join(this.#buildPath, 'backlinks.json'), JSON.stringify(backlinks));
    }
}
