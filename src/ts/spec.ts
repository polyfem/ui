// Spec System

//Recursive structure of a JSON Specification tree
import {UI} from "./main";
import {UFile} from "./server";

class Spec{
    name: string;
    isLeaf: boolean;
    subNodes: Spec[];
    //Optional subfields
    optional: Spec[];
    //Currently selected field
    field: string;
    type: string;
    selection: string[];
}

//Processes the JSON spec into populated trees and perform queries
class SpecEngine {
    ui: UI;
    jsonText: string;
    rawPointers: string[]=[];
    rawSpecs : RawSpec[]=[];
    specTree: RawSpecTree;
    specFile: UFile;
    //Preliminary load, puts everything into a rawJSON map
    //and generate raw pointer list
    constructor(ui: UI) {
        this.ui = ui;
        for(let file of this.ui.fs.fileRoot.children){//Locate the spec file
            if(file.name=='default_rules.json'){
                this.specFile = file;
                break;
            }
        }
        this.specFile.syncRead((text)=> {this.jsonText=text});
        this.rawSpecs= JSON.parse(this.jsonText);
        for(let raw of this.rawSpecs){
            this.rawPointers.push(raw.pointer);
        }
        this.buildTree();
        console.log(this.specTree);
    }

    /**
     * Builds an intermediate query representation of the spec tree structure
     */
    buildTree(){
        this.specTree = new RawSpecTree();
        for(let i = 0; i<this.rawPointers.length; i++){
            let rawSpec = this.rawSpecs[i];
            let subTree = this.specTree.traverse(this.rawPointers[i].split('/'));
            subTree.rawSpec = rawSpec;
        }
    }

    /**
     * Builds a minimal spec from the location given in the query
     * @param query a query matchable to a pointer, for example:
     *               /geometry/object1 -> /geometry/*
     */
    query(query: string): Spec{

        return undefined;
    }
    getSpecRoot(): Spec{
        return null;
    }
}

//Interface of a raw specification
interface RawSpec{
    "pointer": string,
    "default": any,
    "type": string,
    "required":string[],
    "optional":string[];
    "doc": string
}

//Interface of rawSpecTree, an intermediate representation
//of the spec structure
class RawSpecTree{
    subTree: {[key:string]: RawSpecTree}={};
    rawSpec: RawSpec;

    /**
     * Finds a sub tree of the given key, if not then
     * creates a new one under the key and returns it
     */
    findOrCreate(key: string){
        if(this.subTree[key])
            return this.subTree[key]
        else {
            let subSpec = new RawSpecTree();
            this.subTree[key] = new RawSpecTree();
            return subSpec;
        }
    }

    traverse(keys:string[]): RawSpecTree{
        if(keys.length==1){
            return this.findOrCreate(keys[0]);
        }else{
            let child = this.findOrCreate(keys.shift());
            return child.traverse(keys);
        }
    }


}

export {Spec, SpecEngine};