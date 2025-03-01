import {
	Button,
	Modal,
	Dialog,
	Heading,
	Slider,
	Label,
	SliderOutput,
	SliderTrack,
	SliderThumb
} from 'iris-components';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import {
	setCharSpacing,
	setWordSpacing,
	setLineSpacing,
	setParagraphSpacing
} from '$state/prefsSlice';

interface SpacingDialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
}

function SpacingDialog({ isOpen, setIsOpen }: SpacingDialogProps) {
	const dispatch = useAppDispatch();

	const charSpacing = useSelector(
		(state: RootState) => state.prefs.text.charSpacing
	);
	const wordSpacing = useSelector(
		(state: RootState) => state.prefs.text.wordSpacing
	);
	const lineSpacing = useSelector(
		(state: RootState) => state.prefs.text.lineSpacing
	);
	const paragraphSpacing = useSelector(
		(state: RootState) => state.prefs.text.paragraphSpacing
	);

	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Spacing Settings</Heading>

				<div className="flex flex-col gap-2 min-w-56 mb-3">
					<Slider
						minValue={0}
						maxValue={0.1}
						step={0.005}
						value={charSpacing}
						onChange={(val) => dispatch(setCharSpacing(val))}
					>
						<Label>Character Spacing</Label>
						<SliderOutput className="react-aria-SliderOutput after:content-['em']" />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>

					<Slider
						minValue={-0.01}
						maxValue={0.5}
						step={0.01}
						value={wordSpacing}
						onChange={(val) => dispatch(setWordSpacing(val))}
					>
						<Label>Word Spacing</Label>
						{wordSpacing < 0 ? (
							<span className="react-aria-SliderOutput">font default</span>
						) : (
							<SliderOutput className="react-aria-SliderOutput after:content-['em']" />
						)}
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>

					<Slider
						minValue={1}
						maxValue={5}
						step={0.1}
						value={lineSpacing}
						onChange={(val) => dispatch(setLineSpacing(val))}
					>
						<Label>Line Spacing</Label>
						<SliderOutput />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>

					<Slider
						minValue={0}
						maxValue={5}
						step={0.1}
						value={paragraphSpacing}
						onChange={(val) => dispatch(setParagraphSpacing(val))}
					>
						<Label>Paragraph Spacing</Label>
						<SliderOutput className="react-aria-SliderOutput after:content-['em']" />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>
				</div>

				<Button autoFocus onPress={() => setIsOpen(false)}>
					Done
				</Button>
			</Dialog>
		</Modal>
	);
}

export default SpacingDialog;
