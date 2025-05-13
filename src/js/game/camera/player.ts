import * as THREE from 'three';
import * as CANNON from 'cannon';

import { InputController } from './inputController';
import { PhysicsEngine } from '../engine/physics';

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export class Player {
    camera: THREE.PerspectiveCamera;
    input: InputController;
    rotation: THREE.Quaternion;

    phi: number;
    theta: number;
    body: CANNON.Body;

    constructor(camera: THREE.PerspectiveCamera, physicsEngine: PhysicsEngine) {
        this.camera = camera;
        this.input = new InputController();
        this.rotation = new THREE.Quaternion();
        this.phi = 0;
        this.theta = 0;

        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 0, 0),
            shape: new CANNON.Sphere(2)
        });
        physicsEngine.world.addBody(this.body);

    }

    updateRotation(timeElapsed: number) {
        const xh = this.input.current.mouseXDelta / window.innerWidth;
        const yh = this.input.current.mouseYDelta / window.innerHeight;

        this.phi += -xh * 5;
        this.theta = clamp(this.theta + -yh * 5, -Math.PI / 2, Math.PI / 2);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this.rotation.copy(q);
    }

    updateCamera() {
        this.camera.quaternion.copy(this.rotation);
        this.camera.position.copy(this.body.position);
    }
    updateTranslation(timeElapsedS: number) {
        // WASD movement
        let forward = 0;
        let strafe = 0;

        if (this.input.key('w')) forward += 1;
        if (this.input.key('s')) forward -= 1;
        if (this.input.key('a')) strafe += 1;
        if (this.input.key('d')) strafe -= 1;

        // Normalize diagonal movement
        const length = Math.hypot(forward, strafe);
        if (length > 0) {
            forward /= length;
            strafe /= length;
        }

        // Calculate direction vectors
        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);

        const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(qx).multiplyScalar(forward * timeElapsedS * 10);
        const strafeVec = new THREE.Vector3(-1, 0, 0).applyQuaternion(qx).multiplyScalar(strafe * timeElapsedS * 10);

        // Apply velocity
        let j = 0
        if (this.input.key(' ')) {
            j = 2;
        }
        const nv = new CANNON.Vec3(forwardVec.x + strafeVec.x, forwardVec.y + strafeVec.y + j, forwardVec.z + strafeVec.z);
        const a = new CANNON.Vec3(this.body.velocity.x + nv.x, this.body.velocity.y + nv.y, this.body.velocity.z + nv.z);
        this.body.velocity.copy(a);
    }

    update(timeElapsed: number) {
        this.updateRotation(timeElapsed);
        this.updateTranslation(timeElapsed);
        this.updateCamera();
        this.input.update();
    }
}