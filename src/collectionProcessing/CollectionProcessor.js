export default class CollectionProcessor {
  config

  constructor (config) {
    this.config = config
  }

  /**
   * Process the collection at the given directory with the given VFiles and
   * file map.
   */
  async process ({ inDir, outDir, vfiles, handledFiles }) {}
}
