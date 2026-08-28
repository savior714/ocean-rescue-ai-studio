/**
 * Rescue Readiness gameplay state authority for Ocean Rescue (WP-31 / Travel).
 *
 * Rescue Readiness is session-local internal continuous gameplay state (0..1).
 * It is completely hidden from the child as a score, meter, or abstract checklist.
 * Equipment milestones are monotonically committed as continuous progress reaches
 * semantic thresholds:
 * - Searchlight milestone: 0.33
 * - Thruster milestone: 0.66
 * - Cutter / Scanner milestone: 0.90
 *
 * Clean piloting, staying in current streams, boosting, and precision navigation
 * contribute to readiness progress. Collisions penalize only uncommitted progress
 * above the committed floor; once a milestone is earned, it is never lost.
 */

export interface ReadinessSnapshot {
  readonly searchlight: boolean;
  readonly thruster: boolean;
  readonly cutter: boolean;
  readonly continuousValue: number;
}

interface MutableReadinessState {
  continuousValue: number;
  committedFloor: number;
  searchlight: boolean;
  thruster: boolean;
  cutter: boolean;
}

const SEARCHLIGHT_THRESHOLD = 0.33;
const THRUSTER_THRESHOLD = 0.66;
const CUTTER_THRESHOLD = 0.90;

const state: MutableReadinessState = {
  continuousValue: 0,
  committedFloor: 0,
  searchlight: false,
  thruster: false,
  cutter: false,
};

function freeze<T>(value: T): Readonly<T> {
  return Object.freeze(value);
}

function checkMilestones(): boolean {
  let changed = false;
  if (!state.searchlight && state.continuousValue >= SEARCHLIGHT_THRESHOLD) {
    state.searchlight = true;
    state.committedFloor = Math.max(state.committedFloor, SEARCHLIGHT_THRESHOLD);
    changed = true;
  }
  if (!state.thruster && state.continuousValue >= THRUSTER_THRESHOLD) {
    state.thruster = true;
    state.committedFloor = Math.max(state.committedFloor, THRUSTER_THRESHOLD);
    changed = true;
  }
  if (!state.cutter && state.continuousValue >= CUTTER_THRESHOLD) {
    state.cutter = true;
    state.committedFloor = Math.max(state.committedFloor, CUTTER_THRESHOLD);
    changed = true;
  }
  return changed;
}

function getSnapshot(): ReadinessSnapshot {
  return freeze({
    searchlight: state.searchlight,
    thruster: state.thruster,
    cutter: state.cutter,
    continuousValue: state.continuousValue,
  });
}

function reset(): void {
  state.continuousValue = 0;
  state.committedFloor = 0;
  state.searchlight = false;
  state.thruster = false;
  state.cutter = false;
}

function start(): void {
  reset();
}

function addProgress(amount: number): boolean {
  if (amount <= 0) return false;
  state.continuousValue = Math.min(1.0, state.continuousValue + amount);
  return checkMilestones();
}

function step(deltaMs: number, isPiloting: boolean, inCurrent: boolean): boolean {
  if (deltaMs <= 0) return false;
  const sec = deltaMs / 1000;
  let gained = 0.008 * sec;
  if (isPiloting) {
    gained += 0.012 * sec;
  }
  if (inCurrent) {
    gained += 0.04 * sec;
  }
  if (gained > 0) {
    state.continuousValue = Math.min(1.0, state.continuousValue + gained);
    return checkMilestones();
  }
  return false;
}

function onBoost(): boolean {
  state.continuousValue = Math.min(1.0, state.continuousValue + 0.18);
  return checkMilestones();
}

function onPrecisionClear(): boolean {
  state.continuousValue = Math.min(1.0, state.continuousValue + 0.12);
  return checkMilestones();
}

function onScan(): boolean {
  state.continuousValue = Math.min(1.0, state.continuousValue + 0.15);
  return checkMilestones();
}

function onCollision(): boolean {
  const penalty = 0.15;
  state.continuousValue = Math.max(state.committedFloor, state.continuousValue - penalty);
  return false;
}

function advanceSearchlight(): boolean {
  if (!state.searchlight) {
    state.continuousValue = Math.max(state.continuousValue, SEARCHLIGHT_THRESHOLD);
    checkMilestones();
    return true;
  }
  return false;
}

function advanceThruster(): boolean {
  if (!state.thruster) {
    state.continuousValue = Math.max(state.continuousValue, THRUSTER_THRESHOLD);
    checkMilestones();
    return true;
  }
  return false;
}

function advanceCutter(): boolean {
  if (!state.cutter) {
    state.continuousValue = Math.max(state.continuousValue, CUTTER_THRESHOLD);
    checkMilestones();
    return true;
  }
  return false;
}

export interface ReadinessApi {
  readonly getSnapshot: () => ReadinessSnapshot;
  readonly start: () => void;
  readonly reset: () => void;
  readonly step: (deltaMs: number, isPiloting: boolean, inCurrent: boolean) => boolean;
  readonly addProgress: (amount: number) => boolean;
  readonly onBoost: () => boolean;
  readonly onPrecisionClear: () => boolean;
  readonly onScan: () => boolean;
  readonly onCollision: () => boolean;
  readonly advanceSearchlight: () => boolean;
  readonly advanceThruster: () => boolean;
  readonly advanceCutter: () => boolean;
}

export const RescueReadiness: ReadinessApi = freeze({
  getSnapshot,
  start,
  reset,
  step,
  addProgress,
  onBoost,
  onPrecisionClear,
  onScan,
  onCollision,
  advanceSearchlight,
  advanceThruster,
  advanceCutter,
});
