import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { TestComponent } from './../../shared/test/test.component';
import { ExaminationComponent } from './examination.component';

@NgModule({
	imports: [CommonModule, FormsModule, BlockUIModule, TranslateModule, PrimeNgModule, TestComponent],
	declarations: [ExaminationComponent]
})
export class ExaminationModule {}
