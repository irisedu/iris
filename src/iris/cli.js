import signale from 'signale'
import fs from 'fs-extra'
import path from 'path'
import defaultUserConfig from '../defaultUserConfig.js'

async function handleNew () {
  const projectName = this.args[0]
  const seriesNames = this.args.slice(1)

  signale.await(`Creating new project '${projectName}' with series ${seriesNames.map(s => `'${s}'`).join(', ')}`)

  // Name validation
  for (const seriesName of seriesNames) {
    if (['patchouli.toml'].includes(seriesName)) {
      signale.error(`Series name '${seriesName}' is reserved`)
      return
    }
  }

  const projectDir = path.join(process.cwd(), projectName)

  if (await fs.exists(projectDir)) {
    signale.error('Project directory already exists!')
    return
  }

  // Project dir
  await fs.mkdir(projectDir)

  // User configuration
  await fs.writeFile(path.join(projectDir, 'patchouli.toml'), defaultUserConfig)

  // Series
  for (const seriesName of seriesNames) {
    const seriesDir = path.join(projectDir, seriesName)
    await fs.mkdir(seriesDir)

    await fs.writeFile(path.join(seriesDir, 'SUMMARY.md'), `---
title = 'Title of your new series! (path: ${seriesName})'

# Below are optional
authors = [ 'author1', 'author2' ]
tags = [ 'tag1', 'tag2' ]
---

You can insert a description of your series here.

:::summary
<!-- List all of your articles here -->

- [Preamble](/path/to/preamble)

## Chapter 1: Foo

- [Article 1](/path/to/article)
  - [Article 1.1]()
:::

You can also place additional markup here.
`)
  }

  signale.success('Done!')
}

export default function initCli (program) {
  const iris = program.command('iris')
    .description('Iris-specific commands')

  iris.command('new')
    .description('Create a new Iris project')
    .argument('<project>', 'The name of the project folder')
    .argument('<series...>', 'The names of the series folders to initialize')
    .action(handleNew)
}
