import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { Post } from '../contracts';
import type { FrameState } from '../state';

/** STUB. Replaced by the post unit. */
export function createPost(renderer: WebGLRenderer): Post {
  return {
    render(scene: Scene, camera: PerspectiveCamera, _state: FrameState) {
      renderer.render(scene, camera);
    },
    resize() {},
  };
}
