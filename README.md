# Sunflower Namecard Generator

A professional namecard generator for Sunflower Childcare Group staff members. This tool creates high-quality, print-ready namecards with QR codes containing contact information.

## Features

- **Professional Design**: Matches Sunflower branding with #FFCC00 background
- **QR Code Generation**: Automatically generates vCard QR codes for easy contact sharing
- **Image Upload**: Support for profile photos with automatic resizing and circular cropping
- **High-Resolution Output**: 300 DPI PNG files ready for professional printing
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: Live canvas preview as you type
- **Data Persistence**: Saves form data locally between sessions

## Specifications

- **Dimensions**: 86mm x 54mm (standard business card size)
- **Resolution**: 300 DPI (1016x638 pixels)
- **Format**: PNG
- **Typography**: Poppins font family
  - Name: 17.9pt Bold (68px)
  - Designation: 9.2pt (35px)
  - Contact Info: 5.6pt (21px)

## Required Information

- **Name** (required)
- **Designation** (required)
- **Email Address** (required)
- **Office Address** (required)
- **Mobile Number** (optional)
- **Office Number** (optional)
- **Profile Image** (optional)

## Usage

1. **Fill in your information** in the form on the left
2. **Upload a profile image** (optional) - square images work best
3. **Click "Generate Namecard"** to create your namecard
4. **Preview** your namecard in the canvas on the right
5. **Click "Download PNG"** to save the high-resolution file
6. **Send to Nicholas** for professional printing

## Technical Details

### Dependencies
- QRCode.js library for QR code generation
- Google Fonts (Poppins)
- HTML5 Canvas for rendering

### Browser Support
- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge

### File Structure
```
sunflower-namecard-generator/
├── index.html              # Main application
├── css/
│   └── style.css          # Styling and layout
├── js/
│   └── namecard-generator.js  # Core functionality
└── README.md              # This file
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