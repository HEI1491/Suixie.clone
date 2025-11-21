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

def fetch_top_50_longest_entries():
    """从数据库查询所有记录，按玩家(profile)分组计算总时长，并返回总时长最长的前50名玩家"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 查询所有记录，注意替换为真实的表名 playerban
        query = """
        SELECT *
        FROM playerban; -- 查询所有记录
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        # 获取列名
        column_names = [desc[0] for desc in cursor.description]

        # 将结果转换为字典列表
        all_records = []
        for row in rows:
            entry = dict(zip(column_names, row))
            all_records.append(entry)

        cursor.close()
        conn.close() # 确保连接关闭

        # --- 按玩家 (profile) 分组并计算总时长 ---
        player_duration_map = defaultdict(float) # 使用 defaultdict 初始化为 0.0
        # 如果需要存储玩家的其他信息（如最后一次记录），可以使用更复杂的字典结构
        # 例如: player_info_map = defaultdict(lambda: {'total_duration': 0.0, 'last_record': None})

        for record in all_records:
            try:
                profile_id = record['profile']
                create_time = record['createTime']
                end_time = record['endTime']

                # 解析时间字符串 (处理可能的微秒格式差异)
                if isinstance(create_time, str):
                    try:
                        create_time = datetime.strptime(create_time, "%Y-%m-%d %H:%M:%S.%f")
                    except ValueError:
                        create_time = datetime.strptime(create_time, "%Y-%m-%d %H:%M:%S")

                if isinstance(end_time, str):
                    try:
                        end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S.%f")
                    except ValueError:
                        end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")

                # 计算单条记录的时长 (秒)
                duration_seconds = (end_time - create_time).total_seconds()

                # 累加到对应玩家的总时长
                player_duration_map[profile_id] += duration_seconds

            except (KeyError, ValueError, TypeError) as e:
                print(f"警告：处理记录 {record} 时出错: {e}")
                # 可以选择跳过有问题的记录

        # --- 转换为列表并排序 ---
        # 将字典 {profile_id: total_duration} 转换为列表 [(profile_id, total_duration)]
        player_durations_list = list(player_duration_map.items())

        # 按总时长降序排序
        player_durations_list.sort(key=lambda x: x[1], reverse=True)

        # --- 构造最终返回结果 ---
        # 取前50名
        top_50_players = player_durations_list[:50]

        # 转换为包含所需信息的字典列表格式，方便JSON序列化
        # 这里我们返回 profile ID 和总秒数
        final_result = []
        for profile_id, total_seconds in top_50_players:
            final_result.append({
                'profile': profile_id,
                'total_duration_seconds': total_seconds
                # 如果需要更多信息，可以从原始记录中提取并关联
                # 例如，找到该玩家持续时间最长的一次记录，并附带其 reason 等信息
            })

        return final_result

    except Exception as e:
        print(f"数据库查询或处理失败: {e}")
        if conn:
            conn.close()
        raise

# ... (get_list 路由和其他部分保持不变) ...

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
        data = fetch_top_50_longest_entries()
        # 更新缓存
        cache['data'] = data
        cache['timestamp'] = current_time
        print("数据库查询完成并已缓存")
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch data: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3366, debug=True)