// =====================================================
// 🤖 مساعد الذكاء الاصطناعي - AI Assistant Module
// =====================================================

const AIAssistant = {
  // État de chargement
  loading: false,

  // Afficher/masquer le spinner de chargement
  showLoading(elementId, message = "جاري التوليد...") {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="flex items-center justify-center gap-3 p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span class="text-gray-600">${message}</span>
        </div>
      `;
    }
    this.loading = true;
  },

  hideLoading() {
    this.loading = false;
  },

  // Afficher un message d'erreur
  showError(elementId, message = "حدث خطأ. حاول مرة أخرى.") {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700">❌ ${message}</p>
        </div>
      `;
    }
  },

  // 1. مولد السكريبت - Générer script vidéo
  async generateScript(briefData, resultElementId) {
    try {
      this.showLoading(resultElementId, "جاري توليد السكريبت... ✨");

      const response = await fetch(`${window.API_BASE_URL}/api/ai/generate-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ briefData }),
      });

      const data = await response.json();

      if (data.success) {
        this.displayScript(resultElementId, data.script);
        return data.script;
      } else {
        this.showError(resultElementId, data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      this.showError(resultElementId, "خطأ في الاتصال بالخادم");
      return null;
    } finally {
      this.hideLoading();
    }
  },

  // 2. اقتراحات المحتوى - Suggestions créatives
  async suggestContent(campaignData, resultElementId) {
    try {
      this.showLoading(resultElementId, "جاري توليد الاقتراحات... 💡");

      const response = await fetch(`${window.API_BASE_URL}/api/ai/suggest-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignData }),
      });

      const data = await response.json();

      if (data.success) {
        this.displaySuggestions(resultElementId, data.suggestions);
        return data.suggestions;
      } else {
        this.showError(resultElementId, data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      this.showError(resultElementId, "خطأ في الاتصال بالخادم");
      return null;
    } finally {
      this.hideLoading();
    }
  },

  // 3. تحليل الأداء - Prédire performance
  async predictPerformance(videoData, resultElementId) {
    try {
      this.showLoading(resultElementId, "جاري تحليل الأداء... 📊");

      const response = await fetch(`${window.API_BASE_URL}/api/ai/predict-performance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoData }),
      });

      const data = await response.json();

      if (data.success) {
        this.displayPrediction(resultElementId, data.prediction);
        return data.prediction;
      } else {
        this.showError(resultElementId, data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      this.showError(resultElementId, "خطأ في الاتصال بالخادم");
      return null;
    } finally {
      this.hideLoading();
    }
  },

  // 4. مولد البريف - Générer brief campagne
  async generateBrief(campaignInfo, resultElementId) {
    try {
      this.showLoading(resultElementId, "جاري توليد البريف... 📝");

      const response = await fetch(`${window.API_BASE_URL}/api/ai/generate-brief`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignInfo }),
      });

      const data = await response.json();

      if (data.success) {
        this.displayBrief(resultElementId, data.brief);
        return data.brief;
      } else {
        this.showError(resultElementId, data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      this.showError(resultElementId, "خطأ في الاتصال بالخادم");
      return null;
    } finally {
      this.hideLoading();
    }
  },

  // 5. توصيات المبدعين - Recommander créateurs
  async matchCreators(campaignData, creatorsPool, resultElementId) {
    try {
      this.showLoading(resultElementId, "جاري البحث عن المبدعين المناسبين... 🎯");

      const response = await fetch(`${window.API_BASE_URL}/api/ai/match-creators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignData, creatorsPool }),
      });

      const data = await response.json();

      if (data.success) {
        this.displayMatches(resultElementId, data.matches);
        return data.matches;
      } else {
        this.showError(resultElementId, data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      this.showError(resultElementId, "خطأ في الاتصال بالخادم");
      return null;
    } finally {
      this.hideLoading();
    }
  },

  // =====================================================
  // Fonctions d'affichage des résultats
  // =====================================================

  displayScript(elementId, script) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">✨</span>
            <h3 class="text-lg font-bold text-gray-800">السكريبت المولد</h3>
          </div>
          <div class="prose prose-rtl max-w-none">
            <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">${script}</div>
          </div>
          <div class="mt-4 flex gap-2">
            <button onclick="AIAssistant.copyToClipboard('${this.escapeHtml(script)}')" 
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              📋 نسخ
            </button>
          </div>
        </div>
      `;
    }
  },

  displaySuggestions(elementId, suggestions) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">💡</span>
            <h3 class="text-lg font-bold text-gray-800">الاقتراحات الإبداعية</h3>
          </div>
          <div class="prose prose-rtl max-w-none">
            <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">${suggestions}</div>
          </div>
        </div>
      `;
    }
  },

  displayPrediction(elementId, prediction) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">📊</span>
            <h3 class="text-lg font-bold text-gray-800">تحليل الأداء</h3>
          </div>
          <div class="prose prose-rtl max-w-none">
            <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">${prediction}</div>
          </div>
        </div>
      `;
    }
  },

  displayBrief(elementId, brief) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">📝</span>
            <h3 class="text-lg font-bold text-gray-800">البريف المولد</h3>
          </div>
          <div class="prose prose-rtl max-w-none">
            <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">${brief}</div>
          </div>
          <div class="mt-4 flex gap-2">
            <button onclick="AIAssistant.copyToClipboard('${this.escapeHtml(brief)}')" 
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              📋 نسخ
            </button>
          </div>
        </div>
      `;
    }
  },

  displayMatches(elementId, matches) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎯</span>
            <h3 class="text-lg font-bold text-gray-800">المبدعون الموصى بهم</h3>
          </div>
          <div class="prose prose-rtl max-w-none">
            <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">${matches}</div>
          </div>
        </div>
      `;
    }
  },

  // Utilitaires
  copyToClipboard(text) {
    const unescaped = this.unescapeHtml(text);
    navigator.clipboard.writeText(unescaped).then(() => {
      alert("✅ تم النسخ بنجاح!");
    }).catch(err => {
      console.error("Copy failed:", err);
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'");
  },

  unescapeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }
};

// Rendre disponible globalement
window.AIAssistant = AIAssistant;

console.log("✅ AI Assistant module loaded");
