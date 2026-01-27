export const isOrderDelayedKitchen = (pickupTime: string, status: string): boolean => {
  if (status === 'READY' || status === 'DELIVERED') return false
  const now = new Date()
  const [hours, minutes] = pickupTime.split(':').map(Number)
  const pickupDate = new Date()
  pickupDate.setHours(hours, minutes, 0, 0)
  return now.getTime() > pickupDate.getTime() + 5 * 60000
}

