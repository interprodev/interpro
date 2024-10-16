import { signalStore, withState } from '@ngrx/signals';
import { DrillCanvas } from '../models/drills-canvas.types';

type DrillCanvasState = {
	drillCanvases: DrillCanvas[];
	loading: boolean;
	error: Error | null;
};

const initialState: DrillCanvasState = {
	drillCanvases: [],
	loading: false,
	error: null
};

export const DrillCanvasStore = signalStore(withState(initialState));
