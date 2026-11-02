export class ApiResponse<TData = unknown> {
    statusCode: number;
    data: TData;
    message: unknown;
    success: boolean;

    constructor(
        statusCode: number,
        data: TData,
        message: unknown = 'Success',
        ..._ignored: unknown[]
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}
