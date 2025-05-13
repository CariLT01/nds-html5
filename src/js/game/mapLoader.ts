import { Engine } from "./engine/engine"
import { BoxInstance } from "./engine/objects/box"
import * as THREE from 'three'

const degToRad = THREE.MathUtils.degToRad;

export class MapLoader {
    mapData: {
        c: {
            r: number,
            g: number,
            b: number
        },
        s: {
            x: number,
            y: number,
            z: number
        },
        p: {
            x: number,
            y: number,
            z: number
        },
        r: {
            x: number,
            y: number,
            z: number
        },
        t: number,
        a: boolean,
        co: boolean
    }[]
    engine: Engine;
    constructor(engine: Engine, mapDataString: string) {
        this.engine = engine;
        this.mapData = JSON.parse(mapDataString);
    }

    async loadMapIntoScene() {
        for (const part of this.mapData) {
            console.log("Load part")
            const euler = new THREE.Euler(
                degToRad(part.r.x),
                degToRad(part.r.y),
                degToRad(part.r.z),
                'YXZ' // Match Roblox's rotation order
            );
            let d = 1;
            if (part.a == true) {
                d = 0;
            }
            const box = new BoxInstance(
                this.engine.rendererWindow.scene,
                this.engine.physicsEngine,
                new THREE.Vector3(part.p.x, part.p.y, part.p.z),
                euler,
                new THREE.Vector3(part.s.x, part.s.y, part.s.z),
                new THREE.Color(part.c.r / 255, part.c.g / 255, part.c.b / 255),
                d,
                true,
                part.t
            );

            this.engine.addBox(box);
            //await new Promise(r => setTimeout(r, 1));
        }
    }
}