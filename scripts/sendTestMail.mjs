import SendMail from '../SendMail.js'

const to = process.argv[2] || '48266515@qq.com'
const subject = process.argv[3] || '测试通讯'
const text = process.argv[4] || '这是一封QQ邮箱测试通讯邮件。'

const run = async () => {
  const mailer = new SendMail()
  const res = await mailer.sendMail(to, subject, text)
  console.log(JSON.stringify(res))
}

run().catch(e => { console.error(e) })