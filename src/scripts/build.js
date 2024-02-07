import MarkdownRenderer from '../MarkdownRenderer.js';
import { buildAll } from '../build.js';

const renderer = new MarkdownRenderer();

(async function() {
    await buildAll(renderer);
})();
