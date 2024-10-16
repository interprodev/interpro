import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProviderType, SearchResultTeam, Team, TeamGender } from '@iterpro/shared/data-access/sdk';
import { AutoCompleteComponent, PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	ProviderIntegrationService
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule, AutoCompleteComponent],
	selector: 'iterpro-third-party-team-seeker',
	templateUrl: './third-party-team-seeker.component.html',
	styleUrls: ['./third-party-team-seeker.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThirdPartyTeamSeekerComponent implements OnChanges {
	@Input() provider!: ProviderType;
	@Input() editable = false;
	@Input() teamName!: string;
	@Input() competitionIds: number[] = [];
	@Input() teamGender!: TeamGender;
	@Input() currentTeamGender!: TeamGender;

	@Output() teamSelect: EventEmitter<SearchResultTeam> = new EventEmitter<SearchResultTeam>();
	@Output() setTeamCrest: EventEmitter<SearchResultTeam> = new EventEmitter<SearchResultTeam>();

	teamsResult: SearchResultTeam[] = [];
	selectedTeam!: SearchResultTeam;
	isLoading!: boolean;
	tempInputValue!: string;

	constructor(
		private cdRef: ChangeDetectorRef,
		private alertService: AlertService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private providerIntegrationService: ProviderIntegrationService
	) {
		this.selectedTeam = { name: '', thirdPartyId: -1, crest: '', thirdPartyProvider: this.provider };
		// 1. Init component, Team Settato, passo l'ID, parte la ricerca e carica crest, emette ricerca che viene setatta negli altri stores.
		// 2. Cerco, parte la ricerca, quando seleziono emette ricerca che viene setatta negli altri stores.
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['teamName'] && this.teamName) {
			this.autocompleteSearch({ query: this.teamName }, true, true);
		}
	}

	onSelectTeam(value: SearchResultTeam) {
		this.teamSelect.emit(value);
	}

	autocompleteSearch({ query }: { query: string }, toSet = false, showSkeleton = false) {
		if (!query) return;
		const competitionIds = this.competitionIds || [];
		this.isLoading = showSkeleton;
		const obs$ =
			this.provider && this.provider !== 'Dynamic'
				? this.providerIntegrationService.withProviderApi(this.provider).teamSearch(query, competitionIds, this.teamGender || this.currentTeamGender)
				: of([]);
		this.blockUiInterceptorService
			.disableOnce(obs$)
			.pipe(first())
			.subscribe({
				next: (teams: Team[]) => this.setResults(query, teams, toSet),
				// tslint:disable-next-line: no-console
				error: error => {
					this.alertService.notify('warn', 'Team Seeker', `${query} : search failed`);
					void console.error(error);
				}
			});
	}

	private setResults(querySearched: string, teams: Team[], toSet = false) {
		const searchedCustomTeam = { name: querySearched, thirdPartyId: -1, crest: '', thirdPartyProvider: this.provider };
		const results = teams.map(({ name, crest, wyscoutId, instatId }) => ({
			name,
			crest,
			thirdPartyId: instatId || wyscoutId,
			thirdPartyProvider: this.provider
		}));
		const searchedTeam = this.findSearchedTeam(searchedCustomTeam.name, results);
		if (!searchedTeam) {
			this.teamsResult = [searchedCustomTeam, ...results];
		} else {
			this.teamsResult = results;
		}
		if (toSet) {
			this.selectedTeam = searchedTeam
				? searchedTeam
				: { name: querySearched, thirdPartyId: -1, crest: '', thirdPartyProvider: this.provider };
			this.setTeamCrest.emit(this.selectedTeam);
		}
		this.isLoading = false;
		this.cdRef.detectChanges();
	}

	private findSearchedTeam(value: string, selectables: SearchResultTeam[]) {
		return selectables.find((item: SearchResultTeam) => item.name.toLowerCase() === value.toLowerCase());
	}

	onKeyUp(inputValue: string) {
		this.tempInputValue = inputValue;
	}
}
