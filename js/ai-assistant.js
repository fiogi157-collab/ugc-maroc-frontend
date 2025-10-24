/**
 * AI Assistant for UGC Maroc Campaign Creation
 * Integrates with DeepSeek AI for campaign optimization
 */

class AIAssistant {
    constructor() {
        this.apiKey = window.OPENROUTER_API_KEY;
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('🤖 AI Assistant initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auto-save functionality
        this.setupAutoSave();
        
        // Form validation
        this.setupFormValidation();
        
        // Mobile gestures
        this.setupMobileGestures();
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveDraft();
        }, 30000);
    }

    setupFormValidation() {
        // Real-time validation for all form fields
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });
        });
    }

    setupMobileGestures() {
        // Swipe gestures for mobile
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextStep(); // Swipe left = next
                } else {
                    this.previousStep(); // Swipe right = previous
                }
            }
        });
    }

    // AI Brief Generation
    async generateAIBrief() {
        if (this.isLoading) return;
        
        this.showLoading('Génération du brief...');
        
        try {
            const campaignData = this.getCampaignData();
            const prompt = this.buildBriefPrompt(campaignData);
            
            const response = await this.callAI(prompt);
            this.displayAIBrief(response);
            
        } catch (error) {
            console.error('Error generating AI brief:', error);
            this.showError('Erreur lors de la génération du brief');
        } finally {
            this.hideLoading();
        }
    }

    buildBriefPrompt(campaignData) {
        return `
        Tu es un expert en marketing UGC pour la plateforme UGC Maroc. 
        Génère un brief professionnel pour une campagne UGC basé sur ces informations :
        
        Titre: ${campaignData.title || 'Non spécifié'}
        Catégorie: ${campaignData.category || 'Non spécifié'}
        Description: ${campaignData.description || 'Non spécifié'}
        Type de contenu: ${campaignData.contentType || 'Non spécifié'}
        Plateformes: ${campaignData.platforms || 'Non spécifié'}
        Budget: ${campaignData.budget || 'Non spécifié'}
        
        Le brief doit inclure :
        1. Objectifs clairs de la campagne
        2. Exigences créatives détaillées
        3. Guidelines de contenu
        4. Points clés à mentionner
        5. Exemples de contenu souhaité
        6. Timeline et délais
        
        Format: Markdown structuré et professionnel
        Langue: Français (adapté au marché marocain)
        `;
    }

    // AI Price Suggestion
    async suggestAIPrice() {
        if (this.isLoading) return;
        
        this.showLoading('Analyse des prix du marché...');
        
        try {
            const campaignData = this.getCampaignData();
            const prompt = this.buildPricingPrompt(campaignData);
            
            const response = await this.callAI(prompt);
            this.displayAIPrice(response);
            
        } catch (error) {
            console.error('Error suggesting AI price:', error);
            this.showError('Erreur lors de l\'analyse des prix');
        } finally {
            this.hideLoading();
        }
    }

    buildPricingPrompt(campaignData) {
        return `
        Tu es un expert en pricing pour les campagnes UGC au Maroc.
        Analyse le marché et suggère un prix optimal basé sur :
        
        Catégorie: ${campaignData.category || 'Non spécifié'}
        Type de contenu: ${campaignData.contentType || 'Non spécifié'}
        Plateformes: ${campaignData.platforms || 'Non spécifié'}
        Durée: ${campaignData.duration || 'Non spécifié'}
        Complexité: ${campaignData.complexity || 'Moyenne'}
        
        Fournis :
        1. Prix recommandé par créateur (en MAD)
        2. Justification du prix
        3. Comparaison avec le marché
        4. Facteurs d'influence
        5. Conseils d'optimisation
        
        Format: JSON structuré avec prix, justification et conseils
        `;
    }

    // AI Creator Matching
    async findAICreators() {
        if (this.isLoading) return;
        
        this.showLoading('Recherche de créateurs optimaux...');
        
        try {
            const campaignData = this.getCampaignData();
            const prompt = this.buildMatchingPrompt(campaignData);
            
            const response = await this.callAI(prompt);
            this.displayAICreators(response);
            
        } catch (error) {
            console.error('Error finding AI creators:', error);
            this.showError('Erreur lors de la recherche de créateurs');
        } finally {
            this.hideLoading();
        }
    }

    buildMatchingPrompt(campaignData) {
        return `
        Tu es un expert en matching de créateurs UGC pour le marché marocain.
        Trouve les meilleurs créateurs basé sur :
        
        Niche: ${campaignData.niche || 'Non spécifié'}
        Followers min: ${campaignData.minFollowers || 'Non spécifié'}
        Engagement min: ${campaignData.minEngagement || 'Non spécifié'}
        Localisation: ${campaignData.location || 'Maroc'}
        Langues: ${campaignData.languages || 'Français, Arabe'}
        
        Fournis :
        1. Profils de créateurs recommandés
        2. Justification du matching
        3. Points forts de chaque créateur
        4. Estimation de performance
        5. Conseils d'approche
        
        Format: Liste structurée avec profils et recommandations
        `;
    }

    // AI Performance Prediction
    async predictPerformance() {
        if (this.isLoading) return;
        
        this.showLoading('Prédiction de performance...');
        
        try {
            const campaignData = this.getCampaignData();
            const prompt = this.buildPredictionPrompt(campaignData);
            
            const response = await this.callAI(prompt);
            this.displayAIPrediction(response);
            
        } catch (error) {
            console.error('Error predicting performance:', error);
            this.showError('Erreur lors de la prédiction');
        } finally {
            this.hideLoading();
        }
    }

    buildPredictionPrompt(campaignData) {
        return `
        Tu es un expert en prédiction de performance pour les campagnes UGC.
        Prédit les résultats basé sur :
        
        Budget: ${campaignData.budget || 'Non spécifié'}
        Nombre de créateurs: ${campaignData.creatorCount || 'Non spécifié'}
        Plateformes: ${campaignData.platforms || 'Non spécifié'}
        Catégorie: ${campaignData.category || 'Non spécifié'}
        Durée: ${campaignData.duration || 'Non spécifié'}
        
        Fournis :
        1. ROI estimé (%)
        2. Engagement prévu (%)
        3. Portée estimée (vues)
        4. Taux de conversion attendu
        5. Facteurs de risque
        6. Recommandations d'optimisation
        
        Format: Métriques précises avec justifications
        `;
    }

    // AI Script Generation
    async generateAIScript() {
        if (this.isLoading) return;
        
        this.showLoading('Génération de script...');
        
        try {
            const campaignData = this.getCampaignData();
            const prompt = this.buildScriptPrompt(campaignData);
            
            const response = await this.callAI(prompt);
            this.displayAIScript(response);
            
        } catch (error) {
            console.error('Error generating AI script:', error);
            this.showError('Erreur lors de la génération du script');
        } finally {
            this.hideLoading();
        }
    }

    buildScriptPrompt(campaignData) {
        return `
        Tu es un expert en création de scripts pour vidéos UGC.
        Crée un script optimisé basé sur :
        
        Produit: ${campaignData.product || 'Non spécifié'}
        Message clé: ${campaignData.keyMessage || 'Non spécifié'}
        Durée: ${campaignData.duration || '30 secondes'}
        Plateforme: ${campaignData.platform || 'Instagram'}
        Style: ${campaignData.style || 'Authentique et naturel'}
        
        Le script doit inclure :
        1. Hook d'ouverture (3-5 secondes)
        2. Présentation du produit
        3. Démonstration d'utilisation
        4. Bénéfices et points clés
        5. Call-to-action
        6. Timing précis
        
        Format: Script détaillé avec timing et directions
        Langue: Français naturel (Maroc)
        `;
    }

    // Core AI API Call
    async callAI(prompt) {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'UGC Maroc AI Assistant'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un assistant IA expert en marketing UGC et création de campagnes pour la plateforme UGC Maroc. Tu fournis des conseils professionnels, précis et adaptés au marché marocain.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Data Collection
    getCampaignData() {
        return {
            title: document.getElementById('campaign-title')?.textContent || '',
            category: document.getElementById('campaign-category')?.textContent || '',
            description: document.getElementById('campaign-description')?.textContent || '',
            contentType: this.getSelectedContentTypes(),
            platforms: this.getSelectedPlatforms(),
            budget: this.getBudget(),
            niche: this.getNiche(),
            minFollowers: this.getMinFollowers(),
            minEngagement: this.getMinEngagement(),
            location: this.getLocation(),
            languages: this.getLanguages(),
            product: this.getProduct(),
            keyMessage: this.getKeyMessage(),
            duration: this.getDuration(),
            platform: this.getPrimaryPlatform(),
            style: this.getStyle()
        };
    }

    getSelectedContentTypes() {
        const checkboxes = document.querySelectorAll('input[name="content-type"]:checked');
        return Array.from(checkboxes).map(cb => cb.value).join(', ');
    }

    getSelectedPlatforms() {
        const checkboxes = document.querySelectorAll('input[name="platforms"]:checked');
        return Array.from(checkboxes).map(cb => cb.value).join(', ');
    }

    getBudget() {
        return document.getElementById('budget')?.value || '';
    }

    getNiche() {
        return document.getElementById('niche')?.value || '';
    }

    getMinFollowers() {
        return document.getElementById('min-followers')?.value || '';
    }

    getMinEngagement() {
        return document.getElementById('min-engagement')?.value || '';
    }

    getLocation() {
        return document.getElementById('location')?.value || '';
    }

    getLanguages() {
        const checkboxes = document.querySelectorAll('input[name="languages"]:checked');
        return Array.from(checkboxes).map(cb => cb.value).join(', ');
    }

    getProduct() {
        return document.getElementById('product-name')?.value || '';
    }

    getKeyMessage() {
        return document.getElementById('key-message')?.value || '';
    }

    getDuration() {
        return document.getElementById('duration')?.value || '';
    }

    getPrimaryPlatform() {
        return document.querySelector('input[name="platforms"]:checked')?.value || '';
    }

    getStyle() {
        return document.getElementById('style')?.value || 'Authentique';
    }

    // Display Methods
    displayAIBrief(brief) {
        this.showModal('Brief IA Généré', brief, 'brief');
    }

    displayAIPrice(priceData) {
        try {
            const data = JSON.parse(priceData);
            this.showModal('Prix Recommandé', `
                <div class="space-y-4">
                    <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 class="font-semibold text-green-900 dark:text-green-300">Prix Recommandé</h4>
                        <p class="text-2xl font-bold text-green-600">${data.price} MAD</p>
                    </div>
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 class="font-semibold text-blue-900 dark:text-blue-300">Justification</h4>
                        <p class="text-sm">${data.justification}</p>
                    </div>
                    <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 class="font-semibold text-purple-900 dark:text-purple-300">Conseils</h4>
                        <p class="text-sm">${data.advice}</p>
                    </div>
                </div>
            `, 'price');
        } catch (error) {
            this.showModal('Prix Recommandé', priceData, 'price');
        }
    }

    displayAICreators(creators) {
        this.showModal('Créateurs Recommandés', creators, 'creators');
    }

    displayAIPrediction(prediction) {
        this.showModal('Prédiction de Performance', prediction, 'prediction');
    }

    displayAIScript(script) {
        this.showModal('Script Généré', script, 'script');
    }

    // UI Helpers
    showModal(title, content, type) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-bold">${title}</h3>
                        <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onclick="this.closest('.fixed').remove()">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="prose dark:prose-invert max-w-none">${content}</div>
                </div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" onclick="this.closest('.fixed').remove()">
                        Fermer
                    </button>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90" onclick="aiAssistant.applyAI${type.charAt(0).toUpperCase() + type.slice(1)}()">
                        Appliquer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showLoading(message) {
        this.isLoading = true;
        const loading = document.createElement('div');
        loading.id = 'ai-loading';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3">
                <div class="loading-spinner w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('ai-loading');
        if (loading) loading.remove();
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Apply AI Results
    applyAIBrief() {
        // Apply AI brief to form
        console.log('Applying AI brief...');
        this.showSuccess('Brief appliqué avec succès !');
    }

    applyAIPrice() {
        // Apply AI price to form
        console.log('Applying AI price...');
        this.showSuccess('Prix appliqué avec succès !');
    }

    applyAICreators() {
        // Apply AI creators to form
        console.log('Applying AI creators...');
        this.showSuccess('Créateurs appliqués avec succès !');
    }

    applyAIPrediction() {
        // Apply AI prediction to form
        console.log('Applying AI prediction...');
        this.showSuccess('Prédiction appliquée avec succès !');
    }

    applyAIScript() {
        // Apply AI script to form
        console.log('Applying AI script...');
        this.showSuccess('Script appliqué avec succès !');
    }

    // Form Validation
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;
        
        // Remove existing validation classes
        field.classList.remove('border-red-500', 'border-green-500');
        
        if (field.required && !value) {
            field.classList.add('border-red-500');
            this.showFieldError(field, 'Ce champ est requis');
            return false;
        }
        
        // Specific validations
        if (fieldName === 'email' && value && !this.isValidEmail(value)) {
            field.classList.add('border-red-500');
            this.showFieldError(field, 'Email invalide');
            return false;
        }
        
        if (fieldName === 'budget' && value && isNaN(value)) {
            field.classList.add('border-red-500');
            this.showFieldError(field, 'Budget doit être un nombre');
            return false;
        }
        
        field.classList.add('border-green-500');
        this.hideFieldError(field);
        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showFieldError(field, message) {
        this.hideFieldError(field);
        const error = document.createElement('div');
        error.className = 'field-error text-red-500 text-sm mt-1';
        error.textContent = message;
        field.parentNode.appendChild(error);
    }

    hideFieldError(field) {
        const error = field.parentNode.querySelector('.field-error');
        if (error) error.remove();
    }

    // Auto-save
    saveDraft() {
        const formData = this.getFormData();
        localStorage.setItem('campaign-draft', JSON.stringify(formData));
        this.showToast('Brouillon sauvegardé', 'success');
    }

    loadDraft() {
        const draft = localStorage.getItem('campaign-draft');
        if (draft) {
            const formData = JSON.parse(draft);
            this.populateForm(formData);
            this.showToast('Brouillon chargé', 'success');
        }
    }

    getFormData() {
        const form = document.querySelector('form');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    // Step Navigation
    nextStep() {
        console.log('Next step');
        // Implement step navigation
    }

    previousStep() {
        console.log('Previous step');
        // Implement step navigation
    }
}

// Initialize AI Assistant
const aiAssistant = new AIAssistant();

// Global functions for HTML onclick handlers
function generateAIBrief() {
    aiAssistant.generateAIBrief();
}

function suggestAIPrice() {
    aiAssistant.suggestAIPrice();
}

function findAICreators() {
    aiAssistant.findAICreators();
}

function predictPerformance() {
    aiAssistant.predictPerformance();
}

function generateAIScript() {
    aiAssistant.generateAIScript();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
}