import { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const CHANNEL_INFO = {
  whatsapp: { icon: '💬', label: 'WhatsApp', showSubject: false },
  email:    { icon: '✉️', label: 'Email',     showSubject: true  },
  webpush:  { icon: '🔔', label: 'Web Push',  showSubject: true  },
}

export default function TemplateModal({ trigger, channel, template, onClose, onSaved }) {
  const info = CHANNEL_INFO[channel]
  const [form, setForm] = useState({
    subject:   template?.subject   || '',
    body:      template?.body      || '',
    is_active: template?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        trigger:   trigger.id,
        channel,
        subject:   form.subject,
        body:      form.body,
        is_active: form.is_active,
      }
      if (template?.id) {
        await api.patch(`/api/templates/${template.id}/`, payload)
        toast.success('Template updated!')
      } else {
        await api.post('/api/templates/', payload)
        toast.success('Template created!')
      }
      onSaved()
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach((m) => toast.error(String(m)))
      } else {
        toast.error('Save failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            {info.icon} {template ? 'Edit' : 'Create'} {info.label} Template
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
            <span className="font-medium">Trigger:</span> {trigger.name}
          </div>

          {info.showSubject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {channel === 'webpush' ? 'Title' : 'Subject'}
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={channel === 'email' ? 'Email subject line' : 'Notification title'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={`Write your ${info.label} message here...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">You can use: {'{{username}}'}, {'{{email}}'}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
            <span className="text-sm text-gray-600">Active (send when trigger fires)</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
