import { Line, Triangle } from 'fabric';

export type DrillCanvasChangelog = {
	authorId: string;
	authorName: string;
	timestamp?: string;
};

export type DrillCanvas = {
	id: string;
	name: string;
	teamId: string;
	version: number | null;
	previewUrl: string;
	animated: boolean;
	sharedWith: string[];
	canvas: DrillEditorCanvas | undefined;
	authorName: string;
	authorId: string | null;
	author: DrillCanvasChangelog;
	changelog: DrillCanvasChangelog[];
	creationDate?: Date;
	lastUpdated?: {
		authorId: string | null;
		authorName: string;
		timestamp: Date;
	};
};

export type DrillEditorCanvas = {
	[key: string]: unknown;
};

export type DrillCanvasItem = {
	id: string;
	label: string;
	url: string;
};

export type DrillCanvasMapping = {
	backgrounds: DrillCanvasItem[];
	elements: DrillCanvasItem[];
	players: DrillCanvasItem[];
	arrows: DrillCanvasItem[];
};

export type DrillMovement = {
	name: string;
	description: string;
};

export type ContextMenuItem = {
	label: string;
	icon: string;
};

export type Arrow = {
	arrowLine: Line;
	arrowHead: Triangle;
};

export const PlayerCanvas = { TShirt: 'T-Shirt', Dot: 'Dot' } as const;
export type PlayerCanvasType = (typeof PlayerCanvas)[keyof typeof PlayerCanvas];

export const DrillCanvasMode = {
	Default: 'Default',
	Draw: 'Draw',
	DrawDashed: 'DrawDashed',
	Arrow: 'Arrow',
	ArrowDashed: 'ArrowDashed',
	Line: 'Line',
	LineDashed: 'LineDashed'
} as const;
export type DrillCanvasModeType = (typeof DrillCanvasMode)[keyof typeof DrillCanvasMode];
