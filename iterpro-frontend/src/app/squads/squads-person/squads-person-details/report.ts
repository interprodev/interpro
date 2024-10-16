import { getLimb, getMinCircles, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

const getLabel = (values, value) => {
	if (!value) return '';
	const found = values.find(v => v.value === value);
	if (found) return found.label;
	return '';
};

const toDateString = date => {
	if (!date) return '';
	let momentDate = moment(date, getMomentFormatFromStorage());
	if (!momentDate.isValid()) momentDate = moment(date);
	return momentDate.isValid() ? momentDate.format(getMomentFormatFromStorage()) : '';
};

const getPersonal = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.personal'),
		values: [
			{ label: t('profile.overview.name'), value: player.name || player.firstName },
			{ label: t('profile.overview.surname'), value: player.lastName },
			{
				label: t('profile.overview.gender'),
				value: getLabel(component.genders, player.gender)
			},
			{
				label: t('profile.overview.birth'),
				value: toDateString(player.birthDate)
			},
			{ label: t('profile.overview.birthPlace'), value: player.birthPlace },
			{
				label: t('profile.overview.nationality'),
				value: getLabel(component.nationalities, player.nationality)
			},
			{ label: t('profile.overview.fiscalIssue'), value: player.fiscalIssue },
			{
				label: t('profile.overview.altNationality'),
				value: getLabel(component.nationalities, player.altNationality)
			},
			{
				label: t('profile.overview.passport'),
				value: getLabel(component.nationalities, player.passport)
			},
			{
				label: t('profile.overview.education'),
				value: getLabel(component.educations, player.education)
			},
			{ label: t('School'), value: player.school },
			{
				label: t('profile.overview.ageGroup'),
				value: getLabel(component.ageGroups, player.ageGroup)
			},
			{
				label: t('profile.overview.nationalityOrigins'),
				value: getLabel(component.nationalityOrigins, player.nationalityOrigin)
			},
			{
				label: t('profile.overview.maritalStatus'),
				value: getLabel(component.maritalStatus, player.maritalStatus)
			},
			{
				label: t('admin.profile.federalId'),
				value: player.federalId
			}
		]
	};
};
const getPhysical = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	const sportType = component.sportType;
	return {
		title: t('profile.physical'),
		values: [
			{ label: t('profile.overview.weight'), value: player.weight },
			{ label: t('profile.overview.height'), value: player.height },
			{ label: t(`profile.position.${getLimb(sportType)}`), value: player.foot },
			{ label: t('profile.position.shoeSize'), value: player.shoeSize }
		]
	};
};
const getTeam = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.team'),
		values: [
			{ label: t('profile.positon.jerseyNumber'), value: player.jersey },
			{ label: t('profile.position.captain'), value: player.captain },
			{
				label: t('profile.position.firstPosition'),
				value: t(player.position || '-')
			},
			{
				label: t('profile.position.secondPosition'),
				value: t(player.position2 || '-')
			},
			{
				label: t('profile.position.thirdPosition'),
				value: t(player.position3 || '-')
			}
		]
	};
};
const getBio = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.biography'),
		value: player.biography
	};
};
const getDocs = component => {
	const t = component.translate.instant.bind(component.translate);
	return {
		title: t('profile.identification'),
		headers: [
			t('profile.document.number'),
			t('profile.document.issuedBy'),
			t('profile.document.issuedDate'),
			t('profile.document.expiryDate')
		],
		values: (component.person.documents || []).map(document => ({
			type: getLabel(component.documentTypeOptions, document.type),
			values: [document.number, document.issuedBy, toDateString(document.issuedDate), toDateString(document.expiryDate)]
		}))
	};
};
const getFederalMembership = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.federal'),
		headers: [
			t('admin.profile.federalId'),
			t('profile.federal.issueDate'),
			t('profile.federal.expiryDate'),
			t('profile.federal.filingDate'),
			t('profile.federal.type'),
			t('profile.federal.status'),
			t('profile.federal.from'),
			t('profile.federal.details')
		],
		values: (player.federalMembership || []).map(fm => [
			player.federalId,
			toDateString(fm.issueDate),
			toDateString(fm.expiryDate),
			toDateString(fm.filingDate),
			getLabel(component.federalTypeOptions, fm.type),
			getLabel(component.federalTypeStatus, fm.status),
			fm.from,
			getLabel(component.details, fm.details)
		])
	};
};
const getSportPassport = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.sportPassport'),
		headers: [
			t('profile.sportPassport.season'),
			t('profile.sportPassport.dateFrom'),
			t('profile.sportPassport.dateTo'),
			t('profile.sportPassport.age'),
			t('profile.sportPassport.club'),
			t('profile.sportPassport.category'),
			t('profile.sportPassport.nation'),
			t('profile.sportPassport.status'),
			t('profile.sportPassport.basis'),
			t('admin.contracts.notes')
		],
		values: (player.sportPassport || []).map(sp => [
			sp.season,
			toDateString(sp.dateFrom),
			toDateString(sp.dateTo),
			sp.age,
			sp.club,
			sp.category,
			sp.nation,
			getLabel(component.sportPassportStatus, sp.status),
			getLabel(component.sportPassportBasis, sp.basis),
			sp.notes
		])
	};
};

const getAddress = (component, kind) => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	const v = key => player[kind] && player[kind][key];
	return {
		title: '',
		street: { label: t('profile.contact.street'), value: v('street') },
		city: { label: t('profile.contact.city'), value: v('city') },
		zipCode: { label: t('profile.contact.zipCode'), value: v('zipCode') },
		state: { label: t('profile.contact.state'), value: v('state') },
		nation: {
			label: t('profile.contact.nation'),
			value: getLabel(component.nationalities, v('nation'))
		}
	};
};

const getContact = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	const resident = getAddress(component, 'address');
	resident.title = t('profile.contact.resident');
	const domicile = getAddress(component, 'domicile');
	domicile.title = t('profile.contact.domicile');
	return {
		title: t('profile.contact'),
		resident,
		domicile,
		email: { label: t('profile.contact.email'), value: player.email },
		phone: { label: t('profile.contact.phone'), value: player.phone },
		mobilePhone: {
			label: t('profile.contact.mobilePhone'),
			value: player.mobilePhone
		},
		other: player.otherMobile && player.otherMobile.map(o => ({ label: o.name, value: o.number }))
	};
};

const getSocial = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	return {
		title: t('profile.social'),
		facebook: component.getFacebook(player),
		instagram: component.getInstagram(player),
		twitter: component.getTwitter(player),
		linkedin: component.getLinkedin(player),
		snapchat: player.snapchat
	};
};

const getBank = component => {
	const t = component.translate.instant.bind(component.translate);
	const player = component.person;
	const bank = player.bankAccount || {};
	return {
		title: t('profile.bank'),
		values: [
			{ label: t('profile.bank.name'), value: bank.bank },
			{ label: t('profile.bank.accountNumber'), value: bank.accountNumber },
			{ label: t('profile.bank.routingNumber'), value: bank.routingNumber },
			{ label: t('profile.bank.iban'), value: bank.iban },
			{ label: t('profile.bank.swift'), value: bank.swift }
		]
	};
};

export const getReport = (component, azureUrlPipe) => {
	const player = component.person;
	return {
		title: `${(player.name || player.firstName).toUpperCase()} ${player.lastName.toUpperCase()}`,
		image: player.downloadUrl,
		position: getMinCircles(null, player.position, player.position2, player.position3),
		personal: getPersonal(component),
		physical: getPhysical(component),
		team: getTeam(component),
		bio: getBio(component),
		docs: getDocs(component),
		federalMembership: getFederalMembership(component),
		sportPassport: getSportPassport(component),
		contact: getContact(component),
		bank: getBank(component),
		social: getSocial(component)
	};
};
