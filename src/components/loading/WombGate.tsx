'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { createWombMaterial } from './WombMaterial';
import { eraStore } from '@/store/eraStore';

/**
 * WombGate state machine:
 * LOADING       — heartbeat at 70bpm, deep red-black darkness
 * BIRTH         — heartbeat accelerates, intensity grows, birth flash
 * DONE          — womb quad hidden, compositor takes over
 */
type WombState = 'LOADING' | 'BIRTH' | 'DONE';

// Minimum womb duration so the heartbeat is felt even on fast machines (ms)
const MIN_WOMB_DURATION_MS = 1800;
// Birth animation duration (seconds for useFrame time math)
const BIRTH_DURATION_S = 1.5;

/**
 * WombGate — the loading gate rendered inside the R3F Canvas.
 *
 * Renders a fullscreen quad using the womb heartbeat ShaderMaterial.
 * State transitions:
 *   LOADING  → assets 100% loaded AND min duration elapsed → BIRTH
 *   BIRTH    → birth animation finishes → DONE → eraStore.isScrollEnabled = true
 *
 * Shader warmup (compileAsync) runs during BIRTH so first transition is stutter-free.
 * No text, no progress bars — pure visceral pulse.
 */
export default function WombGate() {
  const { gl, camera, scene } = useThree();
  const { active, progress } = useProgress();

  const wombStateRef = useRef<WombState>('LOADING');
  const birthStartTimeRef = useRef<number>(0);
  const loadReadyRef = useRef<boolean>(false);
  const wombStartMsRef = useRef<number>(Date.now());
  const warmupDoneRef = useRef<boolean>(false);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Create womb material once
  const wombMaterial = useRef<THREE.ShaderMaterial>(createWombMaterial());

  // Create fullscreen quad mesh
  const quadMesh = useRef<THREE.Mesh | null>(null);
  const quadScene = useRef<THREE.Scene | null>(null);
  const orthoCamera = useRef<THREE.OrthographicCamera>(
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  );

  useEffect(() => {
    // Build the womb quad scene (separate from main R3F scene)
    const qScene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      wombMaterial.current
    );
    qScene.add(mesh);
    quadMesh.current = mesh;
    quadScene.current = qScene;
    meshRef.current = mesh;

    return () => {
      mesh.geometry.dispose();
      wombMaterial.current.dispose();
    };
  }, []);

  // Track when assets are ready + minimum duration has elapsed
  useEffect(() => {
    // With procedural content, progress hits 100 quickly.
    // We also enforce a minimum womb duration so the heartbeat registers emotionally.
    if (!active && progress >= 100) {
      const elapsed = Date.now() - wombStartMsRef.current;
      const remaining = Math.max(0, MIN_WOMB_DURATION_MS - elapsed);
      const timer = setTimeout(() => {
        loadReadyRef.current = true;
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mat = wombMaterial.current;

    if (wombStateRef.current === 'DONE') return;
    if (!quadScene.current) return;

    // LOADING state — steady 70bpm heartbeat
    if (wombStateRef.current === 'LOADING') {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uBeatRate.value = 1.167; // 70bpm
      mat.uniforms.uIntensity.value = 1.0;
      mat.uniforms.uBirthProgress.value = 0;

      // Transition to BIRTH when assets + min duration ready
      if (loadReadyRef.current) {
        wombStateRef.current = 'BIRTH';
        birthStartTimeRef.current = t;
      }

      // Render womb quad to screen
      gl.setRenderTarget(null);
      gl.render(quadScene.current, orthoCamera.current);
      return;
    }

    // BIRTH state — heartbeat accelerates, birth flash
    if (wombStateRef.current === 'BIRTH') {
      const birthElapsed = t - birthStartTimeRef.current;
      const birthProgress = Math.min(birthElapsed / BIRTH_DURATION_S, 1.0);

      // Heartbeat rate ramps from 70bpm (1.167) to ~240bpm (4.0)
      const beatRate = 1.167 + (4.0 - 1.167) * birthProgress;
      // Intensity ramps from 1.0 to 2.5 then floods white
      const intensity = 1.0 + 1.5 * birthProgress;

      mat.uniforms.uTime.value = t;
      mat.uniforms.uBeatRate.value = beatRate;
      mat.uniforms.uIntensity.value = intensity;
      mat.uniforms.uBirthProgress.value = birthProgress;

      // Shader warmup: compile era shaders during birth animation
      // This provides natural time for GPU shader compilation
      if (!warmupDoneRef.current && birthProgress > 0.1) {
        warmupDoneRef.current = true;
        // Compile the main scene shaders asynchronously during the birth animation
        if (gl.compileAsync) {
          gl.compileAsync(scene, camera).catch(() => {
            // Non-fatal — browser will compile on first render if needed
          });
        }
      }

      // Render womb quad to screen during birth animation
      gl.setRenderTarget(null);
      gl.render(quadScene.current, orthoCamera.current);

      // Birth animation complete
      if (birthProgress >= 1.0) {
        wombStateRef.current = 'DONE';
        // Signal scroll engine that scrolling is now permitted
        eraStore.setState({ isScrollEnabled: true });
      }
    }
  }, 2); // priority=2 — renders OVER compositor (higher priority = runs last)

  return null; // purely behavioral component — renders via manual gl.render()
}
