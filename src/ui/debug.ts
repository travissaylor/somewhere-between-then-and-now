import type { Debug, DebugDeps } from '../contracts';
import type { FrameState } from '../state';

/**
 * Dev-only debug panel positioned in the bottom-left.
 * Provides live telemetry, era jumps, progress seeking, and era weight tuning.
 */
export function createDebug(root: HTMLElement, deps: DebugDeps): Debug {
  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.setAttribute('data-scroll-ignore', '');

  // Readouts containers
  const eraText = document.createElement('span');
  eraText.className = 'debug-value';

  const tText = document.createElement('span');
  tText.className = 'debug-value';

  const eraTText = document.createElement('span');
  eraTText.className = 'debug-value';

  const mixText = document.createElement('span');
  mixText.className = 'debug-value';

  const speedText = document.createElement('span');
  speedText.className = 'debug-value';

  const velText = document.createElement('span');
  velText.className = 'debug-value';

  const walkText = document.createElement('span');
  walkText.className = 'debug-value';

  const phaseText = document.createElement('span');
  phaseText.className = 'debug-value';

  const fadeText = document.createElement('span');
  fadeText.className = 'debug-value';

  const fpsText = document.createElement('span');
  fpsText.className = 'debug-value';

  // Helper to make a label/value row
  function makeRow(labelStr: string, valueEl: HTMLElement, fullWidth = false): HTMLElement {
    const row = document.createElement('div');
    row.className = fullWidth ? 'debug-row full-width' : 'debug-row';

    const label = document.createElement('span');
    label.className = 'debug-label';
    label.textContent = labelStr;

    row.appendChild(label);
    row.appendChild(valueEl);
    return row;
  }

  // Header
  const header = document.createElement('div');
  header.className = 'debug-header';
  header.textContent = 'DEBUG [ ` ]';
  panel.appendChild(header);

  // Readouts section
  const readoutsSec = document.createElement('div');
  readoutsSec.className = 'debug-section';

  const grid = document.createElement('div');
  grid.className = 'debug-grid';
  grid.appendChild(makeRow('Era:', eraText, true));
  grid.appendChild(makeRow('t:', tText));
  grid.appendChild(makeRow('eraT:', eraTText));
  grid.appendChild(makeRow('Mix:', mixText, true));
  grid.appendChild(makeRow('Speed:', speedText));
  grid.appendChild(makeRow('Velocity:', velText));
  grid.appendChild(makeRow('Walk:', walkText));
  grid.appendChild(makeRow('Phase:', phaseText));
  grid.appendChild(makeRow('Fade:', fadeText));
  grid.appendChild(makeRow('FPS:', fpsText));
  readoutsSec.appendChild(grid);
  panel.appendChild(readoutsSec);

  // Audio meters section
  const metersSec = document.createElement('div');
  metersSec.className = 'debug-section';

  const metersTitle = document.createElement('div');
  metersTitle.className = 'debug-section-title';
  metersTitle.textContent = 'Audio Meters';
  metersSec.appendChild(metersTitle);

  const metersContainer = document.createElement('div');
  metersContainer.className = 'debug-meters';

  function createMeterRow(labelStr: string) {
    const row = document.createElement('div');
    row.className = 'debug-meter-row';

    const label = document.createElement('span');
    label.className = 'debug-meter-label';
    label.textContent = labelStr;

    const track = document.createElement('div');
    track.className = 'debug-meter-track';

    const fill = document.createElement('div');
    fill.className = 'debug-meter-fill';
    track.appendChild(fill);

    const val = document.createElement('span');
    val.className = 'debug-meter-val';
    val.textContent = '0.00';

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(val);
    return { row, fill, val };
  }

  const meterMaster = createMeterRow('master');
  const meterEraA = createMeterRow('eraA');
  const meterEraB = createMeterRow('eraB');
  const meterEnergy = createMeterRow('energy');

  metersContainer.appendChild(meterMaster.row);
  metersContainer.appendChild(meterEraA.row);
  metersContainer.appendChild(meterEraB.row);
  metersContainer.appendChild(meterEnergy.row);
  metersSec.appendChild(metersContainer);
  panel.appendChild(metersSec);

  // Progress control section
  const progressSec = document.createElement('div');
  progressSec.className = 'debug-section';

  const progressHeader = document.createElement('div');
  progressHeader.className = 'debug-section-title';
  progressHeader.textContent = 'Progress';
  progressSec.appendChild(progressHeader);

  const progressInput = document.createElement('input');
  progressInput.type = 'range';
  progressInput.min = '0';
  progressInput.max = '1';
  progressInput.step = '0.0005';
  progressInput.value = '0';
  progressInput.className = 'debug-range';
  progressInput.addEventListener('input', () => {
    deps.setProgress(parseFloat(progressInput.value));
  });
  progressSec.appendChild(progressInput);
  panel.appendChild(progressSec);

  // Era jump buttons section
  const jumpSec = document.createElement('div');
  jumpSec.className = 'debug-section';

  const jumpTitle = document.createElement('div');
  jumpTitle.className = 'debug-section-title';
  jumpTitle.textContent = 'Jump to Era';
  jumpSec.appendChild(jumpTitle);

  const eraButtonsContainer = document.createElement('div');
  eraButtonsContainer.className = 'debug-era-buttons';

  const eraTitles = deps.eraTitles();
  eraTitles.forEach((title, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'debug-btn';
    btn.textContent = title;
    btn.addEventListener('click', () => {
      const bounds = deps.boundaries();
      const target = Math.min(1, Math.max(0, (bounds[i] ?? 0) + 0.002));
      deps.setProgress(target);
    });
    eraButtonsContainer.appendChild(btn);
  });
  jumpSec.appendChild(eraButtonsContainer);
  panel.appendChild(jumpSec);

  // Era weights tuning section
  const weightsSec = document.createElement('div');
  weightsSec.className = 'debug-section';

  const weightsTitle = document.createElement('div');
  weightsTitle.className = 'debug-section-title';
  weightsTitle.textContent = 'Era Weights';
  weightsSec.appendChild(weightsTitle);

  const weightsContainer = document.createElement('div');
  weightsContainer.className = 'debug-weights';

  const initialWeights = deps.getWeights();
  const weightInputs: HTMLInputElement[] = [];
  const weightValEls: HTMLElement[] = [];

  initialWeights.forEach((w, i) => {
    const row = document.createElement('div');
    row.className = 'debug-weight-row';

    const label = document.createElement('span');
    label.className = 'debug-weight-label';
    label.textContent = eraTitles[i] ?? `Era ${i + 1}`;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0.2';
    input.max = '3';
    input.step = '0.05';
    input.value = String(w);

    const valDisplay = document.createElement('span');
    valDisplay.className = 'debug-weight-val';
    valDisplay.textContent = w.toFixed(2);

    input.addEventListener('input', () => {
      const fullWeights = weightInputs.map((inp) => parseFloat(inp.value));
      deps.setWeights(fullWeights);
      valDisplay.textContent = parseFloat(input.value).toFixed(2);
    });

    weightInputs.push(input);
    weightValEls.push(valDisplay);

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(valDisplay);
    weightsContainer.appendChild(row);
  });

  weightsSec.appendChild(weightsContainer);
  panel.appendChild(weightsSec);

  root.appendChild(panel);

  // Wheel and keydown isolation
  panel.addEventListener('wheel', (e) => e.stopPropagation());
  panel.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote' || e.key === '`') {
      toggle();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  });

  // Visibility handling
  const search = typeof location !== 'undefined'
    ? location.search
    : (typeof window !== 'undefined' ? window.location.search : '');
  let visible = search.includes('debug');

  function applyVisibility() {
    if (visible) {
      panel.classList.remove('debug-hidden');
    } else {
      panel.classList.add('debug-hidden');
    }
  }

  // Update telemetry and meters
  let hasUpdated = false;
  let lastUpdate = 0;
  let avgFps = 0;

  function toggle() {
    visible = !visible;
    applyVisibility();
    if (visible) {
      hasUpdated = false;
    }
  }

  applyVisibility();

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.code === 'Backquote' || e.key === '`') {
      toggle();
    }
  }
  window.addEventListener('keydown', handleWindowKeydown);

  function updateMeter(fill: HTMLElement, text: HTMLElement, val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    fill.style.width = `${(clamped * 100).toFixed(1)}%`;
    text.textContent = clamped.toFixed(2);
  }

  function update(state: FrameState) {
    if (state.dt > 0) {
      const instantFps = 1 / state.dt;
      avgFps = avgFps === 0 ? instantFps : (avgFps * 0.9 + instantFps * 0.1);
    }

    const now = performance.now();
    if (hasUpdated && now - lastUpdate < 100) {
      return;
    }
    lastUpdate = now;
    hasUpdated = true;

    if (!visible) {
      return;
    }

    const titles = deps.eraTitles();
    eraText.textContent = titles[state.eraIndex] ?? String(state.eraIndex);
    tText.textContent = state.t.toFixed(4);
    eraTText.textContent = state.eraT.toFixed(4);
    mixText.textContent = `${state.mix.toFixed(4)} (${state.eraA} → ${state.eraB})`;
    speedText.textContent = state.speed.toFixed(4);
    velText.textContent = state.velocity.toFixed(4);
    walkText.textContent = state.walkDistance.toFixed(2);
    phaseText.textContent = state.phase;
    fadeText.textContent = state.fade.toFixed(4);
    fpsText.textContent = Math.round(avgFps).toString();

    const meters = deps.meters();
    updateMeter(meterMaster.fill, meterMaster.val, meters.master);
    updateMeter(meterEraA.fill, meterEraA.val, meters.eraA);
    updateMeter(meterEraB.fill, meterEraB.val, meters.eraB);
    updateMeter(meterEnergy.fill, meterEnergy.val, meters.energy);

    if (document.activeElement !== progressInput) {
      progressInput.value = state.t.toFixed(4);
    }
  }

  return { update, toggle };
}
