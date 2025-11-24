import nodemailer from 'nodemailer'

export default class SendMail {
  constructor() {
    const cfg = (global && global.AConfig && global.AConfig.MAIL) ? global.AConfig.MAIL : {}
    // QQ邮箱账号（发件人地址），例如：123456@qq.com；也可通过环境变量 MAIL_USER 提供
    const user = (cfg.auth && cfg.auth.user) || process.env.MAIL_USER || ''
    // QQ邮箱 SMTP 授权码（非QQ登录密码），在QQ邮箱“设置-账户-POP3/SMTP服务”启用后获取；也可通过环境变量 MAIL_PASS 提供
    const pass = (cfg.auth && cfg.auth.pass) || process.env.MAIL_PASS || ''
    const host = (cfg.smtp && cfg.smtp.host) || 'smtp.qq.com'
    const port = (cfg.smtp && cfg.smtp.port) || 465
    const secure = (cfg.smtp && cfg.smtp.secure) !== undefined ? cfg.smtp.secure : true
    this.from = cfg.from || user
    this.transporter = nodemailer.createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined })
    this.transporter.verify().catch(() => { console.error('[SendMail] verify failed') })
  }

  async sendMail(to, subject, text) {
    if (!this.validateEmail(to)) return { code: 500, load: 'Invalid email address' }
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text })
      return { code: 200, load: info }
    } catch (error) {
      return { code: 500, load: error.message }
    }
  }

  async sendHtmlMail(to, subject, html) {
    if (!this.validateEmail(to)) return { code: 500, load: 'Invalid email address' }
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html })
      return { code: 200, load: info }
    } catch (error) {
      return { code: 500, load: error.message }
    }
  }

  async sendLegalNotice(to, caseTitle, message, options = {}) {
    const subject = caseTitle || '律师函通知'
    const footer = options.footer || '幽柠法庭'
    const extra = options.extra || ''
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;">
        <h2>律师函通知</h2>
        <p>${message || ''}</p>
        ${extra ? `<div>${extra}</div>` : ''}
        <hr/>
        <div style="color:#666;font-size:12px;">${footer}</div>
      </div>
    `
    return this.sendHtmlMail(to, subject, html)
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
}