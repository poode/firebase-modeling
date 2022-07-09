# Firebase/Firestore Schema Finder
 Since I asked this question [Database modeling to migrate to mongodb](https://stackoverflow.com/questions/72815824/database-modeling-to-migrate-to-mongodb).
 I got no answers so I started the hard way to find my project schema for each entity.

 Project is still under development and of course bug can be showen at any time :)
 Also It was a sketchy code I did not take care of code quality so you are welcome to enahnce with me.

![Image](/static/img.png)

### Result is like that: 

```
{
    "testCollection/{document}/anotherSubCollection": {
        "anyField": "String"
    },
    "testCollection": {
        "stringFiled": "String",
        "nullField": "Null",
        "geoPointField": "GeoPoint",
        "arrayFiled": "Array",
        "boolenField": "Boolean",
        "numberFiled": "Integer",
        "refField": "Reference",
        "timestampFiled": "Timestamp",
        "mapFiled": "Map",
        "testField": "String",
        "anotherTestField": "String"
    },
    "testCollection/{document}/testSubCollection": {
        "testSubcollectionField": "String"
    },
    "testCollection/{document}/anotherSubCollection/{document}/subOfSubCollection": {
        "anyField": "String"
    }
}

```

## Note
You will get generated files in your home directory as below:
* `pathSchema.txt` where I collect the full paths to process later.
* `dbPaths.json` where I get the collectiona and subcollections full paths.
* `schema.json` where We can get the final result.

 ## Known Issue:
 The script takes too much time, this is becuase of db data, as the script loop on each document to find sub-collections 