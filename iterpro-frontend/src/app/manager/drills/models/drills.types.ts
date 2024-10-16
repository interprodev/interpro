export const drillViews = {
	Card: 'card',
	List: 'list'
} as const;
export type DrillViewType = (typeof drillViews)[keyof typeof drillViews];
