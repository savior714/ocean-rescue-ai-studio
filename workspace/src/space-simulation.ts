import * as THREE from "three";
import { CelestialBodyData } from "./space-types";
import { PLANETS_DATA, SUN_DATA, MOON_DATA } from "./space-data";

export interface BodySimulationState {
  id: string;
  position: THREE.Vector3;
  rotationY: number;
  orbitalAngleRad: number;
}

export class SpaceSimulationEngine {
  public timeDays: number = 0;
  public timeSpeedDaysPerSec: number = 7; // Default 7 days/sec
  public isPaused: boolean = false;
  public epochDate: Date = new Date("2026-08-28T00:00:00Z");

  private planetStates: Map<string, BodySimulationState> = new Map();
  public moonState: BodySimulationState = {
    id: "moon",
    position: new THREE.Vector3(),
    rotationY: 0,
    orbitalAngleRad: 0
  };

  constructor() {
    this.initStates();
  }

  private initStates() {
    // Initial starting mean anomalies at epoch (giving varied, beautiful spatial distribution across the solar system)
    const initialAnglesDeg: Record<string, number> = {
      mercury: 45,
      venus: 130,
      earth: 210,
      mars: 320,
      jupiter: 85,
      saturn: 190,
      uranus: 290,
      neptune: 15
    };

    for (const planet of PLANETS_DATA) {
      const initRad = ((initialAnglesDeg[planet.id] ?? 0) * Math.PI) / 180;
      this.planetStates.set(planet.id, {
        id: planet.id,
        position: new THREE.Vector3(),
        rotationY: 0,
        orbitalAngleRad: initRad
      });
    }

    this.updatePositions();
  }

  public update(deltaSeconds: number) {
    if (!this.isPaused && this.timeSpeedDaysPerSec !== 0) {
      this.timeDays += deltaSeconds * this.timeSpeedDaysPerSec;
    }
    this.updatePositions(deltaSeconds);
  }

  public setTimeDays(days: number) {
    this.timeDays = days;
    this.updatePositions(0);
  }

  public addDays(days: number) {
    this.timeDays += days;
    this.updatePositions(0);
  }

  public getSimulationDateString(): string {
    const simTime = this.epochDate.getTime() + this.timeDays * 86400 * 1000;
    const d = new Date(simTime);
    const y = d.getUTCFullYear();
    const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = d.getUTCDate().toString().padStart(2, "0");
    return `${y}년 ${m}월 ${day}일`;
  }

  public getBodyState(id: string): BodySimulationState | undefined {
    if (id === "moon") return this.moonState;
    return this.planetStates.get(id);
  }

  private updatePositions(deltaSeconds: number = 0) {
    // Dynamic visual spin multiplier bounded to human eye perception limit (avoids 60Hz stroboscopic aliasing)
    let spinSpeedFactor = 1.0;
    if (this.isPaused) {
      spinSpeedFactor = 0;
    } else if (this.timeSpeedDaysPerSec > 0) {
      // Sublinear scale so high astronomical speeds look lively without flashing or strobing
      spinSpeedFactor = Math.min(2.2, 0.6 + Math.pow(this.timeSpeedDaysPerSec, 0.3) * 0.45);
    }

    for (const planet of PLANETS_DATA) {
      const state = this.planetStates.get(planet.id);
      if (!state) continue;

      // 1. Keplerian mean orbital motion (Kepler's 3rd Law & Elliptical Orbits)
      const angularSpeed = (2 * Math.PI) / planet.orbitalPeriodDays;
      const currentAngle = state.orbitalAngleRad + angularSpeed * this.timeDays;

      // Elliptical distance modification using eccentricity
      const semiMajor = planet.visualDistance;
      const r = semiMajor * (1 - planet.eccentricity * Math.cos(currentAngle));
      const incRad = (planet.inclinationDeg * Math.PI) / 180;

      // 3D position (X: horizontal, Z: depth, Y: vertical inclination)
      const x = Math.cos(currentAngle) * r;
      const z = Math.sin(currentAngle) * r;
      const y = Math.sin(currentAngle) * r * Math.sin(incRad);

      state.position.set(x, y, z);

      // 2. Smooth, non-strobing axial self-rotation
      // Keeps relative physical rotation rates (Jupiter fast, Venus retrograde slow)
      // while preventing Nyquist rate aliasing / wagon-wheel strobing at high day multipliers
      if (deltaSeconds > 0 && spinSpeedFactor > 0) {
        const periodHours = planet.rotationPeriodHours;
        const isRetrograde = periodHours < 0;
        const absHours = Math.abs(periodHours);
        
        // Base rate in radians per second (Earth 24h = ~0.22 rad/s)
        const relativeRatio = Math.min(2.5, 24 / Math.max(8, absHours));
        const direction = isRetrograde ? -1 : 1;
        const visualAngularVelocity = direction * relativeRatio * 0.22 * spinSpeedFactor;

        state.rotationY = (state.rotationY + visualAngularVelocity * deltaSeconds) % (Math.PI * 2);
      }
    }

    // Moon position relative to Earth
    const earthState = this.planetStates.get("earth");
    if (earthState) {
      const moonAngularSpeed = (2 * Math.PI) / MOON_DATA.orbitalPeriodDays;
      const moonAngle = this.moonState.orbitalAngleRad + moonAngularSpeed * this.timeDays;
      const moonDist = MOON_DATA.distanceFromEarthVisual;

      const mx = earthState.position.x + Math.cos(moonAngle) * moonDist;
      const mz = earthState.position.z + Math.sin(moonAngle) * moonDist;
      const my = earthState.position.y + Math.sin(moonAngle * 2) * 1.5; // Slight orbital inclination

      this.moonState.position.set(mx, my, mz);
      
      // Tidal lock rotation matches orbital phase angle smoothly
      if (deltaSeconds > 0 && spinSpeedFactor > 0) {
        this.moonState.rotationY = (this.moonState.rotationY + 0.18 * spinSpeedFactor * deltaSeconds) % (Math.PI * 2);
      }
    }
  }

  /**
   * Generates discrete 3D points for drawing smooth orbital trail paths.
   */
  public generateOrbitPathPoints(planet: CelestialBodyData, segments: number = 128): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const incRad = (planet.inclinationDeg * Math.PI) / 180;
    const semiMajor = planet.visualDistance;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const r = semiMajor * (1 - planet.eccentricity * Math.cos(theta));
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = Math.sin(theta) * r * Math.sin(incRad);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }
}
