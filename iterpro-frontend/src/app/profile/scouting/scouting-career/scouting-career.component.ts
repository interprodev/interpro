import { DecimalPipe } from '@angular/common';
import { Component, Injector, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PlayerScouting } from '@iterpro/shared/data-access/sdk';
import { CustomCurrencyPipe } from '@iterpro/shared/ui/pipes';
import {
	ErrorService,
	ExchangeService,
	ProviderIntegrationService,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-career',
	templateUrl: './scouting-career.component.html',
	styleUrls: ['./scouting-career.component.css'],
	providers: [CustomCurrencyPipe]
})
export class ScoutingCareerComponent extends EtlBaseInjectable implements OnChanges {
	@Input() player: PlayerScouting;
	transfers: any[] = [];
	career: any[] = [];
	private clubCareer: any[] = [];
	private nationalCareer: any[] = [];

	showNational = false;

	constructor(
		private providerIntegrationService: ProviderIntegrationService,
		private currentTeamService: CurrentTeamService,
		private exchangeService: ExchangeService,
		private error: ErrorService,
		private decimal: DecimalPipe,
		injector: Injector
	) {
		super(injector);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			if (this.player) {
				this.load();
			}
		}
	}

	toggleNational() {
		this.showNational = !this.showNational;
		this.career = this.showNational ? this.nationalCareer : this.clubCareer;
	}

	private load() {
		if (this.player[this.etlPlayerService.getProviderIdField()]) {
			this.providerIntegrationService
				.getPlayerCareerTransfers(this.player)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: ({ transfers, career }) => {
						this.transfers =
							transfers && transfers.length > 0 ? sortByDateDesc(transfers, 'startDate').slice(0, 5) : [];
						this.getExchangeRates();
						this.clubCareer = this.careerOfType('club', career);
						this.nationalCareer = this.careerOfType('international', career);
						this.career = this.clubCareer;
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private careerOfType(type: 'club' | 'international', career: any[]) {
		return career && career.length > 0
			? career.filter(({ competition }) => !!competition && competition.type.toString() === type).reverse()
			: [];
	}

	private getExchangeRates() {
		const currencyCode = this.currentTeamService.getCurrencyCode();
		if (currencyCode !== 'EUR') {
			this.exchangeService
				.exchange(currencyCode)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: (res: any) => {
						const currency = this.currentTeamService.getCurrency();
						const rate = res.rates[currencyCode];
						this.transfers.forEach(x => {
							x.currency = currencyCode;
							x.value = `${currency} ${this.decimal.transform(x.value * rate, '1.0')}`;
						});
					},
					error: (error: Error) => void this.error.handleError(error)
				});
		}
	}
}
