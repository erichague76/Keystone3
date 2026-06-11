// Keystone3 – Reverted to commit 8ec317b
// Plate rendering + manual letter placement

const PLATE_IMAGE_FILE = './Plate.png';

const CONFIG = {
    plateTextColor: '#14377D',
    manualFontSize: 80,              // reverted
    manualLetterSpacingPx: -10,      // reverted
    manualOffsetX: 10,
    manualOffsetY: 80,
    fontFamily: '"Arial Narrow", Bahnschrift, Arial, sans-serif'
};

// ------------------------------------------------------------
// Load plate image
// ------------------------------------------------------------
const plateImage = new Image();
plateImage.src = PLATE_IMAGE_FILE;

// ------------------------------------------------------------
// Draw plate with manual letters
// ------------------------------------------------------------
function drawPlate(text) {
    const canvas = document.getElementById('plateCanvas');
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw plate background
    ctx.drawImage(plateImage, 0, 0, canvas.width, canvas.height);

    // Draw letters
    ctx.fillStyle = CONFIG.plateTextColor;
    ctx.font = `${CONFIG.manualFontSize}px ${CONFIG.fontFamily}`;
    ctx.textBaseline = 'top';

    let x = CONFIG.manualOffsetX;
    const y = CONFIG.manualOffsetY;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        ctx.fillText(ch, x, y);
        x += CONFIG.manualLetterSpacingPx + ctx.measureText(ch).width;
    }
}

// ------------------------------------------------------------
// Hook input box → live plate update
// ------------------------------------------------------------
function setupInputListener() {
    const input = document.getElementById('plateInput');
    input.addEventListener('input', () => {
        const value = input.value.toUpperCase();
        drawPlate(value);
    });
}

// ------------------------------------------------------------
// Initialize when image loads
// ------------------------------------------------------------
plateImage.onload = () => {
    setupInputListener();
    const input = document.getElementById('plateInput');
    drawPlate(input.value.toUpperCase());
};
