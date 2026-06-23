import requests
import time
import sys

# Connection addresses
url_health = "http://127.0.0.1:8000/health"
url_register = "http://127.0.0.1:8000/auth/register"
url_login = "http://127.0.0.1:8000/auth/login"
url_stats = "http://127.0.0.1:8000/dashboard/stats"
url_recent = "http://127.0.0.1:8000/dashboard/recent"
url_trends = "http://127.0.0.1:8000/dashboard/trends"
url_threat = "http://127.0.0.1:8000/dashboard/threat-distribution"

proxies = {"http": None, "https": None}

def test_dashboard():
    print("=== STARTING SOC DASHBOARD TELEMETRY TESTS ===")
    
    # 0. Wait for server to boot up
    print("Waiting for MalScan server to be healthy...")
    for i in range(10):
        try:
            r = requests.get(url_health, timeout=2, proxies=proxies)
            if r.status_code == 200:
                print("Server is healthy!")
                break
        except Exception:
            pass
        time.sleep(1)
    else:
        print("ERROR: Could not connect to MalScan server.")
        sys.exit(1)
        
    # 1. Register test user (using unique timestamped email)
    email = f"soc_operator_{int(time.time())}@malscan.com"
    payload_register = {
        "name": "SOC Test Analyst",
        "email": email,
        "password": "supersecurepassword123"
    }
    
    print(f"\n1a. Registering dynamic SOC user: {email}...")
    r = requests.post(url_register, json=payload_register, proxies=proxies)
    if r.status_code != 201:
        print("ERROR: Registration failed.")
        sys.exit(1)
        
    # 1b. Login with the user
    payload_login = {
        "email": email,
        "password": "supersecurepassword123"
    }
    
    print("\n1b. Authenticating user credentials...")
    r = requests.post(url_login, json=payload_login, proxies=proxies)
    if r.status_code != 200:
        print("ERROR: Authentication failed.")
        sys.exit(1)
        
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test GET /dashboard/stats
    print("\n2. Fetching dashboard stats telemetry...")
    r = requests.get(url_stats, headers=headers, proxies=proxies)
    print(f"   Status Code: {r.status_code}")
    print(f"   Response: {r.json()}")
    assert r.status_code == 200
    
    # 3. Test GET /dashboard/recent
    print("\n3. Fetching recent analysis logs...")
    r = requests.get(url_recent, headers=headers, proxies=proxies)
    print(f"   Status Code: {r.status_code}")
    print(f"   Response size: {len(r.json())}")
    for item in r.json():
        print(f"    - {item['filename']}: prediction={item['prediction']}, risk={item['risk_level']}")
    assert r.status_code == 200
    
    # 4. Test GET /dashboard/trends
    print("\n4. Fetching time-series trends...")
    r = requests.get(url_trends, headers=headers, proxies=proxies)
    print(f"   Status Code: {r.status_code}")
    trends = r.json()
    print(f"   Daily count size: {len(trends['daily_scans'])}")
    print(f"   Weekly count size: {len(trends['weekly_scans'])}")
    print(f"   Monthly count size: {len(trends['monthly_scans'])}")
    assert r.status_code == 200
    
    # 5. Test GET /dashboard/threat-distribution
    print("\n5. Fetching verdict distribution...")
    r = requests.get(url_threat, headers=headers, proxies=proxies)
    print(f"   Status Code: {r.status_code}")
    print(f"   Response: {r.json()}")
    assert r.status_code == 200
    
    print("\n=== ALL SOC DASHBOARD TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_dashboard()
