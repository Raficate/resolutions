import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cargamos el servidor SSR ya compilado por Angular
  // @ts-ignore
  const { reqHandler } = await import('../dist/resolutions/server/server.mjs');
  return reqHandler(req as any, res as any);
}
