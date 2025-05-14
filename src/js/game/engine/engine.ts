import { Vector3, Euler, Color, InstancedMesh, BoxGeometry, MeshStandardMaterial, Matrix4, Quaternion, MeshPhysicalMaterial, InstancedBufferAttribute, Mesh } from 'three'
import { RendererWindow } from './renderer';
import { PhysicsEngine } from './physics';
import { BoxInstance } from './objects/box';
import { Player } from '../camera/player';
import Stats from 'stats.js'; // If using a module

export class Engine {
    rendererWindow: RendererWindow;
    physicsEngine: PhysicsEngine;
    boxes: BoxInstance[];
    player: Player;
    indexToBox: { [key: number]: BoxInstance } = {};
    instancedMesh!: InstancedMesh;
    transparentObjectsThatWeAreForcedToDrawSeperatelyAccordingToChatGPT: Mesh[] = [];
    geometryClusterIndex: number = 0;
    mat: MeshPhysicalMaterial = new MeshPhysicalMaterial({ vertexColors: false, transparent: true, alphaTest: 0.1 });

    stats: Stats;

    constructor() {
        this.boxes = [];

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
        this.stats.showPanel(0); // 0: fps, 1: ms


        this.rendererWindow = new RendererWindow();
        this.physicsEngine = new PhysicsEngine(this);

        this.player = new Player(this.rendererWindow.camera, this.physicsEngine);

        //this.rendererWindow.createDebugObjects();

        this.createDebugObject();

        this.mainloop.bind(this);
    }

    createDebugObject() {
        const cube = new BoxInstance(this.rendererWindow.scene, this.physicsEngine, new Vector3(0, 0, 0), new Euler(0, 0, 0), new Vector3(3, 3, 3), new Color(0xffffff), 1);
        this.boxes.push(cube);
    }

    updateInstances() {
        //console.log("Update instances");
        this.boxes.forEach((box, _) => {
            //console.log("Update box");
            //box.update();
            if (box.cannonBody.position.z < -300) {
                console.log("Disposed box: fell into void");
                box.dispose();
                this.removeBox(box);
            }
        })
    }
    updateGeometryClusters() {
        //this.transparentObjectsThatWeAreForcedToDrawSeperatelyAccordingToChatGPT = [];
        this.transparentObjectsThatWeAreForcedToDrawSeperatelyAccordingToChatGPT.forEach((obj) => {
            this.rendererWindow.scene.remove(obj);
            obj.geometry.dispose();
        });
        this.transparentObjectsThatWeAreForcedToDrawSeperatelyAccordingToChatGPT = [];
        let n = 0;
        for (const box of this.boxes) {
            if (box.transparency == 0) {
                n++;
            }
        }

        if (!this.instancedMesh || this.instancedMesh.count !== n) {
            // Only recreate if count changes
            if (this.instancedMesh) {
                this.rendererWindow.scene.remove(this.instancedMesh);
                this.instancedMesh.dispose();
            }

            this.instancedMesh = new InstancedMesh(new BoxGeometry(), this.mat, n);
            this.rendererWindow.scene.add(this.instancedMesh);
        }

        const opacityArray = new Float32Array(n);

        for ( let i = 0; i < n; i++) {
            const box = this.boxes[i];
            if (box.transparency > 0) {
                const newThreeObject = new Mesh(new BoxGeometry(box.size.x, box.size.y, box.size.z), new MeshPhysicalMaterial({ color: box.color, transparent: true, opacity: 1 - box.transparency }));
                newThreeObject.position.copy(box.position);
                newThreeObject.quaternion.copy(new Quaternion().setFromEuler(box.rotation));
                this.transparentObjectsThatWeAreForcedToDrawSeperatelyAccordingToChatGPT.push(newThreeObject);
                this.rendererWindow.scene.add(newThreeObject);
                continue
            }
            this.indexToBox[i] = box;

            const position = new Vector3(box.position.x, box.position.y, box.position.z);
            const scale = new Vector3(box.size.x, box.size.y, box.size.z);
            const rotation = box.rotation;

            const matrix = new Matrix4();
            matrix.compose(position, new Quaternion().setFromEuler(rotation), scale);
            //console.log(box.color);
            this.instancedMesh.setMatrixAt(i, matrix);
            this.instancedMesh.setColorAt(i, box.color);

            opacityArray[i] = 1 - box.transparency;



        }

        //this.applyInstanceOpacityShader(this.mat, opacityArray);

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        } else {
            console.warn("No instance color");
        }
        this.mat.needsUpdate = true;

    }

    editShaders() {
        this.mat.onBeforeCompile = (shader) => {
            shader.vertexShader = `
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        ${shader.vertexShader}
    `.replace(
                '#include <color_vertex>',
                `
        #include <color_vertex>
        vInstanceColor = instanceColor;
        `
            );

            shader.fragmentShader = `
        varying vec3 vInstanceColor;
        ${shader.fragmentShader}
    `.replace(
                '#include <color_fragment>',
                `
        vec4 diffuseColor = vec4(vInstanceColor, 1.0);
        `
            );
        };

    }
    applyInstanceOpacityShader(mat: MeshPhysicalMaterial, opacityArray: Float32Array) {
        // Create a custom attribute for opacity
        const opacityAttribute = new InstancedBufferAttribute(opacityArray, 1);
        this.instancedMesh.geometry.setAttribute('instanceOpacity', opacityAttribute);

        // Modify the shader to use instance opacity
        mat.onBeforeCompile = (shader) => {
            shader.vertexShader = `
            attribute float instanceOpacity;
            varying float vInstanceOpacity;
            ${shader.vertexShader}
        `.replace(
                '#include <color_vertex>',
                `
            #include <color_vertex>
            vInstanceOpacity = instanceOpacity;
            `
            );

            shader.fragmentShader = `
            varying float vInstanceOpacity;
            ${shader.fragmentShader}
        `.replace(
                'diffuseColor.a = opacity;',
                `
            diffuseColor.a = vInstanceOpacity * opacity;
            `
            );
        };
    }


    addBox(box: BoxInstance) {
        this.boxes.push(box);
        this.updateGeometryClusters();
    }
    batchAddBoxes(boxes: BoxInstance[]) {
        this.boxes.push(...boxes);
        this.updateGeometryClusters();
    }
    removeBox(box: BoxInstance) {
        const index = this.boxes.indexOf(box);
        if (index > -1) {
            this.boxes.splice(index, 1);
        } else {
            console.warn("Failed to remove box! Box not found!");
        }
        this.updateGeometryClusters();
    }

    step() {
        //console.log("Stepping engine...");
        this.player.update(1 / 60);
        this.physicsEngine.step(1 / 60);
        this.updateInstances();
        this.rendererWindow.render();
        this.stats.update();
    }

    mainloop = () => {
        this.step();
        console.log("Stepping engine...");
        
        requestAnimationFrame(this.mainloop);
    }
}