/**
 * Health Checks Middleware
 * UGC Maroc - Monitoring de la santé du système
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Resend } from 'resend';

// Configuration des services
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const r2Client = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Vérifications de santé individuelles
const healthChecks = {
  // Vérification de la base de données Supabase
  async database() {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - start;
      
      if (error) {
        return {
          status: 'error',
          message: `Database error: ${error.message}`,
          responseTime
        };
      }
      
      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
        recordCount: data?.length || 0
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
        responseTime: null
      };
    }
  },

  // Vérification de Cloudflare R2
  async storage() {
    try {
      const start = Date.now();
      const command = new HeadObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: 'health-check.txt'
      });
      
      await r2Client.send(command);
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'R2 storage accessible',
        responseTime
      };
    } catch (error) {
      // Si le fichier n'existe pas, c'est normal, on teste juste la connexion
      if (error.name === 'NotFound') {
        return {
          status: 'healthy',
          message: 'R2 storage accessible (file not found is expected)',
          responseTime: Date.now() - Date.now()
        };
      }
      
      return {
        status: 'error',
        message: `R2 storage error: ${error.message}`,
        responseTime: null
      };
    }
  },

  // Vérification du service email Resend
  async email() {
    try {
      if (!process.env.RESEND_API_KEY) {
        return {
          status: 'warning',
          message: 'Resend API key not configured',
          responseTime: null
        };
      }
      
      const start = Date.now();
      // Test simple de l'API Resend
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        }
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          status: 'healthy',
          message: 'Resend email service accessible',
          responseTime
        };
      } else {
        return {
          status: 'error',
          message: `Resend API error: ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Email service error: ${error.message}`,
        responseTime: null
      };
    }
  },

  // Vérification des services AI
  async ai() {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return {
          status: 'warning',
          message: 'OpenRouter API key not configured',
          responseTime: null
        };
      }
      
      const start = Date.now();
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          status: 'healthy',
          message: 'AI services accessible',
          responseTime
        };
      } else {
        return {
          status: 'error',
          message: `AI service error: ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `AI service error: ${error.message}`,
        responseTime: null
      };
    }
  },

  // Vérification de Stripe
  async payments() {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          status: 'warning',
          message: 'Stripe API key not configured',
          responseTime: null
        };
      }
      
      const start = Date.now();
      const response = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          status: 'healthy',
          message: 'Stripe payment service accessible',
          responseTime
        };
      } else {
        return {
          status: 'error',
          message: `Stripe API error: ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Payment service error: ${error.message}`,
        responseTime: null
      };
    }
  }
};

// Fonction principale de health check
export const performHealthCheck = async () => {
  const startTime = Date.now();
  const results = {};
  
  // Exécuter toutes les vérifications en parallèle
  const checkPromises = Object.entries(healthChecks).map(async ([name, check]) => {
    try {
      const result = await check();
      return [name, result];
    } catch (error) {
      return [name, {
        status: 'error',
        message: `Health check failed: ${error.message}`,
        responseTime: null
      }];
    }
  });
  
  const checkResults = await Promise.all(checkPromises);
  
  // Organiser les résultats
  checkResults.forEach(([name, result]) => {
    results[name] = result;
  });
  
  // Déterminer le statut global
  const allStatuses = Object.values(results).map(r => r.status);
  const hasErrors = allStatuses.includes('error');
  const hasWarnings = allStatuses.includes('warning');
  
  let overallStatus = 'healthy';
  if (hasErrors) {
    overallStatus = 'unhealthy';
  } else if (hasWarnings) {
    overallStatus = 'degraded';
  }
  
  const totalTime = Date.now() - startTime;
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: totalTime,
    services: results,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
};

// Middleware pour l'endpoint /health
export const healthCheckMiddleware = async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check system failure',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Middleware pour l'endpoint /health/ready (pour Kubernetes)
export const readinessCheck = async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();
    
    // Ready si au moins la DB et le storage fonctionnent
    const criticalServices = ['database', 'storage'];
    const criticalStatuses = criticalServices.map(service => 
      healthStatus.services[service]?.status
    );
    
    const isReady = criticalStatuses.every(status => 
      status === 'healthy' || status === 'warning'
    );
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        message: 'Service is ready to accept traffic',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
        criticalServices: criticalStatuses
      });
    }
  } catch (error) {
    console.error('❌ Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      message: 'Readiness check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Middleware pour l'endpoint /health/live (pour Kubernetes)
export const livenessCheck = (req, res) => {
  res.status(200).json({
    status: 'alive',
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
};

export default {
  performHealthCheck,
  healthCheckMiddleware,
  readinessCheck,
  livenessCheck
};
