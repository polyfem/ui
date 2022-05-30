import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Engine, Mesh, Scene } from 'babylonjs';
import HemisphericLight = BABYLON.HemisphericLight;
import MeshBuilder = BABYLON.MeshBuilder;
import Vector3 = BABYLON.Vector3;
import ArcRotateCamera = BABYLON.ArcRotateCamera;

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2000, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        // camera.heightOffset
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        BABYLON.SceneLoader.Append("http://127.0.0.1:8081/getMesh/", "2CylinderEngine.glb", scene, (mesh)=>{

        });
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
            scene.render();
        });
    }
}
new App();