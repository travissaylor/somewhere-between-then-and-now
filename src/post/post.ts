import {
  HalfFloatType,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type WebGLRenderer,
} from 'three';
import type { Post } from '../contracts';
import type { FrameState } from '../state';

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uTexelSize;
  uniform float uBlurRadius;
  uniform float uWarmth;
  uniform float uSaturation;
  uniform float uContrast;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uGrainSize;
  uniform float uTime;
  uniform float uFlicker;
  uniform float uFade;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float luma(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  void main() {
    // 1. Nine-tap blur in drawing-buffer pixels; zero radius is one sample.
    vec3 color = texture2D(uScene, vUv).rgb;
    if (uBlurRadius > 0.0) {
      vec2 offset = uTexelSize * uBlurRadius;
      color *= 0.25;
      color += texture2D(uScene, vUv + vec2(offset.x, 0.0)).rgb * 0.125;
      color += texture2D(uScene, vUv - vec2(offset.x, 0.0)).rgb * 0.125;
      color += texture2D(uScene, vUv + vec2(0.0, offset.y)).rgb * 0.125;
      color += texture2D(uScene, vUv - vec2(0.0, offset.y)).rgb * 0.125;
      color += texture2D(uScene, vUv + offset).rgb * 0.0625;
      color += texture2D(uScene, vUv - offset).rgb * 0.0625;
      color += texture2D(uScene, vUv + vec2(offset.x, -offset.y)).rgb * 0.0625;
      color += texture2D(uScene, vUv + vec2(-offset.x, offset.y)).rgb * 0.0625;
    }

    // 2. ACES filmic approximation on the linear, untonemapped scene.
    color = max(color, vec3(0.0));
    color = clamp((color * (2.51 * color + 0.03)) /
      (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);

    // 3. Warmth shifts red and blue in opposite directions.
    color.r *= 1.0 + 0.12 * uWarmth;
    color.b *= 1.0 - 0.12 * uWarmth;

    // 4. Saturation includes the era's scroll-speed sensitivity.
    color = mix(vec3(luma(color)), color, uSaturation);

    // 5. Contrast around the tonemapped midpoint.
    color = (color - 0.5) * uContrast + 0.5;

    // 6. Soft vignette, strongest at the corners.
    vec2 centered = vUv * 2.0 - 1.0;
    float edge = smoothstep(0.2, 1.7, dot(centered, centered));
    color *= 1.0 - uVignette * edge;

    // 7. Pixel-sized grain cells and a separate, subtle exposure flicker.
    vec2 cell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
    vec2 seed = vec2(uTime * 127.1, uTime * 311.7);
    float noise = hash(cell + seed) * 2.0 - 1.0;
    float grainWeight = 1.0 - clamp(luma(color), 0.0, 1.0) * 0.5;
    color += noise * uGrain * 0.07 * grainWeight;
    color *= 1.0 + (hash(seed) * 2.0 - 1.0) * 0.02 * uFlicker;

    // 8. Fade after all texture so the ending reaches true black.
    color = mix(clamp(color, 0.0, 1.0), vec3(0.0), uFade);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Grades the linear scene and adds each era's film texture in one pass. */
export function createPost(renderer: WebGLRenderer): Post {
  const size = renderer.getDrawingBufferSize(new Vector2());
  const target = new WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    generateMipmaps: false,
  });
  const uniforms = {
    uScene: { value: target.texture },
    uTexelSize: { value: new Vector2(1 / target.width, 1 / target.height) },
    uBlurRadius: { value: 0 },
    uWarmth: { value: 0 },
    uSaturation: { value: 1 },
    uContrast: { value: 1 },
    uVignette: { value: 0 },
    uGrain: { value: 0 },
    uGrainSize: { value: 1 },
    uTime: { value: 0 },
    uFlicker: { value: 0 },
    uFade: { value: 0 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
    toneMapped: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const postScene = new Scene();
  postScene.add(quad);
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    render(scene: Scene, camera: PerspectiveCamera, state: FrameState) {
      const params = state.params;
      const speedEffect = state.speed * params.speedSensitivity;
      uniforms.uBlurRadius.value = params.blur * 6 + speedEffect * 4;
      uniforms.uWarmth.value = params.warmth;
      uniforms.uSaturation.value = params.saturation * (1 + speedEffect * 0.6);
      uniforms.uContrast.value = params.contrast;
      uniforms.uVignette.value = params.vignette;
      uniforms.uGrain.value = params.grain;
      uniforms.uGrainSize.value = params.grainSize;
      uniforms.uTime.value = state.elapsed;
      uniforms.uFlicker.value = state.reducedMotion ? 0 : params.grain;
      uniforms.uFade.value = state.fade;

      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
    },
    resize(width: number, height: number) {
      const pixelRatio = renderer.getPixelRatio();
      const bufferWidth = Math.max(1, Math.floor(width * pixelRatio));
      const bufferHeight = Math.max(1, Math.floor(height * pixelRatio));
      target.setSize(bufferWidth, bufferHeight);
      uniforms.uTexelSize.value.set(1 / bufferWidth, 1 / bufferHeight);
    },
  };
}
