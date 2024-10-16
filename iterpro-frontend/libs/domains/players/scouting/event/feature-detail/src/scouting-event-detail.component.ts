import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
	SandBoxDetailService,
	SandBoxGameReportService,
	ScoutingTeamSide
} from '@iterpro/players/scouting/event/sand-box';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Attachment, ProviderType, ScoutingGame, SearchResultTeam, TeamGender } from '@iterpro/shared/data-access/sdk';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import {
	EditorDialogComponent,
	ThirdPartyTeamSeekerComponent,
	TimepickerComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	CompetitionsConstantsService,
	FormatDateUserSettingPipe,
	TINY_EDITOR_OPTIONS
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { Observable, of } from 'rxjs';
import { InvalidDatePipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		ThirdPartyTeamSeekerComponent,
		MultipleFileUploadComponent,
		FormatDateUserSettingPipe,
		TimepickerComponent,
		InvalidDatePipe
	],
	selector: 'iterpro-scouting-event-detail',
	templateUrl: './scouting-event-detail.component.html',
	styleUrls: ['./scouting-event-detail.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventDetailComponent implements OnChanges {
	@Input() isScoutingAdmin!: boolean;
	@Input() matchProvider!: ProviderType;
	@Input() game!: ScoutingGame;
	@Input() competitionIds!: number[];
	@Input() isCustomTeamEditable!: boolean;
	@Input() isOnEdit!: boolean;
	@Input() isEditable!: boolean;
	@Input() gameName!: string;
	@Input() gameDuration!: string;
	@Input() lastAuthor!: string;
	@Input() gamesInCompetitions!: SelectItem[];
	@Input() customersOptions!: SelectItem[];
	@Input() attachmentDialogVisibility!: boolean;
	@Input() isLeftPanelMaximized!: boolean;
	@Input() isFuture!: boolean;
	@Input() homeTeamGender!: TeamGender;
	@Input() awayTeamGender!: TeamGender;
	@Input() currentTeamGender!: string;
	@Output() toggleLeftPanelMaximize: EventEmitter<void> = new EventEmitter<void>();

	competitions$!: Observable<SelectItem[]>;
	teamsWithoutCompetitions$: Observable<any>;
	teamWithoutCompetition: any;

	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;

	constructor(
		private dialogService: DialogService,
		private teamService: CurrentTeamService,
		private translateService: TranslateService,
		private sandBoxDetail: SandBoxDetailService,
		private sendBoxGameReportList: SandBoxGameReportService,
		private competitionsService: CompetitionsConstantsService
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes && changes['matchProvider']) {
			this.initCompetitions();
		}
	}

	private initCompetitions() {
		const { club } = this.teamService.getCurrentTeam();
		const matchProvider = this.matchProvider;
		let competitions: SelectItem[] = [{ label: 'Custom Competition', value: -1 }];
		if (matchProvider !== 'Dynamic' || club.b2cScouting) {
			competitions = [...competitions, ...this.competitionsService.withProvider(matchProvider).getCompetitions()];
		}
		this.competitions$ = of(competitions);
	}

	onUpdateGameModel(property: string, value: any) {
		const game: Partial<ScoutingGame> = { [property]: value };
		this.sandBoxDetail.gameModelUpdated.next(game);
	}

	onChangeGameStartDate(start: Date) {
		this.sandBoxDetail.changeGameStartDate$.next(start);
	}

	onSelectCompetition(competitionId: number) {
		this.sandBoxDetail.selectCompetition$.next(competitionId);
	}

	onSelectTeamWithoutCompetition($event: any) {
		console.debug($event);
	}

	onSelectGameFromCompetition(matchId: number | string) {
		this.sandBoxDetail.selectGameFromCompetition$.next(Number(matchId));
	}

	selectClubGameTeam(team: SearchResultTeam, side: ScoutingTeamSide) {
		if (team) {
			this.sendBoxGameReportList.selectCustomTeam$.next({ team, side, crest: team.crest });
			this.sandBoxDetail.selectCustomTeam$.next({ team, side, crest: team.crest });
		}
	}

	setTeamCrest(team: SearchResultTeam, side: 'home' | 'away') {
		this.sandBoxDetail.selectCustomTeam$.next({ team, side, crest: team.crest });
	}

	onSendEmailIconClick() {
		this.sandBoxDetail.sendEmailClicked$.next(true);
	}

	onAttachmentDialogButtonClick() {
		this.sandBoxDetail.attachmentDialogShowButtonClicked.next(true);
	}

	onSaveAttachmentDialogButtonClick(event: Attachment[]) {
		this.sandBoxDetail.attachmentDialogSaveButtonClicked.next({ ...this.game, _attachments: event });
	}

	onDiscardAttachmentDialogButtonClick() {
		this.sandBoxDetail.attachmentDialogDiscardButtonClicked.next(true);
	}

	openNotesDialog() {
		const ref = this.createEditorDialog(this.game.notes);
		ref.onClose.subscribe((notes: string) => {
			if (notes) {
				this.onUpdateGameModel('notes', notes);
			}
		});
	}

	private createEditorDialog(report: string): DynamicDialogRef {
		return this.dialogService.open(EditorDialogComponent, {
			data: { editable: this.isEditable, content: report },
			width: '50%',
			header: this.translateService.instant('medical.infirmary.assessments.notes'),
			closable: !this.isEditable
		});
	}

	getCustomerName(customerId: string): string {
		const displayName = (this.customersOptions || []).find(({ value }) => value === customerId)?.label;
		return displayName ? displayName : customerId;
	}
}
