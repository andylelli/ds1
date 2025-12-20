
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infra/logging/LoggerService.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, body } = req;

  // Log Request Start
  // Sanitize body if needed (e.g. remove passwords)
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) sanitizedBody.password = '***';

  // We log the start as debug to avoid noise, or info if we want full trace
  logger.debug(`[REQ] ${method} ${url}`, { body: sanitizedBody });

  // Hook into response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    logger.info(`[API] ${method} ${url} ${status} ${duration}ms`, {
      method,
      url,
      status,
      duration,
      userAgent: req.get('user-agent')
    });
  });

  next();
}
