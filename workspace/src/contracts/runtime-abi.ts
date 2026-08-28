/**
 * Shared runtime ABI boundary types for Ocean Rescue.
 * This module is type-only and emits no runtime JavaScript.
 */
import type { TravelApi, TravelSnapshot } from "../travel/travel";
import type { ReadinessApi, ReadinessSnapshot } from "../travel/readiness";
import type { MissionData, GupData, UserStats } from "../types";

export type {
  TravelApi,
  TravelSnapshot,
  ReadinessApi,
  ReadinessSnapshot,
  MissionData,
  GupData,
  UserStats,
};

export type MissionId = string;
export type GupId = string;

export interface MissionProgressionSnapshot {
  readonly selectedMissionId: MissionId | null;
  readonly unlockedMissionIds: readonly MissionId[];
  readonly completedMissionIds: readonly MissionId[];
}

export interface MissionCompletionResult {
  readonly changed: boolean;
  readonly newlyUnlockedMissionId: MissionId | null;
}

export interface OceanRescueNamespace {
  Travel?: TravelApi;
  RescueReadiness?: ReadinessApi;
}
