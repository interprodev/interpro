type ContactRole = 'staff' | 'player';

export interface ContactGroup {
	groupName: string;
	contacts: Contact[];
}

export interface Contact {
	id: string;
	email: string[] | null;
	name: string;
	photoUrl?: string | null;
	locale?: string | null;
	role?: ContactRole;
	phone?: string[];
}
