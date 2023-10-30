import {Service} from "../service";
import {Spec} from "../spec";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import THREE, {MeshPhongMaterial, Vector3} from "three";
import {reference} from "three/examples/jsm/nodes/shadernode/ShaderNodeBaseElements";
import CrossReference from "./CrossReference";

export default abstract class Selector extends Service{
    canvasController: CanvasController;
    meshController: GeometryController;
    canvas: Canvas;
    selectionIndex: number;
    selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
        side: THREE.DoubleSide, opacity:0.2, transparent:true});
    focused: boolean;
    /**
     *
     * @param canvasController
     * @param geometryController
     */
    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController.fileControl);
        this.canvasController = canvasController;
        this.meshController = geometryController;
        this.selectionIndex = geometryController.selectionCount++;
        this.meshController.selectors[this.selectionIndex] = this;
        this.canvas = canvasController.canvas;
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.referencable = true;
    }

    updateSelector(){
        this.surfaceSelectionListener('',this.spec,'v');
    }

    abstract surfaceSelectionListener(query: string, target: Spec, event: string):void;
    setColor(r: number, g: number, b: number): void {
        super.setColor(r,g,b);
        this.selectionMaterial.color.setRGB(r,g,b);
        this.meshController.selectorSettings[this.selectionIndex * 4 + 3] = new Vector3(r,g,b);
    }

    attach(spec: Spec, effectiveDepth: number, layer: string, reference: string): void {
        super.attach(spec, effectiveDepth, layer, reference);
        // surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
        spec.subscribeChangeService(this.surfaceSelectionListener)
        (spec.query,spec,'v');
    }

    detach(){
        super.detach();
        let selectionSettings = this.meshController.selectorSettings;
        selectionSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
        this.spec.unsubscribeChangeService(this.surfaceSelectionListener);
        this.meshController.removeSelector(this.selectionIndex);
    }

    reference(referencer: CrossReference) {
        this.crossReferences[referencer.vid] = referencer;
        this.updateReferences();
        this.onFocusChangedProxy(this.focusRoot,this.focusRoot.focused);
    }

    private updateReferences(){
        let [r,g,b] = this.color;
        for(let key in this.crossReferences){
            if(this.crossReferences[key].getFocusProxy(this.crossReferences[key].focused)){
                [r,g,b] = this.crossReferences[key].color;
                if(this.spec.sid==372){
                    console.log(this.crossReferences[key]);
                    console.log(this.crossReferences[key].spec);
                    console.log(this.crossReferences[key].color);
                    let color = this.crossReferences[key].color;
                    console.log('%c ', `background: rgb(${color[0]*256},${color[1]*256},${color[2]*256})`);
                }
            }
        }
        // console.log(`%ccolor changed to: ${[r,g,b]}`,`background: rgb(${r*256},${g*256},${b*256})`);
        // this.selectionMaterial.color.setRGB(r,g,b);
        this.meshController.selectorSettings[this.selectionIndex * 4 + 3] = new Vector3(r,g,b);
    }

    onRidChanged(oId: string, nId: string) {
        this.crossReferences = {};
        this.serviceEngine.refreshServices();
    }

    dereference(referencer: CrossReference) {
        delete this.crossReferences[referencer.vid];
        this.updateReferences();
        this.onFocusChangedProxy(this.focusRoot,this.focusRoot.focused);
    }
}