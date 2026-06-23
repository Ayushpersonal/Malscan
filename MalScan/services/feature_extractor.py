import logging
import pefile

# Import modular analyzers
from MalScan.services.entropy import calculate_entropy
from MalScan.services.file_info import get_file_info
from MalScan.services.pe_parser import parse_pe_headers
from MalScan.services.strings_analyzer import analyze_strings
from MalScan.services.resource_analyzer import analyze_resources
from MalScan.services.suspicious_api_detector import detect_suspicious_apis
from MalScan.services.packer_detector import detect_packer
from MalScan.services.signature_checker import check_signature

logger = logging.getLogger("malscan.feature_extractor")

def is_microsoft_binary(pe) -> bool:
    """Checks if the PE file's version resource indicates it is from Microsoft."""
    if not hasattr(pe, "FileInfo"):
        return False
    try:
        for fileinfo in pe.FileInfo:
            if isinstance(fileinfo, list):
                for entry in fileinfo:
                    if hasattr(entry, "name") and entry.name == "StringFileInfo":
                        if hasattr(entry, "StringTable") and entry.StringTable:
                            for table in entry.StringTable:
                                if hasattr(table, "entries") and isinstance(table.entries, dict):
                                    comp_name = table.entries.get(b"CompanyName") or table.entries.get("CompanyName")
                                    if comp_name:
                                        if isinstance(comp_name, bytes):
                                            comp_name = comp_name.decode("utf-8", errors="ignore")
                                        if "microsoft" in comp_name.lower():
                                            return True
    except Exception as e:
        logger.warning(f"Error reading FileInfo resources: {e}")
    return False

def extract_static_features(file_bytes: bytes) -> dict:
    """
    Parses PE structure using individual sub-modules and compiles
    raw static heuristics.
    Raises ValueError if the file is not a valid PE binary.
    """
    try:
        pe = pefile.PE(data=file_bytes)
    except pefile.PEFormatError as e:
        logger.warning(f"File is not a valid PE binary: {e}")
        raise ValueError("Uploaded file is not a valid Portable Executable (PE) binary.")

    # 1. file_info
    info = get_file_info(file_bytes)
    
    # 2. entropy
    overall_entropy = calculate_entropy(file_bytes)
    
    # 3. pe_parser
    pe_details = parse_pe_headers(pe)
    
    # 4. strings_analyzer
    str_details = analyze_strings(file_bytes)
    
    # 5. resource_analyzer
    res_details = analyze_resources(pe)
    
    # 6. suspicious_api_detector
    api_details = detect_suspicious_apis(pe)
    
    # 7. packer_detector
    packer_details = detect_packer(pe)
    
    # 8. signature_checker
    sig_details = check_signature(pe)
    has_sig = sig_details["has_signature"]
    if not has_sig and is_microsoft_binary(pe):
        has_sig = 1
    
    # Close PE file handles
    pe.close()

    # Consolidate raw features
    return {
        "file_size": info["file_size"],
        "overall_entropy": overall_entropy,
        
        "image_size": pe_details["image_size"],
        "entry_point": pe_details["entry_point"],
        "uninitialized_data_size": pe_details["uninitialized_data_size"],
        "initialized_data_size": pe_details["initialized_data_size"],
        "num_sections": pe_details["num_sections"],
        "exec_sections_size": pe_details["exec_sections_size"],
        "write_exec_sections_count": pe_details["write_exec_sections_count"],
        
        "num_imports": api_details["num_imports"],
        "num_imported_dlls": api_details["num_imported_dlls"],
        "suspicious_api_count": api_details["suspicious_api_count"],
        
        "packer_detected": packer_details["packer_detected"],
        "has_signature": has_sig,
        
        "resources_count": res_details["resources_count"],
        "resources_size": res_details["resources_size"],
        
        # Extra heuristics tracking
        "strings_count": str_details["strings_count"],
        "suspicious_strings_count": str_details["suspicious_strings_count"]
    }

def map_pe_to_runtime_features(pe_feats: dict) -> dict:
    """
    Translates static PE analysis features into the 33 runtime process
    features expected by the XGBoost classifier model. Applies dampening
    if the file is digitally signed to prevent clean system files from
    artificially spiking the malware threshold.
    """
    has_sig = bool(pe_feats.get("has_signature", 0))
    dampening = 0.40 if has_sig else 1.0  # Apply 40% dampening if digitally signed
    
    # 1. Basic properties
    millisecond = 0
    state = 1 if (pe_feats["packer_detected"] and not has_sig) else 0
    usage_counter = 0
    
    # 2. Priorities (Base is typically 120 in Linux)
    # Scale down risk contribution of suspicious APIs and strings if signed
    suspicious_apis = pe_feats.get("suspicious_api_count", 0)
    suspicious_strings = pe_feats.get("suspicious_strings_count", 0)
    
    if has_sig:
        suspicious_apis = int(suspicious_apis * dampening)
        suspicious_strings = int(suspicious_strings * dampening)
        
    static_prio = 120 + suspicious_apis + (suspicious_strings // 5) - (5 if has_sig else 0)
    static_prio = max(100, min(139, static_prio))
    
    # Scale down priority offset for high-entropy sections if signed
    entropy_prio_offset = (pe_feats["overall_entropy"] - 5.0) * 2
    if has_sig:
        entropy_prio_offset *= dampening
    prio = int(static_prio + entropy_prio_offset)
    prio = max(100, min(139, prio))
    
    normal_prio = static_prio
    
    # 3. Policies & Offsets
    policy = 1 if (pe_feats["packer_detected"] and not has_sig) else 0
    vm_pgoff = int(pe_feats["entry_point"] / 4096)
    vm_truncate_count = pe_feats["write_exec_sections_count"]
    
    # 4. Sizes & Ranges
    task_size = pe_feats["image_size"]
    # Calculate free holes in allocation
    cached_hole_size = max(0, pe_feats["image_size"] - (pe_feats["exec_sections_size"] + pe_feats["initialized_data_size"]))
    free_area_cache = pe_feats["entry_point"]
    
    # 5. Shared & Users
    mm_users = max(1, pe_feats["num_imported_dlls"])
    map_count = pe_feats["num_sections"]
    hiwater_rss = pe_feats["image_size"] + pe_feats["resources_size"]
    
    # 6. Page allocations
    total_vm = int(pe_feats["image_size"] / 4096)
    shared_vm = int(pe_feats["initialized_data_size"] / 4096)
    exec_vm = int(pe_feats["exec_sections_size"] / 4096)
    reserved_vm = int(pe_feats["uninitialized_data_size"] / 4096)
    
    # Dampen virtual page metrics to simulate normal clean activity
    if has_sig:
        total_vm = int(total_vm * dampening)
        exec_vm = int(exec_vm * dampening)
        shared_vm = int(shared_vm * dampening)
        reserved_vm = int(reserved_vm * dampening)
        
    nr_ptes = int(pe_feats["image_size"] / (4096 * 512)) # Assuming standard page tables
    
    end_data = max(0, pe_feats["image_size"] - pe_feats["uninitialized_data_size"])
    last_interval = 0
    
    # 7. Context switches (voluntary vs involuntary)
    if has_sig:
        # Establish robust baseline activity levels for trusted system binaries,
        # then apply the dampening/normalization factor (e.g. 0.40) to these mapped features.
        nvcsw_base = 2500 + pe_feats["num_imports"] * 5
        nivcsw_base = 500 + int(pe_feats["overall_entropy"] * 12)
        nvcsw = int(nvcsw_base * dampening)
        nivcsw = int(nivcsw_base * dampening)
    else:
        nvcsw = max(0, pe_feats["num_imports"] * 5)
        nivcsw = max(0, int(pe_feats["overall_entropy"] * 12))
    
    # 8. Faults & Locks
    min_flt = max(1, int(pe_feats["file_size"] / 4096))
    maj_flt = 1 if (pe_feats["packer_detected"] and not has_sig) else 0
    fs_excl_counter = 0
    lock = 1 if has_sig else 0
    
    # 9. Execution Time Heuristics
    utime = int((pe_feats["exec_sections_size"] / 100) * (pe_feats["overall_entropy"] / 5.0))
    stime = max(0, pe_feats["num_imports"] * 2)
    
    if has_sig:
        utime = int(utime * dampening)
        stime = int(stime * dampening)
        
    gtime = 0
    cgtime = 0
    signal_nvcsw = nvcsw // 2
    
    return {
        "millisecond": millisecond,
        "state": state,
        "usage_counter": usage_counter,
        "prio": prio,
        "static_prio": static_prio,
        "normal_prio": normal_prio,
        "policy": policy,
        "vm_pgoff": vm_pgoff,
        "vm_truncate_count": vm_truncate_count,
        "task_size": task_size,
        "cached_hole_size": cached_hole_size,
        "free_area_cache": free_area_cache,
        "mm_users": mm_users,
        "map_count": map_count,
        "hiwater_rss": hiwater_rss,
        "total_vm": total_vm,
        "shared_vm": shared_vm,
        "exec_vm": exec_vm,
        "reserved_vm": reserved_vm,
        "nr_ptes": nr_ptes,
        "end_data": end_data,
        "last_interval": last_interval,
        "nvcsw": nvcsw,
        "nivcsw": nivcsw,
        "min_flt": min_flt,
        "maj_flt": maj_flt,
        "fs_excl_counter": fs_excl_counter,
        "lock": lock,
        "utime": utime,
        "stime": stime,
        "gtime": gtime,
        "cgtime": cgtime,
        "signal_nvcsw": signal_nvcsw
    }

def extract_all(file_bytes: bytes) -> dict:
    """
    Consolidates static analysis features and converts them to
    the 33-column dict layout expected by the model.
    """
    raw_feats = extract_static_features(file_bytes)
    mapped_feats = map_pe_to_runtime_features(raw_feats)
    return mapped_feats
