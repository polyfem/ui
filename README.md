# PolyFEM UI

Due to the greatly changed design of the UI interface, 
and the complexity of modular design that the previous UI has grown into,
it would be more difficult to try to understand the previous code base and
reshape it. 

Rather it would be much easier to start afresh and use the previously gathered
experiences in shaping the modular design of this UI. The development can
be greatly sped up by reusing the past visual/functional components that
are stand-alone and functionally complete. In this version, we will keep in mind the 
geometrical and logical flexibility of the UI design, and build its modularity
in a way that is logically straightforward and organized.

## Entry Points
**_For the sake of convenience, all related modules should hold reference to the main UI instance. 
All individual visual/logical components should hold references to the file that they are 
managing by referencing a FileHandle and its unique fileId (if applicable)._**

_src/js/main.ts:_

The central entry of the entire program. Hosts the main instance of the UI. The main
instance holds reference to all under modules, and is instantiated under the class `UI`.

```typescript
class UI{
    //...
}
```

_src/visual.ts:_

This newly created module will serve to handle all the visual layouts of the UI. Learning
from previous lessons, this time the UI will only have a single `root div` as the React anchor. 
So every visual layout changes can be made by directly modifying the contents of `visual.ts`.

```typescript
class Visual extends React.Component<any, any>{
    //... Being a Component itself respects the design intention of 
    // closed control of a React based UI.
}
```

_src/components/*_

This is the folder where all our other individual React components reside in.

_src/graphics.ts_

For the lack of a better name, this module will contain the graphical editor for visually
interacting with geometrical configurations for PolyFEM or other computational libraries.
This time Three.js would be used instead of Babylon, due to cleaner visuals and interactions
of Three.js, as well as its well-structured library for tooling supports (there were too much
niche tricks that had to be invented for doing customized things with Babylon). 

```typescript
//Graphical Editor
class GEditor{
    //Viewing or editing?
    editing: boolean;
    //...
}
```

_src/server.ts:_

Connects to the localhost server through the abstraction of a `FileSystem` interface.
```typescript
class UFileSystem{
    //Mounts the file system on top of the rootURL
    constructor(rootURL: string){
        //...
    }

    /**
     * Returns the root file,
     * which has the rootURL as its local location
     */
    getRoot(): UFile{
        return this.fileRoot;
    }
}

class UFile{
    //Abstraction of file reading/writing & directory access
}
```

_src/fileControl.ts:_

For expediting visual/contextual handling of individual files. The main module is the class `FileControl`, which maybe extended to 
handle of different file types. 

In particular, `JSONFileControl` which extends `FileControl`, provides
support for managing `.json` specs, by abstracting file edits through interface `GeometricOperation`, and hosting the redo/undo
stacks of these operations.
```typescript
class FileControl{
    fileName: string;
    fileReference: UFile;
    fileDisplay: HTMLElement;
    alternativeDisplay: HTMLElement;
}

class JSONFileControl extends FileControl {
    //...Supports control of a .json geometrical representation
}

/**
 * Provides the basic structure of a geometric operation
 * for storage purpose
 */
class GeometricOperation{
    geometryID: string;
    operation: string;
    parameters: number[];

    constructor(geometryID: string) {
        this.geometryID = geometryID
    }
}
```
### server/*
The local REST server is built in Node.js and technically is independent from the structural hierarchy of the entire Front End
(which is everything above). So its folder should be separated from the 'src/' source folder.

## Debugging
* `npm` commands now needs to be run with `--force` due to unknown versioning issues in React.