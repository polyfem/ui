import {Spec} from "./spec";
import {GFileControl} from "./fileControl";

export default abstract class Service{
    fileControl: GFileControl;
    effectiveDepth: number;
    layer: number;
    id: number;
    spec: Spec;
    focusRoot: Spec;
    constructor(fileControl:GFileControl){
        this.fileControl = fileControl;
        this.onFocusChanged = this.onFocusChanged.bind(this);
    }
    attach(spec: Spec, effectiveDepth: number, layer: number, reference: string): void {
        this.spec = spec;
        this.effectiveDepth = effectiveDepth;
        this.layer = layer;
        this.id = spec.findChild(reference)?.compile();
        this.fileControl.services.push(this);
        let focusRoot = spec;
        while(effectiveDepth>0){
            focusRoot = focusRoot?.parent;
            effectiveDepth--;
        }
        this.focusRoot = focusRoot;
        focusRoot.subscribeFocusService(this.onFocusChanged);
    }
    detach(){
        this.focusRoot.unsubscribeFocusService(this.onFocusChanged);
    }
    abstract onFocusChanged(spec: Spec, focused:boolean):void;
}