import { CustomError } from "./CustomError";

export class NotFoundError extends CustomError {
  status = 404;

  constructor() {
    super("Not Found");
  }

  serialize() {
    return { message: "Not Found", status: this.status };
  }
}
