export class ApiError extends Error {
    data: null;
    statusCode: number;
    success: boolean;
    errors: unknown[];

    constructor(statusCode: number, message = 'Something went wrong', errors: unknown[] = []) {
        super(message);
        this.data = null;
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;
    }
}
