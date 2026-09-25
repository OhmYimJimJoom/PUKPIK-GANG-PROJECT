import { ref, computed } from 'vue'

export const useGangStore = () => {
  // @ts-ignore
  const client = useSupabaseClient()

  const currentRole = ref<'leader' | 'co_leader' | 'member'>('leader')
  const profiles = ref<any[]>([])
  const treasuryLogs = ref<any[]>([])
  const inventory = ref<any[]>([])
  const checkins = ref<any[]>([])
  const tickets = ref<any[]>([])

  const totalBalance = computed(() => {
    return treasuryLogs.value.reduce((sum: number, item: any) => {
      return item.type === 'deposit' ? sum + Number(item.amount) : sum - Number(item.amount)
    }, 0)
  })

  // ดึงข้อมูลหลักฐานเช็คชื่อล่าสุดของแต่ละคน
  const getLatestCheckinImage = (userId: string) => {
    const userCheckins = checkins.value.filter(c => c.user_id === userId && c.status === 'approved')
    return userCheckins.length > 0 ? userCheckins[0].image_url : null
  }

  const fetchAllData = async () => {
    try {
      const { data: profilesData } = await client.from('profiles').select('*')
      if (profilesData) profiles.value = profilesData

      const { data: treasuryData } = await client.from('treasury_transactions').select('*').order('created_at', { ascending: false })
      if (treasuryData) treasuryLogs.value = treasuryData

      const { data: inventoryData } = await client.from('inventory').select('*').order('id', { ascending: true })
      if (inventoryData) inventory.value = inventoryData

      const { data: checkinsData } = await client.from('checkins').select('*, profiles(username, character_name)').order('created_at', { ascending: false })
      if (checkinsData) checkins.value = checkinsData

      const { data: ticketsData } = await client.from('tickets').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (ticketsData) tickets.value = ticketsData
    } catch (err) {
      console.error('Fetch All Data Error:', err)
    }
  }

  // อัปโหลดรูปภาพลง Supabase Storage
  const uploadImage = async (file: File, folder = 'checkins') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await client.storage
        .from('checkin-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = client.storage
        .from('checkin-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err) {
      console.error('Upload image error:', err)
      return null
    }
  }

  const submitCheckin = async (userId: string, checkType: 'in' | 'out', file: File) => {
    const imageUrl = await uploadImage(file, 'checkins')
    if (!imageUrl) return false

    // ใช้ (client.from(...) as any) เพื่อข้าม Type Checking
    const { error } = await (client.from('checkins') as any).insert({
      user_id: userId,
      check_type: checkType,
      image_url: imageUrl,
      status: 'pending'
    })
    if (!error) await fetchAllData()
    return !error
  }

  const deleteMember = async (userId: string) => {
    const { error } = await (client.from('profiles') as any).delete().eq('id', userId)
    if (!error) await fetchAllData()
    return !error
  }

  const approveCheckin = async (checkinId: number | string, userId: string, checkType: 'in' | 'out', approve: boolean) => {
    const newStatus = approve ? 'approved' : 'rejected'
    await (client.from('checkins') as any).update({ status: newStatus }).eq('id', checkinId)

    if (approve) {
      await (client.from('profiles') as any).update({ is_online: checkType === 'in' }).eq('id', userId)
    }

    await fetchAllData()
  }

  const addTreasuryTransaction = async (type: 'deposit' | 'withdraw', amount: number, description: string, creatorName: string) => {
    const { error } = await (client.from('treasury_transactions') as any).insert({
      type,
      amount,
      description,
      created_by: creatorName
    })
    if (!error) await fetchAllData()
    return !error
  }

  // เพิ่มไอเทมในคลัง
  const addInventoryItem = async (itemName: string, category: string, quantity: number, file: File | null) => {
    try {
      const existingItem = inventory.value.find(
        (i) => i.item_name?.trim().toLowerCase() === itemName.trim().toLowerCase()
      )

      if (existingItem) {
        const updatedQty = Number(existingItem.quantity) + Number(quantity)
        
        const { error } = await (client.from('inventory') as any)
          .update({ quantity: updatedQty })
          .eq('id', existingItem.id)

        if (error) throw error
      } else {
        let imageUrl = null
        if (file) {
          imageUrl = await uploadImage(file, 'inventory')
        }

        const { error } = await (client.from('inventory') as any).insert({
          item_name: itemName.trim(),
          category,
          quantity,
          image_url: imageUrl
        })

        if (error) throw error
      }

      await fetchAllData()
      return true
    } catch (err) {
      console.error('Add Inventory Item Error:', err)
      return false
    }
  }

  const updateInventoryQty = async (itemId: number | string, newQty: number) => {
    if (newQty < 0) return
    await (client.from('inventory') as any).update({ quantity: newQty }).eq('id', itemId)
    await fetchAllData()
  }

  const deleteInventoryItem = async (itemId: number | string) => {
    await (client.from('inventory') as any).delete().eq('id', itemId)
    await fetchAllData()
  }

  const submitTicket = async (userId: string, title: string, category: string, detail: string) => {
    const { error } = await (client.from('tickets') as any).insert({
      user_id: userId,
      title,
      category,
      detail,
      status: 'pending'
    })
    if (!error) await fetchAllData()
    return !error
  }

  const updateTicketStatus = async (ticketId: number | string, status: 'approved' | 'rejected') => {
    await (client.from('tickets') as any).update({ status }).eq('id', ticketId)
    await fetchAllData()
  }

  return {
    currentRole,
    profiles,
    treasuryLogs,
    inventory,
    checkins,
    tickets,
    totalBalance,
    getLatestCheckinImage,
    fetchAllData,
    submitCheckin,
    approveCheckin,
    deleteMember,
    addTreasuryTransaction,
    addInventoryItem,
    updateInventoryQty,
    deleteInventoryItem,
    submitTicket,
    updateTicketStatus
  }
}