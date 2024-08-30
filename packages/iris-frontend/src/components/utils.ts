export function goToAnchor(anchor: string) {
	window.history.pushState(null, '', `#${anchor}`);

	const elem = document.getElementById(anchor);
	if (elem) {
		elem.scrollIntoView();
	}
}
