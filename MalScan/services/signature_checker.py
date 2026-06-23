import pefile

def check_signature(pe) -> dict:
    """Verifies if the file contains digital signature structure blocks."""
    has_signature = 0
    try:
        security_dir = pe.OPTIONAL_HEADER.DATA_DIRECTORY[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_SECURITY']]
        if security_dir.VirtualAddress > 0 and security_dir.Size > 0:
            has_signature = 1
    except Exception as e:
        pass
        
    return {
        "has_signature": has_signature
    }
