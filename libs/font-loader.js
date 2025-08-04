/**
 * Font Loader for jsPDF Poppins Font Embedding
 * Loads Poppins font files as Base64 for PDF embedding
 */

class FontLoader {
    constructor() {
        this.fonts = {
            'Poppins-Regular': null,
            'Poppins-Bold': null
        };
        this.loaded = false;
    }

    /**
     * Convert font file to Base64 string
     */
    async fontToBase64(fontPath) {
        try {
            const response = await fetch(fontPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch font: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
            }
            return btoa(binaryString);
        } catch (error) {
            return null;
        }
    }

    /**
     * Load all Poppins fonts
     */
    async loadFonts() {
        if (this.loaded) return true;


        try {
            // Load only Regular and Bold font variants
            const fontPromises = [
                this.fontToBase64('libs/Poppins-Regular.ttf'),
                this.fontToBase64('libs/Poppins-Bold.ttf')
            ];

            const [regular, bold] = await Promise.all(fontPromises);

            let loadedCount = 0;
            if (regular) {
                this.fonts['Poppins-Regular'] = regular;
                loadedCount++;
            }
            if (bold) {
                this.fonts['Poppins-Bold'] = bold;
                loadedCount++;
            }

            // Check if at least regular font loaded
            if (this.fonts['Poppins-Regular']) {
                this.loaded = true;
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Add Poppins fonts to jsPDF instance
     */
    addFontsToPDF(pdf) {
        if (!this.loaded || !pdf) return false;

        try {
            let embeddedFonts = [];
            
            // Add Regular font
            if (this.fonts['Poppins-Regular']) {
                pdf.addFileToVFS('Poppins-Regular.ttf', this.fonts['Poppins-Regular']);
                pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
                embeddedFonts.push('Poppins-Regular');
            } else {
            }

            // Add Bold font  
            if (this.fonts['Poppins-Bold']) {
                pdf.addFileToVFS('Poppins-Bold.ttf', this.fonts['Poppins-Bold']);
                pdf.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
                embeddedFonts.push('Poppins-Bold');
            } else {
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get appropriate font name for jsPDF
     */
    getFontName(weight = 'normal') {
        if (!this.loaded) return 'Helvetica';

        switch (weight) {
            case 'bold':
            case '700':
                return 'Poppins';
            case 'semibold':
            case '600':
                return 'Poppins';
            case 'normal':
            case '400':
            default:
                return 'Poppins';
        }
    }

    /**
     * Get appropriate font style for jsPDF
     */
    getFontStyle(weight = 'normal') {
        if (!this.loaded) {
            return weight === 'bold' || weight === '700' ? 'bold' : 'normal';
        }

        switch (weight) {
            case 'bold':
            case '700':
                return 'bold';
            case 'semibold':
            case '600':
                return 'semibold';
            case 'normal':
            case '400':
            default:
                return 'normal';
        }
    }
}

// Create global font loader instance
window.fontLoader = new FontLoader();