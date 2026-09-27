import { ref, computed } from 'vue'

export const useGangStore = () => {
  // @ts-ignore
  const client = useSupabaseClient()

  const currentRole = ref<'leader' | 'co_leader' | 'inventory_keeper' | 'member'>('leader')
  const profiles = ref<any[]>([])
  const treasuryLogs = ref<any[]>([])
  const pendingDeposits = ref<any[]>([])
  const inventory = ref<any[]>([])
  const checkins = ref<any[]>([])
  const airdropCheckins = ref<any[]>([])
  const tickets = ref<any[]>([])
  const rulesList = ref<any[]>([])
  const fineLogs = ref<any[]>([])
  const leaveRequests = ref<any[]>([])

  const totalBalance = computed(() => {
    return treasuryLogs.value.reduce((sum: number, item: any) => {
      const amount = Number(item.amount) || 0
      return item.type === 'deposit' ? sum + amount : sum - amount
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
      const { data: profilesData, error: profilesErr } = await client.from('profiles').select('*')
      if (profilesErr) console.error('Fetch Profiles Error:', profilesErr.message)
      if (profilesData) profiles.value = profilesData

      const { data: treasuryData, error: treasuryErr } = await client.from('treasury_transactions').select('*').order('created_at', { ascending: false })
      if (treasuryErr) console.error('Fetch Treasury Error:', treasuryErr.message)
      if (treasuryData) treasuryLogs.value = treasuryData

      await fetchPendingDeposits()

      const { data: inventoryData, error: inventoryErr } = await client.from('inventory').select('*').order('id', { ascending: true })
      if (inventoryErr) console.error('Fetch Inventory Error:', inventoryErr.message)
      if (inventoryData) inventory.value = inventoryData

      const { data: checkinsData, error: checkinsErr } = await client.from('checkins').select('*, profiles(username, character_name)').order('created_at', { ascending: false })
      if (checkinsErr) console.error('Fetch Checkins Error:', checkinsErr.message)
      if (checkinsData) checkins.value = checkinsData

      const { data: airdropData, error: airdropErr } = await client.from('airdrop_checkins').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (airdropErr) console.error('Fetch Airdrop Error:', airdropErr.message)
      if (airdropData) airdropCheckins.value = airdropData

      const { data: ticketsData, error: ticketsErr } = await client.from('tickets').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (ticketsErr) console.error('Fetch Tickets Error:', ticketsErr.message)
      if (ticketsData) tickets.value = ticketsData

      await fetchRulesList()

      const { data: finesData, error: finesErr } = await client.from('fine_logs').select('*').order('created_at', { ascending: false })
      if (finesErr) console.error('Fetch Fines Error:', finesErr.message)
      if (finesData) fineLogs.value = finesData

      const { data: leavesData, error: leavesErr } = await client.from('leave_requests').select('*, profiles(character_name)').order('created_at', { ascending: false })
      if (leavesErr) console.error('Fetch Leaves Error:', leavesErr.message)
      if (leavesData) leaveRequests.value = leavesData

    } catch (err) {
      console.error('Fetch All Data Exception:', err)
    }
  }

  // ----------------------------------------------------
  // 2. ระบบสลิปเงินเข้าคลัง & กฎแก๊งรายข้อ
  // ----------------------------------------------------
  const fetchPendingDeposits = async () => {
    try {
      const { data, error } = await client.from('pending_treasury_deposits').select('*, profiles(character_name)').eq('status', 'pending').order('created_at', { ascending: false })
      if (error) {
        console.error('Fetch Pending Deposits Error:', error)
        return
      }
      if (data) pendingDeposits.value = data
    } catch (err) {
      console.error('Fetch Pending Deposits Exception:', err)
    }
  }

  const fetchRulesList = async () => {
    try {
      const { data, error } = await client.from('gang_rules_list').select('*').order('rule_number', { ascending: true })
      if (error) {
        console.error('Fetch Rules List SQL Error:', error.message, error.details, error.hint)
        return
      }
      if (data) rulesList.value = data
    } catch (err) {
      console.error('Fetch Rules List Exception:', err)
    }
  }

  const submitDepositSlip = async (userId: string, amount: number, category: string, file: File) => {
    try {
      const slipUrl = await uploadImage(file, 'checkins')
      if (!slipUrl) {
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพสลิป กรุณาตรวจสอบ Storage Permissions/Bucket')
        return false
      }

      const { error } = await (client.from('pending_treasury_deposits') as any).insert({
        user_id: userId,
        amount: Number(amount),
        category: category,
        slip_url: slipUrl,
        status: 'pending'
      })

      if (error) {
        console.error('Insert Pending Deposit Error:', error.message, error.details, error.hint)
        alert(`ไม่สามารถส่งสลิปได้: ${error.message}`)
        return false
      }

      await fetchPendingDeposits()
      return true
    } catch (err: any) {
      console.error('Submit Deposit Slip Exception:', err)
      alert(`เกิดข้อผิดพลาดในการส่งสลิป: ${err?.message || err}`)
      return false
    }
  }

  const approveDeposit = async (deposit: any, isApproved: boolean, reviewerName: string) => {
    try {
      if (isApproved) {
        const depositAmount = Number(deposit.amount) || 0

        const { error: insertErr } = await (client.from('treasury_transactions') as any).insert({
          type: 'deposit',
          amount: depositAmount,
          description: `[${deposit.category}] โดย ${deposit.profiles?.character_name || 'สมาชิก'}`,
          created_by: reviewerName
        })

        if (insertErr) {
          console.error('Insert Treasury Transaction Error:', insertErr.message)
          return false
        }

        // ตัดยอดค่าปรับเฉพาะกรณีหมวดหมู่เป็นเรื่องค่าปรับ
        if (deposit.category.includes('ค่าปรับ')) {
          const { data: profileData } = await client.from('profiles').select('fine_balance').eq('id', deposit.user_id).single()
          const profile = profileData as any
          
          if (profile) {
            const currentBalance = profile.fine_balance ?? 0
            const newBalance = Math.max(0, currentBalance - depositAmount)
            await (client.from('profiles') as any).update({ fine_balance: newBalance }).eq('id', deposit.user_id)
          }
        }
      }

      const { error: updateErr } = await (client.from('pending_treasury_deposits') as any).update({
        status: isApproved ? 'approved' : 'rejected',
        approved_by: reviewerName
      }).eq('id', deposit.id)

      if (updateErr) {
        console.error('Update Pending Deposit Status Error:', updateErr.message)
        return false
      }

      await fetchAllData()
      return true
    } catch (err) {
      console.error('Approve Deposit Error:', err)
      return false
    }
  }

  const addRuleItem = async (ruleNumber: number, title: string, content: string) => {
    try {
      const { error } = await (client.from('gang_rules_list') as any).insert({
        rule_number: Number(ruleNumber),
        title,
        content
      })

      if (error) {
        console.error('Insert Rule Error:', error)
        return false
      }

      await fetchRulesList()
      return true
    } catch (err) {
      console.error('Add Rule Exception:', err)
      return false
    }
  }

  const updateRuleItem = async (id: string, title: string, content: string) => {
    try {
      const { error } = await (client.from('gang_rules_list') as any).update({ 
        title, 
        content, 
        updated_at: new Date().toISOString() 
      }).eq('id', id)

      if (!error) await fetchRulesList()
      return !error
    } catch (err) {
      console.error('Update Rule Error:', err)
      return false
    }
  }

  const deleteRuleItem = async (id: string) => {
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
  // 3. ฟังก์ชั่นอัปโหลดรูปภาพและจัดการระบบเดิม
  // ----------------------------------------------------
  const uploadImage = async (file: File, folder = 'checkins') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await client.storage
        .from('checkins')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Storage Upload Error Detail:', uploadError.message, uploadError)
        throw uploadError
      }

      const { data } = client.storage
        .from('checkins')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (err) {
      console.error('Upload image Exception:', err)
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
    try {
      const { error } = await (client.from('profiles') as any).delete().eq('id', userId)
      if (error) {
        console.error('Delete Member Error:', error.message)
        return false
      }
      await fetchAllData()
      return true
    } catch (err) {
      console.error('Delete Member Exception:', err)
      return false
    }
  }

  const approveCheckin = async (checkinId: number | string, userId: string, checkType: 'in' | 'out', approve: boolean) => {
    try {
      const newStatus = approve ? 'approved' : 'rejected'
      const { error } = await (client.from('checkins') as any).update({ status: newStatus }).eq('id', checkinId)

      if (!error && approve) {
        await (client.from('profiles') as any).update({ is_online: checkType === 'in' }).eq('id', userId)
      }

      await fetchAllData()
    } catch (err) {
      console.error('Approve Checkin Error:', err)
    }
  }

  const addTreasuryTransaction = async (type: 'deposit' | 'withdraw', amount: number, description: string, creatorName: string) => {
    try {
      const { error } = await (client.from('treasury_transactions') as any).insert({
        type,
        amount: Number(amount) || 0,
        description,
        created_by: creatorName
      })
      if (!error) await fetchAllData()
      return !error
    } catch (err) {
      console.error('Add Treasury Transaction Error:', err)
      return false
    }
  }

  const addInventoryItem = async (itemName: string, category: string, quantity: number, file: File | null) => {
    try {
      const existingItem = inventory.value.find(
        (i) => i.item_name?.trim().toLowerCase() === itemName.trim().toLowerCase()
      )

      if (existingItem) {
        const updatedQty = (Number(existingItem.quantity) || 0) + (Number(quantity) || 0)
        
        const { error } = await (client.from('inventory') as any)
          .update({ 
            quantity: updatedQty,
            updated_at: new Date().toISOString()
          })
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
          quantity: Number(quantity) || 0,
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
    try {
      const { error } = await (client.from('inventory') as any).update({ 
        quantity: newQty,
        updated_at: new Date().toISOString()
      }).eq('id', itemId)
      
      if (!error) await fetchAllData()
    } catch (err) {
      console.error('Update Inventory Qty Error:', err)
    }
  }

  const deleteInventoryItem = async (itemId: number | string) => {
    try {
      const { error } = await (client.from('inventory') as any).delete().eq('id', itemId)
      if (!error) await fetchAllData()
    } catch (err) {
      console.error('Delete Inventory Item Error:', err)
    }
  }

  const submitTicket = async (userId: string, title: string, category: string, detail: string) => {
    try {
      const { error } = await (client.from('tickets') as any).insert({
        user_id: userId,
        title,
        category,
        detail,
        status: 'pending'
      })
      if (!error) await fetchAllData()
      return !error
    } catch (err) {
      console.error('Submit Ticket Error:', err)
      return false
    }
  }

  const updateTicketStatus = async (ticketId: number | string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await (client.from('tickets') as any).update({ status }).eq('id', ticketId)
      if (!error) await fetchAllData()
    } catch (err) {
      console.error('Update Ticket Status Error:', err)
    }
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