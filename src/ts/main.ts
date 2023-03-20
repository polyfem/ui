import {UFileSystem} from "./server";
import {Visual} from "./components/visual";
import * as React from "react";
import * as ReactDOM from "react-dom";
import $ from 'jquery';

class UI{
    fs: UFileSystem;
    vs: Visual;
    constructor(){
        this.mountFileSystem('../server-root');
        this.loadVisual('root-div');
    }
    mountFileSystem(url: string){
        this.fs = new UFileSystem(url);
        //Export file system for testing
        //@ts-ignore
        window.fs = this.fs;
    }
    loadVisual(rootId: string){
        let component = React.createElement(Visual, {ui:this, rootId});
        ReactDOM.render(component, document.getElementById(rootId));
    }
}

$(()=>{
    new UI();
})

export default UI;