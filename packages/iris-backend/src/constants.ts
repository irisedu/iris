import path from 'path';

export const spaRoot = process.env.SPA_ROOT || path.join(process.cwd(), 'spa');
