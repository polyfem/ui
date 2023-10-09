import {Service} from "../service";
import {Spec, SpecEngine} from "../spec";
import {GFileControl} from "../fileControl";

export default class CrossReference extends Service{
    constructor(fileControl:GFileControl, target:string|string[]){
        super(fileControl);
        this.target = target;
    }
    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string) {
        super.attach(spec, effectiveDepth, layer, referencer);
    }

    focused: boolean = false;
    /**
     * Query string for referenced targets
     */
    target: string|string[];
    onFocusChanged(spec: Spec, focused: boolean): void {
        this.focused=focused;
        for(let service of this.serviceEngine.getTargetServices(this.target, this.rid)){
            service.reference(this);
        }
    }
    setColor(r:number,g:number,b:number){
        super.setColor(r,g,b);
        this.onFocusChangedProxy(this.focusRoot,this.focusRoot.focused);
    }

    onRidChanged(oId: string, nId: string) {
        for(let service of this.serviceEngine.getTargetServices(this.target, oId)){
            service.dereference(this);
        }
        for(let service of this.serviceEngine.getTargetServices(this.target, nId)){
            service.reference(this);
        }
    }
}