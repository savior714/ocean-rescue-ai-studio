import * as THREE from "three";
import { CelestialBodyData } from "./space-types";
import { PLANETS_DATA, SUN_DATA, MOON_DATA } from "./space-data";
import { SpaceSimulationEngine } from "./space-simulation";
import { TextureGenerator } from "./texture-generator";

export interface PlanetMeshBundle {
  data: CelestialBodyData;
  mesh: THREE.Mesh;
  cloudsMesh?: THREE.Mesh;
  ringsMesh?: THREE.Mesh;
  hitTarget: THREE.Mesh; // Invisible larger sphere for easy touch/tap
  orbitLine: THREE.Line;
}

export interface ScreenLabelPosition {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  distanceToCamera: number;
  isFocused: boolean;
}

export class SpaceRenderer {
  private canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Lighting
  private sunPointLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;

  // Meshes
  public sunMesh!: THREE.Mesh;
  public sunCorona!: THREE.Sprite;
  public planetBundles: Map<string, PlanetMeshBundle> = new Map();
  public moonMesh!: THREE.Mesh;
  public moonHitTarget!: THREE.Mesh;
  public starsParticles!: THREE.Points;
  public asteroidBelt!: THREE.Points;
  public moonOrbitLine!: THREE.Line;

  // Visual settings
  public showOrbits: boolean = true;

  // Camera State & Orbit Controls
  public cameraMode: "overview" | "fly-to" | "focused" = "overview";
  public focusedBodyId: string | null = null;
  public subFocus: "planet" | "moon" | "rings" | null = null;

  // Camera Orbit Angles & Zoom
  public currentTargetPos = new THREE.Vector3(0, 0, 0);
  public desiredTargetPos = new THREE.Vector3(0, 0, 0);

  // Spherical camera coordinates relative to target
  public currentAzimuth = 0.4;
  public desiredAzimuth = 0.4;
  public currentElevation = 0.55; // Radians (~31 deg)
  public desiredElevation = 0.55;
  public currentDistance = 580;
  public desiredDistance = 580;

  // Overview defaults
  public readonly OVERVIEW_DISTANCE = 580;
  public readonly OVERVIEW_ELEVATION = 0.55;

  // Raycaster for click/tap
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  // Pointer drag tracking
  private isPointerDown = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private pointerDownTime = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pinchStartDist = 0;

  // Callbacks
  public onPlanetSelected?: (id: string | null) => void;
  public onSelectSoundRequested?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030814);

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3500);
    this.camera.position.set(0, 280, 500);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.setupLighting();
    this.setupBackgroundStarfield();
    this.setupAsteroidBelt();
    this.setupSun();
    this.setupPlanets();
    this.setupMoon();
    this.setupInputListeners();
  }

  private setupLighting() {
    // Soft cosmic ambient light so night sides of planets maintain smooth, soft contours
    this.ambientLight = new THREE.AmbientLight(0x334466, 0.7);
    this.scene.add(this.ambientLight);

    // Warm radial Sun light with decay=0 for consistent, flicker-free astronomical illumination
    this.sunPointLight = new THREE.PointLight(0xfff7ed, 3.2, 4000, 0);
    this.sunPointLight.position.set(0, 0, 0);
    this.scene.add(this.sunPointLight);

    // Soft celestial hemisphere fill for smooth terminator gradients
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.25);
    this.scene.add(hemiLight);
  }

  private setupBackgroundStarfield() {
    // 3500 bright stars in spherical space
    const count = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xaaccff),
      new THREE.Color(0xffeedd),
      new THREE.Color(0xffd79e),
      new THREE.Color(0x99ddff)
    ];

    for (let i = 0; i < count; i++) {
      const radius = 1200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = starPalette[Math.floor(Math.random() * starPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starsParticles = new THREE.Points(geometry, material);
    this.scene.add(this.starsParticles);
  }

  private setupAsteroidBelt() {
    // Subtle asteroid dust ring between Mars (122) and Jupiter (175)
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 142 + (Math.random() - 0.5) * 22;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const shade = 0.5 + Math.random() * 0.4;
      colors[i * 3] = shade * 0.8;
      colors[i * 3 + 1] = shade * 0.75;
      colors[i * 3 + 2] = shade * 0.7;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.45
    });

    this.asteroidBelt = new THREE.Points(geometry, material);
    this.scene.add(this.asteroidBelt);
  }

  private setupSun() {
    const sunGeo = new THREE.SphereGeometry(SUN_DATA.visualRadius, 48, 48);
    const sunTex = TextureGenerator.createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: 0xffffff
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.name = "sun";
    this.scene.add(this.sunMesh);

    // Glowing Corona Billboard Sprite
    const coronaCanvas = document.createElement("canvas");
    coronaCanvas.width = 256;
    coronaCanvas.height = 256;
    const ctx = coronaCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, "rgba(255, 230, 120, 0.9)");
    grad.addColorStop(0.3, "rgba(255, 150, 40, 0.5)");
    grad.addColorStop(0.6, "rgba(255, 80, 0, 0.2)");
    grad.addColorStop(1, "rgba(255, 40, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const coronaTex = new THREE.CanvasTexture(coronaCanvas);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      color: 0xffe066,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunCorona = new THREE.Sprite(coronaMat);
    this.sunCorona.scale.set(SUN_DATA.visualRadius * 4.2, SUN_DATA.visualRadius * 4.2, 1);
    this.scene.add(this.sunCorona);
  }

  private setupPlanets() {
    const simEngine = new SpaceSimulationEngine();

    for (const planet of PLANETS_DATA) {
      // 1. Orbital Path Line (rendered beneath planets with renderOrder=0 and depthWrite=false)
      const orbitPoints = simEngine.generateOrbitPathPoints(planet);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(planet.baseColor).lerp(new THREE.Color(0x38bdf8), 0.35),
        transparent: true,
        opacity: 0.28,
        depthTest: true,
        depthWrite: false
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.renderOrder = 0;
      this.scene.add(orbitLine);

      // 2. Planet Sphere Mesh (rendered with renderOrder=10 and full depth write so it cleanly covers orbit lines)
      let texture: THREE.CanvasTexture;
      switch (planet.id) {
        case "mercury": texture = TextureGenerator.createMercuryTexture(); break;
        case "venus": texture = TextureGenerator.createVenusTexture(); break;
        case "earth": texture = TextureGenerator.createEarthTexture(); break;
        case "mars": texture = TextureGenerator.createMarsTexture(); break;
        case "jupiter": texture = TextureGenerator.createJupiterTexture(); break;
        case "saturn": texture = TextureGenerator.createSaturnTexture(); break;
        case "uranus": texture = TextureGenerator.createUranusTexture(); break;
        case "neptune": texture = TextureGenerator.createNeptuneTexture(); break;
        default: texture = TextureGenerator.createMercuryTexture();
      }

      const sphereGeo = new THREE.SphereGeometry(planet.visualRadius, 64, 64);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.0,
        bumpScale: 0.0,
        depthTest: true,
        depthWrite: true
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.name = planet.id;
      mesh.rotation.z = (planet.axialTiltDeg * Math.PI) / 180;
      mesh.renderOrder = 10;
      this.scene.add(mesh);

      // 3. Atmosphere / Cloud Layers (Earth)
      let cloudsMesh: THREE.Mesh | undefined;
      if (planet.id === "earth") {
        const cloudGeo = new THREE.SphereGeometry(planet.visualRadius * 1.028, 64, 64);
        const cloudTex = TextureGenerator.createEarthCloudsTexture();
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.82,
          roughness: 0.95,
          metalness: 0.0,
          blending: THREE.NormalBlending,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
        cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
        cloudsMesh.renderOrder = 11;
        mesh.add(cloudsMesh);
      }

      // 4. Rings (Saturn & Uranus)
      let ringsMesh: THREE.Mesh | undefined;
      if (planet.id === "saturn" && planet.ringInnerRadius && planet.ringOuterRadius) {
        const ringGeo = new THREE.RingGeometry(planet.ringInnerRadius, planet.ringOuterRadius, 96);
        // Fix UV mapping for concentric texture
        const pos = ringGeo.attributes.position;
        const uvs = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const dist = Math.sqrt(x * x + y * y);
          const u = (dist - planet.ringInnerRadius) / (planet.ringOuterRadius - planet.ringInnerRadius);
          uvs.setXY(i, u, 0.5);
        }
        uvs.needsUpdate = true;

        const ringTex = TextureGenerator.createSaturnRingsTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.85,
          metalness: 0.0,
          depthTest: true,
          depthWrite: false
        });
        ringsMesh = new THREE.Mesh(ringGeo, ringMat);
        ringsMesh.rotation.x = Math.PI / 2; // Lie flat along equatorial plane
        ringsMesh.renderOrder = 12;
        mesh.add(ringsMesh);
      } else if (planet.id === "uranus" && planet.ringInnerRadius && planet.ringOuterRadius) {
        const ringGeo = new THREE.RingGeometry(planet.ringInnerRadius, planet.ringOuterRadius, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x93e8ec,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
          depthTest: true,
          depthWrite: false
        });
        ringsMesh = new THREE.Mesh(ringGeo, ringMat);
        ringsMesh.rotation.x = Math.PI / 2;
        ringsMesh.renderOrder = 12;
        mesh.add(ringsMesh);
      }

      // 5. Invisible Hit Sphere for Easy Child Tapping (min 20 radius touch target)
      const hitRadius = Math.max(planet.visualRadius * 2.2, 14);
      const hitGeo = new THREE.SphereGeometry(hitRadius, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitTarget = new THREE.Mesh(hitGeo, hitMat);
      hitTarget.name = `hit_${planet.id}`;
      mesh.add(hitTarget);

      this.planetBundles.set(planet.id, {
        data: planet,
        mesh,
        cloudsMesh,
        ringsMesh,
        hitTarget,
        orbitLine
      });
    }
  }

  private setupMoon() {
    const moonGeo = new THREE.SphereGeometry(MOON_DATA.visualRadius, 48, 48);
    const moonTex = TextureGenerator.createMoonTexture();
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.85,
      metalness: 0.0,
      depthTest: true,
      depthWrite: true
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.name = "moon";
    this.moonMesh.renderOrder = 10;
    this.scene.add(this.moonMesh);

    // Faint lunar orbit path around Earth
    const moonOrbitGeo = new THREE.BufferGeometry();
    const moonPoints: THREE.Vector3[] = [];
    const moonDist = MOON_DATA.distanceFromEarthVisual;
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      moonPoints.push(new THREE.Vector3(Math.cos(angle) * moonDist, 0, Math.sin(angle) * moonDist));
    }
    moonOrbitGeo.setFromPoints(moonPoints);
    const moonOrbitMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.25,
      depthTest: true,
      depthWrite: false
    });
    this.moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    this.moonOrbitLine.renderOrder = 0;
    this.scene.add(this.moonOrbitLine);

    // Hit target
    const hitGeo = new THREE.SphereGeometry(8, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.moonHitTarget = new THREE.Mesh(hitGeo, hitMat);
    this.moonHitTarget.name = "hit_moon";
    this.moonMesh.add(this.moonHitTarget);
  }

  private setupInputListeners() {
    const el = this.canvas;

    // Pointer events for touch & mouse unification
    el.addEventListener("pointerdown", (e) => {
      this.isPointerDown = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
      this.pointerDownTime = performance.now();
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // Sensitivity adjusted for orbit view
      const rotSpeed = 0.0055;
      this.desiredAzimuth -= dx * rotSpeed;
      this.desiredElevation += dy * rotSpeed;

      // Clamp elevation so camera doesn't flip over poles
      this.desiredElevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.desiredElevation));
    });

    window.addEventListener("pointerup", (e) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      // Check if it was a quick tap/click without dragging
      const dist = Math.hypot(e.clientX - this.pointerDownX, e.clientY - this.pointerDownY);
      const elapsed = performance.now() - this.pointerDownTime;
      if (dist < 8 && elapsed < 350) {
        this.handleClickAt(e.clientX, e.clientY);
      }
    });

    // Wheel zoom
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
      this.applyZoom(zoomFactor);
    }, { passive: false });

    // Touch Pinch zoom support
    el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.pinchStartDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    el.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && this.pinchStartDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const ratio = this.pinchStartDist / currentDist;
        this.applyZoom(ratio > 1 ? 1.04 : 0.96);
        this.pinchStartDist = currentDist;
      }
    }, { passive: true });
  }

  private applyZoom(factor: number) {
    const minD = this.focusedBodyId ? 14 : 90;
    const maxD = this.focusedBodyId ? 160 : 950;
    this.desiredDistance = Math.max(minD, Math.min(maxD, this.desiredDistance * factor));
  }

  private handleClickAt(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    const hitObjects: THREE.Object3D[] = [];
    for (const bundle of this.planetBundles.values()) {
      hitObjects.push(bundle.hitTarget);
      hitObjects.push(bundle.mesh);
    }
    hitObjects.push(this.moonHitTarget);
    hitObjects.push(this.moonMesh);
    hitObjects.push(this.sunMesh);

    const intersects = this.raycaster.intersectObjects(hitObjects, false);

    if (intersects.length > 0) {
      let hitName = intersects[0].object.name;
      if (hitName.startsWith("hit_")) {
        hitName = hitName.replace("hit_", "");
      }
      this.focusOnBody(hitName);
      if (this.onSelectSoundRequested) this.onSelectSoundRequested();
    }
  }

  public focusOnBody(bodyId: string | null, subFocus: "planet" | "moon" | "rings" | null = null) {
    this.focusedBodyId = bodyId;
    this.subFocus = subFocus;

    if (!bodyId) {
      // Return to Overview
      this.cameraMode = "fly-to";
      this.desiredTargetPos.set(0, 0, 0);
      this.desiredDistance = this.OVERVIEW_DISTANCE;
      this.desiredElevation = this.OVERVIEW_ELEVATION;
    } else if (bodyId === "sun") {
      this.cameraMode = "fly-to";
      this.desiredTargetPos.set(0, 0, 0);
      this.desiredDistance = 65;
      this.desiredElevation = 0.35;
    } else if (bodyId === "moon") {
      this.cameraMode = "fly-to";
      this.desiredDistance = 14;
      this.desiredElevation = 0.3;
    } else {
      const bundle = this.planetBundles.get(bodyId);
      if (bundle) {
        this.cameraMode = "fly-to";
        const r = bundle.data.visualRadius;
        // Closer zoom for focused planet inspection
        if (bodyId === "saturn" && subFocus === "rings") {
          this.desiredDistance = r * 3.8;
          this.desiredElevation = 0.6; // High angle to see rings
        } else {
          this.desiredDistance = Math.max(r * 2.8, 22);
          this.desiredElevation = 0.3;
        }
      }
    }

    if (this.onPlanetSelected) {
      this.onPlanetSelected(bodyId);
    }
  }

  public update(deltaSec: number, sim: SpaceSimulationEngine) {
    // 1. Update Sun animation (slow rotation & corona pulse)
    if (this.sunMesh) {
      this.sunMesh.rotation.y += deltaSec * 0.05;
      const pulse = 1 + Math.sin(performance.now() * 0.001) * 0.02;
      this.sunCorona.scale.set(
        SUN_DATA.visualRadius * 4.2 * pulse,
        SUN_DATA.visualRadius * 4.2 * pulse,
        1
      );
    }

    // 2. Update Planets positions and self-rotations
    for (const [id, bundle] of this.planetBundles.entries()) {
      const bodyState = sim.getBodyState(id);
      if (bodyState) {
        bundle.mesh.position.copy(bodyState.position);
        bundle.mesh.rotation.y = bodyState.rotationY;

        // Smooth relative cloud atmospheric drift on Earth
        if (bundle.cloudsMesh) {
          bundle.cloudsMesh.rotation.y += deltaSec * 0.035;
        }
      }
    }

    // 3. Update Moon position & Lunar Orbit
    if (this.moonMesh && sim.moonState) {
      this.moonMesh.position.copy(sim.moonState.position);
      this.moonMesh.rotation.y = sim.moonState.rotationY;
    }

    if (this.moonOrbitLine) {
      const earthBundle = this.planetBundles.get("earth");
      if (earthBundle) {
        this.moonOrbitLine.position.copy(earthBundle.mesh.position);
      }
      const moonOrbitMat = this.moonOrbitLine.material as THREE.LineBasicMaterial;
      if (!this.showOrbits || (this.focusedBodyId && this.focusedBodyId !== "earth" && this.focusedBodyId !== "moon")) {
        moonOrbitMat.opacity += (0 - moonOrbitMat.opacity) * Math.min(1, deltaSec * 8);
        if (moonOrbitMat.opacity < 0.01) this.moonOrbitLine.visible = false;
      } else {
        this.moonOrbitLine.visible = true;
        const targetOp = (this.focusedBodyId === "earth" || this.focusedBodyId === "moon") ? 0.35 : 0.15;
        moonOrbitMat.opacity += (targetOp - moonOrbitMat.opacity) * Math.min(1, deltaSec * 8);
      }
    }

    // 4. Dynamic Planetary Orbit Lines Visibility & Opacity Management
    for (const [id, bundle] of this.planetBundles.entries()) {
      const orbitMat = bundle.orbitLine.material as THREE.LineBasicMaterial;
      if (!this.showOrbits) {
        orbitMat.opacity += (0 - orbitMat.opacity) * Math.min(1, deltaSec * 10);
        if (orbitMat.opacity < 0.01) bundle.orbitLine.visible = false;
      } else {
        bundle.orbitLine.visible = true;
        let targetOpacity = 0.28;
        if (this.focusedBodyId) {
          if (this.focusedBodyId === id) {
            // When inspecting this specific planet, fade its orbit line completely to 0
            targetOpacity = 0.0;
          } else {
            // Subtly dim other distant orbit lines during focused inspection
            targetOpacity = 0.08;
          }
        }
        orbitMat.opacity += (targetOpacity - orbitMat.opacity) * Math.min(1, deltaSec * 8);
        if (orbitMat.opacity < 0.01) {
          bundle.orbitLine.visible = false;
        }
      }
    }

    // 5. Update Camera Tracking & Smoothing
    if (this.focusedBodyId) {
      if (this.focusedBodyId === "sun") {
        this.desiredTargetPos.set(0, 0, 0);
      } else if (this.focusedBodyId === "moon") {
        this.desiredTargetPos.copy(this.moonMesh.position);
      } else {
        const bundle = this.planetBundles.get(this.focusedBodyId);
        if (bundle) {
          this.desiredTargetPos.copy(bundle.mesh.position);
        }
      }
    } else {
      this.desiredTargetPos.set(0, 0, 0);
    }

    // Smooth lerp camera target point
    const targetLerpFactor = this.focusedBodyId ? 0.15 : 0.08;
    this.currentTargetPos.lerp(this.desiredTargetPos, targetLerpFactor);

    // Smooth lerp spherical coordinates
    this.currentAzimuth += (this.desiredAzimuth - this.currentAzimuth) * 0.1;
    this.currentElevation += (this.desiredElevation - this.currentElevation) * 0.1;
    this.currentDistance += (this.desiredDistance - this.currentDistance) * 0.1;

    // Convert spherical coordinates (azimuth, elevation, distance) to 3D Cartesian offset
    const cosEl = Math.cos(this.currentElevation);
    const sinEl = Math.sin(this.currentElevation);
    const camOffsetX = this.currentDistance * cosEl * Math.sin(this.currentAzimuth);
    const camOffsetY = this.currentDistance * sinEl;
    const camOffsetZ = this.currentDistance * cosEl * Math.cos(this.currentAzimuth);

    this.camera.position.set(
      this.currentTargetPos.x + camOffsetX,
      this.currentTargetPos.y + camOffsetY,
      this.currentTargetPos.z + camOffsetZ
    );
    this.camera.lookAt(this.currentTargetPos);

    // 5. Render WebGL
    this.renderer.render(this.scene, this.camera);
  }

  public getScreenPositions(): ScreenLabelPosition[] {
    const labels: ScreenLabelPosition[] = [];
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const tempV = new THREE.Vector3();

    // Sun
    this.sunMesh.getWorldPosition(tempV);
    tempV.project(this.camera);
    if (tempV.z < 1) {
      labels.push({
        id: "sun",
        nameKo: "태양",
        nameEn: "Sun",
        icon: "☀️",
        screenX: ((tempV.x + 1) * width) / 2,
        screenY: ((-tempV.y + 1) * height) / 2,
        visible: this.focusedBodyId === null || this.focusedBodyId === "sun",
        distanceToCamera: this.camera.position.distanceTo(this.sunMesh.position),
        isFocused: this.focusedBodyId === "sun"
      });
    }

    // Planets
    for (const [id, bundle] of this.planetBundles.entries()) {
      bundle.mesh.getWorldPosition(tempV);
      tempV.project(this.camera);
      if (tempV.z < 1) {
        labels.push({
          id,
          nameKo: bundle.data.nameKo,
          nameEn: bundle.data.nameEn,
          icon: bundle.data.icon,
          screenX: ((tempV.x + 1) * width) / 2,
          screenY: ((-tempV.y + 1) * height) / 2,
          visible: true,
          distanceToCamera: this.camera.position.distanceTo(bundle.mesh.position),
          isFocused: this.focusedBodyId === id
        });
      }
    }

    // Moon (only show badge when close or Earth is focused)
    if (this.focusedBodyId === "earth" || this.focusedBodyId === "moon") {
      this.moonMesh.getWorldPosition(tempV);
      tempV.project(this.camera);
      if (tempV.z < 1) {
        labels.push({
          id: "moon",
          nameKo: "달",
          nameEn: "Moon",
          icon: "🌕",
          screenX: ((tempV.x + 1) * width) / 2,
          screenY: ((-tempV.y + 1) * height) / 2,
          visible: true,
          distanceToCamera: this.camera.position.distanceTo(this.moonMesh.position),
          isFocused: this.focusedBodyId === "moon"
        });
      }
    }

    return labels;
  }

  public handleResize() {
    const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public toggleOrbits(show?: boolean): boolean {
    this.showOrbits = show !== undefined ? show : !this.showOrbits;
    return this.showOrbits;
  }
}
