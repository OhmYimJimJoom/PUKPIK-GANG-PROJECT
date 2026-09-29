import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // ใช้ Service Role หรือ Supabase URL/Key ตามที่ตั้งค่าไว้
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.supabaseServiceRoleKey || config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    return { status: 'error', message: 'Missing Supabase configuration' }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. ดึงข้อมูลสมาชิกทั้งหมด
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, character_name, leave_status, fine_balance')

    if (profilesErr) throw profilesErr

    // 2. ดึงรายการเช็คชื่อแอร์ดรอปที่ได้รับการอนุมัติวันนี้
    const { data: approvedCheckins, error: checkinErr } = await supabase
      .from('airdrop_checkins')
      .select('user_id')
      .eq('status', 'approved')

    if (checkinErr) throw checkinErr

    const approvedUserIds = new Set(approvedCheckins?.map(c => c.user_id) || [])

    // 3. วนลูปตรวจสอบสมาชิกที่ไม่ลงแอร์ดรอปและไม่ได้ลาหยุด
    const fineAmount = 100000
    const fineLogsToInsert = []
    const profileUpdates = []

    for (const profile of profiles || []) {
      // ถ้าไม่ได้ลงแอร์ดรอป และไม่ได้ลาหยุด
      if (!approvedUserIds.has(profile.id) && !profile.leave_status) {
        // เพิ่มประวัติการโดนปรับ 100,000 บาท
        fineLogsToInsert.push({
          user_id: profile.id,
          amount: fineAmount,
          reason: 'ขาดการลงแอร์ดรอปประจำวัน (ปรับอัตโนมัติ 03:00 น.)',
          type: 'fine'
        })

        // เพิ่มยอดหนี้สะสม
        const newBalance = (profile.fine_balance || 0) + fineAmount
        profileUpdates.push(
          supabase
            .from('profiles')
            .update({ fine_balance: newBalance })
            .eq('id', profile.id)
        )
      }
    }

    // ทำการบันทึกค่าปรับย้อนหลัง
    if (fineLogsToInsert.length > 0) {
      await supabase.from('fine_logs').insert(fineLogsToInsert)
      await Promise.all(profileUpdates)
    }

    // 4. 🔄 รีเซ็ตสถานะทุกอย่างต้อนรับวันใหม่ (03:00 น.)
    // 4.1 ล้างหลักฐานการเช็คชื่อแอร์ดรอปทั้งหมด
    await supabase.from('airdrop_checkins').delete().neq('id', 0)

    // 4.2 รีเซ็ตสถานะการลาหยุดของทุกคน
    await supabase.from('profiles').update({ leave_status: false }).eq('leave_status', true)

    // 4.3 อัปเดตคำขอลาหยุดรออนุมัติให้หมดอายุ
    await supabase.from('leave_requests').update({ status: 'expired' }).eq('status', 'pending')

    return {
      status: 'success',
      message: 'ประมวลผลปรับเงินขาดแอร์ดรอป และรีเซ็ตระบบประจำวันสำเร็จ',
      fined_count: fineLogsToInsert.length
    }
  } catch (error: any) {
    console.error('Auto Fine & Reset Cron Error:', error)
    return { status: 'error', message: error.message }
  }
})