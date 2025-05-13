import { Mesh, Scene, Vector3, Euler, Color, Quaternion, BoxGeometry, MeshPhongMaterial, TextureLoader, RepeatWrapping, Texture } from 'three'
import { Body, Vec3, World, Box } from 'cannon'
import { PhysicsEngine } from '../physics';

import studsTopTexture from '../../../../../assets/textures/studs/top.png';
import studsBottomTexture from '../../../../../assets/textures/studs/bottom.png';


const tileSizeU = 0.25;  // 0.5 world‑units → 1 repeat in U
const tileSizeV = 1; // 0.25 world‑units → 1 repeat in V

function loadRepeat(url: string, faceWidth: number, faceHeight: number) {
    const t = new TextureLoader().load(url);
    t.wrapS = t.wrapT = RepeatWrapping;
    // number of repeats = face size ÷ tileSize
    t.repeat.set(
        faceWidth / tileSizeU,   // U repeats
        faceHeight / tileSizeV    // V repeats
    );
    return t;
}

export class BoxInstance {
    threeObject: Mesh;
    cannonBody: Body;
    scene: Scene;
    world: PhysicsEngine;
    disposed: boolean = false;
    size: Vector3;
    constructor(scene: Scene, physicsEngine: PhysicsEngine, position: Vector3, rotation: Euler, size: Vector3, color: Color, density: number = 1, useStudsTexture: boolean = true) {
        this.size = size.clone();

        this.scene = scene;
        this.world = physicsEngine;

        // Create the three object
        const geometry = new BoxGeometry(size.x, size.y, size.z);
        const w: number = size.x;
        const h: number = size.y;
        const d: number = size.z;

        const textures: (null | Texture)[] = [
            //makeTexRepeater(texFrontUrl, w / tileSize, h / tileSize), // front
            null, // front
            //makeTexRepeater(texBackUrl,  w / tileSize, h / tileSize), // back
            null, // back
            loadRepeat(studsTopTexture, w, d), // top
            //makeTexRepeater(texBotUrl,   w / tileSize, d / tileSize), // bottom
            loadRepeat(studsBottomTexture, w, d), // bottom
            //makeTexRepeater(texLeftUrl,  d / tileSize, h / tileSize), // left
            null, // left
            //makeTexRepeater(texRightUrl, d / tileSize, h / tileSize), // right
            null, // right
        ];

        const materials = textures.map(tex => new MeshPhongMaterial({ map: tex, color: color }));



        this.threeObject = new Mesh(geometry, materials);
        // Set transformation
        this.threeObject.position.copy(position);
        this.threeObject.rotation.copy(rotation);

        // Compute body mass from volume
        const v = size.x * size.y * size.z;
        const m = v * density;

        // Create the cannon body


        const cannonBoxShape = new Box(new Vec3(
            size.x / 2, size.y / 2, size.z / 2
        ));
        this.cannonBody = new Body({
            mass: m,
            shape: cannonBoxShape,
            position: new Vec3(position.x, position.y, position.z)
        });
        const quat = new Quaternion().setFromEuler(rotation);
        this.cannonBody.quaternion.set(quat.x, quat.y, quat.z, quat.w);

        //world.addBody(this.cannonBody);
        this.world.addBody(this);
        this.world.world.addBody(this.cannonBody);
        scene.add(this.threeObject);
    }
    update() {
        if (this.disposed == true) {
            throw new Error("This object has been disposed and can no longer be used");
        }
        // Sync
        const pos = this.cannonBody.position;
        const q = this.cannonBody.quaternion;
        //console.log("Box now at: ", pos.x, pos.y, pos.z);
        this.threeObject.position.set(pos.x, pos.y, pos.z);
        this.threeObject.quaternion.set(q.x, q.y, q.z, q.w);


    }
    dispose() {
        this.scene.remove(this.threeObject);
        //this.world.remove(this.cannonBody);

        this.disposed = true;
    }
}