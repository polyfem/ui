import {UI} from "../main";
import {Spec} from "../spec";
import THREE, {MeshPhongMaterial, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";
import {event} from "jquery";


const selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

const vselectionMaterial = new MeshPhongMaterial({color: 0xfbda6f, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class SphereSelector implements Selector{
    canvas: Canvas;
    canvasController: CanvasController;
    isSurfaceSelector: boolean
    ui: UI;
    sphereBoundary: THREE.SphereGeometry;
    helper: THREE.Mesh;
    selectionIndex = 0;
    surfaceSelectorEngaged = false;
    //Tests for secondary selection of parents
    parentSelectorEngaged = false;
    meshController: GeometryController;
    sphereSelectionSpec: Spec;

    /**
     *
     * @param canvasController
     * @param isSurfaceSelector
     * @param sphereSelectionSpec
     * @param geometryController
     * @param selectionIndex specifies which selection this is controlling
     */
    constructor(canvasController: CanvasController, isSurfaceSelector:boolean, sphereSelectionSpec: Spec, geometryController: GeometryController, selectionIndex: number) {
        this.canvasController = canvasController;
        this.isSurfaceSelector = isSurfaceSelector;
        this.meshController = geometryController;
        this.meshController.selectors[selectionIndex] = this;
        this.canvas = canvasController.canvas;
        this.selectionIndex = selectionIndex;
        this.sphereSelectionSpec = sphereSelectionSpec;
        this.ui = this.canvasController.ui;
        this.sphereBoundary = new THREE.SphereGeometry(1,100,100)
        this.helper = new THREE.Mesh(this.sphereBoundary, (isSurfaceSelector)?selectionMaterial:vselectionMaterial);
        this.helper.visible = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.parentSelectionListener = this.parentSelectionListener.bind(this);
    }

    updateSelector(){
        this.surfaceSelectionListener('',this.sphereSelectionSpec,'v');
    }

    surfaceSelectionListener(query: string, target: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 3] = new Vector3(this.isSurfaceSelector?1:4, 0, 0);
        if (event == 'v') {
            if (target.subNodesCount >= 2) {//Need both center and size to be specified
                let center:number[] = this.ui.specEngine.compile(target.children['center']);
                let radius:number = this.ui.specEngine.compile(target.children['radius']);
                if (center == undefined || radius == undefined || center.length < 3
                    || isNaN(center[0]) || isNaN(radius) || isNaN(center[1])
                    || isNaN(center[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let centerVec = new Vector3(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                let sizeVec = new Vector3(Math.abs(radius/mesh.scale.x), Math.abs(radius/mesh.scale.y),Math.abs(radius/mesh.scale.z));
                this.helper.position.set(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                this.helper.scale.set(Math.abs(radius/mesh.scale.x), Math.abs(radius/mesh.scale.y),Math.abs(radius/mesh.scale.z));
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 3 + 1] = centerVec;
                selectionSettings[this.selectionIndex * 3 + 2] = sizeVec;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }

    parentSelectionListener(target: Spec, selected: boolean) {
        this.parentSelectorEngaged = selected;
        this.helper.visible = target.selected || target.secondarySelected;
    }

    detach(): void {
        this.meshController.mesh.remove(this.helper);
        this.sphereSelectionSpec.unsubscribeChangeService(this.surfaceSelectionListener);
        this.sphereSelectionSpec.parent.unsubscribeSelectionService(this.parentSelectionListener, false);
        this.meshController.removeSelector(this.selectionIndex);
    }
}