def parse_pe_headers(pe) -> dict:
    """Extracts structural PE header and section layout properties."""
    image_size = getattr(pe.OPTIONAL_HEADER, "SizeOfImage", 0)
    entry_point = getattr(pe.OPTIONAL_HEADER, "AddressOfEntryPoint", 0)
    uninitialized_data_size = getattr(pe.OPTIONAL_HEADER, "SizeOfUninitializedData", 0)
    initialized_data_size = getattr(pe.OPTIONAL_HEADER, "SizeOfInitializedData", 0)
    
    num_sections = len(pe.sections)
    exec_sections_size = 0
    write_exec_sections_count = 0
    
    for section in pe.sections:
        char = getattr(section, "Characteristics", 0)
        # IMAGE_SCN_MEM_EXECUTE = 0x20000000
        # IMAGE_SCN_MEM_WRITE = 0x80000000
        is_exec = bool(char & 0x20000000)
        is_write = bool(char & 0x80000000)
        
        if is_exec:
            exec_sections_size += getattr(section, "SizeOfRawData", 0)
            if is_write:
                write_exec_sections_count += 1
                
    return {
        "image_size": image_size,
        "entry_point": entry_point,
        "uninitialized_data_size": uninitialized_data_size,
        "initialized_data_size": initialized_data_size,
        "num_sections": num_sections,
        "exec_sections_size": exec_sections_size,
        "write_exec_sections_count": write_exec_sections_count
    }
