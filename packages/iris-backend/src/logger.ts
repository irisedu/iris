import { pino } from 'pino';

const logger = pino({});

export const expressLogger = logger.child({ scope: 'express' });
