import signale from 'signale'
import { findProject, langtoolStart, handleExit } from '../utils.js'
import build from '../build.js'

export default async function handleBuild () {
  const { config, projectPath } = await findProject()
  const langtoolProcess = await langtoolStart(config.markdown.languagetool)

  await build(config, projectPath)

  handleExit(() => {
    signale.info('Exiting...')
    langtoolProcess.kill()
  })

  process.exit(0)
}
