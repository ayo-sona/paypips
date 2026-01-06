import React, { useState } from 'react';
import { X, Send, Mail, MessageSquare, AlertCircle, CheckCircle, User, Calendar, DollarSign, Eye, EyeOff } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'upcoming' | 'overdue';
  amountDue: number;
}

interface ReminderTemplate {
  id: number;
  name: string;
  subject: string;
  message: string;
  type?: 'upcoming' | 'overdue' | 'final';
}

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMembers: Member[];
  onSend: (data: SendReminderData) => void;
}

interface SendReminderData {
  memberIds: number[];
  channel: 'email' | 'sms' | 'both';
  templateId: number;
  customMessage?: string;
  scheduledDate?: string;
}

const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    id: 1,
    name: 'Upcoming Expiry - Friendly',
    subject: 'Your Membership Expires Soon 📅',
    message: `Hi {name},

This is a friendly reminder that your {membershipType} membership will expire on {expiryDate}.

To continue enjoying uninterrupted access to our services, please renew your membership at your earliest convenience.

Renewal Amount: ₦{amount}

Thank you for being a valued member!

Best regards,
The Team`,
    type: 'upcoming'
  },
  {
    id: 2,
    name: 'Overdue Payment - Urgent',
    subject: '⚠️ Payment Overdue - Action Required',
    message: `Hi {name},

We notice that your {membershipType} membership expired on {expiryDate}.

To reactivate your account and restore full access, please make a payment of ₦{amount} as soon as possible.

If you've already made this payment, please disregard this message.

Questions? Contact us anytime.

Best regards,
The Team`,
    type: 'overdue'
  },
  {
    id: 3,
    name: 'Final Notice - Critical',
    subject: '🚨 Final Notice - Membership Suspension Imminent',
    message: `Hi {name},

FINAL NOTICE: Your membership has been overdue since {expiryDate}.

Your account will be suspended within 48 hours if we don't receive payment of ₦{amount}.

Please act now to avoid service interruption.

Payment is urgent.

Best regards,
The Team`,
    type: 'final'
  },
  {
    id: 4,
    name: 'Gentle Reminder',
    subject: '💙 A Friendly Note About Your Membership',
    message: `Hello {name},

We hope you're enjoying your {membershipType} membership!

Just a gentle reminder that it expires on {expiryDate}. We'd love to have you continue with us!

Renewal Amount: ₦{amount}

Renew today and keep the good times rolling! 🎉

Best regards,
The Team`,
    type: 'upcoming'
  },
  {
    id: 5,
    name: 'Last Chance Offer',
    subject: '⏰ Last Chance - Special Renewal Offer',
    message: `Hi {name},

Your {membershipType} membership expires on {expiryDate} - that's very soon!

SPECIAL OFFER: Renew now and get an extra month FREE!

Standard Amount: ₦{amount}

Don't miss out on this limited-time offer!

Best regards,
The Team`,
    type: 'upcoming'
  }
];

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  selectedMembers,
  onSend
}) => {
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleFor, setScheduleFor] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewMemberIndex, setPreviewMemberIndex] = useState(0);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
  const previewMember = selectedMembers[previewMemberIndex];

  const handleSend = () => {
    const data: SendReminderData = {
      memberIds: selectedMembers.map(m => m.id),
      channel,
      templateId: selectedTemplate,
      customMessage: customMessage || undefined,
      scheduledDate: scheduleFor === 'later' ? scheduledDate : undefined
    };

    onSend(data);
    
    // Reset form
    setChannel('email');
    setSelectedTemplate(1);
    setCustomMessage('');
    setScheduleFor('now');
    setScheduledDate('');
    
    onClose();
  };

  const previewMessage = (member: Member) => {
    if (!currentTemplate) return '';
    
    let message = currentTemplate.message
      .replace(/{name}/g, member.name)
      .replace(/{membershipType}/g, member.membershipType)
      .replace(/{expiryDate}/g, member.expiryDate)
      .replace(/{amount}/g, member.amountDue.toLocaleString());

    if (customMessage) {
      message += `\n\n---\n\nPersonal Note:\n${customMessage}`;
    }

    return message;
  };

  const getTotalCost = () => {
    const smsCount = channel === 'sms' || channel === 'both' ? selectedMembers.length : 0;
    const emailCount = channel === 'email' || channel === 'both' ? selectedMembers.length : 0;
    
    // SMS = ₦10, Email = ₦2
    const smsCost = smsCount * 10;
    const emailCost = emailCount * 2;
    
    return { 
      total: smsCost + emailCost,
      sms: smsCost,
      email: emailCost,
      smsCount,
      emailCount
    };
  };

  const costs = getTotalCost();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send Payment Reminder</h2>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Selected Members Summary */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">Recipients Summary</h3>
                  <p className="text-sm text-gray-600">Review who will receive this reminder</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Amount Due</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₦{selectedMembers.reduce((sum, m) => sum + m.amountDue, 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2 mt-4">
                {selectedMembers.map((member, index) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {member.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.status === 'overdue' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status === 'overdue' 
                          ? `${Math.abs(member.daysUntilExpiry)}d overdue` 
                          : `${member.daysUntilExpiry}d left`}
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₦{member.amountDue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Delivery Channel
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setChannel('email')}
                  className={`p-5 border-2 rounded-xl transition-all transform hover:scale-105 ${
                    channel === 'email'
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Mail className={`w-8 h-8 mx-auto mb-2 ${
                    channel === 'email' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-bold text-gray-900">Email</div>
                  <div className="text-xs text-gray-600 mt-1">₦2 per send</div>
                  <div className="text-xs text-gray-500 mt-1">📧 Professional</div>
                </button>
                <button
                  onClick={() => setChannel('sms')}
                  className={`p-5 border-2 rounded-xl transition-all transform hover:scale-105 ${
                    channel === 'sms'
                      ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${
                    channel === 'sms' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-bold text-gray-900">SMS</div>
                  <div className="text-xs text-gray-600 mt-1">₦10 per send</div>
                  <div className="text-xs text-gray-500 mt-1">📱 Instant</div>
                </button>
                <button
                  onClick={() => setChannel('both')}
                  className={`p-5 border-2 rounded-xl transition-all transform hover:scale-105 ${
                    channel === 'both'
                      ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex justify-center gap-1 mb-2">
                    <Mail className={`w-6 h-6 ${
                      channel === 'both' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <MessageSquare className={`w-6 h-6 ${
                      channel === 'both' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-sm font-bold text-gray-900">Both</div>
                  <div className="text-xs text-gray-600 mt-1">₦12 per send</div>
                  <div className="text-xs text-gray-500 mt-1">🚀 Maximum Reach</div>
                </button>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Message Template
              </label>
              <div className="grid grid-cols-1 gap-3">
                {DEFAULT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          {template.type === 'overdue' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              Urgent
                            </span>
                          )}
                          {template.type === 'final' && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              Critical
                            </span>
                          )}
                          {template.type === 'upcoming' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              Friendly
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircle className="w-6 h-6 text-blue-600 shrink-0 ml-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            {currentTemplate && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Message Preview
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? 'Hide Preview' : 'Show Personalized'}
                  </button>
                </div>
                
                {showPreview && selectedMembers.length > 1 && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Preview for:</span>
                    <select
                      value={previewMemberIndex}
                      onChange={(e) => setPreviewMemberIndex(Number(e.target.value))}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedMembers.map((member, index) => (
                        <option key={member.id} value={index}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-white border border-gray-300 rounded-lg p-4">
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>Subject</span>
                    </div>
                    <p className="font-semibold text-gray-900">{currentTemplate.subject}</p>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {showPreview && previewMember 
                      ? previewMessage(previewMember)
                      : currentTemplate.message}
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                    {'{name}'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                    {'{membershipType}'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                    {'{expiryDate}'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                    {'{amount}'}
                  </span>
                </div>
              </div>
            )}

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Additional Personal Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Add a personalized note that will be appended to the template message...

For example:
'We appreciate your loyalty and would love to continue serving you. Feel free to contact us if you have any questions!'"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                This message will be added at the end of the selected template
              </p>
            </div>

            {/* Schedule Options */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Delivery Schedule
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg hover:bg-purple-50 transition-colors">
                  <input
                    type="radio"
                    value="now"
                    checked={scheduleFor === 'now'}
                    onChange={(e) => setScheduleFor(e.target.value as 'now')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Send Immediately</span>
                    <p className="text-sm text-gray-600">Reminders will be sent right away</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg hover:bg-purple-50 transition-colors">
                  <input
                    type="radio"
                    value="later"
                    checked={scheduleFor === 'later'}
                    onChange={(e) => setScheduleFor(e.target.value as 'later')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Schedule for Later</span>
                    <p className="text-sm text-gray-600">Choose a specific date and time</p>
                  </div>
                </label>
                {scheduleFor === 'later' && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full mt-2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-gray-900 text-lg">Cost Summary</span>
                </div>
                <button
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  {showCostBreakdown ? 'Hide' : 'Show'} breakdown
                </button>
              </div>
              
              {showCostBreakdown && (
                <div className="bg-white rounded-lg p-4 mb-3 space-y-2">
                  {costs.emailCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email ({costs.emailCount}× × ₦2)</span>
                      <span className="font-medium text-gray-900">₦{costs.email.toLocaleString()}</span>
                    </div>
                  )}
                  {costs.smsCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SMS ({costs.smsCount}× × ₦10)</span>
                      <span className="font-medium text-gray-900">₦{costs.sms.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2" />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Estimated Cost:</span>
                <span className="text-3xl font-bold text-green-700">
                  ₦{costs.total.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {channel === 'email' && `Sending ${costs.emailCount} email${costs.emailCount !== 1 ? 's' : ''}`}
                {channel === 'sms' && `Sending ${costs.smsCount} SMS message${costs.smsCount !== 1 ? 's' : ''}`}
                {channel === 'both' && `Sending ${costs.emailCount} email${costs.emailCount !== 1 ? 's' : ''} + ${costs.smsCount} SMS message${costs.smsCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-gray-200 bg-linear-to-r from-gray-50 to-blue-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white font-medium transition-all transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={scheduleFor === 'later' && !scheduledDate}
            className="px-8 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all transform hover:scale-105 shadow-lg disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
            {scheduleFor === 'now' ? 'Send Now' : 'Schedule Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
};