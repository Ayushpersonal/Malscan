import time
import requests
import sys
from pathlib import Path

def run_tests():
    url_health = "http://127.0.0.1:8000/health"
    url_scan = "http://127.0.0.1:8000/scan"
    url_history = "http://127.0.0.1:8000/history"
    
    # Bypass system proxies
    proxies = {"http": None, "https": None}
    
    print("Testing connection to MalScan server at /health...")
    for i in range(10):
        try:
            r = requests.get(url_health, timeout=3, proxies=proxies)
            if r.status_code == 200:
                print("Server is healthy!")
                print(r.json())
                break
        except Exception as e:
            print(f"Connection attempt {i+1} failed: {e}")
        print("Waiting for server to startup...")
        time.sleep(2)
    else:
        print("Error: Could not connect to MalScan server.")
        sys.exit(1)

    # Find a test PE file (e.g. notepad.exe)
    test_pe_path = Path("C:/Windows/System32/notepad.exe")
    if not test_pe_path.exists():
        test_pe_path = Path("C:/Windows/notepad.exe")
        
    if not test_pe_path.exists():
        print("Error: Could not find a Windows PE file (notepad.exe) on the host to test scanning.")
        sys.exit(1)
        
    print(f"Reading test PE file from {test_pe_path}...")
    with open(test_pe_path, "rb") as f:
        file_bytes = f.read()

    print(f"Uploading file for scanning to {url_scan}...")
    files = {"file": ("notepad.exe", file_bytes, "application/octet-stream")}
    r = requests.post(url_scan, files=files, proxies=proxies)
    
    if r.status_code == 200:
        print("Scan completed successfully!")
        scan_data = r.json()
        print(f"Prediction: {scan_data['prediction']} (Confidence: {scan_data['confidence']})")
        print(f"Hashes: MD5={scan_data['md5']}, SHA256={scan_data['sha256']}")
        print("Mapped 33 process features (snippet):")
        for k, v in list(scan_data['features'].items())[:5]:
            print(f"  {k}: {v}")
    else:
        print(f"Scan failed with status {r.status_code}: {r.text}")

    print("\nFetching history from /history...")
    try:
        r = requests.get(url_history, proxies=proxies)
        if r.status_code == 200:
            print("History fetched successfully:")
            print(r.json())
        else:
            print(f"History endpoint status {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Failed to query history: {e}")

    print("\nFetching feature importance plot from /feature-importance...")
    try:
        url_importance = "http://127.0.0.1:8000/feature-importance"
        r = requests.get(url_importance, proxies=proxies)
        if r.status_code == 200:
            print(f"Feature importance image fetched successfully! (Size: {len(r.content)} bytes)")
        else:
            print(f"Feature importance endpoint status {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Failed to query feature importance: {e}")

if __name__ == "__main__":
    run_tests()

