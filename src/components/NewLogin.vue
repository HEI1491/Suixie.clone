<template>
  <div class="login-container">
    <!-- 主题切换按钮 -->
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>
    <div class="login-card">
      <div class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: ((currentStep + 1) * (100/6)) + '%' }">
        </div>
      </div>

      <div class="form-container">
        <!-- 步骤1: 欢迎页面 -->
        <div v-show="currentStep === 0" :class="['form-step', animationClass]">
          <h2>欢迎回到幽柠之域</h2>
          <p class="subtitle">请点击下一步按钮以继续</p>
          <div class="login-method">
            <router-link to="/register" class="register-link">没有账户？立即注册！</router-link>
          </div>
          <div class="button-group">
            <router-link to="/" class="btn btn-prev">回到首页</router-link>
            <button class="btn btn-next" @click="nextStep">下一步</button>
          </div>
        </div>

        <!-- 步骤2: 选择登录方式 -->
        <div v-show="currentStep === 1" :class="['form-step', animationClass]">
          <h2>选择登录方式</h2>
          <div class="login-methods">
            <button
                class="method-btn"
                :class="{ active: loginMethod === 'account' }"
                @click="loginMethod = 'account'">
              账号密码
            </button>
            <button
                class="method-btn"
                :class="{ active: loginMethod === 'email' }"
                @click="loginMethod = 'email'"
                disabled>
              邮箱验证(暂未开放)
            </button>
            <button
                class="method-btn"
                :class="{ active: loginMethod === 'qq' }"
                @click="loginMethod = 'qq'">
              QQ验证（等嘿开放）
            </button>
          </div>
          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="!loginMethod">
              下一步
            </button>
          </div>
        </div>

        <!-- 步骤3: 输入账号 -->
        <div v-show="currentStep === 2 && loginMethod === 'account'" :class="['form-step', animationClass]">
          <h2>账号密码登录</h2>
          <div class="input-group">
            <label for="username">账号 *</label>
            <input
                id="username"
                v-model="loginForm.username"
                type="text"
                placeholder="请输入账号"
                required
            />
          </div>
          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="!loginForm.username">
              下一步
            </button>
          </div>
        </div>

        <!-- 步骤4: 输入密码 -->
        <div v-show="currentStep === 3 && loginMethod === 'account'" :class="['form-step', animationClass]">
          <h2>账号密码登录</h2>
          <div class="input-group">
            <label for="password">密码 *</label>
            <div class="password-input">
              <input
                  id="password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  required
              />
              <button
                  type="button"
                  class="toggle-password"
                  @click="togglePasswordVisibility"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="remember-me-option">
            <label class="remember-me">
              <input
                  type="checkbox"
                  v-model="loginForm.rememberMe"
              />
              <span>记住我</span>
            </label>
          </div>

          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="!loginForm.password">
              登录
            </button>
          </div>
        </div>

        <!-- 步骤3: 输入邮箱 -->
        <div v-show="currentStep === 2 && loginMethod === 'email'" :class="['form-step', animationClass]">
          <h2>邮箱登录</h2>
          <div class="input-group">
            <label for="email">邮箱 *</label>
            <input
                id="email"
                v-model="loginForm.email"
                type="email"
                placeholder="请输入邮箱"
                required
            />
          </div>
          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="!loginForm.email">
              下一步
            </button>
          </div>
        </div>

        <!-- 步骤3: 输入QQ -->
        <div v-show="currentStep === 2 && loginMethod === 'qq'" :class="['form-step', animationClass]">
          <h2>QQ登录</h2>
          <div class="input-group">
            <label for="qq">QQ号 *</label>
            <input
                id="qq"
                v-model="loginForm.qq"
                type="text"
                placeholder="请输入QQ号"
                required
            />
          </div>
          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="!loginForm.qq">
              下一步
            </button>
          </div>
        </div>

        <!-- 步骤4: 验证码输入（邮箱/QQ验证） -->
        <div v-show="(currentStep === 3 && loginMethod !== 'account') ||
                     (currentStep === 4 && loginMethod === 'account')"
             :class="['form-step', animationClass]"
             ref="verificationStep">
          <h2 v-if="loginMethod === 'email'">邮箱验证</h2>
          <h2 v-else-if="loginMethod === 'qq'">QQ验证</h2>
          <h2 v-else-if="loginMethod === 'account'">账号验证</h2>

          <div class="input-group">
            <label for="verificationCode">验证码 *</label>
            <input
                id="verificationCode"
                v-model="loginForm.verificationCode"
                type="text"
                placeholder="请输入验证码"
                required
                @input="onVerificationCodeInput"
            />
            <div class="verification-actions">
              <p class="verification-hint">
                验证码已发送至
                <span v-if="loginMethod === 'email'">{{ loginForm.email }}</span>
                <span v-else-if="loginMethod === 'qq'">{{ loginForm.qq }}@qq.com</span>
                <span v-else-if="loginMethod === 'account'">您的注册邮箱</span>
              </p>
              <button
                  class="btn-resend"
                  @click="sendVerificationCode"
                  :disabled="countdown > 0">
                {{ countdown > 0 ? `重新发送(${countdown}s)` : '重新发送' }}
              </button>
            </div>
          </div>

          <div class="button-group">
            <button class="btn btn-prev" @click="prevStep">上一步</button>
            <button class="btn btn-next" @click="nextStep" :disabled="(loginMethod !== 'account') && !loginForm.verificationCode">
              下一步
            </button>
          </div>
        </div>

        <!-- 步骤5: 登录成功 -->
        <div v-show="currentStep === 5" :class="['form-step', animationClass]">
          <h2>登录成功</h2>
          <div class="success-message">
            <p>欢迎回来 {{ getDisplayName() }}</p>
          </div>
          <div class="button-group">
            <router-link to="/" class="btn btn-submit">回到首页</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted } from 'vue';
import { useTheme } from '../composables/useTheme.js';
import { useRouter, useRoute } from 'vue-router';
import { useApi } from '@/plugins/api.js';
import { API_DEFAULTS } from '@/core/constants.js';
import { useSnackbar } from '../composables/useSnackbar.js';

const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme();
const router = useRouter();
const route = useRoute();
const api = useApi();
const { showMessage } = useSnackbar();

const currentStep = ref(0);
const loginMethod = ref(''); // 'account', 'email', 'qq'
const loginForm = reactive({
  username: '',
  password: '',
  email: '',
  qq: '',
  verificationCode: '',
  rememberMe: false
});
const showPassword = ref(false);
const isLoggingIn = ref(false);
const animationClass = ref('');
const countdown = ref(0);
let timer = null;
const sumLevel = ref('');
const sumExp = ref(null);
const sumGain = ref(null);
const sumExpBefore = ref(null);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const isCurrentStepValid = () => {
  if (currentStep.value === 2) {
    if (loginMethod.value === 'account') {
      return loginForm.username;
    } else if (loginMethod.value === 'email') {
      return loginForm.email;
    } else if (loginMethod.value === 'qq') {
      return loginForm.qq;
    }
  } else if (currentStep.value === 3 && loginMethod.value === 'account') {
    return loginForm.password;
  }
  return true;
};

const getDisplayName = () => {
  if (loginMethod.value === 'account') {
    return loginForm.username;
  } else if (loginMethod.value === 'email') {
    return loginForm.email;
  } else if (loginMethod.value === 'qq') {
    return loginForm.qq;
  }
  return '';
};

const nextStep = async () => {
  if ((currentStep.value === 2 || (currentStep.value === 3 && loginMethod.value === 'account')) && !isCurrentStepValid()) {
    showMessage('请填写完整信息');
    return;
  }

  if (currentStep.value === 2 && loginMethod.value === 'email') {
    sendVerificationCode();
  }
  if (currentStep.value === 2 && loginMethod.value === 'qq') {
    await sendQQCode();
  }

  if ((currentStep.value === 3 && loginMethod.value !== 'account') || (currentStep.value === 4 && loginMethod.value === 'account')) {
    // noop
  }

  if (currentStep.value === 3 && loginMethod.value === 'account') {
    handleLogin();
    return;
  }

  if (currentStep.value === 3 && loginMethod.value !== 'account') {
    await handleLogin();
    return;
  }

  if (loginMethod.value === 'account') {
    if (currentStep.value === 2) {
      animationClass.value = 'slide-out';
      setTimeout(() => {
        currentStep.value = 3;
        animationClass.value = 'slide-in';
        setTimeout(() => {
          animationClass.value = '';
        }, 300);
      }, 300);
      return;
    }
  }

  if (currentStep.value < 5) {
    animationClass.value = 'slide-out';
    setTimeout(() => {
      currentStep.value++;
      animationClass.value = 'slide-in';
      setTimeout(() => {
        animationClass.value = '';
      }, 300);
    }, 300);
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    animationClass.value = 'slide-out-back';
    setTimeout(() => {
      currentStep.value--;
      animationClass.value = 'slide-in-back';
      setTimeout(() => {
        animationClass.value = '';
      }, 300);
    }, 300);
  }
};

const handleLogin = async () => {
  isLoggingIn.value = true;

  try {
    if (loginMethod.value === 'account') {
      const result = await api.login(loginForm.username, loginForm.password);
      if (result.status === 200) {
        const token = api.readToken?.() || localStorage.getItem(API_DEFAULTS.tokenStorageKey);
        if (!token) {
          showMessage('未获取到登录凭证，请重试', { type: 'error' });
          return;
        }
        try { localStorage.setItem(API_DEFAULTS.displayNameStorageKey, loginForm.username); } catch {}
        try { localStorage.setItem(API_DEFAULTS.loginTimestampStorageKey, String(Date.now())); } catch {}
        try {
          const prof1 = await api.getUserProfile();
          sumExpBefore.value = prof1?.data?.currentExp ?? null;
        } catch {}
        try { 
          await api.sign();
        } catch {}
        try {
          const prof2 = await api.getUserProfile();
          sumLevel.value = prof2?.data?.level ?? '';
          sumExp.value = prof2?.data?.currentExp ?? null;
          if (sumExpBefore.value != null && sumExp.value != null) {
            const diff = Number(sumExp.value) - Number(sumExpBefore.value);
            sumGain.value = Math.max(0, isNaN(diff) ? 0 : diff);
          }
        } catch {}
        showMessage('三天不登录自动退出登录账号', { type: 'info', duration: 3000 })
        animationClass.value = 'slide-out';
        setTimeout(() => {
          currentStep.value = 5;
          animationClass.value = 'slide-in';
          setTimeout(() => {
            animationClass.value = '';
          }, 300);
          try {
            const r = String((route.query && route.query.redirect) || '');
            if (r) router.push(r);
          } catch {}
        }, 300);
      }
    } else {
      if (loginMethod.value === 'qq') {
        try {
          const result = await api.qqLogin(loginForm.qq, loginForm.verificationCode);
          if (result.status === 200) {
            const token = api.readToken?.() || localStorage.getItem(API_DEFAULTS.tokenStorageKey);
            if (!token) {
              showMessage('未获取到登录凭证，请重试', { type: 'error' });
              return;
            }
            try { localStorage.setItem(API_DEFAULTS.displayNameStorageKey, loginForm.qq); } catch {}
            try { localStorage.setItem(API_DEFAULTS.loginTimestampStorageKey, String(Date.now())); } catch {}
            animationClass.value = 'slide-out';
            setTimeout(() => {
              currentStep.value = 5;
              animationClass.value = 'slide-in';
              setTimeout(() => { animationClass.value = ''; }, 300);
              try {
                const r = String((route.query && route.query.redirect) || '');
                if (r) router.push(r);
              } catch {}
            }, 300);
          }
        } catch (err) {
          const msg = err?.reason || err?.message || '';
          if (/not found/i.test(msg)) {
            showMessage('当前未开启QQ验证码登录，请使用账号密码登录', { type: 'error' });
          } else {
            showMessage(msg || 'QQ登录失败', { type: 'error' });
          }
        }
        return;
      }
    }
  } catch (error) {
    const errorMessage = error?.reason || error?.message || '登录失败';
    showMessage(errorMessage, { type: 'error' });
  } finally {
    isLoggingIn.value = false;
  }
};

const getVerificationTarget = () => {
  if (loginMethod.value === 'email') {
    return loginForm.email?.trim();
  }
  if (loginMethod.value === 'qq') {
    return loginForm.qq ? `${loginForm.qq}@qq.com` : '';
  }
  return '';
};

const startCountdown = () => {
  countdown.value = 60;
  if (timer) {
    clearInterval(timer);
  }
  timer = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};

const sendVerificationCode = async () => {
  if (countdown.value > 0) return;

  const target = getVerificationTarget();
  if (!target) {
    showMessage('请先填写完整信息', { type: 'warning' });
    return;
  }

  try {
    await api.sendCode(target);
    startCountdown();
    showMessage('验证码已发送', { type: 'success' });
  } catch (error) {
    const errorMessage = error?.reason || error?.message || '发送验证码失败';
    showMessage(errorMessage, { type: 'error' });
  }
};

const sendQQCode = async () => {
  if (countdown.value > 0) return;
  if (!loginForm.qq?.trim()) {
    showMessage('请填写QQ号', { type: 'warning' });
    return;
  }
  try {
    await api.sendQQBindCode(loginForm.qq.trim());
    startCountdown();
    showMessage('验证码已发送', { type: 'success' });
  } catch (error) {
    const errorMessage = error?.reason || error?.message || '发送验证码失败';
    showMessage(errorMessage, { type: 'error' });
  }
};

const onVerificationCodeInput = (e) => {
  loginForm.verificationCode = e.target.value.replace(/\D/g, '');
};

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
});

onMounted(() => {
  try {
    const preMsg = localStorage.getItem(API_DEFAULTS.preLoginMessageKey);
    if (preMsg) {
      showMessage(preMsg, { type: 'warning', duration: 3000 });
      localStorage.removeItem(API_DEFAULTS.preLoginMessageKey);
    }
  } catch {}
});
</script>

<style scoped src="../assets/NewLogin.css"></style>
<style scoped>
.summary { margin-top: 10px; padding: 12px; background: var(--card-bg); border-radius: 12px; box-shadow: var(--shadow-md); }
.sum-line { display: flex; justify-content: space-between; padding: 8px 10px; background: var(--btn-secondary-bg); border-radius: 10px; margin-bottom: 8px; }
.sum-label { color: var(--text-muted); }
.sum-value { color: var(--text-primary); font-weight: 600; }
</style>
