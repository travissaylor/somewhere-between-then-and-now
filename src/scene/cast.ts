/**
 * The six cast objects (plus the drifting motes). Each factory adds its meshes
 * to the scene once at creation and returns an `update(camera, state)` that
 * mutates existing objects in place — no per-frame allocation.
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  MathUtils,
} from 'three';
import type { FrameState, RGB } from '../state';

interface CastPiece {
  update(camera: PerspectiveCamera, state: FrameState): void;
}

/** Mutate an existing Color in place from a sRGB 0..1 tuple. */
export function setSRGB(color: Color, rgb: RGB): void {
  color.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);
}

/** The Light: a point light plus its visible emissive body. Grows from darkness at begin. */
export function createLight(scene: Scene): CastPiece {
  const AHEAD = 7;
  const HORIZON_AHEAD = 60;
  const HORIZON_Y = 1.0;

  const pointLight = new PointLight(0xffffff, 0, 40, 2);
  const body = new Mesh(new SphereGeometry(0.18, 16, 16), new MeshBasicMaterial());
  scene.add(pointLight, body);

  return {
    update(camera, state) {
      const { params } = state;
      setSRGB(pointLight.color, params.light);
      setSRGB((body.material as MeshBasicMaterial).color, params.light);

      const bloom = MathUtils.smoothstep(state.sinceBegin, 0, 4);
      const breathe = 1 + 0.05 * Math.sin(state.elapsed * 0.9) * (1 - params.stillness);

      const inHorizonEra = state.eraIndex === 12;
      const ahead = inHorizonEra ? MathUtils.lerp(AHEAD, HORIZON_AHEAD, state.eraT) : AHEAD;
      const y = inHorizonEra ? MathUtils.lerp(params.lightHeight, HORIZON_Y, state.eraT) : params.lightHeight;

      pointLight.position.set(camera.position.x, y, camera.position.z - ahead);
      body.position.copy(pointLight.position);
      pointLight.intensity = params.lightIntensity * 6 * bloom * breathe;
      body.scale.setScalar(bloom);
    },
  };
}

/** The Ground: a large undulating plane that follows the camera down z. */
export function createGround(scene: Scene): CastPiece {
  const SIZE = 400;
  const geometry = new PlaneGeometry(SIZE, SIZE, 40, 40);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const h = 0.08 * Math.sin(x * 0.02 + y * 0.015) + 0.07 * Math.sin(x * 0.011 - y * 0.023);
    position.setZ(i, h);
  }
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({ roughness: 1, metalness: 0 });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  return {
    update(camera, state) {
      setSRGB(material.color, state.params.ground);
      mesh.position.z = camera.position.z;
    },
  };
}

/** The Walls: left, right, and ceiling slabs that close in or open to sky. */
export function createWalls(scene: Scene): CastPiece {
  const BASE_X = 3.2;
  const THICKNESS = 0.3;
  const LENGTH = 400;

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshStandardMaterial({ transparent: true, roughness: 0.95 });
  const left = new Mesh(geometry, material);
  const right = new Mesh(geometry, material);
  const ceiling = new Mesh(geometry, material);
  scene.add(left, right, ceiling);

  return {
    update(camera, state) {
      const { params } = state;
      setSRGB(material.color, params.wallColor);
      material.opacity = params.walls;

      const visible = params.walls > 0.01;
      left.visible = visible;
      right.visible = visible;
      ceiling.visible = visible;
      if (!visible) return;

      const height = 3.0 * params.wallsHeight;
      const offsetX = BASE_X - 0.6 * (1 - params.wallsHeight);
      const z = camera.position.z;

      left.scale.set(THICKNESS, height, LENGTH);
      left.position.set(-offsetX, height / 2, z);

      right.scale.set(THICKNESS, height, LENGTH);
      right.position.set(offsetX, height / 2, z);

      ceiling.scale.set(offsetX * 2 + THICKNESS, THICKNESS, LENGTH);
      ceiling.position.set(0, height, z);
    },
  };
}

/** The Table: dinner table that fades in at the end of era 03, then morphs into a goal post in era 05. */
export function createTable(scene: Scene): CastPiece {
  const AHEAD = 5;
  const LEG_HEIGHT = 0.85;
  const LEG_X = 0.7;
  const LEG_Z = 0.35;

  const material = new MeshStandardMaterial({ transparent: true, roughness: 0.8, color: 0x5a4632 });
  const top = new Mesh(new BoxGeometry(1.6, 0.08, 0.9), material);
  top.position.y = LEG_HEIGHT + 0.04;

  const legGeometry = new BoxGeometry(0.08, LEG_HEIGHT, 0.08);
  const legOffsets: Array<[number, number]> = [
    [-LEG_X, -LEG_Z], [LEG_X, -LEG_Z], [-LEG_X, LEG_Z], [LEG_X, LEG_Z],
  ];
  const legs = legOffsets.map(([x, z]) => {
    const leg = new Mesh(legGeometry, material);
    leg.position.set(x, LEG_HEIGHT / 2, z);
    return leg;
  });

  const group = new Group();
  group.add(top, ...legs);
  scene.add(group);

  return {
    update(camera, state) {
      const { eraIndex, eraT } = state;
      let visible = false;
      let opacity = 0;
      let morphT = 0;

      if (eraIndex === 2 && eraT > 0.7) {
        visible = true;
        opacity = (eraT - 0.7) / 0.3;
      } else if (eraIndex === 3) {
        visible = true;
        opacity = 1;
      } else if (eraIndex === 4) {
        visible = true;
        opacity = 1;
        morphT = eraT;
      }

      group.visible = visible;
      material.opacity = opacity;
      for (const leg of legs) {
        leg.scale.y = MathUtils.lerp(1, 3.5, morphT);
        leg.scale.x = MathUtils.lerp(1, 0.15, morphT);
      }

      group.position.set(camera.position.x, 0, camera.position.z - AHEAD);
    },
  };
}

/** The Lamp: the constant of the apartment years. Falls and goes dark in the breakup. */
export function createLamp(scene: Scene): CastPiece {
  const AHEAD = 4;
  const SIDE = 1.5;
  const POST_HEIGHT = 1.4;
  const FALL_ROTATION = -1.4;
  const FALL_WINDOW = 0.3;
  const ROSE_WHITE: RGB = [1, 0.878, 0.902];

  const bodyMaterial = new MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.6 });
  const post = new Mesh(new CylinderGeometry(0.03, 0.03, POST_HEIGHT, 8), bodyMaterial);
  post.position.y = POST_HEIGHT / 2;
  const bulb = new Mesh(new SphereGeometry(0.12, 12, 12), bodyMaterial);
  bulb.position.y = POST_HEIGHT;

  const light = new PointLight(0xffffff, 0, 8);
  light.position.y = POST_HEIGHT;
  setSRGB(light.color, ROSE_WHITE);

  const group = new Group();
  group.add(post, bulb, light);
  scene.add(group);

  return {
    update(camera, state) {
      const { eraIndex, eraT } = state;
      const visible = eraIndex === 7 || eraIndex === 8;
      group.visible = visible;
      if (!visible) return;

      if (eraIndex === 7) {
        group.rotation.z = 0;
        light.intensity = 2;
      } else {
        const fallT = Math.min(1, eraT / FALL_WINDOW);
        group.rotation.z = MathUtils.lerp(0, FALL_ROTATION, fallT);
        light.intensity = 0;
      }

      group.position.set(camera.position.x + SIDE, 0, camera.position.z - AHEAD);
    },
  };
}

/** The Horizon: a bright line far ahead, seen only in the final era. */
export function createHorizon(scene: Scene): CastPiece {
  const AHEAD = 120;
  const Y = 1.0;

  const material = new MeshBasicMaterial({ transparent: true, opacity: 0 });
  const mesh = new Mesh(new PlaneGeometry(400, 0.04), material);
  scene.add(mesh);

  return {
    update(camera, state) {
      const { eraIndex, eraT, params } = state;
      setSRGB(material.color, params.light);
      const visible = eraIndex === 12;
      mesh.visible = visible;
      material.opacity = visible ? eraT : 0;
      mesh.position.set(camera.position.x, Y, camera.position.z - AHEAD);
    },
  };
}

/** Motes: a drifting particle cloud around the viewer. */
export function createMotes(scene: Scene): CastPiece {
  const COUNT = 800;
  const BOX_W = 40;
  const BOX_H = 6;
  const BOX_D = 60;
  const DRIFT_SPEED = 0.4;

  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX_W;
    positions[i * 3 + 1] = Math.random() * BOX_H;
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOX_D;
  }

  const geometry = new BufferGeometry();
  const attribute = new BufferAttribute(positions, 3);
  geometry.setAttribute('position', attribute);

  const material = new PointsMaterial({ size: 0.05, transparent: true, opacity: 0.6, depthWrite: false });
  const points = new Points(geometry, material);
  scene.add(points);

  return {
    update(camera, state) {
      setSRGB(material.color, state.params.light);

      const drift = DRIFT_SPEED * state.dt * (1 - state.params.stillness);
      for (let i = 0; i < COUNT; i++) {
        let y = positions[i * 3 + 1] + drift;
        if (y > BOX_H) y -= BOX_H;
        positions[i * 3 + 1] = y;
      }
      attribute.needsUpdate = true;

      points.position.set(camera.position.x, 0, camera.position.z);
    },
  };
}
