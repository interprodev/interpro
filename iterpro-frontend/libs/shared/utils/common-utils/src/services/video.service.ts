import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import {
	Customer,
	Event,
	FormattedDate,
	Opponent,
	Player,
	Staff,
	VideoAsset,
	VideoCategory,
	VideoExtensionSupport,
	VideoGallery,
	VideoInfo,
	VideoSupport
} from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Observable, defer, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { AzureStoragePipe } from '../pipes/azure-storage.pipe';
import { getMomentFormatFromStorage } from '../utils/dates/date-format.util';
import { sortByDate, sortByDateDesc } from '../utils/dates/date.util';
import { ImageService } from './image.service';
import { getExtensionOfFileFromUrl } from './utils.service';
import { flatten, uniq } from 'lodash';

@Injectable()
export class VideoService {
	private renderer: Renderer2;
	private reloadVideoGallery: BehaviorSubject<boolean> = new BehaviorSubject(false);

	constructor(
		private readonly rendererFactory: RendererFactory2,
		private readonly azurePipe: AzureStoragePipe,
		private readonly imageService: ImageService
	) {
		this.renderer = this.rendererFactory.createRenderer(null, null);
	}

	forceReload() {
		this.reloadVideoGallery.next(true);
	}

	listenReload(): Observable<boolean> {
		return this.reloadVideoGallery.asObservable();
	}

	createEmptyVideoGallery(): VideoGallery {
		const videoGallery: any = {};
		for (const key in VideoCategory) {
			videoGallery[key] = [];
		}

		return videoGallery as VideoGallery;
	}

	videos2gamesVideo(videos: VideoAsset[]): VideoAsset[] {
		return videos.map(video => {
			if (video.linkedModel === 'Event' && video.linkedObject) {
				const event = video.linkedObject as Event;
				const { home, opponent, start } = event;
				const totalPlayers = this.whoPlayed(event);
				const totalStaffs = this.whoPlayedStaff(event);
				return <VideoAsset>{
					...video,
					home,
					opponent,
					date: start,
					event,
					totalPlayers,
					totalStaffs,
					notesThreads: sortByDate(video?.notesThreads || [], 'time').reverse()
				};
			}
			return {
				...video,
				home: true,
				opponent: '',
				date: video.creationDate,
				event: undefined,
				totalPlayers: [],
				totalStaffs: [],
				notesThreads: sortByDate(video?.notesThreads || [], 'time').reverse()
			};
		});
	}

	videos2gallery(videos: VideoAsset[]): VideoGallery {
		const gallery: any = this.createEmptyVideoGallery();
		sortByDateDesc(videos, 'creationDate').forEach((video: VideoAsset) => {
			// Available values are defined in the VideoCategory enum
			const category = video.category;
			if (gallery[category]) {
				gallery[category].push(video);
			}
		});
		return gallery;
	}

	extractTags(tags: string): string[] {
		return tags
			? tags
					.split(',')
					.map(tag => tag.trim())
					.filter(tag => tag.length > 0)
			: [];
	}

	getGalleryTags(gallery: any): SelectItem[] {
		let tags: SelectItem[] = [];
		for (const category in VideoCategory) {
			tags = this.getUniqueTags(gallery[category], tags);
		}
		return tags;
	}

	getUniqueTags(videos: VideoAsset[], tags: SelectItem[] = []): SelectItem[] {
		const tempTag: (string | undefined)[] = tags.map(tag => tag.label);
		return videos.reduce((list, video) => {
			(video?.tags || []).forEach((tag: string) => {
				if (tempTag.indexOf(tag) < 0) {
					tempTag.push(tag);
					list.push({ label: tag, value: tag });
				}
			});
			return list;
		}, tags);
	}

	getUniqueOpponents(videos: VideoAsset[], opponents: Opponent[] = []): Opponent[] {
		const tempOpponents: string[] = opponents.map(item => item.opponent);
		return videos.reduce(
			(list, item) => {
				if (!!item.linkedObject.opponent && tempOpponents.indexOf(item.linkedObject.opponent) < 0) {
					list.push({ opponent: item.linkedObject.opponent });
					tempOpponents.push(item.linkedObject.opponent);
				}
				return list;
			},
			[...opponents]
		);
	}

	getUniqueDates(videos: VideoAsset[], formattedDates: FormattedDate[] = []): FormattedDate[] {
		const tempDate: string[] = formattedDates.map(date => date.formattedDate);
		let formattedDate: string;
		return videos.reduce(
			(list, item) => {
				formattedDate = this.formatDate(item);
				if (tempDate.indexOf(formattedDate) < 0) {
					list.push({ formattedDate });
					tempDate.push(formattedDate);
				}
				return list;
			},
			[...formattedDates]
		);
	}

	getUniquePlayers(videos: VideoAsset[], players: Player[]): SelectItem[] {
		return uniq(flatten(videos.map(({ playerIds }) => playerIds)))
			.map((playerId: string) => {
				const player = players.find(({ id }) => id === playerId);
				return player ? { label: player.displayName, value: player.id } : null;
			})
			.filter(player => !!player) as SelectItem[];
	}

	getUniqueStaffs(videos: VideoAsset[], staffs: SelectItem[] = []): SelectItem[] {
		const uniqueIds: string[] = staffs.map(staff => staff.value);
		return videos.reduce((list, video) => {
			if (video.staffs) {
				video.staffs.forEach((staff: Staff) => {
					if (uniqueIds.indexOf(staff.id) < 0) {
						uniqueIds.push(staff.id);
						list.push({ label: `${staff.firstName} ${staff.lastName}`, value: staff.id });
					}
				});
			}
			return list;
		}, staffs);
	}

	formatDate({ creationDate }: Partial<VideoAsset>): string {
		return moment(creationDate).format(getMomentFormatFromStorage());
	}

	assetToItem(video: VideoAsset, event?: Event): any {
		const { home, opponent, start } = event ? event : { home: true, opponent: '', start: video.creationDate };
		const totalPlayers = event ? this.whoPlayed(event) : [];
		const totalStaffs = event ? this.whoPlayedStaff(event) : [];
		return { ...video, home, opponent, date: start, event, totalPlayers, totalStaffs };
	}

	getVideoInfo(urlWithoutToken: string) {
		return new Observable<VideoInfo>(observer => {
			if (this.urlIsSupported(urlWithoutToken)) {
				const videoElement: HTMLVideoElement = this.renderer.createElement('video');

				videoElement.crossOrigin = 'Anonymous';
				const source = this.renderer.createElement('source');
				// source.type = 'video/mp4';
				source.src = this.azurePipe.transform(urlWithoutToken);
				this.renderer.appendChild(videoElement, source);
				const removeListener = this.renderer.listen(videoElement, 'loadedmetadata', () => {
					removeListener();
					this.getThumbnail(videoElement)
						.pipe(first())
						.subscribe((thumbnailUrl: string) => {
							observer.next({ thumbnailUrl, duration: videoElement.duration });
							observer.complete();
						});
				});

				// Load the video and show it
				videoElement.load();
			} else {
				observer.error('Video not supported');
			}
		});
	}

	getThumbnail(videoElement: HTMLVideoElement): Observable<string> {
		videoElement.crossOrigin = 'Anonymous';
		return new Observable<string>(observer => {
			const oldTime = videoElement.currentTime;
			// set the player at 25% of the duration
			videoElement.currentTime = videoElement.duration / 4;
			const removeListener = this.renderer.listen(videoElement, 'seeked', () => {
				removeListener();
				const base64 = this.video2base64(videoElement, 300);
				videoElement.currentTime = oldTime;
				defer(async () => this.imageService.uploadThumbnail(base64, 'test.jpeg')).subscribe((url: string) => {
					observer.next(url);
					observer.complete();
				});
			});
		});
	}

	private video2base64(videoElement: HTMLVideoElement, width: number = videoElement.videoWidth) {
		const canvas: HTMLCanvasElement = this.renderer.createElement('canvas');
		// Set canvas dimensions width and height with same ratio
		canvas.width = width;
		canvas.height = (width * videoElement.videoHeight) / videoElement.videoWidth;
		canvas
			.getContext('2d')
			?.drawImage(
				videoElement,
				0,
				0,
				videoElement.videoWidth,
				videoElement.videoHeight,
				0,
				0,
				canvas.width,
				canvas.height
			);
		const base64 = canvas.toDataURL();
		return base64;
	}

	private urlIsSupported(url: string) {
		const ext = getExtensionOfFileFromUrl(url);
		const videoSupport: any = this.supportedVideoFormat();
		return videoSupport[ext] !== false;
	}

	private supportedVideoFormat(): VideoSupport {
		let mp4: VideoExtensionSupport = false;
		let ogv: VideoExtensionSupport = false;
		let webm: VideoExtensionSupport = false;
		const temp = this.renderer.createElement('video');
		if (temp && !!temp.canPlayType) {
			mp4 = temp.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
			ogv = temp.canPlayType('video/ogg; codecs="theora,vorbis"');
			webm = temp.canPlayType('video/webm; codecs="vp8,vorbis"');
		}
		return { mp4, ogv, webm };
	}
	private whoPlayed(event: Event) {
		return event.format === 'game' ? this.whoPlayedMatch(event) : event.players;
	}

	private whoPlayedStaff(event: Event) {
		return event.format === 'game' ? [] : event.staff;
	}

	private whoPlayedMatch(event: Event): Player[] {
		let whoPlayed: Player[] = [];

		if (event.players) {
			const playerMatchStats = event._playerMatchStats || [];

			whoPlayed = event.players.filter(({ id }) => {
				const stats = playerMatchStats.find((matchStat: any) => matchStat.playerId === id);
				return !!stats && stats.minutesPlayed > 0;
			});
			if (whoPlayed.length === 0) {
				whoPlayed = event.players;
			}
		}

		return whoPlayed;
	}
}
