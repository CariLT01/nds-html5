import { World, Body, Vec3, SAPBroadphase } from 'cannon';
import { BoxInstance } from './objects/box';
import { Engine } from './engine';
import { Euler, Quaternion } from 'three';
import { Player } from '../camera/player';



export class PhysicsEngine {
    world: World;
    bodies: BoxInstance[];
    idCounter: number = 0;
    worker: Worker;
    playerWorker: Worker;
    updates: any = {};
    received: boolean = true;
    playerPhysicsReceived: boolean = true;
    lastTime = performance.now();
    lastTimePP = performance.now();
    lastTimeRT = performance.now();
    playerObject: Player | null = null;
    dtSumWp: number = 0;
    dtSumPp: number = 0;
    statsElement: HTMLUListElement;
    constructor(engine: Engine) {
        const a: HTMLUListElement | null = document.querySelector("#stats-list");
        if (a == null) {
            throw new Error("Stats not found");
        }
        this.statsElement = a;

        this.worker = new Worker(new URL('./physics.worker.ts', import.meta.url), { type: 'module' });
        this.playerWorker = new Worker(new URL("./player.physics.worker.ts", import.meta.url), { type: 'module' });
        this.worker.onmessage = (event) => {
            if (event.data.type === "update") {
                this.received = true;
                // Save the latest updates from the simulation.
                // Here we assume the order of body updates corresponds to your box order.
                this.updates = event.data.updates;
                
                for (const update of this.updates) {
                    if (update == null) {
                        console.error(event.data);
                        return;
                    }
                    const body = this.bodies[update.id];
                    if (body) {
                        body.cannonBody.mass = 0;
                        body.cannonBody.position.set(update.position.x, update.position.y, update.position.z);
                        body.cannonBody.quaternion.set(update.quaternion.x, update.quaternion.y, update.quaternion.z, update.quaternion.w);
                        //body.threeObject.position.set(update.position.x, update.position.y, update.position.z);
                        //body.threeObject.quaternion.set(update.quaternion.x, update.quaternion.y, update.quaternion.z, update.quaternion.w);
                        body.position.set(update.position.x, update.position.y, update.position.z);
                        body.rotation.copy(new Euler().setFromQuaternion(new Quaternion(update.quaternion.x, update.quaternion.y, update.quaternion.z, update.quaternion.w)));
                    } else {
                        console.error("Body with UUID ", update.id, " not found!");
                    }
                    const q = new Quaternion().setFromEuler(body.rotation);
                    this.playerWorker.postMessage({
                        type: "modify", uuid: body.uuid, position: {
                            x: body.position.x,
                            y: body.position.y,
                            z: body.position.z
                        }, quaternion: {
                            x: q.x,
                            y: q.y,
                            z: q.z,
                            w: q.w
                        }
                    });
                    /*const index = engine.searchIndexByBox(body);
                    if (index > -1) {
                        engine.updateGeometryClusterAtIndex(index);
                    } else {
                        console.warn("Box not found. Target UUID: " + body.uuid);
                    }*/

                }
                engine.updateGeometryClusters();

            }
        };
        this.playerWorker.onmessage = (event) => {
            if (this.playerObject == null) {
                console.warn("No playerObject submitted. Not stepping");
                return;
            };
            if (event.data.type == "update") {
                this.playerPhysicsReceived = true;

                const position = event.data.position;

                this.playerObject.body.position.copy(position);
            }
        }

        this.bodies = [];

        this.world = new World();
        this.world.broadphase = new SAPBroadphase(this.world);
        this.world.gravity = new Vec3(0, -9.82, 0);

    }
    addBody(body: BoxInstance) {
        this.bodies[body.uuid] = body;

        this.worker.postMessage({
            type: "add",
            body: {
                id: body.uuid,
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

        this.playerPhysicsAddBody(body, false);
    }
    playerPhysicsAddBody(body: BoxInstance | null, isPlayer: boolean = false) {
        if (isPlayer == true) {
            this.playerWorker.postMessage({
                type: "add_player"
            });
            return;
        }
        if (body == null) {
            throw new Error("Body == null but not player");
        }
        this.playerWorker.postMessage({
            type: "add",
            body: {
                id: body.uuid,
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
            },

        });
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
    playerPhysicsStep() {
        if (this.playerPhysicsReceived == false) {
            return;
        }
        const now = performance.now();
        const deltaSec = (now - this.lastTimePP) / 1000;

        this.playerPhysicsReceived = false;
        console.log("Stepping player physics");
        this.playerWorker.postMessage({ type: "step", dt: deltaSec })
        this.lastTimePP = now;
        this.dtSumPp += deltaSec;
        if (this.dtSumPp > 0.05) {
            this.dtSumPp = 0;
            const renderLi = this.statsElement.querySelector("#priority-physics-fps");
            if (renderLi) {
                renderLi.innerHTML = `[Worker thread]<strong>Priority physics</strong> ${Math.round(1 / deltaSec * 10) / 10}(${Math.round(deltaSec * 1000 * 10) / 10}ms)`;
            }
        }
    }
    playerAddVelocity(v: CANNON.Vec3) {
        this.playerWorker.postMessage({ type: "add_velocity", velocity: { x: v.x, y: v.y, z: v.z } });
    }
    worldAddVelocity(body: BoxInstance, v: CANNON.Vec3) {
        this.worker.postMessage({type: "add_velocity", velocity: {x: v.x, y: v.y, z: v.z}, uuid: body.uuid});
    }
    worldUnanchor(body: BoxInstance) {
        this.worker.postMessage({type: "unanchor", uuid: body.uuid});
    }
    worldPhysicsStep() {
        if (this.received == false) {
            return;
        }

        const now = performance.now();
        // elapsed real time in seconds
        const deltaSec = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.received = false;
        console.log("Stepping physics");
        this.worker.postMessage({ type: "step", deltaSec });
        this.dtSumWp += deltaSec;
        if (this.dtSumWp > 0.05) {
            this.dtSumWp = 0;
            const renderLi = this.statsElement.querySelector("#world-physics-fps");
            if (renderLi) {
                renderLi.innerHTML = `[Worker thread]<strong>World physics</strong> ${Math.round(1 / deltaSec * 10) / 10}(${Math.round(deltaSec * 1000 * 10) / 10}ms)`;
            }
        }

    }
    step(timeStep: number) {
        //this.world.step(1 / 60, timeStep);
        this.playerPhysicsStep();
        this.worldPhysicsStep();

    }
    setPlayerObject(player: Player) {
        this.playerObject = player;
    }
}