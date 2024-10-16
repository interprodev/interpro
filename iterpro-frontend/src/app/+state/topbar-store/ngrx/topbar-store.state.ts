export const topbarStoreFeatureKey = 'topbarStore';

export interface TopbarState {
	readonly visible: boolean;
	readonly error: any;
	readonly loading: boolean;
}

export const initialState: TopbarState = {
	visible: false,
	error: null,
	loading: false
};
