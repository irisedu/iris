import { useState, useEffect, Fragment, createContext } from 'react';
import {
	useRevalidator,
	useLoaderData,
	type LoaderFunctionArgs,
	useParams
} from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { Link } from 'react-router-dom';
import {
	useHighlight,
	goToAnchor,
	Link as AriaLink,
	TagGroup,
	TagList,
	Tag,
	Label
} from 'iris-components';
import { type IriscFile, type TocNode } from '@irisedu/schemas';
import {
	IriscBlockContent,
	IriscInlineContent,
	Summary
} from '$components/nodes/IriscNode';
import SelectionMenu from '$components/SelectionMenu';

import { useSelector } from 'react-redux';
import store, { type RootState } from '$state/store';

import './Article.css';
import 'katex/dist/katex.css';
import useAuthorization from '$hooks/useAuthorization';

export const DevContext = createContext({ dev: false });

function parsePath(slug: string): [string, string[]] {
	const routePath = slug.replace(/\/+$/g, '');
	const routePathSegments = routePath.split('/');

	return [routePath, routePathSegments];
}

function ArticleOutline({
	articleData,
	outline
}: {
	articleData: IriscFile;
	outline: TocNode[];
}) {
	return (
		<ul className="list-none pl-2 my-0">
			{outline.map((heading) => (
				<Fragment key={heading.id}>
					<li className="mb-1 text-gray-800">
						<AriaLink onPress={() => goToAnchor(heading.id)}>
							<IriscInlineContent nodes={heading.content} ctx={articleData} />
						</AriaLink>
					</li>
					{heading.children && (
						<ArticleOutline
							articleData={articleData}
							outline={heading.children}
						/>
					)}
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
	const params = useParams();
	const [_, routePathSegments] = parsePath(params['*']!);

	const isLg = useMediaQuery({ query: '(min-width: 64em)' });

	return (
		<div className="flex flex-col gap-8 lg:w-[25ch] text-sm">
			<div className="px-2 max-h-56 lg:max-h-80 overflow-y-auto">
				<Link
					className="block text-xl mb-2"
					to={'/page/' + routePathSegments[0]}
				>
					<IriscInlineContent
						nodes={seriesData.meta.title ?? []}
						ctx={seriesData}
					/>
				</Link>

				{seriesData.meta.summary && (
					<Summary summary={seriesData.meta.summary} ctx={seriesData} />
				)}
			</div>

			{articleData.meta.toc && (
				<div className="lg:sticky top-8 lg:max-h-[80vh] lg:overflow-y-auto">
					<details open={isLg}>
						<summary
							className={`text-lg ${isLg ? 'pointer-events-none' : ''}`}
							tabIndex={isLg ? -1 : undefined}
						>
							Contents
						</summary>
						<ArticleOutline
							articleData={articleData}
							outline={articleData.meta.toc}
						/>
					</details>
				</div>
			)}
		</div>
	);
}

async function getPageData(
	fullPath: string,
	devEnabled: boolean,
	devHost: string
) {
	if (devEnabled) {
		const res = await fetch(`http://${devHost}${fullPath}`).catch(() => null);

		if (res && res.status === 200) {
			return { dev: true, data: (await res.json()) as IriscFile };
		}
	}

	const res = await fetch(fullPath);
	if (res.status !== 200) {
		throw new Response('', { status: res.status });
	}

	return { dev: false, data: (await res.json()) as IriscFile };
}

export function loader({ params }: LoaderFunctionArgs) {
	if (!params['*']) {
		throw new Response('', { status: 404 });
	}

	const [routePath, routePathSegments] = parsePath(params['*']);

	if (
		!routePath ||
		routePath === 'SUMMARY' ||
		routePath.endsWith('/SUMMARY') ||
		!routePathSegments.length ||
		routePathSegments.at(-1)!.split('.').length > 1
	) {
		throw new Response('', { status: 404 });
	}

	let fullPath;
	let seriesPath;

	if (routePathSegments.length === 1) {
		fullPath = '/page/' + routePath + '/SUMMARY.irisc';
	} else {
		fullPath = '/page/' + routePath + '.irisc';
		seriesPath = '/page/' + routePathSegments[0] + '/SUMMARY.irisc';
	}

	const { enabled: devEnabled, host: devHost } = store.getState().dev;

	return Promise.all([
		getPageData(fullPath, devEnabled, devHost),
		seriesPath !== undefined
			? getPageData(seriesPath, devEnabled, devHost)
			: null
	]);
}

export function Component() {
	const features = useSelector((state: RootState) => state.features.features);
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	const devState = useSelector((state: RootState) => state.dev.state);
	const refresh = useSelector((state: RootState) => state.dev.refresh);

	const revalidator = useRevalidator();
	const [{ dev, data: articleData }, seriesResult] = useLoaderData() as Awaited<
		ReturnType<typeof loader>
	>;
	const seriesData = seriesResult?.data;

	const user = useAuthorization({});

	const params = useParams();
	const routePath = params['*'];

	useEffect(() => {
		if (window.location.hash) {
			setTimeout(() => {
				goToAnchor(window.location.hash.slice(1));
			}, 500);
		}
	}, []);

	useEffect(() => {
		revalidator.revalidate();
		// No revalidator
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [devEnabled, devHost, devState, refresh]);

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

	useHighlight();

	const [unlinkedVisible, setUnlinkedVisible] = useState(false);

	if (!articleData) return;

	return (
		<DevContext.Provider value={{ dev }}>
			<article className="relative flex flex-col lg:flex-row max-lg:gap-4 mb-8 w-full max-lg:mx-auto max-lg:max-w-[60ch]">
				{features.includes('llm') && user?.type === 'registered' && !dev && (
					<SelectionMenu articleData={articleData} />
				)}

				{seriesData && (
					<Sidebar articleData={articleData} seriesData={seriesData} />
				)}

				<div
					className="lg:px-8 lg:w-[58%] max-w-[65ch] min-h-72"
					data-indexing-boundary={
						seriesData
							? `/page/${routePath}.irisc`
							: `/page/${routePath}/SUMMARY.irisc`
					}
				>
					<h1 className="mt-0 mb-4">
						<IriscInlineContent
							nodes={articleData.meta.title ?? []}
							ctx={articleData}
						/>
					</h1>

					<IriscBlockContent nodes={articleData.data} ctx={articleData} />

					<div className="text-sm mt-5">
						{articleData.meta.unlinkedPages &&
							articleData.meta.unlinkedPages.length === 1 && (
								<>
									<AriaLink onPress={() => setUnlinkedVisible((vis) => !vis)}>
										Show {articleData.meta.unlinkedPages[0].children?.length}{' '}
										unlinked page(s)
									</AriaLink>

									{unlinkedVisible && (
										<Summary
											summary={articleData.meta.unlinkedPages}
											ctx={articleData}
										/>
									)}
								</>
							)}
					</div>

					<hr className="my-3 last:mb-0" />

					{articleData.meta.docAttrs?.authors &&
						articleData.meta.docAttrs.authors.length > 0 && (
							<p className="text-sm mb-0">
								By {articleData.meta.docAttrs.authors.join(', ')}
							</p>
						)}

					{articleData.meta.docAttrs?.tags &&
						articleData.meta.docAttrs.tags.length > 0 && (
							<TagGroup
								selectionMode="none"
								className="react-aria-TagGroup my-2"
							>
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
		</DevContext.Provider>
	);
}
