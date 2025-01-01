import {
	Button,
	Modal,
	Dialog,
	Heading,
	Slider,
	Label,
	SliderOutput,
	SliderTrack,
	SliderThumb,
	ColorPicker
} from 'iris-components';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setRulerSettings } from '$state/prefsSlice';

interface RulerDialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
}

function RulerDialog({ isOpen, setIsOpen }: RulerDialogProps) {
	const dispatch = useAppDispatch();

	const rulerSettings = useSelector((state: RootState) => state.prefs.ruler);

	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Reading Ruler Settings</Heading>

				<div className="flex flex-col gap-2 min-w-56 mb-3">
					<Slider
						minValue={0}
						maxValue={8}
						step={0.1}
						value={rulerSettings.focusArea}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									focusArea: val
								})
							)
						}
					>
						<Label>Highlight Height</Label>
						<SliderOutput className="react-aria-SliderOutput after:content-['rem']" />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>

					<ColorPicker
						label="Top Color"
						presets={['#00000000', '#0000007f']}
						value={rulerSettings.topShadeColor}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									topShadeColor: val.toString('rgba')
								})
							)
						}
					/>

					<ColorPicker
						label="Highlight Color"
						presets={['#00000000', '#0000007f']}
						value={rulerSettings.focusColor}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									focusColor: val.toString('rgba')
								})
							)
						}
					/>

					<ColorPicker
						label="Bottom Color"
						presets={['#00000000', '#0000007f']}
						value={rulerSettings.bottomShadeColor}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									bottomShadeColor: val.toString('rgba')
								})
							)
						}
					/>

					<Slider
						minValue={1}
						maxValue={10}
						step={1}
						value={rulerSettings.lineThickness}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									lineThickness: val
								})
							)
						}
					>
						<Label>Line Thickness</Label>
						<SliderOutput className="react-aria-SliderOutput after:content-['px']" />
						<SliderTrack>
							<SliderThumb />
						</SliderTrack>
					</Slider>

					<ColorPicker
						label="Top Border Color"
						presets={['#00000000', '#000']}
						value={rulerSettings.overlineColor}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									overlineColor: val.toString('rgba')
								})
							)
						}
					/>

					<ColorPicker
						label="Bottom Border Color"
						presets={['#00000000', '#000']}
						value={rulerSettings.underlineColor}
						onChange={(val) =>
							dispatch(
								setRulerSettings({
									...rulerSettings,
									underlineColor: val.toString('rgba')
								})
							)
						}
					/>
				</div>

				<Button autoFocus onPress={() => setIsOpen(false)}>
					Done
				</Button>
			</Dialog>
		</Modal>
	);
}

export default RulerDialog;
