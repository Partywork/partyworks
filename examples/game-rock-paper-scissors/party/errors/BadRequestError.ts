import { CustomError } from './CustomError';

export class BadRequestError extends CustomError {
	status = 400;
	constructor(message: string) {
		super(message);
	}

	serialize = () => ({ message: this.message, status: this.status });
}
