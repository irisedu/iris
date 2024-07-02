#!/usr/bin/env node

import { Command } from 'commander';
import handleBuild from './build.js';

const program = new Command();

program.name('patchouli').description('Modular document processor');

program
	.command('build')
	.description('Builds the current project')
	.option('-w, --watch', 'Whether to watch and serve development server')
	.option('-p, --port <number>', 'Port to use for development server', 58064)
	.action(handleBuild);

await program.parseAsync();
