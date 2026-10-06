import { unzip } from './thirdparty/unzipit.module.js';

/**
 * Extracts filename from Content-Disposition header
 * @param {string} contentDisposition - Header value
 * @param {string} fallbackUrl - URL for fallback filename
 * @returns {string} - Extracted filename
 */
function extractFileNameFromContentDisposition(contentDisposition, fallbackUrl) {
    if (!contentDisposition) {
        return extractFileNameFromUrl(fallbackUrl);
    }

    // Try to find filename*=UTF-8''...
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (filenameStarMatch) {
        try {
            return decodeURIComponent(filenameStarMatch[1]);
        } catch (e) {
            console.warn('Failed to decode filename*=:', e);
        }
    }

    // Try to find regular filename (without *), may be in quotes
    const filenameMatch = contentDisposition.match(/filename[^*]=(["']?)(.*?)\1(?:;|$)/i);
    if (filenameMatch) {
        return filenameMatch[2].trim();
    }

    // Fallback to URL
    return extractFileNameFromUrl(fallbackUrl);
}

/**
 * Extracts filename from URL (last part after /)
 */
function extractFileNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const fileName = pathname.split('/').pop();
        return fileName ? decodeURIComponent(fileName) : 'book.fb2';
    } catch (e) {
        return 'book.fb2';
    }
}

/**
 * Resolves relative URL to absolute
 * @param {string} url - URL to resolve
 * @returns {string} - Absolute URL
 */
function resolveUrl(url) {
    if (!url) return url;
    
    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Protocol-relative URL
    if (url.startsWith('//')) {
        return window.location.protocol + url;
    }
    
    // Relative to current page
    try {
        return new URL(url, window.location.href).href;
    } catch (e) {
        console.warn('Failed to resolve URL:', url, e);
        return url;
    }
}

/**
 * Loads book from URL and passes it to the app as if from file dialog
 * @param {string} url - Direct link to .fb2 or .zip file
 */
export async function loadBookFromUrl(url) {
    try {
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(url);
        console.log('Loading book from:', absoluteUrl);
        
        // 1. Download file with headers
        const response = await fetch(absoluteUrl);
        if (!response.ok) throw new Error(`Download error: ${response.status} ${response.statusText}`);

        // 2. Get ArrayBuffer and Content-Disposition header
        const arrayBuffer = await response.arrayBuffer();
        const contentDisposition = response.headers.get('content-disposition');

        // 3. Extract filename considering the header
        let fileName = extractFileNameFromContentDisposition(contentDisposition, absoluteUrl);

        // 4. Ensure file has correct extension
        if (!fileName.includes('.')) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('zip')) {
                fileName += '.zip';
            } else if (contentType && (contentType.includes('fb2') || contentType.includes('xml'))) {
                fileName += '.fb2';
            } else {
                fileName += '.fb2';
            }
        }

        console.log(`Downloaded book: ${fileName}`);

        // 5. Create File object
        const file = new File([arrayBuffer], fileName, {
            type: response.headers.get('content-type') || 'application/octet-stream'
        });

        // 6. Emulate file selection event
        const input = document.getElementById('f');
        if (!input) {
            throw new Error('File input element with id "f" not found');
        }

        // Create a FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        // Dispatch change event to trigger app's file handler
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('File successfully passed to the app');
        
    } catch (error) {
        console.error('Error loading book from URL:', error);
        alert(`Failed to load book: ${error.message}`);
    }
}
