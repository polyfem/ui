import {UFile, UFileSystem} from "./server";
import {Visual} from "./visual";
import {Spec, SpecEngine} from "./spec";
import * as React from "react";
import * as ReactDOM from "react-dom";
import $ from 'jquery';
import {FileHandle} from "fs/promises";
import {FileControl, GFileControl} from "./fileControl";

class UI{
    fs: UFileSystem;
    vs: Visual;
    specRoot: Spec;
    //The root of the spec being edited
    activeSpec: Spec;
    emptySpec = new Spec('none');
    specEngine: SpecEngine;
    activeFile: FileControl;
    /**
     * Callback supplied by visual
     */
    setActiveFile: (activeFile: FileControl)=>void;
    openedFiles: FileControl[];
    /**
     * Callback supplied by visual
     */
    setOpenedFiles: (files: FileControl[])=>void;
    constructor(){
        this.mountFileSystem('../server-root');
        this.specEngine = new SpecEngine(this);
        this.specRoot= this.specEngine.getSpecRoot();
        this.activeSpec = this.emptySpec;
        // let geometry1 = new Spec("geometry1");
        // this.spec.subNodes['geometry'].pushChild(geometry1);
        // this.spec = this.specEngine.validate('',this.spec);
        this.loadVisual('root-div');
    }
    mountFileSystem(url: string){
        this.fs = new UFileSystem(url);
    }
    loadVisual(rootId: string){
        let component = React.createElement(Visual, {ui:this, rootId});
        ReactDOM.render(component, document.getElementById(rootId));
    }
    openFile(file: UFile){
        switch(file.url.split('.').pop()){
            case 'glb':
                let fileControl = new GFileControl(file.name, file);
                this.activeFile = fileControl;
                return fileControl;
        }
        return undefined;
    }
}

$(()=>{
    new UI();
})

export {UI};

// ={ Fake Spec
//     name:'Spec root',
//     isLeaf:false,
//     subNodes:[{
//         name:'Spec 0',
//         isLeaf:false,
//         subNodes:[],
//         //Currently selected field
//         field: "as",
//         type: "number",
//         selection: []
//     }, {
//         name:'Spec 1',
//         isLeaf:true,
//         subNodes:[],
//         //Currently selected field
//         field: "as",
//         type: "number",
//         selection: []
//     }, {
//         name:'Spec 2',
//         isLeaf:false,
//         subNodes:[{
//             name:'Spec root',
//             isLeaf:false,
//             subNodes:[{
//                 name:'Spec 3',
//                 isLeaf:false,
//                 subNodes:[],
//                 //Currently selected field
//                 field: "as",
//                 type: "number",
//                 selection: []
//             }, {
//                 name:'Spec 4',
//                 isLeaf:true,
//                 subNodes:[],
//                 //Currently selected field
//                 field: "as",
//                 type: "number",
//                 selection: []
//             }, {
//                 name:'Spec 5',
//                 isLeaf:true,
//                 subNodes:[],
//                 //Currently selected field
//                 field: "as",
//                 type: "number",
//                 selection: []
//             }],
//             //Currently selected field
//             field: "as",
//             type: "number",
//             selection: []
//         }],
//         //Currently selected field
//         field: "as",
//         type: "number",
//         selection: []
//     }],
//     //Currently selected field
//     field: "as",
//     type: "number",
//     selection: []
// }