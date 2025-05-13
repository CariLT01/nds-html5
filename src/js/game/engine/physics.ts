import { World, Body, Vec3, SAPBroadphase } from 'cannon';
import { BoxInstance } from './objects/box';



export class PhysicsEngine {
    world: World;
    bodies: BoxInstance[];
    idCounter: number = 0;
    worker: Worker;
    updates: any = {};
    received: boolean = true;
    constructor() {

        this.worker = new Worker(new URL('./physics.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (event) => {
            if (event.data.type === "update") {
                this.received = true;
                // Save the latest updates from the simulation.
                // Here we assume the order of body updates corresponds to your box order.
                this.updates = event.data.updates;

                for (const update of this.updates) {
                    const body = this.bodies[update.id];
                    if (body) {
                        body.cannonBody.mass = 0;
                        body.cannonBody.position.set(update.position.x, update.position.y, update.position.z);
                        body.cannonBody.quaternion.set(update.quaternion.x, update.quaternion.y, update.quaternion.z, update.quaternion.w);
                        body.threeObject.position.set(update.position.x, update.position.y, update.position.z);
                        body.threeObject.quaternion.set(update.quaternion.x, update.quaternion.y, update.quaternion.z, update.quaternion.w);
                    }
                }
            }
        };

        this.bodies = [];

        this.world = new World();
        this.world.broadphase = new SAPBroadphase(this.world);
        this.world.gravity = new Vec3(0, -9.82, 0);
        
    }
    addBody(body: BoxInstance) {
        this.bodies[this.idCounter] = body;
        
        this.worker.postMessage({
            type: "add",
            body: {
                id: this.idCounter,
                mass: body.cannonBody.mass,
                position: {
                    x: body.cannonBody.position.x,
                    y: body.cannonBody.position.y,
                    z: body.cannonBody.position.z
                },
                quaternion: {
                    x: body.cannonBody.quaternion.x,
                    y: body.cannonBody.quaternion.y,
                    z: body.cannonBody.quaternion.z,
                    w: body.cannonBody.quaternion.w
                },
                size: {
                    x: body.size.x,
                    y: body.size.y,
                    z: body.size.z
                }
            }
        });
        
        this.idCounter++;
    }
    removeBody(body: BoxInstance) {
        /*const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        } else {
            console.warn("Failed to remove physics body! Body not found!");
        }*/
       // Not implemented yet
    }
    step(timeStep: number) {
        this.world.step(timeStep);
        if (this.received == false) {
            return;
        }
        this.received = false;
        console.log("Stepping physics");
        this.worker.postMessage({ type: "step", timeStep });
    }
}