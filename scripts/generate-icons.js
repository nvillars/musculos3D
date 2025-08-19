const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Function to create a simple icon
function createIcon(size, text = '3D') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add a simple 3D cube icon
  const center = size / 2;
  const cubeSize = size * 0.3;
  
  // Draw a simple cube
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.05;
  
  // Front face
  ctx.strokeRect(center - cubeSize/2, center - cubeSize/2, cubeSize, cubeSize);
  
  // Top face
  ctx.beginPath();
  ctx.moveTo(center - cubeSize/2, center - cubeSize/2);
  ctx.lineTo(center - cubeSize/3, center - cubeSize/1.5);
  ctx.lineTo(center + cubeSize/6, center - cubeSize/1.5);
  ctx.lineTo(center + cubeSize/3, center - cubeSize/2);
  ctx.stroke();
  
  // Right face
  ctx.beginPath();
  ctx.moveTo(center + cubeSize/2, center - cubeSize/2);
  ctx.lineTo(center + cubeSize/3, center - cubeSize/1.5);
  ctx.lineTo(center + cubeSize/3, center + cubeSize/1.5);
  ctx.lineTo(center + cubeSize/2, center + cubeSize/2);
  ctx.stroke();
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, center, center + cubeSize/1.2);
  
  return canvas.toBuffer('image/png');
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate different icon sizes
const sizes = [16, 32, 72, 144, 192];
sizes.forEach(size => {
  const iconBuffer = createIcon(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  console.log(`Generated icon: ${iconPath}`);
});

console.log('All icons generated successfully!');
