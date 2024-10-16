import { DecimalPipe } from '@angular/common';

import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Injector,
	Input,
	OnInit,
	Output
} from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	AttributeCategory,
	Customer,
	GOScore,
	Injury,
	LoopBackAuth,
	Match,
	Player,
	PlayerAttributesEntry,
	TacticsPlayerData,
	Team,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AvailabiltyService,
	ConstantService,
	ErrorService,
	RobustnessService,
	SportType,
	completeWithAdditionalFields,
	getCategoryValues,
	getLimb,
	getMomentFormatFromStorage,
	getNumericalAvg,
	playerAttributes,
	sortByName, getTeamsPlayerAttributes,getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Subscription, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ComparePlayersService } from './../../../profile/compare-players/compare-players.service';
import fields from './fields';
import { CloudUploadResult } from '@iterpro/shared/feature-components';

@UntilDestroy()
@Component({
	selector: 'iterpro-player-card-details',
	templateUrl: './player-card-details.component.html',
	styleUrls: ['./player-card-details.component.css']
})
export class PlayerCardDetailsComponent extends EtlBaseInjectable implements OnInit, AfterViewChecked {
	expectation: any;
	available: any;
	@Input() player: Player;
	@Input() match: Match;
	@Input() team: Team;
	@Input() user: Customer;
	@Input() injuryMapObj;
	@Input() tacticData: TacticsPlayerData;
	@Input() phase: string;
	@Input() sportType: SportType;

	@Output() onSave: EventEmitter<any> = new EventEmitter<any>();
	@Output() onClose: EventEmitter<any> = new EventEmitter<any>();

	age: number;
	attitudeScore: number;
	offensiveScore: number;
	defensiveScore: number;
	fields: any;
	seasons: TeamSeason[] = [];
	selectedSeason: TeamSeason;
	obs: Subscription[] = [];
	stats: any;
	activeTacticalMetrics: any;
	activePerformanceMetrics: any;
	service: ComparePlayersService;
	robustness: any;
	uploading = false;
	tags: SelectItem[] = [];
	currentTeam: any;
	rawRobustnessPlayer: any;
	injuries: Injury[] = [];
	reloading = false;
	offensive: any[] = [];
	defensive: any[] = [];
	attitude: any[] = [];

	constructor(
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private seasonApi: TeamSeasonApi,
		private robustnessService: RobustnessService,
		private notificationService: AlertService,
		private constantsService: ConstantService,
		private teamService: CurrentTeamService,
		private cdRef: ChangeDetectorRef,
		private decimalPipe: DecimalPipe,
		private error: ErrorService,
		private availabilityService: AvailabiltyService,
		injector: Injector
	) {
		super(injector);
		this.service = injector.get(ComparePlayersService);
	}

	ngAfterViewChecked() {
		this.cdRef.detectChanges();
	}

	ngOnInit() {
		this.currentTeam = this.teamService.getCurrentTeam();
		this.tags = this.constantsService.getVideoTags();
		this.phase =
			this.phase === '_offensive' ? this.translate.instant('OffensivePhase') : this.translate.instant('OefensivePhase');
		this.fields = fields;
		this.fields.technical.forEach(x => (x.title = this.translate.instant(x.title)));
		this.fields.technical = sortByName(this.fields.technical, 'title');
		this.fields.attitude.forEach(x => (x.title = this.translate.instant(x.title)));
		this.fields.attitude = sortByName(this.fields.attitude, 'title');
		this.age = moment().diff(moment(this.player.birthDate), 'year');
		this.setMetrics();

		this.seasonApi
			.find({
				where: { teamId: this.currentTeam.id },
				order: 'offseason ASC'
			})
			.pipe(
				untilDestroyed(this),
				mergeMap((seasons: any) => {
					this.seasons = seasons;
					this.selectedSeason = this.findSeason(this.match);
					const currentSeason = this.seasons.find(x =>
						moment().isBetween(moment(x.offseason), moment(x.inseasonEnd), 'day', '[]')
					);
					return this.robustnessService.profileRobustness(
						currentSeason.id,
						[this.player.id],
						currentSeason.offseason,
						currentSeason.inseasonEnd,
						this.etlPlayerService.getDurationField().metricName,
						2
					);
				})
			)
			.subscribe(
				(res: any) => {
					if (!this.selectedSeason)
						this.notificationService.notify('warn', 'navigator.tactics', 'alert.noSeasonForThisMatch', false);
					else {
						this.offensive = (this.team.playerAttributes || playerAttributes).filter(
							x => x.active && x.category === 'offensive'
						);
						this.defensive = (this.team.playerAttributes || playerAttributes).filter(
							x => x.active && x.category === 'defensive'
						);
						this.attitude = (this.team.playerAttributes || playerAttributes).filter(
							x => x.active && x.category === 'attitude'
						);
						const selectedAttributeEntry: PlayerAttributesEntry = this.getAttributes(this.player, this.team);
						if (selectedAttributeEntry) {
							this.offensiveScore = Number(this.getAvgValue(selectedAttributeEntry, 'offensive'));
							this.defensiveScore = Number(this.getAvgValue(selectedAttributeEntry, 'defensive'));
							this.attitudeScore = Number(this.getAvgValue(selectedAttributeEntry, 'attitude'));
						}
						const rawRobustness = res;
						this.rawRobustnessPlayer = this.player.id in rawRobustness ? rawRobustness[this.player.id] : null;
						this.robustness = this.service.getRobustness(rawRobustness, this.player.id);
						this.injuries = this.filterInjury(this.player.injuries, this.match);
						this.available = this.getAvailable(this.injuries);
						this.expectation =
							this.available.further === true
								? this.translate.instant('medical.infirmary.assessments.further')
								: this.available.expectation
								? moment(this.available.expectation).format(getMomentFormatFromStorage())
								: null;
					}
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	saveOrganizationTags($event) {
		this.tacticData.organizationVideoTags = $event;
		this.onSave.emit(this.tacticData);
	}

	saveTransitionTags($event) {
		this.tacticData.transitionVideoTags = $event;
		this.onSave.emit(this.tacticData);
	}

	getAvailable(injuries: Injury[]) {
		return this.availabilityService.getAvailability(injuries, moment().toDate());
	}

	filterInjury(injuries: Injury[], match: Match): Injury[] {
		return injuries.filter(inj => {
			if (
				moment(inj.date).startOf('day').isSameOrBefore(moment(match.date).startOf('day')) &&
				(!inj.endDate ||
					(inj.endDate && moment(inj.endDate).startOf('day').isSameOrAfter(moment(match.date).startOf('day'))))
			) {
				return inj;
			}
		});
	}

	closeDetails() {
		this.onClose.emit();
	}

	private getAvgValue(entry: PlayerAttributesEntry, category: AttributeCategory): string {
		return getNumericalAvg(10, getCategoryValues(entry, category), this.team.club.scoutingSettings);
	}

	private getAttributes(player: Player, team: Team): PlayerAttributesEntry {
		return completeWithAdditionalFields(last(player?.attributes || []), getTeamsPlayerAttributes([team]),
			'Player',
			this.team?.club?.scoutingSettings);
	}

	findSeason(match) {
		return this.seasons.find(x =>
			moment(this.match.date).isBetween(moment(x.offseason), moment(x.inseasonEnd), 'day', '[]')
		);
	}

	setMetrics() {
		this.activePerformanceMetrics = this.withMetrics(
			this.etlGpsService,
			getTeamSettings(this.user.teamSettings, this.currentTeam.id).metricsPerformance
		);
		this.activePerformanceMetrics = this.activePerformanceMetrics.map(x => {
			x.metric = x.metric.replace(/\./g, '_');
			return x.metric;
		});
		this.activeTacticalMetrics = this.withMetrics(
			this.etlPlayerService,
			getTeamSettings(this.user.teamSettings, this.currentTeam.id).metricsIndividualTactical
		);
		this.activeTacticalMetrics = this.activeTacticalMetrics.map(x => {
			x.metric = x.metric.replace(/\./g, '_');
			return x.metric;
		});
	}

	withMetrics(service, metrics) {
		const mapping = service.getMetricsMapping();
		return metrics.map(metric => {
			const m = mapping.find(x => x.metricName === metric);
			const label = m ? m.metricLabel : metric;
			return { metric, label };
		});
	}

	getPlayerPic() {
		return this.player.downloadUrl;
	}

	// TODO use server readiness logic
	getScoreValue(player: Player): number {
		return player.goScores && player.goScores[0] ? player.goScores[0].score : 0;
	}

	getCircleScore(player: Player): number {
		return this.availabilityService.getCurrentHealthstatusScore(player);
	}

	getCircleColor(player: Player): string {
		return this.availabilityService.getCurrentHealthStatusColor(player);
	}

	getStatusClass() {
		if (this.playerNotAvailable() === true) return 'fa-ambulance';
		else if (this.playerBeCareful() === true) return 'fa-exclamation-triangle';
		else if (this.arrowUp() === true) return 'fa-arrow-up';
		else if (this.arrowDown() === true) return 'fa-arrow-down';
		else if (this.noScores() === true) return '';
		else return 'fa-minus';
	}

	noScores(): boolean {
		if (this.player.goScores.length <= 1) return false;
	}

	playerNotAvailable(): boolean {
		if (this.available) {
			return this.available.available === 'no';
		} else return false;
	}

	playerBeCareful(): boolean {
		if (this.available) {
			return this.available.available === 'careful';
		} else return false;
	}

	arrowUp(): boolean {
		if (this.player?.goScores && this.player?.goScores[1]) {
			if (this.player.goScores[0].score - this.player.goScores[1].score > 15) {
				return true;
			} else {
				return this.checkColorDiffIncr(this.player.goScores[0], this.player.goScores[1]);
			}
		} else {
			return false;
		}
	}

	checkColorDiffIncr(go1: GOScore, go2: GOScore): boolean {
		if (this.availabilityService.getReadinessColor(go2) === 'red') {
			if (
				this.availabilityService.getReadinessColor(go1) === 'yellow' ||
				this.availabilityService.getReadinessColor(go1) === 'green'
			) {
				return true;
			} else {
				return false;
			}
		} else if (this.availabilityService.getReadinessColor(go2) === 'yellow') {
			if (this.availabilityService.getReadinessColor(go1) === 'green') {
				return true;
			} else {
				return false;
			}
		}
	}

	arrowDown(): boolean {
		if (this.player?.goScores && this.player?.goScores[1]) {
			if (this.player.goScores[0].score - this.player.goScores[1].score < -15) {
				return true;
			} else {
				return this.checkColorDiffDecr(this.player.goScores[0], this.player.goScores[1]);
			}
		} else {
			return false;
		}
	}

	checkColorDiffDecr(go1: GOScore, go2: GOScore): boolean {
		if (this.availabilityService.getReadinessColor(go2) === 'green') {
			if (
				this.availabilityService.getReadinessColor(go1) === 'yellow' ||
				this.availabilityService.getReadinessColor(go1) === 'red'
			) {
				return true;
			} else {
				return false;
			}
		} else if (this.availabilityService.getReadinessColor(go2) === 'yellow') {
			if (this.availabilityService.getReadinessColor(go1) === 'red') {
				return true;
			} else {
				return false;
			}
		}
	}

	start = () => {
		this.uploading = true;
	};

	completedOrg(event: CloudUploadResult) {
		this.uploading = false;
		this.tacticData.organizationVideoUrl = event.downloadUrl;
		this.onSave.emit(this.tacticData);
		this.reloadResources();
	};

	completedTran(event: CloudUploadResult) {
		this.uploading = false;
		this.tacticData.transitionVideoUrl = event.downloadUrl;
		this.onSave.emit(this.tacticData);
		this.reloadResources();
	};

	onSizeError = () => {
		this.notificationService.notify(
			'error',
			this.translate.instant('navigator.profile'),
			'attributes.videoTooBig',
			false
		);
	};

	// force to update the video player and it's source
	private reloadResources() {
		this.reloading = true;
		timer(10).subscribe(() => (this.reloading = false));
	}

	getColorAvailable(av) {
		if (av && av.available === 'yes') return 'green';
		if (av && av.available === 'careful') return 'yellow';
		if (av && av.available === 'no') return 'red';
	}

	updateCommentsTran(comments) {
		this.tacticData.transitionComments = comments;
		this.onSave.emit(this.tacticData);
	}

	updateCommentsOrg(comments) {
		this.tacticData.organizationComments = comments;
		this.onSave.emit(this.tacticData);
	}

	getRobustnessValue(key) {
		const fullkey = `player.robustness.${key}`;
		return this.robustness && (this.robustness[fullkey] || this.robustness[fullkey] === 0)
			? this.robustness[fullkey]
			: '-';
	}

	getPipedRobustValue(key, pipeParams) {
		const value = this.getRobustnessValue(key);

		return typeof value === 'string' ? value : this.decimalPipe.transform(value, pipeParams);
	}

	getIconTitle(player) {
		if (this.playerNotAvailable() === true) {
			const exp = this.playerAvailabilityWithReturn();
			if (exp === false)
				return this.translate.instant('playerCard.tooltip.notAvailableFurther', { value: player.displayName });
			else
				return this.translate.instant('playerCard.tooltip.notAvailableExpected', {
					value: player.displayName,
					value1: moment(exp).format(getMomentFormatFromStorage())
				});
		} else if (this.playerBeCareful() === true)
			return this.translate.instant('playerCard.tooltip.beCareful', {
				value: player.displayName
			});
		else if (this.arrowUp())
			return this.translate.instant('playerCard.tooltip.improving', {
				value: player.displayName
			});
		else if (this.arrowDown())
			return this.translate.instant('playerCard.tooltip.decreasing', {
				value: player.displayName
			});
		else {
			const color = this.getCircleColor(player);
			if (color === '#FF4343')
				return this.translate.instant('playerCard.tooltip.notAvailable', {
					value: player.displayName
				});
			else if (color === 'red')
				return this.translate.instant('playerCard.tooltip.low', {
					value: player.displayName
				});
			else if (color === 'yellow')
				return this.translate.instant('playerCard.tooltip.average', {
					value: player.displayName
				});
			else if (color === 'green')
				return this.translate.instant('playerCard.tooltip.optimal', {
					value: player.displayName
				});
			else return '';
		}
	}

	playerAvailabilityWithReturn() {
		if (this.available) {
			if (this.available.available === 'no') return this.available.expected;
			return null;
		} else return null;
	}

	getLimb() {
		return getLimb(this.sportType);
	}
}
