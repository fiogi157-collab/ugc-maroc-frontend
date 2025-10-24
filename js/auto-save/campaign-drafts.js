/**
 * Auto-save Campaign Drafts
 * UGC Maroc - Sauvegarde automatique des brouillons de campagnes
 */
class CampaignDraftManager {
  constructor() {
    this.draftKey = 'ugc_maroc_campaign_draft';
    this.autoSaveInterval = 30000; // 30 secondes
    this.isAutoSaving = false;
    this.lastSaved = null;
    this.formElements = {};
    this.init();
  }

  /**
   * Initialiser l'auto-save pour les campagnes
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
    
    console.log('✅ Campaign auto-save initialized');
  }

  /**
   * Configurer les éléments de formulaire
   */
  setupFormElements() {
    this.formElements = {
      // Informations de base
      title: document.getElementById('campaign-title') || document.querySelector('input[name="title"]'),
      description: document.getElementById('campaign-description') || document.querySelector('textarea[name="description"]'),
      budget: document.getElementById('campaign-budget') || document.querySelector('input[name="budget"]'),
      deadline: document.getElementById('campaign-deadline') || document.querySelector('input[name="deadline"]'),
      
      // Catégorie et type
      category: document.getElementById('campaign-category') || document.querySelector('select[name="category"]'),
      type: document.getElementById('campaign-type') || document.querySelector('select[name="type"]'),
      
      // Exigences
      requirements: document.getElementById('campaign-requirements') || document.querySelector('textarea[name="requirements"]'),
      deliverables: document.getElementById('campaign-deliverables') || document.querySelector('textarea[name="deliverables"]'),
      
      // Audience
      targetAudience: document.getElementById('campaign-audience') || document.querySelector('textarea[name="target_audience"]'),
      ageRange: document.getElementById('campaign-age-range') || document.querySelector('select[name="age_range"]'),
      
      // Style et ton
      style: document.getElementById('campaign-style') || document.querySelector('select[name="style"]'),
      tone: document.getElementById('campaign-tone') || document.querySelector('select[name="tone"]'),
      
      // Médias
      mediaType: document.getElementById('campaign-media-type') || document.querySelector('select[name="media_type"]'),
      duration: document.getElementById('campaign-duration') || document.querySelector('input[name="duration"]'),
      
      // Budget détaillé
      basePrice: document.getElementById('campaign-base-price') || document.querySelector('input[name="base_price"]'),
      bonusPrice: document.getElementById('campaign-bonus-price') || document.querySelector('input[name="bonus_price"]'),
      
      // Fichiers et ressources
      attachments: document.getElementById('campaign-attachments') || document.querySelector('input[name="attachments"]'),
      resources: document.getElementById('campaign-resources') || document.querySelector('textarea[name="resources"]'),
      
      // Contact et communication
      contactMethod: document.getElementById('campaign-contact-method') || document.querySelector('select[name="contact_method"]'),
      communication: document.getElementById('campaign-communication') || document.querySelector('textarea[name="communication"]'),
      
      // Paramètres avancés
      isUrgent: document.getElementById('campaign-urgent') || document.querySelector('input[name="is_urgent"]'),
      allowNegotiation: document.getElementById('campaign-negotiation') || document.querySelector('input[name="allow_negotiation"]'),
      autoAccept: document.getElementById('campaign-auto-accept') || document.querySelector('input[name="auto_accept"]')
    };
  }

  /**
   * Charger un brouillon existant
   */
  loadExistingDraft() {
    const draft = window.cookieManager.loadDraft('campaign');
    if (!draft) return;

    // Restaurer les valeurs du formulaire
    Object.entries(draft).forEach(([key, value]) => {
      const element = this.formElements[key];
      if (element && value !== null && value !== undefined) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });

    // Afficher la notification de brouillon restauré
    this.showDraftRestoredNotification();
    
    console.log('📄 Campaign draft restored');
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
    window.cookieManager.saveDraft('campaign', formData);
    
    // Sauvegarder sur le serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.saveDraftToServer(userId, formData);
    }

    this.lastSaved = Date.now();
    this.isAutoSaving = false;
    
    console.log('💾 Campaign draft auto-saved');
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
          draftType: 'campaign',
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
        <span class="draft-notification-icon">📄</span>
        <span class="draft-notification-text">Brouillon restauré</span>
        <button class="draft-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Styles inline pour la notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
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
    window.cookieManager.clearDraft('campaign');
    
    // Supprimer du serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.deleteDraftFromServer(userId);
    }
    
    console.log('🗑️ Campaign draft cleared');
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
          draftType: 'campaign'
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
    const draft = window.cookieManager.loadDraft('campaign');
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
    const draft = window.cookieManager.loadDraft('campaign');
    return draft && Object.keys(draft).length > 0;
  }
}

// Auto-initialiser si sur une page de création de campagne
document.addEventListener('DOMContentLoaded', () => {
  const isCampaignPage = window.location.pathname.includes('campaign') || 
                         document.querySelector('form[data-campaign-form]') ||
                         document.querySelector('#campaign-title');
  
  if (isCampaignPage) {
    window.campaignDraftManager = new CampaignDraftManager();
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignDraftManager;
}
