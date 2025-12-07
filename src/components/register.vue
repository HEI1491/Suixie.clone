<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/plugins/api.js';
import { useTheme } from '@/composables/useTheme.js';
import { ElMessage } from 'element-plus';
import { User, Lock, Message, Iphone } from '@element-plus/icons-vue';

const router = useRouter();
const api = useApi();
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme();

const activeStep = ref(0);
const loading = ref(false);

const formData = reactive({
  account: '',
  password: '',
  mail: '',
  qq: '',
  verificationCode: '',
  qqVerificationCode: ''
});

const countdown = ref(0);
const qqCountdown = ref(0);
let timer = null;
let qqTimer = null;

const startCountdown = () => {
  countdown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) clearInterval(timer);
  }, 1000);
};

const startQqCountdown = () => {
  qqCountdown.value = 60;
  if (qqTimer) clearInterval(qqTimer);
  qqTimer = setInterval(() => {
    qqCountdown.value--;
    if (qqCountdown.value <= 0) clearInterval(qqTimer);
  }, 1000);
};

const sendVerificationCode = async () => {
  if (countdown.value > 0) return;
  if (!formData.mail) {
    ElMessage.warning('请输入邮箱');
    return;
  }
  try {
    await api.sendCode(formData.mail);
    startCountdown();
    ElMessage.success('验证码已发送至邮箱');
  } catch (error) {
    ElMessage.error(error.reason || error.message || '发送失败');
  }
};

const sendQqVerificationCode = async () => {
  if (qqCountdown.value > 0) return;
  if (!formData.qq) {
    ElMessage.warning('请输入QQ号');
    return;
  }
  try {
    await api.sendQQBindCode(formData.qq);
    startQqCountdown();
    ElMessage.success('验证码已发送至QQ邮箱');
  } catch (error) {
    ElMessage.error(error.reason || error.message || '发送失败');
  }
};

const nextStep = () => {
  if (activeStep.value === 0) {
    if (!formData.account || !formData.password) {
      ElMessage.warning('请填写完整账号信息');
      return;
    }
  } else if (activeStep.value === 1) {
    if (!formData.mail) {
      ElMessage.warning('请填写邮箱');
      return;
    }
    // Auto send code if not sent? Maybe user prefers manual
  }
  activeStep.value++;
};

const prevStep = () => {
  activeStep.value--;
};

const handleRegister = async () => {
  if (!formData.verificationCode) {
    ElMessage.warning('请输入邮箱验证码');
    return;
  }
  if (formData.qq && !formData.qqVerificationCode) {
    ElMessage.warning('请输入QQ验证码');
    return;
  }

  loading.value = true;
  try {
    // Register
    const regRes = await api.register(formData.account, formData.password, formData.mail, formData.verificationCode);
    if (regRes.status !== 200) throw new Error('注册失败');

    // Login to bind QQ
    if (formData.qq) {
      try {
        await api.login(formData.account, formData.password);
        await api.bindQQ(formData.qq, formData.qqVerificationCode);
        ElMessage.success('注册并绑定QQ成功');
      } catch (e) {
        ElMessage.warning('注册成功，但绑定QQ失败: ' + (e.reason || e.message));
      }
    } else {
        ElMessage.success('注册成功');
    }
    
    activeStep.value = 3; // Done
  } catch (error) {
    ElMessage.error(error.reason || error.message || '注册失败');
  } finally {
    loading.value = false;
  }
};

const goHome = () => router.push('/');
const goLogin = () => router.push('/login');
</script>

<template>
  <div class="register-container">
    <div class="theme-toggle-wrapper">
       <el-button circle @click="cycleThemePreference" :title="themeToggleLabel">
          {{ themeIcon }}
       </el-button>
    </div>

    <el-card class="register-card">
      <template #header>
        <div class="register-header">
          <h2>注册账号</h2>
          <el-steps :active="activeStep" finish-status="success" align-center class="steps">
            <el-step title="账号" />
            <el-step title="联系方式" />
            <el-step title="验证" />
            <el-step title="完成" />
          </el-steps>
        </div>
      </template>

      <div class="step-content">
        <!-- Step 0: Account Info -->
        <el-form v-if="activeStep === 0" :model="formData" label-position="top">
          <el-form-item label="账号" required>
            <el-input v-model="formData.account" placeholder="请输入账号" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" required>
            <el-input v-model="formData.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <div class="step-actions">
            <el-button @click="goHome">返回首页</el-button>
            <el-button type="primary" @click="nextStep">下一步</el-button>
          </div>
           <div class="form-footer">
            <router-link to="/login">已有账号？去登录</router-link>
          </div>
        </el-form>

        <!-- Step 1: Contact Info -->
        <el-form v-if="activeStep === 1" :model="formData" label-position="top">
          <el-form-item label="邮箱" required>
            <el-input v-model="formData.mail" placeholder="请输入邮箱" :prefix-icon="Message" />
          </el-form-item>
          <el-form-item label="QQ号 (选填)">
            <el-input v-model="formData.qq" placeholder="请输入QQ号" :prefix-icon="Iphone" />
          </el-form-item>
          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="nextStep">下一步</el-button>
          </div>
        </el-form>

        <!-- Step 2: Verification -->
        <el-form v-if="activeStep === 2" :model="formData" label-position="top">
          <el-form-item label="邮箱验证码" required>
            <el-input v-model="formData.verificationCode" placeholder="请输入邮箱验证码">
              <template #append>
                <el-button @click="sendVerificationCode" :disabled="countdown > 0">
                  {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="formData.qq" label="QQ验证码" required>
            <el-input v-model="formData.qqVerificationCode" placeholder="请输入QQ验证码">
              <template #append>
                <el-button @click="sendQqVerificationCode" :disabled="qqCountdown > 0">
                  {{ qqCountdown > 0 ? `${qqCountdown}s` : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" @click="handleRegister" :loading="loading">注册</el-button>
          </div>
        </el-form>

        <!-- Step 3: Success -->
        <div v-if="activeStep === 3" class="success-step">
          <el-result
            icon="success"
            title="注册成功"
            sub-title="欢迎加入幽柠之域"
          >
            <template #extra>
              <el-button type="primary" @click="goLogin">去登录</el-button>
              <el-button @click="goHome">返回首页</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-color, #f0f2f5);
  position: relative;
  padding: 20px;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
}

.register-card {
  width: 100%;
  max-width: 600px;
}

.register-header {
  text-align: center;
}

.steps {
  margin-top: 20px;
}

.step-content {
  padding: 20px 0;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.form-footer {
  text-align: center;
  margin-top: 15px;
}

.success-step {
  text-align: center;
}
</style>
