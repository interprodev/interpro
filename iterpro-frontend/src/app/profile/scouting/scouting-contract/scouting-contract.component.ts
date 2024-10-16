import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PlayerScouting } from '@iterpro/shared/data-access/sdk';
import { copyValue } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-contract',
	templateUrl: './scouting-contract.component.html',
	styleUrls: ['./scouting-contract.component.css']
})
export class ScoutingContractComponent implements OnInit, OnDestroy {
	@Input() player: PlayerScouting;
	@Input() editMode: boolean;
	types: any[] = [
		{ label: 'admin.contracts.type.inTeam', value: 'inTeam' },
		{ label: 'admin.contracts.type.inTeamOnLoan', value: 'inTeamOnLoan' },
		{ label: 'admin.contracts.type.trial', value: 'trial' }
	];
	currency: string;
	temp: any;

	readonly #translateService = inject(TranslateService);
	readonly #currentTeamService = inject(CurrentTeamService);

	ngOnDestroy() {}

	ngOnInit() {
		this.#translateService
			.getTranslation(this.#translateService.currentLang)
			.pipe(first(), untilDestroyed(this))
			.subscribe(res => {
				this.types = this.types.map(x => ({
					label: this.#translateService.instant(x.label),
					value: x.value
				}));
			});
		this.currency = this.#currentTeamService.getCurrency();
	}

	edit() {
		this.editMode = true;
		this.temp = copyValue(this.player.contractDetails);
	}

	discard() {
		this.editMode = false;
		this.player.contractDetails = copyValue(this.temp);
	}
}
