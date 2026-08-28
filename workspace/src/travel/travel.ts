/**
 * Typed canonical travel runtime contract for Ocean Rescue (WP-31C / Travel).
 *
 * This module is the strictly typed canonical implementation of the travel
 * runtime. It owns authoritative forward progression (distance) and 2D GUP
 * position within child-friendly stage bounds.
 *
 * The observable runtime contract provides:
 * - 2D stage bounds (`minX`, `maxX`, `minY`, `maxY`, `startX`, `startY`)
 * - Authoritative distance accumulation based on `AutoForwardSpeed` and
 *   environmental/speed multipliers (0..3.5)
 * - Direct finger/pointer tracking in both X and Y axes
 * - Deterministic snapshots consumed by rendering and controllers
 */

import type { OceanRescueNamespace } from "../contracts/runtime-abi";

export interface TravelBounds {
  readonly minY: number;
  readonly maxY: number;
  readonly startY: number;
  readonly minX: number;
  readonly maxX: number;
  readonly startX: number;
}

export interface TravelSnapshot {
  readonly active: boolean;
  readonly distance: number;
  readonly x: number;
  readonly y: number;
  readonly tapTargetY: number | null;
  readonly dragging: boolean;
  readonly pointerId: number | null;
}

export interface TravelApi {
  readonly Bounds: TravelBounds;
  readonly AutoForwardSpeed: number;
  readonly TapSpeed: number;
  readonly getSnapshot: () => TravelSnapshot;
  readonly start: () => boolean;
  readonly stop: () => boolean;
  readonly step: (deltaMs: unknown, forwardSpeedMultiplier?: unknown) => boolean;
  readonly beginDrag: (pointerId: unknown, stageY: unknown, stageX?: unknown) => boolean;
  readonly moveDrag: (pointerId: unknown, stageY: unknown, stageX?: unknown) => boolean;
  readonly endDrag: (pointerId: unknown) => boolean;
  readonly tapTo: (stageY: unknown, stageX?: unknown) => boolean;
}

function freeze<T>(value: T): Readonly<T> {
  return Object.freeze(value);
}

export const Bounds: TravelBounds = freeze({
  minY: 120,
  maxY: 600,
  startY: 360,
  minX: 160,
  maxX: 460,
  startX: 260,
});

const AutoForwardSpeed = 100;
const TapSpeed = 450;

interface MutableTravelState {
  active: boolean;
  distance: number;
  x: number;
  y: number;
  tapTargetY: number | null;
  tapTargetX: number | null;
  dragging: boolean;
  pointerId: number | null;
}

const state: MutableTravelState = {
  active: false,
  distance: 0,
  x: Bounds.startX,
  y: Bounds.startY,
  tapTargetY: null,
  tapTargetX: null,
  dragging: false,
  pointerId: null,
};

let dragPointerId: number | null = null;
let dragPrevStageY = 0;
let dragPrevStageX = 0;

function clampY(value: number): number {
  if (value < Bounds.minY) {
    return Bounds.minY;
  }
  if (value > Bounds.maxY) {
    return Bounds.maxY;
  }
  return value;
}

function clampX(value: number): number {
  if (value < Bounds.minX) {
    return Bounds.minX;
  }
  if (value > Bounds.maxX) {
    return Bounds.maxX;
  }
  return value;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value);
}

function getSnapshot(): TravelSnapshot {
  return freeze({
    active: state.active,
    distance: state.distance,
    x: state.x,
    y: state.y,
    tapTargetY: state.tapTargetY,
    dragging: state.dragging,
    pointerId: state.pointerId,
  });
}

function start(): boolean {
  state.active = true;
  state.distance = 0;
  state.x = Bounds.startX;
  state.y = Bounds.startY;
  state.tapTargetY = null;
  state.tapTargetX = null;
  state.dragging = false;
  state.pointerId = null;
  dragPointerId = null;
  dragPrevStageY = 0;
  dragPrevStageX = 0;
  return true;
}

function stop(): boolean {
  if (!state.active) {
    return false;
  }
  state.active = false;
  state.tapTargetY = null;
  state.tapTargetX = null;
  state.dragging = false;
  state.pointerId = null;
  dragPointerId = null;
  return true;
}

function step(deltaMs: unknown, forwardSpeedMultiplier?: unknown): boolean {
  if (!state.active) {
    return false;
  }
  if (!isFiniteNumber(deltaMs) || deltaMs <= 0) {
    return false;
  }
  let multiplier = 1;
  if (forwardSpeedMultiplier !== undefined) {
    if (!isFiniteNumber(forwardSpeedMultiplier)) {
      return false;
    }
    if (forwardSpeedMultiplier < 0 || forwardSpeedMultiplier > 3.5) {
      return false;
    }
    multiplier = forwardSpeedMultiplier;
  }
  let applied = deltaMs;
  if (applied > 50) {
    applied = 50;
  }
  state.distance += AutoForwardSpeed * multiplier * (applied / 1000);

  if (state.tapTargetY !== null) {
    const target = state.tapTargetY;
    const movement = TapSpeed * (applied / 1000);
    if (state.y < target) {
      state.y += movement;
      if (state.y >= target) {
        state.y = target;
        state.tapTargetY = null;
      }
    } else if (state.y > target) {
      state.y -= movement;
      if (state.y <= target) {
        state.y = target;
        state.tapTargetY = null;
      }
    } else {
      state.tapTargetY = null;
    }
  }

  if (state.tapTargetX !== null) {
    const target = state.tapTargetX;
    const movement = TapSpeed * (applied / 1000);
    if (state.x < target) {
      state.x += movement;
      if (state.x >= target) {
        state.x = target;
        state.tapTargetX = null;
      }
    } else if (state.x > target) {
      state.x -= movement;
      if (state.x <= target) {
        state.x = target;
        state.tapTargetX = null;
      }
    } else {
      state.tapTargetX = null;
    }
  }

  return true;
}

function beginDrag(pointerId: unknown, stageY: unknown, stageX?: unknown): boolean {
  if (!state.active) {
    return false;
  }
  if (!isFiniteNumber(pointerId)) {
    return false;
  }
  if (!isFiniteNumber(stageY)) {
    return false;
  }
  if (state.dragging || dragPointerId !== null) {
    return false;
  }
  state.tapTargetY = null;
  state.tapTargetX = null;
  dragPointerId = pointerId;
  dragPrevStageY = clampY(stageY);
  if (isFiniteNumber(stageX)) {
    dragPrevStageX = clampX(stageX);
  } else {
    dragPrevStageX = state.x;
  }
  state.dragging = true;
  state.pointerId = pointerId;
  return true;
}

function moveDrag(pointerId: unknown, stageY: unknown, stageX?: unknown): boolean {
  if (!state.active) {
    return false;
  }
  if (pointerId !== dragPointerId) {
    return false;
  }
  if (!isFiniteNumber(stageY)) {
    return false;
  }
  state.y = clampY(state.y + (stageY - dragPrevStageY));
  dragPrevStageY = stageY;

  if (isFiniteNumber(stageX)) {
    state.x = clampX(state.x + (stageX - dragPrevStageX));
    dragPrevStageX = stageX;
  }
  return true;
}

function endDrag(pointerId: unknown): boolean {
  if (pointerId !== dragPointerId) {
    return false;
  }
  if (!state.dragging) {
    return false;
  }
  state.dragging = false;
  state.pointerId = null;
  dragPointerId = null;
  return true;
}

function tapTo(stageY: unknown, stageX?: unknown): boolean {
  if (!state.active) {
    return false;
  }
  if (!isFiniteNumber(stageY)) {
    return false;
  }
  state.dragging = false;
  state.pointerId = null;
  dragPointerId = null;
  const targetY = clampY(stageY);
  if (Math.abs(targetY - state.y) < 1) {
    state.tapTargetY = null;
  } else {
    state.tapTargetY = targetY;
  }

  if (isFiniteNumber(stageX)) {
    const targetX = clampX(stageX);
    if (Math.abs(targetX - state.x) < 1) {
      state.tapTargetX = null;
    } else {
      state.tapTargetX = targetX;
    }
  }
  return true;
}

const Travel: TravelApi = freeze({
  Bounds: Bounds,
  AutoForwardSpeed: AutoForwardSpeed,
  TapSpeed: TapSpeed,
  getSnapshot: getSnapshot,
  start: start,
  stop: stop,
  step: step,
  beginDrag: beginDrag,
  moveDrag: moveDrag,
  endDrag: endDrag,
  tapTo: tapTo,
});

const win = window as Window & { OceanRescue?: OceanRescueNamespace };
const root = win.OceanRescue || {};
win.OceanRescue = root;
root.Travel = Travel;

export { Travel as OceanRescueTravel };
export { Travel };
