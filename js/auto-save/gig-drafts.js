/**
 * Auto-save Gig Drafts
 * UGC Maroc - Sauvegarde automatique des brouillons de gigs
 */
class GigDraftManager {
  constructor() {
    this.draftKey = 'ugc_maroc_gig_draft';
    this.autoSaveInterval = 30000; // 30 secondes
    this.isAutoSaving = false;
    this.lastSaved = null;
    this.formElements = {};
    this.init();
  }

  /**
   * Initialiser l'auto-save pour les gigs
   */
  init() {
    // Vérifier le consentement fonctionnel
    if (!window.cookieManager || !window.cookieManager.hasConsent('functional')) {
      console.log('🔒 Auto-save blocked: No functional consent');
      return;
    }

    this.setupFormElements();
    this.loadExistingDraft();
    this.startAutoSave();
    this.setupFormListeners();
    
    console.log('✅ Gig auto-save initialized');
  }

  /**
   * Configurer les éléments de formulaire
   */
  setupFormElements() {
    this.formElements = {
      // Informations de base
      title: document.getElementById('gig-title') || document.querySelector('input[name="title"]'),
      description: document.getElementById('gig-description') || document.querySelector('textarea[name="description"]'),
      category: document.getElementById('gig-category') || document.querySelector('select[name="category"]'),
      subcategory: document.getElementById('gig-subcategory') || document.querySelector('select[name="subcategory"]'),
      
      // Prix et délais
      basePrice: document.getElementById('gig-base-price') || document.querySelector('input[name="base_price"]'),
      standardPrice: document.getElementById('gig-standard-price') || document.querySelector('input[name="standard_price"]'),
      premiumPrice: document.getElementById('gig-premium-price') || document.querySelector('input[name="premium_price"]'),
      deliveryTime: document.getElementById('gig-delivery-time') || document.querySelector('select[name="delivery_time"]'),
      
      // Packages
      basicPackage: document.getElementById('gig-basic-package') || document.querySelector('textarea[name="basic_package"]'),
      standardPackage: document.getElementById('gig-standard-package') || document.querySelector('textarea[name="standard_package"]'),
      premiumPackage: document.getElementById('gig-premium-package') || document.querySelector('textarea[name="premium_package"]'),
      
      // Exigences et livrables
      requirements: document.getElementById('gig-requirements') || document.querySelector('textarea[name="requirements"]'),
      deliverables: document.getElementById('gig-deliverables') || document.querySelector('textarea[name="deliverables"]'),
      revisions: document.getElementById('gig-revisions') || document.querySelector('input[name="revisions"]'),
      
      // Style et compétences
      style: document.getElementById('gig-style') || document.querySelector('select[name="style"]'),
      skills: document.getElementById('gig-skills') || document.querySelector('input[name="skills"]'),
      experience: document.getElementById('gig-experience') || document.querySelector('select[name="experience"]'),
      
      // Médias et formats
      mediaType: document.getElementById('gig-media-type') || document.querySelector('select[name="media_type"]'),
      videoLength: document.getElementById('gig-video-length') || document.querySelector('input[name="video_length"]'),
      imageCount: document.getElementById('gig-image-count') || document.querySelector('input[name="image_count"]'),
      
      // Portfolio et exemples
      portfolioItems: document.getElementById('gig-portfolio') || document.querySelector('input[name="portfolio"]'),
      examples: document.getElementById('gig-examples') || document.querySelector('textarea[name="examples"]'),
      previousWork: document.getElementById('gig-previous-work') || document.querySelector('textarea[name="previous_work"]'),
      
      // Langues et localisation
      languages: document.getElementById('gig-languages') || document.querySelector('select[name="languages"]'),
      location: document.getElementById('gig-location') || document.querySelector('input[name="location"]'),
      timezone: document.getElementById('gig-timezone') || document.querySelector('select[name="timezone"]'),
      
      // Disponibilité
      availability: document.getElementById('gig-availability') || document.querySelector('textarea[name="availability"]'),
      workingHours: document.getElementById('gig-working-hours') || document.querySelector('input[name="working_hours"]'),
      
      // Paramètres avancés
      isUrgent: document.getElementById('gig-urgent') || document.querySelector('input[name="is_urgent"]'),
      allowNegotiation: document.getElementById('gig-negotiation') || document.querySelector('input[name="allow_negotiation"]'),
      autoAccept: document.getElementById('gig-auto-accept') || document.querySelector('input[name="auto_accept"]'),
      
      // Tags et mots-clés
      tags: document.getElementById('gig-tags') || document.querySelector('input[name="tags"]'),
      keywords: document.getElementById('gig-keywords') || document.querySelector('input[name="keywords"]'),
      
      // Fichiers et ressources
      attachments: document.getElementById('gig-attachments') || document.querySelector('input[name="attachments"]'),
      resources: document.getElementById('gig-resources') || document.querySelector('textarea[name="resources"]'),
      
      // Contact et communication
      contactMethod: document.getElementById('gig-contact-method') || document.querySelector('select[name="contact_method"]'),
      responseTime: document.getElementById('gig-response-time') || document.querySelector('select[name="response_time"]'),
      
      // Conditions spéciales
      specialConditions: document.getElementById('gig-special-conditions') || document.querySelector('textarea[name="special_conditions"]'),
      cancellationPolicy: document.getElementById('gig-cancellation-policy') || document.querySelector('textarea[name="cancellation_policy"]')
    };
  }

  /**
   * Charger un brouillon existant
   */
  loadExistingDraft() {
    const draft = window.cookieManager.loadDraft('gig');
    if (!draft) return;

    // Restaurer les valeurs du formulaire
    Object.entries(draft).forEach(([key, value]) => {
      const element = this.formElements[key];
      if (element && value !== null && value !== undefined) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = value;
        } else if (element.tagName === 'SELECT') {
          // Gérer les sélections multiples
          if (Array.isArray(value)) {
            Array.from(element.options).forEach(option => {
              option.selected = value.includes(option.value);
            });
          } else {
            element.value = value;
          }
        } else {
          element.value = value;
        }
      }
    });

    // Afficher la notification de brouillon restauré
    this.showDraftRestoredNotification();
    
    console.log('📄 Gig draft restored');
  }

  /**
   * Démarrer l'auto-save
   */
  startAutoSave() {
    setInterval(() => {
      this.autoSave();
    }, this.autoSaveInterval);
  }

  /**
   * Sauvegarder automatiquement
   */
  autoSave() {
    if (this.isAutoSaving) return;
    
    const formData = this.collectFormData();
    if (this.hasFormData(formData)) {
      this.saveDraft(formData);
    }
  }

  /**
   * Collecter les données du formulaire
   * @returns {Object} Données du formulaire
   */
  collectFormData() {
    const data = {};
    
    Object.entries(this.formElements).forEach(([key, element]) => {
      if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          data[key] = element.checked;
        } else if (element.type === 'file') {
          // Ne pas sauvegarder les fichiers
          data[key] = null;
        } else if (element.tagName === 'SELECT' && element.multiple) {
          // Gérer les sélections multiples
          data[key] = Array.from(element.selectedOptions).map(option => option.value);
        } else {
          data[key] = element.value;
        }
      }
    });

    // Ajouter des métadonnées
    data._metadata = {
      pageUrl: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    return data;
  }

  /**
   * Vérifier si le formulaire contient des données
   * @param {Object} formData - Données du formulaire
   * @returns {boolean} True si contient des données
   */
  hasFormData(formData) {
    const fields = Object.keys(formData).filter(key => key !== '_metadata');
    return fields.some(key => {
      const value = formData[key];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Sauvegarder le brouillon
   * @param {Object} formData - Données à sauvegarder
   */
  saveDraft(formData) {
    if (!window.cookieManager.hasConsent('functional')) return;

    this.isAutoSaving = true;
    
    // Sauvegarder localement
    window.cookieManager.saveDraft('gig', formData);
    
    // Sauvegarder sur le serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.saveDraftToServer(userId, formData);
    }

    this.lastSaved = Date.now();
    this.isAutoSaving = false;
    
    console.log('💾 Gig draft auto-saved');
  }

  /**
   * Sauvegarder le brouillon sur le serveur
   * @param {string} userId - ID utilisateur
   * @param {Object} formData - Données du formulaire
   */
  async saveDraftToServer(userId, formData) {
    try {
      await fetch(`${window.location.origin}/api/cookies/drafts/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draftType: 'gig',
          draftData: formData,
          pageUrl: window.location.href
        })
      });
    } catch (error) {
      console.error('❌ Failed to save draft to server:', error);
    }
  }

  /**
   * Configurer les écouteurs de formulaire
   */
  setupFormListeners() {
    // Écouter les changements sur tous les éléments
    Object.values(this.formElements).forEach(element => {
      if (element) {
        element.addEventListener('input', () => {
          this.onFormChange();
        });
        
        element.addEventListener('change', () => {
          this.onFormChange();
        });
      }
    });

    // Écouter la soumission du formulaire
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', () => {
        this.clearDraft();
      });
    }

    // Écouter la navigation (beforeunload)
    window.addEventListener('beforeunload', () => {
      this.autoSave();
    });
  }

  /**
   * Gérer les changements de formulaire
   */
  onFormChange() {
    // Sauvegarder après 2 secondes d'inactivité
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, 2000);
  }

  /**
   * Afficher la notification de brouillon restauré
   */
  showDraftRestoredNotification() {
    const notification = document.createElement('div');
    notification.className = 'draft-notification';
    notification.innerHTML = `
      <div class="draft-notification-content">
        <span class="draft-notification-icon">🎨</span>
        <span class="draft-notification-text">Brouillon de gig restauré</span>
        <button class="draft-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Styles inline pour la notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #8B5CF6;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Supprimer le brouillon
   */
  clearDraft() {
    window.cookieManager.clearDraft('gig');
    
    // Supprimer du serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.deleteDraftFromServer(userId);
    }
    
    console.log('🗑️ Gig draft cleared');
  }

  /**
   * Supprimer le brouillon du serveur
   * @param {string} userId - ID utilisateur
   */
  async deleteDraftFromServer(userId) {
    try {
      await fetch(`${window.location.origin}/api/cookies/drafts/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draftType: 'gig'
        })
      });
    } catch (error) {
      console.error('❌ Failed to delete draft from server:', error);
    }
  }

  /**
   * Obtenir le statut du brouillon
   * @returns {Object} Statut du brouillon
   */
  getDraftStatus() {
    const draft = window.cookieManager.loadDraft('gig');
    return {
      hasDraft: !!draft,
      lastSaved: this.lastSaved,
      isAutoSaving: this.isAutoSaving,
      formElements: Object.keys(this.formElements).length
    };
  }

  /**
   * Forcer la sauvegarde
   */
  forceSave() {
    const formData = this.collectFormData();
    if (this.hasFormData(formData)) {
      this.saveDraft(formData);
      return true;
    }
    return false;
  }

  /**
   * Vérifier si le brouillon a des données
   * @returns {boolean} True si contient des données
   */
  hasDraftData() {
    const draft = window.cookieManager.loadDraft('gig');
    return draft && Object.keys(draft).length > 0;
  }
}

// Auto-initialiser si sur une page de création de gig
document.addEventListener('DOMContentLoaded', () => {
  const isGigPage = window.location.pathname.includes('gig') || 
                    document.querySelector('form[data-gig-form]') ||
                    document.querySelector('#gig-title');
  
  if (isGigPage) {
    window.gigDraftManager = new GigDraftManager();
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GigDraftManager;
}
