const DbCollector = require('../index');
// const dbPaths = require('./dbFullPath.json');
// const dbPaths = require('./test-dbPath.json');
const dbPaths = require('./test-capcityDbPath.json');
const FindSchema = require('../FindSchema');

// const DbColl = new DbCollector({ debug: { enabled: true, exportPath: __dirname}, exportFileName: 'dbFullPath.json' });

// DbColl.main.bind(DbColl)()
// .catch(console.error)

Promise.all(dbPaths.collectionsWithSubcollections.map(path => {
    const FindSchemaInstance = new FindSchema();
    return FindSchemaInstance.getOneCollectionSchema(path)
}))
.then(resArr => {
    const uni = [...new Set(resArr)];
    console.log(uni)
})
.catch(console.error)


// write result to json first time
// require the the json file and then push onto the array
// and then overwrite the json file
//now I will have an array with duplicated elements
// remove duplication
// play with object keys and make them /{document}/ 
// now I have duplicated objects
// remove duplication
// then vooooooooooyla ! schema is ready :D