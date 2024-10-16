import { Pipe, PipeTransform } from '@angular/core';
import { getExtensionFromFileName } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'fileType'
})
export class FileTypePipe implements PipeTransform {
	transform(attachmentName: string): string | undefined {
		return getExtensionFromFileName(attachmentName)?.toUpperCase();
	}
}
