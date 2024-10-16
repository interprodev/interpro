import getTransfer, { TransferContractPDF } from './transfer';
import getContract, { EmploymentContractPDF } from './contract';
import { ContractReportDeps, PdfBase, Player, Staff } from '@iterpro/shared/data-access/sdk';
import { SquadsPersonLegalComponent } from '../squads-person-legal.component';

const getReport = (component: SquadsPersonLegalComponent, deps: ContractReportDeps): PlayerContractPDF => {
	const t = deps.translate.instant.bind(deps.translate);
	return {
		header: null,
		metadata: null,
		// @ts-ignore
		title: `${component.person.name} ${component.person.lastName.toUpperCase()}`,
		image: component.person.downloadUrl,
		status: {
			label: t('admin.contracts.currentStatus'),
			value: (component.person as Player | Staff).currentStatus
				? t(`profile.status.${(component.person as Player | Staff).currentStatus}`)
				: '-'
		},
		outward: getTransfer(
			component,
			deps,
			component.outwards.find(({ status }) => status),
			true
		),
		inward: getTransfer(
			component,
			deps,
			component.inwards.find(({ status }) => status),
			false
		),
		contract: getContract(component, deps)
	};
};

export interface PlayerContractPDF extends PdfBase {
	title: string;
	image: string;
	status: {
		label: string;
		value: string;
	};
	outward: TransferContractPDF;
	inward: TransferContractPDF;
	contract: EmploymentContractPDF;
}

export default getReport;
