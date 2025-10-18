/**
 * UGC Maroc - Video Uploader Module
 * Handles video upload to Cloudflare R2 with watermarking
 * Features: Progress tracking, preview, error handling
 */

class VideoUploader {
  constructor(options = {}) {
    this.apiBaseUrl = options.apiBaseUrl || '/api';
    this.maxFileSize = options.maxFileSize || 500 * 1024 * 1024; // 500MB default
    this.acceptedFormats = options.acceptedFormats || ['video/mp4', 'video/quicktime', 'video/webm'];
    this.onProgress = options.onProgress || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Validate video file before upload
   * @param {File} file - Video file to validate
   * @returns {{valid: boolean, error: string|null}}
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'لم يتم اختيار ملف' };
    }

    if (!this.acceptedFormats.includes(file.type)) {
      return { valid: false, error: 'نوع الملف غير مدعوم. استخدم MP4 أو MOV أو WebM' };
    }

    if (file.size > this.maxFileSize) {
      const maxSizeMB = this.maxFileSize / (1024 * 1024);
      return { valid: false, error: `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB}MB` };
    }

    return { valid: true, error: null };
  }

  /**
   * Upload video file to R2 with watermark (using XMLHttpRequest for real progress)
   * @param {File} file - Video file to upload
   * @param {Object} metadata - Campaign metadata (campaignId, campaignName)
   * @returns {Promise<{success: boolean, data: Object, error: string}>}
   */
  async uploadVideo(file, metadata = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
          const error = new Error(validation.error);
          this.onError(error.message);
          reject(error);
          return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('video', file);
        formData.append('campaignId', metadata.campaignId || '');
        formData.append('campaignName', metadata.campaignName || 'UGC Maroc');

        // Use XMLHttpRequest for real upload progress tracking
        const xhr = new XMLHttpRequest();

        // Progress event listener
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            this.onProgress(percentComplete);
          }
        });

        // Load event listener (success)
        xhr.addEventListener('load', () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const result = JSON.parse(xhr.responseText);
              
              if (result.success) {
                this.onSuccess(result.data);
                resolve({
                  success: true,
                  data: result.data,
                  error: null
                });
              } else {
                throw new Error(result.message || 'فشل رفع الفيديو');
              }
            } else {
              throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            }
          } catch (error) {
            this.onError(error.message);
            reject(error);
          }
        });

        // Error event listener
        xhr.addEventListener('error', () => {
          const error = new Error('فشل الاتصال بالخادم');
          this.onError(error.message);
          reject(error);
        });

        // Abort event listener
        xhr.addEventListener('abort', () => {
          const error = new Error('تم إلغاء رفع الفيديو');
          this.onError(error.message);
          reject(error);
        });

        // Open connection and send
        xhr.open('POST', `${this.apiBaseUrl}/upload-video`);
        xhr.send(formData);

      } catch (error) {
        console.error('❌ Upload error:', error);
        this.onError(error.message);
        reject(error);
      }
    });
  }

  /**
   * Generate video preview from File object
   * @param {File} file - Video file
   * @returns {Promise<string>} Data URL for preview
   */
  async generatePreview(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second to get a preview frame
        video.currentTime = 1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };

      video.onerror = () => {
        reject(new Error('فشل تحميل معاينة الفيديو'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video duration and dimensions
   * @param {File} file - Video file
   * @returns {Promise<{duration: number, width: number, height: number}>}
   */
  async getVideoInfo(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('فشل قراءة معلومات الفيديو'));
      };

      video.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Create upload UI component
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 * @returns {VideoUploader} Uploader instance
 */
function createVideoUploadUI(container, options = {}) {
  // Create HTML structure
  container.innerHTML = `
    <div class="video-uploader-wrapper">
      <!-- Upload Zone -->
      <div id="uploadZone" class="upload-zone border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
        <span class="material-icons text-6xl text-primary mb-4 block">cloud_upload</span>
        <p class="text-white font-semibold mb-2">اسحب الفيديو هنا أو انقر للاختيار</p>
        <p class="text-gray-400 text-sm">MP4, MOV, WebM (حتى 500MB)</p>
        <input type="file" id="videoFileInput" class="hidden" accept="video/*" />
      </div>

      <!-- Preview Zone (hidden initially) -->
      <div id="previewZone" class="hidden mt-4">
        <div class="bg-card-dark rounded-lg p-4">
          <h4 class="text-white font-semibold mb-3 flex items-center">
            <span class="material-icons text-primary ml-2">visibility</span>
            معاينة الفيديو
          </h4>
          <div class="relative rounded-lg overflow-hidden bg-gray-800">
            <video id="videoPreview" class="w-full" controls></video>
          </div>
          <div id="videoInfo" class="mt-3 text-sm text-gray-400"></div>
        </div>
      </div>

      <!-- Progress Zone (hidden initially) -->
      <div id="progressZone" class="hidden mt-4">
        <div class="bg-card-dark rounded-lg p-4">
          <h4 class="text-white font-semibold mb-3">جاري رفع الفيديو...</h4>
          <div class="bg-gray-800 rounded-full h-2 overflow-hidden">
            <div id="progressBar" class="bg-gradient-to-r from-primary to-blue-500 h-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <p id="progressText" class="text-gray-400 text-sm mt-2 text-center">0%</p>
        </div>
      </div>

      <!-- Success Zone (hidden initially) -->
      <div id="successZone" class="hidden mt-4">
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
          <span class="material-icons text-green-400 text-5xl mb-2 block">check_circle</span>
          <p class="text-green-400 font-semibold">تم رفع الفيديو بنجاح! ✨</p>
          <p id="videoUrl" class="text-gray-400 text-sm mt-2"></p>
        </div>
      </div>

      <!-- Error Zone (hidden initially) -->
      <div id="errorZone" class="hidden mt-4">
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
          <span class="material-icons text-red-400 text-5xl mb-2 block">error</span>
          <p class="text-red-400 font-semibold">فشل رفع الفيديو</p>
          <p id="errorText" class="text-gray-400 text-sm mt-2"></p>
          <button id="retryBtn" class="mt-3 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  `;

  // Get elements
  const uploadZone = container.querySelector('#uploadZone');
  const fileInput = container.querySelector('#videoFileInput');
  const previewZone = container.querySelector('#previewZone');
  const videoPreview = container.querySelector('#videoPreview');
  const videoInfo = container.querySelector('#videoInfo');
  const progressZone = container.querySelector('#progressZone');
  const progressBar = container.querySelector('#progressBar');
  const progressText = container.querySelector('#progressText');
  const successZone = container.querySelector('#successZone');
  const videoUrl = container.querySelector('#videoUrl');
  const errorZone = container.querySelector('#errorZone');
  const errorText = container.querySelector('#errorText');
  const retryBtn = container.querySelector('#retryBtn');

  let selectedFile = null;

  // Create uploader instance
  const uploader = new VideoUploader({
    onProgress: (percent) => {
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${Math.round(percent)}%`;
    },
    onSuccess: (data) => {
      progressZone.classList.add('hidden');
      successZone.classList.remove('hidden');
      videoUrl.textContent = `URL: ${data.publicUrl}`;
      
      // Call external success callback if provided
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      progressZone.classList.add('hidden');
      errorZone.classList.remove('hidden');
      errorText.textContent = error;
    }
  });

  // Upload zone click handler
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop handlers
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('border-primary', 'bg-primary/10');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('border-primary', 'bg-primary/10');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('border-primary', 'bg-primary/10');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelection(files[0]);
    }
  });

  // File input change handler
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleFileSelection(e.target.files[0]);
    }
  });

  // Retry button
  retryBtn.addEventListener('click', () => {
    errorZone.classList.add('hidden');
    previewZone.classList.remove('hidden');
  });

  // Handle file selection
  async function handleFileSelection(file) {
    selectedFile = file;

    // Validate
    const validation = uploader.validateFile(file);
    if (!validation.valid) {
      errorZone.classList.remove('hidden');
      errorText.textContent = validation.error;
      return;
    }

    // Show preview
    try {
      const previewUrl = URL.createObjectURL(file);
      videoPreview.src = previewUrl;
      previewZone.classList.remove('hidden');
      uploadZone.classList.add('hidden');

      // Get video info
      const info = await uploader.getVideoInfo(file);
      const duration = Math.round(info.duration);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      videoInfo.innerHTML = `
        <span class="ml-3">المدة: ${duration} ثانية</span>
        <span class="ml-3">الحجم: ${sizeMB} MB</span>
        <span>الدقة: ${info.width}x${info.height}</span>
      `;

      // Auto-upload if configured
      if (options.autoUpload) {
        await startUpload();
      }
    } catch (error) {
      console.error('Preview error:', error);
      errorZone.classList.remove('hidden');
      errorText.textContent = 'فشل معاينة الفيديو';
    }
  }

  // Start upload function
  async function startUpload() {
    if (!selectedFile) return;

    // Hide preview, show progress
    previewZone.classList.add('hidden');
    progressZone.classList.remove('hidden');
    errorZone.classList.add('hidden');
    successZone.classList.add('hidden');

    // Reset progress bar
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    // Upload with real progress tracking
    try {
      await uploader.uploadVideo(selectedFile, options.metadata || {});
    } catch (error) {
      console.error('Upload failed:', error);
      // Error already handled by uploader callbacks
    }
  }

  // Expose upload method
  return {
    uploader,
    startUpload,
    reset: () => {
      uploadZone.classList.remove('hidden');
      previewZone.classList.add('hidden');
      progressZone.classList.add('hidden');
      successZone.classList.add('hidden');
      errorZone.classList.add('hidden');
      selectedFile = null;
      fileInput.value = '';
    }
  };
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.VideoUploader = VideoUploader;
  window.createVideoUploadUI = createVideoUploadUI;
}
