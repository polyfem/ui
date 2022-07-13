import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Engine, Mesh, Scene } from 'babylonjs';
import HemisphericLight = BABYLON.HemisphericLight;
import MeshBuilder = BABYLON.MeshBuilder;
import Vector3 = BABYLON.Vector3;
import ArcRotateCamera = BABYLON.ArcRotateCamera;
import {UFile} from "./server";

class App {
    scene: Scene;
    meshes:Scene[] = [];
    camera: ArcRotateCamera;
    dom: HTMLElement;
    constructor() {
        this.dom = document.createElement("div");
        this.dom.className = "canvasZone";
        // create the canvas html element and attach it to the webpage
        let canvas = <HTMLCanvasElement>document.createElement("canvas");
        canvas.className = "canvas";
        this.dom.append(canvas);
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        // initialize babylon scene and engine
        let engine = new Engine(canvas, true);
        let ob = new ResizeObserver(()=>{engine.resize()});
        ob.observe(canvas);

        this.scene = new Scene(engine);
        let scene = this.scene;
        //@ts-ignore
        scene.clearColor = new BABYLON.Color3(0.98, 0.98,0.98);
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
        this.camera = camera;
        camera.minZ = 0.0001;
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
                    scene.debugLayer.show({
                        embedMode: true
                    });
                }
            }
        });
        this.updateCameraView = this.updateCameraView.bind(this);
        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    async loadConvertObj(url: string){
        //Standard call: http://127.0.0.1:8081/mesh-convert/data%2Fsol.vtu/sol.obj
        let fileName = url.split('/').pop().split('\\').pop();
        console.log(fileName);
        let fileURL = url.replace("\\", "%2F")
            .replace("/", "%2F");
        const model = await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/mesh-convert/"+fileURL+"/",
            fileName.substring(0, fileName.lastIndexOf("."))+'.obj',
            this.scene,
        );
        console.log(model);
        model.meshes.map((mesh)=>{
            (mesh as Mesh).convertToFlatShadedMesh();
            // let meshMin = mesh.getBoundingInfo().boundingBox.minimum;
            // let meshMax = mesh.getBoundingInfo().boundingBox.maximum;
            // //@ts-ignore
            // mesh.enableEdgesRendering((meshMax-meshMin)*0.01);
        });
        this.updateCameraView();
        return model.meshes;
    }
    updateCameraView(){
        let minmax = this.scene.getWorldExtends();
        console.log(minmax);
        this.camera.radius = minmax.max.subtract(minmax.min).length();
        this.camera.minZ = this.camera.radius*0.001;
    }
    clearScene(){
        while(this.scene.meshes.length!=0){
            this.scene.meshes.pop().dispose();
        }
    }
    async loadMesh(url: string){
        this.clearScene();
        let fileName = url.replace("\\", "%2F")
            .replace("/", "%2F");
        const model = await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/getFile/",
            fileName,
            this.scene,
        );
        console.log(model);
        model.meshes.map((mesh)=>{
            (mesh as Mesh).convertToFlatShadedMesh();
        })
        this.updateCameraView();
        return model.meshes;
    }
    loadObject(url: string){
        let fileName = url.replace("\\", "%2F")
            .replace("/", "%2F");
        this.clearScene();
        BABYLON.SceneLoader.Append("http://127.0.0.1:8081/getFile/", fileName, this.scene,
            (scene)=>{
                this.updateCameraView();
        });
    }
    async loadScene(dir: string, json: any) {
        let geometries = json['geometry'];
        console.log(geometries);
        for (let geometry of geometries) {
            let meshes = await this.loadConvertObj(geometry['mesh']);
            let transformation = geometry['transformation'];

            let translation = transformation['translation'];
            let translateVec = new Vector3(...translation);
            let translateDis = translateVec.length();
            let translateNormal = translateVec.normalizeToNew();
            let scale = transformation['scale'];
            for (let mesh of meshes) {
                mesh.translate(translateNormal, translateDis);
                if(scale!=undefined)
                    mesh.scaling.set(scale, scale, scale);
            }
        }

    }
}
export {App};