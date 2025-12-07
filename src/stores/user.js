import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_DEFAULTS } from '@/core/constants.js'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(API_DEFAULTS.tokenStorageKey) || '')
  const displayName = ref(localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || '')
  const loginTimestamp = ref(localStorage.getItem(API_DEFAULTS.loginTimestampStorageKey) || 0)

  const isLoggedIn = computed(() => {
    if (!token.value) return false
    const now = Date.now()
    const loginTime = parseInt(loginTimestamp.value)
    if (!loginTime || now - loginTime > API_DEFAULTS.loginMaxAgeMs) {
      return false
    }
    return true
  })

  const login = (newToken, newName) => {
    token.value = newToken
    displayName.value = newName
    loginTimestamp.value = Date.now()
    localStorage.setItem(API_DEFAULTS.tokenStorageKey, newToken)
    localStorage.setItem(API_DEFAULTS.displayNameStorageKey, newName)
    localStorage.setItem(API_DEFAULTS.loginTimestampStorageKey, loginTimestamp.value)
  }

  const logout = () => {
    token.value = ''
    displayName.value = ''
    loginTimestamp.value = 0
    localStorage.removeItem(API_DEFAULTS.tokenStorageKey)
    localStorage.removeItem(API_DEFAULTS.displayNameStorageKey)
    localStorage.removeItem(API_DEFAULTS.loginTimestampStorageKey)
  }

  const checkExpiration = () => {
    if (token.value && !isLoggedIn.value) {
      logout()
    }
  }

  return {
    token,
    displayName,
    isLoggedIn,
    login,
    logout,
    checkExpiration
  }
})
