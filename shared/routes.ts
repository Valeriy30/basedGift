import { z } from 'zod';
import { insertGiftSchema, gifts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  gifts: {
    create: {
      method: 'POST' as const,
      path: '/api/gifts',
      input: insertGiftSchema,
      responses: {
        201: z.custom<typeof gifts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/gifts/:id',
      responses: {
        200: z.custom<typeof gifts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    claim: {
      method: 'PATCH' as const,
      path: '/api/gifts/:id/claim',
      input: z.object({
        status: z.literal('claimed'),
        receiverAddress: z.string(),
        claimTxHash: z.string(),
      }),
      responses: {
        200: z.custom<typeof gifts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
