import { useEffect } from 'react';
import { useRevalidator, useLoaderData, Link } from 'react-router-dom';
import { TagGroup, TagList, Tag } from 'iris-components';
import type { SeriesInfo } from 'patchouli';
import IrisCard from '$components/IrisCard';
import { IriscInlineContent } from '$components/nodes/IriscNode';

import { useSelector } from 'react-redux';
import store, { type RootState } from '$state/store';

import ArrowRight from '~icons/tabler/arrow-right';

export function loader() {
	const { enabled: devEnabled, host: devHost } = store.getState().dev;

	const seriesData = fetch('/series').then((res) => res.json());
	const devSeriesData = devEnabled
		? fetch(`http://${devHost}/series`)
				.then((res) => res.json())
				.catch(() => [])
		: [];

	return Promise.all([seriesData, devSeriesData]);
}

function SeriesCollection({ seriesData }: { seriesData: SeriesInfo[] }) {
	return (
		<div className="flex flex-col md:flex-row md:flex-wrap gap-4 p-2">
			{seriesData.map((series, i) => (
				<Link key={i} className="text-black no-underline" to={series.href}>
					<IrisCard className="group w-full md:w-80">
						<span className="block text-xl">
							<IriscInlineContent nodes={series.title} />
						</span>

						{series.tags.length > 0 && (
							<TagGroup
								selectionMode="none"
								aria-label="Tags"
								className="react-aria-TagGroup my-2"
							>
								<TagList>
									{series.tags.map((t, i) => (
										<Tag key={i}>{t}</Tag>
									))}
								</TagList>
							</TagGroup>
						)}

						<ArrowRight className="absolute w-8 h-8 inset-y-1/2 my-auto right-4 text-iris-300 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />
					</IrisCard>
				</Link>
			))}
		</div>
	);
}

export function Component() {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	const devState = useSelector((state: RootState) => state.dev.state);
	const refresh = useSelector((state: RootState) => state.dev.refresh);

	const revalidator = useRevalidator();
	const [seriesData, devSeriesData] = useLoaderData() as [
		SeriesInfo[],
		SeriesInfo[]
	];

	useEffect(() => {
		document.title = 'Catalog • Iris';
	}, []);

	useEffect(() => {
		revalidator.revalidate();
		// No revalidator
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [devEnabled, devHost, devState, refresh]);

	// Existing series are overridden when dev mode is enabled
	const prodSeriesData = seriesData.filter(
		(s) => !devSeriesData.some((d) => d.href === s.href)
	);

	return (
		<>
			<h1 className="mt-0">Catalog</h1>

			<SeriesCollection seriesData={prodSeriesData} />

			{devSeriesData.length > 0 && (
				<>
					<h2>Local catalog</h2>
					<SeriesCollection seriesData={devSeriesData} />
				</>
			)}
		</>
	);
}
