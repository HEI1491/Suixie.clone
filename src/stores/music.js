import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMusicStore = defineStore('music', () => {
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

  const setMusicElement = (el) => {
    musicEl.value = el
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

  return {
    musicEl,
    musicList,
    musicReady,
    musicPaused,
    currentMusic,
    currentIndex,
    musicProgress,
    setMusicElement,
    playRandomMusic,
    toggleMusic,
    nextMusic
  }
})
