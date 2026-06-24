import urllib.request
import os

screens = {
    "shader.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NmMjg1MzUwZGYwNTRkYzE5OGE4OTEzZmE5YTA0ZTQ4EgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "auth.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Q0YzhiN2MyNjNkOTQyNGQ4N2M0MjQ2MTllNzg5Zjc2EgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "dashboard.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NGY3Nzk2MWVjYzIwMGRiNDA2Y2NiMTlhZTczEgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "file_scan.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NGY3N2IwOWMwYjMwMWE2MzNiMGZiMjQ4NGVlEgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "scan_result.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NGY3N2I3YTdhYzIwNTQ5YzJhNzQ3MmNiYTlhEgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "history_profile.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1NGY3N2Q2MzY0ZTUwOTI1ZDE4ZDkyMzY3NWU4EgsSBxDJ1bTp-xAYAZIBIwoKcHJvamVjdF9pZBIVQhM3MTIyMjM0Mzc2NDUwMTc2Mzkw&filename=&opi=89354086",
    "image.png": "https://lh3.googleusercontent.com/aida/AP1WRLtOpGICewMZR9OHQ2aSz-_Xga1dW39XAh_8po8UNlTL1WMdpNn0exqX3wasVc78UeV2jHcy39McKucWxAb5ZCN2JfpavjOiYCNRoT3LKiL2t3si4MJ0f5pRTf2CrftJKDmEqLhJtXLJF4DQ1UlOoczCSa6gfiVA0nTqTPKVQQajmGCqQTDE6ParFttfcJSi3vY1DDoSmU8wGJZFGKH6vg2jnUcrYM9ulJkMPDe0T_rFGrLw9oxfprJBK_-3mhavC3hMmn6LP-pv"
}

os.makedirs("downloads", exist_ok=True)
for filename, url in screens.items():
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, os.path.join("downloads", filename))
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
