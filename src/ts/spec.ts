// Spec System

//Recursive structure of a JSON Specification tree
import {UI} from "./main";
import {UFile} from "./server";

class Spec{
    // Query gives precise location of the spec,
    // pointer permits * as wild cards
    query: string;
    pointer: string;
    name: string;
    isLeaf: boolean;
    //Automatically populated by required
    children: {[key: string]:Spec} = {};
    //Records the size of the subNodes, immutable
    private subNodesCount = 0;
    //Remaining fields are only informational
    doc: string;
    //Optional subfields
    optional: string[] = [];
    //Currently populated value
    value: any;
    type: string;
    selection: string[];

    /**
     * Specs must have a non-empty name
     * @param name
     */
    constructor(name: string){
        this.name = name;
    }
    /**
     * Smart pushes a child to subNodes, uses
     * index as key if type of this is array, otherwise
     * uses the name of the child as key.
     */
    pushChild(child: Spec){
        if(child==undefined) // Ignore undefined requests
            return;
        if(this.type == 'list'){
            this.children[this.subNodesCount] = child;
        }else if(this.type=='object'){
            this.children[child.name] = child;
        }else return; // Only list or object accepts child
        this.subNodesCount++;
    }
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
        console.log(this);
    }

    /**
     * Builds an intermediate query representation of the spec tree structure
     */
    buildTree(){
        this.specTree = new RawSpecTree();
        //Special case with the root spec, as '/' splits into ['','']
        //instead of ['']
        let subTree = this.specTree.traverse(['']);
        subTree.rawSpec = this.rawSpecs[0];
        for(let i = 1; i<this.rawPointers.length; i++){
            let rawSpec = this.rawSpecs[i];
            let subTree = this.specTree.traverse(this.rawPointers[i].split('/'));
            subTree.rawSpec = rawSpec;
        }
    }

    /**
     * Builds a minimal spec from the location given in the query
     * @param query a query matchable to a pointer, for example:
     *               /geometry/object1 -> /geometry/*
     * @param include selects which subSpecs to include from the tree
     */
    query(query: string, include:string[]=[]): Spec{
        let keys = query.split('/');
        console.log(keys);
        let loc = this.specTree.query(keys);
        if(loc==undefined)//Terminate if invalid query
            return undefined;
        let raw = loc.rawSpec;
        let spec = new Spec(keys.pop());
        //Fill out the fields of the spec
        spec.query = query;
        spec.pointer = raw.pointer;
        spec.type = raw.type;
        spec.doc = raw.doc;
        //Object type correspond to tree structures
        spec.isLeaf = ['object', 'list'].indexOf(raw.type)<0;
        //Load default value
        spec.value = raw.default;
        spec.optional = raw.optional;
        //Fill out the subNodes that have to be included
        for(let included of include){
            spec.pushChild(this.query(`${query}/${included}`));
        }
        //Fill out all the subNodes by recursively populating
        //the minimal trees of required fields
        if(raw.required){//If required is not undefined
            for(let required of raw.required){
                spec.pushChild(this.query(`${query}/${required}`));
            }
        }
        return spec;
    }

    /**
     * Builds a minimal spec from the original spec that starts at
     * the location given in the query. The original spec does not need to have
     * the query string populated.
     *
     * @param query specifies the location of the original spec within the larger spec tree
     * @param original original tree from which to start the validation process. the original
     * tree is left untouched, a new copy of the validated tree is generated and returned
     */
    validate(query:string, original:Spec): Spec{
        let keys = query.split('/');
        //Query for the raw spec for the original element
        let loc = this.specTree.query(keys);
        if(loc==undefined)//Terminate if invalid query
            return undefined;
        let raw = loc.rawSpec;
        let spec = new Spec(original.name);
        //Fill out the fields of the spec
        spec.query = query;
        spec.pointer = raw.pointer;
        spec.type = raw.type;
        spec.doc = raw.doc;
        spec.optional = raw.optional;
        // Non-object type corresponds to leaf nodes
        spec.isLeaf = ['object', 'list'].indexOf(raw.type)<0;
        //Load value from previous spec
        spec.value = original.value;
        //Make a list to record which subNodes have been included
        let included:string[] = [];
        //Validate recursively,
        // must deal with the possibility of misused indexing depending on
        // the type of spec
        for(let key in original.children){
            let subNodeName = original.children[key].name;
            // Record which nodes have already been included
            included.push(subNodeName);
            console.log(original.children[key]);
            console.log(this.validate(`${query}/${subNodeName}`, original.children[key]));
            //Populate the validated subNode
            spec.pushChild(this.validate(`${query}/${subNodeName}`, original.children[key]));
        }
        console.log(raw);
        //Fill out all the required fields that haven't been included
        if(raw.required){//If required is not undefined
            for(let required of raw.required){
                //Escape the subfields that are already included
                if(included.indexOf(required)<0){
                    let newQuery = `${query}/${required}`;
                    spec.pushChild(this.query(newQuery));
                    spec.isLeaf = false;
                }
            }
        }
        // if(raw.optional){//If required is not undefined
        //     for(let required of raw.optional){
        //         //Escape the subfields that are already included
        //         if(included.indexOf(required)<0){
        //             let newQuery = `${query}/${required}`;
        //             spec.pushChild(this.query(newQuery));
        //             spec.isLeaf = false;
        //         }
        //     }
        // }
        return spec;
    }
    getSpecRoot(): Spec{
        return this.query('',
            ['geometry','space','solver','boundary_conditions','materials','output']);
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
            this.subTree[key] = subSpec;
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

    findOnly(key: string){
        if(this.subTree[key])
            return this.subTree[key];
        else if(this.subTree['*'])
            return this.subTree['*'];
        else return undefined;
    }

    /**
     * Traverses without creating new raw specs, also matches
     * any key to '*' when no direct match is found
     * @param keys
     * @return subtree the corresponding RawSpec subtree if the query stirng
     * is found, undefined if no match is found
     */
    query(keys:string[]): RawSpecTree{
        if(keys.length==1){
            return this.findOnly(keys[0]);
        }else{
            let child = this.findOnly(keys.shift());
            if(child==undefined)
                return undefined;
            return child.query(keys);
        }
    }
}

export {Spec, SpecEngine};