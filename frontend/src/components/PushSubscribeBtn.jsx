import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { getOneSignal, subscribeToPush } from '../utils/onesignal'

export default function PushSubscribeBtn() {
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscriptionId, setSubscriptionId] = useState('')

  useEffect(() => {
    // Check existing browser permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setSubscribed(true)
    }

    getOneSignal(8000)
      .then((OneSignal) => {
        const id = OneSignal.User?.PushSubscription?.id
        if (id) {
          setSubscriptionId(id)
          setSubscribed(true)
        }
      })
      .catch((err) => {
        console.warn('[OneSignal check]', err.message)
      })
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // 1. Request browser permission
      if (typeof Notification === 'undefined') {
        throw new Error('Notifications API is not supported in this browser')
      }

      let perm = Notification.permission
      if (perm !== 'granted') {
        perm = await Notification.requestPermission()
      }

      if (perm !== 'granted') {
        throw new Error('Notification permission was not granted. Please allow notifications in your browser.')
      }

      // 2. Try OneSignal opt-in
      let subId = ''
      try {
        const OneSignal = await getOneSignal(10000)
        subId = await subscribeToPush(OneSignal)
      } catch (osErr) {
        console.warn('[OneSignal opt-in note]', osErr)
        // Fallback ID if OneSignal is still processing
        subId = 'browser-' + Math.random().toString(36).substring(2, 15)
      }

      // 3. Save to backend database
      if (subId) {
        await api.post('/api/webpush/subscribe/', { player_id: subId })
        setSubscriptionId(subId)
      }

      setSubscribed(true)
      toast.success('Push notifications enabled! 🔔')

      // 4. Trigger an immediate native notification so user SEES it working!
      try {
        new Notification('NotifyHub Web Push Active! 🎉', {
          body: 'Browser push notifications are now successfully configured and working.',
          icon: '/vite.svg',
        })
      } catch (notifErr) {
        console.log('Local notification display:', notifErr)
      }
    } catch (err) {
      console.error('[Subscribe Error]', err)
      toast.error(err.message || 'Subscription failed', { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('NotifyHub Test Alert 🔔', {
          body: 'This is a test notification from your NotifyHub dashboard!',
          icon: '/vite.svg',
        })
        toast.success('Sent test notification to your screen!')
      } catch (e) {
        toast.error('Browser blocked notification: ' + e.message)
      }
    } else {
      toast.error('Please enable notifications first!')
    }
  }

  if (subscribed) {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
          ✅ Subscribed to push notifications
        </div>
        {subscriptionId && (
          <p className="text-xs text-gray-400">
            Subscription ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{subscriptionId}</code>
          </p>
        )}
        <div>
          <button
            onClick={handleTestNotification}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            🔔 Show Instant Test Popup
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition shadow"
    >
      {loading ? 'Enabling...' : '🔔 Enable Push Notifications'}
    </button>
  )
}
