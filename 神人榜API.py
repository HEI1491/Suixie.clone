import psycopg2
from flask import Flask, jsonify, request
import time
from datetime import datetime
from collections import defaultdict # 引入 defaultdict 便于分组求和

app = Flask(__name__)

# --- 数据库配置 ---
DB_CONFIG = {
    'host': '110.42.96.105',
    'port': 50333,
    'database': 'mdt', # 注意：JDBC URL 显示数据库名是 'mdt'
    'user': 'postgres',
    'password': '@3357'
}

# --- 缓存配置 ---
CACHE_DURATION = 60  # 缓存有效期 (秒)
cache = {
    'data': None,
    'timestamp': 0
}

def get_db_connection():
    """建立并返回一个数据库连接"""
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

def fetch_top_50_players():
    """从数据库查询 PlayerProfile 表，按 totalExp 降序排列，返回前50名玩家"""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT "id", "lastName", "totalExp", "totalTime", "lastTime"
    FROM "PlayerProfile"
    ORDER BY "totalExp" DESC
    LIMIT 50;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    column_names = [desc[0] for desc in cursor.description]
    final_result = []
    for row in rows:
        entry = dict(zip(column_names, row))
        if 'lastTime' in entry and isinstance(entry['lastTime'], datetime):
            entry['lastTime'] = entry['lastTime'].strftime("%Y-%m-%d %H:%M:%S")
        final_result.append(entry)
    cursor.close()
    conn.close()
    return final_result

@app.route('/api/getList', methods=['GET'])
def get_list():
    """API 路由：获取排序后的列表"""
    client_ip = request.environ.get('REMOTE_ADDR')
    if client_ip != '127.0.0.1':
        return jsonify({'error': 'Access denied'}), 403
    current_time = time.time()
    if cache['data'] is not None and (current_time - cache['timestamp']) < CACHE_DURATION:
        return jsonify(cache['data'])
    data = fetch_top_50_players()
    cache['data'] = data
    cache['timestamp'] = current_time
    return jsonify(data)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3366, debug=True)