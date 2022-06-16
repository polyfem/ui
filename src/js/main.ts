import './graphics';
import {PolyFEM, UFile, UFileSystem} from './server';
import {FilePanel, OperationPanel} from './ui';
import {createElement} from "react";
import {createRoot, Root} from "react-dom/client";
import {App} from "./graphics";
import {CodePanel} from "./editor";

/**
 * Central instance of PolyFEM UI
 */
class Main{
    fs: UFileSystem;
    rootURL = ".";
    canvas: App;
    codeContainer: HTMLElement;
    codeRoot: Root;
    responseContainer: HTMLElement;
    responseRoot: Root;
    polyFEM: PolyFEM;
    constructor(){
        this.fs = new UFileSystem(this.rootURL);
        this.polyFEM = new PolyFEM();
        this.executeCommand = this.executeCommand.bind(this);
        this.canvas = new App();

        this.loadUI();
    }
    loadUI(){
        this.codeContainer = document.getElementById("container");
        this.codeRoot = createRoot(this.codeContainer);

        this.responseContainer = document.getElementById("responsePanel");
        this.responseRoot = createRoot(this.responseContainer);

        let fp = createElement(FilePanel, {'main': this});
        let root = createRoot(document.getElementById("filePanel"));
        root.render(fp);

        let op = createElement(OperationPanel, {'main': this});
        let operationRoot = createRoot(document.getElementById("rightPanel"));
        operationRoot.render(op);
    }
    loadFile(file: UFile){
        let extension = file.name.split('.').pop();
        switch(extension){
            case "glb":
                this.canvas.loadObject(file.url);
                this.canvas.dom.style.zIndex = "1";
                this.codeContainer.style.zIndex = "0";
                this.responseContainer.style.zIndex="0";
                break;
            case "js":
            case "json":
                this.canvas.dom.style.zIndex = "0";
                this.responseContainer.style.zIndex="0";
                this.codeContainer.style.zIndex = "1";
                file.asyncRead((text:string)=>{
                    let cp = createElement(CodePanel, {'code': text, 'language':'javascript'});
                    this.codeRoot.render(cp);
                })
                break;
        }
    }
    loadFileRoot():UFile{
        return this.fs.fileRoot;
    }
    executeCommand(command: string, callback: (newResponse, response)=>void){
        this.polyFEM.execute(callback);
    }
    setResponse(response: string){
        this.canvas.dom.style.zIndex = "0";
        this.codeContainer.style.zIndex = "0";
        this.responseContainer.style.zIndex="1";
        let cp = createElement(CodePanel, {'code': response, 'language':'javascript'});
        this.responseRoot.render(cp);
    }
}

new Main();

export {Main};