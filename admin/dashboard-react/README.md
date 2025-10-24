# UGC Maroc Admin Dashboard

Dashboard administrateur de niveau international pour la plateforme UGC Maroc, construit avec React 18, Material-UI v5, et des technologies modernes.

## 🚀 Technologies Utilisées

### Frontend
- **React 18** - Framework JavaScript moderne
- **Material-UI v5** - Composants UI premium avec MUI X
- **ApexCharts** - Graphiques interactifs et professionnels
- **Redux Toolkit** - Gestion d'état globale
- **React Query** - Cache et synchronisation serveur
- **Socket.IO Client** - Communication temps réel
- **Framer Motion** - Animations fluides
- **Vite** - Build tool ultra-rapide

### Backend Integration
- **REST API** - Communication avec le backend Node.js
- **WebSocket** - Données temps réel
- **Authentication** - JWT tokens
- **Real-time Updates** - Métriques live

## 🎨 Fonctionnalités

### Interface Utilisateur
- ✅ **Design System** - Thème Material-UI personnalisé
- ✅ **Dark Mode** - Support thème sombre/clair
- ✅ **Responsive** - Mobile-first design
- ✅ **Glassmorphism** - Effets visuels modernes
- ✅ **Animations** - Transitions fluides avec Framer Motion
- ✅ **Multi-langue** - Support AR/FR/EN

### Dashboard
- ✅ **Métriques Principales** - KPIs en temps réel
- ✅ **Graphiques Interactifs** - ApexCharts professionnels
- ✅ **Auto-refresh** - Mise à jour automatique
- ✅ **WebSocket** - Données live
- ✅ **Export** - Rapports PDF/Excel
- ✅ **Filtres Avancés** - Recherche et filtrage

### Gestion des Données
- ✅ **State Management** - Redux Toolkit
- ✅ **Cache Intelligent** - React Query
- ✅ **Optimistic Updates** - Mises à jour optimistes
- ✅ **Error Handling** - Gestion d'erreurs robuste
- ✅ **Loading States** - États de chargement

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── layout/         # Layout principal
│   ├── widgets/        # Widgets du dashboard
│   └── common/         # Composants communs
├── features/           # Fonctionnalités métier
│   └── dashboard/      # Dashboard principal
├── services/           # Services API
│   ├── api.js         # Service API REST
│   └── websocket.js   # Service WebSocket
├── store/             # Redux store
│   ├── slices/        # Redux slices
│   └── store.js       # Configuration store
├── theme/             # Thème Material-UI
│   └── theme.js       # Configuration thème
├── config/            # Configuration app
│   └── app.js         # Variables d'environnement
└── App.jsx            # Composant racine
```

## 🛠️ Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Configuration
1. Copier `.env.example` vers `.env`
2. Configurer les variables d'environnement
3. Démarrer le serveur backend sur le port 5000

### Démarrage
```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

## 🔧 Configuration

### Variables d'Environnement
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=UGC Maroc Admin
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME=true
```

### Thème
Le thème est configuré dans `src/theme/theme.js` avec :
- Palette de couleurs personnalisée
- Typographie Inter
- Ombres glassmorphism
- Composants Material-UI personnalisés

## 📊 Métriques Disponibles

### Principales
- **Revenus Totaux** - Chiffre d'affaires
- **Utilisateurs Actifs** - Utilisateurs connectés
- **Commandes en Cours** - Commandes en attente
- **Paiements Reçus** - Paiements validés

### Secondaires
- **Retraits Totaux** - Montants retirés
- **Contenu Modéré** - Contenu validé
- **Alertes Sécurité** - Alertes système
- **Commission Plateforme** - Revenus plateforme

## 🔄 Temps Réel

### WebSocket Events
- `metric_update` - Mise à jour métriques
- `new_user` - Nouvel utilisateur
- `new_order` - Nouvelle commande
- `payment_received` - Paiement reçu
- `withdrawal_request` - Demande de retrait
- `content_uploaded` - Contenu uploadé
- `review_submitted` - Avis soumis
- `system_alert` - Alerte système

### Auto-refresh
- Métriques : 30 secondes
- Graphiques : 30 secondes
- Notifications : Temps réel

## 🎯 Roadmap

### Phase 1 - Infrastructure ✅
- [x] Setup React + Vite
- [x] Material-UI v5 + Thème
- [x] Redux Toolkit + React Query
- [x] WebSocket Integration
- [x] Layout Responsive

### Phase 2 - Dashboard Core ✅
- [x] Métriques principales
- [x] Graphiques ApexCharts
- [x] Temps réel
- [x] Auto-refresh
- [x] Dark mode

### Phase 3 - Fonctionnalités Avancées 🚧
- [ ] Gestion utilisateurs
- [ ] Gestion commandes
- [ ] Gestion paiements
- [ ] Analytics avancées
- [ ] Export rapports

### Phase 4 - Enterprise Features 📋
- [ ] AI Insights
- [ ] Notifications push
- [ ] Audit logs
- [ ] Multi-tenant
- [ ] API rate limiting

## 🚀 Performance

### Optimisations
- **Code Splitting** - Lazy loading des routes
- **Bundle Optimization** - Chunks optimisés
- **Tree Shaking** - Suppression code inutilisé
- **Memoization** - React.memo et useMemo
- **Virtual Scrolling** - Tables performantes

### Métriques
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Time to Interactive** < 3.5s
- **Bundle Size** < 500KB gzipped

## 🔒 Sécurité

### Authentification
- JWT tokens
- Refresh tokens
- Session management
- Role-based access

### Protection
- XSS protection
- CSRF protection
- Input validation
- Rate limiting

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 600px
- **Tablet** : 600px - 900px
- **Desktop** : 900px - 1200px
- **Large** : > 1200px

### Adaptations
- Sidebar collapsible
- Navigation mobile
- Touch optimizations
- Responsive charts

## 🌐 Internationalisation

### Langues Supportées
- **Arabe** (ar) - Langue principale
- **Français** (fr) - Langue secondaire
- **Anglais** (en) - Langue internationale

### RTL Support
- Support complet RTL
- Layout adaptatif
- Icons directionnels

## 🧪 Tests

### Types de Tests
- **Unit Tests** - Jest + React Testing Library
- **Integration Tests** - Tests d'intégration
- **E2E Tests** - Cypress

### Coverage
- Target : 80%+ coverage
- Critical paths : 100% coverage

## 📈 Analytics

### Métriques Trackées
- Page views
- User interactions
- Performance metrics
- Error tracking

### Outils
- Google Analytics 4
- Mixpanel
- Custom analytics

## 🤝 Contribution

### Guidelines
1. Fork le projet
2. Créer une branche feature
3. Commit avec messages clairs
4. Push et créer une PR

### Code Style
- ESLint + Prettier
- Conventional Commits
- TypeScript (optionnel)

## 📄 Licence

Propriétaire - UGC Maroc

## 🆘 Support

### Documentation
- README détaillé
- Code comments
- Storybook (à venir)

### Contact
- Email : support@ugcmaroc.com
- Documentation : [docs.ugcmaroc.com](https://docs.ugcmaroc.com)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Octobre 2024  
**Statut** : En développement actif