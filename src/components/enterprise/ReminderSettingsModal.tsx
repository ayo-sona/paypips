import React, { useState } from 'react';
import { X, Save, Bell, Mail, MessageSquare, Clock, AlertCircle, Settings, } from 'lucide-react';

interface ReminderSettings {
  // Automation
  autoRemindersEnabled: boolean;
  
  // Timing
  firstReminderDays: number;
  secondReminderDays: number;
  thirdReminderDays: number;
  overdueReminderDays: number;
  maxReminders: number;
  
  // Channels
  preferredChannel: 'email' | 'sms' | 'both';
  emailEnabled: boolean;
  smsEnabled: boolean;
  
  // Sending Hours
  sendingStartHour: number;
  sendingEndHour: number;
  sendOnWeekends: boolean;
  
  // Templates
  defaultUpcomingTemplate: number;
  defaultOverdueTemplate: number;
  
  // Thresholds
  minDaysBeforeReminder: number;
  stopRemindersAfterDays: number;
}

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onSave: (settings: ReminderSettings) => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(settings);
  const [activeTab, setActiveTab] = useState<'automation' | 'channels' | 'timing' | 'advanced'>('automation');
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reminder Settings</h2>
              <p className="text-gray-600 mt-1">Configure automated payment reminder preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'automation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Automation
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Channels
            </button>
            <button
              onClick={() => setActiveTab('timing')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'timing'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Timing
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Advanced
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Automated Reminders</p>
                      <p className="text-sm text-gray-600">
                        Automatically send reminders based on membership expiry dates
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.autoRemindersEnabled}
                      onChange={(e) => updateSetting('autoRemindersEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {localSettings.autoRemindersEnabled && (
                <>
                  {/* Reminder Schedule */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminder Schedule</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Reminder (days before expiry)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={localSettings.firstReminderDays}
                            onChange={(e) => updateSetting('firstReminderDays', Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Second Reminder (days before expiry)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={localSettings.secondReminderDays}
                            onChange={(e) => updateSetting('secondReminderDays', Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Third Reminder (days before expiry)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={localSettings.thirdReminderDays}
                            onChange={(e) => updateSetting('thirdReminderDays', Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overdue Reminder (every X days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={localSettings.overdueReminderDays}
                            onChange={(e) => updateSetting('overdueReminderDays', Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Recommended Schedule:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>First reminder: 14 days before expiry</li>
                            <li>Second reminder: 7 days before expiry</li>
                            <li>Third reminder: 3 days before expiry</li>
                            <li>Overdue: Every 3 days after expiry</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Max Reminders */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Total Reminders per Member
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={localSettings.maxReminders}
                      onChange={(e) => updateSetting('maxReminders', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Stop sending automated reminders after this many attempts
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Delivery Channel</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => updateSetting('preferredChannel', 'email')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localSettings.preferredChannel === 'email'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className={`w-8 h-8 mx-auto mb-2 ${
                      localSettings.preferredChannel === 'email' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">Email Only</div>
                    <div className="text-xs text-gray-500 mt-1">Most cost-effective</div>
                  </button>
                  <button
                    onClick={() => updateSetting('preferredChannel', 'sms')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localSettings.preferredChannel === 'sms'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${
                      localSettings.preferredChannel === 'sms' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">SMS Only</div>
                    <div className="text-xs text-gray-500 mt-1">Higher open rate</div>
                  </button>
                  <button
                    onClick={() => updateSetting('preferredChannel', 'both')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localSettings.preferredChannel === 'both'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-center gap-1 mb-2">
                      <Mail className={`w-6 h-6 ${
                        localSettings.preferredChannel === 'both' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <MessageSquare className={`w-6 h-6 ${
                        localSettings.preferredChannel === 'both' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Both</div>
                    <div className="text-xs text-gray-500 mt-1">Maximum reach</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Email</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.emailEnabled}
                        onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Send reminders via email to member&apos;s registered email address
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Cost per send:</span>
                      <span className="font-medium">₦2</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Avg. open rate:</span>
                      <span className="font-medium">25-30%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">SMS</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.smsEnabled}
                        onChange={(e) => updateSetting('smsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Send reminders via SMS to member&apos;s registered phone number
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Cost per send:</span>
                      <span className="font-medium">₦10</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Avg. open rate:</span>
                      <span className="font-medium">90-95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timing Tab */}
          {activeTab === 'timing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sending Hours</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set the hours during which automated reminders can be sent
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <select
                      value={localSettings.sendingStartHour}
                      onChange={(e) => updateSetting('sendingStartHour', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <select
                      value={localSettings.sendingEndHour}
                      onChange={(e) => updateSetting('sendingEndHour', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 9:00 AM to 6:00 PM for better engagement
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Send on Weekends</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow automated reminders to be sent on Saturdays and Sundays
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.sendOnWeekends}
                      onChange={(e) => updateSetting('sendOnWeekends', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminder Thresholds</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Days Before First Reminder
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={localSettings.minDaysBeforeReminder}
                      onChange={(e) => updateSetting('minDaysBeforeReminder', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Don&apos;t send reminders to memberships expiring less than this many days
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stop Reminders After (days overdue)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={localSettings.stopRemindersAfterDays}
                      onChange={(e) => updateSetting('stopRemindersAfterDays', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Stop sending reminders after account has been overdue for this many days
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Templates</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upcoming Expiry Template
                    </label>
                    <select
                      value={localSettings.defaultUpcomingTemplate}
                      onChange={(e) => updateSetting('defaultUpcomingTemplate', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>Upcoming Expiry - Friendly</option>
                      <option value={4}>Gentle Reminder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overdue Payment Template
                    </label>
                    <select
                      value={localSettings.defaultOverdueTemplate}
                      onChange={(e) => updateSetting('defaultOverdueTemplate', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={2}>Overdue Payment - Urgent</option>
                      <option value={3}>Final Notice - Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Reset Changes
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>

        {/* Changes indicator */}
        {hasChanges && (
          <div className="absolute top-4 right-20 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};