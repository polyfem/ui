// Spec System

//Recursive structure of a JSON Specification tree
import {UI} from "./main";
import {UFile} from "./server";

/**
 * Implements a simple event tree
 */
class Spec{
    // Query gives precise location of the spec,
    // pointer permits * as wild cards
    query: string;
    /**
     * Updates query value and name of this and all subsequent
     * queries recursively to reflect the children key-value structure;
     * to be called duration deletion, or addition of nodes, or renaming
     * should occur
     */
    updateQueries(parentQuery: string, thisName:string){
        this.name = thisName;
        this.query = `${parentQuery}/${thisName}`;
        for(let key in this.children){
            this.children[key].updateQueries(this.query, key);
        }
    }
    pointer: string;
    name: string;
    isLeaf: boolean = false;
    parent: Spec;
    //Tentative specs are disabled before they are confirmed
    tentative: boolean = false;
    //Delete ready prepares the spec for deletion
    deleteReady: boolean = false;
    //Spec editing option
    editing: boolean = false;
    //Editing enables deletion tags for all fields
    private deletingState: boolean = false;
    //^| setters/getters
    set deleting(deleting: boolean){
        this.deletingState = deleting;
        if(!this.isLeaf)
            for(let key in this.children){
                this.children[key].deleting = deleting;
            }
    }
    get deleting(){
        return this.deletingState;
    }

    //Automatically populated by required
    children: {[key: string]:Spec} = {};
    //Records the size of the subNodes, immutable
    subNodesCount = 0;
    //Remaining fields are only informational
    doc: string;
    //Optional subfields
    optional: string[] = [];
    //Currently populated value
    value: any;

    /**
     * Sets the value of this, excluded services are prevented from
     * being dispatched
     * @param newValue
     */
    setValue(newValue:any){
        this.value = newValue;
        this.dispatchValueChange();
        this.dispatchChange(this.query,'v');
    };

    //Value dispatcher
    protected dispatchValueChange(){
        for(let service of this.valueServices){
            service(this.value);
        }
    }

    /**
     * Services subscribed to value updates
     */
    valueServices: ((newValue:any)=>void)[]=[];
    subscribeValueService(service:(newValue:any)=>void){
        this.valueServices.push(service);
        return service;
    }
    unsubscribeValueService(service:(newValue:any)=>void){
        let index = this.valueServices.indexOf(service);
        if(index!=-1)
            this.valueServices.splice(index,1);
    }

    /*
     * Services subscribed to value change or children change,
     * children change include child count or child recursive change
     */
    changeServices: ((changeQuery:string, target:Spec, event:string)=>void)[]=[];
    subscribeChangeService(service:(query:string, target:Spec,event:string)=>void){
        this.changeServices.push(service);
        return service;
    }
    unsubscribeChangeService(service:(query:string, target:Spec,event:string)=>void){
        let index = this.changeServices.indexOf(service);
        if(index!=-1)
            this.changeServices.splice(index,1);
    }
    /**
     * Dispatched any time value is changed if leaf, or children size/value
     * change if non-leaf. Dispatches self services first before propagating
     * upward
     * @param query
     * @param event `r` for recursive, `ca` for child add,
     * `cd` for child deletion, `i` for initialization, `v` for value change
     */
    protected dispatchChange(query:string, event: string){
        for(let service of this.changeServices){
            service(query, this,event);
        }
        if(this.parent!=undefined&&this.parent.children[this.name]!=undefined)
            this.parent.dispatchChange(query, event);
    }

    /**
     * One of object, list, float, string
     */
    type: string;
    selection: string[];
    typename: string;
    // For selecting the corresponding subset of type
    typeIndex = -1;

    private selectedStore = false;
    selectionServices:((target: Spec, selected:boolean)=>void)[]= [];
    private secondarySelectedStore = false;
    secondarySelectionServices:((target: Spec, selected:boolean)=>void)[]= [];

    /**
     * Sets the value of primary selection,
     * dispatches the selection event
     * @param selected
     */
    set selected(selected:boolean){
        this.selectedStore = selected;
        this.dispatchSelection(selected);
    }
    get selected(){
        return this.selectedStore;
    }
    protected dispatchSelection(selected:boolean){
        for(let service of this.selectionServices){
            service(this, selected);
        }
    }

    /**
     * Sets the value of secondary selection,
     * dispatches the selection event
     * @param selected
     */
    set secondarySelected(selected:boolean){
        this.secondarySelectedStore = selected;
        this.dispatchSecondarySelection(selected);
    }
    get secondarySelected(){
        return this.secondarySelectedStore;
    }
    protected dispatchSecondarySelection(selected:boolean){
        for(let service of this.secondarySelectionServices){
            service(this, selected);
        }
    }

    subscribeSelectionService(service:(target:Spec, selected:boolean)=>void, primary:boolean){
        if(primary){
            this.selectionServices.push(service);
        }else{
            this.secondarySelectionServices.push(service);
        }
    }

    unsubscribeSelectionService(service:(target:Spec, selected:boolean)=>void, primary:boolean){
        if(primary){
            let key = this.selectionServices.indexOf(service);
            if(key!=-1)
                this.selectionServices.push(service);
        }else{
            let key = this.secondarySelectionServices.indexOf(service);
            if(key!=-1)
                this.secondarySelectionServices.push(service);
        }
    }

    /**
     * Set to true after the spec has been newly
     * turned from tentative to added, this value being set to
     * true will make the added field expand for preview
     */
    forceExpansion = false;
    /**
     * Specs must have a non-empty name
     * @param name
     * @param parent
     * @param isLeaf
     */
    constructor(name: string, parent: Spec, isLeaf=false){
        this.name = name;
        this.parent = parent;
        this.isLeaf = isLeaf;
    }
    loadFromJSON(json:any){
        if(typeof json == 'object'){
            this.type = Array.isArray(json)?'list':'object';
            for(let key in json){
                let nextSpec = new Spec(key, this);
                nextSpec.loadFromJSON(json[key]);
                this.pushChild(nextSpec);
            }
            this.isLeaf = false;
        }
        else{
            this.type = typeof json;
            if(this.type=='number')
                this.type = 'float';
            this.value = json;
            this.isLeaf = true;
        }
        this.dispatchChange(this.query, 'i');
    }
    /**
     * Smart pushes a child to subNodes, uses
     * index as key if type of this is array, otherwise
     * uses the name of the child as key.
     */
    pushChild(child: Spec){
        if(child==undefined) // Ignore undefined requests
            return;
        console.log(this);
        if(this.type == 'list'){
            child.updateQueries(this.query,`${this.subNodesCount}`);
            this.children[this.subNodesCount] = child;
        }else if(this.type=='object'){
            this.children[child.name] = child;
            child.updateQueries(this.query,`${child.name}`);
        }else return; // Only list or object accepts child
        child.parent = this;
        this.subNodesCount++;
        this.dispatchChange(child.query, 'ca');
    }
    removeChild(child: Spec){
        if(child.parent == this && child.name in this.children){
            if(this.type=='object'){
                child.dispatchChange(child.query, 'cd');
                delete this.children[child.name];
                this.subNodesCount--;
            }else if(this.type=='list'){
                let index = Number(child.name);
                this.subNodesCount--;
                child.dispatchChange(child.query, 'cd');
                while(index<this.subNodesCount){
                    this.children[index] = this.children[index+1];
                    this.children[index].updateQueries(this.query,`${index}`);
                    index++;
                }
                delete this.children[this.subNodesCount];
            }
        }
    }

    /**
     * Retrieves the corresponding child from up to the
     * current spec
     * @param query query separated by /
     * @param force if force query, then all missing children will be added,
     *    isLeaf will always be set to false to ensure the correct returned value
     */
    findChild(query: string, force = false){
        let keys = query.split('/');
        let child:Spec = this;
        while(keys.length>0){
            if(keys[0]==''||keys[0]=='.'){//Check for pseudo path
                keys.shift();
            }
            else if(child && !child.isLeaf) {
                let key = keys.shift();
                if(force && child.children[key]==undefined){
                    child.children[key] = new Spec(key, this);
                    child.query = `${this.query}/${child.name}`;
                    child.parent = this;
                    this.isLeaf = false;
                    this.dispatchChange(this.query,'ca');
                }
                child = child.children[key];
            }
            else
                return undefined;
        }
        return child;
    }

    /**
     * Matches all children satisfying the pointer criteria
     * @param keys
     */
    matchChildren(...keys: string[]):Spec[]{
        //Skip redundant pseudo path
        while(keys.length>1&&(keys[0]=='.'||keys[0]==''))
            keys.shift();
        if(keys.length==0||keys[0]=='.'||keys[0]=='')
            return [this];
        else if(keys[0]=='*'){
            let matchedChildren:Spec[] = [];
            keys.shift();
            for(let key in this.children){
                matchedChildren.push(...this.children[key].matchChildren(...keys));
            }
            return matchedChildren;
        }
        else return (this.children!=undefined&&this.children[keys[0]]!=undefined)?
                this.children[keys.shift()].matchChildren(...keys):[];
    }

    /**
     * Recursively sets this and all
     * its subsequent children with the assigned value of
     * tentative
     * @param tentative
     */
    setTentative(tentative: boolean){
        this.tentative = tentative;
        for(let key in this.children){
            this.children[key].setTentative(tentative);
        }
    }

    /**
     * Recursively sets this and all
     * its subsequent children with false value of
     * delete ready
     */
    cancelDelete(){
        this.deleteReady = false;
        for(let key in this.children){
            this.children[key].cancelDelete();
        }
    }

    /**
     * Recursively delete all elements of this that are
     * delete ready except self
     */
    confirmDelete(){
        if(this.type == 'object')
            for(let key in this.children){
                if(this.children[key].deleteReady){
                    this.removeChild(this.children[key]);
                }else{
                    this.children[key].confirmDelete();
                }
            }
        else
            for(let key = 0; key<this.subNodesCount; ){
                if(this.children[key].deleteReady){
                    this.removeChild(this.children[key]);
                }else{
                    this.children[key].confirmDelete();
                    key++;
                }
            }
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
        //rawSpecs[0] corresponds to pointer: '/'
        subTree.rawSpec[0] = this.rawSpecs[0];
        for(let i = 1; i<this.rawPointers.length; i++){
            let rawSpec = this.rawSpecs[i];
            let subTree = this.specTree.traverse(this.rawPointers[i].split('/'));
            subTree.rawSpec.push(rawSpec);
        }
    }

    /**
     * Builds a minimal spec from the location given in the query
     * @param query a query matchable to a pointer, for example:
     *               /geometry/object1 -> /geometry/*
     * @param parent
     * @param include selects which subSpecs to include from the tree
     * @param typeOverride overrides which instance of the matched rawSpec is to be utilized. Can only
     * be specified to the level of the query (non recursive), default 0
     */
    query(query: string, parent: Spec, include:string[]=[], typeOverride:number=0): Spec{
        let keys = query.split('/');
        console.log(keys);
        let loc = this.specTree.query(keys);
        if(loc==undefined)//Terminate if invalid query
            return undefined;
        let raw = loc.rawSpec[typeOverride];
        let spec = new Spec(keys.pop(), parent);
        //Fill out the fields of the spec
        spec.query = query;
        spec.pointer = raw.pointer;
        spec.type = raw.type;
        spec.typename = raw.typename;
        spec.typeIndex = typeOverride;
        spec.doc = raw.doc;
        //Object type correspond to tree structures
        spec.isLeaf = ['object', 'list'].indexOf(raw.type)<0;
        //Load default value
        spec.value = raw.default;
        spec.optional = raw.optional;
        //Fill out the subNodes that have to be included
        for(let included of include){
            spec.pushChild(this.query(`${query}/${included}`, spec));
        }
        //Fill out all the subNodes by recursively populating
        //the minimal trees of required fields
        if(raw.required){//If required is not undefined
            for(let required of raw.required){
                spec.pushChild(this.query(`${query}/${required}`, spec));
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
     * @param parent
     * @param typeOverride overrides which instance of the matched rawSpec is to be utilized; can only
     * be specified to the level of the query (non recursive); default -1 which means unspecified,
     * in which case Spec Engine uses a set of matching criteria to automatically
     * identify the rawSpec matched
     */
    validate(query:string, original:Spec, parent:Spec, typeOverride:number=-1): Spec{
        let keys = query.split('/');
        //Query for the raw spec for the original element
        let loc = this.specTree.query(keys);
        if(loc==undefined)//Terminate if invalid query
            return undefined;
        let raw = (typeOverride<0||typeOverride>=loc.rawSpec.length)?
                        loc.getMatchingRaw(original):loc.rawSpec[typeOverride];
        let rawIndex = loc.rawSpec.indexOf(raw);
        let spec = new Spec(original.name, parent);
        //Fill out the fields of the spec
        spec.query = query;
        spec.pointer = raw.pointer;
        spec.type = raw.type;
        spec.typename = raw.typename;
        spec.typeIndex = rawIndex;
        spec.doc = raw.doc;
        spec.optional = raw.optional;
        // Non-object type corresponds to leaf nodes
        spec.isLeaf = ['object', 'list'].indexOf(raw.type)<0;
        //Load value from previous spec
        spec.value = original.value;
        spec.tentative = original.tentative;
        //Make a list to record which subNodes have been included
        let included:string[] = [];
        //Validate recursively,
        // must deal with the possibility of misused indexing depending on
        // the type of spec
        for(let key in original.children){
            let subNodeName = key;
            // Record which nodes have already been included
            included.push(subNodeName);
            // console.log(original.children[key]);
            // console.log(this.validate(`${query}/${subNodeName}`, original.children[key]));
            //Populate the validated subNode
            spec.pushChild(this.validate(`${query}/${subNodeName}`, original.children[key], spec));
        }
        // console.log(raw);
        //Fill out all the required fields that haven't been included
        if(raw.required){//If required is not undefined
            for(let required of raw.required){
                //Escape the subfields that are already included
                if(included.indexOf(required)<0){
                    let newQuery = `${query}/${required}`;
                    spec.pushChild(this.query(newQuery, spec));
                    spec.isLeaf = false;
                }
            }
        }
        // if(raw.optional){//this will create a maximal tree
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
        return this.query('',undefined,
            ['geometry','space','solver','boundary_conditions','materials','output']);
    }

    /**
     * Loads and validates a spec from root
     * @param json
     */
    loadAndValidate(json: {}){
        let specRoot = new Spec('', undefined);
        specRoot.loadFromJSON(json);
        return this.validate('', specRoot, undefined);
    }

    /**
     * Returns the suggested children
     * of a given spec
     */
    getChildTypes(specNode: Spec): { [key: string]: RawSpecTree}{
        if(!specNode.pointer)
            return {};
        let rawSpecNode = this.specTree.query(specNode.pointer.split('/'));
        if(rawSpecNode){
            if(specNode.type=='object'&&specNode.typeIndex>=0){// Select the proper subset of options
                let subType = rawSpecNode.rawSpec[specNode.typeIndex];
                let subTree:{ [key: string]: RawSpecTree} = {};
                for(let key of subType.optional!=undefined?subType.optional:[]){
                    subTree[key] = rawSpecNode.subTree[key];
                }
                for(let key of subType.required!=undefined?subType.required:[]){
                    subTree[key] = rawSpecNode.subTree[key];
                }
                return subTree;
            }
            return rawSpecNode.subTree;
        }
        return {};
    }

    /**
     * Determines if two queries / pointers are a match
     */
    static matchQueries(query1: string, query2:string){
        let queryList1 = query1.split('/');
        let queryList2 = query2.split('/');
        if(queryList1.length != queryList2.length)
            return false;
        for(let i = 0; i< queryList1.length; i++){
            if(queryList1[i]!=queryList2[i]&&query1[i]!='*'&&queryList2[i]!='*')
                return false;
        }
        return true;
    }

    /**
     * Compiles a Spec into an JSON object
     * @param spec
     */
    compile(spec: Spec):any{
        switch(spec.type){
            case 'list':
                let list = [];
                let index = 0;
                while(index in spec.children){
                    list.push(this.compile(spec.children[index]));
                    index++;
                }
                return list;
            case 'object':
                let obj:{[key:string]:any} = {};
                for(let key in spec.children){
                    obj[key] = this.compile(spec.children[key]);
                }
                return obj;
            case 'float':
                return parseFloat(spec.value);
            case 'int':
                return parseInt(spec.value);
            default:
                return spec.value;
        }
    }
}

//Interface of a raw specification
interface RawSpec{
    "pointer": string,
    "default": any,
    "type": string,
    "required":string[],
    "optional":string[];
    "doc": string,
    "typename": string|undefined
}

//Interface of rawSpecTree, an intermediate representation
//of the spec structure
class RawSpecTree{
    subTree: {[key:string]: RawSpecTree}={};
    /**
     * Overloaded specs
     */
    rawSpec: RawSpec[]=[];
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
     * @return subtree the corresponding RawSpec subtree if the query string
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

    /**
     * Resolves the spec given and finds a matching raw spec
     * for typed validation.
     * Criteria for spec matching:
     *  1. spec children
     *      1.1 Let r be raw spec, s be spec given, if
     *          r.required \subset s.children, then
     *          r is matched
     *      1.2 Let r be raw spec, s be spec given, if
     *          s.children \subset r.required, then
     *          r is matched
     *      1.3 Let r be a raw spec, s be spec given, if
     *          s.children \subset r.required U r.optional,
     *          then r is matched
     *  2. if type name of spec matches raw
     *  3. if type of spec matches raw
     *
     *  Matching precedence: 1.1 > 2 > 3 > 1.2 > 1.3
     *
     * @param spec
     */
    getMatchingRaw(spec: Spec): RawSpec {
        let matchedRaw = this.rawSpec[0];
        let maxPrecedence = -1;
        for (const rawSpec of this.rawSpec) {
            // Criteria 1.1
            if (rawSpec.required&&rawSpec.required.every(child => spec.children.hasOwnProperty(child))) {
                if (maxPrecedence < 4) {
                    matchedRaw = rawSpec;
                    maxPrecedence = 4;
                }
            }
            // Criteria 2
            else if (rawSpec.typename!=undefined && spec.typename === rawSpec.typename) {
                if (maxPrecedence < 3) {
                    matchedRaw = rawSpec;
                    maxPrecedence = 3;
                }
            }// Criteria 3
            else if (rawSpec.type!=undefined && spec.type === rawSpec.type) {
                if (maxPrecedence < 2) {
                    matchedRaw = rawSpec;
                    maxPrecedence = 2;
                }
            }
            // Criteria 1.2
            else if (rawSpec.required&&rawSpec.required.every(child => spec.children.hasOwnProperty(child))) {
                if (maxPrecedence < 1) {
                    matchedRaw = rawSpec;
                    maxPrecedence = 1;
                }
            }
            // Criteria 1.3
            else if (rawSpec.required&&rawSpec.optional&& //Make sure these lists have been specified
                this.childrenSubset([...rawSpec.required, ...rawSpec.optional],spec.children)) {
                if (maxPrecedence < 0) {
                    matchedRaw = rawSpec;
                    maxPrecedence = 0;
                }
            }
        }
        return matchedRaw;
    }

    childrenSubset(arr: string[], children: {[key: string]:Spec}): boolean {
        return Object.keys(children).every(child => arr.includes(child));
    }
}

export {Spec, SpecEngine, RawSpecTree};