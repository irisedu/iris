import { useEffect, useState } from 'react';
import type { TabData } from '$state/tabsSlice';

function getMimeType(path: string) {
	path = path.toLowerCase();

	if (path.endsWith('.png')) return 'image/png';
	if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
	if (path.endsWith('.gif')) return 'image/gif';
	if (path.endsWith('.webp')) return 'image/webp';

	return null;
}

async function readImage(tabData: TabData) {
	const mime = getMimeType(tabData.path);
	if (!mime) return null;

	const data = await fs.readBase64File(tabData.path);

	return `data:${mime};base64,${data}`;
}

function ImageEditor({ tabData }: { tabData: TabData }) {
	const [src, setSrc] = useState('');

	useEffect(() => {
		readImage(tabData).then((url) => {
			if (!url) return setSrc('');

			setSrc(url);
		});
	}, [tabData]);

	return (
		<div className="flex w-full h-full items-center justify-center">
			<img src={src} className="max-w-[90%] max-h-[90%]" />
		</div>
	);
}

export default ImageEditor;
