// Womb heartbeat pulse fragment shader
// Deep red-black darkness that pulses with a warm rhythmic light at ~70bpm.
// When uBirthProgress approaches 1.0, the beat accelerates and the screen floods
// with white-warm light — the birth moment that transitions to Era 01.
//
// Uniforms:
//   uTime         - elapsed time in seconds
//   uBeatRate     - heartbeat frequency in Hz (default 1.167 = 70bpm)
//   uIntensity    - overall pulse intensity 0-1
//   uBirthProgress - 0=resting womb, 1=birth flash flooding the screen

uniform float uTime;
uniform float uBeatRate;
uniform float uIntensity;
uniform float uBirthProgress;

varying vec2 vUv;

void main() {
  // When uBirthProgress > 0, the heart rate accelerates and intensity builds
  float acceleratedRate = uBeatRate * (1.0 + uBirthProgress * 3.0);

  // Sharp heartbeat pulse shape: pow(sin(...), 3) gives a quick flash with long rest
  float pulse = pow(sin(uTime * acceleratedRate * 6.2832) * 0.5 + 0.5, 3.0);

  // Birth progress amplifies intensity — at full birth the screen floods with light
  float effectiveIntensity = uIntensity * (1.0 + uBirthProgress * 2.0);

  // Base color: deep red-black darkness (womb)
  vec3 baseColor  = vec3(0.08, 0.01, 0.01);
  // Pulse color: warm blood-red glow
  vec3 pulseColor = vec3(0.4, 0.05, 0.02);
  // Birth flash color: white-warm light flooding through
  vec3 birthColor = vec3(1.0, 0.92, 0.80);

  // Heartbeat pulse blends between base and pulse colors
  vec3 heartbeat = mix(baseColor, pulseColor, pulse * effectiveIntensity);

  // As birth approaches 1.0, flood toward white-warm
  vec3 color = mix(heartbeat, birthColor, uBirthProgress * uBirthProgress);

  // Subtle vignette: darken edges for womb-like enclosure feeling
  vec2 centered = vUv - 0.5;
  float dist = dot(centered, centered); // distance squared from center
  float vignette = 1.0 - dist * 2.8;   // tuned to start darkening at ~0.4 radius
  vignette = clamp(vignette, 0.0, 1.0);
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
