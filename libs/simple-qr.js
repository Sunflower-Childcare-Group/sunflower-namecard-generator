// Simple QR Code generator for vCard data
// This is a simplified implementation using a working QR service

class SimpleQR {
    static async toDataURL(text, options = {}) {
        try {
            // Use QR Server API as fallback
            const size = options.width || 300;
            const margin = options.margin || 2;
            
            // Encode the text for URL
            const encodedText = encodeURIComponent(text);
            
            // Use qr-server.com API (reliable service)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodedText}`;
            
            // Convert to canvas and then to data URL for consistent handling
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    // Create canvas to convert to data URL
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = size;
                    canvas.height = size;
                    
                    // Fill with white background
                    ctx.fillStyle = options.color?.light || '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);
                    
                    // Draw the QR code
                    ctx.drawImage(img, 0, 0, size, size);
                    
                    // Convert to data URL
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl);
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load QR code from service'));
                };
                
                img.src = qrUrl;
            });
            
        } catch (error) {
            throw new Error(`QR Code generation failed: ${error.message}`);
        }
    }
}

// Make it available globally
window.QRCode = SimpleQR;