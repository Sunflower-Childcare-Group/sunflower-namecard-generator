// Sunflower Namecard Generator
class NamecardGenerator {
    constructor() {
        this.form = document.getElementById('namecardForm');
        this.canvas = document.getElementById('namecardCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.placeholder = document.getElementById('canvasPlaceholder');
        this.actionButtons = document.getElementById('actionButtons');
        this.statusMessage = document.getElementById('statusMessage');
        this.modal = document.getElementById('instructionsModal');
        
        // Canvas dimensions: 86mm x 54mm at 600 DPI for ultra-high quality
        // Original: 300 DPI = 1016x638, now 600 DPI = 2032x1276
        this.canvasWidth = 2032;
        this.canvasHeight = 1276;
        
        this.uploadedImage = null;
        this.qrCodeDataUrl = null;
        
        // Image manipulation controls
        this.imageZoom = 1.0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        
        // Debounce timer for preview updates
        this.updateTimer = null;
        this.isRendering = false;
        
        this.initializeEventListeners();
        this.loadSavedData();
        this.hideCanvas();
        
        // Check PDF library status on load
        this.checkPDFLibraryStatus();
    }

    checkPDFLibraryStatus() {
        // Check status after a short delay to allow libraries to load
        setTimeout(() => {
            const dependencyCheck = this.checkPDFDependencies();
            if (!dependencyCheck.success && dependencyCheck.error === 'jsPDF library failed to load') {
            } else if (dependencyCheck.success) {
            }
            
            // Update button visibility
            this.updatePDFButtonVisibility();
        }, 1000);
    }

    initializeEventListeners() {
        // Form inputs - real-time preview with debouncing
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type !== 'file') {
                input.addEventListener('input', () => {
                    this.debouncedUpdatePreview();
                });
                input.addEventListener('change', () => {
                    this.debouncedUpdatePreview();
                });
                input.addEventListener('blur', () => {
                    this.saveToLocalStorage();
                    this.debouncedUpdatePreview();
                });
            }
        });

        // Image upload
        const imageInput = document.getElementById('profileImage');
        const uploadArea = document.getElementById('imageUploadArea');
        const removeBtn = document.getElementById('removeImage');
        
        imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleImageDrop(e));
        removeBtn.addEventListener('click', () => this.removeImage());

        // Image manipulation controls
        const zoomSlider = document.getElementById('imageZoom');
        const zoomValue = document.getElementById('zoomValue');
        const moveUp = document.getElementById('moveUp');
        const moveDown = document.getElementById('moveDown');
        const moveLeft = document.getElementById('moveLeft');
        const moveRight = document.getElementById('moveRight');
        const resetPosition = document.getElementById('resetPosition');

        zoomSlider.addEventListener('input', (e) => this.handleZoomChange(e));
        moveUp.addEventListener('click', () => this.moveImage(0, -10));
        moveDown.addEventListener('click', () => this.moveImage(0, 10));
        moveLeft.addEventListener('click', () => this.moveImage(-10, 0));
        moveRight.addEventListener('click', () => this.moveImage(10, 0));
        resetPosition.addEventListener('click', () => this.resetImagePosition());

        // Buttons
        document.getElementById('generateBtn').addEventListener('click', () => this.generateNamecard());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearForm());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadNamecard());
        document.getElementById('downloadPdfBtn').addEventListener('click', () => this.downloadPDF());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('closeModal').addEventListener('click', () => this.hideInstructions());

        // Modal close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideInstructions();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hideInstructions();
            }
        });
    }

    getFormData() {
        return {
            fullName: document.getElementById('fullName')?.value.trim() || '',
            designation: document.getElementById('designation')?.value.trim() || '',
            company: document.getElementById('company')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            mobileNumber: document.getElementById('mobileNumber')?.value.trim() || '',
            officeNumber: document.getElementById('officeNumber')?.value.trim() || '',
            officeAddress: document.getElementById('officeAddress')?.value.trim() || '',
            instagram: document.getElementById('instagram')?.value.trim() || '',
            facebook: document.getElementById('facebook')?.value.trim() || ''
        };
    }

    validateForm(data) {
        const errors = [];
        
        if (!data.fullName) {
            errors.push('Full Name is required');
        }
        
        if (!data.designation) {
            errors.push('Designation is required');
        }
        
        if (!data.company) {
            errors.push('Company is required');
        }
        
        if (!data.email) {
            errors.push('Email Address is required');
        } else if (!this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!data.officeNumber) {
            errors.push('Office Number is required');
        }
        
        if (!data.officeAddress) {
            errors.push('Office Address is required');
        }
        
        if (!this.uploadedImage) {
            errors.push('Profile Image is required');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Image handling
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleImageDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showStatus('Please select a valid image file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.uploadedImage = img;
                this.showImagePreview(e.target.result);
                this.debouncedUpdatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(src) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        const previewImg = document.getElementById('previewImg');
        const imageControls = document.getElementById('imageControls');
        
        previewImg.src = src;
        placeholder.style.display = 'none';
        preview.style.display = 'block';
        imageControls.style.display = 'block';
        
        // Reset image manipulation settings when new image is uploaded
        this.resetImagePosition();
    }

    removeImage() {
        this.uploadedImage = null;
        document.getElementById('profileImage').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('uploadPlaceholder').style.display = 'block';
        document.getElementById('imageControls').style.display = 'none';
        this.resetImagePosition();
        this.debouncedUpdatePreview();
    }

    // Image manipulation methods - instant updates
    handleZoomChange(e) {
        this.imageZoom = parseFloat(e.target.value);
        document.getElementById('zoomValue').textContent = `${this.imageZoom.toFixed(1)}x`;
        this.updatePreviewInstant();
    }

    moveImage(deltaX, deltaY) {
        this.imageOffsetX += deltaX;
        this.imageOffsetY += deltaY;
        this.updatePreviewInstant();
    }

    resetImagePosition() {
        this.imageZoom = 1.0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        
        // Update UI controls
        document.getElementById('imageZoom').value = 1.0;
        document.getElementById('zoomValue').textContent = '1.0x';
        
        if (this.uploadedImage) {
            this.updatePreviewInstant();
        }
    }

    // Instant preview update for image adjustments
    async updatePreviewInstant() {
        if (!this.uploadedImage) return;
        
        // Skip if already rendering to prevent conflicts
        if (this.isRendering) return;
        
        const data = this.getFormData();
        
        // Only update if we have basic data to render
        if (!data.fullName && !data.designation && !data.email && !data.officeAddress) {
            return;
        }

        try {
            await this.renderNamecard(data);
        } catch (error) {
        }
    }

    // vCard QR Code generation
    async generateVCardQR(data) {
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            this.qrCodeDataUrl = null;
            return null;
        }

        // Build vCard in specified order with fixed values
        const vCardFields = [
            'BEGIN:VCARD',
            'VERSION:3.0'
        ];

        // 1. Name (compulsory)
        if (data.fullName) {
            vCardFields.push(`FN:${data.fullName}`);
        }

        // 2. Designation (compulsory)
        if (data.designation) {
            vCardFields.push(`TITLE:${data.designation}`);
        }

        // 3. Company (compulsory)
        if (data.company) {
            vCardFields.push(`ORG:${data.company}`);
        }

        // 4. Address (compulsory)
        if (data.officeAddress) {
            vCardFields.push(`ADR;TYPE=WORK:;;${data.officeAddress.replace(/\n/g, ', ')};;;;`);
        }

        // 5. Mobile number (optional)
        if (data.mobileNumber) {
            vCardFields.push(`TEL;TYPE=CELL:${data.mobileNumber}`);
        }

        // 6. Office number (compulsory)
        if (data.officeNumber) {
            vCardFields.push(`TEL;TYPE=WORK:${data.officeNumber}`);
        }

        // 7. Email (compulsory)
        if (data.email) {
            vCardFields.push(`EMAIL:${data.email}`);
        }

        // 8. Website: www.sunflowerkid.com (fixed)
        vCardFields.push(`URL:https://www.sunflowerkid.com`);

        // 9. Instagram (optional) - format as handle
        if (data.instagram) {
            // Remove @ if user included it
            const instagramHandle = data.instagram.replace(/^@/, '');
            vCardFields.push(`URL;TYPE=Instagram:https://www.instagram.com/${instagramHandle}`);
        }

        // 10. Facebook (optional) - format as full URL
        if (data.facebook) {
            vCardFields.push(`URL;TYPE=Facebook:${data.facebook}`);
        }

        vCardFields.push('END:VCARD');
        
        const vCardData = vCardFields.join('\r\n');

        try {
            
            // Use node-qrcode compatible API with ultra-high resolution for professional quality
            const qrDataUrl = await QRCode.toDataURL(vCardData, {
                width: 800, // Optimized for 24mm print size at 600 DPI
                margin: 1,
                errorCorrectionLevel: 'H', // Highest error correction for better reliability
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            this.qrCodeDataUrl = qrDataUrl;
            return qrDataUrl;
            
        } catch (error) {
            this.qrCodeDataUrl = null;
            return null;
        }
    }

    // Canvas rendering
    hideCanvas() {
        this.canvas.style.display = 'none';
        this.placeholder.style.display = 'block';
        this.actionButtons.style.display = 'none';
    }

    showCanvas() {
        this.canvas.style.display = 'block';
        this.placeholder.style.display = 'none';
        this.actionButtons.style.display = 'block';
        
        // Show/hide PDF button based on availability
        this.updatePDFButtonVisibility();
    }

    updatePDFButtonVisibility() {
        const pdfButton = document.getElementById('downloadPdfBtn');
        if (pdfButton) {
            // Always keep the button enabled and visible, just like the PNG button
            pdfButton.style.display = 'inline-flex';
            pdfButton.disabled = false;
            pdfButton.title = 'Download namecard as PDF for professional printing';
        }
    }

    // Debounced update preview to prevent double rendering
    debouncedUpdatePreview() {
        // Clear any existing timer
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        // Set a new timer to update preview after 300ms of no typing
        this.updateTimer = setTimeout(async () => {
            await this.updatePreview();
        }, 300);
    }

    async updatePreview() {
        // Prevent concurrent renders
        if (this.isRendering) {
            return;
        }
        
        this.isRendering = true;
        
        const data = this.getFormData();
        
        // Check if there's any meaningful data and image is uploaded
        if (!data.fullName && !data.designation && !data.email && !data.officeAddress && !this.uploadedImage) {
            this.hideCanvas();
            this.isRendering = false;
            return;
        }

        this.showCanvas();
        
        try {
            await this.renderNamecard(data);
        } catch (error) {
            // Still show what we can render
        } finally {
            this.isRendering = false;
        }
    }

    async renderNamecard(data) {
        // Clear canvas completely first
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Fill with background color
        this.ctx.fillStyle = '#FFCC00';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // At 600 DPI: 1mm = 23.62 pixels (doubled from 300 DPI)
        const mmToPx = 23.62;

        // Generate and draw QR code first if we have enough data
        let qrGenerated = false;
        if (data.fullName && data.designation && data.company && data.email && data.officeNumber && data.officeAddress) {
            try {
                await this.generateVCardQR(data);
                if (this.qrCodeDataUrl) {
                    await this.drawQRCode();
                    qrGenerated = true;
                }
            } catch (error) {
            }
        }

        // Draw profile image frame (always show grey background to indicate image area)
        this.drawImageFrame();
        
        // Draw profile image if uploaded
        if (this.uploadedImage) {
            this.drawProfileImage();
        }

        // Draw name and designation at exact positions (right-aligned)
        const nameX = 80 * mmToPx; // 80mm from left = 945px (right-aligned reference point)
        
        // Name at y=8mm
        if (data.fullName) {
            const nameY = 8 * mmToPx; // 8mm from top
            const nameText = data.fullName.toUpperCase();
            this.drawText(nameText, nameX, nameY, 'bold 144px Poppins', '#2c2c2c', 'right'); // Doubled font size for 600 DPI
        }

        // Designation at y=15mm
        if (data.designation) {
            const designationY = 15 * mmToPx; // 15mm from top
            const designationText = data.designation.toUpperCase();
            this.drawText(designationText, nameX, designationY, '74px Poppins', '#2c2c2c', 'right'); // Doubled font size for 600 DPI
        }

        // Draw contact information at exact positions
        const iconX = 6 * mmToPx; // Icons at 6mm from left = 71px
        const textX = 9 * mmToPx + 5; // Text at 9mm from left + 5px mini spacing = 111px
        
        // Email at y=35mm (back to original PNG positioning)
        if (data.email) {
            const emailY = 35 * mmToPx; // 35mm from top = 413px
            await this.drawContactLineWithIconAndText('email', data.email, iconX, textX, emailY, emailY);
        }
        
        // Mobile/Office numbers at y=38.5mm (optimal spacing from email)
        const phoneNumbers = [];
        if (data.mobileNumber) phoneNumbers.push(data.mobileNumber);
        if (data.officeNumber) phoneNumbers.push(data.officeNumber);
        
        if (phoneNumbers.length > 0) {
            const phoneY = 38.5 * mmToPx; // 38.5mm from top = 455px (optimal spacing)
            const phoneText = phoneNumbers.join(' | ');
            await this.drawContactLineWithIconAndText('phone', phoneText, iconX, textX, phoneY, phoneY);
        }

        // Address at y=42mm (back to original PNG positioning)
        if (data.officeAddress) {
            const addressY = 42 * mmToPx; // 42mm from top = 496px
            const addressLines = data.officeAddress.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
            
            // Calculate middle position for icon based on number of lines
            const totalLines = addressLines.length;
            const lineSpacing = 60; // 60px spacing between lines (doubled for 600 DPI)
            const textHeight = 46; // 46px font size (doubled for 600 DPI)
            
            // Find the middle of all address text lines
            const firstLineCenter = addressY + (textHeight / 2);
            const lastLineCenter = addressY + ((totalLines - 1) * lineSpacing) + (textHeight / 2);
            const overallTextCenter = (firstLineCenter + lastLineCenter) / 2;
            
            // Debug log for icon positioning
            
            // Draw location icon centered with the overall text
            await this.drawLocationIcon(iconX, overallTextCenter - 15); // -15 because drawLocationIcon expects top Y
            
            // Draw all address lines
            for (let i = 0; i < addressLines.length; i++) {
                const lineY = addressY + (i * lineSpacing);
                this.drawText(addressLines[i], textX, lineY, '46px Poppins', '#2c2c2c', 'left'); // Doubled font size for 600 DPI
            }
        }

        // Debug info
        if (!qrGenerated && data.fullName && data.designation && data.company && data.email && data.officeNumber && data.officeAddress) {
        }
    }

    drawImageFrame() {
        // Draw grey background to show exact image frame boundaries
        const mmToPx = 23.62; // 600 DPI conversion
        const frameX = 6 * mmToPx; // 6mm from left
        const frameY = 7 * mmToPx; // 7mm from top
        const frameWidth = 20 * mmToPx; // 20mm width
        const frameHeight = 24 * mmToPx; // 24mm height

        this.ctx.save();
        this.ctx.fillStyle = '#d6d6d6'; // Light grey background
        this.ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
        this.ctx.restore();
    }

    drawProfileImage() {
        // Exact positioning: 7mm from top, 6mm from left
        // Frame size: 20mm width x 24mm height 
        // At 600 DPI: 1mm = 23.62 pixels
        const mmToPx = 23.62;
        
        const frameX = 6 * mmToPx; // 6mm from left
        const frameY = 7 * mmToPx; // 7mm from top
        const frameWidth = 20 * mmToPx; // 20mm width
        const frameHeight = 24 * mmToPx; // 24mm height

        // Image manipulation variables
        const imageZoom = this.imageZoom || 1.0;
        const imageOffsetX = this.imageOffsetX || 0;
        const imageOffsetY = this.imageOffsetY || 0;

        // Draw with clipping to maintain exact frame bounds
        this.ctx.save();
        
        // Create clipping rectangle for exact frame dimensions
        this.ctx.beginPath();
        this.ctx.rect(frameX, frameY, frameWidth, frameHeight);
        this.ctx.clip();
        
        // Calculate image dimensions with zoom
        const imgAspect = this.uploadedImage.width / this.uploadedImage.height;
        const frameAspect = frameWidth / frameHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        // Scale image to fill frame (crop to fit)
        if (imgAspect > frameAspect) {
            // Wide image - fit to height and crop sides
            drawHeight = frameHeight * imageZoom;
            drawWidth = drawHeight * imgAspect;
            drawX = frameX - (drawWidth - frameWidth) / 2 + imageOffsetX;
            drawY = frameY + imageOffsetY;
        } else {
            // Tall image - fit to width and crop top/bottom
            drawWidth = frameWidth * imageZoom;
            drawHeight = drawWidth / imgAspect;
            drawX = frameX + imageOffsetX;
            drawY = frameY - (drawHeight - frameHeight) / 2 + imageOffsetY;
        }

        // Draw the image
        this.ctx.drawImage(this.uploadedImage, drawX, drawY, drawWidth, drawHeight);
        
        this.ctx.restore();
    }

    drawText(text, x, y, font, color, align = 'left') {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawContactLineWithIcon(iconType, text, x, y) {
        // Draw icon circle background (like in sample)
        this.ctx.fillStyle = '#2c2c2c';
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y + 15, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw white icon based on type
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let iconChar = '';
        switch(iconType) {
            case 'email':
                iconChar = '✉';
                break;
            case 'phone':
                iconChar = '📞';
                break;
            case 'location':
                iconChar = '📍';
                break;
        }
        
        this.ctx.fillText(iconChar, x + 15, y + 15);
        
        // Draw text (left-aligned)
        this.drawText(text, x + 50, y, '22px Poppins', '#2c2c2c', 'left');
    }

    async drawContactLineWithIconAndText(iconType, text, iconX, textX, iconY, textY) {
        // Use same Y for both icon and text if textY not provided (backward compatibility)
        if (textY === undefined) {
            textY = iconY;
        }
        
        // Calculate text height to find its center
        const textHeight = 46; // 46px font size (doubled for 600 DPI)
        const textCenterY = textY + (textHeight / 2);
        
        // Position icon center to align with text center
        const iconCenterY = textCenterY;
        
        // Draw icon image based on type
        let iconPath = '';
        switch(iconType) {
            case 'email':
                iconPath = './email.svg';
                break;
            case 'phone':
                iconPath = './number.svg';
                break;
            case 'location':
                iconPath = './location.svg';
                break;
        }
        
        if (iconPath) {
            await this.drawIconImage(iconPath, iconX + 15, iconCenterY);
        }
        
        // Draw text at textX position (standard top baseline)
        this.drawText(text, textX, textY, '46px Poppins', '#2c2c2c', 'left'); // Doubled font size for 600 DPI
    }

    async drawLocationIcon(iconX, y) {
        // Draw location icon image
        await this.drawIconImage('./location.svg', iconX + 15, y + 15);
    }

    async drawIconImage(imagePath, centerX, centerY) {
        return new Promise(async (resolve) => {
            try {
                // For SVG files, use enhanced rendering approach
                if (imagePath.endsWith('.svg')) {
                    const response = await fetch(imagePath);
                    let svgText = await response.text();
                    
                    // Create data URL with proper encoding
                    const encodedSvg = encodeURIComponent(svgText);
                    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
                    
                    const img = new Image();
                    img.onload = () => {
                        const iconSize = 60; // Size of the icon (doubled for 600 DPI)
                        
                        // Save current canvas state
                        this.ctx.save();
                        
                        // Enable high-quality rendering for PNG export too
                        this.ctx.imageSmoothingEnabled = true;
                        this.ctx.imageSmoothingQuality = 'high';
                        
                        // Try different rendering approaches for better PDF compatibility
                        try {
                            // Method 1: Direct drawing with multiply blend mode
                            this.ctx.globalCompositeOperation = 'multiply';
                            this.ctx.drawImage(img, centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize);
                        } catch (error) {
                            // Method 2: Fallback to normal rendering
                            this.ctx.globalCompositeOperation = 'source-over';
                            this.ctx.drawImage(img, centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize);
                        }
                        
                        // Restore canvas state
                        this.ctx.restore();
                        resolve();
                    };
                    img.onerror = () => {
                        this.drawFallbackIcon(imagePath, centerX, centerY);
                        resolve();
                    };
                    img.crossOrigin = 'anonymous';
                    img.src = dataUrl;
                } else {
                    // Handle regular image files (PNG, etc.)
                    const img = new Image();
                    img.onload = () => {
                        const iconSize = 60; // Size of the icon (doubled for 600 DPI)
                        this.ctx.drawImage(img, centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize);
                        resolve();
                    };
                    img.onerror = () => {
                        this.drawFallbackIcon(imagePath, centerX, centerY);
                        resolve();
                    };
                    // Set crossOrigin to allow canvas export
                    img.crossOrigin = 'anonymous';
                    img.src = imagePath;
                }
            } catch (error) {
                this.drawFallbackIcon(imagePath, centerX, centerY);
                resolve();
            }
        });
    }

    drawFallbackIcon(imagePath, centerX, centerY) {
        // Fallback to emoji if image fails to load
        this.ctx.fillStyle = '#2c2c2c';
        this.ctx.font = '36px Arial'; // Increased size for 600 DPI
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        let fallbackChar = '?';
        if (imagePath.includes('email')) fallbackChar = '✉';
        else if (imagePath.includes('number')) fallbackChar = '📞';
        else if (imagePath.includes('location')) fallbackChar = '📍';
        this.ctx.fillText(fallbackChar, centerX, centerY);
    }

    async drawQRCode() {
        if (!this.qrCodeDataUrl) {
            return;
        }

        // Exact QR code positioning: x=56-80mm, y=22-47mm
        // At 600 DPI: 1mm = 23.62 pixels
        const mmToPx = 23.62;
        const x = 56 * mmToPx; // 56mm from left
        const y = 22 * mmToPx; // 22mm from top
        const qrSize = (24 * mmToPx) - 6; // 24mm width minus 6px (doubled for 600 DPI)

        return new Promise((resolve, reject) => {
            const qrImg = new Image();
            
            qrImg.onload = () => {
                try {
                    
                    // Draw white background for QR code
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(x - 10, y - 10, qrSize + 20, qrSize + 20);
                    
                    // Draw QR code
                    this.ctx.drawImage(qrImg, x, y, qrSize, qrSize);
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            qrImg.onerror = (error) => {
                reject(error);
            };
            
            // Set crossOrigin before setting src
            qrImg.crossOrigin = 'anonymous';
            qrImg.src = this.qrCodeDataUrl;
            
        });
    }

    async generateNamecard() {
        const data = this.getFormData();
        const errors = this.validateForm(data);
        
        if (errors.length > 0) {
            this.showStatus('Please fix the following errors:\n\n' + errors.join('\n'), 'error');
            return;
        }
        
        this.showStatus('Generating namecard...', 'info');
        
        // Add loading state
        this.canvas.parentElement.classList.add('loading');
        
        try {
            await this.updatePreview();
            this.saveToLocalStorage();
            this.showStatus('✅ Namecard generated successfully!', 'success');
        } catch (error) {
            this.showStatus('❌ Failed to generate namecard. Please try again.', 'error');
        } finally {
            this.canvas.parentElement.classList.remove('loading');
        }
    }

    downloadNamecard() {
        const data = this.getFormData();
        const errors = this.validateForm(data);
        
        if (errors.length > 0) {
            this.showStatus('Please fix the following errors before downloading:\n\n' + errors.join('\n'), 'error');
            return;
        }
        
        try {
            // Get canvas data as blob with proper DPI
            this.canvas.toBlob((blob) => {
                if (!blob) {
                    this.showStatus('❌ Download failed. Canvas export error.', 'error');
                    return;
                }
                // Create a new canvas with DPI metadata
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    
                    // Add 300 DPI metadata to PNG
                    const pngWithDPI = this.addDPIToPNG(uint8Array, 300);
                    
                    // Create blob with DPI metadata
                    const finalBlob = new Blob([pngWithDPI], { type: 'image/png' });
                    
                    // Create download link
                    const link = document.createElement('a');
                    link.download = `${data.fullName.replace(/\s+/g, '_')}_namecard.png`;
                    link.href = URL.createObjectURL(finalBlob);
                    
                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Clean up
                    URL.revokeObjectURL(link.href);
                    
                    this.showStatus('💾 Namecard downloaded successfully!', 'success');
                };
                reader.readAsArrayBuffer(blob);
            }, 'image/png', 1.0);
            
        } catch (error) {
            // Try fallback method using toDataURL
            try {
                const dataUrl = this.canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.download = `${data.fullName.replace(/\s+/g, '_')}_namecard.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.showStatus('💾 Namecard downloaded successfully!', 'success');
            } catch (fallbackError) {
                this.showStatus('❌ Download failed. Please try again.', 'error');
            }
        }
    }

    downloadPDF() {
        const data = this.getFormData();
        const errors = this.validateForm(data);
        
        if (errors.length > 0) {
            this.showStatus('Please fix the following errors before downloading PDF:\n\n' + errors.join('\n'), 'error');
            return;
        }
        
        // Check dependencies
        const dependencyCheck = this.checkPDFDependencies();
        
        if (!dependencyCheck.success) {
            // Show error with retry option
            this.showPDFLoadError(dependencyCheck.error);
            return;
        }
        
        this.showStatus('🔄 Generating PDF for print...', 'info');
        
        try {
            this.generatePDF(data);
        } catch (error) {
            this.handlePDFError(error);
        }
    }

    showPDFLoadError(error) {
        let message = `❌ PDF generation not available: ${error}\n\n`;
        
        if (error === 'jsPDF library failed to load') {
            message += '🔄 Click here to retry loading PDF library';
            
            // Create clickable status message
            const statusDiv = this.statusMessage;
            statusDiv.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
            statusDiv.className = 'status-message error clickable';
            statusDiv.style.display = 'block';
            statusDiv.style.cursor = 'pointer';
            
            // Add click handler for retry
            statusDiv.onclick = () => {
                this.retryLoadingJsPDF();
            };
            
            // Don't auto-hide this message
            return;
        }
        
        message += '💡 Please use PNG download instead.';
        this.showStatus(message, 'error');
    }

    retryLoadingJsPDF() {
        // First check if jsPDF is already loaded
        const dependencyCheck = this.checkPDFDependencies();
        if (dependencyCheck.success) {
            this.showStatus('✅ PDF library is already loaded! You can now download PDFs.', 'success');
            this.updatePDFButtonVisibility();
            return;
        }
        
        this.showStatus('🔄 Retrying to load PDF library...', 'info');
        
        // Reset and retry loading only if not already loaded
        window.jsPDFLoadAttempt = 0;
        window.loadJsPDFFallback();
        
        // Check again after a delay
        setTimeout(() => {
            const dependencyCheck = this.checkPDFDependencies();
            if (dependencyCheck.success) {
                this.showStatus('✅ PDF library loaded successfully! You can now download PDFs.', 'success');
                this.updatePDFButtonVisibility();
            } else {
                this.showStatus('❌ Failed to load PDF library. Please refresh the page or use PNG download.', 'error');
            }
        }, 3000);
    }

    checkPDFDependencies() {
        // Check if jsPDF is available (v3.x structure)
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            return {
                success: false,
                error: 'jsPDF library failed to load'
            };
        }

        // Check if color converter is available
        if (typeof window.colorConverter === 'undefined') {
        }

        // Check browser capabilities
        if (!document.createElement('canvas').getContext) {
            return {
                success: false,
                error: 'Canvas support not available in this browser'
            };
        }

        return { success: true };
    }

    handlePDFError(error) {
        let errorMessage = '❌ PDF generation failed. ';
        let suggestion = 'Please try PNG download instead.';

        // Provide specific error messages based on error type
        if (error.name === 'QuotaExceededError' || error.message.includes('memory')) {
            errorMessage += 'Not enough memory available.';
            suggestion = 'Try refreshing the page and generating a simpler namecard, or use PNG download.';
        } else if (error.message.includes('network') || error.message.includes('load')) {
            errorMessage += 'Network or loading error.';
            suggestion = 'Check your internet connection and try again, or use PNG download.';
        } else if (error.message.includes('canvas')) {
            errorMessage += 'Canvas rendering error.';
            suggestion = 'Try regenerating the namecard or use PNG download.';
        } else {
            errorMessage += 'Unexpected error occurred.';
        }

        this.showStatus(`${errorMessage}\n\n💡 ${suggestion}`, 'error');

        // Error handled silently
    }

    async generatePDF(data) {
        // Show loading state
        this.canvas.parentElement.classList.add('loading');
        
        try {
            // Load Poppins fonts first
            await window.fontLoader.loadFonts();
            
            // Create jsPDF instance with exact business card dimensions
            // 86mm x 54mm in points (1 point = 0.352778mm)
            const { jsPDF } = window.jspdf; // v3.x structure
            const mmToPoints = 2.83465; // 1mm = 2.83465 points
            const cardWidth = 86; // mm
            const cardHeight = 54; // mm
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [cardWidth, cardHeight],
                compress: true, // Enable compression for reduced file size
                putOnlyUsedFonts: true, // Only embed fonts that are actually used
                floatPrecision: 8, // Balanced precision for optimal file size
                colorSpace: 'cmyk' // Enable CMYK color space
            });
            
            // Add Poppins fonts to PDF (with Helvetica as fallback)
            window.fontLoader.addFontsToPDF(pdf);
            
            // Set comprehensive PDF metadata for print
            pdf.setProperties({
                title: `${data.fullName}_Namecard_Print_High_Quality`,
                subject: 'Sunflower Business Card - Professional Print Ready - 600 DPI',
                author: 'Sunflower Namecard Generator v2.0',
                keywords: 'business card, print, CMYK, professional, high quality, 600dpi, sunflower',
                creator: 'Sunflower Childcare Group Pte Ltd',
                producer: 'Sunflower Childcare Group Business Card Generator',
                creationDate: new Date()
            });
            
            // Producer is set in the initial setProperties() call above
            
            // Add custom metadata for print specifications
            pdf.setDocumentProperties({
                pageLayout: 'SinglePage',
                pageMode: 'UseNone',
                displayDocTitle: true
            });
            
            // Professional print-ready PDF without visible specs
            
            // Instead of embedding the entire canvas as image, let's render vector elements
            await this.renderVectorPDF(pdf, data, cardWidth, cardHeight);
            
            // Add color profile information as metadata (for print shop reference)
            const colorInfo = this.getPrintColorInfo();
            // Note: jsPDF doesn't support custom metadata in setProperties
            // The color info will be embedded in the PDF structure
            
            // Generate filename
            const filename = `${data.fullName.replace(/\s+/g, '_')}_namecard_print.pdf`;
            
            // Save the PDF
            pdf.save(filename);
            
            this.showStatus('📄 Print-ready PDF downloaded successfully!', 'success');
            
        } catch (error) {
            this.showStatus('❌ PDF generation failed. Please try again or use PNG download.', 'error');
        } finally {
            // Remove loading state
            this.canvas.parentElement.classList.remove('loading');
        }
    }

    getCanvasImageForPrint() {
        // Get high-quality image data from canvas
        const imageData = this.canvas.toDataURL('image/png', 1.0);
        
        // Apply color correction if color converter is available
        if (window.colorConverter) {
            // Create temporary canvas for color correction
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw original canvas to temp canvas
            tempCtx.drawImage(this.canvas, 0, 0);
            
            // Get image data and apply color correction
            const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const correctedData = window.colorConverter.applyPrintColorCorrection(imgData);
            
            // Put corrected data back
            tempCtx.putImageData(correctedData, 0, 0);
            
            return tempCanvas.toDataURL('image/png', 1.0);
        }
        
        return imageData;
    }

    getPrintColorInfo() {
        if (!window.colorConverter) {
            return 'Standard RGB colors';
        }
        
        // Generate color information for print shop
        const yellowCmyk = window.colorConverter.getCmykDescription('sunflowerYellow');
        const textCmyk = window.colorConverter.getCmykDescription('darkText');
        
        return `Background: ${yellowCmyk}, Text: ${textCmyk}`;
    }

    async renderVectorPDF(pdf, data, cardWidth, cardHeight) {
        // Note: PDF uses mm units directly, no conversion needed for positioning
        
        // Set background color (Sunflower Yellow in true CMYK)
        pdf.setFillColor(0.0, 0.2, 1.0, 0.0); // CMYK: C=0%, M=20%, Y=100%, K=0%
        pdf.rect(0, 0, cardWidth, cardHeight, 'F');
        
        // Add profile image at high quality
        if (this.uploadedImage) {
            await this.addHighQualityImage(pdf);
        }
        
        // Add vector text elements
        this.addVectorText(pdf, data);
        
        // Add QR code at high quality
        if (this.qrCodeDataUrl) {
            await this.addHighQualityQRCode(pdf);
        }
        
        // Add contact icons (vector if possible, high-res if not)
        await this.addContactIcons(pdf, data);
    }

    async addHighQualityImage(pdf) {
        const mmToPx = 23.62; // 600 DPI conversion for canvas rendering
        
        // Profile image positioning (from canvas coordinates)
        const frameX = 6; // 6mm from left
        const frameY = 7; // 7mm from top  
        const frameWidth = 20; // 20mm width
        const frameHeight = 24; // 24mm height
        
        // Create high-resolution version of the image
        const highResCanvas = document.createElement('canvas');
        const highResCtx = highResCanvas.getContext('2d');
        
        // Scale up for print quality (1.5x resolution for optimal size/quality balance)
        const scale = 1.5;
        highResCanvas.width = frameWidth * mmToPx * scale;
        highResCanvas.height = frameHeight * mmToPx * scale;
        
        // Apply image transformations at high resolution
        const imageZoom = this.imageZoom || 1.0;
        const imageOffsetX = (this.imageOffsetX || 0) * scale;
        const imageOffsetY = (this.imageOffsetY || 0) * scale;
        
        highResCtx.save();
        
        // Calculate scaled dimensions
        const imgAspect = this.uploadedImage.width / this.uploadedImage.height;
        const frameAspect = frameWidth / frameHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > frameAspect) {
            drawHeight = highResCanvas.height * imageZoom;
            drawWidth = drawHeight * imgAspect;
            drawX = -(drawWidth - highResCanvas.width) / 2 + imageOffsetX;
            drawY = imageOffsetY;
        } else {
            drawWidth = highResCanvas.width * imageZoom;
            drawHeight = drawWidth / imgAspect;
            drawX = imageOffsetX;
            drawY = -(drawHeight - highResCanvas.height) / 2 + imageOffsetY;
        }
        
        // Draw high-res image
        highResCtx.drawImage(this.uploadedImage, drawX, drawY, drawWidth, drawHeight);
        
        // Apply color correction
        if (window.colorConverter) {
            const imageData = highResCtx.getImageData(0, 0, highResCanvas.width, highResCanvas.height);
            const correctedData = window.colorConverter.applyPrintColorCorrection(imageData);
            highResCtx.putImageData(correctedData, 0, 0);
        }
        
        highResCtx.restore();
        
        // Add to PDF with lossless quality (PNG format)
        const highResImageData = highResCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(
            highResImageData,
            'PNG',
            frameX,
            frameY,
            frameWidth,
            frameHeight,
            undefined,
            'NONE' // No compression for maximum quality
        );
    }

    addVectorText(pdf, data) {
        // Set text color (dark gray in true CMYK)
        pdf.setTextColor(0.0, 0.0, 0.0, 0.83); // CMYK: C=0%, M=0%, Y=0%, K=83%
        
        // Helper function to convert canvas 'top' baseline positioning to jsPDF baseline positioning
        const adjustYForBaseline = (y, fontSize) => {
            // jsPDF positions text from baseline, canvas uses 'top'
            // Current: 0.39" (too low) vs Canva: 0.32" (correct)
            // Reduce the adjustment to match Canva positioning
            return y + (fontSize * 0.176389); // Reduced conversion factor (half of 0.352778)
        };
        
        // Define consistent right-alignment reference point
        const rightAlignX = 81; // 81mm from left (balanced positioning)
        
        // Use Poppins font with Helvetica as fallback
        const fontName = window.fontLoader.getFontName('bold');
        const fontStyle = window.fontLoader.getFontStyle('bold');
        
        try {
            pdf.setFont(fontName, fontStyle);
        } catch (error) {
            pdf.setFont('helvetica', 'bold');
        }
        
        // Name (large, bold, right-aligned)
        if (data.fullName) {
            const fontSize = 18.1;
            pdf.setFontSize(fontSize); // Match Canva font size
            const nameText = data.fullName.toUpperCase();
            const nameY = adjustYForBaseline(8, fontSize); // 8mm from top (canvas positioning)
            
            // Measure text width for right alignment
            const textWidth = pdf.getTextWidth(nameText);
            pdf.text(nameText, rightAlignX - textWidth, nameY);
        }
        
        // Designation (medium, right-aligned)
        if (data.designation) {
            const fontName = window.fontLoader.getFontName('normal');
            const fontStyle = window.fontLoader.getFontStyle('normal');
            
            try {
                pdf.setFont(fontName, fontStyle);
            } catch (error) {
                    pdf.setFont('helvetica', 'normal');
            }
            
            const fontSize = 9.3;
            pdf.setFontSize(fontSize); // Match Canva font size
            const designationText = data.designation.toUpperCase();
            const designationY = adjustYForBaseline(15, fontSize); // 15mm from top (canvas positioning)
            
            // Use same right-alignment reference point as name
            const textWidth = pdf.getTextWidth(designationText);
            pdf.text(designationText, rightAlignX - textWidth, designationY);
        }
        
        // Contact information (smaller, left-aligned)
        const normalFontName = window.fontLoader.getFontName('normal');
        const normalFontStyle = window.fontLoader.getFontStyle('normal');
        
        try {
            pdf.setFont(normalFontName, normalFontStyle);
        } catch (error) {
            pdf.setFont('helvetica', 'normal');
        }
        
        pdf.setFontSize(5.7); // Match Canva font size
        
        // Exact PNG text positioning: 9mm + 5px
        // At 600 DPI: 5px ÷ 23.62 = 0.212mm
        const textX = 9 + 0.212; // 9.212mm (exact match to PNG)
        
        let currentY = 35;
        
        // Calculate dynamic positioning based on address alignment with QR code
        const qrBottom = 46; // QR code bottom edge
        const contactSpacing = 3.5; // 3.5mm spacing between contact elements
        
        // Get address line count to calculate starting position
        let addressStartY = qrBottom; // Default for single line
        if (data.officeAddress) {
            const addressLines = data.officeAddress.split('\n').filter(line => line.trim() !== '');
            addressStartY = qrBottom - ((addressLines.length - 1) * 2.54);
        }
        
        // Calculate phone and email positions relative to address
        const phoneY = addressStartY - contactSpacing;
        const emailY = phoneY - contactSpacing;
        
        // Email - dynamically positioned
        if (data.email) {
            pdf.text(data.email, textX, adjustYForBaseline(emailY, 5.7));
        }
        
        // Phone numbers - dynamically positioned
        const phoneNumbers = [];
        if (data.mobileNumber) phoneNumbers.push(data.mobileNumber);
        if (data.officeNumber) phoneNumbers.push(data.officeNumber);
        
        if (phoneNumbers.length > 0) {
            const phoneText = phoneNumbers.join(' | ');
            pdf.text(phoneText, textX, adjustYForBaseline(phoneY, 5.7));
        }
        
        // Address - dynamically positioned so last line aligns with QR code bottom (46mm)
        if (data.officeAddress) {
            const addressLines = data.officeAddress.split('\n').filter(line => line.trim() !== '');
            const totalLines = addressLines.length;
            const lineSpacing = 2.54; // 2.54mm spacing between lines
            const qrBottom = 46; // QR code bottom edge
            
            // Calculate starting position so last line ends at QR bottom
            let addressY = qrBottom - ((totalLines - 1) * lineSpacing);
            
            addressLines.forEach(line => {
                pdf.text(line, textX, adjustYForBaseline(addressY, 5.7));
                addressY += lineSpacing;
            });
        }
    }

    async addHighQualityQRCode(pdf) {
        // QR code positioning (from canvas coordinates)
        const qrX = 56; // 56mm from left
        const qrY = 22; // 22mm from top
        const qrSize = 24; // 24mm size
        
        // Create high-resolution QR code
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        return new Promise((resolve) => {
            qrImg.onload = () => {
                // Add white background for QR code
                pdf.setFillColor(255, 255, 255);
                pdf.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'F');
                
                // Add QR code with no compression for maximum quality
                pdf.addImage(
                    this.qrCodeDataUrl,
                    'PNG',
                    qrX,
                    qrY,
                    qrSize,
                    qrSize,
                    undefined,
                    'NONE'
                );
                resolve();
            };
            qrImg.onerror = () => resolve(); // Continue without QR code if failed
            qrImg.src = this.qrCodeDataUrl;
        });
    }

    async addContactIcons(pdf, data) {
        // Exact positioning to match PNG at 600 DPI
        const iconCenterX = 6.635; // Exact center X position in mm (matches PNG: 6mm + 15px offset)
        const iconSize = 2.54; // 60px converted to mm at 600 DPI
        
        // Calculate dynamic icon positioning to match text alignment
        const qrBottom = 46; // QR code bottom edge
        const contactSpacing = 3.5; // 3.5mm spacing between contact elements
        const baselineOffset = 0.254; // 0.01 inch for icon alignment
        
        // Get address line count to calculate starting position
        let addressStartY = qrBottom; // Default for single line
        if (data.officeAddress) {
            const addressLines = data.officeAddress.split('\n').filter(line => line.trim() !== '');
            addressStartY = qrBottom - ((addressLines.length - 1) * 2.54);
        }
        
        // Calculate positions relative to address
        const phoneIconY = addressStartY - contactSpacing + baselineOffset;
        const emailIconY = phoneIconY - contactSpacing;
        
        if (data.email) {
            // Email icon dynamically positioned
            await this.addSVGIconToPDF(pdf, './email.svg', iconCenterX, emailIconY, iconSize);
        }
        
        if (data.mobileNumber || data.officeNumber) {
            // Phone icon dynamically positioned
            await this.addSVGIconToPDF(pdf, './number.svg', iconCenterX, phoneIconY, iconSize);
        }
        
        if (data.officeAddress) {
            // Address icon - center between all address lines
            const addressLines = data.officeAddress.split('\n').filter(line => line.trim() !== '');
            const totalLines = addressLines.length;
            const lineSpacing = 2.54; // 2.54mm spacing between lines
            
            if (totalLines === 1) {
                // Single line: align with the line
                await this.addSVGIconToPDF(pdf, './location.svg', iconCenterX, addressStartY + baselineOffset, iconSize);
            } else {
                // Multiple lines: center icon between first and last line
                const firstLineY = addressStartY;
                const lastLineY = addressStartY + ((totalLines - 1) * lineSpacing);
                const centerY = (firstLineY + lastLineY) / 2 + baselineOffset;
                await this.addSVGIconToPDF(pdf, './location.svg', iconCenterX, centerY, iconSize);
            }
        }
    }

    async addSVGIconToPDF(pdf, iconPath, x, y, size) {
        try {
            // Fetch the SVG content
            const response = await fetch(iconPath);
            const svgText = await response.text();
            
            // Create a temporary canvas to render the SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Ultra-high resolution for PDF quality (10x scale for crisp vector rendering)
            const scale = 10;
            const pixelSize = size * 23.62 * scale; // Convert mm to pixels at ultra-high res
            canvas.width = pixelSize;
            canvas.height = pixelSize;
            
            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Create image from SVG data
            const encodedSvg = encodeURIComponent(svgText);
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
            
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Clear canvas with transparent background
                    ctx.clearRect(0, 0, pixelSize, pixelSize);
                    
                    // Draw SVG to canvas
                    ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
                    
                    // Convert canvas to high-quality image data for PDF
                    const imageData = canvas.toDataURL('image/png', 1.0); // Maximum quality
                    
                    // Add to PDF
                    pdf.addImage(imageData, 'PNG', x - size/2, y - size/2, size, size);
                    
                    resolve();
                };
                img.onerror = () => {
                    // Fallback to simple circle if SVG fails
                    pdf.setFillColor(44, 44, 44);
                    pdf.circle(x, y, size/2, 'F');
                    resolve();
                };
                img.crossOrigin = 'anonymous';
                img.src = dataUrl;
            });
        } catch (error) {
            // Fallback to simple circle
            pdf.setFillColor(44, 44, 44);
            pdf.circle(x, y, size/2, 'F');
        }
    }

    // Add DPI metadata to PNG file
    addDPIToPNG(pngData, dpi) {
        // Convert DPI to pixels per meter (PNG uses pixels per meter)
        const pixelsPerMeter = Math.round(dpi * 39.3701); // 1 inch = 39.3701 pixels per meter at 1 DPI
        
        // Create pHYs chunk (physical pixel dimensions)
        const pHYsChunk = new Uint8Array(21);
        const view = new DataView(pHYsChunk.buffer);
        
        // Chunk length (9 bytes)
        view.setUint32(0, 9, false);
        
        // Chunk type 'pHYs'
        pHYsChunk[4] = 0x70; // 'p'
        pHYsChunk[5] = 0x48; // 'H'
        pHYsChunk[6] = 0x59; // 'Y'
        pHYsChunk[7] = 0x73; // 's'
        
        // Pixels per unit, X axis (4 bytes)
        view.setUint32(8, pixelsPerMeter, false);
        
        // Pixels per unit, Y axis (4 bytes)
        view.setUint32(12, pixelsPerMeter, false);
        
        // Unit specifier (1 = meters)
        pHYsChunk[16] = 1;
        
        // Calculate CRC32 for the chunk data
        const crc = this.calculateCRC32(pHYsChunk.slice(4, 17));
        view.setUint32(17, crc, false);
        
        // Find IDAT chunk position in PNG
        let idatPos = -1;
        for (let i = 8; i < pngData.length - 4; i++) {
            if (pngData[i] === 0x49 && pngData[i + 1] === 0x44 && 
                pngData[i + 2] === 0x41 && pngData[i + 3] === 0x54) {
                idatPos = i - 4; // Position of length field before IDAT
                break;
            }
        }
        
        if (idatPos === -1) {
            return pngData;
        }
        
        // Insert pHYs chunk before IDAT
        const result = new Uint8Array(pngData.length + pHYsChunk.length);
        result.set(pngData.slice(0, idatPos));
        result.set(pHYsChunk, idatPos);
        result.set(pngData.slice(idatPos), idatPos + pHYsChunk.length);
        
        return result;
    }

    // Calculate CRC32 checksum
    calculateCRC32(data) {
        const crcTable = this.makeCRCTable();
        let crc = 0 ^ (-1);
        
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
        }
        
        return (crc ^ (-1)) >>> 0;
    }

    // Generate CRC32 lookup table
    makeCRCTable() {
        if (this.crcTable) return this.crcTable;
        
        let c;
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        this.crcTable = crcTable;
        return crcTable;
    }

    showStatus(message, type = 'success') {
        this.statusMessage.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 5000);
    }

    clearForm() {
        if (confirm('Are you sure you want to clear all fields and uploaded image?')) {
            this.form.reset();
            this.removeImage();
            this.hideCanvas();
            this.clearLocalStorage();
            this.showStatus('🗑️ Form cleared!', 'info');
        }
    }

    showInstructions() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideInstructions() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    saveToLocalStorage() {
        const data = this.getFormData();
        localStorage.setItem('sunflowerNamecardData', JSON.stringify(data));
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('sunflowerNamecardData');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Populate form fields
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && data[key]) {
                        element.value = data[key];
                    }
                });
                
                // Update preview if there's data
                if (data.fullName || data.designation || data.email) {
                    setTimeout(async () => {
                        await this.updatePreview();
                    }, 100);
                }
            }
        } catch (error) {
            this.clearLocalStorage();
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('sunflowerNamecardData');
    }
}

// Font loading and initialization
async function loadPoppinsFont() {
    try {
        // Check if Poppins is already loaded
        if (document.fonts.check('16px Poppins')) {
            return;
        }
        
        // Wait for Google Fonts to load
        await document.fonts.ready;
        
        // Give it a moment to ensure fonts are ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
    }
}

// Function to check if QRCode library is loaded
function waitForQRCode() {
    return new Promise((resolve) => {
        if (typeof QRCode !== 'undefined') {
            resolve();
            return;
        }
        
        // Poll every 100ms until QRCode is available
        const interval = setInterval(() => {
            if (typeof QRCode !== 'undefined') {
                clearInterval(interval);
                resolve();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(interval);
            resolve(); // Continue anyway
        }, 10000);
    });
}

// Initialize the application when everything is loaded
window.addEventListener('load', async () => {
    
    // Wait for QRCode library to load
    await waitForQRCode();
    
    // Load Poppins font
    await loadPoppinsFont();
    
    // Initialize the namecard generator and store globally
    window.namecardGenerator = new NamecardGenerator();
});

// Fallback: Also try on DOMContentLoaded in case window load takes too long
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for scripts to load
    setTimeout(async () => {
        if (window.namecardGenerator) {
            return; // Already initialized
        }
        
        
        // Wait for QRCode library to load
        await waitForQRCode();
        
        // Load Poppins font
        await loadPoppinsFont();
        
        // Initialize the namecard generator and store globally
        window.namecardGenerator = new NamecardGenerator();
    }, 2000);
});

// Add utility styles for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .status-message.success {
        background: #d4edda !important;
        color: #155724 !important;
        border-color: #c3e6cb !important;
    }
    
    .status-message.error {
        background: #f8d7da !important;
        color: #721c24 !important;
        border-color: #f5c6cb !important;
    }
    
    .status-message.info {
        background: #d1ecf1 !important;
        color: #0c5460 !important;
        border-color: #bee5eb !important;
    }
`;
document.head.appendChild(style);