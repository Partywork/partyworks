import { _NOT_AUTHORIZED_ERROR } from '../constants';
import { CustomError } from './CustomError';

export class NotAuthorizedError extends CustomError {
	status = 401;
	constructor() {
		super(_NOT_AUTHORIZED_ERROR);
	}

	serialize() {
		return { message: _NOT_AUTHORIZED_ERROR, status: this.status };
	}
}
