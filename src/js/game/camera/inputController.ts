// Tutorial by SimonDev on YouTube
// Link: https://www.youtube.com/watch?v=oqKzxPMLWxo


export class InputController {
    current: {
        leftButton: boolean,
        rightButton: boolean,
        mouseX: number,
        mouseY: number,
        mouseXDelta: number,
        mouseYDelta: number
    };
    previous: {
        leftButton: boolean,
        rightButton: boolean,
        mouseX: number,
        mouseY: number,
        mouseXDelta: number,
        mouseYDelta: number
    } | null;
    keys: { [key: string]: boolean };
    previousKeys: { [key: number]: boolean };
    constructor() {
        this.current = {
            leftButton: false,
            rightButton: false,
            mouseX: 0,
            mouseY: 0,
            mouseXDelta: 0,
            mouseYDelta: 0
        }
        this.previous = null;
        this.keys = {};
        this.previousKeys = {};

        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);

    }

    onMouseDown(e: MouseEvent) {
        switch (e.button) {
            case 0: {
                this.current.leftButton = true;
                break;
            }
            case 2: {
                this.current.rightButton = true;
                break;
            }
        }
    }
    onMouseUp(e: MouseEvent) {
        switch (e.button) {
            case 0: {
                this.current.leftButton = false;
                break;
            }
            case 2: {
                this.current.rightButton = false;
                break;
            }
        }
    }
    onMouseMove(e: MouseEvent) {
        this.current.mouseX = e.pageX - window.innerWidth / 2;
        this.current.mouseY = e.pageY - window.innerHeight / 2;

        if (this.previous == null) {
            this.previous = { ...this.current };
        }

        this.current.mouseXDelta = e.movementX;
        this.current.mouseYDelta = e.movementY;
    }
    onKeyDown(e: KeyboardEvent) {
        this.keys[e.key.toLowerCase()] = true;
    }
    onKeyUp(e: KeyboardEvent) {
        this.keys[e.key.toLowerCase()] = false;
    }
    update() {
        this.current.mouseXDelta = 0;
        this.current.mouseYDelta = 0;
        this.previous = { ...this.current };

    }

    key(key: string): boolean {
        return !!this.keys[key.toLowerCase()];
    }
}