/**
 * The one persistent three.js scene: renderer, the walking camera, ambient
 * light, and the cast (see cast.ts). Everything reads state.params fresh each
 * frame; nothing here keeps its own notion of where the viewer is.
 */
import {
  Color,
  FogExp2,
  HemisphereLight,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import type { SceneModule } from '../contracts';
import type { FrameState } from '../state';
import {
  createGround,
  createHorizon,
  createLamp,
  createLight,
  createMotes,
  createTable,
  createWalls,
  setSRGB,
} from './cast';

const EYE_HEIGHT = 1.6;

/** Builds the renderer, walking camera, and cast; returns the SceneModule contract. */
export function createScene(canvas: HTMLCanvasElement): SceneModule {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.1, 300);
  camera.position.set(0, EYE_HEIGHT, 0);

  const bgColor = new Color();
  scene.background = bgColor;
  const fog = new FogExp2(bgColor, 0.02);
  scene.fog = fog;

  const hemisphere = new HemisphereLight(0xffffff, 0x000000, 0.6);
  scene.add(hemisphere);

  const light = createLight(scene);
  const ground = createGround(scene);
  const walls = createWalls(scene);
  const table = createTable(scene);
  const lamp = createLamp(scene);
  const horizon = createHorizon(scene);
  const motes = createMotes(scene);

  function update(state: FrameState) {
    const { params } = state;

    camera.position.z = -state.walkDistance;
    const bob = state.reducedMotion ? 0 : 0.025 * Math.sin(state.elapsed * 1.1) * (1 - params.stillness);
    camera.position.y = EYE_HEIGHT + bob;
    camera.rotation.z = state.reducedMotion ? 0 : params.tilt;

    setSRGB(bgColor, params.bg);
    setSRGB(fog.color, params.bg);
    fog.density = 0.02 + params.fogDensity * 0.08;

    setSRGB(hemisphere.color, params.bg);
    setSRGB(hemisphere.groundColor, params.ground);

    light.update(camera, state);
    ground.update(camera, state);
    walls.update(camera, state);
    table.update(camera, state);
    lamp.update(camera, state);
    horizon.update(camera, state);
    motes.update(camera, state);
  }

  function resize(width: number, height: number) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, update, resize };
}
