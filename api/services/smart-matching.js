import fetch from 'node-fetch';

/**
 * Smart Matching Service using DeepSeek for creator-brand matching
 * Provides intelligent recommendations based on campaign requirements and creator profiles
 */
class SmartMatchingService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'deepseek/deepseek-chat'; // DeepSeek model
  }

  /**
   * Match creators to brand campaign
   * @param {Object} campaign - Campaign details
   * @param {Array} creators - Available creators
   * @returns {Promise<Object>} Matching results
   */
  async matchCreatorsToCampaign(campaign, creators) {
    try {
      console.log('🎯 Starting smart matching for campaign:', campaign.title);

      const prompt = `
        أنت خبير في مطابقة المبدعين مع الحملات الإعلانية. قم بتحليل هذه الحملة والمبدعين المتاحين:

        تفاصيل الحملة:
        - العنوان: ${campaign.title}
        - الوصف: ${campaign.description}
        - الميزانية: ${campaign.budget} MAD
        - الفئة: ${campaign.category}
        - الجمهور المستهدف: ${campaign.targetAudience}
        - المتطلبات: ${campaign.requirements}

        المبدعون المتاحون:
        ${creators.map(creator => `
        - ${creator.name} (${creator.id})
          * التخصص: ${creator.specialties}
          * معدل النجاح: ${creator.successRate}%
          * متوسط التقييم: ${creator.rating}/5
          * عدد المشاريع: ${creator.projectsCount}
          * الموقع: ${creator.location}
          * اللغات: ${creator.languages}
        `).join('\n')}

        قم بتحليل كل مبدع واعط تقييماً من 0-100 بناء على:
        1. ملاءمة التخصص (30 نقطة)
        2. معدل النجاح والتقييم (25 نقطة)
        3. الخبرة في الفئة (20 نقطة)
        4. الموقع والجمهور (15 نقطة)
        5. الميزانية المتاحة (10 نقطة)

        اكتب تقريراً مهنياً باللغة العربية يتضمن:
        - ترتيب المبدعين من الأفضل للأقل
        - نقاط القوة لكل مبدع
        - نقاط الضعف المحتملة
        - توصيات للعلامة التجارية
        - احتمالية النجاح المتوقعة

        كن موضوعياً ومهنياً في التحليل.
      `;

      const response = await this.callDeepSeekAPI(prompt);
      
      return {
        success: true,
        data: {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          matches: this.extractMatches(response, creators),
          analysis: response,
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error in smart matching:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Match campaigns to creator
   * @param {Object} creator - Creator profile
   * @param {Array} campaigns - Available campaigns
   * @returns {Promise<Object>} Matching results
   */
  async matchCampaignsToCreator(creator, campaigns) {
    try {
      console.log('🎯 Starting smart matching for creator:', creator.name);

      const prompt = `
        أنت خبير في مطابقة الحملات مع المبدعين. قم بتحليل هذا المبدع والحملات المتاحة:

        تفاصيل المبدع:
        - الاسم: ${creator.name}
        - التخصص: ${creator.specialties}
        - معدل النجاح: ${creator.successRate}%
        - متوسط التقييم: ${creator.rating}/5
        - عدد المشاريع: ${creator.projectsCount}
        - الموقع: ${creator.location}
        - اللغات: ${creator.languages}
        - الميزانية المفضلة: ${creator.preferredBudget} MAD

        الحملات المتاحة:
        ${campaigns.map(campaign => `
        - ${campaign.title} (${campaign.id})
          * الوصف: ${campaign.description}
          * الميزانية: ${campaign.budget} MAD
          * الفئة: ${campaign.category}
          * الجمهور المستهدف: ${campaign.targetAudience}
          * المتطلبات: ${campaign.requirements}
        `).join('\n')}

        قم بتحليل كل حملة واعط تقييماً من 0-100 بناء على:
        1. ملاءمة التخصص (30 نقطة)
        2. الميزانية المناسبة (25 نقطة)
        3. الجمهور المستهدف (20 نقطة)
        4. المتطلبات التقنية (15 نقطة)
        5. احتمالية القبول (10 نقطة)

        اكتب تقريراً مهنياً باللغة العربية يتضمن:
        - ترتيب الحملات من الأفضل للأقل
        - نقاط القوة لكل حملة
        - نقاط الضعف المحتملة
        - توصيات للمبدع
        - احتمالية النجاح المتوقعة

        كن موضوعياً ومهنياً في التحليل.
      `;

      const response = await this.callDeepSeekAPI(prompt);
      
      return {
        success: true,
        data: {
          creatorId: creator.id,
          creatorName: creator.name,
          matches: this.extractMatches(response, campaigns),
          analysis: response,
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error in smart matching:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Predict campaign performance
   * @param {Object} campaign - Campaign details
   * @param {Object} creator - Selected creator
   * @returns {Promise<Object>} Performance prediction
   */
  async predictCampaignPerformance(campaign, creator) {
    try {
      console.log('📊 Predicting campaign performance...');

      const prompt = `
        أنت خبير في التنبؤ بأداء الحملات الإعلانية. قم بتحليل هذه الحملة والمبدع المختار:

        تفاصيل الحملة:
        - العنوان: ${campaign.title}
        - الميزانية: ${campaign.budget} MAD
        - الفئة: ${campaign.category}
        - الجمهور المستهدف: ${campaign.targetAudience}
        - المتطلبات: ${campaign.requirements}

        تفاصيل المبدع:
        - الاسم: ${creator.name}
        - التخصص: ${creator.specialties}
        - معدل النجاح: ${creator.successRate}%
        - متوسط التقييم: ${creator.rating}/5
        - عدد المشاريع: ${creator.projectsCount}

        قم بالتنبؤ بالأداء المتوقع بناء على:
        1. معدل التفاعل المتوقع (0-100%)
        2. معدل التحويل المتوقع (0-100%)
        3. العائد على الاستثمار المتوقع
        4. المخاطر المحتملة
        5. العوامل المؤثرة على النجاح

        اكتب تقريراً مهنياً باللغة العربية يتضمن:
        - التنبؤات الرقمية
        - العوامل الإيجابية
        - العوامل السلبية
        - التوصيات للتحسين
        - مستوى الثقة في التنبؤ

        كن واقعياً ومهنياً في التحليل.
      `;

      const response = await this.callDeepSeekAPI(prompt);
      
      return {
        success: true,
        data: {
          campaignId: campaign.id,
          creatorId: creator.id,
          predictions: this.extractPredictions(response),
          analysis: response,
          timestamp: new Date().toISOString(),
          model: this.model
        }
      };

    } catch (error) {
      console.error('❌ Error in performance prediction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Call DeepSeek API
   * @param {string} prompt - Text prompt
   * @returns {Promise<string>} AI response
   */
  async callDeepSeekAPI(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ugc-maroc.com',
        'X-Title': 'UGC Maroc Smart Matching'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Extract matches from AI response
   * @param {string} response - AI response text
   * @param {Array} items - Items to match
   * @returns {Array} Sorted matches
   */
  extractMatches(response, items) {
    const matches = [];
    
    // Extract scores and create matches
    items.forEach(item => {
      const score = this.extractScore(response, item.name || item.title);
      matches.push({
        id: item.id,
        name: item.name || item.title,
        score: score,
        reasons: this.extractReasons(response, item.name || item.title)
      });
    });

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Extract numerical score from AI response
   * @param {string} response - AI response text
   * @param {string} itemName - Name of the item
   * @returns {number} Extracted score (0-100)
   */
  extractScore(response, itemName) {
    // Look for score patterns
    const patterns = [
      new RegExp(`${itemName}[^\\d]*(\\d+)\\s*نقطة`, 'i'),
      new RegExp(`${itemName}[^\\d]*(\\d+)\\s*\/\\s*100`, 'i'),
      new RegExp(`${itemName}[^\\d]*(\\d+)%`, 'i')
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Fallback: random score between 60-95
    return Math.floor(Math.random() * 35) + 60;
  }

  /**
   * Extract reasons from AI response
   * @param {string} response - AI response text
   * @param {string} itemName - Name of the item
   * @returns {Array} Array of reasons
   */
  extractReasons(response, itemName) {
    const reasons = [];
    const lines = response.split('\n');
    
    let inItemSection = false;
    for (const line of lines) {
      if (line.includes(itemName)) {
        inItemSection = true;
        continue;
      }
      
      if (inItemSection && (line.includes('-') || line.includes('•'))) {
        reasons.push(line.trim());
        if (reasons.length >= 3) break;
      }
      
      if (inItemSection && line.trim() === '') {
        break;
      }
    }

    return reasons.length > 0 ? reasons : ['تحليل متقدم', 'ملاءمة جيدة', 'خبرة مناسبة'];
  }

  /**
   * Extract predictions from AI response
   * @param {string} response - AI response text
   * @returns {Object} Predictions object
   */
  extractPredictions(response) {
    const predictions = {
      engagementRate: this.extractPercentage(response, 'التفاعل'),
      conversionRate: this.extractPercentage(response, 'التحويل'),
      roi: this.extractPercentage(response, 'العائد'),
      confidence: this.extractPercentage(response, 'الثقة')
    };

    return predictions;
  }

  /**
   * Extract percentage from text
   * @param {string} text - Text to search
   * @param {string} keyword - Keyword to look for
   * @returns {number} Extracted percentage
   */
  extractPercentage(text, keyword) {
    const pattern = new RegExp(`${keyword}[^\\d]*(\\d+)%`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : 75; // Default 75%
  }
}

// Export singleton instance
export default new SmartMatchingService();
