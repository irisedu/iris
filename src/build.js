import signale from 'signale'
import path from 'path'
import fs from 'fs-extra'
import anymatch from 'anymatch'
import { reporter } from 'vfile-reporter'
import { shouldBuild, recurseDirectory, getIgnoredPaths } from './utils.js'

import MarkdownFileProcessor from './compile/markdown/MarkdownFileProcessor.js'
import TeXFileProcessor from './compile/assets/TeXFileProcessor.js'
import NunjucksFileProcessor from './compile/assets/NunjucksFileProcessor.js'
import TomlFileProcessor from './compile/TomlFileProcessor.js'
import CatchAllFileProcessor from './compile/assets/CatchAllFileProcessor.js'

import SvgFileProcessor from './postCompile/SvgFileProcessor.js'
import HtmlFileProcessor from './postCompile/HtmlFileProcessor.js'

import StatsCollectionProcessor from './collectionProcessing/StatsCollectionProcessor.js'
import NetworkCollectionProcessor from './collectionProcessing/NetworkCollectionProcessor.js'
import SchemaCollectionProcessor from './collectionProcessing/SchemaCollectionProcessor.js'
import MarkdownAuxCollectionProcessor from './collectionProcessing/MarkdownAuxCollectionProcessor.js'

/**
 * Step 1: per-file compilation
 */
async function compileStep (config, inDir, outDir) {
  const processors = [
    new MarkdownFileProcessor(config),
    new TeXFileProcessor(config),
    new NunjucksFileProcessor(config),
    new TomlFileProcessor(config),
    new CatchAllFileProcessor(config),
    ...config.platform.pipeline.compile.map(C => new C(config))
  ]

  const tasks = []
  const handledFiles = {}

  await recurseDirectory(inDir, async (filePath) => {
    if (anymatch(getIgnoredPaths(config), filePath)) { return }

    for (const processor of processors) {
      if (!processor.handlesFile(filePath)) { continue }

      const inPath = path.join(inDir, filePath)
      const outPath = path.join(outDir, processor.constructor.getOutputPath(filePath))

      handledFiles[outPath] = inPath

      if (!await shouldBuild(inPath, outPath)) {
        signale.note('Skipping file', filePath, '(cached)')
        break
      }

      signale.await('Building file at', filePath, '...')
      tasks.push(processor.process({ inDir, outDir, filePath }))
      break
    }
  })

  return { vfiles: (await Promise.all(tasks)).filter(vf => vf), handledFiles }
}

/**
 * Step 2: per-file post-compilation/optimization
 */
async function postCompileStep (config, inDir, outDir, vfiles, handledFiles) {
  const processors = [
    new SvgFileProcessor(config),
    new HtmlFileProcessor(config),
    ...config.platform.pipeline.postCompile.map(C => new C(config))
  ]

  const tasks = []

  for (const vf of vfiles) {
    const inPath = path.join(inDir, vf.path)
    let outPath
    for (const [o, i] of Object.entries(handledFiles)) {
      if (i === inPath) {
        outPath = o
        break
      }
    }

    if (!outPath) { continue }

    for (const processor of processors) {
      if (!processor.handlesFile(outPath)) { continue }

      signale.await('Post-processing file at', vf.path, '...')
      tasks.push(processor.process({
        inDir: outDir,
        outDir,
        filePath: path.basename(outPath)
      }))
      break
    }

    await Promise.all(tasks)
  }
}

/**
 * Step 3: general collection processing
 */
async function collectionProcessStep (config, inDir, outDir, vfiles, handledFiles) {
  const processors = [
    new StatsCollectionProcessor(config),
    new NetworkCollectionProcessor(config),
    new SchemaCollectionProcessor(config),
    new MarkdownAuxCollectionProcessor(config),
    ...config.platform.pipeline.collectionProcessors.map(C => new C(config))
  ]

  const tasks = []

  for (const processor of processors) {
    signale.await('Running', processor.constructor.name, '...')
    tasks.push(processor.process({ inDir, outDir, vfiles, handledFiles }))
  }

  await Promise.all(tasks)
}

/**
 * Step 4: remove files whose source has been deleted
 */
async function cleanStep (handledFiles, outDir) {
  await recurseDirectory(outDir, async (filePath) => {
    const fullPath = path.join(outDir, filePath)
    if (!handledFiles[fullPath]) {
      signale.note('Removing file', filePath, '(original removed)')
      await fs.rm(fullPath)
    }
  })
}

export default async function build (config, projectPath) {
  const inDir = projectPath
  const outDir = path.join(projectPath, 'build')

  const { vfiles, handledFiles } = await compileStep(config, inDir, outDir)
  await postCompileStep(config, inDir, outDir, vfiles, handledFiles)
  await collectionProcessStep(config, inDir, outDir, vfiles, handledFiles)
  await cleanStep(handledFiles, outDir)

  console.log(reporter(vfiles))
}
