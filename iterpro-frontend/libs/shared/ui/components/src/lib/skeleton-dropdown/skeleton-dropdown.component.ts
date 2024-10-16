import { Component } from '@angular/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { SelectItem } from 'primeng/api';

@Component({
	selector: 'iterpro-skeleton-dropdown',
	standalone: true,
	imports: [
		PrimeNgModule,
		TranslateModule,
		FormsModule
	],
	templateUrl: './skeleton-dropdown.component.html'
})
export class SkeletonDropdownComponent {
	fakeItem = true;
	fakeOptions: SelectItem[] = [
		{ label: 'Loading...', value: true }
	];
}
