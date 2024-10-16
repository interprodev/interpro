import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Player,
	Staff,
	TeamSeasonApi,
	VideoAsset,
	VideoCategory,
	VideoGalleryConfig,
	videoGalleryConfigs
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ErrorService,
	VideoMatchesService,
	getId,
	VideoService
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { catchError, first, map } from 'rxjs/operators';
import { VideoGuard } from '../shared/services/video.guard';

@UntilDestroy()
@Component({
	template: `
		<div class="main">
			<div>
				<div class="row row-sidebar">
					<div class="col col-main">
						@if (playerList) {
							<iterpro-video-gallery
								[linkedId]="linkedId"
								[isNewFromRedirect]="isNewFromRedirect"
								[players]="playerList"
								[staffs]="staffList"
								[categories]="categories"
								[videos]="videoMatches$ | async"
								(close)="backToView(linkedId, $event)"
							/>
						}
					</div>
				</div>
			</div>
		</div>
	`
})
export class VideoGalleryContainerComponent extends EtlBaseInjectable implements OnInit {
	public playerList: Player[];
	public videoMatches$: Observable<VideoAsset[]>;
	public linkedId: string;
	public isNewFromRedirect: boolean;
	// empty array means all categories
	public categories: VideoCategory[] = [];
	config: VideoGalleryConfig;
	staffList: Staff[];

	constructor(
		private error: ErrorService,
		private teamSeasonApi: TeamSeasonApi,
		private notificationService: AlertService,
		private currentTeamService: CurrentTeamService,
		private videoGuard: VideoGuard,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private videoMatchesService: VideoMatchesService,
		private videoService: VideoService,
		injector: Injector
	) {
		super(injector);
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		return this.videoGuard.canDeactivate();
	}

	ngOnInit() {
		this.activatedRoute.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			this.initComponent(params.get('from'), params.get('id'), params.get('isNew') === 'true');
		});
		this.listenToUploadSuccess();
	}

	private listenToUploadSuccess() {
		this.videoService
			.listenReload()
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: boolean) => {
					if (result) {
						if (this.isNewFromRedirect && this.linkedId) {
							this.backToView(this.linkedId, true);
						} else {
							this.videoMatches$ = this.loadVideos(
								this.activatedRoute.snapshot.paramMap.get('from'),
								this.activatedRoute.snapshot.paramMap.get('id'),
								this.activatedRoute.snapshot.paramMap.get('isNew') === 'true'
							);
						}
					}
				}
			});
	}

	async backToView(id: string, redirect?: boolean) {
		if (redirect && !!this.config.backUrl) {
			await this.router.navigate([this.config.backUrl, { id }]);
		} else {
			await this.router.navigate(['/manager/video-gallery']);
			this.initComponent(null, null, false);
		}
	}

	private initComponent(from: string, linkedId: string, isNew: boolean) {
		this.videoMatches$ = this.loadVideos(from, linkedId, isNew);
		this.loadPlayers();
		this.loadStaffs();
	}

	private loadVideos(from: string, linkedId: string, isNewFromRedirect: boolean) {
		this.config = this.getConfiguration(from);
		this.categories = this.config.categories;
		this.linkedId = linkedId;
		this.isNewFromRedirect = isNewFromRedirect;
		return this.videoMatchesService.load(this.categories).pipe(
			first(),
			untilDestroyed(this),
			map((videos: VideoAsset[]) => {
				if (!from && this.linkedId) {
					return videos.filter(video => getId(video) === this.linkedId);
				}
				return this.linkedId
					? videos.filter(
							video =>
								(!this.config.model || video.linkedModel === this.config.model) && video.linkedId === this.linkedId
						)
					: videos;
			}),
			catchError(this.handleError.bind(this))
		);
	}

	private loadPlayers() {
		const selectedSeason = this.currentTeamService.getCurrentSeason();
		if (!selectedSeason) {
			return this.notificationService.notify('warn', 'preferences', 'alert.noSeasonsFound');
		}
		const seasonId = selectedSeason.id;
		this.teamSeasonApi
			.getPlayers(seasonId, {
				fields: ['id', 'displayName', 'downloadUrl', 'archived']
			})
			.pipe(
				first(),
				untilDestroyed(this),
				map((players: Player[]) => {
					if (players.some(({ id }) => !id)) {
						this.notificationService.notify('error', 'navigator.tactics', 'alert.playerError', false);
					}
					this.playerList = players;
				}),
				catchError(this.handleError.bind(this))
			)
			.subscribe();
	}

	private loadStaffs() {
		const selectedSeason = this.currentTeamService.getCurrentSeason();
		if (!selectedSeason) {
			return this.notificationService.notify('warn', 'preferences', 'alert.noSeasonsFound');
		}
		const seasonId = selectedSeason.id;
		this.teamSeasonApi
			.getStaffs(seasonId, {
				fields: ['id', 'firstName', 'lastName', 'downloadUrl', 'archived', 'customerId']
			})
			.pipe(
				first(),
				untilDestroyed(this),
				map((staffs: Staff[]) => {
					if (staffs.some(({ id }) => !id)) {
						this.notificationService.notify('error', 'navigator.tactics', 'alert.playerError', false);
					}
					this.staffList = staffs;
				}),
				catchError(this.handleError.bind(this))
			)
			.subscribe();
	}

	private handleError(error: any) {
		this.error.handleError(error);
		return [];
	}

	private getConfiguration(from: string): VideoGalleryConfig {
		if (!from) return videoGalleryConfigs.default;
		return videoGalleryConfigs[from] ? videoGalleryConfigs[from] : videoGalleryConfigs.default;
	}
}
