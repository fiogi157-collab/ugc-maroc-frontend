// ===========================================================
// 🎯 UGC Maroc - Modal de candidature pour créateurs
// ===========================================================

class ApplicationModal {
  constructor() {
    this.modalContainer = null;
    this.campaignData = null;
    this.draftKey = 'ugc_maroc_application_draft';
  }

  // Afficher le modal de candidature
  async show(campaignId) {
    try {
      // Charger les données de la campagne
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!campaignResponse.ok) {
        utils.showToast('خطأ في تحميل بيانات الحملة', 'error');
        return;
      }

      const campaignResult = await campaignResponse.json();
      this.campaignData = campaignResult.data;

      // Créer et afficher le modal
      this.createModal();
      this.loadDraft();
      this.setupEventListeners();
      
      // Charger les données complémentaires (brand rating, historique)
      await this.loadBrandRating();
      await this.loadCreatorHistory();
      this.calculateCompatibility();

    } catch (error) {
      console.error('Error showing application modal:', error);
      utils.showToast('خطأ في عرض نموذج التقديم', 'error');
    }
  }

  // Créer le HTML du modal
  createModal() {
    const budget = parseFloat(this.campaignData.price_per_ugc || this.campaignData.budget_per_video || 0);
    
    const modalHTML = `
      <div id="application-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-2xl font-bold mb-2">📝 نموذج التقديم</h2>
                <p class="text-purple-100">${this.campaignData.title}</p>
              </div>
              <button onclick="applicationModal.close()" class="text-white hover:text-gray-200">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-6">
            <!-- Compatibilité et informations -->
            <div id="compatibility-section" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">✨</span>
                <h3 class="font-bold text-blue-900 dark:text-blue-100">مدى التوافق مع الحملة</h3>
              </div>
              <div id="compatibility-content" class="text-sm text-blue-800 dark:text-blue-200">
                جاري التحقق من التوافق...
              </div>
            </div>

            <!-- Brand rating et historique -->
            <div id="brand-info-section" class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xl">⭐</span>
                  <h3 class="font-bold text-yellow-900 dark:text-yellow-100">تقييم العلامة التجارية</h3>
                </div>
                <div id="brand-rating-content" class="text-sm text-yellow-800 dark:text-yellow-200">
                  جاري التحميل...
                </div>
              </div>

              <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xl">📜</span>
                  <h3 class="font-bold text-green-900 dark:text-green-100">سجل التعاون</h3>
                </div>
                <div id="history-content" class="text-sm text-green-800 dark:text-green-200">
                  جاري التحميل...
                </div>
              </div>
            </div>

            <!-- Formulaire -->
            <form id="application-form" class="space-y-6">
              <!-- Message de motivation -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  رسالة التقديم (لماذا تريد هذه الحملة؟) <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="application_message"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="اشرح لماذا أنت الشخص المناسب لهذه الحملة، وكيف يمكنك إنشاء محتوى رائع..."
                  required
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">الحد الأدنى: 50 حرفاً</p>
              </div>

              <!-- Liens portfolio -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  روابط أعمالك السابقة (Portfolio)
                </label>
                <div id="portfolio-links-container" class="space-y-2">
                  <div class="flex gap-2">
                    <input
                      type="url"
                      class="portfolio-link flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://instagram.com/p/..."
                    />
                    <button type="button" onclick="applicationModal.addPortfolioLink()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">أضف روابط لأعمالك على Instagram، TikTok، YouTube، إلخ</p>
              </div>

              <!-- Prix proposé avec warning -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  السعر المقترح (درهم) <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="number"
                    id="proposed_price"
                    min="1"
                    step="0.01"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="أدخل السعر المقترح"
                    required
                  />
                </div>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-xs text-gray-500">
                    ميزانية الحملة: <strong class="text-purple-600">${utils.formatMAD(budget)}</strong>
                  </p>
                  <div id="price-warning" class="text-xs font-medium"></div>
                </div>
              </div>

              <!-- Délai de livraison -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  مدة التسليم (بالأيام) <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="delivery_days"
                  min="1"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="كم يوماً تحتاج لإنشاء المحتوى؟"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">المدة المقترحة: 3-7 أيام</p>
              </div>

              <!-- Notes supplémentaires -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  id="additional_notes"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="أي معلومات أخرى تريد مشاركتها مع العلامة التجارية..."
                ></textarea>
              </div>

              <!-- Boutons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  onclick="applicationModal.close()"
                  class="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
                >
                  📤 تقديم الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Ajouter le modal au DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    this.modalContainer = tempDiv.firstElementChild;
    document.body.appendChild(this.modalContainer);
  }

  // Ajouter un champ de lien portfolio
  addPortfolioLink() {
    const container = document.getElementById('portfolio-links-container');
    const newLinkHTML = `
      <div class="flex gap-2">
        <input
          type="url"
          class="portfolio-link flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="https://..."
        />
        <button type="button" onclick="this.parentElement.remove()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', newLinkHTML);
  }

  // Validation intelligente du prix
  validatePrice() {
    const priceInput = document.getElementById('proposed_price');
    const warningDiv = document.getElementById('price-warning');
    const proposedPrice = parseFloat(priceInput.value);
    const campaignBudget = parseFloat(this.campaignData.price_per_ugc || this.campaignData.budget_per_video || 0);

    if (!proposedPrice || proposedPrice <= 0 || !campaignBudget) {
      warningDiv.innerHTML = '';
      return;
    }

    const ratio = proposedPrice / campaignBudget;

    if (ratio > 3) {
      // Zone rouge
      warningDiv.innerHTML = `
        <span class="flex items-center gap-1 text-red-600">
          🔴 السعر مرتفع جداً، يُنصح بمراجعة عرضك
        </span>
      `;
      priceInput.classList.add('border-red-500');
      priceInput.classList.remove('border-yellow-500', 'border-green-500');
    } else if (ratio > 2) {
      // Zone jaune
      warningDiv.innerHTML = `
        <span class="flex items-center gap-1 text-yellow-600">
          ⚠️ السعر مرتفع، قد يقلل من فرص قبولك
        </span>
      `;
      priceInput.classList.add('border-yellow-500');
      priceInput.classList.remove('border-red-500', 'border-green-500');
    } else {
      // Zone verte
      warningDiv.innerHTML = `
        <span class="flex items-center gap-1 text-green-600">
          ✅ سعر تنافسي
        </span>
      `;
      priceInput.classList.add('border-green-500');
      priceInput.classList.remove('border-red-500', 'border-yellow-500');
    }
  }

  // Charger le rating de la marque
  async loadBrandRating() {
    try {
      const response = await fetch(`/api/profiles/${this.campaignData.brand_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const profile = result.data;
        const rating = profile.average_rating || 0;
        const ratingCount = profile.rating_count || 0;

        const ratingHTML = rating > 0 
          ? `⭐ ${rating.toFixed(1)} / 5.0 (${ratingCount} تقييم)`
          : 'لا يوجد تقييم بعد';

        document.getElementById('brand-rating-content').innerHTML = ratingHTML;
      }
    } catch (error) {
      console.error('Error loading brand rating:', error);
      document.getElementById('brand-rating-content').innerHTML = 'غير متاح';
    }
  }

  // Charger l'historique de collaboration
  async loadCreatorHistory() {
    try {
      // Vérifier si le créateur a déjà travaillé avec cette marque
      const response = await fetch(`/api/agreements?brand_id=${this.campaignData.brand_id}&creator_id=me&status=completed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const completedAgreements = result.data || [];

        const historyHTML = completedAgreements.length > 0
          ? `✅ عملت مع هذه العلامة ${completedAgreements.length} مرة`
          : '🆕 أول تعاون مع هذه العلامة';

        document.getElementById('history-content').innerHTML = historyHTML;
      }
    } catch (error) {
      console.error('Error loading creator history:', error);
      document.getElementById('history-content').innerHTML = '🆕 أول تعاون';
    }
  }

  // Calculer la compatibilité profil/campagne
  async calculateCompatibility() {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      const compatibilityItems = [];

      // Vérifier la catégorie
      if (profile.category === this.campaignData.category) {
        compatibilityItems.push('✅ تطابق الفئة');
      } else {
        compatibilityItems.push('⚠️ فئة مختلفة');
      }

      // Vérifier les followers (si applicable)
      const minFollowers = 1000; // Seuil minimum pour certaines campagnes
      if (profile.followers >= minFollowers) {
        compatibilityItems.push('✅ عدد متابعين جيد');
      }

      // Vérifier la langue
      if (profile.languages && this.campaignData.language) {
        try {
          const profileLanguages = JSON.parse(profile.languages);
          if (profileLanguages.includes(this.campaignData.language)) {
            compatibilityItems.push('✅ تطابق اللغة');
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }

      const compatibilityHTML = compatibilityItems.length > 0
        ? compatibilityItems.join(' • ')
        : 'جاري التحليل...';

      document.getElementById('compatibility-content').innerHTML = compatibilityHTML;
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      document.getElementById('compatibility-content').innerHTML = 'غير متاح';
    }
  }

  // Auto-sauvegarde dans localStorage
  saveDraft() {
    const formData = {
      campaign_id: this.campaignData.id,
      application_message: document.getElementById('application_message').value,
      portfolio_links: Array.from(document.querySelectorAll('.portfolio-link'))
        .map(input => input.value)
        .filter(link => link),
      proposed_price: document.getElementById('proposed_price').value,
      delivery_days: document.getElementById('delivery_days').value,
      additional_notes: document.getElementById('additional_notes').value,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(`${this.draftKey}_${this.campaignData.id}`, JSON.stringify(formData));
  }

  // Charger le brouillon
  loadDraft() {
    const draftKey = `${this.draftKey}_${this.campaignData.id}`;
    const draft = localStorage.getItem(draftKey);

    if (draft) {
      try {
        const data = JSON.parse(draft);
        
        // Restaurer les données
        document.getElementById('application_message').value = data.application_message || '';
        document.getElementById('proposed_price').value = data.proposed_price || '';
        document.getElementById('delivery_days').value = data.delivery_days || '';
        document.getElementById('additional_notes').value = data.additional_notes || '';

        // Restaurer les liens portfolio
        if (data.portfolio_links && data.portfolio_links.length > 0) {
          const container = document.getElementById('portfolio-links-container');
          container.innerHTML = '';
          data.portfolio_links.forEach((link, index) => {
            if (index === 0) {
              container.innerHTML = `
                <div class="flex gap-2">
                  <input
                    type="url"
                    value="${link}"
                    class="portfolio-link flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://..."
                  />
                  <button type="button" onclick="applicationModal.addPortfolioLink()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              `;
            } else {
              this.addPortfolioLink();
              const inputs = document.querySelectorAll('.portfolio-link');
              inputs[inputs.length - 1].value = link;
            }
          });
        }

        utils.showToast('تم استعادة بياناتك المحفوظة', 'success');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }

  // Configuration des événements
  setupEventListeners() {
    const form = document.getElementById('application-form');
    const priceInput = document.getElementById('proposed_price');

    // Validation du prix en temps réel
    priceInput.addEventListener('input', () => {
      this.validatePrice();
      this.saveDraft();
    });

    // Auto-sauvegarde sur tous les changements
    form.addEventListener('input', () => {
      this.saveDraft();
    });

    // Soumission du formulaire
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitApplication();
    });
  }

  // Soumettre la candidature
  async submitApplication() {
    try {
      // Récupérer les données du formulaire
      const application_message = document.getElementById('application_message').value.trim();
      const proposed_price = parseFloat(document.getElementById('proposed_price').value);
      const delivery_days = parseInt(document.getElementById('delivery_days').value);
      const additional_notes = document.getElementById('additional_notes').value.trim();
      
      // Récupérer les liens portfolio
      const portfolio_links = Array.from(document.querySelectorAll('.portfolio-link'))
        .map(input => input.value.trim())
        .filter(link => link);

      // Validation
      if (!application_message || application_message.length < 50) {
        utils.showToast('رسالة التقديم يجب أن تكون 50 حرفاً على الأقل', 'error');
        return;
      }

      if (!proposed_price || proposed_price <= 0) {
        utils.showToast('السعر المقترح يجب أن يكون أكبر من صفر', 'error');
        return;
      }

      if (!delivery_days || delivery_days <= 0) {
        utils.showToast('مدة التسليم يجب أن تكون أكبر من صفر', 'error');
        return;
      }

      // Envoyer la candidature
      const response = await fetch('/api/agreements/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          campaign_id: this.campaignData.id,
          proposed_price,
          application_message,
          portfolio_links: JSON.stringify(portfolio_links),
          delivery_days,
          additional_notes: additional_notes || null
        })
      });

      const result = await response.json();

      if (result.success) {
        utils.showToast(result.message, 'success');
        
        // Supprimer le brouillon
        localStorage.removeItem(`${this.draftKey}_${this.campaignData.id}`);
        
        // Fermer le modal
        this.close();

        // Recharger la liste des campagnes (pour mettre à jour le statut)
        if (typeof loadAvailableCampaigns === 'function') {
          loadAvailableCampaigns();
        }
      } else {
        utils.showToast(result.message || 'خطأ في تقديم الطلب', 'error');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      utils.showToast('خطأ في تقديم الطلب', 'error');
    }
  }

  // Fermer le modal
  close() {
    if (this.modalContainer) {
      this.modalContainer.remove();
      this.modalContainer = null;
      this.campaignData = null;
    }
  }
}

// Instance globale
const applicationModal = new ApplicationModal();
