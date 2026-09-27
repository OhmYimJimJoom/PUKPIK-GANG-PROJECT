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

    // 1. ดึงสมาชิกทั้งหมด (รวม Leader) ที่ไม่ได้ตั้งสถานะลาหยุด
    const { data: members, error: memberErr } = await supabase
      .from('profiles')
      .select('*')
      .or('leave_status.is.null,leave_status.eq.false')

    if (memberErr) throw memberErr
    if (!members) return { success: true, count: 0 }

    // 2. ดึงรายการเช็คชื่อประจำวันของวันนี้
    const { data: dailyCheckins } = await supabase
      .from('checkins')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00`)

    // 3. ดึงรายการเช็คชื่อแอร์ดรอปของวันนี้
    const { data: airdropCheckins } = await supabase
      .from('airdrop_checkins')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00`)

    const dailyUserIds = new Set(dailyCheckins?.map(c => c.user_id) || [])
    const airdropUserIds = new Set(airdropCheckins?.map(a => a.user_id) || [])

    let finedCount = 0

    // 4. วนลูปตรวจเช็คและบันทึกค่าปรับ
    for (const member of members) {
      const missedDaily = !dailyUserIds.has(member.id)
      const missedAirdrop = !airdropUserIds.has(member.id)

      let penalty = 0
      let reasons: string[] = []

      if (missedDaily) {
        penalty += 100000
        reasons.push('ขาดเช็คชื่อประจำวัน (หลัง 21:00 น.)')
      }
      if (missedAirdrop) {
        penalty += 100000
        reasons.push('ขาดเช็คชื่อแอร์ดรอป (หลัง 22:00 น.)')
      }

      if (penalty > 0) {
        await supabase
          .from('profiles')
          .update({ fine_balance: (member.fine_balance || 0) + penalty })
          .eq('id', member.id)

        await supabase.from('fine_logs').insert({
          user_id: member.id,
          amount: penalty,
          reason: `ปรับอัตโนมัติ: ${reasons.join(' และ ')}`,
          type: 'fine'
        })

        finedCount++
      }
    }

    // 5. ล้างหลักฐานรูปภาพการเช็คชื่อเดิม และรีเซ็ตสถานะการออนไลน์
    // ลบรายการเช็คชื่อ daily ของวันก่อนหน้า
    await supabase
      .from('checkins')
      .delete()
      .lt('created_at', `${today}T00:00:00`)

    // ลบรายการเช็คชื่อ airdrop ของวันก่อนหน้า
    await supabase
      .from('airdrop_checkins')
      .delete()
      .lt('created_at', `${today}T00:00:00`)

    // ปรับสถานะการออนไลน์ในเมือง (is_online) ของสมาชิกทุกคนให้กลับเป็น false
    await supabase
      .from('profiles')
      .update({ is_online: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return { 
      success: true, 
      fined_members: finedCount,
      message: 'คำนวณค่าปรับ ลบหลักฐานเช็คชื่อเดิม และรีเซ็ตสถานะออนไลน์เรียบร้อยแล้ว'
    }
  } catch (error: any) {
    console.error('Auto fine error:', error)
    return { success: false, error: error?.message || 'Internal Server Error' }
  }
})