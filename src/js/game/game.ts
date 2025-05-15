import { Engine } from './engine/engine';
import { MapLoader } from './mapLoader';
import { MAP_DATA } from './engine/data/map';

export class Game {
    engine: Engine;
    mapLoader: MapLoader;

    constructor() {
        this.engine = new Engine();
        this.mapLoader = new MapLoader(this.engine, MAP_DATA);

        this.mapLoader.loadMapIntoScene();

        this.mainloop.bind(this);
    }

    step() {
        this.engine.step();
    }

    mainloop = () => {
       this.step();
        requestAnimationFrame(this.mainloop);
    }
}