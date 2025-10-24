/**
 * Cloudflare R2 File Upload System
 * Handles file uploads with progress tracking and preview
 */

class FileUploadManager {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = {
            image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            video: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
            document: ['application/pdf', 'text/plain']
        };
        this.uploadedFiles = [];
        this.init();
    }

    init() {
        this.setupDropZones();
        this.setupFileInputs();
        this.setupProgressBars();
        this.setupPreviewContainers();
    }

    setupDropZones() {
        const dropZones = document.querySelectorAll('.file-upload-zone');
        
        dropZones.forEach(zone => {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, this.preventDefaults, false);
                document.body.addEventListener(eventName, this.preventDefaults, false);
            });

            // Highlight drop zone when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => this.highlight(zone), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => this.unhighlight(zone), false);
            });

            // Handle dropped files
            zone.addEventListener('drop', (e) => this.handleDrop(e, zone), false);
        });
    }

    setupFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleFiles(e.target.files));
        });
    }

    setupProgressBars() {
        // Progress bars will be created dynamically
    }

    setupPreviewContainers() {
        // Preview containers will be created dynamically
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(zone) {
        zone.classList.add('dragover');
    }

    unhighlight(zone) {
        zone.classList.remove('dragover');
    }

    handleDrop(e, zone) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadFile(file);
            }
        });
    }

    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`Fichier trop volumineux: ${file.name} (max 50MB)`);
            return false;
        }

        // Check file type
        const isValidType = Object.values(this.allowedTypes).flat().includes(file.type);
        if (!isValidType) {
            this.showError(`Type de fichier non supporté: ${file.name}`);
            return false;
        }

        return true;
    }

    async uploadFile(file) {
        const fileId = this.generateFileId();
        const progressContainer = this.createProgressContainer(fileId, file.name);
        
        try {
            // Get upload URL from backend
            const uploadUrl = await this.getUploadUrl(fileId, file.type);
            
            // Upload file to Cloudflare R2
            const uploadResult = await this.uploadToR2(file, uploadUrl, (progress) => {
                this.updateProgress(progressContainer, progress);
            });

            // Save file info
            const fileInfo = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                url: uploadResult.url,
                uploadedAt: new Date().toISOString()
            };

            this.uploadedFiles.push(fileInfo);
            this.showFilePreview(fileInfo, progressContainer);
            this.showSuccess(`Fichier uploadé: ${file.name}`);

        } catch (error) {
            console.error('Upload error:', error);
            this.showError(`Erreur d'upload: ${file.name}`);
            this.removeProgressContainer(progressContainer);
        }
    }

    async getUploadUrl(fileId, fileType) {
        const response = await fetch('/api/upload/get-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                fileId,
                fileType,
                purpose: 'campaign-assets'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get upload URL');
        }

        const data = await response.json();
        return data.uploadUrl;
    }

    async uploadToR2(file, uploadUrl, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve({
                        url: xhr.responseText,
                        success: true
                    });
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    }

    createProgressContainer(fileId, fileName) {
        const container = document.createElement('div');
        container.id = `progress-${fileId}`;
        container.className = 'file-progress-container p-4 border border-border-light dark:border-border-dark rounded-lg mb-4';
        container.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">${fileName}</span>
                <span class="text-sm text-muted-foreground-light dark:text-muted-foreground-dark">0%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        `;

        const uploadZone = document.querySelector('.file-upload-zone');
        if (uploadZone) {
            uploadZone.parentNode.insertBefore(container, uploadZone.nextSibling);
        }

        return container;
    }

    updateProgress(container, progress) {
        const progressBar = container.querySelector('.bg-primary');
        const progressText = container.querySelector('.text-muted-foreground-light');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    showFilePreview(fileInfo, progressContainer) {
        const previewContainer = document.createElement('div');
        previewContainer.id = `preview-${fileInfo.id}`;
        previewContainer.className = 'file-preview-container p-4 border border-border-light dark:border-border-dark rounded-lg mb-4';
        
        let previewContent = '';
        
        if (fileInfo.type.startsWith('image/')) {
            previewContent = `
                <div class="flex items-center gap-4">
                    <img src="${fileInfo.url}" alt="${fileInfo.name}" class="w-16 h-16 object-cover rounded-lg">
                    <div class="flex-1">
                        <h4 class="font-medium">${fileInfo.name}</h4>
                        <p class="text-sm text-muted-foreground-light dark:text-muted-foreground-dark">${this.formatFileSize(fileInfo.size)}</p>
                    </div>
                    <button onclick="fileUploadManager.removeFile('${fileInfo.id}')" class="text-red-500 hover:text-red-700 touch-button p-2">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
        } else if (fileInfo.type.startsWith('video/')) {
            previewContent = `
                <div class="flex items-center gap-4">
                    <video src="${fileInfo.url}" class="w-16 h-16 object-cover rounded-lg" controls></video>
                    <div class="flex-1">
                        <h4 class="font-medium">${fileInfo.name}</h4>
                        <p class="text-sm text-muted-foreground-light dark:text-muted-foreground-dark">${this.formatFileSize(fileInfo.size)}</p>
                    </div>
                    <button onclick="fileUploadManager.removeFile('${fileInfo.id}')" class="text-red-500 hover:text-red-700 touch-button p-2">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
        } else {
            previewContent = `
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium">${fileInfo.name}</h4>
                        <p class="text-sm text-muted-foreground-light dark:text-muted-foreground-dark">${this.formatFileSize(fileInfo.size)}</p>
                    </div>
                    <button onclick="fileUploadManager.removeFile('${fileInfo.id}')" class="text-red-500 hover:text-red-700 touch-button p-2">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
        }
        
        previewContainer.innerHTML = previewContent;
        
        // Replace progress container with preview
        progressContainer.replaceWith(previewContainer);
    }

    removeFile(fileId) {
        // Remove from uploaded files array
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
        
        // Remove preview container
        const previewContainer = document.getElementById(`preview-${fileId}`);
        if (previewContainer) {
            previewContainer.remove();
        }
        
        this.showSuccess('Fichier supprimé');
    }

    removeProgressContainer(container) {
        if (container) {
            container.remove();
        }
    }

    generateFileId() {
        return 'file_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getAuthToken() {
        return localStorage.getItem('auth_token') || '';
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Get all uploaded files
    getUploadedFiles() {
        return this.uploadedFiles;
    }

    // Clear all files
    clearAllFiles() {
        this.uploadedFiles = [];
        const previews = document.querySelectorAll('.file-preview-container');
        previews.forEach(preview => preview.remove());
    }

    // Mobile-optimized file picker
    openMobileFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,video/*,.pdf,.txt';
        
        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        input.click();
    }

    // Camera capture for mobile
    async captureFromCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // Create video element
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            // Create capture modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
                    <h3 class="text-lg font-bold mb-4">Prendre une photo</h3>
                    <div class="mb-4">
                        <video id="camera-preview" class="w-full h-48 object-cover rounded-lg" autoplay></video>
                    </div>
                    <div class="flex gap-3">
                        <button id="capture-btn" class="flex-1 bg-primary text-white py-2 px-4 rounded-lg">
                            Capturer
                        </button>
                        <button id="cancel-capture" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg">
                            Annuler
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const videoElement = modal.querySelector('#camera-preview');
            videoElement.srcObject = stream;
            
            // Capture functionality
            modal.querySelector('#capture-btn').addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0);
                
                canvas.toBlob((blob) => {
                    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    this.handleFiles([file]);
                }, 'image/jpeg');
                
                stream.getTracks().forEach(track => track.stop());
                modal.remove();
            });
            
            modal.querySelector('#cancel-capture').addEventListener('click', () => {
                stream.getTracks().forEach(track => track.stop());
                modal.remove();
            });
            
        } catch (error) {
            console.error('Camera access denied:', error);
            this.showError('Accès à la caméra refusé');
        }
    }
}

// Initialize File Upload Manager
const fileUploadManager = new FileUploadManager();

// Mobile-specific enhancements
if ('ontouchstart' in window) {
    // Add touch-friendly file upload buttons
    document.addEventListener('DOMContentLoaded', function() {
        const uploadZones = document.querySelectorAll('.file-upload-zone');
        
        uploadZones.forEach(zone => {
            // Add mobile-specific buttons
            const mobileButtons = document.createElement('div');
            mobileButtons.className = 'flex gap-2 mt-4 lg:hidden';
            mobileButtons.innerHTML = `
                <button onclick="fileUploadManager.openMobileFilePicker()" class="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">folder_open</span>
                    <span>Choisir Fichiers</span>
                </button>
                <button onclick="fileUploadManager.captureFromCamera()" class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">camera_alt</span>
                    <span>Caméra</span>
                </button>
            `;
            
            zone.appendChild(mobileButtons);
        });
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
}

