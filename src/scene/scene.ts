import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { SceneModule } from '../contracts';
import type { FrameState } from '../state';

/** STUB. Replaced by the scene unit. */
export function createScene(canvas: HTMLCanvasElement): SceneModule {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.1, 200);
  return {
    renderer,
    scene,
    camera,
    update(_state: FrameState) {},
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
  };
}
