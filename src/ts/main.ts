import {UFileSystem} from "./server";
import {Visual} from "./visual";
import * as React from "react";
import * as ReactDOM from "react-dom";
import $ from 'jquery';

class UI{
    fs: UFileSystem;
    vs: Visual;
    spec: Spec ={
        name:'Spec root',
        isLeaf:false,
        subNodes:[{
            name:'Spec 0',
            isLeaf:false,
            subNodes:[],
            //Currently selected field
            field: "as",
            type: "number",
            selection: []
        }, {
            name:'Spec 1',
            isLeaf:true,
            subNodes:[],
            //Currently selected field
            field: "as",
            type: "number",
            selection: []
        }, {
            name:'Spec 2',
            isLeaf:false,
            subNodes:[{
                name:'Spec root',
                isLeaf:false,
                subNodes:[{
                    name:'Spec 3',
                    isLeaf:false,
                    subNodes:[],
                    //Currently selected field
                    field: "as",
                    type: "number",
                    selection: []
                }, {
                    name:'Spec 4',
                    isLeaf:true,
                    subNodes:[],
                    //Currently selected field
                    field: "as",
                    type: "number",
                    selection: []
                }, {
                    name:'Spec 5',
                    isLeaf:true,
                    subNodes:[],
                    //Currently selected field
                    field: "as",
                    type: "number",
                    selection: []
                }],
                //Currently selected field
                field: "as",
                type: "number",
                selection: []
            }],
            //Currently selected field
            field: "as",
            type: "number",
            selection: []
        }],
        //Currently selected field
        field: "as",
        type: "number",
        selection: []
    }
    constructor(){
        this.mountFileSystem('../server-root');
        this.loadVisual('root-div');
    }
    mountFileSystem(url: string){
        this.fs = new UFileSystem(url);
    }
    loadVisual(rootId: string){
        let component = React.createElement(Visual, {ui:this, rootId});
        ReactDOM.render(component, document.getElementById(rootId));
    }
}

$(()=>{
    new UI();
})

//Recursive structure of a JSON Specification tree
interface Spec{
    name: string;
    isLeaf: boolean;
    subNodes: Spec[];
    //Currently selected field
    field: string;
    type: string;
    selection: string[];
}

export {UI, Spec};