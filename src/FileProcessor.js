export default class FileProcessor {
  config

  constructor (config) {
    this.config = config
  }

  /**
   * Process the given file path relative to the project root. Optionally
   * returns a VFile representing the file processed.
   */
  async process ({ inDir, outDir, filePath }) {}

  /**
    * Returns whether this processor handles the given file path relative to
    * the project root.
    */
  handlesFile (filePath) {
    return false
  }

  /**
    * Accepts a file path relative to the project root and returns its
    * corresponding output path relative to the output root.
    */
  static getOutputPath (filePath) {
    return filePath
  }
}
