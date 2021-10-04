export class ApiError extends Error {
  private status: number;
  constructor(message: string, code: string) {
    super(`API error Request:${code}:${message}`);
    this.status = 500;
  }
}
