import { pino } from 'pino';

const logger = pino({});

export const expressLogger = logger.child({ scope: 'express' });
export const indexerLogger = logger.child({ scope: 'indexer' });
export const dbLogger = logger.child({ scope: 'db' });
