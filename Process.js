const fs = require('fs');
const path = require('path');
const os = require('os');

const FindSchema = require('./FindSchema');

module.exports = class Process {
    constructor (subColl, opts = { chunkSize: 2, exportPath: os.homedir(), fileName: 'schema.json' }) {
        this.subColl = subColl
        this.opts = opts
        this.filePath = path.resolve(`${this.opts.exportPath}/${this.opts.fileName}`);
    }

    chunkArray (array, chunkSize) {
        const result = []
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize);
            result.push(chunk);
        }

        return result;
    }

    sleep (interval) {
        return new Promise(resolve => setTimeout(resolve, interval))
    }

    collectOneArray () {
        return new Promise(async (resolve, reject) => {
            const file = await fs.promises.readFile(this.filePath);
            const fileStr = file.toString();
            const matchedObjectList = fileStr.match(/\[(.*?)\]/gs).map((item) => {
                return JSON.parse(item)
            }, {}).flat()

            const uniArrat = [...new Set(matchedObjectList)];
            const wStream = fs.createWriteStream(this.filePath, { encoding: 'utf-8' });
            wStream.write(JSON.stringify(uniArrat), err => {
                if(err) reject(err);
                console.log('Malformed json file has been created');
                resolve();
            })
        })
    }


    handelRepeatedProps (arr) {
        return arr.reduce((acc, obj) => {
            Object.keys(obj).map(key => {
              acc[key] = {...acc[key], ...obj[key]}
            })

            return acc
        }, {})
    }

    handelRepeated () {
        const jsonArr = require(this.filePath);
        const cleanedFile = jsonArr.map(obj => {
            return Object.keys(obj).reduce((acc, key) => {
                const splittedpath = key.split('/');
                let newKey;
                const isSubCollection = Boolean(splittedpath.length % 2);
                if(isSubCollection) newKey = splittedpath.reduce((accu, sp, index) => {
                    if(Boolean(index % 2)) accu = accu.concat('/{document}/')
                    else accu = accu.concat(`${sp}`);
                    return accu
                },'')
                acc[newKey] = obj[key];
                return acc;
            }, {})
        })

        const exactNeededArray = this.handelRepeatedProps(cleanedFile);
        const wStream = fs.createWriteStream(this.filePath, { encoding: 'utf-8' });
        wStream.write(JSON.stringify(exactNeededArray), err => {
            if(err) throw err;
            console.log('Done, cleaned json file is ready');
        })
    }

    async main () {
        const chunkedArr = this.chunkArray(this.subColl, this.opts.chunkSize);
        console.log(`chunkedArr Length: ${chunkedArr.length}`);
        console.log(`chunk length: ${this.opts.chunkSize}`);
        const wStream = fs.createWriteStream(this.filePath, { encoding: 'utf-8', flags: 'a' });
        await Promise.all(chunkedArr.map(async (array, index) => {
            const resArr = await Promise.all(array.map(path => {
                const FindSchemaInstance = new FindSchema();
                return FindSchemaInstance.main(path)
            }));
            
            console.log(`Handeling now ${JSON.stringify(array)}`)
            const chunkedRuslt = [...new Set(resArr)];
            wStream.write(JSON.stringify(chunkedRuslt), err => {
                if(err) throw err;
                console.log(`done with chunk number ${index}`)
            })

            return this.sleep(2 * 1000);
        }))
        
        console.log('making a good json file!')
        await this.collectOneArray();
        this.handelRepeated();
        console.log(`The Full schema is in ${this.filePath}`)
    }
}