// Color Conversion Utilities for Sunflower Namecard Generator
// Provides RGB to CMYK conversion and brand color management

class ColorConversion {
    constructor() {
        // Sunflower brand color mappings (RGB to CMYK)
        this.brandColors = {
            // Sunflower Yellow #FFCC00 
            sunflowerYellow: {
                rgb: { r: 255, g: 204, b: 0 },
                cmyk: { c: 0, m: 20, y: 100, k: 0 }
            },
            // Dark text #2c2c2c
            darkText: {
                rgb: { r: 44, g: 44, b: 44 },
                cmyk: { c: 0, m: 0, y: 0, k: 83 }
            },
            // White background
            white: {
                rgb: { r: 255, g: 255, b: 255 },
                cmyk: { c: 0, m: 0, y: 0, k: 0 }
            },
            // Black
            black: {
                rgb: { r: 0, g: 0, b: 0 },
                cmyk: { c: 0, m: 0, y: 0, k: 100 }
            }
        };
    }

    /**
     * Convert RGB color to CMYK
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255) 
     * @param {number} b - Blue component (0-255)
     * @returns {Object} CMYK values {c, m, y, k} as percentages (0-100)
     */
    rgbToCmyk(r, g, b) {
        // Normalize RGB values to 0-1 range
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        // Calculate black (K) component
        const k = 1 - Math.max(rNorm, gNorm, bNorm);

        // Handle pure black case
        if (k === 1) {
            return { c: 0, m: 0, y: 0, k: 100 };
        }

        // Calculate CMY components
        const c = (1 - rNorm - k) / (1 - k);
        const m = (1 - gNorm - k) / (1 - k);
        const y = (1 - bNorm - k) / (1 - k);

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    /**
     * Convert hex color to CMYK
     * @param {string} hex - Hex color code (e.g., "#FFCC00")
     * @returns {Object} CMYK values {c, m, y, k} as percentages (0-100)
     */
    hexToCmyk(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return this.rgbToCmyk(r, g, b);
    }

    /**
     * Get CMYK values for Sunflower brand colors
     * @param {string} colorName - Brand color name ('sunflowerYellow', 'darkText', etc.)
     * @returns {Object} CMYK values {c, m, y, k} as percentages (0-100)
     */
    getBrandColorCmyk(colorName) {
        const brandColor = this.brandColors[colorName];
        if (!brandColor) {
            console.warn(`Unknown brand color: ${colorName}`);
            return { c: 0, m: 0, y: 0, k: 100 }; // Default to black
        }
        return brandColor.cmyk;
    }

    /**
     * Convert CMYK back to RGB (approximate)
     * @param {number} c - Cyan percentage (0-100)
     * @param {number} m - Magenta percentage (0-100)
     * @param {number} y - Yellow percentage (0-100)
     * @param {number} k - Black percentage (0-100)
     * @returns {Object} RGB values {r, g, b} (0-255)
     */
    cmykToRgb(c, m, y, k) {
        // Normalize CMYK values to 0-1 range
        const cNorm = c / 100;
        const mNorm = m / 100;
        const yNorm = y / 100;
        const kNorm = k / 100;

        // Calculate RGB values
        const r = 255 * (1 - cNorm) * (1 - kNorm);
        const g = 255 * (1 - mNorm) * (1 - kNorm);
        const b = 255 * (1 - yNorm) * (1 - kNorm);

        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b)
        };
    }

    /**
     * Get RGB approximation of CMYK color for screen display
     * @param {string} colorName - Brand color name
     * @returns {string} RGB color string (e.g., "rgb(255, 204, 0)")
     */
    getBrandColorRgb(colorName) {
        const brandColor = this.brandColors[colorName];
        if (!brandColor) {
            console.warn(`Unknown brand color: ${colorName}`);
            return "rgb(0, 0, 0)"; // Default to black
        }
        
        const { r, g, b } = brandColor.rgb;
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert canvas image data to CMYK-adjusted image data
     * This applies color correction to better approximate CMYK output
     * @param {ImageData} imageData - Canvas image data
     * @returns {ImageData} Color-corrected image data
     */
    applyPrintColorCorrection(imageData) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to CMYK and back to RGB for color correction
            const cmyk = this.rgbToCmyk(r, g, b);
            const correctedRgb = this.cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
            
            // Apply slight adjustments for print characteristics
            data[i] = Math.max(0, correctedRgb.r - 5); // Slightly reduce red
            data[i + 1] = Math.max(0, correctedRgb.g - 3); // Slightly reduce green
            data[i + 2] = Math.max(0, correctedRgb.b - 2); // Slightly reduce blue
            // Alpha channel remains unchanged: data[i + 3]
        }
        
        return imageData;
    }

    /**
     * Check if jsPDF supports CMYK (it doesn't natively, but we can simulate)
     * @returns {boolean} Always false, but included for future compatibility
     */
    supportsNativeCmyk() {
        return false; // jsPDF doesn't natively support CMYK
    }

    /**
     * Create CMYK color information string for PDF metadata
     * @param {string} colorName - Brand color name
     * @returns {string} CMYK color description
     */
    getCmykDescription(colorName) {
        const cmyk = this.getBrandColorCmyk(colorName);
        return `C:${cmyk.c}% M:${cmyk.m}% Y:${cmyk.y}% K:${cmyk.k}%`;
    }
}

// Create global instance for use in namecard generator
window.ColorConversion = ColorConversion;
window.colorConverter = new ColorConversion();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorConversion;
}

console.log('Color conversion utilities loaded and ready');