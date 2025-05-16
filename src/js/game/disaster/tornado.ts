import { Box3, Euler, Mesh, MeshPhysicalMaterial, Vector3 } from "three";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import TornadoMeshURL from '../../../../assets/meshes/tornado.fbx'
import { RendererWindow } from "../engine/renderer";
import { PhysicsEngine } from "../engine/physics";
import { Vec3 } from "cannon";

const TORNADO_DISTANCE_SQUARED = (100)^2

function gravityAccelFromBlackHole(bodyPos: Vector3, blackHolePos: Vector3, blackHoleMass: number, G: number) {
    const direction = blackHolePos.sub(bodyPos);
    const distanceSq = Math.max(direction.lengthSq(), 16);
    if (distanceSq === 0) return new Vec3(0, 0, 0); // avoid singularity
    const accelMag = (G * blackHoleMass) / distanceSq;
    return direction.normalize().multiplyScalar(accelMag); // acceleration vector
}

export class Tornado {

    tornadoMesh!: Mesh;
    renderer: RendererWindow;
    counter: number;
    physicsEngine: PhysicsEngine;
    tornadoPosition: Vector3 = new Vector3(0, 0, 0);
    halfSizeY: number = 0;
    noYvec: Vector3 = new Vector3(1, 0, 1);
    direction: Vector3 = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

    constructor(renderer: RendererWindow, physicsEngine: PhysicsEngine) {

        this.renderer = renderer;
        this.counter = 0;
        this.physicsEngine = physicsEngine;

        const loader = new FBXLoader();

        this.asyncInit(loader);
    }

    async asyncInit(loader: FBXLoader) {
        const object = await loader.loadAsync(TornadoMeshURL);
        object.traverse((child) => {
            const m: Mesh = child as Mesh;

            m.material = new MeshPhysicalMaterial(
                {
                    flatShading: false,
                }
            );

            this.tornadoMesh = m;
            this.tornadoMesh.scale.set(50, 50, 50);
            this.tornadoMesh.position.set(0, 0, 0);
            // Get the size

            const box = new Box3().setFromObject(this.tornadoMesh);
            const size = new Vector3();
            box.getSize(size);
            this.halfSizeY = size.y / 2 / 50;
            this.tornadoMesh.position.set(0, this.halfSizeY, 0);


        });

        this.renderer.scene.add(this.tornadoMesh);
    }

    pull() {
        const bodies = this.physicsEngine.bodies;
        for (const key in bodies) {
            const body = bodies[key];
            //console.log(body.uuid);
            const dist = body.position.clone().multiply(this.noYvec).distanceToSquared(this.tornadoPosition.clone().multiply(this.noYvec));
            //console.log(dist)
            if (dist < TORNADO_DISTANCE_SQUARED) {
                console.log(`Pulling: ${body.uuid}`)
                this.physicsEngine.worldUnanchor(body);
                this.physicsEngine.worldAddVelocity(body, new Vec3(0, 9.82 * body.cannonBody.mass + body.cannonBody.mass * 2, 0));
            }

        }
    }
    updateTornadoPosition() {
        this.tornadoMesh.position.set(this.tornadoPosition.x, this.tornadoPosition.y + this.halfSizeY, this.tornadoPosition.z);
    }
    moveRandomly() {
        const jitter = new Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );
        
        const moveStep = this.direction.clone().multiplyScalar(0.02).add(jitter);
        this.tornadoPosition.add(moveStep);
    }

    step() {
        if (this.tornadoMesh == null) return;

        this.moveRandomly();
        this.pull();
        this.updateTornadoPosition();

        this.counter++;
        this.tornadoMesh.rotation.z = this.counter * 0.01; // adjust speed if needed
    }
}