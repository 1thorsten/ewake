"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const os = require("os");
const fs_1 = require("fs");
function listFilesRecursively(dir, suffixes, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const joinedPath = path.join(dir, file);
        filelist = fs.statSync(joinedPath).isDirectory()
            ? listFilesRecursively(joinedPath, suffixes, filelist)
            : filelist.concat(joinedPath);
    });
    return filelist.filter(file => (suffixes === null || suffixes === void 0 ? void 0 : suffixes.findIndex(suffix => file.endsWith(suffix))) !== -1);
}
(async () => {
    try {
        const baseDir = process.argv[2];
        if (!baseDir) {
            console.error(`USAGE: ${process.argv0} ${process.argv[1]} directory${os.EOL}Error: Please specify directory`);
            process.exit(1);
        }
        if (!fs_1.existsSync(baseDir)) {
            console.log(`Directory '${baseDir}' does not exist.`);
            return;
        }
        console.log("show files: " + baseDir);
        const fileList = listFilesRecursively(baseDir, [".js", ".js.map"]);
        console.log(fileList);
        fileList.forEach(file => fs_1.unlinkSync(file));
    }
    catch (error) {
        console.error(error);
    }
})();
//# sourceMappingURL=RemoveTranspiledFiles.js.map