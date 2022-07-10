const _ = require('lodash')
const db = require('./db');

class FindSchema {
    /**
     * 
     * @param {{ debug:{enabled: boolean}}} opts 
     */
  constructor ({ debug = { enabled: false } } = { }) {
    this.debug = debug;
    if(debug.enabled) console.log(this);
    this.schema = {};
    this.pathStr = '';
  }

  typeOf(obj) {
    const objProto = obj._fieldsProto;
    const keys = Object.keys(objProto);
    return keys.reduce((acc, key) => {
      acc[key] = objProto[key].valueType.replace('Value', '')
      .replace(/./, c => c.toUpperCase())
      return acc
    }, {})
  }

  getSchemaFromArray (docs) {
    return docs.reduce((acc, doc) => ({ ...acc, ...this.typeOf(doc)}),{});
  }

  popLastsubCollFromPath (splitter, str) {
    const splitedStr = str.split(splitter);
    return splitedStr.slice(0, splitedStr.length - 1).join(splitter);
  }

  async main (collectionFullPath) {
    try {
      const splitter = '/';
      const fullPath = collectionFullPath
      if (!this.pathStr) this.pathStr = fullPath;
      const { docs } = await db.collection(this.pathStr).get();
      const innerCollSchema = this.getSchemaFromArray(docs);
      const splittedPath = this.pathStr.split(splitter);
      const collPathArr = splittedPath.slice(0,splittedPath.length-1);
      this.pathStr = collPathArr.join(splitter);
      if (collPathArr.length > 2) {
        this.pathStr = this.popLastsubCollFromPath(splitter, this.pathStr);
        const { docs: docList } = await db.collection(this.pathStr).get();
        this.schema = {
          ...this.schema,
          [this.pathStr]: { ...this.getSchemaFromArray(docList) },
          ...await this.main(collectionFullPath)
        }
        return this.schema;
      }
    else if (!collPathArr.length) return this.schema;
    else {
      this.pathStr = this.popLastsubCollFromPath(splitter, this.pathStr);
      const { docs: docList } = await db.collection(this.pathStr).get();
      return {
        ...this.schema,
        [fullPath]: { ...innerCollSchema },
        [this.pathStr]: { ...this.getSchemaFromArray(docList) },
      }
    }
    } catch (error) {
      this.pathStr = '';
      console.error('Error with Path: ', collectionFullPath)
      console.error(error);
      if (error.message.includes('The requested snapshot version is too old.')) {
        const splittedPath = collectionFullPath.split('/');
        const path = splittedPath.slice(0, splittedPath.length - 1).join('/');
        console.log('Deleting this old Document!')
        await db.doc(path).delete();
      }
    }
  }
}


module.exports = FindSchema;