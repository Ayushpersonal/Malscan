import re

def analyze_strings(file_bytes: bytes) -> dict:
    """Extracts printable ASCII strings and counts indicators of potential malicious commands."""
    # Matches printable strings of length 4 or more
    ascii_strings = re.findall(b"[ -~]{4,}", file_bytes)
    
    suspicious_patterns = [
        re.compile(b"powershell", re.IGNORECASE),
        re.compile(b"cmd\\.exe", re.IGNORECASE),
        re.compile(b"http://", re.IGNORECASE),
        re.compile(b"https://", re.IGNORECASE),
        re.compile(b"sc\\.exe", re.IGNORECASE),
        re.compile(b"reg\\.exe", re.IGNORECASE)
    ]
    
    match_count = 0
    for s in ascii_strings:
        for pattern in suspicious_patterns:
            if pattern.search(s):
                match_count += 1
                
    return {
        "strings_count": len(ascii_strings),
        "suspicious_strings_count": match_count
    }
