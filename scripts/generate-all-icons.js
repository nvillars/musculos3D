const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, text = '3D') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw a 3D cube
  const cubeSize = size * 0.4;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Cube faces
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  
  // Front face
  ctx.fillRect(centerX - cubeSize/2, centerY - cubeSize/2, cubeSize, cubeSize);
  
  // Top face
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.moveTo(centerX - cubeSize/2, centerY - cubeSize/2);
  ctx.lineTo(centerX - cubeSize/3, centerY - cubeSize/1.5);
  ctx.lineTo(centerX + cubeSize/6, centerY - cubeSize/1.5);
  ctx.lineTo(centerX + cubeSize/3, centerY - cubeSize/2);
  ctx.closePath();
  ctx.fill();
  
  // Right face
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(centerX + cubeSize/2, centerY - cubeSize/2);
  ctx.lineTo(centerX + cubeSize/1.5, centerY - cubeSize/3);
  ctx.lineTo(centerX + cubeSize/1.5, centerY + cubeSize/6);
  ctx.lineTo(centerX + cubeSize/2, centerY + cubeSize/3);
  ctx.closePath();
  ctx.fill();
  
  // Text
  if (size >= 32) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, centerX, centerY + cubeSize/2 + size * 0.1);
  }
  
  return canvas.toBuffer('image/png');
}

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all required icons
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const iconBuffer = createIcon(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  console.log(`Generated icon: ${iconPath}`);
});

// Generate special icons for shortcuts
const muscleIcon = createIcon(96, 'M');
const heartIcon = createIcon(96, 'H');

fs.writeFileSync(path.join(iconsDir, 'muscle-icon.png'), muscleIcon);
fs.writeFileSync(path.join(iconsDir, 'heart-icon.png'), heartIcon);

console.log('Generated muscle-icon.png');
console.log('Generated heart-icon.png');
console.log('All icons generated successfully!');
