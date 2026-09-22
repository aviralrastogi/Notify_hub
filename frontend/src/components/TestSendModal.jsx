import { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const PLACEHOLDERS = {
  whatsapp: 'Phone number with country code, e.g. 919876543210',
  email:    'Recipient email address',
  webpush:  'OneSignal Subscription ID (or leave blank for all)',
}

export default function TestSendModal({ template, onClose }) {
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)

  const handleSend = async () => {
    setLoading(true)
    setResult(null)
    try {
      let cleanRecipient = recipient.trim()
      // If user pasted OneSignal App ID by mistake, treat as empty (send to all/active)
      if (template.channel === 'webpush' && cleanRecipient.length === 36 && cleanRecipient.includes('-')) {
        // App ID detection
        cleanRecipient = ''
      }

      const res = await api.post(`/api/templates/${template.id}/test_send/`, {
        channel: template.channel,
        recipient: cleanRecipient,
      })
      setResult({ success: true, data: res.data })
      toast.success('Test notification sent!')
    } catch (err) {
      const msg = err.response?.data?.error || 'Send failed'
      setResult({ success: false, error: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const channelLabels = { whatsapp: '💬 WhatsApp', email: '✉️ Email', webpush: '🔔 Web Push' }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            Test Send — {channelLabels[template.channel]}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="text-gray-400 text-xs mb-1">Message preview:</div>
            {template.subject && <div className="font-medium text-gray-700">{template.subject}</div>}
            <div className="text-gray-600 mt-1">{template.body}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={PLACEHOLDERS[template.channel]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to use your account&apos;s {template.channel === 'email' ? 'email' : 'phone/subscription'}.
            </p>
          </div>

          {result && (
            <div className={`rounded-lg p-3 text-sm ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.success ? '✅ Sent successfully!' : `❌ ${result.error}`}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 text-sm"
            >
              {loading ? 'Sending...' : 'Send Test'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
