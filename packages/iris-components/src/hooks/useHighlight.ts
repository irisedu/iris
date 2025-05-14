import { useEffect } from 'react';
import hljs from 'highlight.js';
// @ts-expect-error External code without types
import mergeHTMLPlugin from './highlightMergeHTMLPlugin';

hljs.configure({
	ignoreUnescapedHTML: true,
	languages: []
});

hljs.addPlugin(mergeHTMLPlugin);

// This does not provide any theme.
export function useHighlight() {
	useEffect(() => {
		document.querySelectorAll('pre code').forEach((elem) => {
			if (!(elem instanceof HTMLElement)) return;

			delete elem.dataset.highlighted;
			hljs.highlightElement(elem);
		});
	});
}
