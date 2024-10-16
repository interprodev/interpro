import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BlobDeleteIfExistsResponse, BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { environment } from '@iterpro/config';
import { Attachment, AzureStorageApi, SDKStorage } from '@iterpro/shared/data-access/sdk';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CURRENT_TEAM_KEY, LOGIN_STORE, SAS_TOKEN_KEY } from '../constants/login.constants';
import { ErrorService } from './error.service';

const extRE = /(?:\.([^.]+))?$/;
const getExt = (filename: string): string => {
	const ext = extRE.exec(filename);
	return ext ? ext[1] || '' : '';
};

@Injectable({
	providedIn: 'root'
})
export class AzureStorageService {
	public token$: Subject<any> = new Subject<any>();

	constructor(
		private storageService: SDKStorage,
		private azureStorageApi: AzureStorageApi,
		private http: HttpClient,
		private errorService: ErrorService
	) {}

	init() {
		// call it after loopback was loaded
		const authStore = this.getLoginStore();
		if (authStore) {
			const token = authStore[SAS_TOKEN_KEY];
			const currentTeam = authStore[CURRENT_TEAM_KEY];

			if (token) {
				if (!this.isExpired(token)) this.setToken(token);
				else this.refreshToken(currentTeam.clubId).then();
			}
		}
	}

	getLoginStore(): any {
		return this.storageService.get(LOGIN_STORE);
	}

	refreshToken(clubId: string): Promise<any> {
		return new Promise(resolve => {
			this.azureStorageApi.getSasToken(clubId).subscribe({
				next: (sasToken: any) => {
					this.setToken(sasToken);
					resolve(sasToken);
				},
				error: (error: Error) => void console.error(error)
			});
		});
	}

	setToken(token: any) {
		this.setTokenInStorage(token);
		this.setTokenInStore(token);
	}

	updateSasTokenFromStore(storeToken: any) {
		const authStore = this.getLoginStore();
		const storageToken = authStore[SAS_TOKEN_KEY];
		if (storageToken && storageToken.token.signature !== storeToken.token.signature) {
			this.setTokenInStorage(storageToken);
		}
	}

	getUrlWithSignature(url: string): string {
		const authStore = this.getLoginStore();
		const { signature } = authStore[SAS_TOKEN_KEY];
		return `${url}?${signature || ''}`;
	}

	async uploadBrowserFileToAzureStore(fileContent: File): Promise<string> {
		const authStore = this.getLoginStore();
		const storageToken = authStore[SAS_TOKEN_KEY];
		const currentTeam = authStore[CURRENT_TEAM_KEY];

		if (this.isExpired(storageToken)) {
			await this.refreshToken(currentTeam.clubId);
		}
		const blockBlobClient = this.getBlockBlobClient(fileContent);
		await blockBlobClient.uploadData(fileContent, {
			blockSize: 4 * 1024 * 1024,
			concurrency: 20
		});
		return blockBlobClient.url.substring(0, blockBlobClient.url.indexOf('?'));
	}

	private getBlobNameFromDownloadUrl(downloadUrl: string, containerName: string): string {
		// Input example: https://iterprocdn.blob.core.windows.net/club5d405dff6337e808e8b610cbdevelopment/f70d77dc-fc2e-4c85-b443-a64af1b2a54e.mp4
		// Output example: f70d77dc-fc2e-4c85-b443-a64af1b2a54e.mp4
		return downloadUrl.split(containerName)[1].split('/')[1];
	}

	private getContainerClient(): ContainerClient {
		const authStore = this.getLoginStore();
		const token = authStore[SAS_TOKEN_KEY];
		const blobSasUrl = this.getUrlWithSignature(environment.STORAGE_URL);
		const blobServiceClient = new BlobServiceClient(blobSasUrl);
		return blobServiceClient.getContainerClient(token.containerName);
	}

	async deleteFileFromAzureStore(downloadUrl: string): Promise<BlobDeleteIfExistsResponse> {
		let authStore = this.getLoginStore();
		let storageToken = authStore[SAS_TOKEN_KEY];
		const currentTeam = authStore[CURRENT_TEAM_KEY];

		if (storageToken) {
			await this.refreshToken(currentTeam.clubId);
		}

		authStore = this.getLoginStore();
		storageToken = authStore[SAS_TOKEN_KEY];

		const blobName = this.getBlobNameFromDownloadUrl(downloadUrl, storageToken.containerName);
		const containerClient = this.getContainerClient();
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);

		return blockBlobClient.deleteIfExists();
	}

	async downloadFile(attachment: Attachment | any) {
		const authStore = this.getLoginStore();
		const storageToken = authStore[SAS_TOKEN_KEY];
		const currentTeam = authStore[CURRENT_TEAM_KEY];

		if (storageToken) {
			await this.refreshToken(currentTeam.clubId);
		}

		const urlWithSignature = this.getUrlWithSignature(attachment.downloadUrl || attachment.imageUrl || attachment.url);
		this.http
			.get(urlWithSignature, {
				observe: 'response',
				responseType: 'blob'
			})
			.subscribe({
				next: (data: any) => {
					const blob = new Blob([data.body]);
					saveAs(blob, attachment.name || attachment.filename);
				},
				error: (error: Error) => this.errorService.handleError(error)
			});
	}

	private setTokenInStorage(token: any): void {
		const authStore = this.storageService.get(LOGIN_STORE);
		authStore[SAS_TOKEN_KEY] = token;
		this.storageService.set(LOGIN_STORE, authStore);
	}

	private setTokenInStore(token: any): void {
		this.token$.next(token);
	}

	private getBlockBlobClient(fileContent: File | Attachment): BlockBlobClient {
		const containerClient = this.getContainerClient();
		return containerClient.getBlockBlobClient(`${uuidv4()}.${getExt(fileContent.name)}`);
	}

	private isExpired(clubToken: any): boolean {
		return (
			!clubToken ||
			(clubToken && !(clubToken.token.expiryTime || clubToken.token.expiresOn)) ||
			(clubToken &&
				(clubToken.token.expiryTime || clubToken.token.expiresOn) &&
				moment().isAfter(moment(clubToken.token.expiryTime || clubToken.token.expiresOn)))
		);
	}
}
