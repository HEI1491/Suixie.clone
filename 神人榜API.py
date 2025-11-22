import psycopg2
from flask import Flask, jsonify, request
import time
from datetime import datetime
from collections import defaultdict # 引入 defaultdict 便于分组求和

app = Flask(__name__)

# --- 数据库配置 ---
DB_CONFIG = {
    'host': '183.131.51.178',
    'port': 5432,
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
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"数据库连接失败: {e}")
        raise

def fetch_top_50_players():
    """从数据库查询 PlayerProfile 表，按 totalExp 降序排列，返回前50名玩家"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 查询 PlayerProfile 表，按经验值降序排序
        # 注意：表名和字段名在 PostgreSQL 中如果创建时加了引号（Exposed 默认行为），查询时也需要加引号
        query = """
        SELECT "id", "lastName", "totalExp", "totalTime", "lastTime"
        FROM "PlayerProfile"
        ORDER BY "totalExp" DESC
        LIMIT 50;
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        # 获取列名
        column_names = [desc[0] for desc in cursor.description]

        # 将结果转换为字典列表
        final_result = []
        for row in rows:
            entry = dict(zip(column_names, row))
            # 处理时间对象，转为字符串以便 JSON 序列化
            if 'lastTime' in entry and isinstance(entry['lastTime'], datetime):
                entry['lastTime'] = entry['lastTime'].strftime("%Y-%m-%d %H:%M:%S")
            
            final_result.append(entry)

        cursor.close()
        conn.close()

        return final_result

    except Exception as e:
        print(f"数据库查询或处理失败: {e}")
        if conn:
            conn.close()
        raise

@app.route('/api/getList', methods=['GET'])
def get_list():
    """API 路由：获取排序后的列表"""

    # 检查是否允许访问
    client_ip = request.environ.get('REMOTE_ADDR')
    if client_ip != '127.0.0.1':
        return jsonify({'error': 'Access denied'}), 403

    current_time = time.time()

    # 检查缓存是否有效
    if cache['data'] is not None and (current_time - cache['timestamp']) < CACHE_DURATION:
        print("返回缓存数据")
        return jsonify(cache['data'])

    try:
        print("正在查询数据库...")
        data = fetch_top_50_players()
        # 更新缓存
        cache['data'] = data
        cache['timestamp'] = current_time
        print("数据库查询完成并已缓存")
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch data: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3366, debug=True)