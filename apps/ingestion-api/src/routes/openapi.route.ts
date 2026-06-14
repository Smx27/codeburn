import { Router, Request, Response } from 'express';
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { BatchUploadSchema, BatchUploadResponseSchema, SyncSessionSchema, SyncEventSchema } from '../validators/ingestion.validator.js';
import { z } from 'zod';

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/ingest/batch',
  summary: 'Batch ingest sessions and events',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: BatchUploadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Batch ingestion result',
      content: {
        'application/json': {
          schema: BatchUploadResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            details: z.any(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    500: {
      description: 'Internal server error',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/ingest/sessions',
  summary: 'Ingest sessions only',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            organizationId: z.string().uuid(),
            machineId: z.string().uuid(),
            provider: z.string().min(1),
            sessions: z.array(SyncSessionSchema),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sessions ingestion result',
      content: {
        'application/json': {
          schema: z.object({ sessionsInserted: z.number().int().nonnegative() }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/ingest/events',
  summary: 'Ingest events only',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            organizationId: z.string().uuid(),
            machineId: z.string().uuid(),
            provider: z.string().min(1),
            events: z.array(SyncEventSchema),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Events ingestion result',
      content: {
        'application/json': {
          schema: z.object({
            eventsInserted: z.number().int().nonnegative(),
            duplicatesSkipped: z.number().int().nonnegative(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('ok'),
            timestamp: z.string().datetime(),
          }),
        },
      },
    },
    503: {
      description: 'Service unhealthy',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('error'),
            timestamp: z.string().datetime(),
            error: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/version',
  summary: 'Get API version',
  responses: {
    200: {
      description: 'API version info',
      content: {
        'application/json': {
          schema: z.object({
            version: z.string(),
            name: z.string(),
          }),
        },
      },
    },
  },
});

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AiInsight Ingestion API',
      version: process.env.npm_package_version ?? '0.1.0',
      description: 'Multi-tenant event ingestion API for AiInsight Cloud',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development server' },
    ],
    security: [{ bearerAuth: [] }],
  });
}

const router = Router();
const spec = generateOpenApiSpec();

router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(spec);
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

export default router;