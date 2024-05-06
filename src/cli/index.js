#!/usr/bin/env node

import { Command } from 'commander'
import handleBuild from './build.js'

const program = new Command()

program.name('patchouli')
  .description('Modular document processor')

program.command('build')
  .description('Builds the current project')
  .action(handleBuild)

await program.parseAsync()
