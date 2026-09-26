import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // 1. ใส่ Type Assertion (as string) เพื่อยืนยันว่าเป็น string
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseServiceKey = config.supabaseServiceKey as string

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. ดึงสมาชิกทั้งหมดที่ไม่ใช่ Leader และไม่ได้ตั้งสถานะลาหยุด
    const { data: members } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'leader')
      .or('leave_status.is.null,leave_status.eq.false')

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
        // อัปเดตยอดหนี้สะสม
        await supabase
          .from('profiles')
          .update({ fine_balance: (member.fine_balance || 0) + penalty })
          .eq('id', member.id)

        // เพิ่มประวัติใน fine_logs
        await supabase.from('fine_logs').insert({
          user_id: member.id,
          amount: penalty,
          reason: `ปรับอัตโนมัติ: ${reasons.join(' และ ')}`,
          type: 'fine'
        })

        finedCount++
      }
    }

    return { success: true, fined_members: finedCount }
  } catch (error: any) {
    // 2. ระบุประเภทของ error เป็น any หรือแปลงเป็น Error object เพื่อให้ดึง message ได้
    console.error('Auto fine error:', error)
    return { success: false, error: error?.message || 'Internal Server Error' }
  }
})