import { v4 as uuid } from 'uuid';
import { VideoAsset } from '../../lib';

export class MultiFileUpload {
	public status: UploadStatus;
	public progress: number;
	id: string;
	name: string;
	url!: string;
	thumbnailBase64!: string;
	thumbnailUrl!: string;
	duration!: number;
	videoId!: string;
	basicVideoAsset!: VideoAsset;

	constructor(public file: File, basicVideoAsset: VideoAsset) {
		this.id = uuid();
		this.name = file.name;
		this.status = UploadStatus.NotStarted;
		this.progress = 0;
		this.basicVideoAsset = basicVideoAsset;
	}

	async setThumbnailBase64AndDuration(file: File) {
		const { cover, duration } = await getVideoCoverAndDuration(file, 1.5);
		this.thumbnailBase64 = cover;
		this.duration = duration;
	}

	public updateProgress(progress: number) {
		this.progress = progress;
		this.status = UploadStatus.Uploading;
	}

	public completed(url: string, thumbnailUrl: string) {
		this.url = url;
		this.thumbnailUrl = thumbnailUrl;
		this.progress = 99;
		this.status = UploadStatus.Done;
	}

	public saved(videoId: string) {
		this.videoId = videoId;
		this.progress = 100;
		this.status = UploadStatus.VideoSaved;
	}

	public failed() {
		this.progress = 0;
		this.status = UploadStatus.Error;
	}

	get isWaitingForUpload(): boolean {
		return this.status === UploadStatus.NotStarted;
	}

	get isUploadDone(): boolean {
		return this.status === UploadStatus.Done;
	}

	get isVideoSaved(): boolean {
		return this.status === UploadStatus.VideoSaved;
	}
}

export enum UploadStatus {
	NotStarted = 0,
	Uploading = 1,
	Done = 2,
	Error = 3,
	NotInQueue = 5,
	VideoSaved = 6
}

export const getVideoCoverAndDuration = (
	file: File | Blob,
	seekTo = 0.0
): Promise<{ cover: string; duration: number }> => {
	return new Promise((resolve, reject) => {
		// load the file to a video player
		const videoPlayer = document.createElement('video');
		videoPlayer.setAttribute('src', URL.createObjectURL(file));
		videoPlayer.load();
		videoPlayer.addEventListener('error', ex => {
			reject('error when loading video file' + ex);
		});
		// load metadata of the video to get video duration and dimensions
		videoPlayer.addEventListener('loadedmetadata', () => {
			// seek to user defined timestamp (in seconds) if possible
			if (videoPlayer.duration < seekTo) {
				reject('video is too short.');
				return;
			}
			// delay seeking or else 'seeked' event won't fire on Safari
			setTimeout(() => {
				videoPlayer.currentTime = seekTo;
			}, 200);
			// extract video thumbnail once seeking is complete
			videoPlayer.addEventListener('seeked', () => {
				// define a canvas to have the same dimension as the video
				const canvas = document.createElement('canvas');
				canvas.width = videoPlayer.videoWidth;
				canvas.height = videoPlayer.videoHeight;
				// draw the video frame to canvas
				const ctx = canvas.getContext('2d');
				ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
				// return the canvas image as a blob
				resolve({ cover: ctx.canvas.toDataURL('image/jpeg'), duration: videoPlayer.duration });
			});
		});
	});
};
