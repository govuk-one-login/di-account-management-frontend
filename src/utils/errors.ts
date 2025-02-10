export class ApiError extends Error {
  private readonly status?: number;
  private readonly data?: string;
  constructor(message: string, status?: number, data?: string) {
    super(message);
    this.data = data;
    this.status = status;
  }
}

export class BadRequestError extends Error {
  private readonly status: number;
  constructor(message: string, code: number | string) {
    super(`${code}:${message}`);
    this.status = 400;
  }
}
