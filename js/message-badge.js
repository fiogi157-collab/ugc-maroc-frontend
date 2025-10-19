// ===========================================================
// 💬 UGC Maroc - Badge de notifications messages
// ===========================================================

class MessageBadge {
  constructor() {
    this.unreadCount = 0;
    this.updateInterval = null;
    this.refreshRate = 30000; // 30 secondes
  }

  // Initialiser le badge
  async init() {
    await this.updateCount();
    this.startAutoRefresh();
    
    // Écouter les événements de mise à jour manuelle
    window.addEventListener('message-badge-refresh', () => this.updateCount());
  }

  // Mettre à jour le compteur de messages non lus
  async updateCount() {
    try {
      const supabaseClient = window.supabaseClient || window.supabase;
      if (!supabaseClient) {
        console.log('Supabase not ready, skipping badge update');
        return;
      }
      
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session || !session.user) {
        this.unreadCount = 0;
        this.updateBadges();
        return;
      }

      const userId = session.user.id;
      const response = await fetch(`/api/conversations/unread-count/${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.unreadCount = data.unread_count || 0;
        this.updateBadges();
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }

  // Mettre à jour tous les badges sur la page
  updateBadges() {
    const badges = document.querySelectorAll('.message-badge-count');
    
    badges.forEach(badge => {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });

    // Mettre à jour l'icône (changer de couleur si messages non lus)
    const icons = document.querySelectorAll('.message-icon');
    icons.forEach(icon => {
      if (this.unreadCount > 0) {
        icon.classList.add('text-primary');
        icon.classList.remove('text-gray-600');
      } else {
        icon.classList.remove('text-primary');
        icon.classList.add('text-gray-600');
      }
    });
  }

  // Démarrer le rafraîchissement automatique
  startAutoRefresh() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateCount();
    }, this.refreshRate);
  }

  // Arrêter le rafraîchissement automatique
  stopAutoRefresh() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Marquer les messages comme lus (décrementer le compteur)
  markAsRead(count = 1) {
    this.unreadCount = Math.max(0, this.unreadCount - count);
    this.updateBadges();
  }

  // Ajouter un nouveau message (incrémenter le compteur)
  incrementCount(count = 1) {
    this.unreadCount += count;
    this.updateBadges();
  }
}

// Instance globale
window.messageBadge = new MessageBadge();

// Auto-initialiser au chargement de Supabase
if (typeof supabase !== 'undefined' && supabase !== null) {
  messageBadge.init().catch(err => console.log('Message badge init deferred:', err.message));
} else if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null) {
  messageBadge.init().catch(err => console.log('Message badge init deferred:', err.message));
} else {
  // Attendre que Supabase soit chargé
  const waitForSupabase = () => {
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null) {
      messageBadge.init();
    } else {
      setTimeout(waitForSupabase, 100);
    }
  };
  setTimeout(waitForSupabase, 500);
}
