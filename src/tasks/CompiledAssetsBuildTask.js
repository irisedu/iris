import RecursiveDirectoryBuildTask from './RecursiveDirectoryBuildTask.js';
import CompiledAssetBuildTask from './CompiledAssetBuildTask.js';

export default class CompiledAssetsBuildTask extends RecursiveDirectoryBuildTask {
    async addPath(inPath, outPath, taskRunner) {
        const compiledPath = CompiledAssetBuildTask.resolveCompiledPath(outPath);
        taskRunner.push(new CompiledAssetBuildTask(inPath, compiledPath));

        return compiledPath;
    }
}
