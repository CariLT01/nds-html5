import {Vector3, Euler, Color} from 'three'
import { RendererWindow } from './renderer';
import { PhysicsEngine } from './physics';
import { BoxInstance } from './objects/box';
import { Player } from '../camera/player';

export class Engine {
    rendererWindow: RendererWindow;
    physicsEngine: PhysicsEngine;
    boxes: BoxInstance[];
    player: Player;

    constructor() {
        this.boxes = [];
        



        this.rendererWindow = new RendererWindow();
        this.physicsEngine = new PhysicsEngine();

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

    addBox(box: BoxInstance) {
        this.boxes.push(box);
    }
    removeBox(box: BoxInstance) {
        const index = this.boxes.indexOf(box);
        if (index > -1) {
            this.boxes.splice(index, 1);
        } else {
            console.warn("Failed to remove box! Box not found!");
        }
    }

    step() {
        //console.log("Stepping engine...");
        this.player.update(1 / 60);
        this.physicsEngine.step(1 / 60);
        this.updateInstances();
        this.rendererWindow.render();
    }

    mainloop = () => {
        this.step();
        requestAnimationFrame(this.mainloop);
    }
}