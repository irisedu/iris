// https://stackoverflow.com/a/11752084
// TODO: Will be replaced by navigator.userAgentData.platform
export const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

export function goToAnchor(anchor: string) {
	window.history.pushState(null, '', `#${anchor}`);

	const elem = document.getElementById(anchor);
	if (elem) {
		elem.scrollIntoView();
	}
}

export function cmdOrCtrl(e: { metaKey: boolean; ctrlKey: boolean }) {
	return isMacLike ? e.metaKey : e.ctrlKey;
}
