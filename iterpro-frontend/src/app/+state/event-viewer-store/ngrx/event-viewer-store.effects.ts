import { Injectable } from '@angular/core';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { InstatApi, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { CompetitionsConstantsService } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Observable, of } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { EventFormatService } from 'src/app/manager/planning/services/event-format.service';
import { RootStoreState } from '../../root-store.state';
import * as EventViewerStoreActions from './event-viewer-store.actions';
import * as EventViewerStoreSelectors from './event-viewer-store.selectors';

@Injectable()
export class EventViewerStoreEffects {
	inputEventChangedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(EventViewerStoreActions.inputEventChanged),
			withLatestFrom(this.store$.select(AuthSelectors.selectIsNationalClub)),
			map(([, nationalClub]) => {
				const availableFormats = (
					nationalClub
						? this.eventFormatService.getNationalClubSelectableFormats()
						: this.eventFormatService.getClubSelectableFormats()
				).map(({ label, value }) => ({
					label: this.translate.instant(label),
					value
				}));
				return EventViewerStoreActions.availableFormatsInitialized({ availableFormats });
			})
		)
	);

	eventFormatChangedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(EventViewerStoreActions.inputEventChanged, EventViewerStoreActions.eventFormatChanged),
			withLatestFrom(this.store$.select(EventViewerStoreSelectors.selectDate)),
			map(([, date]) => EventViewerStoreActions.eventDateUpdated({ date }))
		)
	);

	eventDateUpdatedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(EventViewerStoreActions.eventDateUpdated),
			withLatestFrom(
				this.store$.select(EventViewerStoreSelectors.selectSeasonId),
				this.store$.select(EventViewerStoreSelectors.selectEventSeason),
				this.store$.select(EventViewerStoreSelectors.selectFormat),
				this.store$.select(AuthSelectors.selectIsNationalClub),
				this.store$.select(AuthSelectors.selectTeam)
			),
			switchMap(([, , season, format, isNationalClub, team]) =>
				this.getCompetitions(format, isNationalClub, team, season).pipe(
					map((competitions: SelectItem[]) =>
						EventViewerStoreActions.competitionsInitialized({ competitions, seasonId: season.id })
					)
				)
			)
		)
	);

	constructor(
		private actions$: Actions,
		private store$: Store<RootStoreState>,
		private eventFormatService: EventFormatService,
		private competitionsService: CompetitionsConstantsService,
		private translate: TranslateService,
		private instatApi: InstatApi
	) {}

	private getCompetitions(
		format: string,
		isNationalClub: boolean,
		team: Team,
		season: TeamSeason
	): Observable<SelectItem[]> {
		let competitions = of([]);
		if (format === 'game') {
			competitions =
				season.competitionInfo.length === 0
					? this.getStandardGameFormats()
					: this.getSeasonCompetitionInfoSelectItems(season.competitionInfo, team);
		} else if (format === 'clubGame') {
			competitions = this.getStandardClubGameFormats();
		}
		return competitions;
	}

	private getStandardClubGameFormats(): Observable<SelectItem[]> {
		return of([
			{ label: this.translate.instant('event.format.nationalCup'), value: 'nationalCup' },
			{ label: this.translate.instant('event.format.nationalLeague'), value: 'nationalLeague' },
			{
				label: this.translate.instant('event.format.internationalCup'),
				value: 'internationalCup'
			},
			{ label: this.translate.instant('event.format.friendly'), value: 'friendly' }
		]);
	}

	private getStandardGameFormats(): Observable<SelectItem[]> {
		return of([
			{
				label: this.translate.instant('event.format.tournament'),
				value: 'tournament'
			},
			{
				label: this.translate.instant('event.format.tournament.qualifiers'),
				value: 'tournamentQualifiers'
			},
			{
				label: this.translate.instant('event.format.tournament.finalStages'),
				value: 'tournamentFinalStages'
			},
			{ label: this.translate.instant('event.format.friendly'), value: 'friendly' }
		]);
	}

	private getSeasonCompetitionInfoSelectItems(competitionInfo: any[], team: Team): Observable<SelectItem[]> {
		let obs$ = of([]);
		if (team.providerTeam === 'InStat') {
			obs$ = this.instatApi.getTeamsCompetitions(team.instatId);
		}
		return obs$.pipe(
			map(dynamicCompetitions => {
				return [
					...competitionInfo
						.map(info => {
							if (info.manual) return info;
							const comp = this.competitionsService.getCompetitionFromJson(info.competition);
							return !!comp ? comp : this.getCompetitionsFromDynamic(info, dynamicCompetitions);
						})
						.map(info => ({
							label: info.name ? this.translate.instant(info.name) : info.label,
							value: info.instatId || info.wyId || info.competition || info.value
						})),
					{ label: this.translate.instant('event.format.friendly'), value: 'friendly' }
				];
			})
		);
	}

	private getCompetitionsFromDynamic(info, competitions) {
		return !competitions || competitions.length === 0
			? info
			: competitions.find(({ value }) => info.competition === value);
	}
}
