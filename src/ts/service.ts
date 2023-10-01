import {Spec, SpecEngine} from "./spec";
import {GFileControl} from "./fileControl";
import {UI} from "./main";
import {UFile} from "./server";
import CrossReference from "./graphics/CrossReference";

abstract class Service{
    fileControl: GFileControl;
    effectiveDepth: number;
    layer: number;
    rid: number;
    spec: Spec;
    focusRoot: Spec;
    serviceEngine: ServiceEngine;
    referencable = false;
    constructor(fileControl:GFileControl){
        this.fileControl = fileControl;
        this.serviceEngine = fileControl.serviceEngine;
        this.onFocusChanged = this.onFocusChanged.bind(this);
        console.log(`Service initiated:`);
        console.log(this);
    }

    /**
     * All services should subscribe their own detachment listeners when initialized
     * @param spec
     * @param effectiveDepth
     * @param layer
     * @param referencer
     */
    attach(spec: Spec, effectiveDepth: number, layer: number, referencer: string): void {
        this.spec = spec;
        this.serviceEngine.activeServices[spec.sid]=this;
        this.effectiveDepth = effectiveDepth;
        this.layer = layer;
        this.rid = spec.findChild(referencer)?.compile();
        spec.subscribeChangeService((query, target, event)=>{
            if(query==`${spec.query}/${referencer}`&&event=='v'){
                this.rid = target.value;
            }
            this.onFocusChanged(focusRoot, focusRoot.focused);
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
        this.onFocusChanged(focusRoot,focusRoot.focused);
    }

    /**
     * Must be idempotent
     * @param referencer
     */
    reference(referencer: CrossReference){}

    /**
     * Must be idempotent
     */
    dereference(){};
    detach(){
        delete this.serviceEngine.activeServices[this.spec.sid];
        this.focusRoot.unsubscribeFocusService(this.onFocusChanged);
        this.onFocusChanged(this.focusRoot, false);
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
    fileControl: GFileControl;
    //Preliminary load, generates the service templates based on the service configs
    constructor(ui: UI, fileControl: GFileControl) {
        this.ui = ui;
        this.fileControl= fileControl;
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

    getTargetServices(target:string|string[], rid: number){
        let matchedSpecs = [];
        let matchedServices = []
        if(target instanceof Array){
            for(let t of target){
                matchedSpecs.push(...this.fileControl.specRoot.matchChildren(...t.split('/')));
            }
        }else{
            matchedSpecs = this.fileControl.specRoot.matchChildren(...target.split('/'));
        }
        for(let spec of matchedSpecs){
            let service = this.activeServices[spec.sid];
            if(service.rid == rid && service.referencable){
                matchedServices.push(service);
            }
        }
        return matchedServices;
    }
}
export {Service, ServiceTemplate, ServiceEngine};