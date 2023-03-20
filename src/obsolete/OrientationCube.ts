import * as BABYLON from 'babylonjs';
import { Engine, Mesh, Scene } from 'babylonjs';
import {ArcRotateCamera} from "babylonjs/Cameras/arcRotateCamera";

class OrientationCube{
    scene: Scene;
    camera: ArcRotateCamera;
    constructor(scene: Scene) {
        this.scene = scene;
        this.camera = new BABYLON.ArcRotateCamera("Camera",
            Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(),
            scene);
        // this.camera.upVector = new BABYLON.Vector3(0,0,1);

        new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        const mat = new BABYLON.StandardMaterial("mat");
        const texture = new BABYLON.Texture("../../assets/orientations.jpg ");
        mat.diffuseTexture = texture;

        var columns = 6;
        var rows = 1;

        const faceUV = new Array(6);

        for (let i = 0; i < 6; i++) {
            faceUV[i] = new BABYLON.Vector4(i / columns, 0, (i + 1) / columns, 1 / rows);
        }

        const options = {
            faceUV: faceUV,
            wrap: true
        };

        const box = BABYLON.MeshBuilder.CreateBox("box", options);
        box.material = mat;
    }
}

export default OrientationCube;