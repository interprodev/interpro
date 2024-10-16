import { Pipe } from '@angular/core';
import { VideoAsset } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'playerReportVideos'
})
export class PlayerReportVideosPipe {
	transform(videos: VideoAsset[], playerId: string, eventId: string): VideoAsset[] {
		return (videos || []).filter(({ playerIds, linkedId }) => playerIds.includes(playerId) && linkedId === eventId);
	}
}
