import express, {
    type ErrorRequestHandler,
    type NextFunction,
    type Request,
    type Response,
} from 'express';
import morgan from 'morgan';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transactions.routes.js';
import summaryRoutes from './routes/summary.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import draftRoutes from './routes/drafts.routes.js';
import { setupSwagger } from './swagger/setup.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.set('trust proxy', true);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.static('public'));

interface WelcomeResponseBody {
    message: string;
    docs: {
        swagger: string;
        redoc: string;
        openapi: string;
        export: string;
    };
}

const getWelcomeHandler = (
    _req: Request<Record<string, never>, WelcomeResponseBody, Record<string, never>>,
    res: Response<WelcomeResponseBody>,
): void => {
    res.json({
        message: 'Welcome to Mimir API',
        docs: {
            swagger: '/api/docs',
            redoc: '/api/redoc',
            openapi: '/api/docs.json',
            export: '/api/docs.json?download=1',
        },
    });
};

app.get('/', getWelcomeHandler);

setupSwagger(app);

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/summary', summaryRoutes);
app.use('/categories', categoryRoutes);
app.use('/drafts', draftRoutes);

const errorHandler: ErrorRequestHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            statusCode: err.statusCode,
            data: err.data,
            message: err.message,
            success: false,
            errors: err.errors,
        });
        return;
    }

    console.error(err);
    res.status(500).json({
        statusCode: 500,
        data: null,
        message: 'Internal Server Error',
        success: false,
        errors: [],
    });
};

app.use(errorHandler);

export { app };
