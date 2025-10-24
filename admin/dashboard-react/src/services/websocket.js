import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.listeners = new Map();
  }

  // Connexion au WebSocket
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  // Configuration des écouteurs d'événements
  setupEventListeners() {
    if (!this.socket) return;

    // Connexion établie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
      
      // Tentative de reconnexion automatique
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, ne pas reconnecter automatiquement
        return;
      }
      
      this.attemptReconnect();
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.isConnected = false;
      this.emit('connection_error', error);
      this.attemptReconnect();
    });

    // Événements métier
    this.socket.on('metric_update', (data) => {
      console.log('📊 Metric update received:', data);
      this.emit('metric_update', data);
    });

    this.socket.on('new_user', (user) => {
      console.log('👤 New user registered:', user);
      this.emit('new_user', user);
    });

    this.socket.on('new_order', (order) => {
      console.log('🛒 New order received:', order);
      this.emit('new_order', order);
    });

    this.socket.on('payment_received', (payment) => {
      console.log('💳 Payment received:', payment);
      this.emit('payment_received', payment);
    });

    this.socket.on('withdrawal_request', (withdrawal) => {
      console.log('💰 Withdrawal request:', withdrawal);
      this.emit('withdrawal_request', withdrawal);
    });

    this.socket.on('content_uploaded', (content) => {
      console.log('📹 Content uploaded:', content);
      this.emit('content_uploaded', content);
    });

    this.socket.on('review_submitted', (review) => {
      console.log('⭐ Review submitted:', review);
      this.emit('review_submitted', review);
    });

    this.socket.on('system_alert', (alert) => {
      console.log('🚨 System alert:', alert);
      this.emit('system_alert', alert);
    });

    this.socket.on('user_activity', (activity) => {
      console.log('👥 User activity:', activity);
      this.emit('user_activity', activity);
    });

    // Événements de performance
    this.socket.on('performance_metrics', (metrics) => {
      console.log('⚡ Performance metrics:', metrics);
      this.emit('performance_metrics', metrics);
    });

    // Événements de sécurité
    this.socket.on('security_alert', (alert) => {
      console.log('🔒 Security alert:', alert);
      this.emit('security_alert', alert);
    });

    // Événements de maintenance
    this.socket.on('maintenance_mode', (data) => {
      console.log('🔧 Maintenance mode:', data);
      this.emit('maintenance_mode', data);
    });
  }

  // Tentative de reconnexion
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.emit('reconnection_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Émission d'événements locaux
  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Ajout d'écouteurs d'événements
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      const listeners = this.listeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Suppression d'écouteurs d'événements
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Suppression de tous les écouteurs
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // Envoi d'événements au serveur
  emitToServer(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  // Requêtes en temps réel
  requestRealTimeData(dataType, params = {}) {
    this.emitToServer('request_data', { dataType, params });
  }

  // Souscription à des mises à jour spécifiques
  subscribeToUpdates(subscriptions) {
    this.emitToServer('subscribe', subscriptions);
  }

  // Désabonnement des mises à jour
  unsubscribeFromUpdates(subscriptions) {
    this.emitToServer('unsubscribe', subscriptions);
  }

  // Ping pour vérifier la connexion
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // Déconnexion
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Statut de connexion
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Reconnecter manuellement
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}

// Instance singleton du service WebSocket
const webSocketService = new WebSocketService();

export default webSocketService;
