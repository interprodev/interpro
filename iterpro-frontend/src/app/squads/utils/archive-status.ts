export interface ArchiveStatus {
	active: boolean;
	activeType: string;
	from: Date;
	to?: Date;
	fromMotivation: string;
	toMotivation?: string;
	fine?: any;
	notes?: string;
	team?: string;
	amount?: string;
	agentFee?: string;
	agent?: string;
	phone?: string;
	email?: string;
	option?: string;
	contractId?: string;
	player?: string;
	appearanceBonus?: any[];
	performanceBonus?: any[];
}
