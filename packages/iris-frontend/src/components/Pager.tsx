import { Link, useLocation, useSearchParams } from 'react-router-dom';

// Requires the page layout use `pageOffset` query parameter.
export default function Pager({
	totalNum,
	pageSize,
	offset
}: {
	totalNum: number;
	pageSize: number;
	offset: number;
}) {
	const location = useLocation();
	const [searchParams] = useSearchParams();

	const currentPageIdx = Math.floor(offset / pageSize);

	const pagesToShow = 9;
	const numPages = Math.ceil(totalNum / pageSize);

	let firstPageToShow: number;
	let lastPageToShow: number;

	if (currentPageIdx < Math.floor(pagesToShow / 2)) {
		firstPageToShow = Math.max(0, currentPageIdx - Math.floor(pagesToShow / 2));
		lastPageToShow = Math.min(numPages - 1, firstPageToShow + pagesToShow - 1);
	} else {
		lastPageToShow = Math.min(
			numPages - 1,
			currentPageIdx + Math.floor(pagesToShow / 2)
		);
		firstPageToShow = Math.max(0, lastPageToShow - pagesToShow + 1);
	}

	const pages: number[] = [];
	for (let i = firstPageToShow; i <= lastPageToShow; i++) {
		pages.push(i);
	}

	const pageSizes = [50, 100, 150, 200];

	return (
		<nav aria-label="Page control" className="flex flex-row items-center gap-6">
			<ul className="list-none flex gap-6 grow justify-center">
				{numPages > pagesToShow && currentPageIdx > 1 && (
					<li>
						<Link
							to={{
								pathname: location.pathname,
								search:
									'?' +
									new URLSearchParams({
										...Object.fromEntries(searchParams),
										pageOffset: '0'
									})
							}}
						>
							First
						</Link>
					</li>
				)}
				{currentPageIdx > 0 && (
					<li>
						<Link
							to={{
								pathname: location.pathname,
								search:
									'?' +
									new URLSearchParams({
										...Object.fromEntries(searchParams),
										pageOffset: String(offset - pageSize)
									})
							}}
						>
							Prev
						</Link>
					</li>
				)}
				{pages.map((p) => (
					<li key={p}>
						<Link
							to={{
								pathname: location.pathname,
								search:
									'?' +
									new URLSearchParams({
										...Object.fromEntries(searchParams),
										pageOffset: String(p * pageSize)
									})
							}}
							aria-current={p === currentPageIdx}
							className={p === currentPageIdx ? 'font-bold' : ''}
						>
							{p + 1}
						</Link>
					</li>
				))}
				{currentPageIdx < numPages - 1 && (
					<li>
						<Link
							to={{
								pathname: location.pathname,
								search:
									'?' +
									new URLSearchParams({
										...Object.fromEntries(searchParams),
										pageOffset: String(offset + pageSize)
									})
							}}
						>
							Next
						</Link>
					</li>
				)}
				{numPages > pagesToShow && currentPageIdx < numPages - 2 && (
					<li>
						<Link
							to={{
								pathname: location.pathname,
								search:
									'?' +
									new URLSearchParams({
										...Object.fromEntries(searchParams),
										pageOffset: String((numPages - 1) * pageSize)
									})
							}}
						>
							Last
						</Link>
					</li>
				)}
			</ul>
			<div className="flex gap-2 items-center justify-center">
				<span>Show results</span>
				<ul className="list-none flex gap-6 justify-center">
					{pageSizes.map((sz) => (
						<li key={sz}>
							<Link
								to={{
									pathname: location.pathname,
									search:
										'?' +
										new URLSearchParams({
											...Object.fromEntries(searchParams),
											pageSize: String(sz),
											pageOffset: '0'
										})
								}}
								aria-current={pageSize === sz}
								className={pageSize === sz ? 'font-bold' : ''}
							>
								{sz}
							</Link>
						</li>
					))}
				</ul>
			</div>
			<div>Results: {totalNum}</div>
		</nav>
	);
}
