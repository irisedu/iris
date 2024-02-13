import RecursiveDirectoryBuildTask from './RecursiveDirectoryBuildTask.js';
import AssetBuildTask from './AssetBuildTask.js';

export default class AssetsBuildTask extends RecursiveDirectoryBuildTask {
    async addPath(inPath, outPath, taskRunner) {
        taskRunner.push(new AssetBuildTask(inPath, outPath));
        return outPath;
    }
}
