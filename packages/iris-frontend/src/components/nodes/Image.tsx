import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

function Image({ src, alt }: { src: string; alt: string }) {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);

	const devSrc = `http://${devHost}${src}?hash=${Date.now()}`;

	const isSvg = src.endsWith('.svg');

	if (devEnabled && src.startsWith('/')) {
		if (isSvg) {
			return (
				<object type="image/svg+xml" data={devSrc} aria-label={alt}>
					<object type="image/svg+xml" data={src} aria-label={alt}>
						{alt}
					</object>
				</object>
			);
		} else {
			return (
				<picture>
					<source srcSet={devSrc} />
					<img src={src} alt={alt} />
				</picture>
			);
		}
	} else {
		if (isSvg) {
			return (
				<object type="image/svg+xml" data={src} aria-label={alt}>
					{alt}
				</object>
			);
		} else {
			return <img src={src} alt={alt} loading="lazy" />;
		}
	}
}

export default Image;
