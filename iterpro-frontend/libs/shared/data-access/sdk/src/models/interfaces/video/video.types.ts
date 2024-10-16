// here the categories are defined

import { Event, Player, Staff, VideoAsset } from '../../../lib';

// values are translated with this code: 'videogallery.category.' + value
export enum VideoCategory {
	SHAREDWITHME = 'SHAREDWITHME',
	TRAINING = 'TRAINING',
	GAMES = 'GAMES',
	OTHERS = 'OTHERS'
}

// the route keys
// if "from" param is provided with one of those values when route redirect to the videoGallery
// a special configuration is provided to the gallery
// (check videoGalleryConfigs below for definition)
export enum VideoFromRoute {
	gameEvent = 'gameEvent',
	trainingEvent = 'trainingEvent',
	workload = 'workload',
	session = 'session',
	default = 'default'
}

export interface VideoGalleryConfig {
	categories: VideoCategory[];
	model?: string;
	backUrl?: string;
}
export type VideoGalleryConfigs = {
	[key in VideoFromRoute]: VideoGalleryConfig;
};

export const videoGalleryConfigs: VideoGalleryConfigs = {
	gameEvent: { categories: [VideoCategory.GAMES], model: 'Event', backUrl: '/manager/planning' },
	trainingEvent: { categories: [VideoCategory.TRAINING], model: 'Event', backUrl: '/manager/planning' },
	workload: { categories: [VideoCategory.TRAINING], model: 'Event', backUrl: '/performance/workload-analysis' },
	session: { categories: [VideoCategory.TRAINING], model: 'Event', backUrl: '/performance/session-analysis' },
	default: { categories: [] }
};

export type VideoGallery = {
	[key in VideoCategory]?: VideoAsset[];
};

export type VideoExtensionSupport = false | 'perhaps' | 'probably';

export enum VideoToSaveAction {
	SAVE,
	UPDATE,
	DELETE
}

export interface VideoToSave {
	videoAsset: VideoAsset;
	event: Event;
	action: VideoToSaveAction;
}

/*export interface VideoItem extends VideoAsset {
	_id?: any;
	/!*	home: boolean;*!/
	/!*	opponent: string;*!/
	/!*	date: Date;*!/
	/!*	event: Event | undefined;*!/
	/!*	totalPlayers: Player[];
	totalStaffs: Staff[];*!/
}*/

export interface SelectedVideo {
	item: VideoAsset;
}

export interface VideoInfo {
	thumbnailUrl: string;
	duration: number;
}

export interface VideoSupport {
	mp4: VideoExtensionSupport;
	ogv: VideoExtensionSupport;
	webm: VideoExtensionSupport;
}

export interface FormattedDate {
	formattedDate: string;
}

export type Opponent = Pick<Event, 'opponent'>;

export type StageType = 'preparation' | 'analysis';

export interface Stage {
	label: string;
	type: StageType;
}
