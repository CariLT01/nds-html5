import { Game } from "./game/game";

function initialize() {
    const game = new Game();

    game.mainloop();
}

window.onload = initialize;