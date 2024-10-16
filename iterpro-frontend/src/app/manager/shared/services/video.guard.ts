import { Injectable } from '@angular/core';
import { EditModeService } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { Observable, Observer, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class VideoGuard {
	constructor(
		public service: EditModeService,
		private translate: TranslateService,
		private confirmationService: ConfirmationService
	) {}

	canDeactivate() {
		return this.service.editMode ? this.dialog() : of(true);
	}

	private dialog() {
		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.service.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}
}
