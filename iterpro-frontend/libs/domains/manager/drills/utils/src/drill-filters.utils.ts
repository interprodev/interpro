import { DrillFilters } from '@iterpro/manager/drills/data-access';

export const areAllDrillFiltersResetted = (event: DrillFilters): boolean => {
	return Object.keys(event).every(key => {
		return (event as any)[key].length === 0;
	});
};

export const getPitchSizeValues = (
	label: string,
	widthLabel: string,
	lengthLabel: string
): { x: number; y: number } => {
	const split1 = label.split(', ');
	const pitchX = split1[0].split(widthLabel + ': ')[1];
	const pitchY = split1[1].split(lengthLabel + ': ')[1];
	return {
		x: Number(pitchX),
		y: Number(pitchY)
	};
};

export const getPitchSizeLabel = (x: number, y: number, widthLabel: string, lengthLabel: string): string => {
	return widthLabel + ': ' + String(x) + ', ' + lengthLabel + ': ' + String(y);
};
