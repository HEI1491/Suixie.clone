import requests
import time

# Flask API 的基础 URL
BASE_URL = "http://127.0.0.1:3366"
ENDPOINT = "/api/getList"
FULL_URL = BASE_URL + ENDPOINT


def test_successful_access():
    """测试正常从本地访问 API"""
    print("--- 测试 1: 正常访问 (/api/getList) ---")
    start_time = time.time()
    try:
        # 使用 requests 发送 GET 请求
        response = requests.get(FULL_URL)
        end_time = time.time()
        elapsed_time = end_time - start_time

        print(f"请求URL: {FULL_URL}")
        print(f"HTTP状态码: {response.status_code}")
        print(f"响应时间: {elapsed_time:.4f} 秒")

        if response.status_code == 200:
            try:
                data = response.json()
                print("响应数据 (前2条):")
                # 打印前几条记录作为示例
                for i, item in enumerate(data[:2]):
                    print(f"  [{i + 1}] {item}")
                if len(data) > 2:
                    print(f"  ... (共返回 {len(data)} 条记录)")

                # 简单验证数据结构
                if data and isinstance(data, list):
                    first_item = data[0]
                    expected_keys = {'id', 'profile', 'reason', 'operator', 'createTime', 'endTime', 'duration_seconds'}
                    if expected_keys.issubset(first_item.keys()):
                        print("✅ 数据结构校验通过 (包含预期字段)")
                    else:
                        print("⚠️  数据结构校验警告: 返回数据可能缺少某些预期字段")
                        print(f"     期望字段: {expected_keys}")
                        print(f"     实际字段: {first_item.keys()}")
                else:
                    print("⚠️  响应数据为空或不是列表格式")

            except ValueError as ve:  # json.JSONDecodeError is a subclass of ValueError in Python 3.5+
                print(f"❌ 响应不是有效的JSON格式: {ve}")
        else:
            print(f"❌ 请求失败: {response.text}")

    except requests.exceptions.ConnectionError:
        print(f"❌ 连接失败: 无法连接到 {FULL_URL}。请确保 Flask 应用正在运行。")
    except Exception as e:
        print(f"❌ 测试过程中发生未预期错误: {e}")
    print("-" * 40 + "\n")


def test_access_denied():
    """测试从非本地地址访问 (此测试需要特殊设置，此处仅演示逻辑)"""
    # 注意：requests 库本身不能轻易伪造 REMOTE_ADDR。
    # Flask 的 host='127.0.0.1' 已经阻止了外部IP访问。
    # 这个测试主要是为了说明目的。
    # 如果你想测试路由内部的IP检查，你可能需要使用反向代理(如nginx)或修改WSGI environ。
    print("--- 测试 2: 模拟非本地访问 (受限于Flask配置，此测试主要为说明) ---")
    print("由于 Flask app.run(host='127.0.0.1') 的限制，外部IP无法直接访问此服务。")
    print("路由内部也检查了 REMOTE_ADDR。")
    print("要完全模拟此场景，通常需要在 Flask 前面放置一个反向代理并修改请求头，")
    print("或者直接测试当 REMOTE_ADDR 不是 127.0.0.1 时路由的行为。")
    print("在这里，我们简单地指出这一限制。")

    # 为了演示路由内的检查，我们可以尝试访问，但它会被 Flask 的 host 设置首先拦截。
    try:
        # 这个请求实际上不会到达路由函数，因为 Flask 绑定到了 127.0.0.1
        # 但从概念上讲，如果 Flask 绑定到了 0.0.0.0，这个检查就会起作用。
        response = requests.get(FULL_URL)
        # 如果 somehow 到达了路由，检查返回内容
        if response.status_code == 403:
            print(f"✅ (如果能到达路由) IP检查生效: 收到 403 Forbidden")
        elif response.status_code == 200:
            print(f"⚠️  (如果能到达路由) 意外收到 200 OK，可能IP检查未生效或测试环境特殊")
        else:
            print(f"ℹ️  (如果能到达路由) 收到其他状态码: {response.status_code}")

    except requests.exceptions.ConnectionError:
        print(f"ℹ️  如预期，无法从外部网络连接到绑定在 127.0.0.1 的服务。")
    except Exception as e:
        print(f"ℹ️  测试过程中发生错误: {e}")

    print("-" * 40 + "\n")


if __name__ == "__main__":
    print("开始测试 Flask API...\n")

    test_successful_access()
    test_access_denied()

    print("测试脚本执行完毕。")