import {UFile, UFileSystem} from "./server";
import {Visual} from "./visual";
import {Spec, SpecEngine} from "./spec";
import * as React from "react";
import * as ReactDOM from "react-dom";
import $ from 'jquery';
import {FileControl, GFileControl} from "./fileControl";

class UI{
    fs: UFileSystem;
    /**
     * Bound to active instance of Visual through
     * React props callback
     */
    vs: Visual;
    specRoot: Spec;
    //The root of the spec being edited
    activeSpec: Spec;
    emptySpec = new Spec('none');
    specEngine: SpecEngine;
    activeFile: number = 0;
    openedFiles: FileControl[]=[];
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
        let index = 0;
        let fileControl;
        while(this.openedFiles[index]!=undefined
        && this.openedFiles[index].fileReference.url!=file.url) {
            index++;
        }
        switch(file.url.split('.').pop()){
            case 'msh':
            case 'vtu':
            case 'gltf':
            case 'glb':
            case 'obj':
                fileControl = new GFileControl(file.name, file);
                break;
            default:
                fileControl = new FileControl(file.name, file);
                break;
        }
        this.openedFiles[index] = fileControl;
        this.vs.setOpenedFiles(this.openedFiles);
        this.setActiveFile(index);
        return fileControl;
    }
    closeFile(file: FileControl){
        let index = 0;
        while(this.openedFiles[index]!=undefined
        && this.openedFiles[index].fileReference.url!=file.fileReference.url) {
            index++;
        }
        this.openedFiles.splice(index, 1);
        //Some art in selecting the correct active file
        if(this.activeFile>index) {
            this.setActiveFile(this.activeFile-1);
        }
        if(this.activeFile==index){
            this.setActiveFile((this.activeFile==0)?0:this.activeFile-1);
        }
        this.vs.setOpenedFiles(this.openedFiles);
    }
    setActiveFile(activeFile:number){
        this.activeFile = activeFile;
        this.vs.setActiveFile(this.activeFile);
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