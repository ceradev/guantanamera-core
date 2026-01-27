import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSettings } from '@/services/settings.service'
import { useNotifications } from '@/hooks/use-notifications'

export function useSettings() {
  const [ordersEnabled, setOrdersEnabled] = useState(true)
  const [prepTime, setPrepTime] = useState(15)
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([])

  // New settings
  const [storeName, setStoreName] = useState('Guantanamera')
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getSettings()
      if (settings.orders_enabled !== undefined) setOrdersEnabled(settings.orders_enabled)
      if (settings.prep_time) setPrepTime(settings.prep_time)
      if (settings.store_name) setStoreName(settings.store_name)
      if (settings.store_address) setStoreAddress(settings.store_address)
      if (settings.store_phone) setStorePhone(settings.store_phone)
      if (settings.weekly_schedule) {
        setWeeklySchedule(typeof settings.weekly_schedule === 'string' 
          ? JSON.parse(settings.weekly_schedule) 
          : settings.weekly_schedule)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useNotifications({ onSettingsUpdated: loadSettings })

  const handleSave = async () => {
    try {
      await updateSettings({
        orders_enabled: ordersEnabled,
        prep_time: prepTime,
        store_name: storeName,
        store_address: storeAddress,
        store_phone: storePhone,
        weekly_schedule: weeklySchedule,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar la configuración')
    }
  }

  const handleRegenerateKey = () => {
    if (
      confirm(
        'ADVERTENCIA: ¿Estás seguro de regenerar la API Key? Esto desconectará todos los dispositivos conectados hasta que se actualicen.'
      )
    ) {
      setIsRegeneratingKey(true)
      setTimeout(() => setIsRegeneratingKey(false), 1500)
    }
  }

  return {
    ordersEnabled,
    setOrdersEnabled,
    prepTime,
    setPrepTime,
    weeklySchedule,
    setWeeklySchedule,
    storeName,
    setStoreName,
    storeAddress,
    setStoreAddress,
    storePhone,
    setStorePhone,
    isLoading,
    saveSuccess,
    isRegeneratingKey,
    handleSave,
    handleRegenerateKey,
  }
}

