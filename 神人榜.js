import pg from 'pg'
import express from 'express'
let config = {
    host: '183.131.51.178',
    user: 'postgres',
    password: '@3357',
    database: 'mdt',
    port: 5432
}

// 格式化时间显示
function formatTimePeriod(createTime, endTime) {
    const now = new Date();
    // 计算时间段
    const end = endTime ? new Date(endTime) : new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365 * 100); // 如果没有结束时间，默认100年后
    const start = new Date(createTime);
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);
    
    // 格式化显示
    if (diffYears > 0) {
        return `${diffYears}年`;
    } else if (diffDays > 0) {
        return `${diffDays}天`;
    } else if (diffHours > 0) {
        return `${diffHours}小时`;
    } else {
        return `${diffMinutes}分钟`;
    }
}

function main(){
    let client = new pg.Client(config)
    client.connect()
    let app = express()
    app.get('/api/bans', async (req, res) => {
        let result = await client.query('SELECT id, account, reason, operator, "createTime", "endTime" FROM public.playerban ORDER BY "createTime" DESC;')
        
        // 处理查询结果
        const bans = result.rows.map(ban => {
            // 判断是否已经解封
            const isUnbanned = ban.endTime && new Date(ban.endTime) < new Date();
            
            return {
                id: ban.id,
                account: ban.account,
                reason: ban.reason,
                operator: ban.operator,
                createTime: ban.createTime,
                endTime: ban.endTime,
                timePeriod: formatTimePeriod(ban.createTime, ban.endTime),
                isUnbanned: isUnbanned
            };
        });
        
        res.json(bans);
    })
    app.listen(1190, () => {
        console.log('神人榜服务启动在http://localhost:1190/api/bans');
    })
}

main()