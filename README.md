# Sunflower Namecard Generator

A professional namecard generator for Sunflower Childcare Group staff members. This tool creates high-quality, print-ready namecards with QR codes containing contact information.

🌻 **Live Demo**: [https://sunflower-childcare-group.github.io/sunflower-namecard-generator/](https://sunflower-childcare-group.github.io/sunflower-namecard-generator/)

## Features

- **Professional Design**: Matches Sunflower branding with #FFCC00 background
- **QR Code Generation**: Automatically generates vCard QR codes for easy contact sharing
- **Image Upload**: Support for profile photos with precise positioning and zoom controls
- **High-Resolution Output**: 300 DPI PNG files with embedded DPI metadata for professional printing
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: Live canvas preview with instant image adjustments
- **Data Persistence**: Saves form data locally between sessions
- **Image Manipulation**: Zoom and position controls for perfect photo placement

## Specifications

- **Dimensions**: 86mm x 54mm (standard business card size)
- **Resolution**: 300 DPI (1016x638 pixels)
- **Format**: PNG with embedded DPI metadata
- **Typography**: Poppins font family
  - Name: Bold 72px (right-aligned at x=80mm, y=8mm)
  - Designation: 37px (right-aligned at x=80mm, y=15mm)
  - Contact Info: 23px (left-aligned at x=9mm with icons at x=6mm)

## Required Information

- **Name** ⚠️ **Required**
- **Designation** ⚠️ **Required**
- **Email Address** ⚠️ **Required**
- **Office Address** ⚠️ **Required**
- **Mobile Number** ⚠️ **Required**
- **Office Number** (optional)
- **Profile Image** ⚠️ **Required**

## Usage

1. **Fill in ALL required information** in the form (office number is optional)
2. **Upload a profile image** (required) - square images work best
3. **Adjust image position and zoom** using the controls below the preview
4. **Click "Generate Namecard"** to create your namecard
5. **Preview** your namecard in the canvas on the right
6. **Click "Download PNG"** to save the high-resolution file with proper 300 DPI metadata
7. **Send to Nicholas** for professional printing

## Layout Positioning (Millimeter Precision)

- **Image Frame**: 7mm from top, 6mm from left, 20mm × 24mm dimensions
- **Name**: Right-aligned at x=80mm, y=8mm
- **Designation**: Right-aligned at x=80mm, y=15mm
- **QR Code**: x=56-80mm, y=22-47mm (24mm × 25mm)
- **Email**: y=35mm (icon at x=6mm, text at x=9mm)
- **Phone**: y=38.5mm (icon at x=6mm, text at x=9mm)
- **Address**: y=42mm (icon centered on text, text at x=9mm)

## Technical Details

### Dependencies
- Custom QRCode.js library with qrserver.com API fallback
- Google Fonts (Poppins family)
- HTML5 Canvas with precise DPI rendering
- PNG metadata injection for proper DPI embedding

### Browser Support
- Modern browsers with HTML5 Canvas and FileReader support
- Chrome, Firefox, Safari, Edge (latest versions)

### File Structure
```
sunflower-namecard-generator/
├── index.html              # Main application
├── css/
│   └── style.css          # Styling and responsive layout
├── js/
│   └── namecard-generator.js  # Core functionality with DPI handling
├── libs/
│   ├── qrcode.min.js      # Custom QR code implementation
│   └── simple-qr.js       # Fallback QR code generator
└── README.md              # This documentation
```

## Hosting on GitHub Pages

To host this on GitHub Pages:

1. Push all files to a GitHub repository
2. Go to repository Settings
3. Scroll down to "Pages" section
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Your namecard generator will be available at: `https://[username].github.io/[repository-name]/`

## QR Code Content

The generated QR codes contain vCard data with:
- Full name
- Designation/title
- Email address
- Mobile number (if provided)
- Office number (if provided)
- Office address

When scanned, the QR code will prompt users to save the contact information directly to their phone's contacts.

## Printing Guidelines

- **File format**: PNG at 300 DPI
- **Paper**: 300-350gsm cardstock recommended
- **Finish**: Matte or glossy finish
- **Cutting**: Ensure precise 86mm x 54mm dimensions
- **Color**: CMYK color profile for professional printing

## Support

For technical issues or enhancement requests, please contact the development team.

---

© 2025 Sunflower Childcare Group Pte Ltd. All rights reserved.