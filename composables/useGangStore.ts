import { ref, computed } from 'vue'

export const useGangStore = () => {
  // @ts-ignore
  const client = useSupabaseClient()

  const currentRole = ref<'leader' | 'co_leader' | 'member'>('leader')
  const profiles = ref<any[]>([])
  const treasuryLogs = ref<any[]>([])
  const inventory = ref<any[]>([])
  const checkins = ref<any[]>([])
  const airdropCheckins = ref<any[]>([])
  const tickets = ref<any[]>([])
  const gangRules = ref<any[]>([])
  const fineLogs = ref<any[]>([])
  const leaveRequests = ref<any[]>([]) // [เพิ่มใหม่] รายการคำขอลา

  const totalBalance = computed(() => {
    return treasuryLogs.value.reduce((sum: number, item: any) => {
      return item.type === 'deposit' ? sum + Number(item.amount) : sum - Number(item.amount)
    }, 0)
  })

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

      const { data: airdropData } = await client.from('airdrop_checkins').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (airdropData) airdropCheckins.value = airdropData

      const { data: ticketsData } = await client.from('tickets').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (ticketsData) tickets.value = ticketsData

      const { data: rulesData } = await client.from('gang_rules').select('*').order('id', { ascending: false }).limit(1)
      if (rulesData) gangRules.value = rulesData

      const { data: finesData } = await client.from('fine_logs').select('*').order('created_at', { ascending: false })
      if (finesData) fineLogs.value = finesData

      // [เพิ่มใหม่] ดึงข้อมูลรายการคำขอลา
      const { data: leavesData } = await client.from('leave_requests').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (leavesData) leaveRequests.value = leavesData

    } catch (err) {
      console.error('Fetch All Data Error:', err)
    }
  }

  const uploadImage = async (file: File, folder = 'checkins') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await client.storage
        .from('checkins')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = client.storage
        .from('checkins')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err) {
      console.error('Upload image error:', err)
      return null
    }
  }

  // [เพิ่มใหม่] ส่งคำขอลาพร้อมสาเหตุ
  const submitLeaveRequest = async (userId: string, reason: string) => {
    try {
      const { error } = await (client.from('leave_requests') as any).insert({
        user_id: userId,
        reason: reason,
        status: 'pending'
      })
      if (!error) await fetchAllData()
      return !error
    } catch (err) {
      console.error('Submit Leave Request Error:', err)
      return false
    }
  }

  // [เพิ่มใหม่] อนุมัติ/ปฏิเสธ คำขอลา
  const approveLeaveRequest = async (requestId: number | string, userId: string, approve: boolean) => {
    try {
      const status = approve ? 'approved' : 'rejected'
      const { error } = await (client.from('leave_requests') as any).update({ status }).eq('id', requestId)

      if (!error && approve) {
        // อัปเดตสถานะการลาในโปรไฟล์ผู้ใช้ทันทีเมื่ออนุมัติ
        await (client.from('profiles') as any).update({ leave_status: true }).eq('id', userId)
      }

      await fetchAllData()
      return !error
    } catch (err) {
      console.error('Approve Leave Request Error:', err)
      return false
    }
  }

  // [เพิ่มใหม่] ยกเลิกสถานะการลา (สมาชิกกดกลับมาจากลา)
  const cancelLeave = async (userId: string) => {
    try {
      const { error } = await (client.from('profiles') as any).update({ leave_status: false }).eq('id', userId)
      if (!error) await fetchAllData()
      return !error
    } catch (err) {
      console.error('Cancel Leave Error:', err)
      return false
    }
  }

  const submitCheckin = async (userId: string, checkType: 'in' | 'out', file: File) => {
    const imageUrl = await uploadImage(file, 'daily')
    if (!imageUrl) return false

    const { error } = await (client.from('checkins') as any).insert({
      user_id: userId,
      check_type: checkType,
      image_url: imageUrl,
      status: 'pending'
    })
    if (!error) await fetchAllData()
    return !error
  }

  const submitAirdropCheckin = async (userId: string, file: File) => {
    const imageUrl = await uploadImage(file, 'airdrop')
    if (!imageUrl) return false

    const { error } = await (client.from('airdrop_checkins') as any).insert({
      user_id: userId,
      image_url: imageUrl
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
    airdropCheckins,
    tickets,
    gangRules,
    fineLogs,
    leaveRequests,
    totalBalance,
    getLatestCheckinImage,
    fetchAllData,
    submitLeaveRequest,
    approveLeaveRequest,
    cancelLeave,
    submitCheckin,
    submitAirdropCheckin,
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