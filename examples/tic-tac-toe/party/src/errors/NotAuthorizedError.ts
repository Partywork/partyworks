import { CustomError } from "./CustomError";

export class NotAuthorizedError extends CustomError {
  status = 401;
  constructor() {
    super("Not Authorized");
  }

  serialize() {
    return { message: "Not Authorized", status: this.status };
  }
}
