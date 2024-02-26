import * as THREE from "three";
import {Canvas, CanvasController} from "../graphics";
import {Mesh, Vector2} from "three";


export default class RaySelector{
    rayCaster = new THREE.Raycaster();
    camera: THREE.Camera;
    scene: THREE.Scene;
    controller: CanvasController;
    canvas: Canvas;
    intersected: THREE.Mesh;

    pointer = new Vector2();
    constructor(controller: CanvasController){
        this.controller = controller;
        this.canvas = controller.canvas;
        this.camera = controller.canvas.camera;
        this.scene = controller.canvas.scene;
        this.onPointerMove = this.onPointerMove.bind(this);
        this.select = this.select.bind(this);
    }
    onPointerMove( event:MouseEvent,element: HTMLElement) {
        let rect = element.getBoundingClientRect();
        let x = event.clientX - rect.left; //x position within the element.
        let y = event.clientY - rect.top;
        this.pointer.x = ( x / rect.width ) * 2 - 1;
        this.pointer.y = - ( y / rect.height ) * 2 + 1;
    }
    select(){
        this.rayCaster.setFromCamera( this.pointer, this.camera );
        const intersects = this.rayCaster.intersectObjects( this.controller.meshArray, false );
        if ( intersects.length > 0 ) {
            let selected = intersects[ 0 ].object;
            if ( this.intersected != selected
                && selected instanceof THREE.Mesh) {
                if ( this.intersected && this.intersected instanceof THREE.Mesh) {
                    this.clearSelectionCallback(this.intersected);
                }
                this.intersected = selected;
                this.selectionCallback(selected);
            }
        } else {
            if ( this.intersected ){
                this.clearSelectionCallback(this.intersected);
            }
            this.intersected = undefined;
        }
    }
    selectionCallback(mesh: Mesh){

    }
    clearSelectionCallback(mesh: Mesh){

    }
}