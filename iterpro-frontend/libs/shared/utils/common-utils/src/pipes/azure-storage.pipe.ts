import { Pipe, PipeTransform, inject } from '@angular/core';
import { AzureStorageService } from '../services/azure-storage.service';
import { isStagingEnvironmentAndProdResource } from '../utils/functions/uploads/uploads.functions';

@Pipe({ name: 'azureUrl', standalone: true })
export class AzureStoragePipe implements PipeTransform {
	readonly #azureStorageService = inject(AzureStorageService);

	transform(value: string | null): string | undefined {
		return value && !isStagingEnvironmentAndProdResource(value)
			? this.#azureStorageService.getUrlWithSignature(value)
			: undefined;
	}
}
