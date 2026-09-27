import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  
  // ดึงค่า Supabase Credentials ผ่าน RuntimeConfig ของ Nuxt
  const supabaseUrl = (config.public.supabaseUrl || config.public.supabase?.url) as string
  const supabaseServiceKey = (config.supabaseServiceKey || config.supabase?.serviceKey) as string

  // Fallback ดึงค่า Env ป้องกัน Error
  const envUrl = supabaseUrl || (globalThis as any).process?.env?.SUPABASE_URL || (globalThis as any).process?.env?.NUXT_PUBLIC_SUPABASE_URL
  const envKey = supabaseServiceKey || (globalThis as any).process?.env?.SUPABASE_SERVICE_KEY || (globalThis as any).process?.env?.NUXT_SUPABASE_SERVICE_KEY

  if (!envUrl || !envKey) {
    return {
      success: false,
      error: `Missing Supabase Credentials. (URL: ${!!envUrl}, Key: ${!!envKey})`
    }
  }

  const supabase = createClient(envUrl, envKey)

  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. ดึงสมาชิกทุกคนทุกตำแหน่ง (รวม role) ที่ไม่ได้ตั้งสถานะลาหยุด (leave_status != true)
    const { data: members, error: memberErr } = await supabase
      .from('profiles')
      .select('id, role, fine_balance, leave_status')
      .or('leave_status.is.null,leave_status.eq.false')

    if (memberErr) throw memberErr
    if (!members || members.length === 0) return { success: true, count: 0 }

    // 2. ดึงรายการเช็คชื่อแอร์ดรอปของวันนี้ที่ได้รับการอนุมัติแล้ว ('approved')
    const { data: approvedAirdrops } = await supabase
      .from('airdrop_checkins')
      .select('user_id')
      .eq('status', 'approved')
      .gte('created_at', `${today}T00:00:00`)

    const approvedUserIds = new Set(approvedAirdrops?.map(a => a.user_id) || [])

    let finedCount = 0

    // 3. วนลูปตรวจเช็คสมาชิกทุกตำแหน่ง (รวมหัวแก๊ง/รองแก๊ง) และทำการปรับเงินหากไม่มีการลงแอร์ดรอปที่อนุมัติ
    for (const member of members) {
      const hasApprovedAirdrop = approvedUserIds.has(member.id)

      if (!hasApprovedAirdrop) {
        const penalty = 100000
        const currentBalance = member.fine_balance ?? 0
        
        // อัปเดตยอด Fine Balance ของสมาชิก (+100,000)
        await supabase
          .from('profiles')
          .update({ fine_balance: currentBalance + penalty })
          .eq('id', member.id)

        // เพิ่มประวัติใน fine_logs
        await supabase.from('fine_logs').insert({
          user_id: member.id,
          amount: penalty,
          reason: 'ไม่ได้ลงแอร์ดรอปตามเวลาที่กำหนด (เดดไลน์ 22:15 น.)',
          type: 'fine'
        })

        finedCount++
      }
    }

    // 4. ปรับรายการที่ยังค้างรออนุมัติ ('pending') ของวันนี้ให้เป็นปฏิเสธ ('rejected') เนื่องจากเลยเวลาเดดไลน์แล้ว
    await supabase
      .from('airdrop_checkins')
      .update({ status: 'rejected' })
      .eq('status', 'pending')
      .gte('created_at', `${today}T00:00:00`)

    // 5. ลบหลักฐานรูปภาพการเช็คชื่อแอร์ดรอปของวันก่อนหน้าเพื่อประหยัดพื้นที่ Storage
    await supabase
      .from('airdrop_checkins')
      .delete()
      .lt('created_at', `${today}T00:00:00`)

    return { 
      success: true, 
      fined_members: finedCount,
      message: 'คำนวณค่าปรับแอร์ดรอปสำหรับสมาชิกทุกคน (เดดไลน์ 22:15 น.) เรียบร้อยแล้ว'
    }
  } catch (error: any) {
    console.error('Auto fine error:', error)
    return { success: false, error: error?.message || 'Internal Server Error' }
  }
})