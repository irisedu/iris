import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';
import { Button, Dialog, DialogTrigger, Modal } from 'iris-components';

import X from '~icons/tabler/x';

export interface ImageProps {
	src: string;
	alt: string;
	className?: string;
}

function ImageInternal({ src, alt, className }: ImageProps) {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);

	const devSrc = `http://${devHost}${src}?hash=${Date.now()}`;

	const isSvg = src.endsWith('.svg');

	if (devEnabled && src.startsWith('/')) {
		if (isSvg) {
			return (
				<object
					type="image/svg+xml"
					data={devSrc}
					aria-label={alt}
					className={'pointer-events-none' + (className ? ' ' + className : '')}
				>
					<object
						type="image/svg+xml"
						data={src}
						aria-label={alt}
						className={className}
					>
						{alt}
					</object>
				</object>
			);
		} else {
			return (
				<picture>
					<source srcSet={devSrc} />
					<img src={src} alt={alt} className={className} />
				</picture>
			);
		}
	} else {
		if (isSvg) {
			return (
				<object
					type="image/svg+xml"
					data={src}
					aria-label={alt}
					className={'pointer-events-none' + (className ? ' ' + className : '')}
				>
					{alt}
				</object>
			);
		} else {
			return <img src={src} alt={alt} loading="lazy" className={className} />;
		}
	}
}

function Image(props: ImageProps) {
	return (
		<DialogTrigger>
			<Button className="cursor-pointer w-full">
				<ImageInternal {...props} />
			</Button>
			{/* Sizing nightmare: Try to maximize image size based on height */}
			<Modal isDismissable className="h-full">
				<Dialog className="react-aria-Dialog h-full flex flex-col items-center">
					<Button
						className="fixed top-5 right-5 rounded-full text-black bg-iris-100 data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300 p-1 cursor-pointer"
						aria-label="Close image popup"
						slot="close"
					>
						<X />
					</Button>
					<div className="grow shadow-lg h-full">
						<ImageInternal {...props} className="size-full dark:bg-black" />
					</div>
					{props.alt && <p className="text-sm text-center my-3">{props.alt}</p>}
				</Dialog>
			</Modal>
		</DialogTrigger>
	);
}

export default Image;
