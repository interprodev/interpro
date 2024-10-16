import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { SessionPlayerData } from '@iterpro/shared/data-access/sdk';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy()
@Component({
	selector: 'iterpro-rpe-survey',
	templateUrl: './rpe-survey.component.html',
	styleUrls: ['./rpe-survey.component.css']
})
export class RpeSurveyComponent implements OnInit, OnChanges, OnDestroy {
	@Input() session: SessionPlayerData;

	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteEmitter: EventEmitter<any> = new EventEmitter<any>();

	rpe: number;
	efforts: string[] = [];
	effortsNum: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

	constructor(private translate: TranslateService) {}

	ngOnDestroy() {}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(val => {
				this.efforts = [
					this.translate.instant('surveys.rpe.effort.0'),
					this.translate.instant('surveys.rpe.effort.1'),
					this.translate.instant('surveys.rpe.effort.2'),
					this.translate.instant('surveys.rpe.effort.3'),
					this.translate.instant('surveys.rpe.effort.4'),
					this.translate.instant('surveys.rpe.effort.5'),
					'',
					this.translate.instant('surveys.rpe.effort.6'),
					'',
					this.translate.instant('surveys.rpe.effort.7'),
					this.translate.instant('surveys.rpe.effort.8')
				];
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['session']) {
			this.rpe = this.session.rpe;
			this.rpe === null ? (this.rpe = 0) : (this.rpe = this.rpe);
		}
	}

	save() {
		this.session.rpe = this.rpe;
		this.saveEmitter.emit(this.session);
	}

	delete() {
		this.session.rpe = null;
		this.deleteEmitter.emit(this.session);
	}
}
