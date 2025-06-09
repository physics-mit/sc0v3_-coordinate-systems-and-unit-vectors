/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// DOM Element References
const axInput = document.getElementById('ax') as HTMLInputElement;
const ayInput = document.getElementById('ay') as HTMLInputElement;
const canvas = document.getElementById('vectorCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Display Spans
const displayAx = document.getElementById('display-ax')!;
const displayAy = document.getElementById('display-ay')!;
const displayMagA = document.getElementById('display-mag-a')!;
const displayUx = document.getElementById('display-ux')!;
const displayUy = document.getElementById('display-uy')!;
const displayMagUa = document.getElementById('display-mag-ua')!;
const zeroVectorNote = document.getElementById('zero-vector-note')!;

// Canvas and Drawing Constants
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const WORLD_MAX_COORD = 5; // The canvas will show from -5 to +5 in world units
const GRID_COLOR = '#e0e0e0';
const AXIS_COLOR = '#888888';
const TEXT_COLOR = '#333333';
const VECTOR_A_COLOR = '#007bff'; // Blue
const VECTOR_I_HAT_COLOR = '#dc3545'; // Red
const VECTOR_J_HAT_COLOR = '#28a745'; // Green
const VECTOR_UA_COLOR = '#6f42c1'; // Purple
const ARROW_HEAD_SIZE = 8; // Pixels

// Calculate scale and origin once
const PIXELS_PER_UNIT = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 * WORLD_MAX_COORD);
const ORIGIN_X_PX = CANVAS_WIDTH / 2;
const ORIGIN_Y_PX = CANVAS_HEIGHT / 2;

/**
 * Converts world coordinates to canvas pixel coordinates.
 * @param wx World x-coordinate.
 * @param wy World y-coordinate.
 * @returns { {px: number, py: number} } Canvas pixel coordinates.
 */
function worldToPixel(wx: number, wy: number): { px: number, py: number } {
    return {
        px: ORIGIN_X_PX + wx * PIXELS_PER_UNIT,
        py: ORIGIN_Y_PX - wy * PIXELS_PER_UNIT // Y-axis is inverted in canvas
    };
}

/**
 * Draws the grid and axes on the canvas.
 * This sets up the visual representation of the 2D coordinate system.
 */
function drawGridAndAxes() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    ctx.font = `${0.4 * PIXELS_PER_UNIT}px Arial`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw grid lines
    for (let i = -WORLD_MAX_COORD; i <= WORLD_MAX_COORD; i++) {
        // Vertical lines
        const { px: xPx } = worldToPixel(i, 0);
        ctx.beginPath();
        ctx.moveTo(xPx, 0);
        ctx.lineTo(xPx, CANVAS_HEIGHT);
        ctx.stroke();
        if (i !== 0) ctx.fillText(i.toString(), xPx, ORIGIN_Y_PX + 0.6 * PIXELS_PER_UNIT);

        // Horizontal lines
        const { py: yPy } = worldToPixel(0, i);
        ctx.beginPath();
        ctx.moveTo(0, yPy);
        ctx.lineTo(CANVAS_WIDTH, yPy);
        ctx.stroke();
        if (i !== 0) ctx.fillText(i.toString(), ORIGIN_X_PX - 0.6 * PIXELS_PER_UNIT, yPy);
    }

    // Draw axes
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1.5;
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN_Y_PX);
    ctx.lineTo(CANVAS_WIDTH, ORIGIN_Y_PX);
    ctx.stroke();
    ctx.fillText("X", CANVAS_WIDTH - 0.5 * PIXELS_PER_UNIT, ORIGIN_Y_PX + 0.6 * PIXELS_PER_UNIT);
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(ORIGIN_X_PX, 0);
    ctx.lineTo(ORIGIN_X_PX, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.fillText("Y", ORIGIN_X_PX + 0.6 * PIXELS_PER_UNIT, 0.5 * PIXELS_PER_UNIT);

    // Origin
    ctx.fillText("0", ORIGIN_X_PX - 0.6 * PIXELS_PER_UNIT, ORIGIN_Y_PX + 0.6 * PIXELS_PER_UNIT);
}

/**
 * Draws a vector on the canvas from the origin.
 * @param vx Vector's x-component in world units.
 * @param vy Vector's y-component in world units.
 * @param color Color of the vector.
 * @param label Label for the vector.
 * @param lineWidth Optional line width for the vector.
 */
function drawVector(vx: number, vy: number, color: string, label: string, lineWidth: number = 2) {
    const { px: endPx, py: endPy } = worldToPixel(vx, vy);

    ctx.beginPath();
    ctx.moveTo(ORIGIN_X_PX, ORIGIN_Y_PX);
    ctx.lineTo(endPx, endPy);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(endPy - ORIGIN_Y_PX, endPx - ORIGIN_X_PX);
    ctx.beginPath();
    ctx.moveTo(endPx, endPy);
    ctx.lineTo(endPx - ARROW_HEAD_SIZE * Math.cos(angle - Math.PI / 6), endPy - ARROW_HEAD_SIZE * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endPx - ARROW_HEAD_SIZE * Math.cos(angle + Math.PI / 6), endPy - ARROW_HEAD_SIZE * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Draw label
    // Offset label slightly from arrowhead
    const labelOffsetFactor = 1.5; // How far from the arrow tip to place the label
    const labelX = endPx + ARROW_HEAD_SIZE * labelOffsetFactor * Math.cos(angle);
    const labelY = endPy + ARROW_HEAD_SIZE * labelOffsetFactor * Math.sin(angle) ;

    // Adjust text alignment for better label placement
    if (Math.abs(vx) > Math.abs(vy)) { // More horizontal vector
        ctx.textAlign = vx > 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
    } else { // More vertical vector
        ctx.textAlign = 'center';
        ctx.textBaseline = vy > 0 ? 'top' : 'bottom';
    }
     // For very short vectors, force label outside
    if (Math.sqrt(vx*vx + vy*vy) < 0.5) {
        ctx.textAlign = vx >= 0 ? 'left' : 'right';
        ctx.textBaseline = vy >= 0 ? 'bottom' : 'top';
    }


    ctx.font = `${0.6 * PIXELS_PER_UNIT}px Arial`;
    ctx.fillStyle = color;
    // Use innerHTML for label to render sub/sup tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = label;
    ctx.fillText(tempDiv.textContent || label, labelX, labelY);
}


/**
 * Calculates the magnitude of a vector.
 * Magnitude = sqrt(vx^2 + vy^2)
 * @param vx Vector's x-component.
 * @param vy Vector's y-component.
 * @returns Magnitude of the vector.
 */
function calculateMagnitude(vx: number, vy: number): number {
    return Math.sqrt(vx * vx + vy * vy);
}

/**
 * Main function to update the simulation.
 * It reads input values, performs calculations, updates displayed info, and redraws the canvas.
 * This function orchestrates the core logic of the simulator.
 */
function updateSimulation() {
    // 1. Read input values for vector A
    const ax = parseFloat(axInput.value) || 0;
    const ay = parseFloat(ayInput.value) || 0;

    // 2. Perform calculations for vector A
    const magA = calculateMagnitude(ax, ay);

    // Update display for vector A
    displayAx.textContent = ax.toFixed(3);
    displayAy.textContent = ay.toFixed(3);
    displayMagA.textContent = magA.toFixed(3);

    // 3. Calculate unit vector uA
    let ux = 0;
    let uy = 0;
    let magUa = 0;

    if (magA === 0) {
        // Handle zero vector case: unit vector is undefined
        displayUx.textContent = "N/A";
        displayUy.textContent = "N/A";
        displayMagUa.textContent = "N/A";
        zeroVectorNote.style.display = 'block';
    } else {
        // "We can also define a unit vector in the direction of an arbitrary vector."
        // "The key here is to make sure it has a magnitude of 1."
        // uA = A / |A|
        ux = ax / magA;
        uy = ay / magA;
        magUa = calculateMagnitude(ux, uy); // Should be very close to 1

        displayUx.textContent = ux.toFixed(3);
        displayUy.textContent = uy.toFixed(3);
        displayMagUa.textContent = magUa.toFixed(3); // Verify it's 1
        zeroVectorNote.style.display = 'none';
    }

    // 4. Redraw canvas
    drawGridAndAxes();

    // Draw standard unit vectors i-hat and j-hat
    // "For a normal x, y coordinate system, we have i hat in the positive x direction..."
    drawVector(1, 0, VECTOR_I_HAT_COLOR, "î (1,0)", 3);
    // "...and j hat in the positive y direction."
    drawVector(0, 1, VECTOR_J_HAT_COLOR, "ĵ (0,1)", 3);

    // Draw vector A
    // Cap drawing at world max coordinate to keep it visually manageable
    const drawAx = Math.max(-WORLD_MAX_COORD, Math.min(WORLD_MAX_COORD, ax));
    const drawAy = Math.max(-WORLD_MAX_COORD, Math.min(WORLD_MAX_COORD, ay));
    if (ax !== 0 || ay !== 0) { // Don't draw if it's a zero vector dot
         drawVector(drawAx, drawAy, VECTOR_A_COLOR, `A (${ax.toFixed(1)},${ay.toFixed(1)})`);
    }


    // Draw unit vector uA if A is not a zero vector
    if (magA !== 0) {
        drawVector(ux, uy, VECTOR_UA_COLOR, `u<sub>A</sub> (${ux.toFixed(2)},${uy.toFixed(2)})`, 3);
    }
}

// Event Listeners
axInput.addEventListener('input', updateSimulation);
ayInput.addEventListener('input', updateSimulation);

// Initial call to draw the simulation on page load
updateSimulation();

// Ensure canvas is redrawn if window is resized (simple redraw, no complex rescaling)
window.addEventListener('resize', () => {
    // Update canvas dimensions if changed by CSS (e.g. max-width: 100%)
    // This is a naive resize, doesn't re-calculate PIXELS_PER_UNIT dynamically for true responsiveness of drawing scale.
    // For a more robust solution, canvas dimensions and PIXELS_PER_UNIT might need re-evaluation.
    // canvas.width = canvas.clientWidth;
    // canvas.height = canvas.clientHeight;
    // Re-calculate these if canvas dimensions change dynamically beyond initial load.
    // For now, assume fixed canvas pixel size set in HTML, responsive CSS handles scaling.
    updateSimulation();
});
