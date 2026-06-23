from MalScan.services.entropy import calculate_entropy

# Known packer section names or indicators
PACKER_SECTION_HEADERS = {
    "upx0", "upx1", "upx2", "aspack", "ptext", "nspack", "themida", "vmp0", "vmp1", "vmp2",
    "winlicense", "pack", "petite", "pecompat", "pec2", "pebundle"
}

def detect_packer(pe) -> dict:
    """Checks section names and section entropy for packer/crypter indicators."""
    packer_detected = 0
    
    for section in pe.sections:
        try:
            name = section.Name.decode("utf-8", errors="ignore").strip("\x00").lower()
        except Exception:
            name = ""
            
        # Check signature header names
        if any(ph in name for ph in PACKER_SECTION_HEADERS):
            packer_detected = 1
            break
            
        # Check entropy of the section
        sec_data = section.get_data()
        sec_entropy = calculate_entropy(sec_data)
        if sec_entropy > 7.2:
            packer_detected = 1
            break
            
    return {
        "packer_detected": packer_detected
    }
