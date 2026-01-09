/**
 * SARAL AI Badge Generator - Frontend Application
 * Handles file upload, badge overlay, and download
 */

// ========================================
// Configuration
// ========================================

const CONFIG = {
    BADGE_PATH: 'assets/saral-badge.png',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
    OUTPUT_SIZE: 800, // Output image size in pixels
};

// ========================================
// DOM Elements
// ========================================

const elements = {
    // Upload
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),

    // Result
    resultSection: document.getElementById('result-section'),
    originalPreview: document.getElementById('original-preview'),
    resultPreview: document.getElementById('result-preview'),
    resetBtn: document.getElementById('reset-btn'),
    downloadBtn: document.getElementById('download-btn'),

    // Processing
    processingOverlay: document.getElementById('processing-overlay'),

    // Canvas
    canvas: document.getElementById('canvas'),
};

// ========================================
// State
// ========================================

let state = {
    originalImage: null,
    badgeImage: null,
    resultDataUrl: null,
};

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
    initActions();
    loadBadge();
});

/**
 * Load the badge image
 */
async function loadBadge() {
    try {
        state.badgeImage = await loadImage(CONFIG.BADGE_PATH);
        console.log('Badge loaded successfully');
    } catch (error) {
        console.error('Failed to load badge:', error);
        showError('Failed to load SARAL AI badge. Please refresh the page.');
    }
}

// ========================================
// File Upload
// ========================================

function initUpload() {
    const zone = elements.uploadZone;
    const input = elements.fileInput;

    // Click to upload
    zone.addEventListener('click', () => input.click());

    // File selected
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Handle uploaded file
 */
async function handleFile(file) {
    // Validate file type
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
        showError('Please upload a PNG, JPG, or WEBP image.');
        return;
    }

    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('File is too large. Maximum size is 10MB.');
        return;
    }

    try {
        showProcessing(true);

        // Load image from file
        const imageUrl = URL.createObjectURL(file);
        state.originalImage = await loadImage(imageUrl);

        // Process and display
        await processImage();

    } catch (error) {
        console.error('Error handling file:', error);
        showError('Failed to process image. Please try again.');
    } finally {
        showProcessing(false);
    }
}

// ========================================
// Image Processing
// ========================================

/**
 * Process the original image with badge overlay
 */
async function processImage() {
    if (!state.originalImage || !state.badgeImage) {
        showError('Missing image or badge. Please refresh and try again.');
        return;
    }

    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');

    // Determine output size (square)
    const size = CONFIG.OUTPUT_SIZE;
    canvas.width = size;
    canvas.height = size;

    // =========================================================
    // Handle non-square images by center cropping to 1:1 ratio
    // ---------------------------------------------------------
    // Case 1: Height > Width (Portrait)
    //   - Crop size = original width
    //   - Crops equally from top and bottom
    //   - Result: square with width = height = original width
    //
    // Case 2: Width > Height (Landscape)
    //   - Crop size = original height
    //   - Crops equally from left and right
    //   - Result: square with width = height = original height
    //
    // Case 3: Already square (Width == Height)
    //   - No cropping needed
    // =========================================================
    const img = state.originalImage;
    const srcSize = Math.min(img.width, img.height); // Use smaller dimension
    const srcX = (img.width - srcSize) / 2;          // Center horizontally
    const srcY = (img.height - srcSize) / 2;         // Center vertically

    // Draw cropped and scaled original image
    ctx.drawImage(
        img,
        srcX, srcY, srcSize, srcSize,  // Source (crop)
        0, 0, size, size                // Destination (full canvas)
    );

    // Draw badge on top (same size as canvas)
    ctx.drawImage(state.badgeImage, 0, 0, size, size);

    // Save result
    state.resultDataUrl = canvas.toDataURL('image/png');

    // Display results
    displayResults();
}

/**
 * Display original and result images
 */
function displayResults() {
    // Create a cropped version of original for display
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = CONFIG.OUTPUT_SIZE;
    canvas.width = size;
    canvas.height = size;

    const img = state.originalImage;
    const srcSize = Math.min(img.width, img.height);
    const srcX = (img.width - srcSize) / 2;
    const srcY = (img.height - srcSize) / 2;

    ctx.drawImage(
        img,
        srcX, srcY, srcSize, srcSize,
        0, 0, size, size
    );

    // Set preview images
    elements.originalPreview.src = canvas.toDataURL('image/png');
    elements.resultPreview.src = state.resultDataUrl;

    // Show result section
    elements.resultSection.classList.remove('hidden');

    // Scroll to results
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========================================
// Action Buttons
// ========================================

function initActions() {
    elements.resetBtn.addEventListener('click', reset);
    elements.downloadBtn.addEventListener('click', downloadResult);
}

/**
 * Reset to initial state
 */
function reset() {
    state.originalImage = null;
    state.resultDataUrl = null;

    elements.fileInput.value = '';
    elements.resultSection.classList.add('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Download the result image
 */
function downloadResult() {
    if (!state.resultDataUrl) {
        showError('No image to download. Please process an image first.');
        return;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = 'saral-ai-profile.png';
    link.href = state.resultDataUrl;
    link.click();
}

// ========================================
// Utility Functions
// ========================================

/**
 * Load an image from URL
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Show/hide processing overlay
 */
function showProcessing(show) {
    elements.processingOverlay.classList.toggle('hidden', !show);
}

/**
 * Show error message
 */
function showError(message) {
    // For now, use alert. In production, use a toast notification.
    alert(message);
}
