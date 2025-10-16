// ===========================================================
// ↶ UGC Maroc - Système Undo/Redo
// ===========================================================

class UndoRedoManager {
  constructor() {
    this.history = [];
    this.maxHistorySize = 50;
    this.undoToast = null;
  }

  // Enregistrer une action annulable
  record(action) {
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift(); // Retirer la plus ancienne
    }

    this.history.push({
      id: Date.now(),
      ...action,
      timestamp: new Date().toISOString()
    });
  }

  // Annuler la dernière action
  undo(actionId = null) {
    const action = actionId 
      ? this.history.find(a => a.id === actionId)
      : this.history[this.history.length - 1];

    if (!action) {
      window.toastManager?.error('لا توجد إجراءات للتراجع عنها');
      return;
    }

    if (action.undoFn) {
      action.undoFn();
      
      // Retirer de l'historique
      const index = this.history.indexOf(action);
      if (index > -1) {
        this.history.splice(index, 1);
      }

      window.toastManager?.success('تم التراجع عن الإجراء بنجاح');
    }
  }

  // Actions prédéfinies
  actions = {
    // Suppression de campagne
    deleteCampaign: (campaign) => {
      return {
        type: 'delete_campaign',
        label: `حذف حملة "${campaign.title}"`,
        data: campaign,
        undoFn: async () => {
          try {
            // Restaurer la campagne via API
            const response = await fetch('/api/campaigns/restore', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify({ campaignId: campaign.id, data: campaign })
            });

            if (response.ok) {
              window.location.reload();
            } else {
              throw new Error('فشل استعادة الحملة');
            }
          } catch (error) {
            window.toastManager?.error('خطأ في استعادة الحملة');
            console.error(error);
          }
        }
      };
    },

    // Rejet de soumission
    rejectSubmission: (submission, campaignId) => {
      return {
        type: 'reject_submission',
        label: `رفض فيديو من ${submission.creator_name}`,
        data: { submission, campaignId },
        undoFn: async () => {
          try {
            const response = await fetch(`/api/brand/submissions/${submission.id}/unreject`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });

            if (response.ok) {
              window.location.reload();
            } else {
              throw new Error('فشل التراجع عن الرفض');
            }
          } catch (error) {
            window.toastManager?.error('خطأ في التراجع');
            console.error(error);
          }
        }
      };
    },

    // Suppression de créateur de liste
    removeCreator: (creator, listId) => {
      return {
        type: 'remove_creator',
        label: `إزالة ${creator.name} من القائمة`,
        data: { creator, listId },
        undoFn: async () => {
          try {
            const response = await fetch(`/api/lists/${listId}/add-creator`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify({ creatorId: creator.id })
            });

            if (response.ok) {
              window.location.reload();
            }
          } catch (error) {
            window.toastManager?.error('خطأ في الاستعادة');
            console.error(error);
          }
        }
      };
    },

    // Annulation de campagne
    cancelCampaign: (campaign) => {
      return {
        type: 'cancel_campaign',
        label: `إلغاء حملة "${campaign.title}"`,
        data: campaign,
        undoFn: async () => {
          try {
            const response = await fetch(`/api/campaigns/${campaign.id}/reactivate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });

            if (response.ok) {
              window.location.reload();
            }
          } catch (error) {
            window.toastManager?.error('خطأ في إعادة التفعيل');
            console.error(error);
          }
        }
      };
    },

    // Modification de budget
    changeBudget: (campaign, oldBudget, newBudget) => {
      return {
        type: 'change_budget',
        label: `تعديل ميزانية "${campaign.title}"`,
        data: { campaign, oldBudget, newBudget },
        undoFn: async () => {
          try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify({ budget_per_video: oldBudget })
            });

            if (response.ok) {
              window.location.reload();
            }
          } catch (error) {
            window.toastManager?.error('خطأ في استعادة الميزانية');
            console.error(error);
          }
        }
      };
    }
  };

  // Afficher toast avec option d'annulation
  showUndoToast(action, duration = 10000) {
    if (!window.toastManager) return;

    const actionLabel = action.label || 'تم تنفيذ الإجراء';
    
    const toast = window.toastManager.show(
      actionLabel,
      'info',
      duration,
      {
        label: '↶ تراجع',
        onClick: () => {
          this.undo(action.id);
          window.toastManager.dismiss(toast);
        }
      }
    );

    this.undoToast = toast;
    return toast;
  }

  // Helper: Exécuter une action avec possibilité d'annulation
  async execute(actionFn, undoableFn, label, showToast = true) {
    try {
      // Exécuter l'action
      const result = await actionFn();

      // Enregistrer pour annulation
      const action = {
        id: Date.now(),
        type: 'custom',
        label,
        undoFn: undoableFn,
        timestamp: new Date().toISOString()
      };

      this.record(action);

      // Afficher toast avec option d'annulation
      if (showToast) {
        this.showUndoToast(action);
      }

      return result;
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error);
      window.toastManager?.error('حدث خطأ أثناء تنفيذ الإجراء');
      throw error;
    }
  }

  // Effacer l'historique
  clearHistory() {
    this.history = [];
  }

  // Obtenir l'historique
  getHistory() {
    return this.history;
  }
}

// Helpers globaux pour actions courantes
window.undoRedoManager = new UndoRedoManager();

// Helper: Supprimer campagne avec undo
async function deleteCampaignWithUndo(campaignId, campaignData) {
  if (!confirm(`هل أنت متأكد من حذف الحملة "${campaignData.title}"؟`)) {
    return;
  }

  try {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (response.ok) {
      const action = window.undoRedoManager.actions.deleteCampaign(campaignData);
      window.undoRedoManager.record(action);
      window.undoRedoManager.showUndoToast(action);

      // Retirer de l'UI (ou recharger)
      setTimeout(() => {
        if (window.undoRedoManager.undoToast) {
          window.location.reload();
        }
      }, 10000);
    } else {
      throw new Error('فشل حذف الحملة');
    }
  } catch (error) {
    window.toastManager?.error('خطأ في حذف الحملة');
    console.error(error);
  }
}

// Helper: Rejeter soumission avec undo
async function rejectSubmissionWithUndo(submissionId, submissionData, reason) {
  try {
    const response = await fetch(`/api/brand/submissions/${submissionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ reason })
    });

    if (response.ok) {
      const action = window.undoRedoManager.actions.rejectSubmission(submissionData);
      window.undoRedoManager.record(action);
      window.undoRedoManager.showUndoToast(action);

      setTimeout(() => {
        if (window.undoRedoManager.undoToast) {
          window.location.reload();
        }
      }, 10000);
    }
  } catch (error) {
    window.toastManager?.error('خطأ في رفض الفيديو');
    console.error(error);
  }
}

// Exposer globalement
if (typeof window !== 'undefined') {
  window.deleteCampaignWithUndo = deleteCampaignWithUndo;
  window.rejectSubmissionWithUndo = rejectSubmissionWithUndo;
}
