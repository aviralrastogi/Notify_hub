import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import TemplateModal from '../../components/TemplateModal'
import TestSendModal from '../../components/TestSendModal'

const CHANNELS = ['whatsapp', 'email', 'webpush']

const CHANNEL_LABELS = {
  whatsapp: { label: 'WhatsApp', icon: '💬', color: 'green' },
  email: { label: 'Email', icon: '✉️', color: 'blue' },
  webpush: { label: 'Web Push', icon: '🔔', color: 'yellow' },
}

export default function NotificationsPage() {
  const [triggers, setTriggers] = useState([])
  const [loading, setLoading] = useState(true)
  const [templateModal, setTemplateModal] = useState(null) // { trigger, channel, template }
  const [testModal, setTestModal] = useState(null)         // { template }
  const [newTriggerForm, setNewTriggerForm] = useState({ show: false, name: '', description: '' })
  const [savingTrigger, setSavingTrigger] = useState(false)

  const fetchTriggers = useCallback(async () => {
    try {
      const res = await api.get('/api/triggers/')
      setTriggers(res.data)
    } catch {
      toast.error('Failed to load triggers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTriggers() }, [fetchTriggers])

  const getTemplate = (trigger, channel) =>
    trigger.templates?.find((t) => t.channel === channel) || null

  const handleToggle = async (template) => {
    try {
      const res = await api.post(`/api/templates/${template.id}/toggle/`)
      toast.success(`${res.data.is_active ? 'Enabled' : 'Disabled'} ${template.channel} for this trigger`)
      fetchTriggers()
    } catch {
      toast.error('Toggle failed')
    }
  }

  const handleDeleteTrigger = async (triggerId) => {
    if (!confirm('Delete this trigger and all its templates?')) return
    try {
      await api.delete(`/api/triggers/${triggerId}/`)
      toast.success('Trigger deleted')
      fetchTriggers()
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleAddTrigger = async (e) => {
    e.preventDefault()
    setSavingTrigger(true)
    try {
      const slug = newTriggerForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
      await api.post('/api/triggers/', {
        name: newTriggerForm.name,
        slug,
        description: newTriggerForm.description,
      })
      toast.success('Trigger added!')
      setNewTriggerForm({ show: false, name: '', description: '' })
      fetchTriggers()
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach((m) => toast.error(m))
      else toast.error('Failed to add trigger')
    } finally {
      setSavingTrigger(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔔 Notification Settings</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage triggers and templates for all notification channels.
            </p>
          </div>
          <button
            onClick={() => setNewTriggerForm({ show: true, name: '', description: '' })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Trigger
          </button>
        </div>

        {/* Add Trigger Form */}
        {newTriggerForm.show && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-3">New Trigger</h3>
            <form onSubmit={handleAddTrigger} className="flex gap-3 flex-wrap">
              <input
                required
                value={newTriggerForm.name}
                onChange={(e) => setNewTriggerForm({ ...newTriggerForm, name: e.target.value })}
                placeholder="Trigger name (e.g. Order Placed)"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={newTriggerForm.description}
                onChange={(e) => setNewTriggerForm({ ...newTriggerForm, description: e.target.value })}
                placeholder="Description (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={savingTrigger}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  {savingTrigger ? 'Saving...' : 'Save'}
                </button>
                <button type="button"
                  onClick={() => setNewTriggerForm({ show: false, name: '', description: '' })}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 w-48">Trigger</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      <span className="flex items-center gap-1.5">
                        {CHANNEL_LABELS[ch].icon} {CHANNEL_LABELS[ch].label}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {triggers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No triggers yet. Click &quot;+ Add Trigger&quot; to create one.
                    </td>
                  </tr>
                )}
                {triggers.map((trigger) => (
                  <tr key={trigger.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{trigger.name}</div>
                      {trigger.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{trigger.description}</div>
                      )}
                    </td>
                    {CHANNELS.map((ch) => {
                      const tmpl = getTemplate(trigger, ch)
                      return (
                        <td key={ch} className="px-6 py-4">
                          <ChannelCell
                            template={tmpl}
                            channel={ch}
                            trigger={trigger}
                            onEdit={() => setTemplateModal({ trigger, channel: ch, template: tmpl })}
                            onToggle={() => handleToggle(tmpl)}
                            onTestSend={() => setTestModal({ template: tmpl })}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteTrigger(trigger.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Template Modal */}
        {templateModal && (
          <TemplateModal
            trigger={templateModal.trigger}
            channel={templateModal.channel}
            template={templateModal.template}
            onClose={() => setTemplateModal(null)}
            onSaved={() => { setTemplateModal(null); fetchTriggers() }}
          />
        )}

        {/* Test Send Modal */}
        {testModal && (
          <TestSendModal
            template={testModal.template}
            onClose={() => setTestModal(null)}
          />
        )}
      </div>
    </div>
  )
}

function ChannelCell({ template, channel, onEdit, onToggle, onTestSend }) {
  const { color } = CHANNEL_LABELS[channel]

  const colorMap = {
    green:  { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
    blue:   { badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
    yellow: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  }
  const c = colorMap[color]

  if (!template) {
    return (
      <div className="flex items-center">
        <button
          onClick={onEdit}
          className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2.5 py-1 hover:bg-indigo-50 transition-colors"
        >
          + Create
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Status badge */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${template.is_active ? c.dot : 'bg-gray-300'}`}></span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          template.is_active ? c.badge : 'bg-gray-100 text-gray-400'
        }`}>
          {template.is_active ? 'Active' : 'Off'}
        </span>
      </div>
      {/* Preview */}
      <p className="text-xs text-gray-500 line-clamp-2 max-w-[180px]">{template.body}</p>
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onEdit} className="text-xs text-gray-500 hover:text-indigo-600 underline">
          Edit
        </button>
        <button
          onClick={onToggle}
          className={`text-xs ${
            template.is_active
              ? 'text-red-500 hover:text-red-700'
              : 'text-green-600 hover:text-green-800'
          } underline`}
        >
          {template.is_active ? 'Turn Off' : 'Turn On'}
        </button>
        <button onClick={onTestSend} className="text-xs text-purple-600 hover:text-purple-800 underline">
          Test
        </button>
      </div>
    </div>
  )
}
