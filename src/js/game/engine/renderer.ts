import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, FogExp2, DirectionalLight, PCFSoftShadowMap, AmbientLight, CubeTextureLoader, TextureLoader, Texture, Vector2, CubeTexture, CubeReflectionMapping, ClampToEdgeWrapping, LinearMipMapLinearFilter, LinearFilter } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/*import SkyBack from '../../../../assets/textures/sky/back.png';
import SkyDown from '../../../../assets/textures/sky/down.png';
import SkyUp from '../../../../assets/textures/sky/up.png';
import SkyLeft from '../../../../assets/textures/sky/left.png';
import SkyRight from '../../../../assets/textures/sky/right.png';
import SkyFront from '../../../../assets/textures/sky/front.png';*/

import SkyBack from '../../../../assets/textures/atmosphere_sky/back.png';
import SkyDown from '../../../../assets/textures/atmosphere_sky/bottom.png';
import SkyUp from '../../../../assets/textures/atmosphere_sky/top.png';
import SkyLeft from '../../../../assets/textures/atmosphere_sky/left.png';
import SkyRight from '../../../../assets/textures/atmosphere_sky/right.png';
import SkyFront from '../../../../assets/textures/atmosphere_sky/front.png';

import { CloudsPlane } from '../vfx/clouds';


const loadAndFlip = (url: string, flipX = false, flipY = false): Promise<Texture> => {
    return new Promise((resolve) => {
        new TextureLoader().load(url, (texture) => {
            texture.flipY = flipY;
            if (flipX) {
                texture.center = new Vector2(0.5, 0.5);
                texture.rotation = Math.PI; // 180°
            }

            texture.needsUpdate = true;
            resolve(texture);
        });
    });
};

export class RendererWindow {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    clouds: CloudsPlane;
    constructor() {



        const canvas: HTMLCanvasElement = document.createElement('canvas');
        document.body.appendChild(canvas);

        // Mouse lock
        canvas.addEventListener('click', () => {
            canvas.requestPointerLock();
        });

        this.scene = new Scene();
        this.camera = new PerspectiveCamera(70, 1, 0.01, 100_000);


        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer = new WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;  // Optional for softer shadows

        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // SSAO
        //const ssaoPass = new SSAOPass(this.scene, this.camera);
        //ssaoPass.kernelRadius = 16;       // Larger radius covers more area
        //ssaoPass.minDistance = 0.001;     // Lower min = detect tight spaces (like corners)
        //ssaoPass.maxDistance = 0.1;       // Lower max = limit AO spread, sharper shadows
        //ssaoPass.renderToScreen = true;
        //this.composer.addPass(ssaoPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        // Add sun, it is too dark
        const sunlight = new DirectionalLight(0xffffff, 3);
        sunlight.position.set(100, 200, 100); // same as sunMesh
        this.scene.add(sunlight);
        // Ambient
        const ambientLight = new AmbientLight(0x404040, 2); // soft white light
        this.scene.add(ambientLight);

        // Skybox

        this.asyncInit();

        // Fog
        this.scene.fog = new FogExp2(0xB0C4DE, 0.005);  // Light steel blue with mild density

        // Clouds
        this.clouds = new CloudsPlane(this);

    }

    async asyncInit() {
        const [px, nx, py, ny, pz, nz] = await Promise.all([
            loadAndFlip(SkyLeft, false, true),       // +X (right)
            loadAndFlip(SkyRight, false, true),        // -X (left)
            loadAndFlip(SkyUp, false, false),                // +Y (top)
            loadAndFlip(SkyDown, false, false), // -Y (bottom)
            loadAndFlip(SkyFront, false, true),       // +Z (front)
            loadAndFlip(SkyBack, false, true)         // -Z (back)
        ]);

        const cubeTexture = new CubeTexture([
            px.image, nx.image, py.image,
            ny.image, pz.image, nz.image
        ]);

        // ensure edge texels are used instead of border pixels
        cubeTexture.wrapS = ClampToEdgeWrapping;
        cubeTexture.wrapT = ClampToEdgeWrapping;

        // full trilinear filtering
        cubeTexture.minFilter = LinearMipMapLinearFilter;
        cubeTexture.magFilter = LinearFilter;
        cubeTexture.generateMipmaps = true;

        cubeTexture.mapping = CubeReflectionMapping;            // correct lookup type
        cubeTexture.needsUpdate = true;                         // upload to GPU
        this.scene.background = cubeTexture;
    }

    renderLoop() {
        this.render();
        requestAnimationFrame(this.renderLoop);
    }

    render() {
        //this.renderer.render(this.scene, this.camera);
        this.clouds.update(1 / 60);
        this.composer.render();
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