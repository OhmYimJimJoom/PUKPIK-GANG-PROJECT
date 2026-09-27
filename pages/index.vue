<template>
  <!-- Container หลักพร้อมพื้นหลังดาร์คโทน -->
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 relative overflow-hidden">
    
    <!-- Background Image Placeholders -->
    <div class="fixed top-[-5%] left-[-5%] w-[500px] h-[500px] bg-cover bg-center rounded-3xl pointer-events-none rotate-12 backdrop-blur-xs opacity-30 border border-slate-700/50" style="background-image: url('/img/image.png');"></div>
    <div class="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-cover bg-center rounded-3xl pointer-events-none -rotate-6 backdrop-blur-xs opacity-30 border border-slate-700/50" style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png');"></div>
    <div class="fixed bottom-[-10%] left-[15%] w-[500px] h-[500px] bg-cover bg-center rounded-3xl pointer-events-none rotate-4 backdrop-blur-xs opacity-30 border border-slate-700/50" style="background-image: url('/img/image1.png');"></div>

    <!-- ❄️ Snowfall Canvas Effect -->
    <canvas ref="snowCanvas" class="fixed inset-0 pointer-events-none z-20"></canvas>

   <!-- 🎵 Floating Audio Player Widget -->
    <div class="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2.5 transition-all hover:border-red-500/50 group w-72 sm:w-80">
      <audio ref="audioRef" :src="currentTrack.url" @ended="nextTrack" :loop="false"></audio>
      
      <!-- Top Track Info & Select Box -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <span v-if="isPlaying" class="w-2 h-2 rounded-full bg-green-400 animate-ping shrink-0"></span>
          <span v-else class="w-2 h-2 rounded-full bg-slate-500 shrink-0"></span>
          <select 
            v-model="currentTrackIndex" 
            @change="changeTrack"
            class="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-red-500 truncate w-full cursor-pointer"
          >
            <option v-for="(track, index) in playlist" :key="index" :value="index">
              {{ index + 1 }}. {{ track.title }}
            </option>
          </select>
        </div>
        <span class="text-[10px] text-slate-400 font-medium shrink-0">{{ Math.round(volume * 100) }}%</span>
      </div>

      <!-- Controls & Volume -->
      <div class="flex items-center gap-3">
        <!-- Playback Buttons -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            @click="prevTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer"
            title="เพลงก่อนหน้า"
          >
            ⏮️
          </button>

          <button 
            @click="toggleMusic" 
            class="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg shadow-red-600/30 cursor-pointer"
            :title="isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'"
          >
            <span v-if="isPlaying" class="text-sm">⏸️</span>
            <span v-else class="text-sm animate-pulse">🎵</span>
          </button>

          <button 
            @click="nextTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition text-xs cursor-pointer"
            title="เพลงถัดไป"
          >
            ⏭️
          </button>
        </div>

        <div class="flex flex-col gap-1 w-28 sm:w-36">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            v-model.number="volume" 
            @input="updateVolume"
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
    </div>

    <!-- Header & Profile Bar & Logout -->
    <header class="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center space-x-3">
          <div 
            class="w-20 h-20 rounded-lg shadow-lg shadow-red-600/40 border border-red-500/50 bg-cover bg-center shrink-0" 
            style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png');"
          ></div>
          <div>
            <h1 class="text-xl font-bold tracking-wider text-white flex items-center gap-2">
              PUKPIK GANG SYSTEM
            </h1>
            <p class="text-xs text-slate-400">ระบบจัดการแก๊งแบบครบวงจร</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur">
            <div class="text-right">
              <p class="text-xs font-bold text-white">{{ currentUserProfile?.character_name || 'ไม่พบข้อมูลผู้ใช้' }}</p>
              <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 justify-end">
                <span :class="getRoleBadge(currentUserRole)" class="px-1.5 py-0.5 rounded font-semibold text-[10px]">
                  {{ getRoleName(currentUserRole) }}
                </span>
                <span v-if="currentUserProfile?.leave_status" class="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                  🌴 ลาหยุด
                </span>
              </div>
            </div>
          </div>

          <button 
            @click="handleLogout" 
            class="bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8 relative z-30">
      <!-- Nav Tabs -->
      <div class="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-5 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap cursor-pointer',
            activeTab === tab.id ? 'border-red-500 font-bold text-red-500 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.badge && tab.badge > 0" class="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full animate-pulse">
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- Tab 1: รายชื่อสมาชิก & การเช็คชื่อแอร์ดรอป -->
      <div v-if="activeTab === 'members'" class="space-y-6">
        
        <!-- แจ้งลาหยุดประจำวัน -->
        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              🌴 แจ้งลาหยุดประจำวัน
            </h3>
            <p class="text-xs text-slate-400 mt-1">ต้องระบุสาเหตุ และรอการอนุมัติจากหัวหน้า/รองหัวหน้าแก๊งก่อน จึงจะเว้นการโดนปรับแอร์ดรอป</p>
          </div>
          
          <button 
            v-if="currentUserProfile?.leave_status"
            @click="handleCancelLeave"
            class="px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 cursor-pointer shadow-md shrink-0"
          >
            ✅ กำลังลาหยุดพัก (กดเพื่อยกเลิกการลา)
          </button>
          
          <button 
            v-else
            @click="showLeaveModal = true"
            class="px-4 py-2 rounded-lg text-xs font-bold transition bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer shadow-md shrink-0"
          >
            ✈️ ยื่นเรื่องขอลาหยุดวันนี้
          </button>
        </div>

        <!-- รายการขอลาหยุดรออนุมัติ -->
        <div v-if="isManagement && pendingLeaveRequests.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-amber-400 mb-4">🌴 รายการคำขอลาหยุดรออนุมัติ ({{ pendingLeaveRequests.length }})</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="req in pendingLeaveRequests" :key="req.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-bold text-white">{{ req.profiles?.character_name || 'สมาชิก' }}</p>
                  <p class="text-xs text-slate-400 mt-1">เหตุผล: <span class="text-amber-200">{{ req.reason }}</span></p>
                </div>
                <span class="text-[10px] text-slate-500">{{ new Date(req.created_at).toLocaleTimeString() }}</span>
              </div>
              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button @click="store.approveLeaveRequest(req.id, req.user_id, true)" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded font-medium cursor-pointer">อนุมัติลา</button>
                <button @click="store.approveLeaveRequest(req.id, req.user_id, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded cursor-pointer">ปฏิเสธ</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form เช็คชื่อเข้าแอร์ดรอป -->
        <div class="max-w-2xl mx-auto bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl">
          <h2 class="text-base font-bold text-amber-400 mb-1 flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            เช็คชื่อเข้าแอร์ดรอป (เดดไลน์ 22:15 น.)
          </h2>
          <p class="text-xs text-slate-400 mb-4">*ถ่ายรูปหลักฐานส่งก่อน 22:15 น. เพื่อให้หัวแก๊งกดอนุมัติ หากเลยเวลา 22:15 น. หรือไม่ได้รับการอนุมัติ จะโดนปรับ 100,000 บาท อัตโนมัติ*</p>
          
          <!-- แสดงเตือนถ้าส่งไปแล้วแต่รออนุมัติอยู่ -->
          <div v-if="userPendingAirdrop" class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
            ⏳ ส่งหลักฐานแอร์ดรอปแล้ว กำลังรอหัวแก๊งกดอนุมัติ...
          </div>

          <form @submit.prevent="handleCheckin('airdrop')" class="space-y-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1">เลือกรูปภาพหลักฐานเข้าร่วมแอร์ดรอป</label>
              <input 
                type="file" 
                accept="image/*" 
                @change="e => handleFileSelect(e, 'airdrop')" 
                required 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer" 
              />
            </div>
            <button 
              type="submit" 
              :disabled="isUploadingAirdrop" 
              class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 text-white font-medium py-2.5 rounded-lg text-xs transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              {{ isUploadingAirdrop ? 'กำลังอัปโหลด...' : 'ส่งหลักฐานแอร์ดรอปให้หัวแก๊งอนุมัติ' }}
            </button>
          </form>
        </div>

        <!-- รายการอนุมัติแอร์ดรอปรอตรวจสอบ (ยศบริหาร/หัวแก๊ง) -->
        <div v-if="isManagement && pendingAirdropCheckins.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-amber-400 mb-4">⏳ รายการเช็คชื่อแอร์ดรอปรออนุมัติ ({{ pendingAirdropCheckins.length }})</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in pendingAirdropCheckins" :key="item.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-bold text-white">{{ item.profiles?.character_name || 'สมาชิก' }}</p>
                  <p class="text-xs text-amber-400">เช็คชื่อแอร์ดรอป</p>
                </div>
                <span class="text-[10px] text-slate-500">{{ new Date(item.created_at).toLocaleTimeString() }}</span>
              </div>
              <a :href="item.image_url" target="_blank" class="block">
                <img :src="item.image_url" class="w-full h-36 object-cover rounded-md border border-slate-800 hover:opacity-90 transition" />
              </a>
              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button @click="handleApproveAirdrop(item.id, item.user_id, true)" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded font-medium cursor-pointer">อนุมัติ</button>
                <button @click="handleApproveAirdrop(item.id, item.user_id, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded cursor-pointer">ปฏิเสธ</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ตารางรายชื่อสมาชิก & สถานะลงแอร์ดรอป -->
        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 class="font-bold text-white">รายชื่อสมาชิกและสถานะการลงแอร์ดรอปประจำวัน</h2>
            <button v-if="isManagement" @click="exportCSV" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
              📥 ส่งออกไฟล์ CSV
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-300">
              <thead class="bg-slate-950/80 text-xs text-slate-400 uppercase">
                <tr>
                  <th class="p-4">ชื่อในเมือง</th>
                  <th class="p-4">ตำแหน่ง</th>
                  <th class="p-4">เบอร์โทร</th>
                  <th class="p-4">สถานะการลา</th>
                  <th class="p-4">ยอดหนี้สะสม</th>
                  <th class="p-4">สถานะแอร์ดรอป</th>
                  <th class="p-4">หลักฐานล่าสุด</th>
                  <th v-if="isManagement" class="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr v-for="member in getArray(store.profiles)" :key="member.id" class="hover:bg-slate-800/40 transition">
                  <td class="p-4 font-medium text-white">{{ member.character_name }}</td>
                  <td class="p-4">
                    <span :class="getRoleBadge(member.role)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                      {{ getRoleName(member.role) }}
                    </span>
                  </td>
                  <td class="p-4 text-slate-400">{{ member.phone_number || '-' }}</td>
                  <td class="p-4">
                    <span :class="member.leave_status ? 'text-amber-400 font-bold' : 'text-slate-500'">
                      {{ member.leave_status ? '🌴 ลากิจ' : 'ปกติ' }}
                    </span>
                  </td>
                  <td class="p-4 font-mono font-bold" :class="(member.fine_balance || 0) > 0 ? 'text-red-400' : 'text-green-400'">
                    ${{ (member.fine_balance || 0).toLocaleString() }}
                  </td>
                  
                  <!-- สถานะการลงแอร์ดรอป (ลงแล้ว / ลา / ไม่ได้ลง) -->
                  <td class="p-4">
                    <span 
                      v-if="getAirdropStatus(member) === 'approved'"
                      class="bg-green-500/10 text-green-400 border-green-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      ลงแอร์ดรอปแล้ว
                    </span>
                    <span 
                      v-else-if="getAirdropStatus(member) === 'leave'"
                      class="bg-blue-500/10 text-blue-400 border-blue-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      ลาหยุด
                    </span>
                    <span 
                      v-else-if="getAirdropStatus(member) === 'pending'"
                      class="bg-amber-500/10 text-amber-400 border-amber-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      รอหัวแก๊งอนุมัติ
                    </span>
                    <span 
                      v-else
                      class="bg-red-500/10 text-red-400 border-red-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      ไม่ได้ลงแอร์ดรอป
                    </span>
                  </td>

                  <td class="p-4">
                    <div v-if="getLatestAirdropImage(member.id)" class="flex items-center gap-2">
                      <a 
                        :href="getLatestAirdropImage(member.id)" 
                        target="_blank" 
                        class="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded text-xs border border-slate-700 flex items-center gap-1 transition"
                      >
                        📷 รูปหลักฐาน
                      </a>
                    </div>
                    <span v-else class="text-xs text-slate-600 italic">ไม่มีหลักฐาน</span>
                  </td>
                  <td v-if="isManagement" class="p-4 text-center">
                    <button 
                      @click="handleDeleteMember(member)" 
                      class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1 rounded-lg transition cursor-pointer"
                    >
                      ลบออก
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: กฎแก๊ง PUKPIK -->
      <div v-if="activeTab === 'rules'" class="space-y-6">
        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl">
          <div class="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                📜 กฎระเบียบประจำแก๊ง PUKPIK
              </h2>
              <p class="text-xs text-slate-400 mt-1">สมาชิกทุกคนต้องรับทราบและปฏิบัติตามอย่างเคร่งครัด</p>
            </div>
            <button 
              v-if="isManagement" 
              @click="openAddRuleModal" 
              class="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-red-600/20 cursor-pointer"
            >
              ➕ เพิ่มกฎข้อใหม่
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div 
              v-for="rule in getArray(store.rulesList)" 
              :key="rule.id" 
              class="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="bg-red-600/20 text-red-400 border border-red-500/30 font-bold px-2.5 py-0.5 rounded text-xs font-mono">
                    กฎข้อที่ {{ rule.rule_number }}
                  </span>
                  <h3 class="font-bold text-white text-base">{{ rule.title }}</h3>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed pl-1 pt-1">{{ rule.content }}</p>
              </div>

              <div v-if="isManagement" class="flex items-center gap-2 shrink-0">
                <button @click="openEditRuleModal(rule)" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-700 cursor-pointer">✏️ แก้ไข</button>
                <button @click="handleDeleteRule(rule.id)" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded border border-red-500/30 cursor-pointer">🗑️ ลบ</button>
              </div>
            </div>

            <div v-if="getArray(store.rulesList).length === 0" class="p-8 text-center text-slate-500 text-sm">
              ยังไม่มีการกำหนดกฎแก๊งในขณะนี้
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: โปรไฟล์ & ค่าปรับ -->
      <div v-if="activeTab === 'profile'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center text-center">
            <div class="w-24 h-24 rounded-full bg-slate-800 border-2 border-red-500/50 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-500/10">
              👤
            </div>
            <h2 class="text-xl font-bold text-white">{{ currentUserProfile?.character_name }}</h2>
            <p class="text-xs text-slate-400 mt-1">ตำแหน่ง: {{ getRoleName(currentUserRole) }}</p>
            <p class="text-xs text-slate-400">เบอร์โทร: {{ currentUserProfile?.phone_number || '-' }}</p>
          </div>

          <div class="md:col-span-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <p class="text-xs text-slate-400 mb-1">ยอดเงินโดนปรับ/ค้างชำระทั้งหมด (Fine Balance)</p>
              <p class="text-4xl font-black font-mono" :class="(currentUserProfile?.fine_balance || 0) > 0 ? 'text-red-500' : 'text-green-400'">
                ${{ (currentUserProfile?.fine_balance || 0).toLocaleString() }}
              </p>
            </div>
            <div class="mt-4 p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400">
              ℹ️ หากต้องการชำระค่าปรับ สามารถแนบสลิปส่งเงินได้ที่เมนู <b>"คลังเงินแก๊ง"</b> เพื่อให้ยศบริหารตัดยอดหนี้ให้ครับ
            </div>
          </div>
        </div>

        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 font-bold text-white bg-slate-900/50">ประวัติค่าปรับและการชำระเงินส่วนตัว</div>
          <div class="divide-y divide-slate-800/80">
            <div v-for="log in myFineLogs" :key="log.id" class="p-4 flex justify-between items-center hover:bg-slate-800/30 transition">
              <div>
                <p class="font-medium text-white text-sm">{{ log.reason }}</p>
                <p class="text-xs text-slate-500">{{ new Date(log.created_at).toLocaleString() }}</p>
              </div>
              <p :class="log.type === 'fine' ? 'text-red-400' : 'text-green-400'" class="font-mono font-bold text-base">
                {{ log.type === 'fine' ? '+' : '-' }}${{ Number(log.amount).toLocaleString() }}
              </p>
            </div>
            <div v-if="myFineLogs.length === 0" class="p-8 text-center text-slate-500 text-sm">
              ไม่มีประวัติโดนปรับเงิน 🎉
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 4: คลังเงินแก๊ง -->
      <div v-if="activeTab === 'treasury'" class="space-y-6">
        <div class="bg-gradient-to-r from-slate-900/90 via-slate-900/90 to-red-950/80 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur">
          <div>
            <p class="text-xs text-slate-400 mb-1">ยอดเงินคงเหลือในคลังแก๊ง</p>
            <p class="text-4xl font-black text-green-400 font-mono drop-shadow">${{ (getVal(store.totalBalance) || 0).toLocaleString() }}</p>
          </div>

          <button 
            v-if="isManagement"
            @click="showWithdrawModal = true"
            class="bg-red-600 hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer border border-red-500/50 shrink-0"
          >
            💸 เบิกเงินออกจากคลังแก๊ง
          </button>
        </div>

        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-white mb-1">💳 นำส่งสลิปเงินเข้าคลังแก๊ง</h2>
          <p class="text-xs text-slate-400 mb-4">สมาชิกสามารถแนบสลิปเพื่อขอฝากเงิน, โดเนท หรือชำระค่าปรับได้ทันที</p>
          
          <form @submit.prevent="handleDepositSubmit" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1">จำนวนเงิน ($)</label>
              <input v-model.number="depositForm.amount" type="number" min="1" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">หมวดหมู่รายการ</label>
              <select v-model="depositForm.category" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                <option value="ส่งเงินแก๊ง">ส่งเงินแก๊ง</option>
                <option value="โดเนทให้แก๊ง">โดเนทให้แก๊ง</option>
                <option value="จ่ายค่าปรับแอร์ดรอป">จ่ายค่าปรับแอร์ดรอป</option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">แนบรูปสลิปโอนเงิน</label>
              <input type="file" accept="image/*" @change="handleDepositFileSelect" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded cursor-pointer" />
            </div>

            <div class="flex items-end">
              <button type="submit" :disabled="isUploadingDeposit" class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg text-sm transition cursor-pointer shadow-lg shadow-green-600/20">
                {{ isUploadingDeposit ? 'กำลังส่งสลิป...' : 'ส่งสลิปโอนเงิน' }}
              </button>
            </div>
          </form>
        </div>

        <div v-if="isManagement && pendingDeposits.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-amber-400 mb-4">💳 รายการสลิปส่งเงินรออนุมัติ ({{ pendingDeposits.length }})</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="dep in pendingDeposits" :key="dep.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-bold text-white">{{ dep.profiles?.character_name || 'สมาชิก' }}</p>
                  <p class="text-xs text-amber-400 font-semibold">{{ dep.category }}</p>
                  <p class="text-lg font-mono font-bold text-green-400 mt-1">${{ Number(dep.amount).toLocaleString() }}</p>
                </div>
                <span class="text-[10px] text-slate-500">{{ new Date(dep.created_at).toLocaleTimeString() }}</span>
              </div>
              <a :href="dep.slip_url" target="_blank" class="block">
                <img :src="dep.slip_url" class="w-full h-36 object-cover rounded-md border border-slate-800 hover:opacity-90 transition" />
              </a>
              <div class="flex gap-2 pt-2 border-t border-slate-800">
                <button @click="handleApproveDeposit(dep, true)" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded font-medium cursor-pointer">อนุมัติเงินเข้าคลัง</button>
                <button @click="handleApproveDeposit(dep, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded cursor-pointer">ปฏิเสธ</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 font-bold text-white bg-slate-900/50">ประวัติการธุรกรรม</div>
          <div class="divide-y divide-slate-800/80">
            <div v-for="log in getArray(store.treasuryLogs)" :key="log.id" class="p-4 flex justify-between items-center hover:bg-slate-800/30 transition">
              <div>
                <p class="font-medium text-white">{{ log.description }}</p>
                <p class="text-xs text-slate-500">ผู้อนุมัติ/ทำรายการ: {{ log.created_by }} • {{ new Date(log.created_at).toLocaleString() }}</p>
              </div>
              <p :class="log.type === 'deposit' ? 'text-green-400' : 'text-red-400'" class="font-mono font-bold text-lg">
                {{ log.type === 'deposit' ? '+' : '-' }}${{ Number(log.amount).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 5: คลังของแก๊ง -->
      <div v-if="activeTab === 'inventory'" class="space-y-6">
        <div v-if="canManageInventory" class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-white mb-4">เพิ่มไอเทมใหม่เข้าคลังแก๊ง</h2>
          <form @submit.prevent="handleAddInventory" class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1">ชื่อไอเทม</label>
              <input v-model="itemForm.name" type="text" placeholder="เช่น AED PainKiller, เกราะ" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">หมวดหมู่</label>
              <input v-model="itemForm.category" type="text" placeholder="เช่น ยา, ทั่วไป" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">จำนวนเริ่มต้น</label>
              <input v-model.number="itemForm.quantity" type="number" min="1" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">รูปไอเทม (ถ้ามี)</label>
              <input type="file" accept="image/*" @change="handleItemFileSelect" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-slate-200 cursor-pointer" />
            </div>
            <div class="flex items-end">
              <button type="submit" :disabled="isUploadingItem" class="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg text-sm transition cursor-pointer shadow-lg shadow-red-600/20">
                {{ isUploadingItem ? 'กำลังบันทึก...' : 'เพิ่มเข้าคลัง' }}
              </button>
            </div>
          </form>
        </div>

        <div v-else class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📦</span>
            <div>
              <h3 class="font-bold text-white text-sm">คลังไอเทมแก๊ง</h3>
              <p class="text-xs text-slate-400">คุณสามารถตรวจสอบจำนวนไอเทมในคลังได้ (หากต้องการขอเบิกของ กรุณายื่นคำร้องหรือติดต่อคนเก็บของแก๊ง)</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="item in getArray(store.inventory)" :key="item.id" class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-red-500/50 transition duration-300">
            <div class="relative h-40 bg-slate-950 flex items-center justify-center border-b border-slate-800/80 overflow-hidden group">
              <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div v-else class="text-4xl text-slate-700 select-none">📦</div>
              <span class="absolute top-2 left-2 text-[10px] bg-slate-900/80 backdrop-blur text-slate-300 px-2 py-0.5 rounded border border-slate-700/80 uppercase font-bold">
                {{ item.category }}
              </span>
            </div>

            <div class="p-4 space-y-3">
              <div>
                <h3 class="font-bold text-base text-white truncate">{{ item.item_name }}</h3>
                <p class="text-2xl font-mono font-black text-red-500 my-1">
                  {{ Number(item.quantity).toLocaleString() }} <span class="text-xs text-slate-500 font-normal">ชิ้น</span>
                </p>
              </div>

              <div v-if="canManageInventory" class="pt-3 border-t border-slate-800/80 space-y-2">
                <div class="flex gap-1.5">
                  <button @click="openQtyAdjustModal(item, 'add')" class="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 text-xs py-1 rounded font-bold cursor-pointer transition">
                    + เพิ่มของ
                  </button>
                  <button @click="openQtyAdjustModal(item, 'sub')" class="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs py-1 rounded font-bold cursor-pointer transition">
                    - เบิกออก
                  </button>
                </div>
                <button @click="store.deleteInventoryItem(item.id)" class="w-full text-center text-xs text-slate-500 hover:text-red-400 hover:underline cursor-pointer py-0.5">
                  ลบรายการนี้
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 6: คำร้องสมาชิก -->
      <div v-if="activeTab === 'tickets'" class="space-y-6">
        <div v-if="!isManagement" class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 class="text-lg font-bold text-white mb-4">ยื่นคำร้องใหม่ถึงหัวหน้าแก๊ง</h2>
          <form @submit.prevent="handleTicket" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">หัวข้อคำร้อง</label>
                <input v-model="ticketForm.title" type="text" placeholder="เช่น ขอเบิกเงินตีอาวุธ" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">หมวดหมู่</label>
                <select v-model="ticketForm.category" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                  <option value="เบิกของ/เงิน">เบิกของ / เบิกเงิน</option>
                  <option value="เรื่องอื่นๆ">เรื่องอื่นๆ</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">รายละเอียด</label>
              <textarea v-model="ticketForm.detail" rows="3" required class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"></textarea>
            </div>
            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition cursor-pointer shadow-lg shadow-red-600/20">
              ส่งคำร้อง
            </button>
          </form>
        </div>

        <div v-else class="bg-slate-900/90 backdrop-blur border border-red-500/30 rounded-xl p-4 shadow-xl flex items-center gap-3">
          <span class="text-2xl">📋</span>
          <div>
            <h3 class="font-bold text-white text-sm">การจัดการคำร้องของสมาชิก (สำหรับหัวหน้า/รอง)</h3>
            <p class="text-xs text-slate-400">คุณอยู่ในสถานะผู้ตรวจสอบ กรุณาพิจารณาและอนุมัติคำร้องจากรายการด้านล่างนี้</p>
          </div>
        </div>

        <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center bg-slate-900/50">
            <span>รายการคำร้องทั้งหมด</span>
            <span v-if="isManagement" class="text-xs font-normal text-amber-400">
              รออนุมัติ: {{ getArray(store.tickets).filter(t => t.status === 'pending').length }} รายการ
            </span>
          </div>
          <div class="divide-y divide-slate-800/80">
            <div v-for="ticket in getArray(store.tickets)" :key="ticket.id" class="p-5 space-y-2">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 mr-2">{{ ticket.category }}</span>
                  <h3 class="font-bold text-white inline-block">{{ ticket.title }}</h3>
                  <p class="text-xs text-slate-500 mt-1">ผู้ยื่น: {{ ticket.profiles?.character_name || 'สมาชิก' }} • {{ new Date(ticket.created_at).toLocaleString() }}</p>
                </div>
                <span :class="getTicketBadge(ticket.status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ getTicketStatusText(ticket.status) }}
                </span>
              </div>
              <p class="text-sm text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/50">{{ ticket.detail }}</p>
              
              <div v-if="isManagement" class="flex gap-2 pt-2">
                <button @click="store.updateTicketStatus(ticket.id, 'approved')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-1.5 rounded font-medium cursor-pointer">อนุมัติคำร้อง</button>
                <button @click="store.updateTicketStatus(ticket.id, 'rejected')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded cursor-pointer">ไม่อนุมัติ</button>
              </div>
            </div>
            <div v-if="getArray(store.tickets).length === 0" class="p-8 text-center text-slate-500 text-sm">
              ไม่มีคำร้องในขณะนี้
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal 1: ป๊อปอัพ ยื่นคำขอลาหยุด -->
    <div v-if="showLeaveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">🌴 ยื่นเรื่องขอลาหยุด</h3>
        <p class="text-xs text-slate-400">กรุณาระบุสาเหตุการลา คำขอจะส่งไปยังหัวหน้า/รองหัวหน้าแก๊งเพื่อพิจารณาอนุมัติ</p>
        <div>
          <label class="block text-xs text-slate-300 mb-1">สาเหตุการลา</label>
          <textarea v-model="leaveReason" rows="3" placeholder="เช่น ติดภารกิจต่างจังหวัด, ไม่สบาย" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500"></textarea>
        </div>
        <div class="flex gap-2 justify-end pt-2">
          <button @click="showLeaveModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer">ยกเลิก</button>
          <button @click="handleLeaveSubmit" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-amber-600/20">ยื่นคำขอลา</button>
        </div>
      </div>
    </div>

    <!-- Modal 2: ป๊อปอัพ ปรับจำนวนไอเทม -->
    <div v-if="showQtyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl p-6 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white">
          {{ qtyModalMode === 'add' ? '➕ เพิ่มจำนวนไอเทม' : '➖ เบิกออก/ลดจำนวนไอเทม' }}
        </h3>
        <p class="text-xs text-slate-400">ไอเทม: <span class="text-white font-bold">{{ selectedQtyItem?.item_name }}</span> (คงเหลือ {{ selectedQtyItem?.quantity }} ชิ้น)</p>
        
        <div>
          <label class="block text-xs text-slate-300 mb-1">กรอกจำนวนที่ต้องการ {{ qtyModalMode === 'add' ? 'เพิ่ม' : 'ลด' }}</label>
          <input v-model.number="customQtyAmount" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500" />
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <button @click="showQtyModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer">ยกเลิก</button>
          <button @click="submitCustomQty" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20">ยืนยัน</button>
        </div>
      </div>
    </div>

    <!-- Modal 3: ป๊อปอัพ เพิ่ม/แก้ไข กฎแก๊งรายข้อ -->
    <div v-if="showRuleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl p-6 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white">{{ isEditingSingleRule ? '✏️ แก้ไขกฎแก๊ง' : '➕ เพิ่มกฎแก๊งข้อใหม่' }}</h3>
        
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">ลำดับข้อ (เช่น 1, 2, 3)</label>
            <input v-model.number="ruleForm.rule_number" type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">หัวข้อกฎ</label>
            <input v-model="ruleForm.title" type="text" placeholder="เช่น การเข้าร่วมกิจกรรมสภา" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">รายละเอียดกฎระเบียบ</label>
            <textarea v-model="ruleForm.content" rows="4" placeholder="พิมพ์เนื้อหากฎระเบียบอย่างละเอียดที่นี่..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500"></textarea>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <button @click="showRuleModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer">ยกเลิก</button>
          <button @click="handleSaveSingleRule" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20">บันทึกกฎ</button>
        </div>
      </div>
    </div>

    <!-- Modal 4: ป๊อปอัพ สำหรับหัวหน้าเบิกเงินออกจากคลังแก๊ง -->
    <div v-if="showWithdrawModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">💸 เบิกเงินออกจากคลังแก๊ง</h3>
        <p class="text-xs text-slate-400">สำหรับหัวหน้า/รองหัวหน้าแก๊ง เบิกเงินคลังไปใช้ในภารกิจแก๊ง</p>
        
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">จำนวนเงิน ($)</label>
            <input v-model.number="withdrawForm.amount" type="number" min="1" placeholder="ระบุจำนวนเงิน" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">เหตุผลในการเบิกเงิน</label>
            <textarea v-model="withdrawForm.reason" rows="3" placeholder="เช่น ซื้ออาวุธสงคราม, ซื้อยา, จัดกิจกรรม" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500"></textarea>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <button @click="showWithdrawModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer">ยกเลิก</button>
          <button @click="handleWithdrawSubmit" :disabled="isWithdrawing" class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20">
            {{ isWithdrawing ? 'กำลังทำรายการ...' : 'ยืนยันการเบิกเงิน' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, unref, nextTick } from 'vue'

const store = useGangStore()
const client = useSupabaseClient()
const router = useRouter()

const getVal = (target) => unref(target)
const getArray = (target) => unref(target) || []

// Audio & Playlist State
const audioRef = ref(null)
const isPlaying = ref(false)
const volume = ref(0.3)
const currentTrackIndex = ref(0)

const playlist = ref([
  {
    title: 'ลื้อ ลื้อ',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553646892108480542/Y2Mate.is_-_-_Kakagoesbackhome__Official_Audio_.mp3?ex=6aba01ec&is=6ab8b06c&hm=b52eb2bac01f8e66ea765f177bda1d31d0654393c829aa98eee14b8ccbce5c77&'
  },
  {
    title: 'ไม่ได้อยากจะเลวหรอก',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553655873870503976/Z9_PAWA_COVER_REMIX.mp3?ex=6aba0a49&is=6ab8b8c9&hm=cadfdba095f12bfccb20e94ca80d5d109e8e6442bf791f76eb5136c1188b887b&'
  },
  {
    title: 'ไม่รักดีกว่า',
    url: 'https://cdn.discordapp.com/attachments/1531701261689294999/1553656914141905026/Z9_Official_Music_Video.mp3?ex=6aba0b41&is=6ab8b9c1&hm=c3ff0441afb35b7528eea3e726f720c5541c6f88978fd56bdb5da4008a48892f&'
  },
])

const currentTrack = computed(() => playlist.value[currentTrackIndex.value] || playlist.value[0])

const toggleMusic = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    playCurrentTrack()
  }
}

const playCurrentTrack = () => {
  if (!audioRef.value) return
  audioRef.value.volume = volume.value
  audioRef.value.play().then(() => {
    isPlaying.value = true
  }).catch(e => console.log('Autoplay prevented:', e))
}

const changeTrack = () => {
  nextTick(() => {
    if (isPlaying.value) {
      playCurrentTrack()
    }
  })
}

const nextTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  changeTrack()
}

const prevTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  changeTrack()
}

const updateVolume = () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
}

// ❄️ Snowfall Engine (Canvas)
const snowCanvas = ref(null)
let animationFrameId = null

const initSnowfall = () => {
  const canvas = snowCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  
  let width = canvas.width = window.innerWidth
  let height = canvas.height = window.innerHeight

  const handleResize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)

  const numFlakes = 60
  const flakes = []

  for (let i = 0; i < numFlakes; i++) {
    flakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      d: Math.random() * numFlakes,
      opacity: Math.random() * 0.7 + 0.3,
      speedY: Math.random() * 1 + 0.5,
      speedX: Math.random() * 0.5 - 0.25
    })
  }

  const draw = () => {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()

    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      ctx.moveTo(f.x, f.y)
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true)
    }
    ctx.fill()
    update()
    animationFrameId = requestAnimationFrame(draw)
  }

  const update = () => {
    for (let i = 0; i < numFlakes; i++) {
      const f = flakes[i]
      f.y += f.speedY
      f.x += f.speedX

      if (f.y > height) {
        flakes[i] = {
          x: Math.random() * width,
          y: -10,
          r: f.r,
          d: f.d,
          opacity: f.opacity,
          speedY: f.speedY,
          speedX: f.speedX
        }
      }
    }
  }

  draw()
}

// Local State
const loggedUser = ref(null)
const activeTab = ref('members')

// State การลา
const showLeaveModal = ref(false)
const leaveReason = ref('')

// State สลิปส่งเงินเข้าคลัง
const depositFile = ref(null)
const isUploadingDeposit = ref(false)
const depositForm = ref({ amount: 1000, category: 'ส่งเงินแก๊ง' })

// State สำหรับการเบิกเงินคลัง
const showWithdrawModal = ref(false)
const isWithdrawing = ref(false)
const withdrawForm = ref({ amount: 1000, reason: '' })

// State สำหรับปรับจำนวนไอเทมคลัง
const showQtyModal = ref(false)
const selectedQtyItem = ref(null)
const qtyModalMode = ref('add')
const customQtyAmount = ref(1)

// State กฎแก๊งรายข้อ
const showRuleModal = ref(false)
const isEditingSingleRule = ref(false)
const selectedRuleId = ref(null)
const ruleForm = ref({ rule_number: 1, title: '', content: '' })

// State ประวัติค่าปรับส่วนตัว
const myFineLogs = ref([])

// State ไฟล์อัปโหลด
const airdropFile = ref(null)
const isUploadingAirdrop = ref(false)
const isUploadingItem = ref(false)

const itemSelectedFile = ref(null)
const itemForm = ref({ name: '', category: 'ทั่วไป', quantity: 1 })
const ticketForm = ref({ title: '', category: 'เบิกของ/เงิน', detail: '' })

// สภาพแวดล้อมเช็คชื่อแอร์ดรอป
const airdropCheckinsList = ref([])

const fetchAirdropCheckins = async () => {
  try {
    const { data, error } = await client
      .from('airdrop_checkins')
      .select('*, profiles(character_name)')
      .order('created_at', { ascending: false })
    if (!error && data) {
      airdropCheckinsList.value = data
    }
  } catch (e) {
    console.error('Error fetching airdrop checkins:', e)
  }
}

// หาข้อมูลเช็คชื่อแอร์ดรอปประจำวันของแต่ละสมาชิก
const getAirdropStatus = (member) => {
  if (member.leave_status) return 'leave'

  const todayStr = new Date().toISOString().split('T')[0]
  const userCheckin = airdropCheckinsList.value.find(item => {
    const itemDate = new Date(item.created_at).toISOString().split('T')[0]
    return item.user_id === member.id && itemDate === todayStr
  })

  if (!userCheckin) return 'not_checked'
  if (userCheckin.status === 'approved') return 'approved'
  if (userCheckin.status === 'pending') return 'pending'
  return 'not_checked'
}

const getLatestAirdropImage = (userId) => {
  const todayStr = new Date().toISOString().split('T')[0]
  const checkin = airdropCheckinsList.value.find(item => {
    const itemDate = new Date(item.created_at).toISOString().split('T')[0]
    return item.user_id === userId && itemDate === todayStr
  })
  return checkin ? checkin.image_url : null
}

const pendingAirdropCheckins = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0]
  return airdropCheckinsList.value.filter(item => {
    const itemDate = new Date(item.created_at).toISOString().split('T')[0]
    return item.status === 'pending' && itemDate === todayStr
  })
})

const userPendingAirdrop = computed(() => {
  if (!currentUserProfile.value?.id) return false
  const todayStr = new Date().toISOString().split('T')[0]
  return airdropCheckinsList.value.some(item => {
    const itemDate = new Date(item.created_at).toISOString().split('T')[0]
    return item.user_id === currentUserProfile.value.id && item.status === 'pending' && itemDate === todayStr
  })
})

onMounted(async () => {
  initSnowfall()

  if (process.client) {
    const savedSession = localStorage.getItem('gang_user_session')
    if (savedSession) {
      try {
        loggedUser.value = JSON.parse(savedSession)
      } catch (e) {
        console.error('Failed to parse session:', e)
      }
    } else {
      router.push('/login')
      return
    }
  }

  if (store.fetchAllData) {
    await store.fetchAllData()
  }
  if (store.fetchPendingDeposits) await store.fetchPendingDeposits()
  if (store.fetchRulesList) await store.fetchRulesList()

  await fetchAirdropCheckins()
  await fetchMyFineLogs()

  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

const handleLogout = async () => {
  if (process.client) {
    localStorage.removeItem('gang_user_session')
  }
  await client.auth.signOut()
  router.push('/login')
}

const currentUserProfile = computed(() => {
  if (!loggedUser.value) return null
  const profiles = getArray(store.profiles)
  const found = profiles.find(p => p.id === loggedUser.value.id || p.character_name === loggedUser.value.character_name)
  return found || loggedUser.value
})

const currentUserRole = computed(() => currentUserProfile.value?.role || 'member')
const isLeader = computed(() => currentUserRole.value === 'leader')
const isManagement = computed(() => currentUserRole.value === 'leader' || currentUserRole.value === 'co_leader')

const isInventoryKeeper = computed(() => currentUserRole.value === 'inventory_keeper')
const canManageInventory = computed(() => isManagement.value || isInventoryKeeper.value)

const pendingLeaveRequests = computed(() => getArray(store.leaveRequests).filter(r => r.status === 'pending'))
const pendingDeposits = computed(() => getArray(store.pendingDeposits))

const tabs = computed(() => [
  { id: 'members', label: 'สมาชิก & แอร์ดรอป', badge: (isManagement.value ? (pendingAirdropCheckins.value.length + pendingLeaveRequests.value.length) : 0) },
  { id: 'rules', label: '📜 กฎแก๊ง PUKPIK' },
  { id: 'profile', label: '👤 โปรไฟล์ & ค่าปรับ' },
  { id: 'treasury', label: 'คลังเงินแก๊ง', badge: isManagement.value ? pendingDeposits.value.length : 0 },
  { id: 'inventory', label: 'คลังของแก๊ง' },
  { id: 'tickets', label: 'คำร้องสมาชิก' }
])

const handleDepositFileSelect = (e) => {
  depositFile.value = e.target.files[0]
}

const handleDepositSubmit = async () => {
  if (!depositFile.value) return alert('กรุณาแนบรูปสลิปโอนเงินด้วยครับ')
  if (!currentUserProfile.value?.id) return alert('ไม่พบข้อมูลผู้ใช้')

  isUploadingDeposit.value = true
  const success = await store.submitDepositSlip(currentUserProfile.value.id, depositForm.value.amount, depositForm.value.category, depositFile.value)
  isUploadingDeposit.value = false

  if (success) {
    alert('ส่งสลิปโอนเงินเรียบร้อยแล้ว! กรุณารอหัวหน้าหรือรองหัวหน้าอนุมัติ')
    depositForm.value.amount = 1000
    depositFile.value = null
  } else {
    alert('เกิดข้อผิดพลาดในการส่งสลิปโอนเงิน')
  }
}

const handleWithdrawSubmit = async () => {
  if (!withdrawForm.value.amount || withdrawForm.value.amount <= 0) return alert('กรุณาระบุจำนวนเงินที่ถูกต้อง')
  if (!withdrawForm.value.reason.trim()) return alert('กรุณาระบุเหตุผลในการเบิกเงิน')
  
  const currentTreasuryBalance = getVal(store.totalBalance) || 0
  if (withdrawForm.value.amount > currentTreasuryBalance) {
    return alert('ยอดเงินในคลังแก๊งมีไม่เพียงพอสำหรับการเบิก')
  }

  isWithdrawing.value = true
  const leaderName = currentUserProfile.value?.character_name || 'หัวหน้าแก๊ง'

  try {
    const { error } = await client.from('treasury_transactions').insert({
      type: 'withdraw',
      amount: withdrawForm.value.amount,
      description: `เบิกเงินคลัง: ${withdrawForm.value.reason}`,
      created_by: leaderName
    })

    if (error) throw error

    alert(`เบิกเงินจำนวน $${withdrawForm.value.amount.toLocaleString()} เรียบร้อยแล้ว!`)
    showWithdrawModal.value = false
    withdrawForm.value = { amount: 1000, reason: '' }

    if (store.fetchAllData) await store.fetchAllData()
  } catch (e) {
    console.error('Withdraw Error:', e)
    alert('เกิดข้อผิดพลาดในการเบิกเงินออกจากคลัง')
  } finally {
    isWithdrawing.value = false
  }
}

const handleApproveDeposit = async (dep, isApproved) => {
  const reviewerName = currentUserProfile.value?.character_name || 'ผู้ดูแล'
  const success = await store.approveDeposit(dep, isApproved, reviewerName)
  if (success) {
    alert(isApproved ? 'อนุมัติเงินเข้าคลังเรียบร้อยแล้ว' : 'ปฏิเสธสลิปโอนเงินเรียบร้อยแล้ว')
  }
}

const openQtyAdjustModal = (item, mode) => {
  selectedQtyItem.value = item
  qtyModalMode.value = mode
  customQtyAmount.value = 1
  showQtyModal.value = true
}

const submitCustomQty = async () => {
  if (!selectedQtyItem.value || customQtyAmount.value <= 0) return
  let newQty = selectedQtyItem.value.quantity

  if (qtyModalMode.value === 'add') {
    newQty += customQtyAmount.value
  } else {
    newQty = Math.max(0, newQty - customQtyAmount.value)
  }

  await store.updateInventoryQty(selectedQtyItem.value.id, newQty)
  showQtyModal.value = false
  alert(`ปรับเปลี่ยนจำนวนไอเทม "${selectedQtyItem.value.item_name}" เรียบร้อยแล้ว`)
}

const openAddRuleModal = () => {
  isEditingSingleRule.value = false
  ruleForm.value = { rule_number: getArray(store.rulesList).length + 1, title: '', content: '' }
  showRuleModal.value = true
}

const openEditRuleModal = (rule) => {
  isEditingSingleRule.value = true
  selectedRuleId.value = rule.id
  ruleForm.value = { rule_number: rule.rule_number, title: rule.title, content: rule.content }
  showRuleModal.value = true
}

const handleSaveSingleRule = async () => {
  if (!ruleForm.value.title || !ruleForm.value.content) return alert('กรุณากรอกหัวข้อและเนื้อหากฎให้ครบถ้วน')

  if (isEditingSingleRule.value) {
    await store.updateRuleItem(selectedRuleId.value, ruleForm.value.title, ruleForm.value.content)
  } else {
    await store.addRuleItem(ruleForm.value.rule_number, ruleForm.value.title, ruleForm.value.content)
  }
  showRuleModal.value = false
  alert('บันทึกกฎแก๊งเรียบร้อยแล้ว!')
}

const handleDeleteRule = async (id) => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกฎข้อนี้?')) {
    await store.deleteRuleItem(id)
    alert('ลบกฎเรียบร้อยแล้ว')
  }
}

const handleLeaveSubmit = async () => {
  if (!leaveReason.value.trim()) return alert('กรุณาระบุสาเหตุการลาหยุดด้วยครับ')
  const userId = currentUserProfile.value?.id
  if (!userId) return alert('ไม่พบข้อมูลผู้ใช้')

  const success = await store.submitLeaveRequest(userId, leaveReason.value.trim())
  if (success) {
    alert('ส่งคำขอลาหยุดเรียบร้อยแล้ว! กรุณารอหัวหน้าหรือรองหัวหน้าอนุมัติ')
    showLeaveModal.value = false
    leaveReason.value = ''
  } else {
    alert('เกิดข้อผิดพลาดในการส่งคำขอลาหยุด')
  }
}

const handleCancelLeave = async () => {
  if (confirm('คุณต้องการยกเลิกสถานะลาหยุดและกลับมาทำกิจกรรมแก๊งตามปกติหรือไม่?')) {
    const success = await store.cancelLeave(currentUserProfile.value?.id)
    if (success) alert('ยกเลิกการลาหยุดเรียบร้อยแล้ว')
  }
}

const handleFileSelect = (event, mode) => {
  const file = event.target.files[0]
  if (mode === 'airdrop') airdropFile.value = file
}

// อัปโหลดหลักฐานแอร์ดรอปไปยังตาราง airdrop_checkins
const handleCheckin = async (mode) => {
  const userId = currentUserProfile.value?.id
  if (!userId) return alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')

  // เช็คเวลาปัจจุบันก่อน หากเกิน 22:15 น. ไม่ให้ส่ง
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  if (hours > 22 || (hours === 23 && minutes >= 15)) {
    return alert('ขณะนี้เกินเวลาเดดไลน์ 22:15 น. แล้ว ไม่สามารถส่งหลักฐานแอร์ดรอปได้')
  }

  if (mode === 'airdrop') {
    if (!airdropFile.value) return alert('กรุณาเลือกรูปหลักฐานแอร์ดรอปก่อนครับ')
    isUploadingAirdrop.value = true
    try {
      const fileName = `airdrop_${userId}_${Date.now()}.png`
      const { data: uploadData, error: uploadErr } = await client.storage.from('checkins').upload(fileName, airdropFile.value)
      if (uploadErr) throw uploadErr

      const publicUrl = client.storage.from('checkins').getPublicUrl(fileName).data.publicUrl
      
      const { error: insertErr } = await client.from('airdrop_checkins').insert({
        user_id: userId,
        image_url: publicUrl,
        status: 'pending'
      })
      if (insertErr) throw insertErr

      alert('ส่งหลักฐานเข้าร่วมแอร์ดรอปเรียบร้อยแล้ว! กรุณารอหัวแก๊งอนุมัติ')
      airdropFile.value = null
      await fetchAirdropCheckins()
    } catch (e) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการอัปโหลดหลักฐานแอร์ดรอป')
    } finally {
      isUploadingAirdrop.value = false
    }
  }
}

// ฟังก์ชันสำหรับยศบริหาร/หัวแก๊ง เพื่อกดอนุมัติ/ปฏิเสธ แอร์ดรอป
const handleApproveAirdrop = async (checkinId, userId, isApproved) => {
  try {
    const status = isApproved ? 'approved' : 'rejected'
    const { error } = await client
      .from('airdrop_checkins')
      .update({ status: status })
      .eq('id', checkinId)

    if (error) throw error

    alert(isApproved ? 'อนุมัติการลงแอร์ดรอปเรียบร้อยแล้ว' : 'ปฏิเสธการลงแอร์ดรอปเรียบร้อยแล้ว')
    await fetchAirdropCheckins()
  } catch (e) {
    console.error('Approve Error:', e)
    alert('เกิดข้อผิดพลาดในการอนุมัติ/ปฏิเสธ')
  }
}

const fetchMyFineLogs = async () => {
  if (!currentUserProfile.value?.id) return
  try {
    const { data } = await client.from('fine_logs').select('*').eq('user_id', currentUserProfile.value.id).order('created_at', { ascending: false })
    if (data) myFineLogs.value = data
  } catch (e) {
    console.error('Error fetching fine logs:', e)
  }
}

const handleItemFileSelect = (event) => {
  itemSelectedFile.value = event.target.files[0]
}

const handleDeleteMember = async (member) => {
  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${member.character_name}" ออกจากแก๊ง?`)) {
    const success = await store.deleteMember(member.id)
    if (success) alert(`ลบสมาชิก "${member.character_name}" เรียบร้อยแล้ว`)
  }
}

const handleAddInventory = async () => {
  if (!canManageInventory.value) return alert('เฉพาะหัวหน้า, รองหัวหน้า และคนเก็บของแก๊งเท่านั้น')
  isUploadingItem.value = true
  const success = await store.addInventoryItem(itemForm.value.name, itemForm.value.category, itemForm.value.quantity, itemSelectedFile.value)
  isUploadingItem.value = false
  if (success) {
    itemForm.value.name = ''
    itemForm.value.quantity = 1
    itemSelectedFile.value = null
    alert('เพิ่มไอเทมเข้าคลังเรียบร้อย!')
  }
}

const handleTicket = async () => {
  const userId = currentUserProfile.value?.id
  if (!userId) return alert('ไม่พบข้อมูลผู้ใช้')
  const success = await store.submitTicket(userId, ticketForm.value.title, ticketForm.value.category, ticketForm.value.detail)
  if (success) {
    ticketForm.value.title = ''
    ticketForm.value.detail = ''
    alert('ส่งคำร้องเรียบร้อยแล้ว!')
  }
}

const getRoleBadge = (role) => {
  if (role === 'leader') return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (role === 'co_leader') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
  if (role === 'inventory_keeper') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  return 'bg-slate-800 text-slate-400 border border-slate-700'
}

const getRoleName = (role) => {
  if (role === 'leader') return 'หัวหน้าแก๊ง'
  if (role === 'co_leader') return 'รองหัวหน้า'
  if (role === 'inventory_keeper') return 'คนเก็บของแก๊ง'
  return 'สมาชิก'
}

const getTicketBadge = (status) => {
  if (status === 'approved') return 'bg-green-500/20 text-green-400'
  if (status === 'rejected') return 'bg-red-500/20 text-red-400'
  return 'bg-amber-500/20 text-amber-400'
}

const getTicketStatusText = (status) => {
  if (status === 'approved') return 'อนุมัติแล้ว'
  if (status === 'rejected') return 'ไม่อนุมัติ'
  return 'รอการตรวจ'
}

const exportCSV = () => {
  const profiles = getArray(store.profiles)
  if (profiles.length === 0) return alert('ไม่มีข้อมูลสมาชิกให้ส่งออก')
  const headers = 'Character Name,Role,Phone,Fine Balance,Leave Status,Airdrop Status\n'
  const rows = profiles.map(p => {
    let airdropText = 'Did Not Check In'
    const status = getAirdropStatus(p)
    if (status === 'approved') airdropText = 'Approved'
    else if (status === 'pending') airdropText = 'Pending Approval'
    else if (status === 'leave') airdropText = 'On Leave'

    return `"${p.character_name}","${p.role}","${p.phone_number || ''}","${p.fine_balance || 0}","${p.leave_status ? 'Leave' : 'Normal'}","${airdropText}"`
  }).join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'airdrop_checkin_report.csv'
  a.click()
}
</script>