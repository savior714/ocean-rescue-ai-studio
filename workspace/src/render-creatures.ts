/**
 * High-Fidelity Procedural Vector Modeling Engine for Marine Creatures,
 * Realistic Entanglements/Hazards, and Medical Bio-Care Interactions.
 */

export interface CreatureState {
  healthPercent: number;
  isHealed: boolean;
  isCelebration: boolean;
  time: number;
  eyeBlinkPhase?: number;
  swimOffset?: number;
  pointerX?: number;
  pointerY?: number;
}

// 1. GREEN SEA TURTLE (푸른바다거북)
export function renderSeaTurtle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: CreatureState
) {
  const { healthPercent, isHealed, isCelebration, time } = state;
  const t = time * 0.003;
  const swimPhase = (state.swimOffset || 0) + t * 2.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Flipper stroke angles
  const frontFlipperAngle = Math.sin(swimPhase) * (isCelebration ? 0.35 : 0.18);
  const rearFlipperAngle = Math.cos(swimPhase * 1.2) * 0.15;
  const headBob = Math.sin(swimPhase * 0.8) * 4;

  // Drop shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 10, 25, 0.4)";
  ctx.filter = "blur(12px)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 75, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A. REAR FLIPPERS
  ctx.save();
  ctx.fillStyle = "#33691e";
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2;

  // Left Rear
  ctx.save();
  ctx.translate(-42, -28);
  ctx.rotate(-0.4 + rearFlipperAngle);
  drawPaddleFlipper(ctx, 32, 14);
  ctx.restore();

  // Right Rear
  ctx.save();
  ctx.translate(-42, 28);
  ctx.rotate(0.4 - rearFlipperAngle);
  drawPaddleFlipper(ctx, 32, 14);
  ctx.restore();
  ctx.restore();

  // B. FRONT PECTORAL FLIPPERS (Large swimming wings)
  ctx.save();
  // Upper/Far Flipper
  ctx.save();
  ctx.translate(18, -32);
  ctx.rotate(-0.7 + frontFlipperAngle);
  drawFrontFlipper(ctx, 68, 22, "#558b2f", "#2e7d32");
  ctx.restore();

  // Lower/Near Flipper
  ctx.save();
  ctx.translate(18, 32);
  ctx.rotate(0.7 - frontFlipperAngle);
  drawFrontFlipper(ctx, 68, 22, "#689f38", "#33691e");
  ctx.restore();
  ctx.restore();

  // C. HEAD & NECK
  ctx.save();
  ctx.translate(56 + headBob, 0);

  // Throat breathing swell
  const throatSwell = 1.0 + Math.sin(t * 3) * 0.05;
  ctx.scale(throatSwell, throatSwell);

  // Neck
  ctx.fillStyle = "#558b2f";
  ctx.beginPath();
  ctx.ellipse(-14, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head Shape
  const headGrad = ctx.createLinearGradient(0, -16, 0, 16);
  headGrad.addColorStop(0, "#7cb342");
  headGrad.addColorStop(0.6, "#558b2f");
  headGrad.addColorStop(1, "#33691e");
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.bezierCurveTo(14, -14, 28, -8, 30, 0);
  ctx.bezierCurveTo(28, 8, 14, 14, -6, 14);
  ctx.bezierCurveTo(-14, 10, -14, -10, -6, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Turtle Snout & Beak line
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(16, 4);
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = "#1b5e20";
  ctx.beginPath();
  ctx.arc(24, -2, 1.2, 0, Math.PI * 2);
  ctx.arc(24, 2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Turtle Eye (with blinking logic)
  const isBlinking = (Math.floor(time / 2600) % 4 === 0) && (time % 2600 < 160);
  ctx.save();
  ctx.translate(8, -8);
  if (isBlinking) {
    // Closed happy eye line
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    // Detailed open eye
    ctx.fillStyle = "#fff8e1";
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Amber Brown)
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(0.5, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(1, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-1, -1.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // D. CARAPACE (SHELL) - Beautiful Multi-Scute Pattern
  ctx.save();
  // Shell Rim (Marginal Scutes)
  const rimGrad = ctx.createLinearGradient(0, -48, 0, 48);
  rimGrad.addColorStop(0, "#cddc39");
  rimGrad.addColorStop(0.5, "#8bc34a");
  rimGrad.addColorStop(1, "#558b2f");
  ctx.fillStyle = rimGrad;
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.ellipse(0, 0, 64, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Shell Dome (Vertebral & Costal Scutes)
  const domeGrad = ctx.createRadialGradient(-10, -10, 10, 0, 0, 58);
  domeGrad.addColorStop(0, "#8bc34a");
  domeGrad.addColorStop(0.4, "#689f38");
  domeGrad.addColorStop(0.75, "#33691e");
  domeGrad.addColorStop(1, "#1b5e20");

  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hexagonal Scute Mosaic Lines
  ctx.strokeStyle = "rgba(255, 235, 59, 0.45)";
  ctx.lineWidth = 2;

  // Central Scute Plates
  drawHexScute(ctx, -24, 0, 14);
  drawHexScute(ctx, 0, 0, 16);
  drawHexScute(ctx, 24, 0, 13);

  // Side Scutes
  drawHexScute(ctx, -12, -18, 11);
  drawHexScute(ctx, 14, -18, 11);
  drawHexScute(ctx, -12, 18, 11);
  drawHexScute(ctx, 14, 18, 11);

  // Shell Top Specular Sheen
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.beginPath();
  ctx.ellipse(-12, -10, 24, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // E. HEALTH / RELIEF GLOW AURA (When healed)
  if (healthPercent > 80 || isCelebration) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 235, 59, 0.9)";
    ctx.font = "20px sans-serif";
    ctx.fillText("✨", 40, -32);
    ctx.fillText("✨", -35, 30);
    ctx.restore();
  }

  ctx.restore();
}

function drawFrontFlipper(
  ctx: CanvasRenderingContext2D,
  length: number,
  width: number,
  fillColor: string,
  strokeColor: string
) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.4, -width * 0.8, length * 0.8, -width * 0.4, length, 0);
  ctx.bezierCurveTo(length * 0.7, width * 1.1, length * 0.3, width * 0.7, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flipper Scale Textures
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(length * 0.4, 0, 4, 0, Math.PI * 2);
  ctx.arc(length * 0.65, 0, 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPaddleFlipper(ctx: CanvasRenderingContext2D, length: number, width: number) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.5, -width, length, 0);
  ctx.quadraticCurveTo(length * 0.5, width, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHexScute(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

// 2. SHORE CRAB (알락꽃게)
export function renderCrab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: CreatureState
) {
  const { isCelebration, time } = state;
  const t = time * 0.003;
  const scuttle = Math.sin(t * 5) * 0.1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop Shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 10, 25, 0.45)";
  ctx.filter = "blur(10px)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 60, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A. WALKING LEGS (4 on left, 4 on right)
  ctx.save();
  ctx.strokeStyle = "#e64a19";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < 4; i++) {
    const legOffset = (i - 1.5) * 14;
    const legPhase = Math.sin(t * 6 + i) * 6;

    // Left legs
    ctx.beginPath();
    ctx.moveTo(legOffset, -18);
    ctx.lineTo(legOffset - 18, -38 + legPhase);
    ctx.lineTo(legOffset - 36, -34 + legPhase);
    ctx.stroke();

    // Right legs
    ctx.beginPath();
    ctx.moveTo(legOffset, 18);
    ctx.lineTo(legOffset - 18, 38 - legPhase);
    ctx.lineTo(legOffset - 36, 34 - legPhase);
    ctx.stroke();
  }
  ctx.restore();

  // B. MAIN CARAPACE (SHELL)
  ctx.save();
  const crabGrad = ctx.createRadialGradient(0, -8, 8, 0, 0, 42);
  crabGrad.addColorStop(0, "#ff7043");
  crabGrad.addColorStop(0.6, "#f4511e");
  crabGrad.addColorStop(1, "#bf360c");

  ctx.fillStyle = crabGrad;
  ctx.strokeStyle = "#7f0000";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Hexagonal spiny carapace
  ctx.moveTo(34, 0);
  ctx.lineTo(24, -22);
  ctx.lineTo(-14, -26);
  ctx.lineTo(-32, -12);
  ctx.lineTo(-32, 12);
  ctx.lineTo(-14, 26);
  ctx.lineTo(24, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shell Mottled Texture Spots
  ctx.fillStyle = "rgba(255, 204, 128, 0.6)";
  ctx.beginPath();
  ctx.arc(-8, -10, 3.5, 0, Math.PI * 2);
  ctx.arc(8, -8, 4, 0, Math.PI * 2);
  ctx.arc(-6, 10, 3.5, 0, Math.PI * 2);
  ctx.arc(10, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // C. EYE STALKS (Swiveling looking at cursor)
  ctx.save();
  for (const side of [-1, 1]) {
    const ey = side * 10;
    // Stalk
    ctx.strokeStyle = "#ff7043";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, ey * 0.6);
    ctx.lineTo(34, ey);
    ctx.stroke();

    // Eye Ball
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#bf360c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(36, ey, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(37.5, ey, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Glint
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(36.5, ey - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // D. CHELAE (PINCER CLAWS)
  ctx.save();
  for (const side of [-1, 1]) {
    const clawAngle = (isCelebration ? Math.sin(t * 8) * 0.4 : 0.1) * side;
    ctx.save();
    ctx.translate(22, side * 22);
    ctx.rotate(side * 0.6 + clawAngle);

    // Arm joint
    ctx.strokeStyle = "#ff5722";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, side * 8);
    ctx.stroke();

    // Pincer Palm & Dactyl
    ctx.translate(16, side * 8);
    ctx.fillStyle = "#d84315";
    ctx.strokeStyle = "#7f0000";
    ctx.lineWidth = 2;

    // Fixed Claw
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(18, -10, 26, -2);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Movable Claw
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(18, 10, 26, 2);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ivory Teeth on pincers
    ctx.fillStyle = "#fff8e1";
    ctx.beginPath();
    ctx.arc(14, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(18, -1.5, 1.5, 0, Math.PI * 2);
    ctx.arc(14, 2, 1.5, 0, Math.PI * 2);
    ctx.arc(18, 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

// 3. BABY HUMPBACK WHALE (아기 혹등고래)
export function renderHumpbackWhale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: CreatureState
) {
  const { isCelebration, time } = state;
  const t = time * 0.002;
  const swimAngle = Math.sin(t * 3) * 0.08;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + swimAngle);

  // Drop shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 10, 25, 0.4)";
  ctx.filter = "blur(16px)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 120, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A. TAIL FLUKE (SWIMMING FLUTTER)
  ctx.save();
  const flukeY = Math.sin(t * 3.5) * 8;
  ctx.translate(-110, flukeY);
  ctx.fillStyle = "#1565c0";
  ctx.strokeStyle = "#0d47a1";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-24, -36, -42, -28, -36, 0);
  ctx.bezierCurveTo(-42, 28, -24, 36, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // B. MAIN WHALE BODY
  ctx.save();
  const bodyGrad = ctx.createLinearGradient(0, -45, 0, 45);
  bodyGrad.addColorStop(0, "#2196f3");
  bodyGrad.addColorStop(0.4, "#1976d2");
  bodyGrad.addColorStop(0.75, "#0d47a1");
  bodyGrad.addColorStop(1, "#0a2540");

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = "#0a192f";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Hydrodynamic massive whale silhouette
  ctx.moveTo(110, 0);
  ctx.bezierCurveTo(105, -38, 40, -46, -40, -32);
  ctx.bezierCurveTo(-80, -22, -95, -12, -110, 0);
  ctx.bezierCurveTo(-95, 12, -80, 26, -40, 38);
  ctx.bezierCurveTo(40, 48, 105, 34, 110, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // C. VENTRAL THROAT GROOVES (Pleats on belly)
  ctx.save();
  ctx.fillStyle = "#e3f2fd";
  ctx.beginPath();
  ctx.moveTo(90, 8);
  ctx.bezierCurveTo(50, 42, -20, 36, -50, 16);
  ctx.bezierCurveTo(-10, 20, 50, 20, 90, 8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#90caf9";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const gy = 14 + i * 5;
    ctx.beginPath();
    ctx.moveTo(80 - i * 8, gy);
    ctx.quadraticCurveTo(20, gy + 8, -40 + i * 4, gy - 2);
    ctx.stroke();
  }
  ctx.restore();

  // D. PECTORAL FIN (WAVY WING)
  ctx.save();
  const finStroke = Math.sin(t * 3) * 0.15;
  ctx.translate(15, 18);
  ctx.rotate(0.4 + finStroke);
  ctx.fillStyle = "#1e88e5";
  ctx.strokeStyle = "#0d47a1";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(35, 15, 60, 45, 55, 65);
  ctx.bezierCurveTo(35, 55, 15, 35, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // E. BLOWHOLE & MICRO-BUBBLES
  ctx.save();
  ctx.fillStyle = "#0d47a1";
  ctx.beginPath();
  ctx.ellipse(32, -38, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Intermittent gentle bubble puff
  if (Math.sin(t * 4) > 0.6) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.arc(32, -48, 3, 0, Math.PI * 2);
    ctx.arc(36, -56, 4.5, 0, Math.PI * 2);
    ctx.arc(30, -64, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // F. KIND EXPRESSIVE EYE
  ctx.save();
  ctx.translate(65, -8);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a237e";
  ctx.beginPath();
  ctx.arc(1, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-0.5, -1, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// 4. REALISTIC BRAIDED NYLON ROPES & GHOST NETTING
export function renderBraidedRope(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  cutProgress: number,
  isTargeted: boolean,
  time: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // Rope Shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 10, 20, 0.35)";
  ctx.filter = "blur(4px)";
  ctx.fillRect(0, 4, dist, 8);
  ctx.restore();

  // Braided Rope Core (Segmented weave)
  const segments = Math.floor(dist / 14);
  const ropeRadius = 6;

  for (let i = 0; i < segments; i++) {
    const sx = (i * dist) / segments;
    const strandGrad = ctx.createLinearGradient(sx, -ropeRadius, sx, ropeRadius);
    strandGrad.addColorStop(0, "#d7ccc8");
    strandGrad.addColorStop(0.3, color || "#8d6e63");
    strandGrad.addColorStop(0.8, "#4e342e");
    strandGrad.addColorStop(1, "#271b16");

    ctx.fillStyle = strandGrad;
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.ellipse(sx + 7, (i % 2 === 0 ? -1.5 : 1.5), 8, ropeRadius, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Frayed Fiber Strands at ends
  ctx.strokeStyle = "#bcaaa4";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i - 1.5) * 3);
    ctx.lineTo(-8 - i * 2, (i - 1.5) * 6);
    ctx.moveTo(dist, (i - 1.5) * 3);
    ctx.lineTo(dist + 8 + i * 2, (i - 1.5) * 6);
    ctx.stroke();
  }

  // TARGETING RETICLE & LASER GUIDE (When hovered)
  if (isTargeted) {
    const pulse = 1.0 + Math.sin(time * 0.01) * 0.2;
    ctx.save();
    ctx.translate(dist / 2, 0);
    ctx.scale(pulse, pulse);

    // Glowing Laser Target Ring
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#ffb300";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle Crosshairs
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(-12, 0);
    ctx.moveTo(12, 0);
    ctx.lineTo(24, 0);
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -12);
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 24);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// 5. CRACKED MOSSY REEF BOULDERS (해저 암석)
export function renderReefBoulder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  isDragged: boolean,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Deep Contact Shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 10, 25, 0.55)";
  ctx.filter = "blur(8px)";
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.85, radius * 1.1, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Main Textured Rock Body
  const rockGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius);
  rockGrad.addColorStop(0, "#90a4ae");
  rockGrad.addColorStop(0.5, "#607d8b");
  rockGrad.addColorStop(0.85, "#37474f");
  rockGrad.addColorStop(1, "#212121");

  ctx.fillStyle = rockGrad;
  ctx.strokeStyle = "#1c2529";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Multi-faceted irregular boulder polygon
  const verts = 10;
  for (let i = 0; i < verts; i++) {
    const a = (i * Math.PI * 2) / verts;
    const r = radius * (0.85 + ((i % 3 === 0) ? 0.18 : -0.1));
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sea Moss Patches
  ctx.fillStyle = "#33691e";
  ctx.beginPath();
  ctx.arc(-radius * 0.2, -radius * 0.35, radius * 0.25, 0, Math.PI * 2);
  ctx.arc(radius * 0.3, radius * 0.1, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Rock Cracks & Barnacles
  ctx.strokeStyle = "#263238";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.4, -radius * 0.1);
  ctx.lineTo(0, radius * 0.1);
  ctx.lineTo(radius * 0.4, -radius * 0.2);
  ctx.stroke();

  // White Barnacles
  ctx.fillStyle = "#eceff1";
  ctx.beginPath();
  ctx.arc(radius * 0.35, -radius * 0.25, 3.5, 0, Math.PI * 2);
  ctx.arc(radius * 0.45, -radius * 0.15, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // DRAG / GRABBER HIGHLIGHT
  if (isDragged) {
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ffb300";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// 6. HIGH-TECH HOLOGRAPHIC BIO-SCANNER
export function renderHoloBioScan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number
) {
  const t = time * 0.003;
  ctx.save();
  ctx.translate(x, y);

  // Rotating outer telemetry ring
  ctx.save();
  ctx.rotate(t * 1.5);
  ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Counter-rotating inner compass
  ctx.save();
  ctx.rotate(-t * 2);
  ctx.strokeStyle = "rgba(128, 222, 234, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Vertical sweeping scan laser beam
  const scanY = Math.sin(t * 3) * radius * 0.7;
  const laserGrad = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
  laserGrad.addColorStop(0, "rgba(0, 229, 255, 0)");
  laserGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.85)");
  laserGrad.addColorStop(1, "rgba(0, 229, 255, 0)");

  ctx.fillStyle = laserGrad;
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 12;
  ctx.fillRect(-radius * 0.7, scanY - 4, radius * 1.4, 8);

  // Holo Crosshair
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.stroke();

  ctx.restore();
}

// 7. MARINE HEALING TREAT
export function renderMarineTreat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  treatIcon: string,
  time: number
) {
  const pulse = 1.0 + Math.sin(time * 0.006) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);

  // Golden Sparkling Aura
  ctx.fillStyle = "rgba(255, 213, 79, 0.35)";
  ctx.shadowColor = "#ffd54f";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();

  // Treat Icon
  ctx.font = "32px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(treatIcon || "🌿", 0, 0);
  ctx.restore();
}
