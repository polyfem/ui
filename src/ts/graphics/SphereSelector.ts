import {UI} from "../main";
import * as THREE from "three";
import {Spec} from "../spec";
import {Mesh, MeshPhongMaterial, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";


const selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class SphereSelector implements Selector{
    canvas: Canvas;
    canvasController: CanvasController;
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
     * @param sphereSelectionSpec
     * @param geometryController
     * @param selectionIndex specifies which selection this is controlling
     */
    constructor(canvasController: CanvasController, sphereSelectionSpec: Spec, geometryController: GeometryController, selectionIndex: number) {
        this.canvasController = canvasController;
        this.meshController = geometryController;
        this.meshController.selectors[sphereSelectionSpec.query] = this;
        this.canvas = canvasController.canvas;
        this.selectionIndex = selectionIndex;
        this.sphereSelectionSpec = sphereSelectionSpec;
        this.ui = this.canvasController.ui;
        this.sphereBoundary = new THREE.SphereGeometry(1,100,100)
        this.helper = new THREE.Mesh(this.sphereBoundary, selectionMaterial);
        this.helper.visible = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.parentSelectionListener = this.parentSelectionListener.bind(this);
    }

    updateSelector(){
        this.surfaceSelectionListener('',this.sphereSelectionSpec,'v');
    }

    surfaceSelectionListener(query: string, target: Spec, event: string) {
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
                let selectionSettings = meshController.material.uniforms.selectionBoxes.value;
                selectionSettings[this.selectionIndex * 3] = new Vector3(1, 0, 0);
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
}