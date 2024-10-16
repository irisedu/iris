import { useState, useEffect } from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { TagGroup, TagList, Tag } from 'react-aria-components';
import type { SeriesInfo } from 'patchouli';
import IrisCard from '$components/IrisCard';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

import ArrowRight from '~icons/tabler/arrow-right';
import { IriscInlineContent } from '$components/nodes/IriscNode';

export function loader() {
	return fetch('/series');
}

function SeriesCollection({ seriesData }: { seriesData: SeriesInfo[] }) {
	return (
		<div className="flex flex-col md:flex-row md:flex-wrap gap-4 p-2">
			{seriesData.map((series, i) => (
				<Link key={i} className="text-black no-underline" to={series.href}>
					<IrisCard className="group w-full md:w-80">
						<span className="block text-xl">
							<IriscInlineContent nodes={series.title} meta={{}} />
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

	const seriesData = useLoaderData() as SeriesInfo[];
	const [devSeriesData, setDevSeriesData] = useState<SeriesInfo[]>([]);

	useEffect(() => {
		if (!devEnabled) {
			setDevSeriesData([]);
			return;
		}

		fetch(`http://${devHost}/series`)
			.then((res) => res.json())
			.then(setDevSeriesData);
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
