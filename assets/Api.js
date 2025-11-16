class Api{
    constructor(){
        this.base = (typeof window !== 'undefined' ? window.location.origin : '') + "/api";
        this.token = localStorage.getItem('userToken') || null; // 内部存储token
        this.ApiList = {
            "test":"/status",
            "sendCode":"/genMailCode",
            "register":"/register",
            "login":"/login",
            "recover":"/recover",
            "sign":"/sign",
        }
        console.info(`已挂载路由：${this.base}，已录入Api列表：${Object.keys(this.ApiList)}`)
    }
    async sendCode(mail){
        // 检查邮箱是否提供
        if (!mail) {
            throw {
                status: 400,
                reason: "Missing email"
            };
        }
        // 检查邮箱格式是否有效
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mail)) {
            throw {
                status: 400,
                reason: "Invalid email format"
            };
        }
        try {
            // 发送GET请求
            const response = await fetch(`${this.base}${this.ApiList.sendCode}?mail=${encodeURIComponent(mail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.status === 200) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        status: 200,
                        code: data.code
                    };
                } else {
                    throw {
                        status: response.status,
                        reason: "Invalid response format"
                    };
                }
            } else if (response.status === 400) {
                const data = await response.json();
                throw {
                    status: 400,
                    reason: data.reason
                };
            } else {
                throw {
                    status: response.status,
                    reason: "Unknown error"
                };
            }
        } catch (error) {
            throw {
                status: 0,
                reason: "Network error or server unavailable"
            };
        }
    }
    async login(account, password){
        try {
            // 发送POST请求进行登录
            const response = await fetch(`${this.base}${this.ApiList.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: "username",
                    identifier: account,
                    password: password
                }),
                credentials: 'include'
            });
            
            if (response.status === 200) {
                const data = await response.json();
                if (data.status === "success") {
                    this.token = data.token;
                    localStorage.setItem('userToken', data.token);
                    console.log('Saved token:', data.token); // 打印保存的token到控制台
                    return {
                        status: 200,
                        token: data.token
                    };
                } else {
                    throw {
                        status: response.status,
                        reason: data.reason || "Login failed"
                    };
                }
            } else if (response.status === 400 || response.status === 401) {
                const data = await response.json();
                throw {
                    status: response.status,
                    reason: data.reason || "Authentication failed"
                };
            } else {
                throw {
                    status: response.status,
                    reason: "Unknown error"
                };
            }
        } catch (error) {
            throw {
                status: 0,
                reason: "Network error or server unavailable"
            };
        }
    }
    async register(account, password, code){
        // 检查用户名是否提供
        if (!account) {
            throw {
                status: 400,
                reason: "Missing username"
            };
        }
        // 检查密码是否提供
        if (!password) {
            throw {
                status: 400,
                reason: "Missing password"
            };
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw {
                status: 400,
                reason: "Weak password"
            };
        }
        // 检查验证码是否提供
        if (!code) {
            throw {
                status: 400,
                reason: "Missing mail code"
            };
        }
        // 检查验证码是否为数字
        if (isNaN(code)) {
            throw {
                status: 400,
                reason: "Your mail code is a string!"
            };
        }
        try {
            // 发送GET请求
            const params = new URLSearchParams({
                username: account,
                password: password,
                mailCode: code
            }).toString();
            const response = await fetch(`${this.base}${this.ApiList.register}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            if (response.status === 200 && data.status === "success") {
                // 如果注册接口也返回token，保存到本地存储
                if (data.token) {
                    localStorage.setItem('userToken', data.token);
                }
                return {
                    status: 200,
                    message: "Registration successful"
                };
            } else if (response.status === 400) {
                throw {
                    status: 400,
                    reason: data.reason || "Bad request"
                };
            } else {
                throw {
                    status: response.status,
                    reason: data.reason || "Unknown error"
                };
            }
        } catch (error) {
            // 只有在网络错误时才返回Network error
            if (error.status && error.reason) {
                throw error; // 重新抛出已知错误
            }
            throw {
                status: 0,
                reason: "Network error or server unavailable"
            };
        }
    }
    async recover(account){
        try {
            // 发送GET请求进行密码恢复
            const response = await fetch(`${this.base}${this.ApiList.recover}?username=${encodeURIComponent(account)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.status === 200) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        status: 200,
                        message: "Recovery successful"
                    };
                } else {
                    throw {
                        status: response.status,
                        reason: data.reason || "Recovery failed"
                    };
                }
            } else if (response.status === 400) {
                const data = await response.json();
                throw {
                    status: 400,
                    reason: data.reason || "Bad request"
                };
            } else {
                throw {
                    status: response.status,
                    reason: "Unknown error"
                };
            }
        } catch (error) {
            throw {
                status: 0,
                reason: "Network error or server unavailable"
            };
        }
    }
    async sign(account){
        // 使用内部存储的token
        if (!this.token) {
            throw {
                status: 401,
                reason: "No token available"
            };
        }
        
        try {
            // 发送GET请求进行签到
            const response = await fetch(`${this.base}${this.ApiList.sign}?username=${encodeURIComponent(account)}&token=${encodeURIComponent(this.token)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.status === 200) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        status: 200,
                        message: "Sign successful"
                    };
                } else {
                    throw {
                        status: response.status,
                        reason: data.reason || "Sign failed"
                    };
                }
            } else if (response.status === 400 || response.status === 401) {
                const data = await response.json();
                throw {
                    status: response.status,
                    reason: data.reason || "Authentication failed"
                };
            } else {
                throw {
                    status: response.status,
                    reason: "Unknown error"
                };
            }
        } catch (error) {
            throw {
                status: 0,
                reason: "Network error or server unavailable"
            };
        }
    }
}
export default function start(){
    window.$Api = new Api();
}
