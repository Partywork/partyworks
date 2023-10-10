import { ErrorMessage } from '../types';

export abstract class CustomError extends Error {
	constructor(message: string) {
		super(message);
	}

	abstract status: number;

	abstract serialize(...args: any): ErrorMessage;
}
