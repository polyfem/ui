import {UI} from "../main";
import * as THREE from "three";
import {Spec} from "../spec";
import {Mesh, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";

export default class BoxSelector implements Selector{
    canvas: Canvas;
    canvasController: CanvasController;
    ui: UI;
    helper: THREE.Box3Helper;
    selectionIndex = 0;
    surfaceSelectorEngaged = false;
    //Tests for secondary selection of parents
    parentSelectorEngaged = false;
    meshController: GeometryController;
    boxSelectionSpec: Spec;
    boxBoundsSpec: Spec;

    /**
     *
     * @param canvasController
     * @param boxSelectionSpec
     * @param geometryController
     * @param selectionIndex specifies which selection this is controlling
     */
    constructor(canvasController: CanvasController, boxSelectionSpec: Spec, geometryController: GeometryController, selectionIndex: number) {
        this.canvasController = canvasController;
        this.meshController = geometryController;
        this.meshController.selectors[selectionIndex] = this;
        this.canvas = canvasController.canvas;
        this.selectionIndex = selectionIndex;
        this.boxSelectionSpec = boxSelectionSpec;
        this.boxBoundsSpec = boxSelectionSpec.findChild('box',true);
        this.ui = this.canvasController.ui;
        let box = new THREE.Box3();
        box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        this.helper = new THREE.Box3Helper(box, new THREE.Color(0xabcdef));
        this.helper.visible = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionBoxListener = this.surfaceSelectionBoxListener.bind(this);
        this.selectionListener = this.selectionListener.bind(this);
        this.parentSelectionListener = this.parentSelectionListener.bind(this);
    }

    updateSelector(){
        this.surfaceSelectionBoxListener('',this.boxBoundsSpec,'v');
    }

    surfaceSelectionBoxListener(query: string, target: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 3] = new Vector3(0, 0, 0);
        if (event == 'v') {
            if (this.boxBoundsSpec.subNodesCount >= 2) {//Need both center and size to be specified
                let center = this.ui.specEngine.compile(this.boxBoundsSpec.children[0]);
                let size = this.ui.specEngine.compile(this.boxBoundsSpec.children[1]);
                if (center == undefined || size == undefined || center.length < 3 || size.length < 3
                    || isNaN(center[0]) || isNaN(size[0]) || isNaN(center[1]) || isNaN(size[1])
                    || isNaN(center[2]) || isNaN(size[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let centerVec = new Vector3(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                let sizeVec = new Vector3(Math.abs(size[0]/mesh.scale.x), Math.abs(size[1]/mesh.scale.y),Math.abs(size[2]/mesh.scale.z));
                this.helper.box.setFromCenterAndSize(centerVec,
                    sizeVec);
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 3 + 1] = centerVec;
                selectionSettings[this.selectionIndex * 3 + 2] = sizeVec;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }

    selectionListener(target: Spec, selected: boolean) {
        this.surfaceSelectorEngaged = selected;
        this.helper.visible = this.surfaceSelectorEngaged && (target.selected || target.secondarySelected);
        if (selected) {
            for (let controller of this.canvasController.meshList[target.parent.query]) {
                controller.mesh.material = controller.material;
            }
        } else {// Force style update callbacks
            target.parent.secondarySelected = target.parent.secondarySelected;
            target.parent.selected = target.parent.selected;
        }
    }

    parentSelectionListener(target: Spec, selected: boolean) {
        this.parentSelectorEngaged = selected;
        this.helper.visible = target.selected || target.secondarySelected;
    }

    detach() {
        this.meshController.mesh.remove(this.helper);
        this.boxSelectionSpec.unsubscribeChangeService(this.surfaceSelectionBoxListener);
        this.boxSelectionSpec.parent.unsubscribeSelectionService(this.parentSelectionListener, false);
        this.meshController.removeSelector(this.selectionIndex);
    }
}