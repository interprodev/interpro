// TODO: remove from Loopback models and move to ./storage-connectors as a simple express module

const { v4: uuid } = require('uuid');
const moment = require('moment');
const { last } = require('lodash');
const { InternalError } = require('../../common/modules/error.js');
const {
	BlobServiceClient,
	StorageSharedKeyCredential,
	ContainerSASPermissions,
	generateBlobSASQueryParameters
} = require('@azure/storage-blob');

const CONNECTION_STRING = process.env.AZURESTORAGECONNECTIONSTRING;

module.exports = async function (AzureStorage) {
	AzureStorage.getSasToken = async function (clubId) {
		try {
			const club = await AzureStorage.app.models.Club.findById(clubId);
			const { clubToken } = club;
			if (isExpired(clubToken)) {
				const container = getContainerName(clubId);
				const clubToken = await generateSasToken(container);
				club.clubToken = clubToken;
				await club.save();
				return clubToken;
			} else return clubToken;
		} catch (e) {
			console.error(e);
			throw InternalError(e);
		}
	};

	AzureStorage.removeFile = async function (clubId, filename) {
		try {
			filename = last(filename.split('/')); // here I receive the complete URL, not just the filename
			console.log('\nDeleting from Azure storage as blob:\n\t', filename);
			const blobClient = getBlobClient(clubId, decodeURI(filename));
			await blobClient.deleteIfExists();
			return true;
		} catch (e) {
			throw InternalError('Error while removing file: ' + e);
		}
	};

	AzureStorage.uploadRawFile = async function (clubId, data, filename) {
		try {
			filename = filename || uuid();
			console.log('\nUploading to Azure storage as blob:\n\t', filename);
			const blobClient = getBlobClient(clubId, filename);
			const uploadResponse = await blobClient.upload(data, data.length);
			return uploadResponse._response.request.url;
		} catch (e) {
			throw InternalError('Error while uploading raw file ' + e);
		}
	};

	AzureStorage.downloadFile = async function (clubId, filename) {
		try {
			filename = last(filename.split('/')); // here I receive the complete URL, not just the filename
			console.log('\nDownloading from Azure storage as blob:\n\t', filename);
			const blobClient = getBlobClient(clubId, decodeURI(filename));
			const file = await blobClient.download();
			const buffer = await streamToBuffer(file.readableStreamBody);
			return String(buffer);
		} catch (e) {
			throw InternalError('Error while downloading file: ' + e);
		}
	};
};

function getContainerName(clubId) {
	return `club${clubId}${process.env.APP_ENV || process.env.AZURESTORAGEFORCEENV || 'dev'}`;
}

function getBlobClient(clubId, filename) {
	try {
		const containerName = getContainerName(clubId);
		const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
		const container = blobServiceClient.getContainerClient(containerName);
		const blob = container.getBlockBlobClient(filename);
		return blob;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

async function streamToBuffer(readableStream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		readableStream.on('data', data => {
			chunks.push(data instanceof Buffer ? data : Buffer.from(data));
		});
		readableStream.on('end', () => {
			resolve(Buffer.concat(chunks));
		});
		readableStream.on('error', reject);
	});
}

async function generateSasToken(containerName) {
	const sharedKeyCredential = new StorageSharedKeyCredential(
		process.env.AZURESTORAGEACCOUNT,
		process.env.AZURESTORAGEACCESSKEY
	);
	const token = generateBlobSASQueryParameters(
		{
			containerName,
			permissions: ContainerSASPermissions.parse('racwdl').toString(),
			expiresOn: moment().add(48, 'hours').toDate()
		},
		sharedKeyCredential
	);
	const signature = token.toString();
	const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(containerName);

	try {
		await containerClient.create();
	} catch (e) {
		console.error(e);
	}

	return {
		token,
		containerName,
		signature
	};
}

function isExpired(clubToken) {
	return (
		!clubToken ||
		(clubToken && !(clubToken.token.expiryTime || clubToken.token.expiresOn)) ||
		(clubToken &&
			(clubToken.token.expiryTime || clubToken.token.expiresOn) &&
			moment().isAfter(moment(clubToken.token.expiryTime || clubToken.token.expiresOn)))
	);
}
