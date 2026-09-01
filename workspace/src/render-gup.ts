export interface GupRenderOptions {
  gupId: string;
  color: string;
  accentColor: string;
  subX?: number;
  subY?: number;
  subPitch?: number;
  currentSpeed?: number;
  isBoosting?: boolean;
  boostTimer?: number;
  collisionWobble?: number;
  readinessMilestones?: {
    searchlight: boolean;
    thruster: boolean;
    cutter: boolean;
  };
  companionAvatar?: string;
  scale?: number;
  isDocked?: boolean;
  armExtended?: boolean;
  armTargetX?: number;
  armTargetY?: number;
  time?: number;
}

/**
 * Living Actor Procedural Rendering Engine for Ocean Rescue Submarines (GUPs).
 * Renders smooth hydrodynamic hulls, glossy glass canopies, cockpit crew,
 * ducted spinning propellers, wake bubble plumes, and visible rescue equipment states.
 */
export function renderGupSubmarine(ctx: CanvasRenderingContext2D, options: GupRenderOptions) {
  const {
    gupId = "gup-a",
    color = "#ffc107",
    accentColor = "#ff9800",
    subPitch = 0,
    currentSpeed = 120,
    isBoosting = false,
    boostTimer = 0,
    collisionWobble = 0,
    readinessMilestones = { searchlight: false, thruster: false, cutter: false },
    companionAvatar = "🐧",
    scale = 1.0,
    isDocked = false,
    armExtended = false,
    armTargetX = 200,
    armTargetY = 0,
    time = performance.now()
  } = options;

  ctx.save();
  ctx.scale(scale, scale);

  // Collision vibration wobble
  if (collisionWobble > 0) {
    const wobbleAngle = Math.sin(time * 0.05) * collisionWobble * 0.15;
    ctx.rotate(wobbleAngle);
  }

  if (!isDocked) {
    ctx.rotate(subPitch);
  }

  const t = time * 0.003;
  const propRotation = (time * (isBoosting ? 0.05 : 0.018 * (1 + currentSpeed / 120))) % (Math.PI * 2);

  // 1. JET / TURBO EXHAUST PLUME (Behind Thruster)
  if (isBoosting || boostTimer > 0) {
    ctx.save();
    const flameLength = 70 + Math.sin(time * 0.08) * 15;
    const flameWidth = 16 + Math.cos(time * 0.06) * 4;

    // Outer plasma flame
    const outerFlame = ctx.createLinearGradient(-48, 0, -48 - flameLength, 0);
    outerFlame.addColorStop(0, "rgba(255, 152, 0, 0.95)");
    outerFlame.addColorStop(0.5, "rgba(255, 87, 34, 0.8)");
    outerFlame.addColorStop(1, "rgba(255, 235, 59, 0)");

    ctx.fillStyle = outerFlame;
    ctx.shadowColor = "#ff5722";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(-48, -flameWidth);
    ctx.quadraticCurveTo(-48 - flameLength * 0.6, -flameWidth * 1.3, -48 - flameLength, 0);
    ctx.quadraticCurveTo(-48 - flameLength * 0.6, flameWidth * 1.3, -48, flameWidth);
    ctx.closePath();
    ctx.fill();

    // Inner core shock flame (electric blue/white)
    const innerFlame = ctx.createLinearGradient(-48, 0, -48 - flameLength * 0.6, 0);
    innerFlame.addColorStop(0, "#ffffff");
    innerFlame.addColorStop(0.4, "#00e5ff");
    innerFlame.addColorStop(1, "rgba(0, 229, 255, 0)");

    ctx.fillStyle = innerFlame;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-48, -flameWidth * 0.45);
    ctx.lineTo(-48 - flameLength * 0.6, 0);
    ctx.lineTo(-48, flameWidth * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (readinessMilestones.thruster) {
    // Auxiliary thruster ready glow
    ctx.save();
    ctx.fillStyle = "rgba(0, 229, 255, 0.35)";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(-52, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. REAR PROPULSION / THRUSTER NOZZLE & DUCT
  ctx.save();
  // Thruster Pylon Mount
  ctx.fillStyle = "#263238";
  ctx.beginPath();
  ctx.roundRect(-46, -10, 14, 20, 4);
  ctx.fill();

  // Cylindrical Thruster Housing
  const thrusterGrad = ctx.createLinearGradient(-54, -14, -54, 14);
  thrusterGrad.addColorStop(0, "#455a64");
  thrusterGrad.addColorStop(0.5, "#90a4ae");
  thrusterGrad.addColorStop(1, "#263238");
  ctx.fillStyle = thrusterGrad;
  ctx.strokeStyle = "#1e272c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-56, -13, 16, 26, 6);
  ctx.fill();
  ctx.stroke();

  // Metal Rim Ring
  ctx.fillStyle = "#b0bec5";
  ctx.beginPath();
  ctx.roundRect(-58, -14, 4, 28, 2);
  ctx.fill();

  // Spinning Propeller Blades inside duct
  ctx.save();
  ctx.translate(-58, 0);
  ctx.scale(0.35, 1.0);
  ctx.rotate(propRotation);
  ctx.fillStyle = "#cfd8dc";
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 0, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // 3. MAIN HULL GEOMETRY (Multi-Stage Gradient & 3D Shading)
  ctx.save();
  ctx.shadowColor = "rgba(0, 10, 30, 0.45)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Main hull shape
  const hullGrad = ctx.createLinearGradient(0, -32, 0, 32);
  hullGrad.addColorStop(0, adjustColorBrightness(color, 45)); // Top sun reflection highlight
  hullGrad.addColorStop(0.35, color);
  hullGrad.addColorStop(0.8, adjustColorBrightness(color, -25));
  hullGrad.addColorStop(1, adjustColorBrightness(color, -55)); // Bottom shadow

  ctx.fillStyle = hullGrad;
  ctx.strokeStyle = adjustColorBrightness(color, -60);
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Streamlined Pod Hull with bulbous nose and tapered stern
  ctx.moveTo(48, 0);
  ctx.bezierCurveTo(48, -26, 24, -33, -15, -31);
  ctx.bezierCurveTo(-38, -29, -46, -18, -48, 0);
  ctx.bezierCurveTo(-46, 18, -38, 29, -15, 31);
  ctx.bezierCurveTo(24, 33, 48, 26, 48, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. LOWER KEEL ACCENT BELLY / STRIPE
  ctx.save();
  const bellyGrad = ctx.createLinearGradient(0, 6, 0, 32);
  bellyGrad.addColorStop(0, accentColor);
  bellyGrad.addColorStop(1, adjustColorBrightness(accentColor, -35));

  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.moveTo(42, 6);
  ctx.bezierCurveTo(36, 22, 14, 31, -15, 30);
  ctx.bezierCurveTo(-36, 28, -44, 18, -46, 6);
  ctx.bezierCurveTo(-20, 16, 20, 16, 42, 6);
  ctx.closePath();
  ctx.fill();

  // Upper accent streamline pinstripe
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-35, -12);
  ctx.bezierCurveTo(-10, -18, 15, -16, 38, -6);
  ctx.stroke();
  ctx.restore();

  // 5. GUP-SPECIFIC SIGNATURE MODELING DETAILS
  if (gupId === "gup-a") {
    // === GUP-A: Anglerfish Stalk Lure & Yellow Tail Fins ===
    ctx.save();
    // Angler Antenna Stalk
    ctx.strokeStyle = "#ffb300";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(28, -28);
    ctx.bezierCurveTo(38, -45, 52, -42, 54, -28);
    ctx.stroke();

    // Bioluminescent Lure Bulb (Soft pulse)
    const lureGlow = 0.75 + Math.sin(t * 5) * 0.25;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 18 * lureGlow;
    ctx.beginPath();
    ctx.arc(54, -28, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright bulb
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(54, -28, 4, 0, Math.PI * 2);
    ctx.fill();

    // Dorsal Fin
    ctx.fillStyle = "#ffa000";
    ctx.beginPath();
    ctx.moveTo(-10, -31);
    ctx.lineTo(-24, -42);
    ctx.lineTo(-32, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (gupId === "gup-b") {
    // === GUP-B: Shark Mouth Graphic & High Dorsal Fin ===
    ctx.save();
    // High Sharp Dorsal Fin
    ctx.fillStyle = "#d84315";
    ctx.beginPath();
    ctx.moveTo(-6, -31);
    ctx.quadraticCurveTo(-14, -48, -24, -48);
    ctx.lineTo(-28, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shark Teeth Decal on Bow
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(28, 2);
    ctx.lineTo(34, -4);
    ctx.lineTo(40, 2);
    ctx.lineTo(46, -3);
    ctx.lineTo(47, 4);
    ctx.lineTo(42, 8);
    ctx.lineTo(36, 3);
    ctx.lineTo(30, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (gupId === "gup-c") {
    // === GUP-C: Whale Shark Snout & Heavy Crane Gantry ===
    ctx.save();
    // Heavy Overhead Crane Frame
    ctx.strokeStyle = "#1565c0";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-20, -31);
    ctx.lineTo(-12, -45);
    ctx.lineTo(12, -45);
    ctx.lineTo(18, -30);
    ctx.stroke();

    // Crane Pulley Hook
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(0, -45, 4, 0, Math.PI * 2);
    ctx.fill();

    // Filter Gills on side
    ctx.strokeStyle = "#0d47a1";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(18 + i * 6, -10);
      ctx.lineTo(14 + i * 6, 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. DIVE PLANE / STABILIZER FINS
  ctx.save();
  const finAngle = Math.sin(t * 3) * 0.08 - subPitch * 0.5;
  ctx.translate(2, 10);
  ctx.rotate(finAngle);
  ctx.fillStyle = adjustColorBrightness(color, -20);
  ctx.strokeStyle = "#263238";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-14, 18);
  ctx.lineTo(6, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 7. COCKPIT BUBBLE CANOPY (Glossy Glass & Interior Pilot)
  ctx.save();
  const canopyX = 14;
  const canopyY = -7;
  const canopyRadius = 17;

  // Canopy Interior Background (Cockpit cabin)
  ctx.fillStyle = "#004d66";
  ctx.beginPath();
  ctx.arc(canopyX, canopyY, canopyRadius, 0, Math.PI * 2);
  ctx.fill();

  // Animated Dashboard Console Lights
  ctx.fillStyle = (Math.sin(t * 8) > 0) ? "#00e676" : "#00b0ff";
  ctx.fillRect(canopyX - 8, canopyY + 8, 4, 3);
  ctx.fillStyle = (Math.cos(t * 7) > 0) ? "#ffea00" : "#ff1744";
  ctx.fillRect(canopyX - 2, canopyY + 8, 4, 3);

  // Pilot Inside Cockpit
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(companionAvatar, canopyX + 2, canopyY - 2);

  // Glass Specular Dome Gradient Fill
  const glassGrad = ctx.createLinearGradient(
    canopyX - canopyRadius,
    canopyY - canopyRadius,
    canopyX + canopyRadius,
    canopyY + canopyRadius
  );
  glassGrad.addColorStop(0, "rgba(224, 247, 250, 0.65)");
  glassGrad.addColorStop(0.35, "rgba(128, 222, 234, 0.2)");
  glassGrad.addColorStop(0.7, "rgba(0, 188, 212, 0.15)");
  glassGrad.addColorStop(1, "rgba(0, 96, 100, 0.45)");

  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.arc(canopyX, canopyY, canopyRadius, 0, Math.PI * 2);
  ctx.fill();

  // Glass Specular Highlight Arc
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(canopyX, canopyY, canopyRadius - 3, -2.4, -1.0);
  ctx.stroke();

  // Canopy Outer Titanium Bezel
  ctx.strokeStyle = "#37474f";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(canopyX, canopyY, canopyRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 8. NOSE HEADLIGHT FIXTURE & LENS (Reacts to Searchlight Readiness)
  ctx.save();
  ctx.fillStyle = "#cfd8dc";
  ctx.strokeStyle = "#37474f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(46, 0, 6, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing headlight lens
  ctx.fillStyle = readinessMilestones.searchlight ? "#ffff8d" : "#fffde7";
  ctx.shadowColor = readinessMilestones.searchlight ? "#ffff00" : "#fff59d";
  ctx.shadowBlur = readinessMilestones.searchlight ? 20 : 12;
  ctx.beginPath();
  ctx.arc(47, 0, 4, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 9. RESCUE CUTTER / TOOL EQUIPMENT READINESS INDICATOR ON NOSE
  if (readinessMilestones.cutter) {
    ctx.save();
    ctx.fillStyle = "#d32f2f";
    ctx.shadowColor = "#ff1744";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(48, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(42, 10);
    ctx.lineTo(48, 12);
    ctx.stroke();
    ctx.restore();
  }

  // 10. ARTICULATED HYDRAULIC RESCUE ARM (If docked or actively rescuing)
  if (isDocked || armExtended) {
    renderMechanicalRescueArm(ctx, gupId, armTargetX, armTargetY, time);
  }

  ctx.restore();
}

/**
 * Renders an articulated industrial hydraulic rescue arm extending from the GUP.
 */
function renderMechanicalRescueArm(
  ctx: CanvasRenderingContext2D,
  gupId: string,
  targetX: number,
  targetY: number,
  _time: number
) {
  ctx.save();
  const startX = 36;
  const startY = 14;

  // Joint 1: Shoulder pivot
  ctx.fillStyle = "#37474f";
  ctx.beginPath();
  ctx.arc(startX, startY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b0bec5";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Elbow positioning
  const midX = startX + (targetX - startX) * 0.45;
  const midY = startY + (targetY - startY) * 0.45 - 28;

  // Segment 1 (Shoulder to Elbow)
  ctx.strokeStyle = "#78909c";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(midX, midY);
  ctx.stroke();

  // Hydraulic Piston Rod on segment 1
  ctx.strokeStyle = "#eceff1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX + 4, startY - 4);
  ctx.lineTo(midX - 6, midY - 6);
  ctx.stroke();

  // Joint 2: Elbow pivot
  ctx.fillStyle = "#455a64";
  ctx.beginPath();
  ctx.arc(midX, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Segment 2 (Elbow to Wrist Tool)
  ctx.strokeStyle = "#90a4ae";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // End Effector Tool Head
  ctx.save();
  ctx.translate(targetX, targetY);
  const toolAngle = Math.atan2(targetY - midY, targetX - midX);
  ctx.rotate(toolAngle);

  if (gupId === "gup-c" || gupId === "young-whale") {
    ctx.fillStyle = "#1565c0";
    ctx.fillRect(-4, -10, 16, 20);
    ctx.fillStyle = "#ff1744";
    ctx.fillRect(12, -10, 6, 8);
    ctx.fillStyle = "#2979ff";
    ctx.fillRect(12, 2, 6, 8);
  } else if (gupId === "gup-d" || gupId === "crab") {
    ctx.strokeStyle = "#ab47bc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(8, -10, 12, 0, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 10, 12, -1.2, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#ffa000";
    ctx.fillRect(0, -5, 12, 10);
    ctx.fillStyle = "#d32f2f";
    ctx.beginPath();
    ctx.arc(12, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Utility function to adjust a hex color's brightness.
 */
function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) num = 0xffc107;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
