def analyze_resources(pe) -> dict:
    """Safely traverses PE resources to count and measure total resource sizes."""
    resources_count = 0
    resources_size = 0
    
    if hasattr(pe, "DIRECTORY_ENTRY_RESOURCE"):
        def recurse_resources(dir_entry):
            count = 0
            size = 0
            if hasattr(dir_entry, "entries"):
                for entry in dir_entry.entries:
                    if hasattr(entry, "directory"):
                        c, s = recurse_resources(entry.directory)
                        count += c
                        size += s
                    elif hasattr(entry, "data"):
                        count += 1
                        size += getattr(entry.data.struct, "Size", 0)
            return count, size

        resources_count, resources_size = recurse_resources(pe.DIRECTORY_ENTRY_RESOURCE)
        
    return {
        "resources_count": resources_count,
        "resources_size": resources_size
    }
