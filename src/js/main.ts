import './graphics';
import {PolyFEM, UFile, UFileSystem} from './server';
import {FilePanel, JSONPanel, OperationPanel} from './ui';
import {createElement} from "react";
import {createRoot, Root} from "react-dom/client";
import {App} from "./graphics";
import {BasicTabs, CodePanel} from "./editor";
import {FileControl, JSONFileControl} from "./FileControl";
import SettingsForm from "./settingsForm";

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
    fileNames: string[] = [];
    fileControls: FileControl[]=[];

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
        //The UFile parameter for console here is purely informational, for now, it is not used by any entities
        let console = new FileControl("console", new UFile("std.out", "console", false),
            this.responseContainer)
        this.fileNames.push("console");
        this.fileControls.push(console);

        this.container = document.getElementById("container");
        this.containerRoot = createRoot(this.container);
        this.container.style.zIndex = "1";
        let props = {tabNames: this.fileNames, tabControls:this.fileControls, initialValue: 0};
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
            let props = {tabNames: this.fileNames, tabControls: this.fileControls, initialValue: index};
            this.containerRoot.render(createElement(BasicTabs, props));
        }else{
            let fileControl = this.getFileDisplay(file);
            if(fileControl == undefined)
                return;
            this.fileNames.push(file.name);
            this.fileControls.push(fileControl);
            let props = {tabNames: this.fileNames, tabControls: this.fileControls, initialValue: this.fileControls.length-1};
            this.containerRoot.render(createElement(BasicTabs, props));
        }
    }
    getFileIndex(file: UFile):number{
        for(let i = 0; i < this.fileControls.length; i++){
            if(this.fileControls[i].fileReference === file){
                return i;
            }
        }
        return -1;
    }
    getFileDisplay(file: UFile):FileControl{
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
                return new FileControl(file.name, file, canvas.dom);
            case "json":
                let control = new JSONFileControl(file.name, file);
                control.togglePane = true;
                return control;
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
                return new FileControl(file.name, file, container2);
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