import { ref, computed } from 'vue'

export const useGangStore = () => {
  // @ts-ignore
  const client = useSupabaseClient()

  const currentRole = ref<'leader' | 'co_leader' | 'inventory_keeper' | 'member'>('leader')
  const profiles = ref<any[]>([])
  const treasuryLogs = ref<any[]>([])
  const pendingDeposits = ref<any[]>([]) // รายการสลิปโอนเงินรออนุมัติ
  const inventory = ref<any[]>([])
  const checkins = ref<any[]>([])
  const airdropCheckins = ref<any[]>([])
  const tickets = ref<any[]>([])
  const gangRules = ref<any[]>([])
  const rulesList = ref<any[]>([]) // กฎแก๊งรายข้อ
  const fineLogs = ref<any[]>([])
  const leaveRequests = ref<any[]>([])

  const totalBalance = computed(() => {
    return treasuryLogs.value.reduce((sum: number, item: any) => {
      return item.type === 'deposit' ? sum + Number(item.amount) : sum - Number(item.amount)
    }, 0)
  })

  const getLatestCheckinImage = (userId: string) => {
    const userCheckins = checkins.value.filter(c => c.user_id === userId && c.status === 'approved')
    return userCheckins.length > 0 ? userCheckins[0].image_url : null
  }

  // ----------------------------------------------------
  // 1. ดึงข้อมูลทั้งหมดจาก Supabase
  // ----------------------------------------------------
  const fetchAllData = async () => {
    try {
      const { data: profilesData } = await client.from('profiles').select('*')
      if (profilesData) profiles.value = profilesData

      const { data: treasuryData } = await client.from('treasury_transactions').select('*').order('created_at', { ascending: false })
      if (treasuryData) treasuryLogs.value = treasuryData

      // ดึงสลิปฝากเงินรออนุมัติ
      await fetchPendingDeposits()

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

      // ดึงกฎแก๊งรายข้อ
      await fetchRulesList()

      const { data: finesData } = await client.from('fine_logs').select('*').order('created_at', { ascending: false })
      if (finesData) fineLogs.value = finesData

      const { data: leavesData } = await client.from('leave_requests').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (leavesData) leaveRequests.value = leavesData

    } catch (err) {
      console.error('Fetch All Data Error:', err)
    }
  }

  // ----------------------------------------------------
  // 2. ฟังก์ชั่นสลิปโอนเงินเข้าคลัง & กฎแก๊งรายข้อ
  // ----------------------------------------------------
  const fetchPendingDeposits = async () => {
    try {
      const { data } = await client.from('pending_treasury_deposits').select('*, profiles(character_name)').eq('status', 'pending').order('created_at', { ascending: false })
      if (data) pendingDeposits.value = data
    } catch (err) {
      console.error('Fetch Pending Deposits Error:', err)
    }
  }

  const fetchRulesList = async () => {
    try {
      const { data } = await client.from('gang_rules_list').select('*').order('rule_number', { ascending: true })
      if (data) rulesList.value = data
    } catch (err) {
      console.error('Fetch Rules List Error:', err)
    }
  }

  const submitDepositSlip = async (userId: string, amount: number, category: string, file: File) => {
    try {
      const slipUrl = await uploadImage(file, 'checkins')
      if (!slipUrl) return false

      const { error } = await (client.from('pending_treasury_deposits') as any).insert({
        user_id: userId,
        amount,
        category,
        slip_url: slipUrl,
        status: 'pending'
      })

      if (!error) await fetchPendingDeposits()
      return !error
    } catch (err) {
      console.error('Submit Deposit Slip Error:', err)
      return false
    }
  }

  const approveDeposit = async (deposit: any, isApproved: boolean, reviewerName: string) => {
    try {
      if (isApproved) {
        // บันทึกลง treasury_transactions
        await (client.from('treasury_transactions') as any).insert({
          type: 'deposit',
          amount: deposit.amount,
          description: `[${deposit.category}] โดย ${deposit.profiles?.character_name || 'สมาชิก'}`,
          created_by: reviewerName
        })

        // ถ้าเป็นค่าปรับ ให้หักออกจากยอดหนี้สะสมของผู้ใช้
        if (deposit.category.includes('ค่าปรับ')) {
          const { data: profileData } = await client.from('profiles').select('fine_balance').eq('id', deposit.user_id).single()
          const profile = profileData as any // แก้ไขประเภทข้อมูลเพื่อป้องกันข้อผิดพลาด TypeScript
          
          if (profile) {
            const newBalance = Math.max(0, (profile.fine_balance || 0) - deposit.amount)
            await (client.from('profiles') as any).update({ fine_balance: newBalance }).eq('id', deposit.user_id)
          }
        }
      }

      await (client.from('pending_treasury_deposits') as any).update({
        status: isApproved ? 'approved' : 'rejected',
        approved_by: reviewerName
      }).eq('id', deposit.id)

      await fetchAllData()
      return true
    } catch (err) {
      console.error('Approve Deposit Error:', err)
      return false
    }
  }

  const addRuleItem = async (ruleNumber: number, title: string, content: string) => {
    try {
      const { error } = await (client.from('gang_rules_list') as any).insert({ rule_number: ruleNumber, title, content })
      if (!error) await fetchRulesList()
      return !error
    } catch (err) {
      console.error('Add Rule Error:', err)
      return false
    }
  }

  const updateRuleItem = async (id: string | number, title: string, content: string) => {
    try {
      const { error } = await (client.from('gang_rules_list') as any).update({ title, content, updated_at: new Date() }).eq('id', id)
      if (!error) await fetchRulesList()
      return !error
    } catch (err) {
      console.error('Update Rule Error:', err)
      return false
    }
  }

  const deleteRuleItem = async (id: string | number) => {
    try {
      const { error } = await (client.from('gang_rules_list') as any).delete().eq('id', id)
      if (!error) await fetchRulesList()
      return !error
    } catch (err) {
      console.error('Delete Rule Error:', err)
      return false
    }
  }

  // ----------------------------------------------------
  // 3. ฟังก์ชั่นเดิมของระบบ
  // ----------------------------------------------------
  const uploadImage = async (file: File, folder = 'checkins') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await client.storage
        .from('checkins')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = client.storage
        .from('checkins')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (err) {
      console.error('Upload image error:', err)
      return null
    }
  }

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

  const approveLeaveRequest = async (requestId: number | string, userId: string, approve: boolean) => {
    try {
      const status = approve ? 'approved' : 'rejected'
      const { error } = await (client.from('leave_requests') as any).update({ status }).eq('id', requestId)

      if (!error && approve) {
        await (client.from('profiles') as any).update({ leave_status: true }).eq('id', userId)
      }

      await fetchAllData()
      return !error
    } catch (err) {
      console.error('Approve Leave Request Error:', err)
      return false
    }
  }

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
    pendingDeposits,
    inventory,
    checkins,
    airdropCheckins,
    tickets,
    gangRules,
    rulesList,
    fineLogs,
    leaveRequests,
    totalBalance,
    getLatestCheckinImage,
    fetchAllData,
    fetchPendingDeposits,
    fetchRulesList,
    submitDepositSlip,
    approveDeposit,
    addRuleItem,
    updateRuleItem,
    deleteRuleItem,
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