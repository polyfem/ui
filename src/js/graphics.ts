import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Engine, Mesh, Scene } from 'babylonjs';
import HemisphericLight = BABYLON.HemisphericLight;
import MeshBuilder = BABYLON.MeshBuilder;
import Vector3 = BABYLON.Vector3;
import ArcRotateCamera = BABYLON.ArcRotateCamera;

class App {
    scene: Scene;
    meshes:Scene[] = [];
    camera: ArcRotateCamera;
    dom: HTMLCanvasElement;
    constructor() {
        // create the canvas html element and attach it to the webpage
        let canvas = <HTMLCanvasElement>document.getElementById("canvas");
        this.dom = canvas;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        this.scene = new Scene(engine);
        let scene = this.scene;
        //@ts-ignore
        scene.clearColor = new BABYLON.Color3(0.98, 0.98,0.98);
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
        this.camera = camera;
        camera.attachControl(canvas, true);
        camera.wheelDeltaPercentage = 0.07;
        // camera.heightOffset
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    loadObject(fileName:string){
        fileName = fileName.replace("\\", "%2F");
        fileName = fileName.replace("/", "%2F");
        while(this.scene.meshes.length!=0){
            this.scene.meshes.pop().dispose();
        }
        BABYLON.SceneLoader.Append("http://127.0.0.1:8081/getFile/", fileName, this.scene,
            (scene)=>{
                let minmax = scene.getWorldExtends();
                this.camera.radius = minmax.max.subtract(minmax.min).length();
        });
    }
}
export {App};