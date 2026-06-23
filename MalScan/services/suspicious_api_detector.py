# High-risk Windows APIs commonly used in malware (injection, hooking, evasion, process manipulation)
SUSPICIOUS_APIS = {
    "virtualalloc", "virtualallocex", "virtualprotect", "virtualprotectex",
    "writeprocessmemory", "readprocessmemory", "createremotethread", "ntcreatethreadex",
    "openprocess", "getprocaddress", "loadlibrarya", "loadlibraryw", "loadlibraryexa",
    "setwindowshookex", "regcreatekeyexa", "regopenkeyexa", "regsetvalueex",
    "urldownloadtofilea", "urldownloadtofilew", "internetopenw", "internetconnectw",
    "httpopenrequestw", "httpsendrequestw", "winexec", "createprocessa", "createprocessw",
    "shellexecutea", "shellexecutew", "ntunmapviewofsection", "mapviewoffile"
}

def detect_suspicious_apis(pe) -> dict:
    """Scans the PE import tables and counts imported Win32 API functions on the blacklist."""
    num_imports = 0
    num_imported_dlls = 0
    suspicious_api_count = 0
    
    if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
        num_imported_dlls = len(pe.DIRECTORY_ENTRY_IMPORT)
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            for imp in entry.imports:
                num_imports += 1
                if imp.name:
                    try:
                        imp_name = imp.name.decode("utf-8", errors="ignore").lower()
                        if imp_name in SUSPICIOUS_APIS:
                            suspicious_api_count += 1
                    except Exception:
                        pass
                        
    return {
        "num_imports": num_imports,
        "num_imported_dlls": num_imported_dlls,
        "suspicious_api_count": suspicious_api_count
    }
