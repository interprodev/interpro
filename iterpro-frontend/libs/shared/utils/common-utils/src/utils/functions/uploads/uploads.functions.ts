import { environment } from '@iterpro/config';
import { Customer, ExtendedAttachment, FileAttachment } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';

export const getExtensionFromFileName = (filename: string): string | null => {
	const parts = (filename || '').split('.');
	return parts && parts.length > 1 ? parts[parts.length - 1] : null;
};

export const getTypeFromFileName = (filename: string): string => {
	const ext = getExtensionFromFileName(filename);
	return getTypeFromExtension(ext);
};

export const getTypeFromExtension = (extension: string | null): string => {
	if (extension) {
		switch (extension.toLowerCase()) {
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'bmp':
			case 'png':
				return 'image';
			case 'mp4':
			case 'mov':
				return 'video';
		}
	}
	return 'file';
};

export async function getPreview(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader: FileReader = new FileReader();
		reader.onload = e => {
			resolve(reader.result as string);
		};
		reader.onerror = e => {
			reject(e);
		};
		reader.readAsDataURL(file);
	});
}

export async function getAttachments(event: Event): Promise<FileAttachment[]> {
	const attachments: FileAttachment[] = [];
	const target: HTMLInputElement = event.target as HTMLInputElement;
	if (target.files) {
		for (let i = 0; i <= target.files.length; i += 1) {
			const file: File = target.files[i];
			if (file) {
				const type: string = getTypeFromFileName(file.name);
				const name: string = file.name;
				const attachment: ExtendedAttachment = {
					type,
					name,
					url: '',
					date: moment().toDate(),
					downloadUrl: '',
					externalUrl: '',
					streamingUrl: '',
					sharedStaffs: [],
					sharedPlayers: [],
					sharedStaffIds: [],
					sharedPlayerIds: [],
					author: new Customer(),
					authorId: null,
					id: uuid()
				};
				if (type === 'image') {
					const url: string = await getPreview(file);
					const imgUrl = `${url}`;
					attachment.url = imgUrl;
				}
				const fileAttachment: FileAttachment = {
					file,
					attachment
				};
				attachments.push(fileAttachment);
			}
		}
	}

	return attachments;
}

export function bytesToMegaBytes(bytesSize: number): string {
	return (bytesSize / (1024 * 1024)).toFixed(2);
}

export function megaBytesToBytes(megaBytesSize: number): number {
	return megaBytesSize * 1024 * 1024;
}

export function isStagingEnvironmentAndProdResource(url: string): boolean {
	return !environment.production && url.includes('production');
}

export function isBase64Image(url: string): boolean {
	return url?.includes('data:image');
}

export const base64ToFile = (base64Image: string, filename: string): File => {
	// Split the base64 string into the metadata and the actual data
	const arr = base64Image.split(',');
	const mime = arr[0].match(/:(.*?);/)?.[1] || '';
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new File([u8arr], filename, { type: mime });
};

export const downloadFromBase64 = (base64: string, filename: string): void => {
	const link = document.createElement('a');
	link.download = filename;
	link.href = base64;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
