import { type ReactNode } from 'react';
import {
	Checkbox as AriaCheckbox,
	Select,
	Label,
	Button,
	SelectValue,
	Popover,
	Dialog,
	Switch as AriaSwitch,
	ListBox,
	ColorPicker as AriaColorPicker,
	ColorArea,
	ColorThumb,
	ColorField,
	ColorSlider,
	ColorSwatch,
	ColorSwatchPicker,
	ColorSwatchPickerItem,
	Input,
	SliderOutput,
	SliderTrack,
	DialogTrigger,
	type CheckboxProps,
	type SelectProps,
	type SwitchProps,
	type ColorPickerProps as AriaColorPickerProps,
	type Color
} from 'react-aria-components';

import Check from '~icons/tabler/check';
import ChevronDown from '~icons/tabler/chevron-down';

interface DropdownProps<T extends object> extends SelectProps<T> {
	label?: string;
}

export function Dropdown<T extends object>({
	label,
	children,
	...props
}: DropdownProps<T>) {
	return (
		<Select {...props}>
			{label && <Label>{label}</Label>}
			<Button className="react-aria-Button flex flex-row items-center">
				<SelectValue />
				<ChevronDown className="w-5 h-5 ml-2 text-iris-500" />
			</Button>
			<Popover>
				<ListBox>{children}</ListBox>
			</Popover>
		</Select>
	);
}

export function Checkbox({
	children,
	...props
}: CheckboxProps & { children?: ReactNode }) {
	return (
		<AriaCheckbox {...props}>
			<Check className="checkbox" />
			{children}
		</AriaCheckbox>
	);
}

export function Switch({
	children,
	...props
}: SwitchProps & { children: ReactNode }) {
	return (
		<AriaSwitch {...props}>
			<div className="indicator" />
			{children}
		</AriaSwitch>
	);
}

interface ColorPickerProps extends Omit<AriaColorPickerProps, 'children'> {
	label: string;
	presets?: string[];
}

// react-aria does not accept word colors, so avoid crash by converting them
// (try to maintain compatibility with <=v0.0.4)
function convertColor(color: string | Color) {
	if (color === 'transparent') return '#00000000';
	if (color === 'black') return '#000';
	if (color === 'rgba(0, 0, 0, 50%)') return '#0000007f';

	return color;
}

export function ColorPicker({
	defaultValue,
	value,
	label,
	presets,
	...props
}: ColorPickerProps) {
	return (
		<AriaColorPicker
			defaultValue={defaultValue && convertColor(defaultValue)}
			value={value && convertColor(value)}
			{...props}
		>
			<DialogTrigger>
				<Button className="flex flex-row items-center gap-2">
					<ColorSwatch />
					<span>{label}</span>
				</Button>
				<Popover placement="bottom start">
					<Dialog className="react-aria-Dialog flex flex-col gap-2 p-2 w-48 max-h-[inherit] overflow-auto font-sans">
						<ColorArea
							colorSpace="hsl"
							xChannel="saturation"
							yChannel="lightness"
						>
							<ColorThumb />
						</ColorArea>

						<ColorSlider colorSpace="hsl" channel="hue">
							<Label />
							<SliderOutput />
							<SliderTrack>
								<ColorThumb />
							</SliderTrack>
						</ColorSlider>

						<ColorSlider colorSpace="hsl" channel="alpha">
							<Label />
							<SliderOutput />
							<SliderTrack
								style={({ defaultStyle }) => ({
									background: `${defaultStyle.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`
								})}
							>
								<ColorThumb />
							</SliderTrack>
						</ColorSlider>

						<ColorField>
							<Label>Hex</Label>
							<Input />
						</ColorField>

						{presets && presets.length > 0 && (
							<ColorSwatchPicker>
								{presets.map((color, i) => (
									<ColorSwatchPickerItem color={color} key={i}>
										<ColorSwatch />
									</ColorSwatchPickerItem>
								))}
							</ColorSwatchPicker>
						)}
					</Dialog>
				</Popover>
			</DialogTrigger>
		</AriaColorPicker>
	);
}
