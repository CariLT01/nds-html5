import { Engine } from './engine/engine';
import { MapLoader } from './mapLoader';
import { MAP_DATA } from './engine/data/map';
import { Tornado } from './disaster/tornado';

export class Game {
    engine: Engine;
    mapLoader: MapLoader;

    tornado: Tornado;

    constructor() {
        this.engine = new Engine();
        this.mapLoader = new MapLoader(this.engine, MAP_DATA);

        this.mapLoader.loadMapIntoScene();

        this.mainloop.bind(this);

        this.tornado = new Tornado(this.engine.rendererWindow, this.engine.physicsEngine);
    }

    step() {
        if (this.mapLoader.finishedLoading == true) {
            this.tornado.step();
        }
        
        this.engine.step();
    }

    mainloop = () => {
       this.step();
        requestAnimationFrame(this.mainloop);
    }
}