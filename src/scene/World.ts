import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Palette } from './palette.ts';

/**
 * Renderer, camera, fog and lights. Renders on demand only: a frame is drawn when the camera or
 * theme changes, so an idle page costs nothing. Frames go through requestAnimationFrame, which
 * browsers pause in hidden tabs.
 */
export class World {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(55, 1, 0.1, 400);
  readonly cameraTarget = new Vector3();
  private readonly renderer: WebGLRenderer;
  private readonly fog = new FogExp2(0xffffff, 0.03);
  private readonly hemi = new HemisphereLight();
  private readonly sun = new DirectionalLight();
  private frameRequested = false;
  private firstFrame?: () => void;

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
    this.sun.position.set(-30, 40, 20);
    this.scene.add(this.hemi, this.sun);

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
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  setPalette(p: Palette): void {
    (this.scene.background as Color).set(p.fog);
    this.fog.color.set(p.fog);
    this.fog.density = p.fogDensity;
    this.hemi.color.set(p.sky);
    this.hemi.groundColor.set(p.skyGround);
    this.hemi.intensity = p.hemi;
    this.sun.intensity = p.sun;
    this.requestRender();
  }

  requestRender(): void {
    if (this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.camera.lookAt(this.cameraTarget);
      this.renderer.render(this.scene, this.camera);
      if (this.firstFrame) {
        this.firstFrame();
        this.firstFrame = undefined;
      }
    });
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
