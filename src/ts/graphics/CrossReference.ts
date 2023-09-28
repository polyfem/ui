import {Service} from "../service";
import {Spec, SpecEngine} from "../spec";
import {GFileControl} from "../fileControl";

export default class CrossReference extends Service{
    constructor(fileControl:GFileControl, target:string|string[]){
        super(fileControl);
        this.target = target;
    }
    attach(spec: Spec, effectiveDepth: number, layer: number, referencer: string) {
        super.attach(spec, effectiveDepth, layer, referencer);
    }

    color: number[];
    setColor(r:number,g:number,b:number){
        this.color=[r,g,b];
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
}