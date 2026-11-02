import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

const OPENAPI_FILENAME = 'mimir-openapi.json';

const sendOpenApiJson = (req: Request, res: Response, asDownload: boolean): void => {
    if (asDownload || req.query.download === '1' || req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${OPENAPI_FILENAME}"`);
    }
    res.type('application/json').send(JSON.stringify(openApiSpec, null, 2));
};

const REDOC_CDN = 'https://cdn.redoc.ly/redoc/v3.x/bundles/redoc.standalone.js';

const redocHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>Mimir API — ReDoc</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
    }
    :root.light,
    :root.dark {
      --sidebar-width: 280px;
      --color-primary-base: #6ea8fe;
    }
    :root.dark {
      --sidebar-bg-color: #11141a;
      --bg-color: #0b0d10;
      --text-color-primary: #e8eaed;
      --text-color-secondary: #9aa0a6;
    }
  </style>
</head>
<body>
  <redoc
    spec-url="/api/docs.json"
    disable-telemetry="true"
    sort-required-props-first="true"
  ></redoc>
  <script type="module" src="${REDOC_CDN}"></script>
</body>
</html>`;

export const setupSwagger = (app: Express): void => {
    app.get('/api/docs.json', (req: Request, res: Response) => {
        sendOpenApiJson(req, res, false);
    });

    app.get('/api/docs/export', (_req: Request, res: Response) => {
        sendOpenApiJson(_req, res, true);
    });

    app.get('/api/redoc', (_req: Request, res: Response) => {
        res.type('html').send(redocHtml);
    });

    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(openApiSpec, {
            customSiteTitle: 'Mimir API — Swagger',
            customCss: `
              .swagger-ui .topbar { display: none }
              .swagger-ui .info .title small { display: none }
              .swagger-ui .info { margin: 24px 0 12px; }
              .swagger-ui .info .description p {
                font-size: 14px;
                line-height: 1.5;
                margin: 0 0 8px;
              }
            `,
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
                docExpansion: 'list',
                tagsSorter: 'alpha',
                operationsSorter: 'method',
            },
        }),
    );
};
