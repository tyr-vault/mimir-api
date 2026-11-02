const jsonContent = (schema: Record<string, unknown>) => ({
    content: {
        'application/json': { schema },
    },
});

const successResponse = (
    description: string,
    dataSchema: Record<string, unknown>,
    statusCode = 200,
) => ({
    description,
    ...jsonContent({
        allOf: [
            { $ref: '#/components/schemas/ApiSuccess' },
            {
                type: 'object',
                properties: {
                    statusCode: { type: 'integer', example: statusCode },
                    data: dataSchema,
                },
            },
        ],
    }),
});

const periodFilterParams = [
    {
        name: 'from',
        in: 'query',
        description: 'Inclusive start date (`YYYY-MM-DD`). Omit for no lower bound.',
        schema: { type: 'string', format: 'date', example: '2026-09-01' },
    },
    {
        name: 'to',
        in: 'query',
        description: 'Inclusive end date (`YYYY-MM-DD`). Omit for no upper bound.',
        schema: { type: 'string', format: 'date', example: '2026-09-19' },
    },
    {
        name: 'type',
        in: 'query',
        description: 'Filter by transaction type.',
        schema: { type: 'string', enum: ['expense', 'income'] },
    },
    {
        name: 'categoryId',
        in: 'query',
        description: 'Filter by category UUID owned by the authenticated user.',
        schema: { type: 'string', format: 'uuid' },
    },
];

const transactionIdParam = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Transaction UUID.',
    schema: { type: 'string', format: 'uuid' },
};

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Mimir API',
        version: '0.0.1',
        description: [
            'Personal finance API with JWT auth. Track income and expenses, filter transactions, and fetch period summaries for bots and dashboards.',
            '',
            '**Docs:** [Swagger UI](/api/docs) · [ReDoc](/api/redoc) · [Download for Postman](/api/docs.json?download=1)',
            '',
            'Postman: File → Import → upload `mimir-openapi.json`.',
        ].join('\n'),
    },
    servers: [
        {
            url: '/',
            description: 'Current host',
        },
    ],
    tags: [
        {
            name: 'Auth',
            description: 'Register and login. Returns a JWT used as `Authorization: Bearer <token>`.',
            'x-displayName': '1. Authentication',
        },
        {
            name: 'Categories',
            description:
                'User-owned spending categories. Defaults are seeded on register (Groceries, Housing, …).',
            'x-displayName': '2. Categories',
        },
        {
            name: 'Transactions',
            description:
                'CRUD for single-line income/expense records. List supports date, type, and category filters.',
            'x-displayName': '3. Transactions',
        },
        {
            name: 'Summary',
            description:
                'Aggregates for bots and dashboards — period totals, by category, and by month.',
            'x-displayName': '4. Summaries',
        },
        {
            name: 'Drafts',
            description:
                'Bot-submitted creates awaiting dashboard confirmation (auto-confirm after 3 days).',
            'x-displayName': '5. Drafts',
        },
    ],
    'x-tagGroups': [
        {
            name: 'Getting started',
            tags: ['Auth'],
        },
        {
            name: 'Core resources',
            tags: ['Categories', 'Transactions', 'Drafts'],
        },
        {
            name: 'Analytics',
            tags: ['Summary'],
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description:
                    'JWT from `/auth/login` or `/auth/register`. Prefer `Authorize` in Swagger UI.',
            },
        },
        parameters: {
            FromDate: periodFilterParams[0],
            ToDate: periodFilterParams[1],
            TransactionType: periodFilterParams[2],
            CategoryIdFilter: periodFilterParams[3],
            TransactionId: transactionIdParam,
            Limit: {
                name: 'limit',
                in: 'query',
                description: 'Page size (default 50, max 200).',
                schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
            },
            Offset: {
                name: 'offset',
                in: 'query',
                description: 'Number of rows to skip (default 0).',
                schema: { type: 'integer', minimum: 0, default: 0 },
            },
            Year: {
                name: 'year',
                in: 'query',
                required: true,
                description: 'Calendar year for monthly breakdown.',
                schema: { type: 'integer', example: 2026, minimum: 1970, maximum: 2100 },
            },
        },
        schemas: {
            ApiSuccess: {
                type: 'object',
                required: ['statusCode', 'data', 'message', 'success'],
                properties: {
                    statusCode: {
                        type: 'integer',
                        description: 'HTTP status mirrored in the body.',
                        example: 200,
                    },
                    data: {
                        description: 'Payload (object, array, or null).',
                    },
                    message: {
                        type: 'string',
                        description: 'Human-readable status message.',
                        example: 'Success',
                    },
                    success: {
                        type: 'boolean',
                        description: '`true` when `statusCode < 400`.',
                        example: true,
                    },
                },
            },
            ApiError: {
                type: 'object',
                required: ['statusCode', 'data', 'message', 'success'],
                properties: {
                    statusCode: { type: 'integer', example: 400 },
                    data: { nullable: true, example: null },
                    message: { type: 'string', example: 'email and password are required' },
                    success: { type: 'boolean', example: false },
                    errors: {
                        type: 'array',
                        items: {},
                        description: 'Optional structured error details.',
                        example: [],
                    },
                },
            },
            User: {
                type: 'object',
                required: ['id', 'email', 'name'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email', example: 'admin@example.com' },
                    name: { type: 'string', example: 'Admin' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            AuthPayload: {
                type: 'object',
                required: ['token', 'user'],
                properties: {
                    token: {
                        type: 'string',
                        description: 'JWT access token. Send as `Authorization: Bearer <token>`.',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    user: { $ref: '#/components/schemas/User' },
                },
            },
            RegisterBody: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'you@example.com' },
                    password: {
                        type: 'string',
                        format: 'password',
                        minLength: 6,
                        example: 'secret12',
                    },
                    name: { type: 'string', example: 'Rafael' },
                },
            },
            LoginBody: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'admin@example.com' },
                    password: { type: 'string', format: 'password', example: 'admin' },
                },
            },
            Category: {
                type: 'object',
                required: ['id', 'userId', 'name'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Groceries' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateCategoryBody: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: {
                        type: 'string',
                        minLength: 1,
                        example: 'Coffee',
                        description: 'Unique per user (case-sensitive trim).',
                    },
                },
            },
            TransactionType: {
                type: 'string',
                enum: ['expense', 'income'],
                description: 'Direction of cash flow.',
            },
            Transaction: {
                type: 'object',
                required: ['id', 'userId', 'categoryId', 'type', 'amount', 'date'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    categoryId: { type: 'string', format: 'uuid' },
                    categoryName: {
                        type: 'string',
                        example: 'Food',
                        description: 'Joined category name for convenience.',
                    },
                    type: { $ref: '#/components/schemas/TransactionType' },
                    amount: {
                        type: 'number',
                        exclusiveMinimum: 0,
                        example: 42.5,
                        description: 'Always positive; direction is given by `type`.',
                    },
                    date: {
                        type: 'string',
                        format: 'date',
                        example: '2026-09-19',
                        description: 'Transaction date (`YYYY-MM-DD`).',
                    },
                    note: {
                        type: 'string',
                        nullable: true,
                        example: 'Lunch',
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateTransactionBody: {
                type: 'object',
                required: ['categoryId', 'type', 'amount', 'date'],
                properties: {
                    categoryId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Must belong to the authenticated user.',
                    },
                    type: { $ref: '#/components/schemas/TransactionType' },
                    amount: { type: 'number', exclusiveMinimum: 0, example: 25.5 },
                    date: { type: 'string', format: 'date', example: '2026-09-18' },
                    note: { type: 'string', nullable: true, example: 'Lunch' },
                },
            },
            UpdateTransactionBody: {
                type: 'object',
                description: 'At least one field required.',
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    type: { $ref: '#/components/schemas/TransactionType' },
                    amount: { type: 'number', exclusiveMinimum: 0 },
                    date: { type: 'string', format: 'date' },
                    note: { type: 'string', nullable: true },
                },
            },
            PeriodSummary: {
                type: 'object',
                required: ['totalIncome', 'totalExpense', 'net', 'count'],
                properties: {
                    from: { type: 'string', format: 'date', nullable: true },
                    to: { type: 'string', format: 'date', nullable: true },
                    type: {
                        allOf: [{ $ref: '#/components/schemas/TransactionType' }],
                        nullable: true,
                    },
                    totalIncome: { type: 'number', example: 4700 },
                    totalExpense: { type: 'number', example: 1815.35 },
                    net: {
                        type: 'number',
                        example: 2884.65,
                        description: '`totalIncome - totalExpense`.',
                    },
                    count: {
                        type: 'integer',
                        example: 17,
                        description: 'Number of matching transactions.',
                    },
                },
            },
            CategorySummaryItem: {
                type: 'object',
                required: ['categoryId', 'name', 'total', 'count'],
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Groceries' },
                    total: {
                        type: 'number',
                        example: 251.7,
                        description: 'Sum of `amount` for matching rows.',
                    },
                    count: { type: 'integer', example: 3 },
                },
            },
            MonthlySummaryItem: {
                type: 'object',
                required: ['month', 'totalIncome', 'totalExpense', 'net'],
                properties: {
                    month: {
                        type: 'string',
                        example: '2026-09',
                        description: '`YYYY-MM`',
                        pattern: '^\\d{4}-\\d{2}$',
                    },
                    totalIncome: { type: 'number', example: 4700 },
                    totalExpense: { type: 'number', example: 1815.35 },
                    net: { type: 'number', example: 2884.65 },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'Validation or business rule error.',
                ...jsonContent({ $ref: '#/components/schemas/ApiError' }),
            },
            Unauthorized: {
                description: 'Missing or invalid JWT.',
                ...jsonContent({ $ref: '#/components/schemas/ApiError' }),
            },
            NotFound: {
                description: 'Resource not found for this user.',
                ...jsonContent({ $ref: '#/components/schemas/ApiError' }),
            },
            Conflict: {
                description: 'Resource conflict (e.g. duplicate email or category name).',
                ...jsonContent({ $ref: '#/components/schemas/ApiError' }),
            },
        },
    },
    paths: {
        '/auth/register': {
            post: {
                tags: ['Auth'],
                operationId: 'register',
                summary: 'Create an account',
                description:
                    'Creates a user, seeds default categories, and returns a JWT plus the user profile (password never returned).',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterBody' },
                        },
                    },
                },
                responses: {
                    '201': successResponse(
                        'Account created.',
                        { $ref: '#/components/schemas/AuthPayload' },
                        201,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                operationId: 'login',
                summary: 'Sign in',
                description: 'Validates credentials and returns a JWT plus the user profile.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginBody' },
                            examples: {
                                demo: {
                                    summary: 'Demo showcase user',
                                    value: {
                                        email: 'admin@example.com',
                                        password: 'admin',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': successResponse('Login successful.', {
                        $ref: '#/components/schemas/AuthPayload',
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/categories': {
            get: {
                tags: ['Categories'],
                operationId: 'listCategories',
                summary: 'List categories',
                description: 'Returns all categories for the authenticated user, sorted by name.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': successResponse('Categories retrieved.', {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Category' },
                    }),
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Categories'],
                operationId: 'createCategory',
                summary: 'Create a category',
                description: 'Creates a category unique to the current user.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateCategoryBody' },
                        },
                    },
                },
                responses: {
                    '201': successResponse(
                        'Category created.',
                        { $ref: '#/components/schemas/Category' },
                        201,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/drafts': {
            get: {
                tags: ['Drafts'],
                operationId: 'listDrafts',
                summary: 'List drafts',
                description:
                    'Lists drafts for the user. Pending drafts older than 3 days are auto-confirmed first.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'status',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'rejected'],
                            default: 'pending',
                        },
                    },
                ],
                responses: {
                    '200': successResponse('Drafts retrieved.', {
                        type: 'array',
                        items: { type: 'object' },
                    }),
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Drafts'],
                operationId: 'createDraft',
                summary: 'Create a draft',
                description: 'Creates a pending draft (bot creates). Confirm later via dashboard.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['kind', 'payload'],
                                properties: {
                                    kind: {
                                        type: 'string',
                                        enum: ['transaction', 'category'],
                                    },
                                    payload: { type: 'object' },
                                    source: { type: 'string', default: 'bot' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': successResponse('Draft created.', { type: 'object' }, 201),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/drafts/{id}': {
            get: {
                tags: ['Drafts'],
                operationId: 'getDraft',
                summary: 'Get draft',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': successResponse('Draft retrieved.', { type: 'object' }),
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                tags: ['Drafts'],
                operationId: 'updateDraft',
                summary: 'Update pending draft payload',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['payload'],
                                properties: { payload: { type: 'object' } },
                            },
                        },
                    },
                },
                responses: {
                    '200': successResponse('Draft updated.', { type: 'object' }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/drafts/{id}/confirm': {
            post: {
                tags: ['Drafts'],
                operationId: 'confirmDraft',
                summary: 'Confirm draft',
                description: 'Applies the draft (creates transaction or category) and marks it confirmed.',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': successResponse('Draft confirmed.', { type: 'object' }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/drafts/{id}/reject': {
            post: {
                tags: ['Drafts'],
                operationId: 'rejectDraft',
                summary: 'Reject draft',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': successResponse('Draft rejected.', { type: 'object' }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/transactions': {
            get: {
                tags: ['Transactions'],
                operationId: 'listTransactions',
                summary: 'List transactions',
                description:
                    'Filterable list ordered by `date DESC`, then `createdAt DESC`. Ideal for dashboards and bot queries.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/FromDate' },
                    { $ref: '#/components/parameters/ToDate' },
                    { $ref: '#/components/parameters/TransactionType' },
                    { $ref: '#/components/parameters/CategoryIdFilter' },
                    { $ref: '#/components/parameters/Limit' },
                    { $ref: '#/components/parameters/Offset' },
                ],
                responses: {
                    '200': successResponse('Transactions retrieved.', {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Transaction' },
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Transactions'],
                operationId: 'createTransaction',
                summary: 'Create a transaction',
                description:
                    'Creates one income or expense line. `amount` must be positive; use `type` for direction.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateTransactionBody' },
                            examples: {
                                expense: {
                                    summary: 'Expense',
                                    value: {
                                        categoryId: '00000000-0000-4000-8000-000000000001',
                                        type: 'expense',
                                        amount: 25.5,
                                        date: '2026-09-18',
                                        note: 'Lunch',
                                    },
                                },
                                income: {
                                    summary: 'Income',
                                    value: {
                                        categoryId: '00000000-0000-4000-8000-000000000002',
                                        type: 'income',
                                        amount: 200,
                                        date: '2026-09-15',
                                        note: 'Freelance',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': successResponse(
                        'Transaction created.',
                        { $ref: '#/components/schemas/Transaction' },
                        201,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/transactions/{id}': {
            get: {
                tags: ['Transactions'],
                operationId: 'getTransaction',
                summary: 'Get one transaction',
                description: 'Returns a single transaction owned by the authenticated user.',
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/TransactionId' }],
                responses: {
                    '200': successResponse('Transaction retrieved.', {
                        $ref: '#/components/schemas/Transaction',
                    }),
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                tags: ['Transactions'],
                operationId: 'updateTransaction',
                summary: 'Update a transaction',
                description: 'Partial update. Send only fields to change.',
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/TransactionId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateTransactionBody' },
                        },
                    },
                },
                responses: {
                    '200': successResponse('Transaction updated.', {
                        $ref: '#/components/schemas/Transaction',
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            delete: {
                tags: ['Transactions'],
                operationId: 'deleteTransaction',
                summary: 'Delete a transaction',
                description: 'Permanently deletes the transaction. `data` is `null` on success.',
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/TransactionId' }],
                responses: {
                    '200': successResponse('Transaction deleted.', {
                        nullable: true,
                        example: null,
                    }),
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/summary': {
            get: {
                tags: ['Summary'],
                operationId: 'getPeriodSummary',
                summary: 'Period totals',
                description:
                    'Aggregated income, expense, net, and count for a period. Designed for bots (e.g. “past 7 days spend”).',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/FromDate' },
                    { $ref: '#/components/parameters/ToDate' },
                    { $ref: '#/components/parameters/TransactionType' },
                    { $ref: '#/components/parameters/CategoryIdFilter' },
                ],
                responses: {
                    '200': successResponse('Summary retrieved.', {
                        $ref: '#/components/schemas/PeriodSummary',
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/summary/categories': {
            get: {
                tags: ['Summary'],
                operationId: 'getCategorySummary',
                summary: 'Totals by category',
                description:
                    'Sums amounts grouped by category for the filtered period. Sorted by `total` descending.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/FromDate' },
                    { $ref: '#/components/parameters/ToDate' },
                    { $ref: '#/components/parameters/TransactionType' },
                    { $ref: '#/components/parameters/CategoryIdFilter' },
                ],
                responses: {
                    '200': successResponse('Category summary retrieved.', {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CategorySummaryItem' },
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/summary/monthly': {
            get: {
                tags: ['Summary'],
                operationId: 'getMonthlySummary',
                summary: 'Totals by month',
                description:
                    'Monthly income/expense/net breakdown for a calendar year. Months with no activity are omitted.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/Year' },
                    { $ref: '#/components/parameters/TransactionType' },
                ],
                responses: {
                    '200': successResponse('Monthly summary retrieved.', {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MonthlySummaryItem' },
                    }),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
    },
};
