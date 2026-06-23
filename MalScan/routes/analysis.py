import io
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from pymongo import UpdateOne

from MalScan.database import get_collection, get_hashes_collection
from MalScan.auth_utils import get_current_user

logger = logging.getLogger("malscan.routes.analysis")
router = APIRouter()

# ---------------------------------------------------------------------------
# RECOMMENDATION ENGINE
# ---------------------------------------------------------------------------

def generate_security_advisories(doc: dict) -> List[str]:
    """
    Deterministic rule-based recommendation engine.
    Inspects raw scan features stored in MongoDB to emit actionable advisories.
    """
    advisories = []
    features = doc.get("features", {})
    prediction = doc.get("prediction", "")
    confidence = doc.get("confidence", 0.0)
    filename = doc.get("filename", "")

    # --- Entropy check ---
    # overall_entropy is in raw_feats but stored embedded; estimate from mapped features
    # task_size / hiwater_rss can hint at image size. We use 'lock' field (signature presence)
    # and 'prio' to approximate. However to be precise we store raw static feats too.
    # For advisories we use what is available from the mapped features.

    has_signature = features.get("lock", 0) == 1

    # Detect high activity patterns that correlate with packers
    nivcsw = features.get("nivcsw", 0)
    nvcsw = features.get("nvcsw", 0)
    suspicious_apis_approx = features.get("state", 0)  # state=1 implies packer+unsigned
    prio = features.get("prio", 120)
    static_prio = features.get("static_prio", 120)
    vm_truncate = features.get("vm_truncate_count", 0)
    policy = features.get("policy", 0)

    # Heuristic: high static_prio deviation from 120 implies suspicious API inflation
    api_pressure = static_prio - 120
    if api_pressure > 5:
        advisories.append(
            f"ALERT: Binary requests invasive execution capabilities matching process injection "
            f"or dynamic defense evasion patterns. (Derived API pressure index: {api_pressure})"
        )

    # Unsigned binary check (lock == 0 means no signature)
    if not has_signature:
        advisories.append(
            "WARNING: Binary lacks verified authentic digital signatures. "
            "Validate certificate chain against trusted root authorities before execution."
        )

    # Packer detection heuristic: state=1 or policy=1 indicates packer+unsigned
    if suspicious_apis_approx == 1 or policy == 1:
        advisories.append(
            "CRITICAL: High Shannon entropy indicating cryptographic packers or obfuscation "
            "wrapping. Binary sections exhibit packer signatures consistent with known evasion frameworks."
        )
    elif prio > 128 and not has_signature:
        advisories.append(
            "WARNING: Binary scheduling priority mapping indicates elevated process manipulation "
            "potential. Review imported DLL dependency chains for injection vectors."
        )

    # High involuntary context switches suggest evasive timing patterns
    if nivcsw > 150 and not has_signature:
        advisories.append(
            "NOTICE: Elevated involuntary context switch mapping indicates potential timing-based "
            "execution evasion or anti-debugging thread manipulation patterns."
        )

    # Write+execute section warning
    if vm_truncate > 0:
        advisories.append(
            f"CRITICAL: Binary contains {vm_truncate} section(s) with combined write+execute "
            "permissions. This is a primary indicator of shellcode staging or in-memory PE injection."
        )

    # Prediction-specific advisories
    if prediction == "malware":
        advisories.append(
            f"THREAT CLASSIFICATION: XGBoost classifier flagged this binary as MALICIOUS with "
            f"{(confidence * 100):.2f}% confidence. Immediate isolation recommended."
        )
        advisories.append(
            "REMEDIATION: Quarantine the binary immediately. Submit SHA256 hash to threat "
            "intelligence feeds (VirusTotal, MalwareBazaar) for cross-vendor verification."
        )
    else:
        advisories.append(
            f"CLASSIFICATION: XGBoost classifier verified this binary as BENIGN with "
            f"{(confidence * 100):.2f}% confidence. Standard operational clearance granted."
        )

    if not advisories:
        advisories.append(
            "INFO: No significant threat indicators detected. Binary exhibits standard "
            "structural characteristics consistent with clean executables."
        )

    return advisories


# ---------------------------------------------------------------------------
# PDF REPORT GENERATOR
# ---------------------------------------------------------------------------

def build_pdf_report(doc: dict, advisories: List[str]) -> bytes:
    """
    Generates a complete MalScan PDF report using fpdf2.
    Returns raw bytes of the PDF file.
    """
    from fpdf import FPDF, XPos, YPos

    class MalScanPDF(FPDF):
        def header(self):
            self.set_fill_color(10, 10, 12)
            self.rect(0, 0, 210, 30, 'F')
            self.set_font("Helvetica", "B", 18)
            self.set_text_color(0, 229, 255)
            self.set_y(8)
            self.cell(0, 10, "MALSCAN PE SECURITY ANALYSIS REPORT", align="C",
                      new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_font("Helvetica", "", 9)
            self.set_text_color(142, 145, 154)
            self.cell(0, 6, "Production Static Heuristics + XGBoost Runtime Process Classifier",
                      align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_y(32)

        def footer(self):
            self.set_y(-14)
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(142, 145, 154)
            self.cell(0, 10, f"MalScan PE Engine  |  Report generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC  |  Page {self.page_no()}",
                      align="C")

    pdf = MalScanPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    features = doc.get("features", {})
    prediction = doc.get("prediction", "unknown")
    confidence = doc.get("confidence", 0.0)
    is_malware = prediction.lower() == "malware" or prediction == "1"

    def section_title(title: str):
        pdf.set_fill_color(17, 18, 22)
        pdf.set_draw_color(30, 32, 40)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(0, 229, 255)
        pdf.set_y(pdf.get_y() + 4)
        pdf.cell(0, 9, f"  {title}", border=1, fill=True,
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_y(pdf.get_y() + 2)

    def key_value_row(label: str, value: str, alternate: bool = False):
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(142, 145, 154)
        if alternate:
            pdf.set_fill_color(20, 21, 28)
        else:
            pdf.set_fill_color(17, 18, 22)
        pdf.cell(65, 7, f"  {label}", fill=True, new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(240, 242, 246)
        pdf.cell(0, 7, f"  {value}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # === SECTION 1: TARGET METADATA ===
    section_title("1. TARGET BINARY METADATA")
    rows = [
        ("Filename", doc.get("filename", "N/A")),
        ("SHA256", doc.get("sha256", "N/A")),
        ("SHA1", doc.get("sha1", "N/A")),
        ("MD5", doc.get("md5", "N/A")),
        ("Analysis Timestamp", doc.get("timestamp", "N/A")),
        ("Operator ID", str(doc.get("user_id", "Anonymous"))),
    ]
    for i, (k, v) in enumerate(rows):
        # Truncate long hashes so they fit
        display_v = str(v)
        if len(display_v) > 60:
            display_v = display_v[:57] + "..."
        key_value_row(k, display_v, i % 2 == 1)

    pdf.set_y(pdf.get_y() + 3)

    # === SECTION 2: VERDICT CARD ===
    section_title("2. CLASSIFICATION VERDICT")
    verdict_color = (255, 23, 68) if is_malware else (0, 230, 118)
    verdict_text = "MALICIOUS — HIGH THREAT DETECTED" if is_malware else "BENIGN — TRUSTED EXECUTABLE"
    pdf.set_fill_color(*verdict_color)
    pdf.set_text_color(10, 10, 12)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 12, f"  {verdict_text}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_y(pdf.get_y() + 2)

    key_value_row("Prediction Label", prediction.upper(), False)
    key_value_row("Model Confidence", f"{(confidence * 100):.4f}%", True)
    key_value_row("Digital Signature", "PRESENT (lock=1)" if features.get("lock", 0) else "ABSENT (lock=0)", False)
    key_value_row("Write+Exec Sections", str(features.get("vm_truncate_count", 0)), True)

    pdf.set_y(pdf.get_y() + 3)

    # === SECTION 3: MAPPED FEATURE ANALYSIS (33 process features) ===
    section_title("3. XGBoost RUNTIME FEATURE MAPPING (33 Parameters)")

    FEATURE_LABELS = {
        "millisecond": "Scanning Timing Offset",
        "state": "Task Execution State",
        "usage_counter": "Task Struct Usage Counter",
        "prio": "Dynamic Scheduling Priority",
        "static_prio": "Static Base Priority",
        "normal_prio": "Normal Base Priority",
        "policy": "Scheduling Policy",
        "vm_pgoff": "VM Area Page Offset",
        "vm_truncate_count": "Write+Exec Sections Count",
        "task_size": "Virtual Space Image Size",
        "cached_hole_size": "Address Space Hole (bytes)",
        "free_area_cache": "Free Area Cache Pointer",
        "mm_users": "Active Virtual Machine Users",
        "map_count": "Mapped Memory Areas",
        "hiwater_rss": "Peak Resident Set Size",
        "total_vm": "Total Virtual Memory Pages",
        "shared_vm": "Shared Memory Pages",
        "exec_vm": "Executable Memory Pages",
        "reserved_vm": "Reserved Memory Pages",
        "nr_ptes": "Page Table Entry Count",
        "end_data": "Data Segment End Address",
        "last_interval": "Thrashing Threshold Time",
        "nvcsw": "Voluntary Context Switches",
        "nivcsw": "Involuntary Context Switches",
        "min_flt": "Minor Page Faults",
        "maj_flt": "Major Page Faults",
        "fs_excl_counter": "File System Lock Counter",
        "lock": "Read-Write Lock (Signature)",
        "utime": "User Mode CPU Time",
        "stime": "System Mode CPU Time",
        "gtime": "Guest CPU Execution Time",
        "cgtime": "Cumulative Guest CPU Time",
        "signal_nvcsw": "Cumulative Signal Switch",
    }

    for i, (key, label) in enumerate(FEATURE_LABELS.items()):
        val = features.get(key, "N/A")
        key_value_row(label, str(val), i % 2 == 1)

    pdf.set_y(pdf.get_y() + 3)

    # === SECTION 4: SECURITY ADVISORIES ===
    pdf.add_page()
    section_title("4. RULE-BASED SECURITY ADVISORIES")

    ADVISORY_COLORS = {
        "CRITICAL": (255, 23, 68),
        "ALERT": (255, 145, 0),
        "WARNING": (255, 193, 7),
        "NOTICE": (0, 229, 255),
        "THREAT": (255, 23, 68),
        "REMEDIATION": (213, 0, 249),
        "CLASSIFICATION": (0, 230, 118),
        "INFO": (142, 145, 154),
    }

    for i, advisory in enumerate(advisories):
        prefix = advisory.split(":")[0].upper()
        color = ADVISORY_COLORS.get(prefix, (240, 242, 246))

        pdf.set_fill_color(17, 18, 22)
        pdf.set_draw_color(*color)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*color)

        # Draw colored left border by drawing a filled rect
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.rect(x, y, 3, 16, 'F')

        pdf.set_x(x + 5)
        # Print wrapped advisory text
        text_lines = []
        words = advisory.split()
        current_line = ""
        max_chars = 90
        for word in words:
            if len(current_line) + len(word) + 1 <= max_chars:
                current_line = current_line + " " + word if current_line else word
            else:
                text_lines.append(current_line)
                current_line = word
        if current_line:
            text_lines.append(current_line)

        pdf.set_text_color(*color)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_x(x + 5)
        pdf.cell(0, 6, text_lines[0] if text_lines else advisory[:80],
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if len(text_lines) > 1:
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(240, 242, 246)
            for line in text_lines[1:]:
                pdf.set_x(x + 5)
                pdf.cell(0, 5, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_y(pdf.get_y() + 3)

    # === SECTION 5: DISCLAIMER ===
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(142, 145, 154)
    disclaimer = (
        "DISCLAIMER: This report is generated by automated static heuristic analysis. "
        "Results represent probabilistic classification and should be validated by a certified "
        "malware analyst before acting on threat intelligence. MalScan classification does not "
        "constitute legal evidence of malicious intent."
    )
    pdf.multi_cell(0, 5, disclaimer)

    return bytes(pdf.output())


# ---------------------------------------------------------------------------
# ENDPOINT: GET /report/{scan_id}  — Stream PDF report
# ---------------------------------------------------------------------------

@router.get("/report/{scan_id}")
async def get_scan_report(
    scan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Verifies ownership of the scan record, generates a programmatic PDF
    report, and streams it as a binary content-type blob download.
    """
    scans_col = get_collection()
    try:
        obj_id = ObjectId(scan_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scan ID format.")

    doc = await scans_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    # Ownership check
    if doc.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This scan record belongs to a different operator."
        )

    advisories = generate_security_advisories(doc)

    try:
        pdf_bytes = build_pdf_report(doc, advisories)
    except Exception as e:
        logger.error(f"PDF generation failed for scan {scan_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF report generation failed: {str(e)}")

    safe_filename = doc.get("filename", "scan").replace(" ", "_").replace(".exe", "")
    pdf_filename = f"MalScan_Report_{safe_filename}_{scan_id[:8]}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{pdf_filename}"',
            "Content-Length": str(len(pdf_bytes)),
        }
    )


# ---------------------------------------------------------------------------
# ENDPOINT: GET /export/json/{scan_id}  — Stream raw JSON feature doc
# ---------------------------------------------------------------------------

@router.get("/export/json/{scan_id}")
async def export_scan_json(
    scan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Streams the raw unpacked backend feature document as a JSON download attachment.
    """
    scans_col = get_collection()
    try:
        obj_id = ObjectId(scan_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scan ID format.")

    doc = await scans_col.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    if doc.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Build clean export payload (sanitize ObjectId)
    export_payload = {
        "scan_id": str(doc["_id"]),
        "filename": doc.get("filename"),
        "md5": doc.get("md5"),
        "sha1": doc.get("sha1"),
        "sha256": doc.get("sha256"),
        "prediction": doc.get("prediction"),
        "confidence": doc.get("confidence"),
        "timestamp": doc.get("timestamp"),
        "user_id": doc.get("user_id"),
        "advisories": generate_security_advisories(doc),
        "features": doc.get("features", {}),
    }

    json_bytes = json.dumps(export_payload, indent=2).encode("utf-8")
    safe_name = doc.get("filename", "scan").replace(" ", "_")
    json_filename = f"MalScan_Export_{safe_name}_{scan_id[:8]}.json"

    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{json_filename}"',
            "Content-Length": str(len(json_bytes)),
        }
    )


# ---------------------------------------------------------------------------
# ENDPOINT: GET /hash/{sha256}  — Global hash reputation tracker
# ---------------------------------------------------------------------------

@router.get("/hash/{sha256_hash}")
async def get_hash_reputation(
    sha256_hash: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Reads the global hash reputation collection.
    Returns compilation counters without leaking private user metadata.
    """
    hashes_col = get_hashes_collection()

    doc = await hashes_col.find_one({"sha256": sha256_hash.lower()})
    if not doc:
        return {
            "sha256": sha256_hash.lower(),
            "previously_scanned": False,
            "first_seen": None,
            "last_seen": None,
            "scan_count": 0
        }

    return {
        "sha256": sha256_hash.lower(),
        "previously_scanned": True,
        "first_seen": doc.get("first_seen"),
        "last_seen": doc.get("last_seen"),
        "scan_count": doc.get("scan_count", 0)
    }


# ---------------------------------------------------------------------------
# ENDPOINT: GET /analysis/compare — Delta comparison between two scans
# ---------------------------------------------------------------------------

@router.get("/analysis/compare")
async def compare_scans(
    scan_a: str,
    scan_b: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Resolves two scan documents by ID, verifies ownership, and computes
    a delta map across structural metrics.
    """
    scans_col = get_collection()
    user_id = current_user["id"]

    try:
        obj_a = ObjectId(scan_a)
        obj_b = ObjectId(scan_b)
    except Exception:
        raise HTTPException(status_code=400, detail="One or both scan IDs are invalid.")

    doc_a = await scans_col.find_one({"_id": obj_a})
    doc_b = await scans_col.find_one({"_id": obj_b})

    if not doc_a:
        raise HTTPException(status_code=404, detail=f"Scan A (id: {scan_a}) not found.")
    if not doc_b:
        raise HTTPException(status_code=404, detail=f"Scan B (id: {scan_b}) not found.")

    # Ownership check for both
    if doc_a.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied for Scan A.")
    if doc_b.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied for Scan B.")

    feats_a = doc_a.get("features", {})
    feats_b = doc_b.get("features", {})

    # Key delta fields to compare
    COMPARE_KEYS = [
        "task_size", "total_vm", "exec_vm", "shared_vm", "reserved_vm",
        "map_count", "hiwater_rss", "static_prio", "prio", "nivcsw", "nvcsw",
        "vm_truncate_count", "min_flt", "maj_flt", "lock", "state", "policy",
        "utime", "stime", "nr_ptes"
    ]

    delta_map = {}
    for key in COMPARE_KEYS:
        val_a = feats_a.get(key, 0)
        val_b = feats_b.get(key, 0)
        try:
            diff = float(val_b) - float(val_a)
            pct_change = (diff / float(val_a) * 100) if val_a != 0 else None
        except (TypeError, ValueError):
            diff = 0
            pct_change = None

        delta_map[key] = {
            "scan_a": val_a,
            "scan_b": val_b,
            "delta": round(diff, 4),
            "percent_change": round(pct_change, 2) if pct_change is not None else None,
            "direction": "increase" if diff > 0 else ("decrease" if diff < 0 else "unchanged")
        }

    return {
        "scan_a": {
            "id": scan_a,
            "filename": doc_a.get("filename"),
            "prediction": doc_a.get("prediction"),
            "confidence": doc_a.get("confidence"),
            "sha256": doc_a.get("sha256"),
            "timestamp": doc_a.get("timestamp"),
        },
        "scan_b": {
            "id": scan_b,
            "filename": doc_b.get("filename"),
            "prediction": doc_b.get("prediction"),
            "confidence": doc_b.get("confidence"),
            "sha256": doc_b.get("sha256"),
            "timestamp": doc_b.get("timestamp"),
        },
        "delta_map": delta_map
    }
