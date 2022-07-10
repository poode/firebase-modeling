const DbCollector = require('./DbCollector');
const Process = require('./Process');


async function main () {
    const SkitchCollection = new DbCollector();
    const ProcessFiles = new Process();
    const pathJsonFile = await SkitchCollection.main();
    jsonFile = require(pathJsonFile);
    ProcessFiles.subColl = [...new Set(Object.values(jsonFile).flat())]
    return ProcessFiles.main.bind(ProcessFiles)();
}


module.exports = main
