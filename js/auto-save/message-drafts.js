/**
 * Auto-save Message Drafts
 * UGC Maroc - Sauvegarde automatique des brouillons de messages
 */
class MessageDraftManager {
  constructor() {
    this.draftKey = 'ugc_maroc_message_draft';
    this.autoSaveInterval = 10000; // 10 secondes (plus fréquent pour les messages)
    this.isAutoSaving = false;
    this.lastSaved = null;
    this.messageElements = {};
    this.conversationId = null;
    this.init();
  }

  /**
   * Initialiser l'auto-save pour les messages
   */
  init() {
    // Vérifier le consentement fonctionnel
    if (!window.cookieManager || !window.cookieManager.hasConsent('functional')) {
      console.log('🔒 Auto-save blocked: No functional consent');
      return;
    }

    this.detectConversationId();
    this.setupMessageElements();
    this.loadExistingDraft();
    this.startAutoSave();
    this.setupMessageListeners();
    
    console.log('✅ Message auto-save initialized');
  }

  /**
   * Détecter l'ID de conversation
   */
  detectConversationId() {
    // Essayer plusieurs méthodes pour détecter l'ID de conversation
    this.conversationId = 
      document.querySelector('[data-conversation-id]')?.dataset.conversationId ||
      document.querySelector('#conversation-id')?.value ||
      new URLSearchParams(window.location.search).get('conversation_id') ||
      window.location.pathname.match(/\/conversations\/(\w+)/)?.[1] ||
      'default';
    
    console.log('💬 Conversation ID detected:', this.conversationId);
  }

  /**
   * Configurer les éléments de message
   */
  setupMessageElements() {
    this.messageElements = {
      // Message principal
      message: document.getElementById('message-text') || 
               document.querySelector('textarea[name="message"]') ||
               document.querySelector('textarea[placeholder*="message"]') ||
               document.querySelector('textarea[placeholder*="Message"]'),
      
      // Sujet (si applicable)
      subject: document.getElementById('message-subject') || 
               document.querySelector('input[name="subject"]'),
      
      // Type de message
      messageType: document.getElementById('message-type') || 
                   document.querySelector('select[name="message_type"]'),
      
      // Priorité
      priority: document.getElementById('message-priority') || 
                document.querySelector('select[name="priority"]'),
      
      // Pièces jointes
      attachments: document.getElementById('message-attachments') || 
                   document.querySelector('input[name="attachments"]'),
      
      // Réponse à un message spécifique
      replyTo: document.getElementById('message-reply-to') || 
               document.querySelector('input[name="reply_to"]'),
      
      // Mentions
      mentions: document.getElementById('message-mentions') || 
                document.querySelector('input[name="mentions"]'),
      
      // Émojis et réactions
      emoji: document.getElementById('message-emoji') || 
             document.querySelector('button[data-emoji]'),
      
      // Paramètres avancés
      isUrgent: document.getElementById('message-urgent') || 
                document.querySelector('input[name="is_urgent"]'),
      
      // Signature
      signature: document.getElementById('message-signature') || 
                 document.querySelector('textarea[name="signature"]')
    };
  }

  /**
   * Charger un brouillon existant
   */
  loadExistingDraft() {
    const draft = window.cookieManager.loadDraft(`message_${this.conversationId}`);
    if (!draft) return;

    // Restaurer les valeurs du formulaire
    Object.entries(draft).forEach(([key, value]) => {
      const element = this.messageElements[key];
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
    
    console.log('📄 Message draft restored for conversation:', this.conversationId);
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
    
    const messageData = this.collectMessageData();
    if (this.hasMessageData(messageData)) {
      this.saveDraft(messageData);
    }
  }

  /**
   * Collecter les données du message
   * @returns {Object} Données du message
   */
  collectMessageData() {
    const data = {};
    
    Object.entries(this.messageElements).forEach(([key, element]) => {
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
      conversationId: this.conversationId,
      pageUrl: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    return data;
  }

  /**
   * Vérifier si le message contient des données
   * @param {Object} messageData - Données du message
   * @returns {boolean} True si contient des données
   */
  hasMessageData(messageData) {
    const messageText = messageData.message || '';
    return messageText.trim().length > 0;
  }

  /**
   * Sauvegarder le brouillon
   * @param {Object} messageData - Données à sauvegarder
   */
  saveDraft(messageData) {
    if (!window.cookieManager.hasConsent('functional')) return;

    this.isAutoSaving = true;
    
    // Sauvegarder localement avec l'ID de conversation
    window.cookieManager.saveDraft(`message_${this.conversationId}`, messageData);
    
    // Sauvegarder sur le serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.saveDraftToServer(userId, messageData);
    }

    this.lastSaved = Date.now();
    this.isAutoSaving = false;
    
    console.log('💾 Message draft auto-saved for conversation:', this.conversationId);
  }

  /**
   * Sauvegarder le brouillon sur le serveur
   * @param {string} userId - ID utilisateur
   * @param {Object} messageData - Données du message
   */
  async saveDraftToServer(userId, messageData) {
    try {
      await fetch(`${window.location.origin}/api/cookies/drafts/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draftType: 'message',
          draftData: messageData,
          conversationId: this.conversationId,
          pageUrl: window.location.href
        })
      });
    } catch (error) {
      console.error('❌ Failed to save message draft to server:', error);
    }
  }

  /**
   * Configurer les écouteurs de message
   */
  setupMessageListeners() {
    // Écouter les changements sur tous les éléments
    Object.values(this.messageElements).forEach(element => {
      if (element) {
        element.addEventListener('input', () => {
          this.onMessageChange();
        });
        
        element.addEventListener('change', () => {
          this.onMessageChange();
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

    // Écouter les changements de conversation
    window.addEventListener('conversationChanged', (event) => {
      this.onConversationChange(event.detail.conversationId);
    });
  }

  /**
   * Gérer les changements de message
   */
  onMessageChange() {
    // Sauvegarder après 1 seconde d'inactivité (plus rapide pour les messages)
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, 1000);
  }

  /**
   * Gérer les changements de conversation
   * @param {string} newConversationId - Nouvel ID de conversation
   */
  onConversationChange(newConversationId) {
    // Sauvegarder le brouillon actuel
    this.autoSave();
    
    // Changer de conversation
    this.conversationId = newConversationId;
    
    // Charger le brouillon de la nouvelle conversation
    this.loadExistingDraft();
    
    console.log('💬 Switched to conversation:', newConversationId);
  }

  /**
   * Afficher la notification de brouillon restauré
   */
  showDraftRestoredNotification() {
    const notification = document.createElement('div');
    notification.className = 'draft-notification';
    notification.innerHTML = `
      <div class="draft-notification-content">
        <span class="draft-notification-icon">💬</span>
        <span class="draft-notification-text">Message restauré</span>
        <button class="draft-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Styles inline pour la notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3B82F6;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 3 secondes (plus court pour les messages)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Supprimer le brouillon
   */
  clearDraft() {
    window.cookieManager.clearDraft(`message_${this.conversationId}`);
    
    // Supprimer du serveur si utilisateur connecté
    const userId = window.cookieManager.getCurrentUserId();
    if (userId) {
      this.deleteDraftFromServer(userId);
    }
    
    console.log('🗑️ Message draft cleared for conversation:', this.conversationId);
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
          draftType: 'message',
          conversationId: this.conversationId
        })
      });
    } catch (error) {
      console.error('❌ Failed to delete message draft from server:', error);
    }
  }

  /**
   * Obtenir le statut du brouillon
   * @returns {Object} Statut du brouillon
   */
  getDraftStatus() {
    const draft = window.cookieManager.loadDraft(`message_${this.conversationId}`);
    return {
      hasDraft: !!draft,
      lastSaved: this.lastSaved,
      isAutoSaving: this.isAutoSaving,
      conversationId: this.conversationId,
      messageElements: Object.keys(this.messageElements).length
    };
  }

  /**
   * Forcer la sauvegarde
   */
  forceSave() {
    const messageData = this.collectMessageData();
    if (this.hasMessageData(messageData)) {
      this.saveDraft(messageData);
      return true;
    }
    return false;
  }

  /**
   * Vérifier si le brouillon a des données
   * @returns {boolean} True si contient des données
   */
  hasDraftData() {
    const draft = window.cookieManager.loadDraft(`message_${this.conversationId}`);
    return draft && Object.keys(draft).length > 0;
  }

  /**
   * Obtenir tous les brouillons de messages
   * @returns {Object} Tous les brouillons
   */
  getAllMessageDrafts() {
    const drafts = {};
    const allDrafts = window.cookieManager.getAllDrafts();
    
    Object.keys(allDrafts).forEach(key => {
      if (key.startsWith('message_')) {
        const conversationId = key.replace('message_', '');
        drafts[conversationId] = allDrafts[key];
      }
    });
    
    return drafts;
  }

  /**
   * Supprimer tous les brouillons de messages
   */
  clearAllMessageDrafts() {
    const allDrafts = this.getAllMessageDrafts();
    Object.keys(allDrafts).forEach(conversationId => {
      window.cookieManager.clearDraft(`message_${conversationId}`);
    });
    
    console.log('🗑️ All message drafts cleared');
  }
}

// Auto-initialiser si sur une page de messages
document.addEventListener('DOMContentLoaded', () => {
  const isMessagePage = window.location.pathname.includes('message') || 
                       window.location.pathname.includes('chat') ||
                       document.querySelector('form[data-message-form]') ||
                       document.querySelector('textarea[placeholder*="message"]') ||
                       document.querySelector('textarea[placeholder*="Message"]');
  
  if (isMessagePage) {
    window.messageDraftManager = new MessageDraftManager();
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageDraftManager;
}
