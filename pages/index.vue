<template>
  <!-- Container หลักพร้อมพื้นหลังดาร์คโทน -->
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 relative overflow-hidden transition-colors duration-500">
    
    <!-- Background Image Placeholders พร้อม Effect ลอยนุ่มๆ -->
    <div class="fixed top-[-5%] left-[-5%] w-[500px] h-[500px] bg-cover bg-center rounded-3xl pointer-events-none rotate-12 backdrop-blur-xs opacity-25 border border-slate-700/50 animate-pulse transition-transform duration-1000 hover:scale-105" style="background-image: url('/img/image.png'); animation-duration: 8s;"></div>
    <div class="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-cover bg-center rounded-3xl pointer-events-none -rotate-6 backdrop-blur-xs opacity-25 border border-slate-700/50 animate-pulse transition-transform duration-1000 hover:scale-105" style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png'); animation-duration: 10s;"></div>
    <div class="fixed bottom-[-10%] left-[15%] w-[500px] h-[500px] bg-cover bg-center rounded-3xl pointer-events-none rotate-4 backdrop-blur-xs opacity-25 border border-slate-700/50 animate-pulse transition-transform duration-1000 hover:scale-105" style="background-image: url('/img/image1.png'); animation-duration: 12s;"></div>

    <!-- ❄️ Snowfall Canvas Effect -->
    <canvas ref="snowCanvas" class="fixed inset-0 pointer-events-none z-20"></canvas>

   <!-- 🎵 Floating Audio Player Widget -->
    <div class="fixed bottom-5 right-5 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2.5 transition-all duration-300 hover:border-red-500/50 hover:shadow-red-900/30 group w-72 sm:w-80 hover:-translate-y-1">
      <audio 
        ref="audioRef" 
        :src="currentTrack.url" 
        @ended="nextTrack" 
        @timeupdate="onAudioTimeUpdate"
        preload="auto"
      ></audio>
      
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <span v-if="isPlaying" class="w-2 h-2 rounded-full bg-green-400 animate-ping shrink-0"></span>
          <span v-else class="w-2 h-2 rounded-full bg-slate-500 shrink-0"></span>
          <select 
            v-model="currentTrackIndex" 
            @change="changeTrack"
            class="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 truncate w-full cursor-pointer transition-all duration-200"
          >
            <option v-for="(track, index) in playlist" :key="track.id || index" :value="index">
              {{ index + 1 }}. {{ track.title }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            v-if="isManagement" 
            @click="showAddMusicModal = true" 
            class="bg-red-600/80 hover:bg-red-600 hover:scale-105 active:scale-95 text-white text-[10px] px-2 py-1 rounded transition-all duration-200 cursor-pointer font-bold shadow-md hover:shadow-red-600/30"
            title="เพิ่มเพลงเข้าเพลย์ลิสต์"
          >
            ➕ เพิ่ม
          </button>
          <button 
            v-if="isManagement && currentTrack?.id" 
            @click="handleDeleteMusic(currentTrack.id)" 
            class="bg-slate-800 hover:bg-red-600/30 text-red-400 hover:scale-105 active:scale-95 text-[10px] px-1.5 py-1 rounded transition-all duration-200 cursor-pointer border border-slate-700 hover:border-red-500/50"
            title="ลบเพลงนี้"
          >
            🗑️
          </button>
          <span class="text-[10px] text-slate-400 font-medium">{{ Math.round(volume * 100) }}%</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            @click="prevTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-90 text-slate-200 flex items-center justify-center transition-all duration-200 text-xs cursor-pointer"
            title="เพลงก่อนหน้า"
          >
            ⏮️
          </button>

          <button 
            @click="toggleMusic" 
            class="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-90 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-600/30 cursor-pointer hover:shadow-red-500/50"
            :title="isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'"
          >
            <span v-if="isPlaying" class="text-sm">⏸️</span>
            <span v-else class="text-sm animate-pulse">🎵</span>
          </button>

          <button 
            @click="nextTrack" 
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-90 text-slate-200 flex items-center justify-center transition-all duration-200 text-xs cursor-pointer"
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
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all duration-200"
          />
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 shadow-lg shadow-black/20 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center space-x-3 group cursor-default">
          <div 
            class="w-20 h-20 rounded-lg shadow-lg shadow-red-600/40 border border-red-500/50 bg-cover bg-center shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1" 
            style="background-image: url('/img/541F17CF-F73E-4E4C-A209-D750B423A3F1.png');"
          ></div>
          <div>
            <h1 class="text-xl font-bold tracking-wider text-white flex items-center gap-2 group-hover:text-red-400 transition-colors duration-300">
              PUKPIK GANG SYSTEM
            </h1>
            <p class="text-xs text-slate-400">ระบบจัดการแก๊งแบบครบวงจร</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-300 shadow-inner">
            <div class="text-right">
              <p class="text-xs font-bold text-white">{{ currentUserProfile?.character_name || 'ไม่พบข้อมูลผู้ใช้' }}</p>
              <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 justify-end">
                <span :class="getRoleBadge(currentUserRole)" class="px-1.5 py-0.5 rounded font-semibold text-[10px] transition-all">
                  {{ getRoleName(currentUserRole) }}
                </span>
                <span v-if="currentUserProfile?.leave_status" class="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold text-[10px] animate-pulse">
                  🌴 ลาหยุด
                </span>
              </div>
            </div>
          </div>

          <button 
            @click="handleLogout" 
            class="bg-slate-800 hover:bg-red-600/20 active:scale-95 hover:scale-105 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8 relative z-30">
      <!-- Nav Tabs -->
      <div class="flex border-b border-slate-800/80 gap-2 overflow-x-auto scrollbar-none pb-1">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-5 py-3 font-medium text-sm border-b-2 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer rounded-t-lg relative',
            activeTab === tab.id ? 'border-red-500 font-bold text-red-500 bg-red-500/10 shadow-[inset_0_-2px_10px_rgba(239,68,68,0.15)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.badge && tab.badge > 0" class="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full animate-pulse shadow-md shadow-red-600/40">
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <transition name="tab-fade" mode="out-in">
        <!-- Tab 1: รายชื่อสมาชิก & การเช็คชื่อแอร์ดรอป -->
        <div v-if="activeTab === 'members'" key="members" class="space-y-6">
          
          <!-- แจ้งลาหยุดประจำวัน -->
          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl hover:border-slate-700 transition-all duration-300 hover:shadow-2xl">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                🌴 แจ้งลาหยุดประจำวัน
              </h3>
              <p class="text-xs text-slate-400 mt-1">ต้องระบุสาเหตุ และรอการอนุมัติจากหัวหน้า/รองหัวหน้าแก๊งก่อน จึงจะเว้นการโดนปรับแอร์ดรอป (ระบบรีเซ็ตหลัง 03:00 น.)</p>
            </div>
            
            <button 
              v-if="currentUserProfile?.leave_status"
              @click="handleCancelLeave"
              class="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 cursor-pointer shadow-md shadow-amber-600/20 shrink-0"
            >
              ✅ กำลังลาหยุดพัก (กดเพื่อยกเลิกการลา)
            </button>
            
            <button 
              v-else
              @click="showLeaveModal = true"
              class="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer shadow-md shrink-0 hover:border-amber-500/50"
            >
              ✈️ ยื่นเรื่องขอลาหยุดวันนี้
            </button>
          </div>

          <!-- รายการขอลาหยุดรออนุมัติ -->
          <div v-if="isManagement && pendingLeaveRequests.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl animate-fade-in">
            <h2 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              🌴 รายการคำขอลาหยุดรออนุมัติ ({{ pendingLeaveRequests.length }})
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="req in pendingLeaveRequests" :key="req.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-bold text-white">{{ req.profiles?.character_name || 'สมาชิก' }}</p>
                    <p class="text-xs text-slate-400 mt-1">เหตุผล: <span class="text-amber-200">{{ req.reason }}</span></p>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ new Date(req.created_at).toLocaleTimeString() }}</span>
                </div>
                <div class="flex gap-2 pt-2 border-t border-slate-800">
                  <button @click="store.approveLeaveRequest(req.id, req.user_id, true)" class="flex-1 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 text-white text-xs py-1.5 rounded font-medium cursor-pointer transition-all duration-200 shadow-md shadow-green-600/20">อนุมัติลา</button>
                  <button @click="store.approveLeaveRequest(req.id, req.user_id, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs py-1.5 rounded cursor-pointer transition-all duration-200">ปฏิเสธ</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Form เช็คชื่อเข้าแอร์ดรอป (เวลา 20:30 - 21:30 น.) -->
          <div class="max-w-2xl mx-auto bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl hover:border-amber-500/50 hover:shadow-2xl transition-all duration-300">
            <h2 class="text-base font-bold text-amber-400 mb-1 flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              เช็คชื่อเข้าแอร์ดรอป (เปิดระบบ 20:30 - 21:30 น.)
            </h2>
            <p class="text-xs text-slate-400 mb-4">*ถ่ายรูปหลักฐานส่งระหว่างเวลา 20:30 น. ถึง 21:30 น. เพื่อให้หัวแก๊งกดอนุมัติ หากเลยเวลาหรือไม่ได้รับการอนุมัติ จะถูกปรับเงิน 100,000 บาท อัตโนมัติเวลา 03:00 น.*</p>
            
            <div v-if="userPendingAirdrop" class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-center gap-2 animate-pulse">
              <span>⏳</span> ส่งหลักฐานแอร์ดรอปแล้ว กำลังรอหัวแก๊งกดอนุมัติ...
            </div>

            <form @submit.prevent="handleCheckin('airdrop')" class="space-y-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">เลือกรูปภาพหลักฐานเข้าร่วมแอร์ดรอป</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="e => handleFileSelect(e, 'airdrop')" 
                  required 
                  class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer focus:outline-none focus:border-amber-500/50 transition-all duration-200" 
                />
              </div>
              <button 
                type="submit" 
                :disabled="isUploadingAirdrop" 
                class="w-full bg-amber-600 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] disabled:bg-slate-700 text-white font-medium py-2.5 rounded-lg text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-amber-600/20 font-bold flex items-center justify-center gap-2"
              >
                <span v-if="isUploadingAirdrop" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isUploadingAirdrop ? 'กำลังประมวลผลข้อมูล...' : 'ส่งหลักฐานแอร์ดรอปให้หัวแก๊งอนุมัติ' }}</span>
              </button>
            </form>
          </div>

          <!-- รายการอนุมัติแอร์ดรอปรอตรวจสอบ -->
          <div v-if="isManagement && pendingAirdropCheckins.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl animate-fade-in">
            <h2 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              ⏳ รายการเช็คชื่อแอร์ดรอปรออนุมัติ ({{ pendingAirdropCheckins.length }})
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="item in pendingAirdropCheckins" :key="item.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-bold text-white">{{ item.profiles?.character_name || 'สมาชิก' }}</p>
                    <p class="text-xs text-amber-400">เช็คชื่อแอร์ดรอป</p>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ new Date(item.created_at).toLocaleTimeString() }}</span>
                </div>
                <a :href="item.image_url" target="_blank" class="block group/img overflow-hidden rounded-md">
                  <img :src="item.image_url" class="w-full h-36 object-cover rounded-md border border-slate-800 group-hover/img:scale-105 transition-transform duration-300" />
                </a>
                <div class="flex gap-2 pt-2 border-t border-slate-800">
                  <button @click="handleApproveAirdrop(item.id, item.user_id, true)" class="flex-1 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 text-white text-xs py-1.5 rounded font-medium cursor-pointer transition-all duration-200 shadow-md shadow-green-600/20">อนุมัติ</button>
                  <button @click="handleApproveAirdrop(item.id, item.user_id, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs py-1.5 rounded cursor-pointer transition-all duration-200">ปฏิเสธ</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ตารางรายชื่อสมาชิก & สถานะลงแอร์ดรอป -->
          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:border-slate-700 transition-all duration-300">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 class="font-bold text-white">รายชื่อสมาชิกและสถานะการลงแอร์ดรอปประจำวัน</h2>
              <button v-if="isManagement" @click="exportCSV" class="text-xs bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-all duration-200">
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
                  <tr v-for="member in getArray(store.profiles)" :key="member.id" class="hover:bg-slate-800/50 transition-colors duration-200">
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
                    
                    <td class="p-4">
                      <span 
                        v-if="getAirdropStatus(member) === 'approved'"
                        class="bg-green-500/10 text-green-400 border-green-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold shadow-sm"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        ลงแอร์ดรอปแล้ว
                      </span>
                      <span 
                        v-else-if="getAirdropStatus(member) === 'leave'"
                        class="bg-blue-500/10 text-blue-400 border-blue-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold shadow-sm"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        ลาหยุด
                      </span>
                      <span 
                        v-else-if="getAirdropStatus(member) === 'pending'"
                        class="bg-amber-500/10 text-amber-400 border-amber-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold shadow-sm"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        รอหัวแก๊งอนุมัติ
                      </span>
                      <span 
                        v-else
                        class="bg-red-500/10 text-red-400 border-red-500/30 px-2.5 py-1 rounded-full text-xs border flex items-center w-fit gap-1.5 font-bold shadow-sm"
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
                          class="bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded text-xs border border-slate-700 flex items-center gap-1 transition-all duration-200"
                        >
                          📷 รูปหลักฐาน
                        </a>
                      </div>
                      <span v-else class="text-xs text-slate-600 italic">ไม่มีหลักฐาน</span>
                    </td>
                    <td v-if="isManagement" class="p-4 text-center">
                      <button 
                        @click="handleDeleteMember(member)" 
                        class="bg-red-500/10 hover:bg-red-500/20 hover:scale-105 active:scale-95 text-red-400 border border-red-500/30 text-xs px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer"
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
        <div v-else-if="activeTab === 'rules'" key="rules" class="space-y-6">
          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition-all duration-300">
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
                class="bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-lg shadow-red-600/20 cursor-pointer"
              >
                ➕ เพิ่มกฎข้อใหม่
              </button>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div 
                v-for="rule in getArray(store.rulesList)" 
                :key="rule.id" 
                class="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 hover:border-red-500/40 hover:bg-slate-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:shadow-lg hover:shadow-red-950/20"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="bg-red-600/20 text-red-400 border border-red-500/30 font-bold px-2.5 py-0.5 rounded text-xs font-mono group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                      กฎข้อที่ {{ rule.rule_number }}
                    </span>
                    <h3 class="font-bold text-white text-base group-hover:text-red-400 transition-colors">{{ rule.title }}</h3>
                  </div>
                  <p class="text-sm text-slate-300 leading-relaxed pl-1 pt-1">{{ rule.content }}</p>
                </div>

                <div v-if="isManagement" class="flex items-center gap-2 shrink-0">
                  <button @click="openEditRuleModal(rule)" class="bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-700 cursor-pointer transition-all duration-200">✏️ แก้ไข</button>
                  <button @click="handleDeleteRule(rule.id)" class="bg-red-500/10 hover:bg-red-500/20 hover:scale-105 active:scale-95 text-red-400 text-xs px-3 py-1.5 rounded border border-red-500/30 cursor-pointer transition-all duration-200">🗑️ ลบ</button>
                </div>
              </div>

              <div v-if="getArray(store.rulesList).length === 0" class="p-8 text-center text-slate-500 text-sm">
                ยังไม่มีการกำหนดกฎแก๊งในขณะนี้
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: โปรไฟล์ & ค่าปรับ -->
        <div v-else-if="activeTab === 'profile'" key="profile" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center text-center hover:border-slate-700 transition duration-300 hover:shadow-2xl">
              <div class="w-24 h-24 rounded-full bg-slate-800 border-2 border-red-500/50 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-500/10 animate-bounce hover:scale-110 transition-transform duration-300 cursor-pointer" style="animation-duration: 3s;">
                👤
              </div>
              <h2 class="text-xl font-bold text-white">{{ currentUserProfile?.character_name }}</h2>
              <p class="text-xs text-slate-400 mt-1">Password: <span class="text-slate-300">{{ currentUserProfile?.username || '-' }}</span></p>
              <p class="text-xs text-slate-400 mt-0.5">ตำแหน่ง: {{ getRoleName(currentUserRole) }}</p>
              <p class="text-xs text-slate-400">เบอร์โทร: {{ currentUserProfile?.phone_number || '-' }}</p>

              <button 
                @click="openEditProfileModal" 
                class="mt-4 w-full bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-red-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-xs py-2 rounded-lg transition-all duration-200 font-medium cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                ✏️ แก้ไขข้อมูลโปรไฟล์
              </button>
            </div>

            <div class="md:col-span-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition duration-300 hover:shadow-2xl">
              <div>
                <p class="text-xs text-slate-400 mb-1">ยอดเงินโดนปรับ/ค้างชำระทั้งหมด (Fine Balance)</p>
                <p class="text-4xl font-black font-mono tracking-tight transition-transform duration-300 hover:scale-105 origin-left" :class="(currentUserProfile?.fine_balance || 0) > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]'">
                  ${{ (currentUserProfile?.fine_balance || 0).toLocaleString() }}
                </p>
              </div>
              <div class="mt-4 p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400 hover:border-slate-700 transition duration-200">
                ℹ️ หากต้องการชำระค่าปรับ สามารถแนบสลิปส่งเงินได้ที่เมนู <b>"คลังเงินแก๊ง"</b> เพื่อให้ยศบริหารตัดยอดหนี้ให้ครับ
              </div>
            </div>
          </div>

          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:border-slate-700 transition-all duration-300">
            <div class="p-4 border-b border-slate-800 font-bold text-white bg-slate-900/50">ประวัติค่าปรับและการชำระเงินส่วนตัว</div>
            <div class="divide-y divide-slate-800/80">
              <div v-for="log in myFineLogs" :key="log.id" class="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors duration-200">
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
        <div v-else-if="activeTab === 'treasury'" key="treasury" class="space-y-6">
          <div class="bg-gradient-to-r from-slate-900/90 via-slate-900/90 to-red-950/80 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur hover:border-slate-700 transition-all duration-300 hover:shadow-2xl">
            <div>
              <p class="text-xs text-slate-400 mb-1">ยอดเงินคงเหลือในคลังแก๊ง</p>
              <p class="text-4xl font-black text-green-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(74,222,128,0.25)] hover:scale-105 transition-transform duration-300 origin-left">${{ (getVal(store.totalBalance) || 0).toLocaleString() }}</p>
            </div>

            <button 
              v-if="isManagement"
              @click="showWithdrawModal = true"
              class="bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer border border-red-500/50 shrink-0"
            >
              💸 เบิกเงินออกจากคลังแก๊ง
            </button>
          </div>

          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition duration-300">
            <h2 class="text-lg font-bold text-white mb-1">💳 นำส่งสลิปเงินเข้าคลังแก๊ง</h2>
            <p class="text-xs text-slate-400 mb-4">สมาชิกสามารถแนบสลิปเพื่อขอฝากเงิน, โดเนท หรือชำระค่าปรับได้ทันที</p>
            
            <form @submit.prevent="handleDepositSubmit" class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">จำนวนเงิน ($)</label>
                <input v-model.number="depositForm.amount" type="number" min="1" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
              </div>

              <div>
                <label class="block text-xs text-slate-400 mb-1">หมวดหมู่รายการ</label>
                <select v-model="depositForm.category" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200">
                  <option value="ส่งเงินแก๊ง">ส่งเงินแก๊ง</option>
                  <option value="โดเนทให้แก๊ง">โดเนทให้แก๊ง</option>
                  <option value="จ่ายค่าปรับแอร์ดรอป">จ่ายค่าปรับแอร์ดรอป</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-slate-400 mb-1">แนบรูปสลิปโอนเงิน</label>
                <input type="file" accept="image/*" @change="handleDepositFileSelect" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded cursor-pointer focus:outline-none focus:border-red-500 transition-all duration-200" />
              </div>

              <div class="flex items-end">
                <button type="submit" :disabled="isUploadingDeposit" class="w-full bg-green-600 hover:bg-green-700 hover:scale-[1.02] active:scale-95 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-green-600/20 font-bold flex items-center justify-center gap-2">
                  <span v-if="isUploadingDeposit" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ isUploadingDeposit ? 'กำลังประมวลผล...' : 'ส่งสลิปโอนเงิน' }}</span>
                </button>
              </div>
            </form>
          </div>

          <div v-if="isManagement && pendingDeposits.length > 0" class="bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-xl p-6 shadow-xl animate-fade-in">
            <h2 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              💳 รายการสลิปส่งเงินรออนุมัติ ({{ pendingDeposits.length }})
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="dep in pendingDeposits" :key="dep.id" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-bold text-white">{{ dep.profiles?.character_name || 'สมาชิก' }}</p>
                    <p class="text-xs text-amber-400 font-semibold">{{ dep.category }}</p>
                    <p class="text-lg font-mono font-bold text-green-400 mt-1">${{ Number(dep.amount).toLocaleString() }}</p>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ new Date(dep.created_at).toLocaleTimeString() }}</span>
                </div>
                <a :href="dep.slip_url" target="_blank" class="block group/slip overflow-hidden rounded-md">
                  <img :src="dep.slip_url" class="w-full h-36 object-cover rounded-md border border-slate-800 group-hover/slip:scale-105 transition-transform duration-300" />
                </a>
                <div class="flex gap-2 pt-2 border-t border-slate-800">
                  <button @click="handleApproveDeposit(dep, true)" class="flex-1 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 text-white text-xs py-1.5 rounded font-medium cursor-pointer transition-all duration-200 shadow-md shadow-green-600/20">อนุมัติเงินเข้าคลัง</button>
                  <button @click="handleApproveDeposit(dep, false)" class="flex-1 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs py-1.5 rounded cursor-pointer transition-all duration-200">ปฏิเสธ</button>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:border-slate-700 transition-all duration-300">
            <div class="p-4 border-b border-slate-800 font-bold text-white bg-slate-900/50">ประวัติการธุรกรรม</div>
            <div class="divide-y divide-slate-800/80">
              <div v-for="log in getArray(store.treasuryLogs)" :key="log.id" class="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors duration-200">
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
        <div v-else-if="activeTab === 'inventory'" key="inventory" class="space-y-6">
          <div v-if="canManageInventory" class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition duration-300">
            <h2 class="text-lg font-bold text-white mb-4">เพิ่มไอเทมใหม่เข้าคลังแก๊ง</h2>
            <form @submit.prevent="handleAddInventory" class="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">ชื่อไอเทม</label>
                <input v-model="itemForm.name" type="text" placeholder="เช่น AED PainKiller, เกราะ" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">หมวดหมู่</label>
                <input v-model="itemForm.category" type="text" placeholder="เช่น ยา, ทั่วไป" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">จำนวนเริ่มต้น</label>
                <input v-model.number="itemForm.quantity" type="number" min="1" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">รูปไอเทม (ถ้ามี)</label>
                <input type="file" accept="image/*" @change="handleItemFileSelect" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-slate-200 cursor-pointer focus:outline-none focus:border-red-500 transition-all duration-200" />
              </div>
              <div class="flex items-end">
                <button type="submit" :disabled="isUploadingItem" class="w-full bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-red-600/20 font-bold flex items-center justify-center gap-2">
                  <span v-if="isUploadingItem" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ isUploadingItem ? 'กำลังประมวลผล...' : 'เพิ่มเข้าคลัง' }}</span>
                </button>
              </div>
            </form>
          </div>

          <div v-else class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between hover:border-slate-700 transition duration-300">
            <div class="flex items-center gap-3">
              <span class="text-2xl animate-bounce">📦</span>
              <div>
                <h3 class="font-bold text-white text-sm">คลังไอเทมแก๊ง</h3>
                <p class="text-xs text-slate-400">คุณสามารถตรวจสอบจำนวนไอเทมในคลังได้ (หากต้องการขอเบิกของ กรุณายื่นคำร้องหรือติดต่อคนเก็บของแก๊ง)</p>
              </div>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div 
              v-for="item in getArray(store.inventory)" 
              :key="item.id" 
              class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-red-500/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/40 transition-all duration-300 group"
            >
              <div class="relative h-40 bg-slate-950 flex items-center justify-center border-b border-slate-800/80 overflow-hidden">
                <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div v-else class="text-4xl text-slate-700 select-none group-hover:scale-125 transition-transform duration-300">📦</div>
                <span class="absolute top-2 left-2 text-[10px] bg-slate-900/90 backdrop-blur text-slate-300 px-2 py-0.5 rounded border border-slate-700/80 uppercase font-bold shadow-md">
                  {{ item.category }}
                </span>
              </div>

              <div class="p-4 space-y-3">
                <div>
                  <h3 class="font-bold text-base text-white truncate group-hover:text-red-400 transition-colors duration-300">{{ item.item_name }}</h3>
                  <p class="text-2xl font-mono font-black text-red-500 my-1 drop-shadow-sm group-hover:scale-105 transition-transform origin-left">
                    {{ Number(item.quantity).toLocaleString() }} <span class="text-xs text-slate-500 font-normal">ชิ้น</span>
                  </p>
                </div>

                <div v-if="canManageInventory" class="pt-3 border-t border-slate-800/80 space-y-2">
                  <div class="flex gap-1.5">
                    <button @click="openQtyAdjustModal(item, 'add')" class="flex-1 bg-green-600/20 hover:bg-green-600/30 hover:scale-105 active:scale-95 text-green-400 border border-green-500/30 text-xs py-1 rounded font-bold cursor-pointer transition-all duration-200 shadow-sm">
                      + เพิ่มของ
                    </button>
                    <button @click="openQtyAdjustModal(item, 'sub')" class="flex-1 bg-red-600/20 hover:bg-red-600/30 hover:scale-105 active:scale-95 text-red-400 border border-red-500/30 text-xs py-1 rounded font-bold cursor-pointer transition-all duration-200 shadow-sm">
                      - เบิกออก
                    </button>
                  </div>
                  <button @click="store.deleteInventoryItem(item.id)" class="w-full text-center text-xs text-slate-500 hover:text-red-400 hover:underline cursor-pointer py-0.5 transition-colors duration-200">
                    ลบรายการนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 6: คำร้องสมาชิก -->
        <div v-else-if="activeTab === 'tickets'" key="tickets" class="space-y-6">
          <div v-if="!isManagement" class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition duration-300">
            <h2 class="text-lg font-bold text-white mb-4">ยื่นคำร้องใหม่ถึงหัวหน้าแก๊ง</h2>
            <form @submit.prevent="handleTicket" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1">หัวข้อคำร้อง</label>
                  <input v-model="ticketForm.title" type="text" placeholder="เช่น ขอเบิกเงินตีอาวุธ" required class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1">หมวดหมู่</label>
                  <select v-model="ticketForm.category" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200">
                    <option value="เบิกของ/เงิน">เบิกของ / เบิกเงิน</option>
                    <option value="เรื่องอื่นๆ">เรื่องอื่นๆ</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">รายละเอียด</label>
                <textarea v-model="ticketForm.detail" rows="3" required class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"></textarea>
              </div>
              <button type="submit" class="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-95 text-white font-medium px-6 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-red-600/20 font-bold">
                ส่งคำร้อง
              </button>
            </form>
          </div>

          <div v-else class="bg-slate-900/90 backdrop-blur border border-red-500/30 rounded-xl p-4 shadow-xl flex items-center gap-3 hover:border-red-500/50 transition duration-300">
            <span class="text-2xl animate-pulse">📋</span>
            <div>
              <h3 class="font-bold text-white text-sm">การจัดการคำร้องของสมาชิก (สำหรับหัวหน้า/รอง)</h3>
              <p class="text-xs text-slate-400">คุณอยู่ในสถานะผู้ตรวจสอบ กรุณาพิจารณาและอนุมัติคำร้องจากรายการด้านล่างนี้</p>
            </div>
          </div>

          <div class="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl hover:border-slate-700 transition-all duration-300">
            <div class="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center bg-slate-900/50">
              <span>รายการคำร้องทั้งหมด</span>
              <span v-if="isManagement" class="text-xs font-normal text-amber-400">
                รออนุมัติ: {{ getArray(store.tickets).filter(t => t.status === 'pending').length }} รายการ
              </span>
            </div>
            <div class="divide-y divide-slate-800/80">
              <div v-for="ticket in getArray(store.tickets)" :key="ticket.id" class="p-5 space-y-2 hover:bg-slate-800/30 transition-all duration-200">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 mr-2">{{ ticket.category }}</span>
                    <h3 class="font-bold text-white inline-block">{{ ticket.title }}</h3>
                    <p class="text-xs text-slate-500 mt-1">ผู้ยื่น: {{ ticket.profiles?.character_name || 'สมาชิก' }} • {{ new Date(ticket.created_at).toLocaleString() }}</p>
                  </div>
                  <span :class="getTicketBadge(ticket.status)" class="px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                    {{ getTicketStatusText(ticket.status) }}
                  </span>
                </div>
                <p class="text-sm text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/50">{{ ticket.detail }}</p>
                
                <div v-if="isManagement" class="flex gap-2 pt-2">
                  <button @click="store.updateTicketStatus(ticket.id, 'approved')" class="bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 text-white text-xs px-4 py-1.5 rounded font-medium cursor-pointer transition-all duration-200 shadow-md shadow-green-600/20">อนุมัติคำร้อง</button>
                  <button @click="store.updateTicketStatus(ticket.id, 'rejected')" class="bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs px-4 py-1.5 rounded cursor-pointer transition-all duration-200">ไม่อนุมัติ</button>
                </div>
              </div>
              <div v-if="getArray(store.tickets).length === 0" class="p-8 text-center text-slate-500 text-sm">
                ไม่มีคำร้องในขณะนี้
              </div>
            </div>
          </div>
        </div>
      </transition>
    </main>

    <!-- 🚨 Custom Notification & Confirmation Modal -->
    <transition name="modal-pop">
      <div v-if="alertModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div class="bg-slate-900 border border-slate-700/80 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden transform transition-all">
          <div class="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl shadow-inner animate-bounce" :class="alertModal.isConfirm ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-red-500/20 border border-red-500/40 text-red-400'">
            {{ alertModal.icon }}
          </div>
          
          <div class="space-y-1">
            <h3 class="text-base font-bold text-white">{{ alertModal.title }}</h3>
            <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{{ alertModal.message }}</p>
          </div>

          <div class="flex gap-2 justify-center pt-2">
            <button 
              v-if="alertModal.isConfirm" 
              @click="closeAlert(false)" 
              class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-xl font-medium transition-all duration-200 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button 
              @click="closeAlert(true)" 
              class="flex-1 py-2 bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white text-xs rounded-xl font-bold shadow-lg shadow-red-600/30 transition-all duration-200 cursor-pointer"
            >
              {{ alertModal.isConfirm ? 'ยืนยัน' : 'ตกลง' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modals -->
    <transition name="modal-pop">
      <div v-if="showLeaveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">🌴 ยื่นเรื่องขอลาหยุด</h3>
          <p class="text-xs text-slate-400">กรุณาระบุสาเหตุการลา คำขอจะส่งไปยังหัวหน้า/รองหัวหน้าแก๊งเพื่อพิจารณาอนุมัติ</p>
          <div>
            <label class="block text-xs text-slate-300 mb-1">สาเหตุการลา</label>
            <textarea v-model="leaveReason" rows="3" placeholder="เช่น ติดภารกิจต่างจังหวัด, ไม่สบาย" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"></textarea>
          </div>
          <div class="flex gap-2 justify-end pt-2">
            <button @click="showLeaveModal = false" :disabled="isSubmittingLeave" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 disabled:opacity-50 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="handleLeaveSubmit" :disabled="isSubmittingLeave" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 hover:scale-105 active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-amber-600/20 transition-all duration-200 flex items-center gap-1.5">
              <span v-if="isSubmittingLeave" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSubmittingLeave ? 'กำลังประมวลผล...' : 'ยื่นคำขอลา' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-pop">
      <div v-if="showQtyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white">
            {{ qtyModalMode === 'add' ? '➕ เพิ่มจำนวนไอเทม' : '➖ เบิกออก/ลดจำนวนไอเทม' }}
          </h3>
          <p class="text-xs text-slate-400">ไอเทม: <span class="text-white font-bold">{{ selectedQtyItem?.item_name }}</span> (คงเหลือ {{ selectedQtyItem?.quantity }} ชิ้น)</p>
          
          <div>
            <label class="block text-xs text-slate-300 mb-1">กรอกจำนวนที่ต้องการ {{ qtyModalMode === 'add' ? 'เพิ่ม' : 'ลด' }}</label>
            <input v-model.number="customQtyAmount" type="number" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button @click="showQtyModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="submitCustomQty" class="px-4 py-2 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20 transition-all duration-200">ยืนยัน</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-pop">
      <div v-if="showRuleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white">{{ isEditingSingleRule ? '✏️ แก้ไขกฎแก๊ง' : '➕ เพิ่มกฎแก๊งข้อใหม่' }}</h3>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-300 mb-1">ลำดับข้อ (เช่น 1, 2, 3)</label>
              <input v-model.number="ruleForm.rule_number" type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">หัวข้อกฎ</label>
              <input v-model="ruleForm.title" type="text" placeholder="เช่น การเข้าร่วมกิจกรรมสภา" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">รายละเอียดกฎระเบียบ</label>
              <textarea v-model="ruleForm.content" rows="4" placeholder="พิมพ์เนื้อหากฎระเบียบอย่างละเอียดที่นี่..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"></textarea>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button @click="showRuleModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="handleSaveSingleRule" class="px-4 py-2 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20 transition-all duration-200">บันทึกกฎ</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-pop">
      <div v-if="showWithdrawModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">💸 เบิกเงินออกจากคลังแก๊ง</h3>
          <p class="text-xs text-slate-400">สำหรับหัวหน้า/รองหัวหน้าแก๊ง เบิกเงินคลังไปใช้ในภารกิจแก๊ง</p>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-300 mb-1">จำนวนเงิน ($)</label>
              <input v-model.number="withdrawForm.amount" type="number" min="1" placeholder="ระบุจำนวนเงิน" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">เหตุผลในการเบิกเงิน</label>
              <textarea v-model="withdrawForm.reason" rows="3" placeholder="เช่น ซื้ออาวุธสงคราม, ซื้อยา, จัดกิจกรรม" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"></textarea>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button @click="showWithdrawModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="handleWithdrawSubmit" :disabled="isWithdrawing" class="px-4 py-2 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 disabled:bg-slate-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20 transition-all duration-200 flex items-center gap-1.5">
              <span v-if="isWithdrawing" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isWithdrawing ? 'กำลังประมวลผล...' : 'ยืนยันการเบิกเงิน' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-pop">
      <div v-if="showEditProfileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">✏️ แก้ไขข้อมูลโปรไฟล์</h3>
          <p class="text-xs text-slate-400">แก้ไขชื่อในเมือง ชื่อผู้ใช้ หรือเบอร์โทรศัพท์ของคุณ</p>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-300 mb-1">รหัสผ่าน (Password)</label>
              <input v-model="profileForm.username" type="text" placeholder="ระบุ Password" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">ชื่อในเมือง (Character Name)</label>
              <input v-model="profileForm.character_name" type="text" placeholder="ระบุ ชื่อในเมือง" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">เบอร์โทรศัพท์</label>
              <input v-model="profileForm.phone_number" type="text" placeholder="ระบุ เบอร์โทร" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button @click="showEditProfileModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="handleUpdateProfile" :disabled="isUpdatingProfile" class="px-4 py-2 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 disabled:bg-slate-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20 transition-all duration-200 flex items-center gap-1.5">
              <span v-if="isUpdatingProfile" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isUpdatingProfile ? 'กำลังประมวลผล...' : 'บันทึกการเปลี่ยนแปลง' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-pop">
      <div v-if="showAddMusicModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">🎵 อัปโหลดเพลงเข้าเพลย์ลิสต์</h3>
          <p class="text-xs text-slate-400">ใส่ชื่อเพลง และเลือกไฟล์เพลง (.mp3, .wav, .m4a) จากในเครื่องของคุณ</p>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-300 mb-1">ชื่อเพลง</label>
              <input v-model="musicForm.title" type="text" placeholder="ระบุชื่อเพลง..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200" />
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">เลือกไฟล์เพลงจากในเครื่อง (.mp3, .wav, .m4a, .ogg)</label>
              <input 
                type="file" 
                accept="audio/*" 
                @change="handleMusicFileSelect" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer focus:outline-none focus:border-red-500 transition-all duration-200" 
              />
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button @click="showAddMusicModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-slate-300 text-xs rounded-lg cursor-pointer transition-all duration-200">ยกเลิก</button>
            <button @click="handleAddMusicSubmit" :disabled="isSavingMusic" class="px-4 py-2 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 disabled:bg-slate-700 text-white text-xs rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20 transition-all duration-200 flex items-center gap-1.5">
              <span v-if="isSavingMusic" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSavingMusic ? 'กำลังประมวลผล...' : 'อัปโหลดเพลง' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, unref, nextTick } from 'vue'

const store = useGangStore()
const client = useSupabaseClient()
const router = useRouter()

const getVal = (target) => unref(target)
const getArray = (target) => unref(target) || []

// 🚨 Centralized Alert & Confirmation Modal Engine
const alertModal = ref({
  show: false,
  title: 'แจ้งเตือน',
  message: '',
  icon: '🔔',
  isConfirm: false,
  resolve: null
})

const showAlertMessage = (message, title = 'แจ้งเตือน', icon = '🔔') => {
  return new Promise((resolve) => {
    alertModal.value = {
      show: true,
      title,
      message,
      icon,
      isConfirm: false,
      resolve
    }
  })
}

const showConfirmDialog = (message, title = 'ยืนยันการทำรายการ', icon = '⚠️') => {
  return new Promise((resolve) => {
    alertModal.value = {
      show: true,
      title,
      message,
      icon,
      isConfirm: true,
      resolve
    }
  })
}

const closeAlert = (result = true) => {
  if (alertModal.value.resolve) {
    alertModal.value.resolve(result)
  }
  alertModal.value.show = false
}

// Audio & Playlist State
const audioRef = ref(null)
const isPlaying = ref(false)
const volume = ref(0.3)
const currentTrackIndex = ref(0)
const playlist = ref([])

// Music Modal State
const showAddMusicModal = ref(false)
const isSavingMusic = ref(false)
const musicFile = ref(null)
const musicForm = ref({ title: '' })

// 🔄 บันทึกเวลาเพลงแบบ Realtime ลง localStorage เพื่อการเล่นต่อเนื่อง
const onAudioTimeUpdate = () => {
  if (audioRef.value && process.client && isPlaying.value) {
    localStorage.setItem('audio_time', audioRef.value.currentTime.toString())
  }
}

const handleMusicFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    musicFile.value = file
    if (!musicForm.value.title.trim()) {
      musicForm.value.title = file.name.replace(/\.[^/.]+$/, "")
    }
  }
}

const fetchPlaylist = async () => {
  try {
    const { data, error } = await client
      .from('playlist')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) {
      playlist.value = data
    } else {
      playlist.value = []
    }
  } catch (e) {
    console.error('Error fetching playlist:', e)
  }
}

const handleAddMusicSubmit = async () => {
  if (!musicForm.value.title.trim()) return showAlertMessage('กรุณากรอกชื่อเพลง', 'คำเตือน', '⚠️')
  if (!musicFile.value) return showAlertMessage('กรุณาเลือกไฟล์เพลงจากในเครื่องก่อนครับ', 'คำเตือน', '⚠️')

  isSavingMusic.value = true
  try {
    const fileExt = musicFile.value.name.split('.').pop()
    const fileName = `music_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`

    const { data: uploadData, error: uploadErr } = await client
      .storage
      .from('music')
      .upload(fileName, musicFile.value, { cacheControl: '3600', upsert: false })

    if (uploadErr) throw uploadErr

    const { data: urlData } = client.storage.from('music').getPublicUrl(fileName)

    const { error: insertErr } = await client.from('playlist').insert({
      title: musicForm.value.title.trim(),
      url: urlData.publicUrl
    })

    if (insertErr) throw insertErr

    await showAlertMessage('อัปโหลดเพลงใหม่เข้าเพลย์ลิสต์เรียบร้อยแล้ว!', 'สำเร็จ', '🎵')
    showAddMusicModal.value = false
    musicForm.value = { title: '' }
    musicFile.value = null
    await fetchPlaylist()
  } catch (e) {
    console.error('Add music error:', e)
    await showAlertMessage(e.message || 'เกิดข้อผิดพลาดในการอัปโหลดเพลง', 'เกิดข้อผิดพลาด', '❌')
  } finally {
    isSavingMusic.value = false
  }
}

const handleDeleteMusic = async (trackId) => {
  const isConfirmed = await showConfirmDialog('คุณแน่ใจหรือไม่ว่าต้องการลบเพลงนี้ออกจากเพลย์ลิสต์?', 'ยืนยันการลบเพลง', '🗑️')
  if (isConfirmed) {
    try {
      const { error } = await client.from('playlist').delete().eq('id', trackId)
      if (error) throw error

      await showAlertMessage('ลบเพลงเรียบร้อยแล้ว', 'สำเร็จ', '✅')
      currentTrackIndex.value = 0
      await fetchPlaylist()
    } catch (e) {
      console.error('Delete music error:', e)
      await showAlertMessage('เกิดข้อผิดพลาดในการลบเพลง', 'เกิดข้อผิดพลาด', '❌')
    }
  }
}

const currentTrack = computed(() => playlist.value[currentTrackIndex.value] || playlist.value[0] || { title: 'ไม่มีเพลง', url: '' })

const toggleMusic = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
    if (process.client) localStorage.setItem('audio_playing', 'false')
  } else {
    playCurrentTrack()
  }
}

const playCurrentTrack = (startTime = 0) => {
  if (!audioRef.value || !currentTrack.value.url) return
  audioRef.value.volume = volume.value

  if (startTime > 0) {
    audioRef.value.currentTime = startTime
  }

  audioRef.value.play().then(() => {
    isPlaying.value = true
    if (process.client) {
      localStorage.setItem('audio_playing', 'true')
      localStorage.setItem('audio_track_index', currentTrackIndex.value.toString())
    }
  }).catch(e => {
    console.log('Autoplay prevented:', e)
    isPlaying.value = false
  })
}

const changeTrack = async () => {
  if (process.client) {
    localStorage.setItem('audio_track_index', currentTrackIndex.value.toString())
    localStorage.setItem('audio_time', '0')
  }
  
  await nextTick()
  if (audioRef.value) {
    audioRef.value.currentTime = 0
    audioRef.value.play().then(() => {
      isPlaying.value = true
      if (process.client) localStorage.setItem('audio_playing', 'true')
    }).catch(e => {
      console.log('Autoplay blocked:', e)
      isPlaying.value = false
    })
  }
}

const nextTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  changeTrack()
}

const prevTrack = () => {
  if (playlist.value.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  changeTrack()
}

const updateVolume = () => {
  if (audioRef.value) audioRef.value.volume = volume.value
}

// ❄️ Snowfall Engine
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
const isSubmittingLeave = ref(false)

// State สลิปส่งเงินเข้าคลัง
const depositFile = ref(null)
const isUploadingDeposit = ref(false)
const depositForm = ref({ amount: 1000, category: 'ส่งเงินแก๊ง' })

// State การเบิกเงินคลัง
const showWithdrawModal = ref(false)
const isWithdrawing = ref(false)
const withdrawForm = ref({ amount: 1000, reason: '' })

// State แก้ไขโปรไฟล์
const showEditProfileModal = ref(false)
const isUpdatingProfile = ref(false)
const profileForm = ref({ username: '', character_name: '', phone_number: '' })

// State ปรับจำนวนไอเทม
const showQtyModal = ref(false)
const selectedQtyItem = ref(null)
const qtyModalMode = ref('add')
const customQtyAmount = ref(1)

// State กฎแก๊ง
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

// เช็คสถานะแอร์ดรอปสมาชิก
const getAirdropStatus = (member) => {
  if (member.leave_status) return 'leave'

  const userCheckin = airdropCheckinsList.value.find(item => item.user_id === member.id)

  if (!userCheckin) return 'not_checked'
  if (userCheckin.status === 'approved') return 'approved'
  if (userCheckin.status === 'pending') return 'pending'
  return 'not_checked'
}

const getLatestAirdropImage = (userId) => {
  const checkin = airdropCheckinsList.value.find(item => item.user_id === userId)
  return checkin ? checkin.image_url : null
}

const pendingAirdropCheckins = computed(() => {
  return airdropCheckinsList.value.filter(item => item.status === 'pending')
})

const userPendingAirdrop = computed(() => {
  if (!currentUserProfile.value?.id) return false
  return airdropCheckinsList.value.some(item => item.user_id === currentUserProfile.value.id && item.status === 'pending')
})

onMounted(async () => {
  initSnowfall()

  if (process.client) {
    const savedSession = localStorage.getItem('gang_user_session')
    if (!savedSession) {
      router.push('/login')
      return
    }
    try {
      loggedUser.value = JSON.parse(savedSession)
    } catch (e) {
      console.error('Failed to parse session:', e)
    }
  }

  if (store.fetchAllData) await store.fetchAllData()
  if (store.fetchPendingDeposits) await store.fetchPendingDeposits()
  if (store.fetchRulesList) await store.fetchRulesList()

  await fetchPlaylist()
  await fetchAirdropCheckins()
  await fetchMyFineLogs()

  // 🎵 ดึงสถานะเพลงจากหน้า Login เพื่อเล่นต่อ
  if (process.client) {
    const savedTrackIndex = parseInt(localStorage.getItem('audio_track_index') || '0', 10)
    const savedTime = parseFloat(localStorage.getItem('audio_time') || '0')
    const savedIsPlaying = localStorage.getItem('audio_playing') === 'true'

    if (playlist.value.length > 0 && savedTrackIndex < playlist.value.length) {
      currentTrackIndex.value = savedTrackIndex
    }

    await nextTick()

    if (audioRef.value && savedIsPlaying) {
      audioRef.value.volume = volume.value
      
      audioRef.value.play().then(() => {
        audioRef.value.currentTime = savedTime
        isPlaying.value = true
      }).catch((err) => {
        console.log('Autoplay blocked by browser. Waiting for user interaction...', err)
        
        const handleFirstInteraction = () => {
          if (audioRef.value) {
            audioRef.value.currentTime = savedTime
            audioRef.value.play().then(() => {
              isPlaying.value = true
              localStorage.setItem('audio_playing', 'true')
            }).catch(e => console.error(e))
          }
          window.removeEventListener('click', handleFirstInteraction)
          window.removeEventListener('keydown', handleFirstInteraction)
          window.removeEventListener('touchstart', handleFirstInteraction)
        }

        window.addEventListener('click', handleFirstInteraction)
        window.addEventListener('keydown', handleFirstInteraction)
        window.addEventListener('touchstart', handleFirstInteraction)
      })
    }
  }
})

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

const handleLogout = async () => {
  if (process.client) {
    localStorage.removeItem('gang_user_session')
    localStorage.removeItem('audio_playing')
    localStorage.removeItem('audio_time')
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

const openEditProfileModal = () => {
  profileForm.value = {
    username: currentUserProfile.value?.username || '',
    character_name: currentUserProfile.value?.character_name || '',
    phone_number: currentUserProfile.value?.phone_number || ''
  }
  showEditProfileModal.value = true
}

const handleUpdateProfile = async () => {
  if (!profileForm.value.username.trim() || !profileForm.value.character_name.trim()) {
    return showAlertMessage('กรุณากรอก Username และ ชื่อในเมือง ให้ครบถ้วน', 'คำเตือน', '⚠️')
  }

  const userId = currentUserProfile.value?.id
  if (!userId) return showAlertMessage('ไม่พบข้อมูลผู้ใช้', 'เกิดข้อผิดพลาด', '❌')

  isUpdatingProfile.value = true

  try {
    const { error } = await client
      .from('profiles')
      .update({
        username: profileForm.value.username.trim(),
        character_name: profileForm.value.character_name.trim(),
        phone_number: profileForm.value.phone_number.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    if (process.client) {
      const updatedUser = {
        ...loggedUser.value,
        username: profileForm.value.username.trim(),
        character_name: profileForm.value.character_name.trim(),
        phone_number: profileForm.value.phone_number.trim()
      }
      localStorage.setItem('gang_user_session', JSON.stringify(updatedUser))
      loggedUser.value = updatedUser
    }

    if (store.fetchAllData) await store.fetchAllData()

    await showAlertMessage('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!', 'สำเร็จ', '✅')
    showEditProfileModal.value = false
  } catch (e) {
    console.error('Update profile error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์', 'เกิดข้อผิดพลาด', '❌')
  } finally {
    isUpdatingProfile.value = false
  }
}

const handleDepositFileSelect = (e) => {
  depositFile.value = e.target.files[0]
}

const handleDepositSubmit = async () => {
  if (!depositFile.value) return showAlertMessage('กรุณาแนบรูปสลิปโอนเงินด้วยครับ', 'คำเตือน', '⚠️')
  if (!currentUserProfile.value?.id) return showAlertMessage('ไม่พบข้อมูลผู้ใช้', 'เกิดข้อผิดพลาด', '❌')

  isUploadingDeposit.value = true
  const success = await store.submitDepositSlip(currentUserProfile.value.id, depositForm.value.amount, depositForm.value.category, depositFile.value)
  isUploadingDeposit.value = false

  if (success) {
    await showAlertMessage('ส่งสลิปโอนเงินเรียบร้อยแล้ว! กรุณารอหัวหน้าหรือรองหัวหน้าอนุมัติ', 'สำเร็จ', '💳')
    depositForm.value.amount = 1000
    depositFile.value = null
  } else {
    await showAlertMessage('เกิดข้อผิดพลาดในการส่งสลิปโอนเงิน', 'เกิดข้อผิดพลาด', '❌')
  }
}

const handleWithdrawSubmit = async () => {
  if (!withdrawForm.value.amount || withdrawForm.value.amount <= 0) return showAlertMessage('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'คำเตือน', '⚠️')
  if (!withdrawForm.value.reason.trim()) return showAlertMessage('กรุณาระบุเหตุผลในการเบิกเงิน', 'คำเตือน', '⚠️')
  
  const currentTreasuryBalance = getVal(store.totalBalance) || 0
  if (withdrawForm.value.amount > currentTreasuryBalance) {
    return showAlertMessage('ยอดเงินในคลังแก๊งมีไม่เพียงพอสำหรับการเบิก', 'คำเตือน', '⚠️')
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

    await showAlertMessage(`เบิกเงินจำนวน $${withdrawForm.value.amount.toLocaleString()} เรียบร้อยแล้ว!`, 'สำเร็จ', '💸')
    showWithdrawModal.value = false
    withdrawForm.value = { amount: 1000, reason: '' }

    if (store.fetchAllData) await store.fetchAllData()
  } catch (e) {
    console.error('Withdraw Error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการเบิกเงินออกจากคลัง', 'เกิดข้อผิดพลาด', '❌')
  } finally {
    isWithdrawing.value = false
  }
}

// อนุมัติ/ปฏิเสธสลิปส่งเงินเข้าคลัง
const handleApproveDeposit = async (dep, isApproved) => {
  const reviewerName = currentUserProfile.value?.character_name || 'ผู้ดูแล'
  
  try {
    const success = await store.approveDeposit(dep, isApproved, reviewerName)
    if (success) {
      if (store.pendingDeposits) {
        const idx = store.pendingDeposits.findIndex(d => d.id === dep.id)
        if (idx !== -1) store.pendingDeposits.splice(idx, 1)
      }
      await showAlertMessage(isApproved ? 'อนุมัติเงินเข้าคลังเรียบร้อยแล้ว' : 'ปฏิเสธสลิปโอนเงินเรียบร้อยแล้ว', 'สำเร็จ', isApproved ? '✅' : 'ℹ️')
      if (store.fetchAllData) await store.fetchAllData()
    } else {
      await showAlertMessage('เกิดข้อผิดพลาดในการทำรายการ', 'เกิดข้อผิดพลาด', '❌')
      if (store.fetchPendingDeposits) await store.fetchPendingDeposits()
    }
  } catch (e) {
    console.error('Approve deposit error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการทำรายการ', 'เกิดข้อผิดพลาด', '❌')
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
  await showAlertMessage(`ปรับเปลี่ยนจำนวนไอเทม "${selectedQtyItem.value.item_name}" เรียบร้อยแล้ว`, 'สำเร็จ', '📦')
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
  if (!ruleForm.value.title || !ruleForm.value.content) return showAlertMessage('กรุณากรอกหัวข้อและเนื้อหากฎให้ครบถ้วน', 'คำเตือน', '⚠️')

  if (isEditingSingleRule.value) {
    await store.updateRuleItem(selectedRuleId.value, ruleForm.value.title, ruleForm.value.content)
  } else {
    await store.addRuleItem(ruleForm.value.rule_number, ruleForm.value.title, ruleForm.value.content)
  }
  showRuleModal.value = false
  await showAlertMessage('บันทึกกฎแก๊งเรียบร้อยแล้ว!', 'สำเร็จ', '📜')
}

const handleDeleteRule = async (id) => {
  const isConfirmed = await showConfirmDialog('คุณแน่ใจหรือไม่ว่าต้องการลบกฎข้อนี้?', 'ยืนยันการลบกฎ', '🗑️')
  if (isConfirmed) {
    await store.deleteRuleItem(id)
    await showAlertMessage('ลบกฎเรียบร้อยแล้ว', 'สำเร็จ', '✅')
  }
}

const handleLeaveSubmit = async () => {
  if (isSubmittingLeave.value) return
  if (!leaveReason.value.trim()) return showAlertMessage('กรุณาระบุสาเหตุการลาหยุดด้วยครับ', 'คำเตือน', '⚠️')
  const userId = currentUserProfile.value?.id
  if (!userId) return showAlertMessage('ไม่พบข้อมูลผู้ใช้', 'เกิดข้อผิดพลาด', '❌')

  isSubmittingLeave.value = true
  try {
    const success = await store.submitLeaveRequest(userId, leaveReason.value.trim())
    if (success) {
      showLeaveModal.value = false
      leaveReason.value = ''
      await showAlertMessage('ส่งคำขอลาหยุดเรียบร้อยแล้ว! กรุณารอหัวหน้าหรือรองหัวหน้าอนุมัติ', 'สำเร็จ', '🌴')
    } else {
      await showAlertMessage('เกิดข้อผิดพลาดในการส่งคำขอลาหยุด', 'เกิดข้อผิดพลาด', '❌')
    }
  } catch (e) {
    console.error('Leave Submit Error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการส่งคำขอลาหยุด', 'เกิดข้อผิดพลาด', '❌')
  } finally {
    isSubmittingLeave.value = false
  }
}

const handleCancelLeave = async () => {
  const isConfirmed = await showConfirmDialog('คุณต้องการยกเลิกสถานะลาหยุดและกลับมาทำกิจกรรมแก๊งตามปกติหรือไม่?', 'ยกเลิกการลาหยุด', '🌴')
  if (isConfirmed) {
    const success = await store.cancelLeave(currentUserProfile.value?.id)
    if (success) await showAlertMessage('ยกเลิกการลาหยุดเรียบร้อยแล้ว', 'สำเร็จ', '✅')
  }
}

const handleFileSelect = (event, mode) => {
  const file = event.target.files[0]
  if (mode === 'airdrop') airdropFile.value = file
}

// ตรวจสอบเวลาส่งหลักฐาน (ระหว่าง 20:30 ถึง 21:30 น.)
const handleCheckin = async (mode) => {
  const userId = currentUserProfile.value?.id
  if (!userId) return showAlertMessage('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 'เกิดข้อผิดพลาด', '❌')

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = 20 * 60 + 30
  const endMinutes = 21 * 60 + 30

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return showAlertMessage('ขณะนี้อยู่นอกเวลาการส่งหลักฐานแอร์ดรอป (ระบบเปิดให้ส่งได้ระหว่างเวลา 20:30 น. ถึง 21:30 น. เท่านั้น)', 'นอกเวลาทำการ', '⏳')
  }

  if (mode === 'airdrop') {
    if (!airdropFile.value) return showAlertMessage('กรุณาเลือกรูปหลักฐานแอร์ดรอปก่อนครับ', 'คำเตือน', '⚠️')
    isUploadingAirdrop.value = true
    try {
      const fileName = `airdrop_${userId}_${Date.now()}.png`
      const { data: uploadData, error: uploadErr } = await client.storage.from('airdrops').upload(fileName, airdropFile.value)
      if (uploadErr) throw uploadErr

      const { data: urlData } = client.storage.from('airdrops').getPublicUrl(fileName)
      
      const { error: insertErr } = await client.from('airdrop_checkins').insert({
        user_id: userId,
        image_url: urlData.publicUrl,
        status: 'pending'
      })
      if (insertErr) throw insertErr

      await showAlertMessage('ส่งหลักฐานเรียบร้อยแล้ว รอหัวแก๊งอนุมัติครับ', 'สำเร็จ', '✅')
      airdropFile.value = null
      await fetchAirdropCheckins()
    } catch (e) {
      console.error('Upload Error:', e)
      await showAlertMessage('เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน', 'เกิดข้อผิดพลาด', '❌')
    } finally {
      isUploadingAirdrop.value = false
    }
  }
}

const handleApproveAirdrop = async (checkinId, userId, isApproved) => {
  try {
    const { error } = await client
      .from('airdrop_checkins')
      .update({ status: isApproved ? 'approved' : 'rejected' })
      .eq('id', checkinId)

    if (error) throw error

    await showAlertMessage(isApproved ? 'อนุมัติการลงแอร์ดรอปเรียบร้อยแล้ว' : 'ปฏิเสธการลงแอร์ดรอปเรียบร้อยแล้ว', 'สำเร็จ', isApproved ? '✅' : 'ℹ️')
    await fetchAirdropCheckins()
  } catch (e) {
    console.error('Approve Error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการอนุมัติ', 'เกิดข้อผิดพลาด', '❌')
  }
}

const fetchMyFineLogs = async () => {
  const userId = currentUserProfile.value?.id
  if (!userId) return
  try {
    const { data, error } = await client
      .from('fine_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error && data) {
      myFineLogs.value = data
    }
  } catch (e) {
    console.error('Fetch fine logs error:', e)
  }
}

const handleItemFileSelect = (e) => {
  itemSelectedFile.value = e.target.files[0]
}

const handleAddInventory = async () => {
  if (!itemForm.value.name.trim()) return showAlertMessage('กรุณากรอกชื่อไอเทม', 'คำเตือน', '⚠️')
  isUploadingItem.value = true

  try {
    let imageUrl = null
    if (itemSelectedFile.value) {
      const fileName = `item_${Date.now()}.${itemSelectedFile.value.name.split('.').pop()}`
      const { error: uploadErr } = await client.storage.from('inventory').upload(fileName, itemSelectedFile.value)
      if (!uploadErr) {
        const { data: urlData } = client.storage.from('inventory').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    await store.addInventoryItem({
      item_name: itemForm.value.name.trim(),
      category: itemForm.value.category.trim(),
      quantity: itemForm.value.quantity,
      image_url: imageUrl
    })

    await showAlertMessage('เพิ่มไอเทมใหม่เข้าคลังเรียบร้อยแล้ว', 'สำเร็จ', '📦')
    itemForm.value = { name: '', category: 'ทั่วไป', quantity: 1 }
    itemSelectedFile.value = null
  } catch (e) {
    console.error('Add inventory error:', e)
    await showAlertMessage('เกิดข้อผิดพลาดในการเพิ่มไอเทม', 'เกิดข้อผิดพลาด', '❌')
  } finally {
    isUploadingItem.value = false
  }
}

const handleTicket = async () => {
  if (!ticketForm.value.title.trim() || !ticketForm.value.detail.trim()) {
    return showAlertMessage('กรุณากรอกข้อมูลคำร้องให้ครบถ้วน', 'คำเตือน', '⚠️')
  }

  const userId = currentUserProfile.value?.id
  if (!userId) return showAlertMessage('ไม่พบข้อมูลผู้ใช้', 'เกิดข้อผิดพลาด', '❌')

  const success = await store.submitTicket({
    user_id: userId,
    title: ticketForm.value.title.trim(),
    category: ticketForm.value.category,
    detail: ticketForm.value.detail.trim()
  })

  if (success) {
    await showAlertMessage('ส่งคำร้องเรียบร้อยแล้ว', 'สำเร็จ', '📋')
    ticketForm.value = { title: '', category: 'เบิกของ/เงิน', detail: '' }
  } else {
    await showAlertMessage('เกิดข้อผิดพลาดในการส่งคำร้อง', 'เกิดข้อผิดพลาด', '❌')
  }
}

const handleDeleteMember = async (member) => {
  const isConfirmed = await showConfirmDialog(`คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิก "${member.character_name}" ออกจากแก๊ง?`, 'ยืนยันการลบสมาชิก', '🗑️')
  if (isConfirmed) {
    await store.deleteMember(member.id)
    await showAlertMessage('ลบสมาชิกเรียบร้อยแล้ว', 'สำเร็จ', '✅')
  }
}

const exportCSV = () => {
  const profiles = getArray(store.profiles)
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  csvContent += "Name,Role,Phone,Fine Balance,Airdrop Status\n"

  profiles.forEach(m => {
    const status = getAirdropStatus(m)
    csvContent += `"${m.character_name}","${getRoleName(m.role)}","${m.phone_number || ''}","${m.fine_balance || 0}","${status}"\n`
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `gang_members_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getRoleBadge = (role) => {
  switch (role) {
    case 'leader': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'co_leader': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'inventory_keeper': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    default: return 'bg-slate-800 text-slate-300 border border-slate-700'
  }
}

const getRoleName = (role) => {
  switch (role) {
    case 'leader': return 'หัวหน้าแก๊ง'
    case 'co_leader': return 'รองหัวหน้าแก๊ง'
    case 'inventory_keeper': return 'คนเก็บของแก๊ง'
    default: return 'สมาชิก'
  }
}

const getTicketBadge = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-500/20 text-green-400 border border-green-500/30'
    case 'rejected': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    default: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  }
}

const getTicketStatusText = (status) => {
  switch (status) {
    case 'approved': return 'อนุมัติแล้ว'
    case 'rejected': return 'ไม่อนุมัติ'
    default: return 'รอการตรวจสอบ'
  }
}
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-pop-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>