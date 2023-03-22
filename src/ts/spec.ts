// Spec System

//Recursive structure of a JSON Specification tree
import {UI} from "./main";

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
    rawPointers: string[];
    rawSpecs : RawSpec[];
    specTree: RawSpecTree;
    //Preliminary load, puts everything into a rawJSON map
    //and generate raw pointer list
    constructor(ui: UI) {
        this.ui = ui;
        this.ui.fs.fileRoot.syncRead((text)=> {this.jsonText=text});
        this.rawSpecs= JSON.parse(this.jsonText);
        for(let raw of this.rawSpecs){
            this.rawPointers.push(raw.pointer);
        }
        this.buildTree();
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
     * Queries for specs in the rawJSON specs
     * @param queries matchable through regular expressions,
     * for example /geometry/object1 -> /geometry/*
     */
    query(queries: string[]): RawSpec[]{
        let specs = [];
        for(let j = 0; j<queries.length; j++){
            specs[j] = undefined;
            for(let i = 0; i<this.rawPointers.length; i++){

            }
        }
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