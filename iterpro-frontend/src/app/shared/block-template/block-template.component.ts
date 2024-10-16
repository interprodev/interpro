import { Component } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
	standalone: true,
	imports: [ProgressBarModule],
	template: `
		<div
			class="pflex-h-screen pflex-flex pflex-flex-column pflex-justify-content-center pflex-align-items-center"
			#blockTemplate
		>
			<img class="pflex-w-15rem" src="assets/img/logo/logo-text.svg" alt="iterpro logo" />
			<p-progressBar styleClass="loadingSpinner" class="pflex-mt-2 pflex-w-18rem pflex-h-1rem" mode="indeterminate" />
			<div class="pflex-text-xl pflex-mt-2">{{ message }}</div>
		</div>
	`
})
export class IterproBlockTemplateComponent {
	message: string;
}
