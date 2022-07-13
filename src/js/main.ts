import './graphics';
import {PolyFEM, UFile, UFileSystem} from './server';
import {FilePanel, JSONPanel, OperationPanel} from './ui';
import {createElement} from "react";
import {createRoot, Root} from "react-dom/client";
import {App} from "./graphics";
import {BasicTabs, CodePanel} from "./editor";

/**
 * Central instance of PolyFEM UI
 */
class Main{
    fs: UFileSystem;
    rootURL = ".";
    fileRoot: Root;
    container: HTMLElement;
    containerRoot: Root;
    polyFEM: PolyFEM;
    responseContainer:HTMLElement;
    responseRoot: Root;

    fileDisplays: HTMLElement[]=[];
    fileNames: string[]=[];
    openedFiles: UFile[]=[];
    constructor(){
        this.fs = new UFileSystem(this.rootURL);
        this.polyFEM = new PolyFEM();
        this.executeCommand = this.executeCommand.bind(this);
        this.loadUI();
    }
    loadUI(){
        this.responseContainer = document.createElement('div');
        this.responseContainer.id = 'responsePanel';
        this.responseRoot = createRoot(this.responseContainer);
        this.fileDisplays.push(this.responseContainer);
        this.fileNames.push("console");
        this.openedFiles.push(new UFile("std.out", "console", false));

        this.container = document.getElementById("container");
        this.containerRoot = createRoot(this.container);
        this.container.style.zIndex = "1";
        let props = {tabTitles:this.fileNames, tabContents:this.fileDisplays, initialValue: 0};
        this.containerRoot.render(createElement(BasicTabs, props));

        let fp = createElement(FilePanel, {'main': this});
        this.fileRoot = createRoot(document.getElementById("filePanel"));
        this.fileRoot.render(fp);

        let op = createElement(OperationPanel, {'main': this});
        let operationRoot = createRoot(document.getElementById("rightPanel"));
        operationRoot.render(op);
    }
    refreshFilePanel(){
        let fp = createElement(FilePanel, {'main': this});
        this.fileRoot.render(fp);
    }
    loadFile(file: UFile){
        let index = this.getFileIndex(file);
        if(index!=-1){
            let props = {tabTitles:this.fileNames, tabContents:this.fileDisplays, initialValue: index};
            this.containerRoot.render(createElement(BasicTabs, props));
        }else{
            let fileDisplay = this.getFileDisplay(file);
            if(fileDisplay == undefined)
                return;
            this.fileNames.push(file.name);
            this.openedFiles.push(file);
            this.fileDisplays.push(fileDisplay);
            let props = {tabTitles:this.fileNames, tabContents:this.fileDisplays, initialValue: this.openedFiles.length-1};
            this.containerRoot.render(createElement(BasicTabs, props));
        }
    }
    getFileIndex(file: UFile):number{
        return this.openedFiles.indexOf(file);
    }
    getFileDisplay(file: UFile):HTMLElement{
        let extension = file.name.split('.').pop();
        switch(extension){
            case "obj":
            case "glb":
            case "vtu":
            case "msh":
                let canvas = new App();
                switch(extension){
                    case "obj":
                        canvas.loadMesh(file.url);
                        break
                    case "glb":
                        canvas.loadObject(file.url);
                        break;
                    case "vtu":
                    case "msh":
                        canvas.loadConvertObj(file.url);
                }
                return canvas.dom;
            case "json":
                // let container = document.createElement("div");
                // container.className = "jsonPanel tabFrame";
                // let root = createRoot(container);
                // file.asyncRead((text:string)=>{
                //     let json = JSON.parse(text);
                //     root.render(createElement(JSONPanel, {'json':json, 'main': this}))
                // })
                // return container;
                let canvasjson = new App();
                let dir = file.url.split('/')[0];
                file.asyncRead((text:string)=>{
                    let json = JSON.parse(text);
                    canvasjson.loadScene(dir, json);
                })
                return canvasjson.dom;
            case "py":
            case "js":
                let container2 = document.createElement("div");
                container2.className = "codePanel";
                let root2 = createRoot(container2);
                file.asyncRead((text:string)=>{
                    let cp = createElement(CodePanel, {'code': text, 'language':'javascript',
                        'readonly':false});
                    root2.render(cp);
                })
                return container2;
        }
        return undefined;
    }
    updateJSON(json:{}){
        console.log(json);
    }
    loadFileRoot():UFile{
        return this.fs.fileRoot;
    }
    executeCommand(command: string, callback: (newResponse, response)=>void){
        this.polyFEM.execute(command, callback);
    }
    setResponse(response: string){
        let cp = createElement(CodePanel, {'code': response, 'language':'javascript',
                'readonly':true});
        this.responseRoot.render(cp);
    }
}

new Main();

export {Main};