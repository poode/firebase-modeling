const fs = require('fs');
const path = require('path');
const os = require('os');

const db = require('./db');
const { reject } = require('lodash');

class DbCollector {
    /**
     * 
     * @param {{fileName: string, exportFileName: string, exportPath: string, debug: {enabled:boolean, exportPath: string}}} opts opts.exportPath must be relative path
     */
    constructor ({
        fileName = 'pathSchema.txt',
        exportFileName = 'dbPaths.json',
        exportPath = os.homedir(),
        debug = { enabled: false, exportPath: '' }} = {})
    {
        this.fileName = fileName;
        this.exportPath = exportPath;
        this.exportFileName = exportFileName;
        this.debug = debug;

        if ((this.debug.enabled && !this.debug.exportPath) || (this.debug.exportPath && !this.debug.enabled)) throw new Error('Debug mode options should be added');

        if (this.debug.enabled) this.readFilePath = path.resolve(this.debug.exportPath, this.fileName)
        else this.readFilePath = path.resolve(this.exportPath, this.fileName)
    }

    /**
     * 
     * @returns {Promise<string[]>} array of collections' name
     */
    async listCollections () {
        const snapshot = await db.listCollections();
        return snapshot.map(snaps => snaps["_queryOptions"].collectionId || snaps.id);
    }

    /**
     * 
     * @param {string} collPath 
     * @returns {Promise<string[]>}
     */
    async getSubCollections (collPath) {
        const splitedPath = collPath.split('/')
        const isSubCollection = !Boolean(splitedPath.length % 2)
        const method = isSubCollection ? db.doc.bind(db) : db.collection.bind(db)
        const snapshot = isSubCollection ? [await method(collPath).get()] : (await method(collPath).get()).docs;
        const subCollections = await snapshot
            .reduce(async (acc, doc) => {
                const docPath = `${collPath}/${doc.id}`
                const list = await db.doc(docPath).listCollections();
                const accu = await acc;
                if (list.length) {
                    accu.push(await Promise.all(list.map(path => this.getSubCollections(`${docPath}/${path.id}`))));
                }

                const pathLength = this.debug && this.debug.enabled ? ` -- ${collPath.split('/').length} --` : ''
                accu.push(`${collPath}${pathLength}`);

                return [...new Set(accu.join(',').split(','))];
            }, Promise.resolve([]));
        return subCollections;
    }

    /**
     * 
     * @param {string[]} collNameList 
     * @returns 
     */
    async getCollectionWithSubCollectionArray (collNameList) {
        const subList = await Promise.all(collNameList.map(async collName => {
            return this.getSubCollections(collName);
        }));

        console.log('get full path of collections and subcollections!')
        return [...new Set(subList.join(',').split(','))].filter(i => !!i)
    }

    /**
     * 
     * @param {string[]} paths 
     * @param {{withCollection: boolean}} opts 
     * @returns {string[]}
     */
    getCollectionsWithSubCollection (paths, opts = { withCollection: false }) {
        return [...new Set(paths.map(path => {
            const splittedpath = path.split('/');
            const isSubCollection = Boolean(splittedpath.length % 2) && splittedpath.length !== 1;
            if(isSubCollection) return splittedpath.reduce((acc, sp, index) => {
                // if(Boolean(index % 2)) acc = acc.concat('/{document}/')
                if (index === 0) acc = acc.concat(sp);
                else acc = acc.concat(`/${sp}`);
                return acc
            },'')

            if(opts.withCollection) return path;
            // return path;
        })
        .filter(i => !!i))]
        
    }

    /**
     * 
     * @param {string} filePath 
     * @param {{collections: boolean, withSubCollections: boolean}} opts
     * @returns {Promise<{collections?: string[],collectionsWithSubcollections?:string[]}|string[]>}
     */
    async readFile (filePath, opts = { withSubCollections: false }) {
        return new Promise((resolve, reject) => {
            let buf = '';
            const fileStream = fs.createReadStream(path.resolve(filePath));
            
            fileStream.on('data', chunk => buf = buf.concat(chunk));
            fileStream.on('error',reject);
            fileStream.on('end', () => {
                const lines = buf.toString().split('\n');
                const cleanLines = lines.map(line => line.replace(/( -- \d+ --)$/gi, ''))
                .filter(i => !!i)
                const collections = [...new Set(cleanLines.map(line => line.split('/')[0]))]
                if (opts.withSubCollections) return resolve(this.getCollectionsWithSubCollection(cleanLines))
               
                return resolve(collections)
            })
            
        })
    }

    /**
     * 
     * @param {string[]} collectionsArray 
     */
    processFiles (collectionsArray) {
        return new Promise((resolve, reject) => {
            const wStream = fs.createWriteStream(this.readFilePath,{ encoding: 'utf-8'})
            wStream.write(collectionsArray.join('\n'), async (err) => {
                if(err) reject(err);
                const collections = await this.readFile(this.readFilePath);
                const collectionsWithSubcollections = await this.readFile(this.readFilePath, { withSubCollections: true });
                const result = { collections, collectionsWithSubcollections };
                const jsonWriteStream = fs.createWriteStream(
                    path.resolve(
                        this.debug.exportPath
                        || this.exportPath, this.exportFileName
                        || 'dbPaths.json'), { encoding: 'utf-8'})

                jsonWriteStream.write(JSON.stringify(result), err => {
                    if(err) reject(err);
                    console.log('Done, processFiles in DbCollector');
                    resolve(path.resolve(`${this.exportPath}/${this.exportFileName}`));
                })
            })
        })
    }

    /**
     * The main method
     * @returns 
     */
    async main () {
        const list = await this.listCollections();
        const collArray = await this.getCollectionWithSubCollectionArray(list);
        return this.processFiles(collArray);
    }
}

module.exports = DbCollector;