import math

def calculate_entropy(data: bytes) -> float:
    """Computes Shannon entropy of binary data."""
    if not data:
        return 0.0
    
    entropy = 0.0
    byte_counts = [0] * 256
    for byte in data:
        byte_counts[byte] += 1
        
    total_len = len(data)
    for count in byte_counts:
        if count > 0:
            p = count / total_len
            entropy -= p * math.log2(p)
            
    return entropy

def get_sections_entropy(pe) -> dict:
    """Computes entropy for each section in the PE."""
    section_entropies = {}
    for section in pe.sections:
        try:
            name = section.Name.decode("utf-8", errors="ignore").strip("\x00").lower()
        except Exception:
            name = ""
        sec_data = section.get_data()
        section_entropies[name] = calculate_entropy(sec_data)
    return section_entropies
