import {
	createContext,
	useContext,
	useEffect,
	useCallback,
	useState,
	useMemo,
	type ReactNode
} from 'react';

interface VisibilityContextData {
	childVisibility: boolean[];
	setChildVisibility:
		| ((vis: boolean[] | ((existing: boolean[]) => boolean[])) => void)
		| null;
}

// Context for parents to hide when all children are hidden
// The list of children should be static
export const VisibilityContext = createContext<VisibilityContextData>({
	childVisibility: [],
	setChildVisibility: null
});

// Child
export function useVisibility(
	index?: number
): [boolean, ((vis: boolean) => void) | null] {
	const { childVisibility, setChildVisibility } = useContext(VisibilityContext);

	const setVisible = useCallback(
		(newVisible: boolean) => {
			if (
				!setChildVisibility ||
				index === undefined ||
				newVisible === childVisibility[index]
			)
				return;

			setChildVisibility((childVis) => {
				if (index >= childVis.length) {
					return [
						...childVis,
						...Array(index - childVis.length).fill(true),
						newVisible
					];
				}

				return childVis.map((vis, i) => {
					if (i === index) return newVisible;
					return vis;
				});
			});
		},
		[index, childVisibility, setChildVisibility]
	);

	const visible =
		index === undefined ||
		childVisibility[index] ||
		childVisibility[index] === undefined;

	return setChildVisibility && index !== undefined
		? [visible, setVisible]
		: [true, null];
}

// Parent, maybe also child
// Visibility is determined by children and can be propagated upwards
export function useVisibilityParent(index?: number) {
	const vis = useVisibility(index);

	const [childVisibility, setChildVisibility] = useState<boolean[]>([]);

	const isVisible = useMemo(
		() => !childVisibility.length || !childVisibility.every((vis) => !vis),
		[childVisibility]
	);

	useEffect(() => {
		if (vis[1] && index !== undefined) vis[1](isVisible);
	}, [vis, index, isVisible]);

	return { isVisible, childVisibility, setChildVisibility };
}

interface VisibilityGroupProps {
	index?: number;
	children: ReactNode;
	className: string;
	[key: string]: unknown;
}

export function VisibilityGroup({
	index,
	children,
	className,
	...props
}: VisibilityGroupProps) {
	const { isVisible, childVisibility, setChildVisibility } =
		useVisibilityParent(index);

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<div className={`${className}${isVisible ? '' : ' hidden'}`} {...props}>
				{children}
			</div>
		</VisibilityContext.Provider>
	);
}
