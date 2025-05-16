import * as CANNON from 'cannon';
import { Euler, Quaternion } from 'three';


interface BodyData {
    id: number;
    mass: number;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
    size: { x: number; y: number; z: number };
}

function getKeyByValue(obj: { [key: number]: CANNON.Body }, value: CANNON.Body): number | undefined {
    const keys = Object.keys(obj);
    for (const key of keys) {
        if (obj[Number(key)] === value) {
            return Number(key);
        }
    }
    return undefined;
}

let bodies: { [key: number]: CANNON.Body } = {};
let playerBodyIndex: CANNON.Body | null = null;

const world = new CANNON.World();
world.gravity = new CANNON.Vec3(0, -9.82, 0);

self.addEventListener("message", (event: MessageEvent) => {
    const data = event.data;
    if (data.type == "step") {
        if (playerBodyIndex) {
            playerBodyIndex.angularVelocity.set(0, 0, 0)
        }
        world.step(1/60, data.dt);

        // Dampen player velocity
        if (playerBodyIndex) {


            playerBodyIndex.quaternion.setFromEuler(0, 0, Math.PI / 2);

            //playerBodyIndex.velocity = playerBodyIndex.velocity.mult(0.95)
            //const a = new Euler(0, 0, 0)
            //const q = new Quaternion().setFromEuler(a)
            //playerBodyIndex.quaternion = new CANNON.Quaternion(q.x, q.y, q.z, q.w);
            playerBodyIndex.angularVelocity.set(0, 0, 0)
        }

        // For each body in the world, prepare update data.

        if (playerBodyIndex == null) {
            throw new Error("No player!")
        }
        //console.log("Sent update position: ", playerBodyIndex.position);
        self.postMessage({ type: "update", position: playerBodyIndex.position });
    } else if (data.type == "add") {
        console.log("Adding body");
        const bodyData: BodyData = data.body;
        console.log(bodyData);
        const halfExtents = new CANNON.Vec3(bodyData.size.x / 2, bodyData.size.y / 2, bodyData.size.z / 2);
        const box = new CANNON.Box(halfExtents);
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(bodyData.position.x, bodyData.position.y, bodyData.position.z),
            quaternion: new CANNON.Quaternion(
                bodyData.quaternion.x,
                bodyData.quaternion.y,
                bodyData.quaternion.z,
                bodyData.quaternion.w
            ),
            shape: box
        });

        world.addBody(body);
        bodies[bodyData.id] = body;
        if (data.isPlayer == true) {
            playerBodyIndex = body;
        }
    } else if (data.type == "add_player") {
        const body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 0, 0),
            shape: new CANNON.Cylinder(2, 2, 2, 8)
        });

        world.addBody(body);
        playerBodyIndex = body;

    } else if (data.type == "add_velocity") {
        if (playerBodyIndex == null) {
            throw new Error("No player");
        }

        const vel: { x: number, y: number, z: number } = data.velocity;

        playerBodyIndex.velocity = new CANNON.Vec3(
            playerBodyIndex.velocity.x + vel.x,
            playerBodyIndex.velocity.y + vel.y,
            playerBodyIndex.velocity.z + vel.z
        );
    } else if (data.type == "modify") {
        const uuid = data.uuid;
        const body = bodies[uuid];
        if (body == null) {
            throw new Error("Target UUID not found: ", uuid);
        }

        const position: { x: number, y: number, z: number } = data.position;
        const quaternion: { x: number, y: number, z: number, w: number } = data.quaternion;

        const p = new CANNON.Vec3(position.x, position.y, position.z);
        const q = new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

        body.position.copy(p);
        body.quaternion.copy(q);
    }
})