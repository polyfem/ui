import {BufferAttribute, Matrix3, MeshPhongMaterial, ShaderMaterial, Vector3} from "three";
import * as THREE from "three";
import BoxSelector from "./BoxSelector";
import Selector from "./Selector";
import {BoundaryCondition} from "./BoundaryCondition";


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
    boundaryConditions: {[key:number]:BoundaryCondition} = {};
    uniforms: {[p: string]: THREE.IUniform<any>};
    /**
     * Selector settings that impact the rendered shaders.
     * Comes in groups of 4, first vec3 sets rendered selector type,
     * second vec3 usually sets the center of the selector object,
     * third vec3 gives size/orientation related information,
     * fourth vec3 sets color.
     */
    selectorSettings:Vector3[];
    vertexMasks: BufferAttribute;
    constructor(mesh: THREE.Mesh){
        this.mesh = mesh;
        mesh.matrixWorldAutoUpdate = true;
        const vectorArray = [];//Alternate between specification type size and position,
//type.x = -1 indicate the end of the array
//type.x = -2 indicates deleted item, jumped item of array
//type.x = 0 implies box selection type
        let emptyVector = new THREE.Vector3(-1, -1, -1);
        for (let i = 0; i < 120; i++) {
            vectorArray.push(emptyVector);
        }
        // path cache[0][0] = -1 ==> inactive path
        const pathCache = [];
        for(let i  = 0; i<300; i++)
            pathCache.push(new Matrix3().multiplyScalar(-1));
        const positionAttribute = this.mesh.geometry.getAttribute('position');
        const maskValues = new Float32Array(positionAttribute.count*3); // Assuming one value per vertex
        this.vertexMasks = new BufferAttribute(maskValues, 3);
        let maskInit = [];
        for(let i = 0; i<positionAttribute.count*3; i++)
            maskInit.push(-1);
        this.vertexMasks.set(maskInit);
        this.mesh.geometry.setAttribute( 'mask', this.vertexMasks);
//Standard model of shader material
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                Ka: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd0: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd1: { value: new THREE.Vector3(0.15, 0.17, 0.33) },//When selected
                Kd2: { value: new THREE.Vector3(0.49,0.42,0.21)},
                Ks: { value: new THREE.Vector3(0.2, 0.2, 0.2) },
                LightIntensity: { value: new THREE.Vector4(0.55, 0.55, 0.55, 1.0) },
                selectionBoxes: {value: vectorArray},
                matrixWorld: { value: mesh.matrixWorld },
                pathColor:{value:new Vector3(0.55,0.55,0.55)},
                showPath: {value: false}
            },
            vertexShader: `
      attribute vec3 mask; // Custom attribute for mask
      
      varying vec3 Normal;
      flat out vec3 normalFlat;
      varying vec3 Position;
      varying vec3 orgPosition;
      uniform mat4 matrixWorld;
      flat out vec3 maskColor; // Using 'flat' qualifier

      void main() {
        Normal = normalize(normalMatrix * normal);
        normalFlat = normal;
        Position = vec3(modelViewMatrix * vec4(position, 1.0));
        gl_Position =  projectionMatrix*modelViewMatrix*vec4(position, 1.0);
        // orgPosition = vec3(matrixWorld*vec4(position, 1.0));
        orgPosition = position;
        maskColor = mask;
      }
    `,
            fragmentShader: `
      varying vec3 Normal;
      flat in vec3 normalFlat;
      varying vec3 Position;
      varying vec3 orgPosition;

      uniform vec3 Ka;
      uniform vec3 Kd0;
      uniform vec3 Kd1;
      uniform vec3 Kd2;
      uniform vec3 Ks;
      uniform vec3 LightIntensity;
      uniform vec3 selectionBoxes[120];
      uniform vec3 pathColor;
      uniform bool showPath;
      
      flat in vec3 maskColor; // Using 'flat' qualifier

      struct Material {
        vec3 Kd;        // Diffuse component
        vec3 emissive;  // Emissive component
        vec3 ambient;   // Ambient component
      };
      
     Material mat;
     
    // Function to set material properties
      void maskMaterial(vec3 color) {
        mat.Kd = 0.7*color+0.3*mat.Kd;                   // Set diffuse color
        mat.emissive = 0.7*color+0.3*mat.emissive;             // Set emissive color
        mat.ambient = vec3(0.5, 0.5, 0.5); // Set ambient color
      }

      vec3 phong() {
        vec3 n = normalize(Normal);
        vec4 LightPosition = vec4(0.0, 0, 10.0, 1.0);
        vec3 s = normalize(vec3(LightPosition) - Position);
        vec3 v = normalize(vec3(-Position));
        vec3 r = reflect(-s, n);
        mat.Kd = Kd0;
        mat.emissive = vec3(0,0,0);
        mat.ambient = Ka;
        
        //Check for box intersections
        for (int i = 0; i < 30; i++) {
         if (selectionBoxes[i*4].x == -1.0) {
           break; // Terminate the loop
         }
         if (selectionBoxes[i*4].x == -2.0) {
           continue; // Continue the loop
         }
         vec3 center = selectionBoxes[i*4+1];
         vec3 size = selectionBoxes[i*4+2];
         vec3 color = selectionBoxes[i*4+3]/2.0;
         vec3 r = orgPosition-center;
         vec3 ub = center+size/2.0;
         vec3 lb = center-size/2.0;
         switch(int(selectionBoxes[i*4].x)){
            case 0:
                if(ub.x>=orgPosition.x && ub.y>=orgPosition.y && ub.z>=orgPosition.z
                    && lb.x<=orgPosition.x&&lb.y<=orgPosition.y&&lb.z<=orgPosition.z){
                    maskMaterial(color);
                }
                break;
            case 1:
                if(r.x*r.x/size.x/size.x+r.y*r.y/size.y/size.y+r.z*r.z/size.z/size.z<1.0){
                    maskMaterial(color);
                }
                break;
            case 2:
                if(r.x*size.x+r.y*size.y+r.z*size.z>0.0){
                    maskMaterial(color);
                }
                break;
            case 3:
                if(ub.x>=orgPosition.x && ub.y>=orgPosition.y && ub.z>=orgPosition.z
                    && lb.x<=orgPosition.x&&lb.y<=orgPosition.y&&lb.z<=orgPosition.z){
                    maskMaterial(color);
                }
                break;
            case 4:
                if(r.x*r.x/size.x/size.x+r.y*r.y/size.y/size.y+r.z*r.z/size.z/size.z<1.0){
                    maskMaterial(color);
                }
                break;
            case 5:
                if(r.x*size.x+r.y*size.y+r.z*size.z>0.0){
                    maskMaterial(color);
                }
                break;
            default:
                break;
         }
        }
        
        if(showPath&&maskColor[0]>=0.0){
            maskMaterial(maskColor*0.55);
        }    
        
        vec3 diffuse = mat.Kd * abs(dot(s, n));
        vec3 specular = Ks * pow(abs(dot(r, v)), 200.0);
        
        return LightIntensity * (mat.ambient + diffuse + specular)+mat.emissive;
      }
      
      void main() {
        gl_FragColor = vec4(phong(), 1.0);
      }
    `});
        this.selectorSettings=this.material.uniforms.selectionBoxes.value;
        this.uniforms = this.material.uniforms;
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