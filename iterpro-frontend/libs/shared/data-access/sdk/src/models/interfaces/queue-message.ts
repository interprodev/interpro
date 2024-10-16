export interface ResultWithQueueMessage {
	result: any;
	message: QueueMessage[];
}

export interface QueueMessage {
	title?: string;
	playerIds?: string[];
}
