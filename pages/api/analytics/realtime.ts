import type { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';
import fs from 'fs';

interface RealtimeResponse {
  activeUsers: number;
  cached: boolean;
  lastUpdated: number;
  error?: string;
  setupInstructions?: string;
}

// Caché en memoria en el servidor (persiste entre peticiones durante la vida del proceso)
let memoryCache: {
  activeUsers: number;
  lastUpdated: number;
} | null = null;

const CACHE_DURATION_MS = 60 * 1000; // 60 segundos = 1 minuto

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealtimeResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const now = Date.now();

  // 1. Si tenemos datos en caché de menos de 1 minuto, responder inmediatamente sin llamar a Google
  if (memoryCache && (now - memoryCache.lastUpdated < CACHE_DURATION_MS)) {
    return res.status(200).json({
      activeUsers: memoryCache.activeUsers,
      cached: true,
      lastUpdated: memoryCache.lastUpdated,
    });
  }

  // 2. Obtener el Property ID de Analytics (desde env o fallback)
  const propertyId = process.env.GA_PROPERTY_ID || '477135605';

  if (!propertyId) {
    // Si aún no está configurado el Property ID, responder con valor por defecto y guía
    return res.status(200).json({
      activeUsers: memoryCache ? memoryCache.activeUsers : 0,
      cached: false,
      lastUpdated: now,
      error: 'GA_PROPERTY_ID no está configurado en las variables de entorno.',
      setupInstructions: 'Agrega GA_PROPERTY_ID con tu ID de propiedad de Google Analytics en .env.local',
    });
  }

  try {
    const keyPath = path.join(process.cwd(), 'eva-ugel.json');
    let clientConfig: any = {};

    if (fs.existsSync(keyPath)) {
      clientConfig.keyFilename = keyPath;
    } else if (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY) {
      clientConfig.credentials = {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    const analyticsClient = new BetaAnalyticsDataClient(clientConfig);

    const [response] = await analyticsClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    const activeUsers = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

    // Guardar en la caché de 1 minuto
    memoryCache = {
      activeUsers,
      lastUpdated: now,
    };

    return res.status(200).json({
      activeUsers,
      cached: false,
      lastUpdated: now,
    });
  } catch (error: any) {
    console.error('Error al consultar Google Analytics Data API:', error);

    // Si ocurre un error (por ejemplo, cuota o fallo temporal), devolvemos el valor previo si existe
    if (memoryCache) {
      return res.status(200).json({
        activeUsers: memoryCache.activeUsers,
        cached: true,
        lastUpdated: memoryCache.lastUpdated,
        error: error?.message || 'Error temporal al consultar Analytics',
      });
    }

    return res.status(200).json({
      activeUsers: 0,
      cached: false,
      lastUpdated: now,
      error: error?.message || 'Error al conectar con Google Analytics',
    });
  }
}
