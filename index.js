const DbCollector = require('./DbCollector');
const Process = require('./Process');


async function main () {
    const SkitchCollection = new DbCollector();
    const ProcessFiles = new Process();
    const pathJsonFile = await SkitchCollection.main();
    ProcessFiles.subColl = require(pathJsonFile).collectionsWithSubcollections;
    return ProcessFiles.main.bind(ProcessFiles)();
}


module.exports = main
