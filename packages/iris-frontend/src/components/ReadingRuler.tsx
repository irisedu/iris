import { useRef, useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

interface MouseData {
	y: number;
	node?: Node;
}

function shouldSkipNode(elem: Node) {
	let e: Node | null = elem;

	while (e) {
		if (e instanceof HTMLElement && e.dataset.hideReadingRuler) {
			return true;
		}

		e = e.parentElement;
	}

	return false;
}

function ReadingRuler() {
	const rulerSettings = useSelector((state: RootState) => state.prefs.ruler);
	const {
		enabled,
		focusArea,
		focusColor,
		underlineColor,
		overlineColor,
		lineThickness,
		topShadeColor,
		bottomShadeColor
	} = rulerSettings;

	const animReq = useRef<number | null>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const shiftPressed = useRef(false);
	const mouse = useRef<MouseData>(null);

	const animate = useCallback(
		(_time: number) => {
			animReq.current = requestAnimationFrame(animate);

			const ctx = canvas.current?.getContext('2d');
			if (!ctx) return;

			const remSize = parseFloat(
				getComputedStyle(document.documentElement).fontSize
			);
			const focusAreaPx = focusArea * remSize;

			const { offsetWidth: width, offsetHeight: height } = ctx.canvas;
			ctx.canvas.width = width;
			ctx.canvas.height = height;

			ctx.clearRect(0, 0, width, height);

			if (!mouse.current || shiftPressed.current) return;

			const { y, node: element } = mouse.current;
			if (element && shouldSkipNode(element)) return;

			const focusUpper = y - focusAreaPx / 2;
			const focusLower = y + focusAreaPx / 2;

			ctx.fillStyle = topShadeColor;
			ctx.fillRect(0, 0, width, focusUpper);

			ctx.fillStyle = bottomShadeColor;
			ctx.fillRect(0, focusLower, width, height - focusLower);

			ctx.fillStyle = focusColor;
			ctx.fillRect(0, y - focusAreaPx / 2, width, focusAreaPx);

			ctx.fillStyle = overlineColor;
			ctx.fillRect(0, focusUpper - lineThickness / 2, width, lineThickness);

			ctx.fillStyle = underlineColor;
			ctx.fillRect(0, focusLower - lineThickness / 2, width, lineThickness);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[rulerSettings]
	);

	useEffect(() => {
		if (!enabled) return;

		animReq.current = requestAnimationFrame(animate);
		return () => {
			if (animReq.current) cancelAnimationFrame(animReq.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [animate, rulerSettings]);

	useEffect(() => {
		function onMouseOver(e: MouseEvent) {
			mouse.current = {
				y: e.clientY,
				node: e.target instanceof Node ? e.target : undefined
			};
		}

		function onMouseMove(e: MouseEvent) {
			mouse.current = {
				...mouse.current,
				y: e.clientY
			};

			if (!e.shiftKey) shiftPressed.current = false;
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Shift') shiftPressed.current = true;
		}

		function onKeyUp(e: KeyboardEvent) {
			if (e.key === 'Shift') shiftPressed.current = false;
		}

		document.addEventListener('mouseover', onMouseOver);
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		return () => {
			document.removeEventListener('mouseover', onMouseOver);
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
		};
	}, []);

	return (
		enabled && (
			<canvas
				ref={canvas}
				className="fixed top-0 left-0 w-full h-full pointer-events-none z-[2147483647]"
				aria-hidden="true"
			></canvas>
		)
	);
}

export default ReadingRuler;
