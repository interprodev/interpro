export enum LegendRowType {
	Icon = 1,
	Circle = 2,
	Point = 3
}

export interface PlayerStatusLegendRow {
	type: LegendRowType;
	label: string;
	icon?: string;
	color?: string;
}
