import urllib.request
import json
import time
import socket
from urllib.error import URLError, HTTPError

# Flask API 的基础 URL
BASE_URL = "http://127.0.0.1:3366"
ENDPOINT = "/api/getList"
FULL_URL = BASE_URL + ENDPOINT


def test_successful_access():
    """测试正常从本地访问 API"""
    print("--- 测试 1: 正常访问 (/api/getList) ---")
    start_time = time.time()
    try:
        # 使用 urllib 发送 GET 请求
        with urllib.request.urlopen(FULL_URL) as response:
            end_time = time.time()
            elapsed_time = end_time - start_time
            status_code = response.getcode()
            body = response.read().decode('utf-8')

            print(f"请求URL: {FULL_URL}")
            print(f"HTTP状态码: {status_code}")
            print(f"响应时间: {elapsed_time:.4f} 秒")

            if status_code == 200:
                try:
                    data = json.loads(body)
                    print("响应数据 (前2条):")
                    # 打印前几条记录作为示例
                    for i, item in enumerate(data[:2]):
                        print(f"  [{i + 1}] {item}")
                    if len(data) > 2:
                        print(f"  ... (共返回 {len(data)} 条记录)")

                    # 简单验证数据结构
                    if data and isinstance(data, list):
                        first_item = data[0]
                        expected_keys = {'id', 'lastName', 'totalExp', 'totalTime', 'lastTime'}
                        if expected_keys.issubset(first_item.keys()):
                            print("✅ 数据结构校验通过 (包含预期字段)")
                        else:
                            print("⚠️  数据结构校验警告: 返回数据可能缺少某些预期字段")
                            print(f"     期望字段: {expected_keys}")
                            print(f"     实际字段: {first_item.keys()}")
                    else:
                        print("⚠️  响应数据为空或不是列表格式")

                except json.JSONDecodeError as ve:
                    print(f"❌ 响应不是有效的JSON格式: {ve}")
            else:
                print(f"❌ 请求失败: {body}")

    except HTTPError as e:
        print(f"❌ HTTP错误: {e.code} - {e.reason}")
    except URLError as e:
        print(f"❌ 连接失败: 无法连接到 {FULL_URL}。请确保 Flask 应用正在运行。错误: {e.reason}")
    except Exception as e:
        print(f"❌ 测试过程中发生未预期错误: {e}")
    print("-" * 40 + "\n")


def test_access_denied():
    """测试从非本地地址访问 (此测试需要特殊设置，此处仅演示逻辑)"""
    print("--- 测试 2: 模拟非本地访问 (受限于Flask配置，此测试主要为说明) ---")
    print("由于 Flask app.run(host='127.0.0.1') 的限制，外部IP无法直接访问此服务。")
    print("路由内部也检查了 REMOTE_ADDR。")
    print("在这里，我们简单地指出这一限制。")

    # 这里的测试逻辑在客户端很难完全模拟服务器视角的 REMOTE_ADDR，
    # 除非我们有办法控制发出的包或者在服务端有特殊的测试逻辑。
    # 所以我们保持原有的说明性打印。
    
    print("-" * 40 + "\n")


if __name__ == "__main__":
    print("开始测试 Flask API...\n")

    test_successful_access()
    test_access_denied()

    print("测试脚本执行完毕。")