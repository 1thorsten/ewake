import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {existsSync, unlinkSync} from "fs";

function listFilesRecursively(dir: string, suffixes: string[], filelist: string[] = []): string[] {
    fs.readdirSync(dir).forEach(file => {
        const joinedPath = path.join(dir, file);
        filelist = fs.statSync(joinedPath).isDirectory()
            ? listFilesRecursively(joinedPath, suffixes, filelist)
            : filelist.concat(joinedPath);

    });
    return filelist.filter(file => suffixes?.findIndex(suffix => file.endsWith(suffix)) !== -1);
}

(async () => {
    try {
        const baseDir = process.argv[2];
        if (!baseDir) {
            console.error(`USAGE: ${process.argv0} ${process.argv[1]} directory${os.EOL}Error: Please specify directory`);
            process.exit(1);
        }
        if (!existsSync(baseDir)) {
            console.log(`Directory '${baseDir}' does not exist.`);
            return;
        }
        console.log("show files: " + baseDir);

        const fileList = listFilesRecursively(baseDir, [".js", ".js.map"]);
        console.log(fileList);
        fileList.forEach(file => unlinkSync(file));
    } catch (error) {
        console.error(error);
    }
})();
