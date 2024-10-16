export type DialogOutput<T> = {
	data: T;
	action: DialogOutputAction;
}
export enum DialogOutputAction {
	Edit = 1,
	Delete = 2
}
