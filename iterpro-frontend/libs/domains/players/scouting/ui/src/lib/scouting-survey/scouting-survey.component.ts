import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Answer, SurveyQuestion } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, FormsModule, TranslateModule],
	selector: 'iterpro-scouting-survey',
	templateUrl: './scouting-survey.component.html',
	styleUrls: ['./scouting-survey.component.scss']
})
export class ScoutingSurveyComponent implements OnChanges {
	@Input() question!: SurveyQuestion;
	@Input() editable = false;
	@Output() update: EventEmitter<Answer> = new EventEmitter<Answer>();

	readonly #translateService = inject(TranslateService);

	value!: Answer | undefined;
	options: SelectItem<string>[] = [
		{ value: 'no', label: this.#translateService.instant('no') },
		{ value: 'yes', label: this.#translateService.instant('yes') }
	];

	ngOnChanges() {
		this.value = this.question?.answer;
	}

	onChangeValue(event: SelectItem) {
		this.update.emit(event.value);
	}
}
