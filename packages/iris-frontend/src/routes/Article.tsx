import { useState, useEffect, Fragment } from 'react';
import { useParams, type LoaderFunctionArgs } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import {
	Link as AriaLink,
	TagGroup,
	TagList,
	Tag,
	Label
} from 'react-aria-components';
import type { IriscFile, TocNode } from 'patchouli';
import hljs from 'highlight.js';
import { goToAnchor } from '$components/utils';
import { IriscNode, IriscInlineContent } from '$components/nodes/IriscNode';
// @ts-expect-error External code without types
import mergeHTMLPlugin from './highlightMergeHTMLPlugin';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

import './Article.css';
import 'katex/dist/katex.css';
import 'highlight.js/styles/xcode.css';

hljs.configure({
	ignoreUnescapedHTML: true,
	languages: []
});

hljs.addPlugin(mergeHTMLPlugin);

// @ts-expect-error Interop with line numbers
window.hljs = hljs;
// @ts-expect-error Library does not have types
await import('highlightjs-line-numbers.js');

async function getPageData(
	fullPath: string,
	devEnabled: boolean,
	devHost: string
) {
	if (devEnabled) {
		const res = await fetch(`http://${devHost}${fullPath}`);

		if (res.status === 200) {
			return await res.json();
		}
	}

	const res = await fetch(fullPath);
	if (res.status !== 200) {
		throw new Response('', { status: res.status });
	}

	return await res.json();
}

function parsePath(splat: string) {
	const routePath = splat.replace(/\/+$/g, '');
	const routePathSegments = routePath.split('/');

	return { routePath, routePathSegments };
}

async function load(splat: string, devEnabled: boolean, devHost: string) {
	const { routePath, routePathSegments } = parsePath(splat);

	let fullPath;
	let seriesPath;

	if (routePathSegments.length === 1) {
		fullPath = '/page/' + routePath + '/SUMMARY.irisc';
	} else {
		fullPath = '/page/' + routePath + '.irisc';
		seriesPath = '/page/' + routePathSegments[0] + '/SUMMARY.irisc';
	}

	return await Promise.all([
		getPageData(fullPath, devEnabled, devHost),
		seriesPath && getPageData(seriesPath, devEnabled, devHost)
	]);
}

function ArticleOutline({ outline }: { outline: TocNode[] }) {
	return (
		<ul className="list-none pl-2 my-0">
			{outline.map((heading) => (
				<Fragment key={heading.id}>
					<li className="mb-1 text-gray-800">
						<AriaLink onPress={() => goToAnchor(heading.id)}>
							<IriscInlineContent nodes={heading.content} />
						</AriaLink>
					</li>
					{heading.children && <ArticleOutline outline={heading.children} />}
				</Fragment>
			))}
		</ul>
	);
}

function Sidebar({
	articleData,
	seriesData
}: {
	articleData: IriscFile;
	seriesData: IriscFile;
}) {
	const isMd = useMediaQuery({ query: '(min-width: 768px)' });

	return (
		<div className="flex flex-col gap-8 max-w-[25ch]">
			<div className="px-2 max-h-56 md:max-h-80 md:w-72 overflow-y-auto">
				<span className="text-xl">
					<IriscInlineContent nodes={seriesData.meta.title ?? []} />
				</span>
			</div>

			{articleData.meta.toc && (
				<details className="md:sticky top-8 contents--disabled" open={isMd}>
					<summary
						className={`text-lg ${isMd ? 'pointer-events-none' : ''}`}
						tabIndex={-1}
					>
						Contents
					</summary>
					<ArticleOutline outline={articleData.meta.toc} />
				</details>
			)}
		</div>
	);
}

export function loader({ params }: LoaderFunctionArgs) {
	if (!params['*']) {
		throw new Response('', { status: 404 });
	}

	const { routePath, routePathSegments } = parsePath(params['*']);

	if (
		!routePath ||
		routePath === 'SUMMARY' ||
		routePath.endsWith('/SUMMARY') ||
		!routePathSegments.length ||
		routePathSegments.at(-1)!.split('.').length > 1
	) {
		throw new Response('', { status: 404 });
	}

	return null;
}

export function Component() {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	const refresh = useSelector((state: RootState) => state.dev.refresh);
	const params = useParams();
	const [articleData, setArticleData] = useState<IriscFile | null>(null);
	const [seriesData, setSeriesData] = useState<IriscFile | null>(null);

	useEffect(() => {
		if (window.location.hash) {
			setTimeout(() => {
				goToAnchor(window.location.hash.slice(1));
			}, 500);
		}
	}, []);

	useEffect(() => {
		if (!params['*']) return;

		load(params['*'], devEnabled, devHost).then(
			([newArticleData, newSeriesData]) => {
				setArticleData(newArticleData);
				setSeriesData(newSeriesData);
			}
		);
	}, [devEnabled, devHost, params, refresh]);

	useEffect(() => {
		if (!articleData) {
			return;
		}

		if (seriesData) {
			document.title = `${articleData.meta.titleString ?? '<no title>'} - ${seriesData.meta.titleString ?? '<no series title>'} • Iris`;
		} else {
			document.title = `${articleData.meta.titleString ?? '<no title>'} • Iris`;
		}
	}, [articleData, seriesData]);

	useEffect(() => {
		document.querySelectorAll('pre code').forEach((elem) => {
			if (!(elem instanceof HTMLElement)) return;

			delete elem.dataset.highlighted;
			hljs.highlightElement(elem);
			// @ts-expect-error Injected function
			hljs.lineNumbersBlock(elem);
		});
	});

	if (!articleData) return;

	return (
		<article className="flex flex-col md:flex-row gap-8 mb-8">
			{seriesData && (
				<Sidebar articleData={articleData} seriesData={seriesData} />
			)}

			<div className="md:px-8 w-full md:max-w-[70ch] min-h-72">
				<h1 className="mt-0 mb-4">
					<IriscInlineContent nodes={articleData.meta.title ?? []} />
				</h1>

				<IriscNode node={articleData.data} />

				<hr className="my-3 last:mb-0" />

				{articleData.meta.docAttrs?.authors &&
					articleData.meta.docAttrs.authors.length > 0 && (
						<p className="text-sm mb-0">
							By {articleData.meta.docAttrs.authors.join(', ')}
						</p>
					)}

				{articleData.meta.docAttrs?.tags &&
					articleData.meta.docAttrs.tags.length > 0 && (
						<TagGroup selectionMode="none" className="react-aria-TagGroup my-2">
							<Label>Tags:</Label>
							<TagList>
								{articleData.meta.docAttrs.tags.map((t, i) => (
									<Tag key={i}>{t}</Tag>
								))}
							</TagList>
						</TagGroup>
					)}
			</div>
		</article>
	);
}
