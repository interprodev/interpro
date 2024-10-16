import { Injectable } from '@angular/core';
import { LoopBackAuth } from '@iterpro/shared/data-access/sdk';

export interface CsvColumnNames {
	displayName: string;
	name: string;
	surname: string;
	birthDate: string;
	nationality: string;
	birthPlace: string;
	team: string;
	position: string;
	membershipTeam: string;
	firstMembershipTeam: string;
	firstMembershipPro: string;
	federalId: string;
	archivedDate: string;
	email: string;
	phone: string;
	gender: string;
	education: string;
	nationalityOrigin: string;
	maritalStatus: string;
	weight: string;
	height: string;
	foot: string;
	shoeSize: string;
	jerseyNumber: string;
	captain: string;
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
	bank: string;
	accountNumber: string;
	routingNumber: string;
	iban: string;
	swift: string;
}

@Injectable({
	providedIn: 'root'
})
export class CsvColumnNamesService {
	readonly itIT: CsvColumnNames = {
		displayName: "ID",
		name: "Nome",
		surname: "Cognome",
		birthDate: "Data di nascita",
		nationality: "Nazionalità",
		birthPlace: "Luogo di nascita",
		team: "Team",
		position: "Ruolo",
		membershipTeam: "Provenienza",
		firstMembershipTeam: "Data primo tesseramento team",
		firstMembershipPro: "Data primo tesseramento pro",
		federalId: "Matricola LNP",
		archivedDate: "Data di archiviazione",
		email: "Email",
		phone: "Telefono",
		gender: "Genere",
		education: "Istruzione",
		nationalityOrigin: "Origine",
		maritalStatus:"Stato civile",
		weight: "Peso",
  		height: "Altezza",
		foot: "Piede preferito",
		shoeSize: "Taglia di scarpe",
		jerseyNumber: "Numero di maglia",
		captain: "Capitano",
		street: "Via",
		city: "Città",
		state: "Stato",
		zipCode: "Codice postale",
		country: "Paese",
		bank: "Banca",
		accountNumber: "Numero conto",
		routingNumber: "Codice di avviamento bancario",
		iban: "Iban",
		swift: "Swift"
	};
	readonly enGB: CsvColumnNames = {
		displayName: "ID",
		name: "Name",
		surname: "Surname",
		birthDate: "Birth Date",
		nationality: "Nationality",
		birthPlace: "Birth Place",
		team: "Team",
		position: "Position",
		membershipTeam: "From Team",
		firstMembershipTeam: "First team membership",
		firstMembershipPro: "First professional membership",
		federalId: "Federal ID",
		archivedDate: "Archived Date",
		email: "Email",
		phone: "Phone",
		gender: "Gender",
		education: "Education",
		nationalityOrigin: "Origin",
		maritalStatus: "Marital Status",
		weight: "Weight",
		height: "Height",
		foot: "Preferred foot",
		shoeSize: "Shoe size",
		jerseyNumber: "Jersey number",
		captain: "Captain",
		street: "Street",
		city: "City",
		state: "State",
		zipCode: "Zip Code",
		country: "Country",
		bank: "Bank",
		accountNumber: "Account Number",
		routingNumber: "Routing Number",
		iban: "Iban",
		swift: "Swift"
	};
	readonly enUS: CsvColumnNames = {
		displayName: "ID",
		name: "Name",
		surname: "Surname",
		birthDate: "Birth Date",
		nationality: "Nationality",
		birthPlace: "Birth Place",
		team: "Team",
		position: "Position",
		membershipTeam: "From Team",
		firstMembershipTeam: "First team membership",
		firstMembershipPro: "First professional membership",
		federalId: "Federal ID",
		archivedDate: "Archived Date",
		email: "Email",
		phone: "Phone",
		gender: "Gender",
		education: "Education",
		nationalityOrigin: "Origin",
		maritalStatus: "Marital Status",
		weight: "Weight",
		height: "Height",
		foot: "Preferred foot",
		shoeSize: "Shoe size",
		jerseyNumber: "Jersey number",
		captain: "Captain",
		street: "Street",
		city: "City",
		state: "State",
		zipCode: "Zip Code",
		country: "Country",
		bank: "Bank",
		accountNumber: "Account Number",
		routingNumber: "Routing Number",
		iban: "Iban",
		swift: "Swift"
	};

	readonly deDE: CsvColumnNames = {
		displayName: "ID",
		name: "Name",
		surname: "Nachname",
		birthDate: "Geburtsdatum",
		nationality: "Nationalität",
		birthPlace: "Geburtsort",
		team: "Team",
		position: "Position",
		membershipTeam: "Vom Team",
		firstMembershipTeam: "Erste Teammitgliedschaft",
		firstMembershipPro: "Erste berufliche Mitgliedschaft",
		federalId: "Federal ID",
		archivedDate: "Archiviertes Datum",
		email: "Email",
		phone: "Rufnummer",
		gender: "Geschlecht",
		education: "Bildung",
		nationalityOrigin: "Herkunft",
		maritalStatus: "Familienstand",
		weight: "Gewicht",
		height: "Größe",
		foot: "Bevorzugter Fuß",
		shoeSize: "Schuhgröße",
		jerseyNumber: "Trikotnummer",
		captain: "Kapitän",
		street: "Straße",
		city: "Stadt",
		state: "Bundesland",
		zipCode: "Postleitzahl",
		country: "Land",
		bank: "Bank",
		accountNumber: "Kontonummer",
		routingNumber: "Bankleitzahl",
		iban: "Iban",
		swift: "Swift"
	};

	readonly esES: CsvColumnNames = {
		displayName: "ID",
		name: "Nombre",
		surname: "Apellido",
		birthDate: "Fecha de nacimiento",
		nationality: "Nacionalidad",
		birthPlace: "Lugar de nacimiento",
		team: "Team",
		position: "Posición",
		membershipTeam: "Del equipo",
		firstMembershipTeam: "Primera afiliación para equipo",
		firstMembershipPro: "Primera afiliación profesional",
		federalId: "ID Federal",
		archivedDate: "Fecha archivada",
		email: "Correo electrónico",
		phone: "Teléfono",
		gender: "Género",
		education: "Educación",
		nationalityOrigin: "Origen",
		maritalStatus: "Estado Civil",
		weight: "Peso",
  		height: "Altura",
		foot: "Pie Preferido",
		shoeSize: "Tamaño de Zapato",
		jerseyNumber: "Número de Camiseta",
		captain: "Capitán",
		street: "Calle",
		city: "Ciudad",
		state: "Estado",
		zipCode: "Código Postal",
		country: "País",
		bank: "Banco",
		accountNumber: "Número de Cuenta",
		routingNumber: "Número de Ruta",
		iban: "Iban",
		swift: "Swift"
	};

	readonly frFR: CsvColumnNames = {
		displayName: "ID",
		name: "Nom",
		surname: "Prénom",
		birthDate: "Date de naissance",
		nationality: "Nationalité",
		birthPlace: "Lieu de naissance",
		team: "Team",
		position: "Position",
		membershipTeam: "De l'équipe",
		firstMembershipTeam: "Première affiliation pour l'équipe",
		firstMembershipPro: "Première affiliation professionnelle",
		federalId: "ID fédéral",
		archivedDate: "Date d'archivage",
		email: "Curriel",
		phone: "Téléphone",
		gender: "Genre",
		education: "Éducation",
		nationalityOrigin: "Origine Nationale",
		maritalStatus: "État Civil",
		weight: "Poids",
		height: "Taille",
		foot: "Pied Préféré",
		shoeSize: "Pointure",
		jerseyNumber: "Numéro de Maillot",
		captain: "Capitaine",
		street: "Rue",
		city: "Ville",
		state: "État",
		zipCode: "Code Postal",
		country: "Pays",
		bank: "Banque",
		accountNumber: "Numéro de Compte",
		routingNumber: "Numéro d'Aiguillage",
		iban: "Iban",
		swift: "Swift"
	};

	readonly ptPT: CsvColumnNames = {
		displayName: "ID",
		name: "Nome",
		surname: "Sobrenome",
		birthDate: "Data de nascimento",
		nationality: "Nacionalidade",
		birthPlace: "Local de nascimento",
		team: "Team",
		position: "Position",
		membershipTeam: "Da equipe",
		firstMembershipTeam: "Primeira adesão para equipe",
		firstMembershipPro: "Primeira adesão profissional",
		federalId: "ID federal",
		archivedDate: "Data do arquivo",
		email: "Correio eletrónico",
		phone: "Telefone",
		gender: "Gênero",
		education: "Educação",
		nationalityOrigin: "Origem",
		maritalStatus: "Estado Civil",
		weight: "Peso",
		height: "Altura",
		foot: "Pé Preferido",
		shoeSize: "Tamanho do Sapato",
		jerseyNumber: "Número da Camisa",
		captain: "Capitão",
		street: "Rua",
		city: "Cidade",
		state: "Estado",
		zipCode: "Código Postal",
		country: "País",
		bank: "Banco",
		accountNumber: "Número da Conta",
		routingNumber: "Número de Encaminhamento",
		iban: "Iban",
		swift: "Swift"
	};

	readonly nlNL: CsvColumnNames = {
		displayName: "ID",
		name: "Naam",
		surname: "Achternaam",
		birthDate: "Geboortedatum",
		nationality: "Nationaliteit",
		birthPlace: "Geboorteplaats",
		team: "Team",
		position: "Functie",
		membershipTeam: "Thuisploeg",
		firstMembershipTeam: "Eerste teamlidmaatschap",
		firstMembershipPro: "Eerste lidmaatschapsdatum pro",
		federalId: "ID federaal",
		archivedDate: "Datum indiening",
		email: "E-mail",
		phone: "Telefoon",
		gender: "Geslacht",
		education: "Onderwijs",
		nationalityOrigin: "Nationaliteit",
		maritalStatus: "Burgerlijke Staat",
		weight: "Gewicht",
		height: "Lengte",
		foot: "Voorkeursvoet",
		shoeSize: "Schoenmaat",
		jerseyNumber: "Rugnummers",
		captain: "Kapitein",
		street: "Straat",
		city: "Stad",
		state: "Staat",
		zipCode: "Postcode",
		country: "Land",
		bank: "Bank",
		accountNumber: "Rekeningnummer",
		routingNumber: "Routenummer",
		iban: "Iban",
		swift: "Swift"
	};

	readonly arSA: CsvColumnNames = {
		displayName: "المعرف",
		name: "الاسم",
		surname: "اللقب",
		birthDate: "تاريخ الميلاد",
		nationality: "الجنسية",
		birthPlace: "مكان الميلاد",
		team: "الفريق",
		position: "الدور",
		membershipTeam: "الأصل",
		firstMembershipTeam: "تاريخ أول تسجيل للفريق",
		firstMembershipPro: "تاريخ أول تسجيل احترافي",
		federalId: "المعرف الفيدرالي",
		archivedDate: "تاريخ الأرشفة",
		email: "البريد الإلكتروني",
		phone: "الهاتف",
		gender: "الجنس",
  		education: "التعليم",
  		nationalityOrigin: "الأصل الوطني",
 		maritalStatus: "الحالة الاجتماعية",
		weight: "الوزن",
		height: "الطول",
  		foot: "القدم المفضلة",
  		shoeSize: "مقاس الحذاء",
  		jerseyNumber: "رقم القميص",
  		captain: "الكابتن",
  		street: "الشارع",
  		city: "المدينة",
  		state: "الولاية",
  		zipCode: "الرمز البريدي",
  		country: "البلد",
  		bank: "البنك",
  		accountNumber: "رقم الحساب",
 		routingNumber: "رقم التوجيه",
  		iban: "آيبان",
  		swift: "سويفت"
	};

	constructor(private authService: LoopBackAuth) {}

	getColumnNames(): CsvColumnNames {
		// regex remove any underscore and non word char
		// example: en-US -> enUS, en_GB -> enGB, pt-BR -> ptBR, es-ES -> esES, fr-FR -> frFR, de-DE -> deDE, it-IT -> itIT
		const lang: string = this.authService.getCurrentUserData().currentLanguage.replace(/[_\W]+/g, '');
		return this[lang];
	}
}
