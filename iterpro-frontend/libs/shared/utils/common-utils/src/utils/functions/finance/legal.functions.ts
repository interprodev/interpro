import {
	BasicWage,
	ContractOption,
	EmploymentContract,
	Player,
	PlayerTransfer,
	TransferContract,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import { mask, unmask } from '@iterpro/shared/ui/directives';
import * as moment from 'moment/moment';
export const getTotalElementsAmountForSeasonNew = (
	contract: EmploymentContract,
	elements: BasicWage[],
	gross: boolean,
	vat: number
): number => {
	const years = getContractYears(contract);
	const elementsOverMultipleSeasons = (elements || []).filter(({ season }) => (season || []).includes('allContract'));
	const totalOverMultipleSeason = getTotalAmountOverMultipleSeasons(elementsOverMultipleSeasons, years, gross, vat);
	const elementsForSingleSeasons = (elements || []).filter(({ season }) => !(season || []).includes('allContract'));
	const totalForSelectedSeason = getTotalAmount(elementsForSingleSeasons, gross, vat);
	return totalOverMultipleSeason + totalForSelectedSeason;
};
const getContractYears = (contract: EmploymentContract): number => {
	return contract ? Math.round(Math.ceil(moment(contract.dateTo).diff(moment(contract.dateFrom), 'days')) / 365) : 0;
};
const getTotalAmountOverMultipleSeasons = (collection: BasicWage[], years: number, gross: boolean, vat: number): number => {
	return (collection || []).reduce((acc, option) => {
		const tot = gross ? getGross(option, vat) : option.amount;
		return acc + (option['repeat'] ? tot * years : tot / (years && years > 0 ? years : 1));
	}, 0);
};
const getTotalAmount = (collection: BasicWage[], gross: boolean, vat: number): number => {
	return (collection || []).reduce((acc, option) => {
		const length = option.season.length || 1;
		const tot = gross ? getGross(option, vat) : option.amount;
		return acc + (option['repeat'] ? tot * length : tot / length);
	}, 0);
};
const getGross = (contract: ContractOption | TransferContract, vat: number | undefined): number => {
	return contract.grossAmount || getVirtualGross(contract.amount, vat);
};
export const getVirtualGross = (amount: number, vat = 0): number => {
	return amount + amount * (vat / 100);
};
export const getTransferFee = (contract: TransferContract, asset?: boolean, gross?: boolean, vat?: number): number => {
	if (contract?.amount) {
		if (asset) return Number(contract.amountAsset ? (gross ? getGross(contract, vat) : contract.amount) : 0);
		else return Number(gross ? getGross(contract, vat) : contract.amount);
	}
	return 0;
};
export const formatAmount = (value: number): string =>
	value === null || value === undefined || !value.toString ? '' : mask(unmask(value.toString()), value.toString());

export function getActiveTransferContract(player: PlayerTransfer | Player, type: TransferTypeString): TransferContract | undefined {
	return (player?.transferContracts || []).find(({ status, typeTransfer }) => status && (typeTransfer as TransferTypeString) === type);
}

export function getActiveEmploymentContract(player: PlayerTransfer | Player): EmploymentContract | undefined {
	return (player?.employmentContracts || []).find(({ status }) => status);
}
