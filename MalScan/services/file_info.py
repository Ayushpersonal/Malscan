def get_file_info(file_bytes: bytes) -> dict:
    """Extracts basic metadata of the file, such as its size."""
    return {
        "file_size": len(file_bytes)
    }
