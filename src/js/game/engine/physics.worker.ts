import { World, Vec3, Body, Quaternion, Box, SAPBroadphase} from 'cannon';

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

function getKeyByValue(obj: { [key: number]: Body }, value: Body): number | undefined {
    const keys = Object.keys(obj);
    for (const key of keys) {
        if (obj[Number(key)] === value) {
            return Number(key);
        }
    }
    return undefined;
}

self.addEventListener("message", (event: MessageEvent) => {
    console.log("Worker received message:", event.data.type);
    const data = event.data;
    if (data.type === "step") {
        const timeStep: number = data.timeStep;
        world.step(1 / 60);

        // For each body in the world, prepare update data.
        const updates = world.bodies.map((body: Body) => {
            const id = getKeyByValue(bodies, body);
            return {
                id,
                position: { x: body.position.x, y: body.position.y, z: body.position.z },
                quaternion: { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w }
            };
        });

        self.postMessage({ type: "update", updates });
    } else if (data.type === "init") {
        // Clear existing bodies and constraints
        world.bodies.splice(0, world.bodies.length);
        world.constraints.splice(0, world.constraints.length);

        const bodyArray: BodyData[] = data.bodies;
        bodyArray.forEach((bodyData: BodyData) => {
            console.log(bodyData);
            const halfExtents = new Vec3(bodyData.size.x / 2, bodyData.size.y / 2, bodyData.size.z / 2);
            const box = new Box(halfExtents);
            const body = new Body({
                mass: bodyData.mass,
                position: new Vec3(bodyData.position.x, bodyData.position.y, bodyData.position.z),
                quaternion: new Quaternion(
                    bodyData.quaternion.x,
                    bodyData.quaternion.y,
                    bodyData.quaternion.z,
                    bodyData.quaternion.w
                ),
                shape: box
            });
            world.addBody(body);
            bodies[bodyData.id] = body; // Store the body in the bodies object
        });
    } else if (data.type === "add") {
        console.log("Adding body");
        const bodyData: BodyData = data.body;
        console.log(bodyData);
        const halfExtents = new Vec3(bodyData.size.x / 2, bodyData.size.y / 2, bodyData.size.z / 2);
        const box = new Box(halfExtents);
        const body = new Body({
            mass: bodyData.mass,
            position: new Vec3(bodyData.position.x, bodyData.position.y, bodyData.position.z),
            quaternion: new Quaternion(
                bodyData.quaternion.x,
                bodyData.quaternion.y,
                bodyData.quaternion.z,
                bodyData.quaternion.w
            ),
            shape: box
        });
        world.addBody(body);
        bodies[bodyData.id] = body; // Store the body in the bodies object
    }
});