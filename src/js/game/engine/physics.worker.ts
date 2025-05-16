import { World, Vec3, Body, Quaternion, Box, SAPBroadphase } from "cannon";

interface BodyData {
    id: number;
    mass: number;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
    size: { x: number; y: number; z: number };
}

const world = new World();
world.solver.iterations = 5;
const bp = new SAPBroadphase(world);
world.broadphase = bp;
world.gravity = new Vec3(0, -9.82, 0);

// Using an object as a dictionary for bodies
let bodies: { [key: number]: Body } = {};
let bodyToKey = new Map<Body, number>();
let lastUpdates: {
    [key: number]: {
        position: Vec3;
        quaternion: Quaternion;
    };
} = {};

function getKeyByValue(value: Body): number | undefined {
    return bodyToKey.get(value);
}

self.addEventListener("message", (event: MessageEvent) => {
    console.log("Worker received message:", event.data.type);
    const data = event.data;
    if (data.type === "step") {
        const timeStep: number = data.timeStep;
        world.step(1 / 60, timeStep);

        // For each body in the world, prepare update data.

        const updates = world.bodies.flatMap((body: Body) => {
            const id: number = getKeyByValue(body) as number;
            if (
                Object.keys(lastUpdates).length === 0 ||
                lastUpdates[id].position !== body.position ||
                lastUpdates[id].quaternion !== body.quaternion
            ) {
                return [
                    {
                        id,
                        position: {
                            x: body.position.x,
                            y: body.position.y,
                            z: body.position.z,
                        },
                        quaternion: {
                            x: body.quaternion.x,
                            y: body.quaternion.y,
                            z: body.quaternion.z,
                            w: body.quaternion.w,
                        },
                    },
                ];
            }
            return [];
        });

        //console.log(updates);
        self.postMessage({ type: "update", updates });
    } else if (data.type === "init") {
        // Clear existing bodies and constraints
        world.bodies.splice(0, world.bodies.length);
        world.constraints.splice(0, world.constraints.length);

        const bodyArray: BodyData[] = data.bodies;
        bodyArray.forEach((bodyData: BodyData) => {
            console.log(bodyData);
            const halfExtents = new Vec3(
                bodyData.size.x / 2,
                bodyData.size.y / 2,
                bodyData.size.z / 2
            );
            const box = new Box(halfExtents);
            const body = new Body({
                mass: bodyData.mass,
                position: new Vec3(
                    bodyData.position.x,
                    bodyData.position.y,
                    bodyData.position.z
                ),
                quaternion: new Quaternion(
                    bodyData.quaternion.x,
                    bodyData.quaternion.y,
                    bodyData.quaternion.z,
                    bodyData.quaternion.w
                ),
                shape: box,
            });
            world.addBody(body);
            bodies[bodyData.id] = body; // Store the body in the bodies object
        });
    } else if (data.type === "add") {
        console.log("Adding body");
        const bodyData: BodyData = data.body;
        console.log(bodyData);
        const halfExtents = new Vec3(
            bodyData.size.x / 2,
            bodyData.size.y / 2,
            bodyData.size.z / 2
        );
        const box = new Box(halfExtents);
        const body = new Body({
            mass: bodyData.mass,
            position: new Vec3(
                bodyData.position.x,
                bodyData.position.y,
                bodyData.position.z
            ),
            quaternion: new Quaternion(
                bodyData.quaternion.x,
                bodyData.quaternion.y,
                bodyData.quaternion.z,
                bodyData.quaternion.w
            ),
            shape: box,
        });
        world.addBody(body);
        bodies[bodyData.id] = body; // Store the body in the bodies object
        bodyToKey.set(body, bodyData.id);
    } else if (data.type == "add_velocity") {
        const uuid = data.uuid;
        const v = data.velocity;

        const body = bodies[uuid];
        if (body) {
            const b = body.velocity;
            body.velocity = new Vec3(b.x + v.x, b.y + v.y, b.z + v.z);
            console.log("Added velocity to ", uuid);
        } else {
            console.warn("Add velocity: No body with UUID ", uuid);
        }
    } else if (data.type == "unanchor") {
        const uuid = data.uuid;
        const body = bodies[uuid];
        if (body) {
            const shape = body.shapes[0];
            if (shape instanceof Box) {
                const halfExtents = shape.halfExtents;
                const size = halfExtents.scale(2, new Vec3());

                const v = size.x * size.y * size.z;

                body.mass = v;
                body.updateMassProperties();
                body.type = Body.DYNAMIC;
                body.wakeUp();
                console.log("Body unnahcored: Mass set to:", v);
            } else {
                console.warn("First shape of body UUID=", uuid, " is not a Box!");
            }
        } else {
            console.warn("Unanchor: No body with UUID ", uuid);
        }
    }
});
