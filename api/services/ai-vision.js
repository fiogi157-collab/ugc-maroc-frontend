import fetch from 'node-fetch';

/**
 * AI Vision Service using Qwen Vision model via OpenRouter
 * Provides video quality scoring and content moderation
 */
class AIVisionService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'qwen/qwen-vl-plus'; // Qwen Vision model
  }

  /**
   * Analyze video quality and provide technical score
   * @param {string} videoUrl - URL of the video to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Quality analysis results
   */
  async analyzeVideoQuality(videoUrl, options = {}) {
    try {
      console.log('🎬 Analyzing video quality...', videoUrl);

      const prompt = `
        أنت خبير في تحليل جودة الفيديو. قم بتحليل هذا الفيديو وأعطني تقييماً شاملاً:

        معايير التقييم:
        1. الوضوح والجودة البصرية (0-25 نقطة)
        2. الاستقرار والاهتزاز (0-20 نقطة)  
        3. الإضاءة والتباين (0-20 نقطة)
        4. التركيب والإطار (0-15 نقطة)
        5. الصوت والجودة السمعية (0-10 نقطة)
        6. المدة والاكتفاء (0-10 نقطة)

        اكتب تقييماً مهنياً باللغة العربية يتضمن:
        - النقاط الإجمالية (0-100)
        - نقاط القوة
        - نقاط الضعف
        - توصيات للتحسين
        - تقييم عام (ممتاز/جيد جداً/جيد/مقبول/ضعيف)

        كن موضوعياً ومهنياً في التقييم.
      `;

      const response = await this.callVisionAPI(prompt, videoUrl);
      
      return {
        success: true,
        data: {
          videoUrl,
          qualityScore: this.extractScore(response),
          analysis: response,
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error analyzing video quality:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Moderate video content for inappropriate material
   * @param {string} videoUrl - URL of the video to moderate
   * @param {Object} options - Moderation options
   * @returns {Promise<Object>} Content moderation results
   */
  async moderateContent(videoUrl, options = {}) {
    try {
      console.log('🛡️ Moderating video content...', videoUrl);

      const prompt = `
        أنت خبير في مراجعة المحتوى. قم بفحص هذا الفيديو للتأكد من:

        معايير المراجعة:
        1. عدم وجود محتوى عنيف أو مؤذي
        2. عدم وجود محتوى جنسي أو غير لائق
        3. عدم وجود كلمات نابية أو مسيئة
        4. احترام القيم الإسلامية والمغربية
        5. عدم وجود محتوى يحرض على الكراهية
        6. عدم انتهاك حقوق الملكية الفكرية

        اكتب تقريراً مهنياً باللغة العربية يتضمن:
        - حالة المحتوى (آمن/غير آمن/يحتاج مراجعة)
        - المخاطر المحتملة
        - التوصيات
        - نقاط القوة في المحتوى

        كن دقيقاً ومهنياً في التقييم.
      `;

      const response = await this.callVisionAPI(prompt, videoUrl);
      
      return {
        success: true,
        data: {
          videoUrl,
          isSafe: this.extractSafetyStatus(response),
          moderationReport: response,
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error moderating content:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze portfolio for creator matching
   * @param {Array} portfolioUrls - Array of portfolio video/image URLs
   * @param {Object} brandRequirements - Brand's requirements
   * @returns {Promise<Object>} Portfolio analysis results
   */
  async analyzePortfolio(portfolioUrls, brandRequirements = {}) {
    try {
      console.log('🎨 Analyzing portfolio...', portfolioUrls.length, 'items');

      const prompt = `
        أنت خبير في تحليل المحافظ الإبداعية. قم بتحليل هذا المحفظة:

        معايير التحليل:
        1. جودة المحتوى العام
        2. تنوع الأساليب والتقنيات
        3. الإبداع والأصالة
        4. احترافية الإنتاج
        5. ملاءمة المحتوى للعلامة التجارية
        6. القدرة على التواصل مع الجمهور

        اكتب تحليلاً مهنياً باللغة العربية يتضمن:
        - تقييم عام للمحفظة (0-100)
        - نقاط القوة
        - مجالات التحسين
        - توصيات للعلامة التجارية
        - مستوى المطابقة مع متطلبات العلامة التجارية

        كن موضوعياً ومهنياً في التحليل.
      `;

      // For now, analyze first portfolio item
      const firstUrl = portfolioUrls[0];
      const response = await this.callVisionAPI(prompt, firstUrl);
      
      return {
        success: true,
        data: {
          portfolioUrls,
          overallScore: this.extractScore(response),
          analysis: response,
          brandMatch: this.extractBrandMatch(response),
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error analyzing portfolio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Call OpenRouter Vision API
   * @param {string} prompt - Text prompt
   * @param {string} imageUrl - Image/Video URL
   * @returns {Promise<string>} AI response
   */
  async callVisionAPI(prompt, imageUrl) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ugc-maroc.com',
        'X-Title': 'UGC Maroc AI Vision'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Extract numerical score from AI response
   * @param {string} response - AI response text
   * @returns {number} Extracted score (0-100)
   */
  extractScore(response) {
    const scoreMatch = response.match(/(\d+)\s*نقطة|(\d+)\s*\/\s*100|(\d+)\s*من\s*100/);
    if (scoreMatch) {
      return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    
    // Fallback: look for any number between 0-100
    const numberMatch = response.match(/\b(\d{1,2})\b/);
    return numberMatch ? parseInt(numberMatch[1]) : 75; // Default score
  }

  /**
   * Extract safety status from moderation response
   * @param {string} response - AI response text
   * @returns {boolean} Is content safe
   */
  extractSafetyStatus(response) {
    const safeKeywords = ['آمن', 'مقبول', 'مناسب', 'جيد'];
    const unsafeKeywords = ['غير آمن', 'غير مناسب', 'مشكوك', 'يحتاج مراجعة'];
    
    const lowerResponse = response.toLowerCase();
    
    for (const keyword of unsafeKeywords) {
      if (lowerResponse.includes(keyword)) {
        return false;
      }
    }
    
    for (const keyword of safeKeywords) {
      if (lowerResponse.includes(keyword)) {
        return true;
      }
    }
    
    return true; // Default to safe
  }

  /**
   * Extract brand match percentage from portfolio analysis
   * @param {string} response - AI response text
   * @returns {number} Brand match percentage (0-100)
   */
  extractBrandMatch(response) {
    const matchMatch = response.match(/(\d+)%\s*مطابقة|(\d+)\s*مطابقة/);
    if (matchMatch) {
      return parseInt(matchMatch[1] || matchMatch[2]);
    }
    return 80; // Default match
  }
}

// Export singleton instance
export default new AIVisionService();
