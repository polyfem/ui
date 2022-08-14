import {UFile} from "./server";
import {createRoot, Root} from "react-dom/client";
import {createElement} from "react";
import {JSONPanel} from "./ui";
import {App} from "./graphics";

class FileControl{
    fileName: string;
    fileReference: UFile;
    fileDisplay: HTMLElement;
    alternativeDisplay: HTMLElement;
    togglePane = false;
    constructor(fileName: string, fileReference: UFile, fileDisplay: HTMLElement = undefined){
        this.fileName = fileName;
        this.fileReference = fileReference;
        this.fileDisplay = fileDisplay;
    }
}

class JSONFileControl extends FileControl{
    json: {};
    jsonRoot: Root;
    canvas: App;
    constructor(fileName: string, fileReference: UFile){
        super(fileName, fileReference);

        this.initializeViewers();
        this.jsonUpdated = this.jsonUpdated.bind(this);
    }

    private initializeViewers() {
        let container = document.createElement("div");
        container.className = "jsonPanel tabFrame";
        this.jsonRoot = createRoot(container);
        this.canvas = new App();
        let dir = this.fileReference.url.split('/')[0];

        this.fileReference.asyncRead((text:string)=>{
            this.json = JSON.parse(text);
            this.jsonRoot.render(createElement(JSONPanel, {'json':this.json, 'control': this}))
            this.canvas.loadScene(dir, this.json, ()=>{
                createElement(JSONPanel, {'json':this.json, 'control': this});
                this.fileReference.saveFile(JSON.stringify(this.json,null,'\t'));
            });
        });
        this.fileDisplay = this.canvas.dom;
        this.alternativeDisplay = container;
    }

    public jsonUpdated(json:{}) {
        this.json = json;
        this.canvas.updateJSON(json);
    }
}

export {FileControl, JSONFileControl};