import {Spec, SpecEngine} from "./spec";
import {GFileControl} from "./fileControl";
import {UI} from "./main";
import {UFile} from "./server";

abstract class Service{
    fileControl: GFileControl;
    effectiveDepth: number;
    layer: number;
    id: number;
    spec: Spec;
    focusRoot: Spec;
    serviceEngine: ServiceEngine;
    constructor(fileControl:GFileControl){
        this.fileControl = fileControl;
        this.serviceEngine = fileControl.serviceEngine;
        this.onFocusChanged = this.onFocusChanged.bind(this);
    }

    /**
     * All services should subscribe their own detachment listeners when initialized
     * @param spec
     * @param effectiveDepth
     * @param layer
     * @param reference
     */
    attach(spec: Spec, effectiveDepth: number, layer: number, reference: string): void {
        this.spec = spec;
        this.serviceEngine.activeServices[spec.sid]=this;
        this.effectiveDepth = effectiveDepth;
        this.layer = layer;
        this.id = spec.findChild(reference)?.compile();
        spec.subscribeChangeService((query, target, event)=>{
            if(query==`${spec.query}/${reference}`&&event=='v'){
                this.id = target.value;
            }
        })
        this.fileControl.services.push(this);
        let focusRoot = spec;
        let unsubscribeList = [focusRoot];
        while(effectiveDepth>0){
            focusRoot = focusRoot?.parent;
            unsubscribeList.push(focusRoot);
            effectiveDepth--;
        }
        this.focusRoot = focusRoot;
        this.focusRoot.subscribeChangeService((query, target, event) => {
            if(event=='cd'&&unsubscribeList.indexOf(target)>=0){
                this.detach();
            }
        });
        focusRoot.subscribeFocusService(this.onFocusChanged);
    }
    detach(){
        delete this.serviceEngine.activeServices[this.spec.sid];
        this.focusRoot.unsubscribeFocusService(this.onFocusChanged);
    }
    abstract onFocusChanged(spec: Spec, focused:boolean):void;
}



interface ServiceTemplate{
    service: string;
    referencer: string;
    color?: [number,number,number];
    extends?:string;
    effectiveDepth: number;
    layer: number;
    target?: string|string[];
    colorSet: [number,number,number][];
}

/**
 * Services are applied in the order that they appear
 */
class ServiceEngine {
    ui: UI;
    serviceTemplates:{[query:string]:ServiceTemplate};
    serviceConfig: UFile;
    jsonText: string;
    activeServices: {[sid: number]:Service} = {};
    //Preliminary load, generates the service templates based on the service configs
    constructor(ui: UI) {
        this.ui = ui;
        for (let file of this.ui.fs.fileRoot.children) {//Locate the spec file
            if (file.name == 'ui-bindings.json') {
                this.serviceConfig = file;
                break;
            }
        }
        this.serviceConfig.syncRead((text) => {
            this.jsonText = text
        });
        this.serviceTemplates = JSON.parse(this.jsonText);
        for(let query in this.serviceTemplates){//Apply extensions
            let template = this.serviceTemplates[query];
            if(template.extends){
                let prototype = this.serviceTemplates[template.extends];
                this.serviceTemplates[query] = {...prototype,...template};
            }
        }
    }


}
export {Service, ServiceTemplate, ServiceEngine};