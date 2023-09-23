import {UI} from "../main";
import * as THREE from "three";
import {Spec} from "../spec";
import {Mesh, MeshPhongMaterial, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";


const selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class PlaneSelector implements Selector{
    canvas: Canvas;
    canvasController: CanvasController;
    ui: UI;
    planeBoundary: THREE.PlaneGeometry;
    helper: THREE.Mesh;
    selectionIndex = 0;
    surfaceSelectorEngaged = false;
    //Tests for secondary selection of parents
    parentSelectorEngaged = false;
    meshController: GeometryController;
    planeSelectionSpec: Spec;

    /**
     *
     * @param canvasController
     * @param planeSelectionSpec
     * @param geometryController
     * @param selectionIndex specifies which selection this is controlling
     */
    constructor(canvasController: CanvasController, planeSelectionSpec: Spec, geometryController: GeometryController, selectionIndex: number) {
        this.canvasController = canvasController;
        this.meshController = geometryController;
        this.meshController.selectors[selectionIndex] = this;
        this.canvas = canvasController.canvas;
        this.selectionIndex = selectionIndex;
        this.planeSelectionSpec = planeSelectionSpec;
        this.ui = this.canvasController.ui;
        this.planeBoundary = new THREE.PlaneGeometry(5,5,1,1)
        this.helper = new THREE.Mesh(this.planeBoundary, selectionMaterial);
        this.helper.visible = true;
        this.helper.matrixAutoUpdate = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.parentSelectionListener = this.parentSelectionListener.bind(this);
    }

    updateSelector(){
        this.surfaceSelectionListener('',this.planeSelectionSpec,'v');
    }

    surfaceSelectionListener(query: string, target: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 3] = new Vector3(2, 0, 0);
        if (event == 'v') {
            if (target.subNodesCount >= 2) {//Need both center and size to be specified
                let point:number[] = this.ui.specEngine.compile(target.children['point']);
                let normal:number[] = this.ui.specEngine.compile(target.children['normal']);
                if (point == undefined || normal == undefined || point.length < 3 || normal.length < 3
                    || isNaN(point[0]) || isNaN(normal[0]) || isNaN(point[1]) || isNaN(normal[1])
                    || isNaN(point[2]) || isNaN(normal[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let p = new Vector3(point[0]/mesh.scale.x, point[1]/mesh.scale.y, point[2]/mesh.scale.z);
                let z = new Vector3(normal[0], normal[1],normal[2]).normalize();
                let x = new Vector3(normal[1],-normal[0],0);
                x = (x.length()==0)?new Vector3(1,0,0):x.normalize();
                let y = new Vector3().crossVectors(z,x);
                let sx = mesh.scale.x, sy = mesh.scale.y, sz = mesh.scale.z;
                this.helper.matrix.set( x.x/sx, y.x/sx, z.x/sx, p.x/sx,
                                        x.y/sy, y.y/sy, z.y/sy, p.y/sy,
                                        x.z/sz, y.z/sz, z.z/sz, p.z/sz,
                                        0,0,0,1);
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 3 + 1] = p;
                z.multiply(meshController.mesh.scale);
                selectionSettings[this.selectionIndex * 3 + 2] = z;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }

    parentSelectionListener(target: Spec, selected: boolean) {
        this.parentSelectorEngaged = selected;
        this.helper.visible = target.selected || target.secondarySelected;
    }

    detach() {
        this.meshController.mesh.remove(this.helper);
        this.planeSelectionSpec.unsubscribeChangeService(this.surfaceSelectionListener);
        this.planeSelectionSpec.parent.unsubscribeSelectionService(this.parentSelectionListener, false);
        this.meshController.removeSelector(this.selectionIndex);
    }
}