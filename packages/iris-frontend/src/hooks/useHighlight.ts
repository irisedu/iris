import { useEffect } from 'react';
import hljs from 'highlight.js';
// @ts-expect-error External code without types
import mergeHTMLPlugin from './highlightMergeHTMLPlugin';

import 'highlight.js/styles/xcode.css';

hljs.configure({
	ignoreUnescapedHTML: true,
	languages: []
});

hljs.addPlugin(mergeHTMLPlugin);

export function useHighlight() {
	useEffect(() => {
		document.querySelectorAll('pre code').forEach((elem) => {
			if (!(elem instanceof HTMLElement)) return;

			delete elem.dataset.highlighted;
			hljs.highlightElement(elem);
		});
	});
}
