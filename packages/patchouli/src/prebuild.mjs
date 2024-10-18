#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distConfigPath = path.join(import.meta.dirname, 'distConfig.json');

console.log('== PATCHOULI: CHECK DISTRIBUTION CONFIG ==\n');
console.log(fs.readFileSync(distConfigPath, 'utf-8'));
