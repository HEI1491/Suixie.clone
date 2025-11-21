<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '../composables/useTheme.js';
import { useApi } from '@/plugins/api.js';
import { useSnackbar } from '../composables/useSnackbar.js';
import { API_DEFAULTS } from '@/core/constants.js';

// 主题、路由、接口、消息等全局依赖
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme();
const router = useRouter();
const api = useApi();
const { showMessage } = useSnackbar();

// 注册进度、表单字段与界面控制状态
const currentStep = ref(0);
const formData = reactive({
  account: '',
  password: '',
  mail: '',
  qq: '',
  verificationCode: '',
  qqVerificationCode: ''
});
// 动画、倒计时以及加载/显示控制
const animationClass = ref('');
const countdown = ref(0);
const qqCountdown = ref(0);
let timer = null;
let qqTimer = null;
const showPassword = ref(false);
const isLoading = ref(false);

// 是否满足基础字段已填（控制下一步按钮）
const isFormValid = computed(() => {
  return formData.account && formData.password && formData.mail;
});

// 是否需要进入 QQ 验证流程
const showQqVerification = computed(() => {
  return formData.qq && formData.qq.trim() !== '';
});

// 基础邮箱格式校验
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateQQ = (v) => /^\d{5,}$/.test(String(v || '').trim());

// 发送邮箱验证码并启动 60s 倒计时
const sendVerificationCode = async () => {
  if (countdown.value > 0) return;
  if (!validateEmail(formData.mail)) {
    showMessage('\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e', { type: 'warning' });
    return;
  }
  isLoading.value = true;
  try {
    await api.sendCode(formData.mail);
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
    showMessage('\u9a8c\u8bc1\u7801\u5df2\u53d1\u9001\uff0c\u8bf7\u67e5\u6536\u90ae\u7bb1', { type: 'success' });
  } catch (error) {
    showMessage(error.reason || error.message || '\u53d1\u9001\u9a8c\u8bc1\u7801\u5931\u8d25', { type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// 发送 QQ 绑定码
const sendQqVerificationCode = async () => {
  if (qqCountdown.value > 0) return;
  if (!validateQQ(formData.qq)) {
    showMessage('\u8bf7\u5148\u586b\u5199QQ\u53f7', { type: 'warning' });
    return;
  }
  isLoading.value = true;
  try {
    await api.sendQQBindCode(formData.qq.trim());
    qqCountdown.value = 60;
    if (qqTimer) {
      clearInterval(qqTimer);
    }
    qqTimer = window.setInterval(() => {
      qqCountdown.value--;
      if (qqCountdown.value <= 0) {
        clearInterval(qqTimer);
      }
    }, 1000);
    showMessage('\u7ed1\u5b9a\u7801\u5df2\u53d1\u9001\u81f3QQ\u90ae\u7bb1\uff0c\u8bf7\u67e5\u6536', { type: 'success' });
  } catch (error) {
    showMessage(error.reason || error.message || '\u53d1\u9001QQ\u7ed1\u5b9a\u7801\u5931\u8d25', { type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// 控制下一步转场及阶段性逻辑
const nextStep = () => {
  if (currentStep.value === 0) {
    if (!formData.account) {
      showMessage('请输入账号')
      return
    }
  }
  if (currentStep.value === 2) {
    if (!validateEmail(formData.mail)) {
      showMessage('邮箱格式不正确');
      return;
    }
    sendVerificationCode();
  }
  if (currentStep.value === 3) {
    if (!formData.verificationCode || !/^\d+$/.test(String(formData.verificationCode))) {
      showMessage('请输入邮箱验证码');
      return;
    }
  }
  if (currentStep.value === 4 && showQqVerification.value) {
    if (!validateQQ(formData.qq)) {
      showMessage('请输入有效的QQ号');
      return;
    }
    sendQqVerificationCode();
    currentStep.value = 5;
    return;
  }
  if (currentStep.value === 5) {
    if (!formData.qqVerificationCode || !/^\d+$/.test(String(formData.qqVerificationCode))) {
      showMessage('请输入QQ绑定码');
      return;
    }
    currentStep.value = 6;
    return;
  }
  if (currentStep.value === 6) {
    handleSubmit();
    return;
  }
  if (currentStep.value < 7) {
    animationClass.value = 'slide-out';
    setTimeout(() => {
      currentStep.value++;
      if (currentStep.value === 5 && !showQqVerification.value) {
        currentStep.value = 6;
      }
      animationClass.value = 'slide-in';
      setTimeout(() => {
        animationClass.value = '';
      }, 300);
    }, 300);
  }
};

// 处理返回上一步及特殊跳转
const prevStep = () => {
  if (currentStep.value === 0) {
    router.push('/');
    return;
  }
  if (currentStep.value === 7) {
    currentStep.value = 6;
    return;
  }
  if (currentStep.value === 6 && showQqVerification.value) {
    currentStep.value = 5;
    return;
  }
  if (currentStep.value === 6 && !showQqVerification.value) {
    currentStep.value = 4;
    return;
  }
  if (currentStep.value === 5) {
    currentStep.value = 4;
    return;
  }
  if (currentStep.value > 0) {
    animationClass.value = 'slide-out-back';
    setTimeout(() => {
      currentStep.value--;
      animationClass.value = 'slide-in-back';
      setTimeout(() => {
        animationClass.value = '';
      }, 300);
    }, 300);
  } else {
    showMessage('没有上一个页面啦！');
  }
};

// 汇总数据后调用注册接口
const handleSubmit = async () => {
  isLoading.value = true;
  try {
    await api.register(
      formData.account,
      formData.password,
      formData.verificationCode
    );
    try { localStorage.setItem(API_DEFAULTS.loginTimestampStorageKey, String(Date.now())); } catch {}
    try { localStorage.setItem(API_DEFAULTS.displayNameStorageKey, formData.account); } catch {}
    try {
      if (validateQQ(formData.qq) && formData.qqVerificationCode?.trim()) {
        try {
          const r = await api.bindQQ(String(formData.qq).trim(), formData.qqVerificationCode.trim());
          const bound = r?.qq ? String(r.qq) : '';
          if (bound && bound !== String(formData.qq).trim()) {
            showMessage('\u7ed1\u5b9a\u6210\u529f\uff0c\u4f46QQ\u53f7\u4e0e\u8f93\u5165\u4e0d\u4e00\u81f4', { type: 'warning' });
          } else {
            showMessage('\u7ed1\u5b9aQQ\u6210\u529f', { type: 'success' });
          }
        } catch {
          const res = await api.verifyQQBind(formData.qqVerificationCode.trim());
          const bound = res?.qq ? String(res.qq) : '';
          if (bound && bound !== String(formData.qq).trim()) {
            showMessage('\u7ed1\u5b9a\u6210\u529f\uff0c\u4f46QQ\u53f7\u4e0e\u8f93\u5165\u4e0d\u4e00\u81f4', { type: 'warning' });
          } else {
            showMessage('\u7ed1\u5b9aQQ\u6210\u529f', { type: 'success' });
          }
        }
      }
    } catch (e) {
      const reason = e?.reason || e?.message || '';
      showMessage(reason || '\u7ed1\u5b9aQQ\u5931\u8d25', { type: 'error' });
    }
    showMessage('\u6ce8\u518c\u6210\u529f！', { type: 'success' });
    currentStep.value = 7;
  } catch (error) {
    const reason = error.reason || error.message || '\u6ce8\u518c\u5931\u8d25';
    showMessage(`\u6ce8\u518c\u5931\u8d25: ${reason}`, { type: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// 保持邮箱验证码输入为纯数字
const onVerificationCodeInput = (e) => {
  formData.verificationCode = e.target.value.replace(/\D/g, '');
};

// 保持 QQ 验证码输入为纯数字
const onQqVerificationCodeInput = (e) => {
  formData.qqVerificationCode = e.target.value.replace(/\D/g, '');
};

const onQqInput = (e) => {
  formData.qq = e.target.value.replace(/\D/g, '');
};

// 切换密码显示状态
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 提示用户 QQ 功能暂不可用
const showQqDisabledMessage = () => {
  showMessage('存在未知问题，该功能已禁用，请直接下一步');
};

// 离开组件时清除定时器，避免内存泄漏
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (qqTimer) clearInterval(qqTimer);
});
</script>

<template>
  <div class="register-container">
    <!-- 主题切换按钮 -->
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: ((currentStep + 1) * (100/8)) + '%' }">
      </div>
    </div>
    
    <div class="form-container">
      <!-- 步骤1: 账号 -->
      <div v-show="currentStep === 0" :class="['form-step', animationClass]">
        <h2>创建账户</h2>
        <div class="input-group">
          <label for="account">账号 *</label>
          <input 
            type="text" 
            id="account" 
            v-model="formData.account" 
            placeholder="请输入账号"
            required
          />
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">回到首页</button>
          <button class="btn btn-next" @click="nextStep" :disabled="!formData.account">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤2: 密码 -->
      <div v-show="currentStep === 1" :class="['form-step', animationClass]">
        <h2>设置密码</h2>
        <div class="input-group">
          <label for="password">密码 *</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            placeholder="请输入密码(至少8位)"
            required
          />
          <p v-if="formData.password && formData.password.length < 8" class="password-hint">
            密码长度至少8位
          </p>
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">上一步</button>
          <button class="btn btn-next" @click="nextStep" :disabled="!formData.password || formData.password.length < 8">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤3: 邮箱 -->
      <div v-show="currentStep === 2" :class="['form-step', animationClass]">
        <h2>邮箱地址</h2>
        <div class="input-group">
          <label for="mail">邮箱 *</label>
          <input 
            type="email" 
            id="mail" 
            v-model="formData.mail" 
            placeholder="请输入邮箱"
            required
          />
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">上一步</button>
          <button class="btn btn-next" @click="nextStep" :disabled="!formData.mail">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤4: 验证码 -->
      <div v-show="currentStep === 3" :class="['form-step', animationClass]">
        <h2>邮箱验证</h2>
      <div class="input-group">
          <label for="verificationCode">验证码 *</label>
          <input 
            type="text" 
            id="verificationCode" 
            v-model="formData.verificationCode" 
            placeholder="请输入验证码"
            required
            @input="onVerificationCodeInput"
          />
          <div class="verification-actions">
            <p class="verification-hint">验证码已发送至您的邮箱，请查收</p>
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
          <button class="btn btn-next" @click="nextStep" :disabled="!formData.verificationCode">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤5: QQ -->
      <div v-show="currentStep === 4" :class="['form-step', animationClass]">
        <h2>可选信息</h2>
        <div class="input-group">
          <label for="qq">QQ (可选)</label>
          <input 
            type="text" 
            id="qq" 
            v-model="formData.qq" 
            placeholder="请输入QQ号"
            @input="onQqInput"
          />
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">上一步</button>
          <button class="btn btn-next" @click="nextStep" :disabled="showQqVerification && !validateQQ(formData.qq)">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤6: QQ验证 -->
      <div v-show="currentStep === 5" :class="['form-step', animationClass]" v-if="showQqVerification">
        <h2>QQ邮箱验证</h2>
        <div class="input-group">
          <label for="qqVerificationCode">验证码 *</label>
          <input 
            type="text" 
            id="qqVerificationCode" 
            v-model="formData.qqVerificationCode" 
            placeholder="请输入验证码"
            required
            @input="onQqVerificationCodeInput"
          />
          <div class="verification-actions">
            <p class="verification-hint">绑定码已发送至您的QQ邮箱({{ formData.qq }}@qq.com)，请查收</p>
            <button 
              class="btn-resend" 
              @click="sendQqVerificationCode" 
              :disabled="qqCountdown > 0">
              {{ qqCountdown > 0 ? `重新发送(${qqCountdown}s)` : '重新发送' }}
            </button>
          </div>
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">上一步</button>
          <button class="btn btn-next" @click="nextStep" :disabled="!formData.qqVerificationCode">
            下一步
          </button>
        </div>
      </div>
      
      <!-- 步骤6: 信息确认页面 -->
      <div v-show="currentStep === 6" :class="['form-step', animationClass]">
        <h2>请再次确认您的信息</h2>
        <div class="confirmation-info">
          <div class="info-item">
            <span class="info-label">账号:</span>
            <span class="info-value">{{ formData.account }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">密码:</span>
            <span class="info-value">
              {{ showPassword ? formData.password : '•'.repeat(formData.password.length || 4) }}
              <button @click="togglePasswordVisibility" class="toggle-password-btn">
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱:</span>
            <span class="info-value">{{ formData.mail }}</span>
          </div>
          <div class="info-item" v-if="formData.qq">
            <span class="info-label">QQ:</span>
            <span class="info-value">{{ formData.qq }}</span>
          </div>
        </div>
        <div class="button-group">
          <button class="btn btn-prev" @click="prevStep">上一步</button>
          <button class="btn btn-submit" @click="nextStep">
            确认并提交
          </button>
        </div>
      </div>
      
      <!-- 步骤7: 完成注册 -->
      <div v-show="currentStep === 7" :class="['form-step', animationClass]">
        <h2>注册完成</h2>
        <div class="completion-message">
          <p>账号注册成功！祝您游戏愉快</p>
          <p>账号: {{ formData.account }}</p>
        </div>
        <div class="button-group">
          <button class="btn btn-submit" @click="handleSubmit">
            完成注册
          </button>
        </div>
      </div>
      
      <!-- 步骤7: 完成注册 (QQ验证后) -->
    </div>
  </div>
</template>
<style scoped src="/src/assets/register.css"></style>
