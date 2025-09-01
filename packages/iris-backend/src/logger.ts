import { pino } from 'pino';

const logger = pino({});

export const expressLogger = logger.child({ scope: 'express' });
export const dbLogger = logger.child({ scope: 'db' });
export const objLogger = logger.child({ scope: 'obj' });
