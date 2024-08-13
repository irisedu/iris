import CodeMirrorEditor from '$components/editors/CodeMirrorEditor';
import ProseMirrorEditor from '$components/editors/ProseMirrorEditor';

import type { TabData, TabRender } from '$state/tabsSlice';

import File from '~icons/tabler/file-filled';
import TXT from '~icons/tabler/file-type-txt';
import JSON from '~icons/tabler/json';
import TOML from '~icons/tabler/toml';
import HTML from '~icons/tabler/brand-html5';
import CSS from '~icons/tabler/brand-css3';
import JS from '~icons/tabler/file-type-js';
import PDF from '~icons/tabler/file-type-pdf';
import TeX from '~icons/tabler/tex';
import SVG from '~icons/tabler/file-type-svg';
import JPG from '~icons/tabler/file-type-jpg';
import PNG from '~icons/tabler/file-type-png';

import irisLogo from '$assets/iris-mono.svg';

export const FILE_PREFIX = 'file-';

export function pathIcon(path: string) {
	const className = 'text-iris-500 w-5 h-5';

	if (path.endsWith('.txt')) {
		return <TXT className={className} />;
	} else if (path.endsWith('.json')) {
		return <JSON className={className} />;
	} else if (path.endsWith('.toml')) {
		return <TOML className={className} />;
	} else if (path.endsWith('.html') || path.endsWith('.njk')) {
		return <HTML className={className} />;
	} else if (path.endsWith('.css')) {
		return <CSS className={className} />;
	} else if (path.endsWith('.js')) {
		return <JS className={className} />;
	} else if (path.endsWith('.tex')) {
		return <TeX className={className} />;
	} else if (path.endsWith('.pdf')) {
		return <PDF className={className} />;
	} else if (path.endsWith('.svg')) {
		return <SVG className={className} />;
	} else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
		return <JPG className={className} />;
	} else if (path.endsWith('.png')) {
		return <PNG className={className} />;
	} else if (path.endsWith('.iris')) {
		return (
			<img
				src={irisLogo}
				alt="Iris logo"
				className="w-6 h-6 brightness-75 dark:brightness-150"
			/>
		);
	}

	return <File className={className} />;
}

function makeFileEditor(tabData: TabData) {
	const key = `${tabData.id}-${tabData.generation || 0}`;

	if (tabData.path.endsWith('.iris')) {
		return <ProseMirrorEditor tabData={tabData} key={key} />;
	}

	return <CodeMirrorEditor tabData={tabData} key={key} />;
}

export function makeTabData(
	openDirectory: string,
	path: string,
	generation?: number
) {
	return {
		id: FILE_PREFIX + path,
		type: 'file',
		generation: generation || 0,
		path,
		fileName: path.slice(openDirectory.length + 1)
	};
}

export function makeTab(data: TabData): TabRender {
	return {
		id: data.id,
		generation: data.generation,
		title: data.fileName,
		icon: pathIcon(data.path),
		view: makeFileEditor(data)
	};
}
