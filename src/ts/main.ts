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
        isLeaf:true,
        subNodes:[],
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