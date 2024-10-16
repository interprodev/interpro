import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Team } from '@iterpro/shared/data-access/sdk';
import { CompetitionsConstantsService } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import {
	competitions,
	teamActions,
	teamActionsGoal
} from 'src/app/squads/squads-person/squads-person-legal/utils/contract-options';

@Component({
	selector: 'iterpro-team-performance-bonus',
	templateUrl: './team-performance-bonus.component.html',
	styleUrls: ['./team-performance-bonus.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TeamPerformanceBonusComponent),
			multi: true
		}
	]
})
export class TeamPerformanceBonusComponent implements ControlValueAccessor, OnInit {
	@Input() seasons: any[];
	@Input() _bonus: any;
	@Input() financial = false;
	@Input() team: Team;

	teamActions: any[] = teamActions;
	teamActionsGoal: any[] = teamActionsGoal;
	// teamActionsGoalDivision: any[] = [{ label: "first", value: "first" }, { label: "second", value: "second" }];
	competitions: any[] = competitions;

	constructor(
		private translate: TranslateService,
		private competitionsService: CompetitionsConstantsService,
		private currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.seasons = this.seasons.map(x => ({ label: x.name, value: x.name }));
		this.teamActions = this.teamActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActionsGoal = this.teamActionsGoal.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		// this.teamActionsGoalDivision = this.teamActionsGoalDivision.map(x => ({ label: this.translate.instant(x.label), value: x.value }));

		const currentSeason = this.currentTeamService.getCurrentSeason();
		const { competitionInfo = [], wyscoutAreas = [], instatAreas = [] } = currentSeason;
		const seasonCompetitions =
			competitionInfo.length > 0
				? competitionInfo.map(info => {
						const data = this.competitionsService.getCompetitionFromJson(info.competition) || info;
						return { label: this.translate.instant(data.name), value: data.wyId || data.competition };
				  })
				: wyscoutAreas.length > 0 || instatAreas.length > 0
				? this.competitionsService.getCompetitionsByAreas(currentSeason?.wyscoutAreas || []).map(c => ({
						label: this.translate.instant(c.label),
						value: c.value
				  }))
				: competitions.map(x => ({
						label: this.translate.instant(x.label),
						value: x.value
				  }));
		this.competitions = [
			{
				label: this.translate.instant('allActiveCompetitions'),
				value: 'allActiveCompetitions'
			},
			...seasonCompetitions
		];
	}

	get bonus() {
		return this._bonus;
	}

	set bonus(val) {
		this._bonus = val;
		this.propagateChange(this._bonus);
	}

	writeValue(value: any) {
		if (value) {
			this.bonus = value;
		}
	}

	propagateChange = (_: any) => {};

	registerOnChange(fn) {
		this.propagateChange = fn;
	}

	registerOnTouched() {}
}
