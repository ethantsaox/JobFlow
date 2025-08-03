// Quick fix: Create simple icons using Canvas in browser console

// Paste this into browser console to create icons:

function createSimpleIcon(size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    // Blue background
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, 0, size, size);
    
    // White briefcase shape
    ctx.fillStyle = '#ffffff';
    const padding = size * 0.2;
    const width = size - (padding * 2);
    const height = width * 0.7;
    const x = padding;
    const y = (size - height) / 2;
    
    ctx.fillRect(x, y, width, height);
    
    // Handle
    const handleWidth = width * 0.3;
    const handleHeight = size * 0.1;
    const handleX = x + (width - handleWidth) / 2;
    const handleY = y - handleHeight;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.strokeRect(handleX, handleY, handleWidth, handleHeight);
    
    // Download
    const link = document.createElement('a');
    link.download = `icon-${size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log(`Created icon-${size}.png`);
}

// Create all sizes
[16, 48, 128].forEach(size => createSimpleIcon(size));