'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { SubscriptionPlan } from '../../types/enterprise';

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  visibility: string;
  features: Array<{ id: string; name: string; included: boolean }>;
}

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: PlanFormData) => void;
  editingPlan?: SubscriptionPlan | null;
}

export function CreatePlanModal({ isOpen, onClose, onSave, editingPlan }: CreatePlanModalProps) {
  // ⭐ FIXED: Use lazy initialization to avoid calling Date.now() during render
  const [formData, setFormData] = useState(() => {
    if (editingPlan) {
      return {
        name: editingPlan.name,
        description: editingPlan.description || '',
        price: editingPlan.price.toString(),
        duration: editingPlan.duration,
        visibility: editingPlan.visibility,
      };
    }
    return {
      name: '',
      description: '',
      price: '',
      duration: 'monthly',
      visibility: 'public',
    };
  });

  const [features, setFeatures] = useState(() => {
    if (editingPlan && editingPlan.features.length > 0) {
      return editingPlan.features.map(f => ({
        id: f.id,
        name: f.name,
        included: f.included,
      }));
    }
    return [{ id: '1', name: '', included: true }];
  });

  // Reset form when modal closes
  const handleClose = () => {
    // Reset to empty/new plan state
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: 'monthly',
      visibility: 'public',
    });
    setFeatures([{ id: '1', name: '', included: true }]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const planData: PlanFormData = {
      ...formData,
      price: formData.price,
      features: features.filter(f => f.name.trim() !== ''),
    };

    console.log('💾 Saving plan:', planData);
    onSave(planData);
  };

  const addFeature = () => {
    setFeatures([...features, { 
      id: Date.now().toString(), // This is fine inside event handler
      name: '', 
      included: true 
    }]);
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const updateFeature = (id: string, field: 'name' | 'included', value: string | boolean) => {
    setFeatures(features.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-300/10 bg-opacity-50 transition-opacity backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Plan Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Premium Membership"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the plan..."
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₦) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility *
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public (Anyone can subscribe)</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>

            {/* Features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Features
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature
                </button>
              </div>

              {features.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No features yet. Click &quot;Add Feature&quot; to add one.
                </p>
              )}

              <div className="space-y-2">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Feature name"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={feature.included}
                        onChange={(e) => updateFeature(feature.id, 'included', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Included
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFeature(feature.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}