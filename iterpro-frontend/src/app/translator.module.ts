import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { createTranslateLoader } from '@iterpro/shared/utils/common-utils';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: createTranslateLoader,
				deps: [HttpClient]
			}
		})
	]
})
export class TranslatorModule {}
