const { InternalError } = require('../../common/modules/error');

const storage = process.env.STORAGE;

module.exports = async function (Storage) {
	Storage.getToken = async function (clubId) {
		switch (storage) {
			case 'Azure':
				return Storage.app.models.AzureStorage.getSasToken(clubId);
			default:
				return InternalError('No storage defined!');
		}
	};

	Storage.uploadFile = async function (clubId, data, filename) {
		switch (storage) {
			case 'Azure':
				return Storage.app.models.AzureStorage.uploadRawFile(clubId, data, filename);
			default:
				return InternalError('No storage defined!');
		}
	};

	Storage.downloadFile = async function (clubId, filename) {
		switch (storage) {
			case 'Azure':
				return Storage.app.models.AzureStorage.downloadFile(clubId, filename);
			default:
				return InternalError('No storage defined!');
		}
	};

	Storage.deleteFile = async function (clubId, filename) {
		switch (storage) {
			case 'Azure':
				return Storage.app.models.AzureStorage.removeFile(clubId, filename);
			default:
				return InternalError('No storage defined!');
		}
	};
};
