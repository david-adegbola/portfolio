import {
  BackSide,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Look } from './palette.ts';
import { windTime } from './vegetation.ts';

/**
 * Renderer, camera, sky, haze and light. Two modes: on demand (a frame only when the camera or
 * look changes; used under reduced motion) or a gentle loop that advances the wind. Frames go
 * through requestAnimationFrame, which browsers pause in hidden tabs.
 */
export class World {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(55, 1, 0.1, 400);
  readonly cameraTarget = new Vector3();
  private readonly renderer: WebGLRenderer;
  private readonly fog = new FogExp2(0xffffff, 0.03);
  private readonly hemi = new HemisphereLight();
  private readonly sun = new DirectionalLight();
  private readonly skyTop = new Color();
  private readonly skyHorizon = new Color();
  private readonly sky: Mesh;
  private frameRequested = false;
  private firstFrame?: () => void;
  private looping = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly maxPixelRatio: number,
    antialias: boolean,
  ) {
    // Throws on missing or software-only WebGL (it would crawl); the caller then skips the scene.
    this.renderer = new WebGLRenderer({
      canvas,
      antialias,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    });
    // If the GPU drops the context, fade the scene away and leave the plain page; bring it back
    // if the context is restored.
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      document.documentElement.classList.remove('has-scene');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      document.documentElement.classList.add('has-scene');
      this.requestRender();
    });
    this.scene.fog = this.fog;
    this.scene.background = new Color();
    // Low northern sun, high to the left and a little behind the camera.
    this.sun.position.set(-30, 34, 22);
    // A sky dome that follows the camera: horizon colour (= the haze) fading up to the sky.
    this.sky = new Mesh(
      new SphereGeometry(300, 24, 12),
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: this.skyTop }, uHorizon: { value: this.skyHorizon } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          varying vec3 vDir;
          void main() {
            gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(0.02, 0.55, vDir.y)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    );
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.scene.add(this.hemi, this.sun, this.sky);

    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  /** Called once, after the next frame has been drawn. */
  onFirstFrame(callback: () => void): void {
    this.firstFrame = callback;
  }

  /** Compile shaders without blocking (parallel compile where supported) before the first frame. */
  async compile(): Promise<void> {
    await this.renderer.compileAsync(this.scene, this.camera);
  }

  /** Render now (synchronously), e.g. while the canvas is hidden mid-crossfade. */
  renderNow(): void {
    this.draw();
  }

  setLook(look: Look): void {
    (this.scene.background as Color).set(look.horizon);
    this.fog.color.set(look.horizon);
    this.fog.density = look.fogDensity;
    this.skyHorizon.set(look.horizon);
    this.skyTop.set(look.skyTop);
    this.hemi.color.set(look.hemiSky);
    this.hemi.groundColor.set(look.hemiGround);
    this.hemi.intensity = look.hemi;
    this.sun.color.set(look.sunColor);
    this.sun.intensity = look.sun;
    this.requestRender();
  }

  /**
   * Keep drawing so the wind can move the vegetation. `fps` caps the rate (phones run at 30).
   * Paused automatically in hidden tabs, since requestAnimationFrame is.
   */
  startLoop(fps: number): void {
    if (this.looping) return;
    this.looping = true;
    const minDelta = 1000 / fps - 2;
    let last = 0;
    const tick = (now: number) => {
      requestAnimationFrame(tick);
      if (now - last < minDelta) return;
      // Clamp long gaps (tab was hidden) so the wind doesn't jump.
      windTime.value += Math.min(now - (last || now), 100) / 1000;
      last = now;
      this.draw();
    };
    requestAnimationFrame(tick);
  }

  requestRender(): void {
    if (this.looping || this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.draw();
    });
  }

  private draw(): void {
    this.camera.lookAt(this.cameraTarget);
    this.sky.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    if (this.firstFrame) {
      this.firstFrame();
      this.firstFrame = undefined;
    }
  }

  private resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.maxPixelRatio));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // On wide screens the text column sits on the left, so shift the vanishing point right.
    const shift = width >= 1024 ? width * 0.16 : 0;
    if (shift) this.camera.setViewOffset(width + 2 * shift, height, 0, 0, width, height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }
}
