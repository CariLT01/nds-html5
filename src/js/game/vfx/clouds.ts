import { DoubleSide, LinearMipMapLinearFilter, Mesh, PlaneGeometry, RepeatWrapping, ShaderMaterial, TextureLoader, Vector2 } from "three";
import { RendererWindow } from "../engine/renderer";

import cloudsNoiseTexture from '../../../../assets/textures/clouds/noise.png'

// Vertex shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader with smoothstep transition
const fragmentShader = `
uniform float     uTime;
uniform sampler2D uNoiseTex;
uniform vec2      uRepeat;
varying vec2      vUv;

void main() {
  // animate UV in X based on time
  vec2 uv = vUv * uRepeat + vec2(uTime * 0.1, 0.0);

  float n1 = texture(uNoiseTex, uv).r;
  float n2 = texture(uNoiseTex, uv * 2.0).r * 0.5;
  float n3 = texture(uNoiseTex, uv * 4.0).r * 0.25;
  float cloud = (n1 + n2 + n3) / (1.0 + 0.5 + 0.25);

  cloud = smoothstep(0.4, 0.7, cloud);
  vec3 col = mix(vec3(1.0), vec3(0.9, 0.92, 0.95), cloud * 0.2);

    // Radial fade from center
    float dist = distance(vUv, vec2(0.5));
    float fade = smoothstep(0.5, 0.8, 1.0 - dist);


  gl_FragColor = vec4(col, cloud) * vec4(1.0, 1.0, 1.0, fade);
}
`;


export class CloudsPlane {
    renderer: RendererWindow;
    mesh: Mesh;
    material: ShaderMaterial;
    counter: number = 0;
    constructor(renderer: RendererWindow) {

        const noiseTex = new TextureLoader().load(cloudsNoiseTexture, tex => {
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.minFilter = LinearMipMapLinearFilter;
            tex.generateMipmaps = true;
        });

        this.renderer = renderer;

        this.material = new ShaderMaterial(
            {
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                depthWrite: false,
                uniforms: {
                    uNoiseTex: { value: noiseTex },
                    uRepeat: { value: new Vector2(0.25, 0.25) },
                    uTime: { value: this.counter}
                },
                side: DoubleSide
            }
        );

        // Create plane geometry and shader material
        const geometry = new PlaneGeometry(10000, 10000);


        const plane = new Mesh(geometry, this.material);
        plane.position.set(0, 500, 0);     // Move 50 units up
        plane.rotation.x = Math.PI / 2;  // Rotate flat (facing downward)
        plane.renderOrder = 999999;
        this.mesh = plane;
        renderer.scene.add(plane);
    }
    update(dt: number) {
        console.log("Updating cloud counter: ", this.counter);
        this.counter+=dt / 60; // reduce speed
        this.material.uniforms.uTime.value = this.counter;
    }

    dispose() {
        this.renderer.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
    }
}