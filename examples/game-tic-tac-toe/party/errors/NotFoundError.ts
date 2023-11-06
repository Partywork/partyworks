import { _NOT_FOUND_ERROR } from '../constants';
import { CustomError } from './CustomError';

export class NotFoundError extends CustomError {
	status = 404;

	constructor() {
		super(_NOT_FOUND_ERROR);
	}

	serialize() {
		return { message: _NOT_FOUND_ERROR, status: this.status };
	}
}
