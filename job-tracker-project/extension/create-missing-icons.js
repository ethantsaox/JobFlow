// Create missing PNG icons from SVG
const fs = require('fs');
const path = require('path');

// SVG content (simplified version for Node.js)
const svgContent = `<svg width="SIZE" height="SIZE" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#gradient)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  
  <!-- Briefcase body -->
  <rect x="35" y="45" width="58" height="38" rx="4" fill="#ffffff" opacity="0.95"/>
  
  <!-- Briefcase handle -->
  <rect x="55" y="35" width="18" height="12" rx="2" fill="none" stroke="#ffffff" stroke-width="3"/>
  
  <!-- Briefcase lock -->
  <rect x="61" y="60" width="6" height="8" rx="1" fill="#3B82F6"/>
  
  <!-- Tracking indicator -->
  <circle cx="85" cy="35" r="8" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
  <circle cx="85" cy="35" r="3" fill="#ffffff"/>
  
  <!-- Success checkmark in indicator -->
  <path d="M82 35 L84 37 L88 33" stroke="#10B981" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;

// Create Base64 data URLs for different sizes
function createIconDataURL(size) {
  const svg = svgContent.replace(/SIZE/g, size);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

console.log('To create PNG icons, follow these steps:');
console.log('');
console.log('1. Open your browser and go to: chrome://extensions/');
console.log('2. Open Browser Console (F12)');
console.log('3. Paste and run the following code:');
console.log('');

// Generate the browser console code
const browserCode = `
// Function to create and download PNG icon
function createIcon(size) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(1, '#1E40AF');
  
  // Background circle
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.47, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // White border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = size * 0.016;
  ctx.stroke();
  
  // Briefcase body
  const briefcaseWidth = size * 0.45;
  const briefcaseHeight = size * 0.3;
  const briefcaseX = (size - briefcaseWidth) / 2;
  const briefcaseY = size * 0.35;
  
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(briefcaseX, briefcaseY, briefcaseWidth, briefcaseHeight);
  
  // Briefcase handle
  const handleWidth = size * 0.14;
  const handleHeight = size * 0.09;
  const handleX = (size - handleWidth) / 2;
  const handleY = size * 0.27;
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.023;
  ctx.strokeRect(handleX, handleY, handleWidth, handleHeight);
  
  // Briefcase lock
  const lockSize = size * 0.047;
  const lockX = size/2 - lockSize/2;
  const lockY = size * 0.47;
  
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(lockX, lockY, lockSize, lockSize * 1.3);
  
  // Tracking indicator
  const indicatorX = size * 0.66;
  const indicatorY = size * 0.27;
  const indicatorRadius = size * 0.0625;
  
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#10B981';
  ctx.fill();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.016;
  ctx.stroke();
  
  // Inner white dot
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, indicatorRadius * 0.375, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  // Download the icon
  const link = document.createElement('a');
  link.download = \`icon-\${size}.png\`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  console.log(\`✅ Downloaded icon-\${size}.png\`);
}

// Create all required icons
console.log('Creating PNG icons...');
createIcon(16);
createIcon(48);
createIcon(128);
console.log('✅ All icons created! Save them to the icons/ folder.');
`;

console.log(browserCode);
console.log('');
console.log('4. This will download 3 PNG files: icon-16.png, icon-48.png, icon-128.png');
console.log('5. Save them to your extension/icons/ folder');
console.log('6. Replace the existing icon-16.png if needed');
console.log('');
console.log('Alternatively, you can open the create-icons.html file in your browser and download the icons from there.');