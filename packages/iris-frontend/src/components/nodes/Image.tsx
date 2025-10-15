import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';
import { Button, Dialog, DialogTrigger, Modal } from 'iris-components';
import { DevContext } from '../../routes/Article';

import X from '~icons/tabler/x';
import { useContext } from 'react';

export interface ImageProps {
	src: string;
	alt: string;
	className?: string;
}

function ImageInternal({ src, alt, className }: ImageProps) {
	const { dev } = useContext(DevContext);
	const devHost = useSelector((state: RootState) => state.dev.host);

	const devSrc = `http://${devHost}${src}?hash=${Date.now()}`;
	const actualSrc = dev && src.startsWith('/') ? devSrc : src;

	const isSvg = src.endsWith('.svg');

	if (isSvg) {
		return (
			<object
				type="image/svg+xml"
				data={actualSrc}
				aria-label={alt}
				className={'pointer-events-none' + (className ? ' ' + className : '')}
			>
				{alt}
			</object>
		);
	} else {
		return (
			<img src={actualSrc} alt={alt} loading="lazy" className={className} />
		);
	}
}

function Image(props: ImageProps) {
	return (
		<DialogTrigger>
			<Button className="cursor-pointer w-full">
				<ImageInternal {...props} />
			</Button>
			{/* Sizing nightmare: Try to maximize image size based on height */}
			<Modal isDismissable className="size-full">
				<Dialog className="react-aria-Dialog h-full flex flex-col items-center bg-[white]">
					<Button
						className="fixed top-5 right-5 rounded-full text-black bg-iris-100 data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300 p-1 cursor-pointer"
						aria-label="Close image popup"
						slot="close"
					>
						<X />
					</Button>
					<div className="grow">
						<ImageInternal {...props} className="max-h-[90vh] object-contain" />
					</div>
					{props.alt && (
						<p className="text-sm text-center my-3 overflow-y-auto">
							{props.alt}
						</p>
					)}
				</Dialog>
			</Modal>
		</DialogTrigger>
	);
}

export default Image;
