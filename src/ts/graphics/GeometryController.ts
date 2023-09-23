import {MeshPhongMaterial, ShaderMaterial} from "three";
import * as THREE from "three";
import BoxSelector from "./BoxSelector";
import Selector from "./Selector";

export default class GeometryController{
    mesh: THREE.Mesh;
    //Number of selection conditions simultaneously
    //imposed on the geometry
    selectionCount = 0;
    /**
     * Material that the geometry is rendered with
     */
    material: ShaderMaterial;
    selectors: {[key:number]:Selector} = {};
    constructor(mesh: THREE.Mesh){
        this.mesh = mesh;
        mesh.matrixWorldAutoUpdate = true;
        let vectorArray = [];//Alternate between specification type size and position,
//type.x < 0 indicate the end of the array
//type.x = 0 implies box selection type
        let emptyVector = new THREE.Vector3(-1, -1, -1);
        for (let i = 0; i < 120; i++) {
            vectorArray.push(emptyVector);
        }
//Standard model of shader material
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                Ka: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd0: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd1: { value: new THREE.Vector3(0.15, 0.33, 0.17) },//When selected
                Ks: { value: new THREE.Vector3(0.2, 0.2, 0.2) },
                LightIntensity: { value: new THREE.Vector4(0.55, 0.55, 0.55, 1.0) },
                LightPosition: { value: new THREE.Vector4(0.0, 0, 10.0, 1.0) },
                Shininess: { value: 200.0 },
                selectionBoxes: {value: vectorArray},
                matrixWorld: { value: mesh.matrixWorld }
            },
            vertexShader: `
      varying vec3 Normal;
      varying vec3 Position;
      varying vec3 orgPosition;
      uniform mat4 matrixWorld;

      void main() {
        Normal = normalize(normalMatrix * normal);
        Position = vec3(modelViewMatrix * vec4(position, 1.0));
        gl_Position =  projectionMatrix*modelViewMatrix*vec4(position, 1.0);
        orgPosition = vec3(matrixWorld*vec4(position, 1.0));
        orgPosition = position;
      }
    `,
            fragmentShader: `
      varying vec3 Normal;
      varying vec3 Position;
      varying vec3 orgPosition;

      uniform vec3 Ka;
      uniform vec3 Kd0;
      uniform vec3 Kd1;
      uniform vec3 Ks;
      uniform vec4 LightPosition;
      uniform vec3 LightIntensity;
      uniform float Shininess;
      uniform vec3 selectionBoxes[60];

      vec3 phong() {
        vec3 n = normalize(Normal);
        vec3 s = normalize(vec3(LightPosition) - Position);
        vec3 v = normalize(vec3(-Position));
        vec3 r = reflect(-s, n);
        vec3 Kd = Kd0;
        vec3 emissive = vec3(0,0,0);
        vec3 ambient = Ka;
        
        //Check for box intersections
        for (int i = 0; i < 20; i++) {
         if (selectionBoxes[i*3].x == -1.0) {
           break; // Terminate the loop
         }
         vec3 center = selectionBoxes[i*3+1];
         vec3 size = selectionBoxes[i*3+2];
         vec3 r = orgPosition-center;
         switch(int(selectionBoxes[i*3].x)){
            case 0:
                vec3 ub = center+size/2.0;
                vec3 lb = center-size/2.0;
                if(ub.x>=orgPosition.x && ub.y>=orgPosition.y && ub.z>=orgPosition.z
                    && lb.x<=orgPosition.x&&lb.y<=orgPosition.y&&lb.z<=orgPosition.z){
                    Kd = Kd1;
                    emissive = vec3(0.15, 0.33, 0.17);
                    ambient = vec3(0.5,0.5,0.5);
                }
                break;
            case 1:
                if(r.x*r.x/size.x/size.x+r.y*r.y/size.y/size.y+r.z*r.z/size.z/size.z<1.0){
                    Kd = Kd1;
                    emissive = vec3(0.15, 0.33, 0.17);
                    ambient = vec3(0.5,0.5,0.5);
                }
                break;
            case 2:
                if(r.x*size.x+r.y*size.y+r.z*size.z>0.0){
                    Kd = Kd1;
                    emissive = vec3(0.15, 0.33, 0.17);
                    ambient = vec3(0.5,0.5,0.5);
                }
                break;
            default:
                break;
         }
        }

        vec3 diffuse = Kd * abs(dot(s, n));
        vec3 specular = Ks * pow(abs(dot(r, v)), Shininess);

        return LightIntensity * (ambient + diffuse + specular)+emissive;
      }

      void main() {
        gl_FragColor = vec4(phong(), 1.0);
      }
    `
        });
    }
    updateSelectors(){
        for(let key in this.selectors){
            this.selectors[key].updateSelector();
        }
    }

    removeSelector(key:number){
        delete this.selectors[key];
    }
}