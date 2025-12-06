<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue';
import BeianFooter from './components/BeianFooter.vue';

// 音乐播放器相关逻辑
const musicEl = ref(null)
const musicList = ref([
  '/music/偷吃の小曲——曼波、那咩、有时哈基米 - 1.偷吃の小曲——曼波、那咩、有时哈基米(Av114642844131180,P1).mp3',
  '/music/冬 の 哈 - 1.冬 の 哈(Av115492157130042,P1).mp3',
  '/music/哈基山的基米美如水啊.mp3',
  '/music/哈基米Phonk音乐之This Feeling完整版 - 1.哈基米Phonk音乐之This Feeling完整版(Av112893198600841,P1).mp3',
  '/music/哈基米音乐之 Cure for 咪 （完整版） - 1.哈基米音乐之 Cure for 咪 （完整版）(Av114345283490381,P1).mp3',
  '/music/哈基米：Lifeline.mp3',
  '/music/哈基米：🎵Pneumatic Tokyo🎵 - 1.哈基米：🎵Pneumatic Tokyo🎵(Av114907420824236,P1).mp3',
  '/music/无基区🎵完整版 - 1.无基区🎵完整版(Av114707721623377,P1).mp3',
  '/music/曼波FM之《DEAD 基米 INSIDE》 - 1.lv_0_20250409142801(Av114306595163027,P1).mp3',
  '/music/鼠鼠之歌《寂寞的人伤心的歌》 - 1.鼠鼠之歌《寂寞的人伤心的歌》(Av114251985327578,P1).mp3',
  '/music/🎵 𝑯𝒆𝒂𝒗𝒆𝒏——𝑨𝒗𝒊𝒄𝒊𝒊🎵哈基米音乐 - 1.🎵 𝑯𝒆𝒂𝒗𝒆𝒏——𝑨𝒗𝒊𝒄𝒊𝒊🎵哈基米音乐(Av113647519011570,P1).mp3',
  '/music/🎵太空曼波 𝑺𝒑𝒂𝒄𝒆 𝑾𝒂𝒍𝒌🎵哈基米纯音乐 - 1.SpaceWalk(Av113557358318790,P1).mp3'
].map(s => {
  const parts = s.split('/')
  const filename = parts.pop()
  return parts.join('/') + '/' + encodeURIComponent(filename || '')
}))
const musicReady = ref(false)
const musicPaused = ref(true)
const currentMusic = ref(null)
const currentIndex = ref(-1)
const musicProgress = ref(0)

const loadMusicList = async () => {
  musicReady.value = musicList.value.length > 0
}

const playRandomMusic = async () => {
  if (!musicReady.value) await loadMusicList()
  if (!musicList.value.length || !musicEl.value) return
  const idx = Math.floor(Math.random() * musicList.value.length)
  const url = musicList.value[idx]
  currentIndex.value = idx
  currentMusic.value = url
  try { musicEl.value.src = url } catch {}
  try { await musicEl.value.play(); musicPaused.value = false } catch { musicPaused.value = true }
}

const toggleMusic = async () => {
  if (!musicEl.value || (musicPaused.value && !currentMusic.value)) {
    await playRandomMusic()
    return
  }
  if (!musicPaused.value && musicEl.value) {
    try { musicEl.value.pause(); musicPaused.value = true } catch {}
    return
  }
  if (musicEl.value && musicPaused.value && currentMusic.value) {
    try { await musicEl.value.play(); musicPaused.value = false } catch {}
  }
}

const nextMusic = async () => {
  if (!musicReady.value) await loadMusicList()
  if (!musicList.value.length || !musicEl.value) return
  const next = (currentIndex.value >= 0 ? (currentIndex.value + 1) : 0) % musicList.value.length
  currentIndex.value = next
  const url = musicList.value[next]
  currentMusic.value = url
  try { musicEl.value.src = url } catch {}
  try { await musicEl.value.play(); musicPaused.value = false } catch { musicPaused.value = true }
}

onMounted(() => {
    if (musicEl.value) {
      try { musicEl.value.preload = 'none' } catch {}
      musicEl.value.onended = () => {
        if (!musicPaused.value) playRandomMusic()
      }
      musicEl.value.ontimeupdate = () => {
        if (musicEl.value && musicEl.value.duration) {
          musicProgress.value = (musicEl.value.currentTime / musicEl.value.duration) * 100
        } else {
          musicProgress.value = 0
        }
      }
    }
    loadMusicList()
})

onUnmounted(() => {
  try { musicEl.value?.pause() } catch {}
  musicEl.value = null
})

// 提供给子组件
provide('music', {
  musicPaused,
  currentMusic,
  musicProgress,
  toggleMusic,
  nextMusic
})
</script>

<template>
  <!-- 路由视图容器 - 根据当前路由显示对应组件 -->
  <RouterView id="view"></RouterView>
  <button class="back-home-btn" v-if="$route.path !== '/'" @click="$router.push('/')">返回主页</button>
  <div class="disclaimer" v-if="$route.path.startsWith('/court')">《娱乐项目 | 请勿模仿》</div>
  
  <!-- 全局音乐播放器 -->
  <audio ref="musicEl" style="display:none"></audio>

  <!-- 全局备案信息（文档流内，非fixed） -->
  <BeianFooter />
</template>

<style scoped>
/* 根组件样式 - 目前为空，样式主要由子组件控制 */
 .site-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: center; padding: 8px 12px; font-size: 12px; color: var(--text-muted); background: var(--header-bg); backdrop-filter: blur(6px); box-shadow: var(--shadow-md); z-index: 900; }
 .footer-content { display: flex; align-items: center; gap: 10px; }
 .beian-link, .icp-link { color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
 .beian-link:hover, .icp-link:hover { color: var(--link-color); }
 .divider { color: var(--text-muted); }
 .beian-img { display: inline-block; vertical-align: middle; }
 .icp-icon { display: inline-flex; align-items: center; justify-content: center; color: #4A90E2; }
 .back-home-btn { position: fixed; top: 12px; left: 12px; z-index: 1100; padding: 8px 12px; border: none; border-radius: 8px; background: var(--card-bg); color: var(--text-primary); box-shadow: var(--shadow-md); cursor: pointer; }
 .back-home-btn:hover { box-shadow: var(--shadow-lg); }
  .disclaimer { position: fixed; bottom: 44px; left: 0; width: 100%; text-align: center; padding: 6px 10px; font-size: 12px; color: var(--text-muted); background: var(--btn-secondary-bg); z-index: 900; }
</style>

<style>
/* 全局旋转特效 */
@keyframes superSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(3600deg); } /* 高速旋转 */
}

.super-spin {
  animation: superSpin 5s linear infinite;
  pointer-events: none; /* 让页面难以操作 */
}
</style>
