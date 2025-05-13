import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, DirectionalLight, AmbientLight } from 'three'

export class RendererWindow {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    constructor() {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        document.body.appendChild(canvas);

        this.scene = new Scene();
        this.camera = new PerspectiveCamera();


        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer = new WebGLRenderer({ canvas });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        // Add sun, it is too dark
        const sunlight = new DirectionalLight(0xffffff, 1.5);
        sunlight.position.set(100, 200, 100); // same as sunMesh
        this.scene.add(sunlight);
        // Ambient
        const ambientLight = new AmbientLight(0x404040, 2); // soft white light
        this.scene.add(ambientLight);
    }

    renderLoop() {
        this.render();
        requestAnimationFrame(this.renderLoop);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
    resizeEvent() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    createDebugObjects() {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const cube = new Mesh(geometry, material);
        this.scene.add(cube);

        this.camera.position.z = 5;
    }
}