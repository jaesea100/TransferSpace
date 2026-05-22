#!/usr/bin/env python3
"""
Generate a Supabase-shaped schools CSV from local Common Data Set PDFs.

Primary source: CDS Section D transfer admission data.
Secondary source: the current Supabase row for non-CDS columns and existing links.
The output CSV intentionally contains only columns that exist in the schools table.
"""

from __future__ import annotations

import csv
import json
import logging
import os
import re
import sys
import warnings
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pdfplumber
from pypdf import PdfReader
from supabase import create_client


warnings.filterwarnings("ignore", category=UserWarning)
logging.getLogger("pypdf").setLevel(logging.ERROR)
logging.getLogger("pdfminer").setLevel(logging.ERROR)

ROOT = Path(__file__).resolve().parents[1]
CDS_DIR = ROOT / "Common_Data_Sets_2025"
OUT_CSV = ROOT / "TransferSpace_Backend" / "supabase_schools_cds_import.csv"
NOTES_CSV = ROOT / "TransferSpace_Backend" / "supabase_schools_cds_notes.csv"
LEGACY_CDS = ROOT / "TransferSpace_Backend" / "CDS.txt"

SUPABASE_COLUMNS = [
    "id",
    "name",
    "state",
    "location",
    "type",
    "acceptance_rate_transfer",
    "avg_gpa_transfer",
    "undergrad_population",
    "tuition_in_state",
    "tuition_out_of_state",
    "app_fee",
    "is_need_blind",
    "max_credits_accepted",
    "residency_credits_required",
    "popular_majors",
    "transfer_info_link",
    "apply_link",
    "school_url",
    "accepts_transfer_summer",
    "accepts_transfer_winter",
    "min_gpa",
    "min_credits_required",
    "accepts_fall",
    "accepts_spring",
    "in_state_min_GPA",
    "lowest_letter_grade_for_credit",
    "fall-closing-date",
    "spring-closing-date",
    "fall-notification-date",
    "spring-notification-date",
]

FILE_TO_IPEDS = {
    "2023-24 Ohio State University.pdf": "204796",
    "2023-24 Rutgers University-New Brunswick.pdf": "186380",
    "2024-2025-WashU-CDS.pdf": "179867",
    "2024-25 Boston College.pdf": "164924",
    "2024-25 Boston University.pdf": "164988",
    "2024-25 Brown University.pdf": "217156",
    "2024-25 California Institute of Technology.pdf": "110404",
    "2024-25 Carnegie Mellon University.pdf": "211440",
    "2024-25 Columbia University.pdf": "190150",
    "2024-25 Cornell University.pdf": "190415",
    "2024-25 Dartmouth College.pdf": "182670",
    "2024-25 Duke University.pdf": "198419",
    "2024-25 Emory University.pdf": "139658",
    "2024-25 Georgetown University.pdf": "131496",
    "2024-25 Georgia Institute of Technology.pdf": "139755",
    "2024-25 Harvard University.pdf": "166027",
    "2024-25 Johns Hopkins University.pdf": "162928",
    "2024-25 Massachusetts Institute of Technology.xlsx.pdf": "166683",
    "2024-25 New York University.pdf": "193900",
    "2024-25 Northwestern University.pdf": "147767",
    "2024-25 Princeton.pdf": "186131",
    "2024-25 Rice University.pdf": "227757",
    "2024-25 Stanford University.pdf": "243744",
    "2024-25 Tufts University.pdf": "168148",
    "2024-25 Tulane University.pdf": "160755",
    "2024-25 University of California, Berkeley.xlsx.pdf": "110635",
    "2024-25 University of California, Davis.pdf": "110644",
    "2024-25 University of California, Irvine.pdf": "110653",
    "2024-25 University of California, Los Angeles.pdf": "110662",
    "2024-25 University of California, Riverside.pdf": "110671",
    "2024-25 University of California, San Diego.pdf": "110680",
    "2024-25 University of California, Santa Barbara.pdf": "110705",
    "2024-25 University of California, Santa Cruz.pdf": "110714",
    "2024-25 University of Chicago.pdf": "144050",
    "2024-25 University of Florida.pdf": "134130",
    "2024-25 University of Illinois at Urbana-Champaign.xlsx.pdf": "145637",
    "2024-25 University of Michigan.pdf": "170976",
    "2024-25 University of North Carolina at Chapel Hill.pdf": "199120",
    "2024-25 University of Notre Dame.pdf": "152080",
    "2024-25 University of Pennsylvania.pdf": "215062",
    "2024-25 University of Southern California.pdf": "123961",
    "2024-25 University of Texas at Austin.pdf": "228778",
    "2024-25 University of Virginia-Main Campus.pdf": "234076",
    "2024-25 University of Wisconsin-Madison.pdf": "240444",
    "2024-25 Vanderbilt University.xlsx.pdf": "221999",
    "2024-25 Yale University.pdf": "130794",
}

OFFICIAL_TRANSFER_LINKS = {
    "204796": "https://undergrad.osu.edu/apply/transfer",
    "186380": "https://admissions.rutgers.edu/transfer-students",
    "179867": "https://admissions.wustl.edu/how-to-apply/transfer-applicants/",
    "164924": "https://www.bc.edu/bc-web/admission/apply/transfer.html",
    "164988": "https://www.bu.edu/admissions/apply/transfer/",
    "217156": "https://admission.brown.edu/transfer",
    "110404": "https://www.admissions.caltech.edu/apply/transfer-applicants",
    "211440": "https://www.cmu.edu/admission/admission/transfer-applicants",
    "190150": "https://undergrad.admissions.columbia.edu/apply/transfer",
    "190415": "https://admissions.cornell.edu/apply/transfer-applicants",
    "182670": "https://admissions.dartmouth.edu/glossary-question/transfer-applicants",
    "198419": "https://admissions.duke.edu/apply/",
    "139658": "https://apply.emory.edu/apply/transfer.html",
    "131496": "https://uadmissions.georgetown.edu/applying/transfer/",
    "139755": "https://admission.gatech.edu/transfer/",
    "166027": "https://college.harvard.edu/admissions/apply/transfer-applicants",
    "162928": "https://apply.jhu.edu/transfer-applicants/",
    "166683": "https://mitadmissions.org/apply/transfer/",
    "193900": "https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/transfer-applicants.html",
    "147767": "https://admissions.northwestern.edu/apply/transfer/",
    "186131": "https://admission.princeton.edu/apply/transfer-applicants",
    "227757": "https://admission.rice.edu/apply/transfer",
    "243744": "https://admission.stanford.edu/apply/transfer",
    "168148": "https://admissions.tufts.edu/apply/transfer-students/",
    "160755": "https://admission.tulane.edu/transfer-students",
    "110635": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110644": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110653": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110662": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110671": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110680": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110705": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "110714": "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/",
    "144050": "https://collegeadmissions.uchicago.edu/apply/transfer-applicants",
    "134130": "https://admissions.ufl.edu/apply/transfer/",
    "145637": "https://www.admissions.illinois.edu/apply/transfer",
    "170976": "https://admissions.umich.edu/apply/transfer-applicants",
    "199120": "https://admissions.unc.edu/apply/types-of-applications/transfer/",
    "152080": "https://admissions.nd.edu/apply/transfer-students/",
    "215062": "https://admissions.upenn.edu/admissions-and-financial-aid/apply-for-admission/transfer-admission",
    "123961": "https://admission.usc.edu/prospective-students/how-to-apply/transfer-students/",
    "228778": "https://admissions.utexas.edu/apply/transfer-students/",
    "234076": "https://admission.virginia.edu/transfer",
    "240444": "https://admissions.wisc.edu/apply-as-a-transfer-student/",
    "221999": "https://admissions.vanderbilt.edu/apply/transfer-process/",
    "130794": "https://admissions.yale.edu/transfer",
}

DEADLINE_OVERRIDES = {
    # Official transfer/admissions pages or official admissions-hosted PDFs.
    "164924": {
        "accepts_fall": True,
        "accepts_spring": True,
        "fall-closing-date": "March 15",
        "spring-closing-date": "November 1",
        "fall-notification-date": "May 20",
        "spring-notification-date": "December 15",
        "_note": "Official Boston College transfer page deadline fallback.",
    },
    "110404": {
        "accepts_fall": True,
        "accepts_spring": False,
        "accepts_transfer_winter": False,
        "fall-closing-date": "February 1",
        "fall-notification-date": "Mid-April",
        "_note": "Official Caltech transfer deadlines page fallback.",
    },
    "227757": {
        "accepts_fall": True,
        "accepts_spring": True,
        "fall-closing-date": "March 15",
        "spring-closing-date": "October 15",
        "fall-notification-date": "June",
        "spring-notification-date": "December 1",
        "_note": "Official Rice transfer applicants page fallback.",
    },
    "110714": {
        "accepts_fall": True,
        "accepts_transfer_winter": True,
        "fall-closing-date": "December 1",
        "fall-notification-date": "March-May",
        "_note": "Official UC transfer dates page fallback; winter date is represented in app term overrides.",
    },
    "144050": {
        "accepts_fall": True,
        "fall-closing-date": "March 1",
        "_note": "Official UChicago admissions PDF priority transfer deadline fallback.",
    },
    "145637": {
        "accepts_fall": True,
        "accepts_spring": True,
        "fall-closing-date": "April 1",
        "spring-closing-date": "October 15",
        "fall-notification-date": "By June 1",
        "spring-notification-date": "By November 15",
        "_note": "Official UIUC transfer dates page fallback.",
    },
    # Secondary estimates used only when CDS and official transfer page dates were not available.
    "199120": {
        "accepts_fall": True,
        "fall-closing-date": "February 15",
        "fall-notification-date": "Late April",
        "_note": "Secondary-source UNC Chapel Hill transfer deadline estimate.",
    },
}


@dataclass
class ExtractedTransferData:
    section_found: bool = False
    applicants: int | None = None
    admitted: int | None = None
    enrolled: int | None = None
    acceptance_rate_transfer: float | None = None
    accepts_fall: bool | None = None
    accepts_spring: bool | None = None
    accepts_transfer_winter: bool | None = None
    accepts_transfer_summer: bool | None = None
    min_credits_required: int | None = None
    min_gpa: float | None = None
    avg_gpa_transfer: float | None = None
    lowest_letter_grade_for_credit: str | None = None
    max_credits_accepted: int | None = None
    residency_credits_required: int | None = None
    fall_closing_date: str | None = None
    spring_closing_date: str | None = None
    fall_notification_date: str | None = None
    spring_notification_date: str | None = None
    notes: list[str] = field(default_factory=list)


def normalize_name(name: str) -> str:
    name = name.lower().replace("&", "and")
    name = name.replace("university of california, ", "uc ")
    name = name.replace("university of california-", "uc ")
    name = name.replace("uc los angeles", "ucla")
    name = name.replace("university of north carolina at chapel hill", "unc chapel hill")
    name = name.replace("university of pennsylvania", "upenn")
    name = name.replace("university of southern california", "usc")
    name = name.replace("the university of texas at austin", "ut austin")
    name = name.replace("tulane university of louisiana", "tulane university")
    name = re.sub(r"[^a-z0-9]+", " ", name)
    return re.sub(r"\s+", " ", name).strip()


def load_legacy_cds() -> dict[str, dict[str, str]]:
    if not LEGACY_CDS.exists():
        return {}
    with LEGACY_CDS.open() as file:
        rows = list(csv.DictReader(file))
    return {normalize_name(row["name"]): row for row in rows}


def read_supabase_credentials() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if url and key:
        return url, key

    # Fallback for this local project: reuse the already-present backend config.
    scanner = ROOT / "TransferSpace_Backend" / "CDS_Scanner.py"
    text = scanner.read_text()
    url_match = re.search(r'SUPABASE_URL\s*=\s*"([^"]+)"', text)
    key_match = re.search(r'SUPABASE_KEY\s*=\s*"([^"]+)"', text)
    if not url_match or not key_match:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running.")
    return url_match.group(1), key_match.group(1)


def fetch_base_rows() -> dict[str, dict[str, Any]]:
    url, key = read_supabase_credentials()
    supabase = create_client(url, key)
    ids = sorted(set(FILE_TO_IPEDS.values()))
    rows: list[dict[str, Any]] = []
    for start in range(0, len(ids), 25):
        chunk = ids[start : start + 25]
        result = (
            supabase.table("schools")
            .select(",".join(SUPABASE_COLUMNS))
            .in_("id", chunk)
            .execute()
        )
        rows.extend(result.data or [])
    return {str(row["id"]): row for row in rows}


def tidy_text(text: str) -> str:
    text = text.replace("\u201c", '"').replace("\u201d", '"').replace("\u2019", "'")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def page_texts(path: Path) -> list[str]:
    reader = PdfReader(str(path))
    return [page.extract_text() or "" for page in reader.pages]


def find_section_start_page(pages: list[str]) -> int:
    for idx, text in enumerate(pages):
        if re.search(r"\bD\.\s*Transfer Admission|D1-D2:\s*Fall Applicants|\bD1\b.*transfer students", text, re.I | re.S):
            return idx
    for idx, text in enumerate(pages):
        if re.search(r"\bD9\b|D901|Transfer Admission Applicants", text, re.I):
            return max(0, idx - 2)
    return 0


def pdfplumber_window(path: Path, start: int, size: int = 8) -> str:
    pieces: list[str] = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages[start : min(len(pdf.pages), start + size)]:
                pieces.append(page.extract_text(x_tolerance=1.5, y_tolerance=3) or "")
    except Exception as exc:  # pragma: no cover - defensive for malformed PDFs.
        pieces.append(f"[pdfplumber extraction failed: {exc}]")
    return "\n".join(pieces)


def section_d_text(path: Path) -> tuple[str, bool]:
    pages = page_texts(path)
    start_page = find_section_start_page(pages)
    pypdf_text = "\n".join(pages[start_page : start_page + 10])
    plumber_text = pdfplumber_window(path, start_page, 10)
    combined = tidy_text(pypdf_text + "\n\n" + plumber_text)

    start_match = re.search(r"\bD\.\s*Transfer Admission|D1-D2:\s*Fall Applicants|\bD1\b.*transfer students", combined, re.I | re.S)
    start = start_match.start() if start_match else 0
    section = combined[start:]
    end_match = re.search(r"\n\s*E\.\s*Academic|\n\s*E1\b|\n\s*E\.\s*ACADEMIC", section, re.I)
    if end_match:
        section = section[: end_match.start()]
    found = bool(start_match) or bool(re.search(r"Transfer Admission Applicants|D205\s+Total", section, re.I))
    return section, found


def subsection(text: str, label: int, next_label: int | None = None) -> str:
    start = re.search(rf"\bD{label}\b|\bD{label}\.", text, re.I)
    if not start:
        return ""
    if next_label is None:
        return text[start.start() :]
    end = re.search(rf"\bD{next_label}\b|\bD{next_label}\.", text[start.end() :], re.I)
    if not end:
        return text[start.start() :]
    return text[start.start() : start.end() + end.start()]


def parse_int(value: str) -> int | None:
    if value is None:
        return None
    value = value.replace(",", "").strip()
    value = re.sub(r"\.0$", "", value)
    if not re.fullmatch(r"\d+", value):
        return None
    return int(value)


def parse_float(value: str) -> float | None:
    try:
        return float(value.replace(",", "").strip())
    except ValueError:
        return None


def first_reasonable_number(text: str) -> float | None:
    text = scrub_prompt_numbers(text)
    for raw in re.findall(r"(?<![A-Za-z])(\d+(?:\.\d+)?)", text):
        value = parse_float(raw)
        if value is not None and 0 < value <= 250:
            return value
    return None


def scrub_prompt_numbers(text: str) -> str:
    text = re.sub(r"\bD\d{1,4}\b", " ", text)
    text = re.sub(r"\bCommon Data Set\b.*", " ", text, flags=re.I)
    text = re.sub(r"\b20\d{2}(?:[-–]20\d{2})?\b", " ", text)
    text = re.sub(r"\(?on a 4\.0 scale\)?", " ", text, flags=re.I)
    text = re.sub(r"\b4\.0 scale\b", " ", text, flags=re.I)
    return text


def answer_number(text: str) -> float | None:
    cleaned = scrub_prompt_numbers(text)
    if re.search(r"\bN/?A\b|not applicable|not required|click or tap here", cleaned, re.I):
        numbers_near_answers = re.findall(r"(?:⇒|Number:|Number\s+Unit Type)\s*(\d+(?:\.\d+)?)", cleaned, re.I)
        if not numbers_near_answers:
            return None
    for pattern in [
        r"⇒\s*(\d+(?:\.\d+)?)",
        r"Number:\s*(\d+(?:\.\d+)?)",
        r"Number\s+Unit Type\s*(\d+(?:\.\d+)?)",
        r"\b(\d+(?:\.\d+)?)\s+(?:semester|credit|quarter|courses?|units?|hours?)\b",
        r"\b(\d+(?:\.\d+)?)\s+or more credits\b",
    ]:
        match = re.search(pattern, cleaned, re.I)
        if match:
            return parse_float(match.group(1))
    return None


def course_multiplier(text: str) -> int:
    match = re.search(r"1\s+course\s*=\s*(\d+)\s+semester", text, re.I)
    return int(match.group(1)) if match else 1


def normalize_credit_count(number: float | None, context: str) -> int | None:
    if number is None:
        return None
    if re.search(r"\bcourses?\b", context, re.I):
        return int(round(number * course_multiplier(context)))
    return int(round(number))


def parse_d2(text: str, data: ExtractedTransferData) -> None:
    xlsx = re.search(
        r"D205\s+Total\s+([\d,]+).*?D210\s+Total\s+([\d,]+).*?D215\s+Total\s+([\d,]+)",
        text,
        re.I | re.S,
    )
    if xlsx:
        applicants, admitted, enrolled = [parse_int(v) for v in xlsx.groups()]
    else:
        applicants = admitted = enrolled = None
        candidates = re.findall(r"\bTotal\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)", text, re.I)
        if candidates:
            applicants, admitted, enrolled = [parse_int(v) for v in candidates[0]]
        else:
            two_value = re.search(r"\bTotal\s+([\d,]+)\s+([\d,]+)\b", text, re.I)
            if two_value:
                applicants, admitted = [parse_int(v) for v in two_value.groups()]
                enrolled = None

    if applicants and admitted is not None:
        data.applicants = applicants
        data.admitted = admitted
        data.enrolled = enrolled
        data.acceptance_rate_transfer = round(admitted / applicants, 4)
    else:
        data.notes.append("Could not confidently parse D2 applicants/admitted/enrolled.")


def parse_terms(text: str, data: ExtractedTransferData) -> None:
    d3 = subsection(text, 3, 4) or text

    def has_term(term: str) -> bool | None:
        patterns = [
            rf"\b{term}\b\s+[XxYy](?:\b|$)",
            rf"\b{term}\b\s+Yes\b",
            rf"D30\d\s+{term}\s+[XxYy]",
        ]
        if any(re.search(pattern, d3, re.I) for pattern in patterns):
            return True
        if re.search(rf"\b{term}\b\s*(?:\n|$)", d3, re.I):
            return False
        return None

    data.accepts_fall = has_term("Fall")
    data.accepts_spring = has_term("Spring")
    data.accepts_transfer_winter = has_term("Winter")
    data.accepts_transfer_summer = has_term("Summer")


def parse_min_credits(text: str, data: ExtractedTransferData) -> None:
    d4 = subsection(text, 4, 5)
    match = re.search(r"D402\s+Number\s+(\d+(?:\.\d+)?)", d4, re.I)
    value = parse_float(match.group(1)) if match else None
    if value is None:
        value = answer_number(d4)
    data.min_credits_required = normalize_credit_count(value, d4)


def parse_gpa(text: str, data: ExtractedTransferData) -> None:
    d7 = subsection(text, 7, 8)
    cleaned = scrub_prompt_numbers(d7)
    if re.search(r"\bn/?a\b|not required|click or tap here", cleaned, re.I):
        return
    match = re.search(r"⇒\s*([0-4](?:\.\d+)?)", cleaned)
    if not match:
        match = re.search(r":\s*([0-4](?:\.\d+)?)\b", cleaned)
    if not match:
        match = re.search(r"\b([0-4](?:\.\d+)?)\b", cleaned)
    value = parse_float(match.group(1)) if match else None
    if value is None or value > 4:
        return
    if re.search(r"\baverage\b|accepted students|admitted students", d7, re.I) and not re.search(r"\bminimum\b|required", d7, re.I):
        data.avg_gpa_transfer = value
    else:
        data.min_gpa = value


def parse_dates(text: str, data: ExtractedTransferData) -> None:
    d9 = subsection(text, 9, 10)
    if not d9:
        return

    term_attrs = {
        "Fall": "accepts_fall",
        "Winter": "accepts_transfer_winter",
        "Spring": "accepts_spring",
        "Summer": "accepts_transfer_summer",
    }
    for term, attr in term_attrs.items():
        line_match = re.search(rf"\b{term}\s+([^\n]+)", d9, re.I)
        if line_match and split_date_line(line_match.group(1)):
            setattr(data, attr, True)

    fall_close = re.search(r"D905\s+Fall\s+([^\n]+)", d9, re.I)
    spring_close = re.search(r"D907\s+Spring\s+([^\n]+)|D906\s+Spring\s+([^\n]+)", d9, re.I)
    fall_notify = re.search(r"D913\s+Fall\s+([^\n]+)|D909\s+Fall\s+([^\n]+)", d9, re.I)
    spring_notify = re.search(r"D915\s+Spring\s+([^\n]+)|D911\s+Spring\s+([^\n]+)", d9, re.I)

    if fall_close:
        data.fall_closing_date = clean_date_cell(fall_close.group(1))
    if spring_close:
        data.spring_closing_date = clean_date_cell(next(g for g in spring_close.groups() if g))
    if fall_notify:
        data.fall_notification_date = clean_date_cell(next(g for g in fall_notify.groups() if g))
    if spring_notify:
        data.spring_notification_date = clean_date_cell(next(g for g in spring_notify.groups() if g))

    if data.fall_closing_date or data.spring_closing_date:
        return

    for term in ("Fall", "Spring"):
        line_match = re.search(rf"\b{term}\s+([^\n]+)", d9, re.I)
        if not line_match:
            continue
        cells = split_date_line(line_match.group(1))
        if not cells:
            continue
        if term.lower() == "fall":
            data.fall_closing_date = cells[0]
            if len(cells) > 1:
                data.fall_notification_date = cells[1]
        else:
            data.spring_closing_date = cells[0]
            if len(cells) > 1:
                data.spring_notification_date = cells[1]


def clean_date_cell(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\*.*$", "", value).strip()
    return value if value and value.upper() not in {"N/A", "NA"} else ""


def split_date_line(value: str) -> list[str]:
    value = clean_date_cell(value)
    if not value:
        return []
    tokens = re.findall(
        r"\d{1,2}/\d{1,2}|(?:Early|Mid|Late|Beginning|Starting)?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{1,2})?",
        value,
        re.I,
    )
    cells = [clean_date_cell(token) for token in tokens]
    return [cell for cell in cells if cell]


def parse_grade_and_credit_policy(text: str, data: ExtractedTransferData) -> None:
    d12 = subsection(text, 12, 13)
    grade = re.search(r"(?:⇒|credit:|credit\s+)\s*([ABCDF][+-]?)\b", d12, re.I)
    if not grade:
        grade = re.search(r"\b([ABCDF][+-]?)\s+or\s+Pass\b", d12, re.I)
    if grade:
        data.lowest_letter_grade_for_credit = grade.group(1)

    d13 = subsection(text, 13, 14)
    d14 = subsection(text, 14, 15)
    d16 = subsection(text, 16, 17)

    for section in (d13, d14):
        if not section:
            continue
        value = answer_number(section)
        normalized = normalize_credit_count(value, section)
        if normalized:
            data.max_credits_accepted = normalized
            break

    value = answer_number(d16)
    data.residency_credits_required = normalize_credit_count(value, d16 or text)


def checked(value: Any) -> bool | None:
    if value in (None, "", "/Off", "Off"):
        return False
    if str(value).strip() in {"/X", "/Y", "X", "Y", "Yes", "yes", "true", "True"}:
        return True
    return None


def month_day(fields: dict[str, Any], month_key: str, day_key: str) -> str | None:
    month = str(fields.get(month_key) or "").strip()
    day = str(fields.get(day_key) or "").strip()
    if not month or not day:
        return None
    if not month.isdigit() or not day.isdigit():
        return None
    return f"{int(month)}/{int(day)}"


def parse_acroform_fields(path: Path, data: ExtractedTransferData) -> None:
    try:
        fields = PdfReader(str(path)).get_fields() or {}
    except Exception:
        return
    values = {key: field.get("/V") for key, field in fields.items()}
    if not any(key.startswith("AP_TFER") or key.startswith("AD_TFER") for key in values):
        return

    applicants = parse_int(str(values.get("AP_TFER_N") or ""))
    admitted = parse_int(str(values.get("AD_TFER_N") or ""))
    enrolled = parse_int(str(values.get("EN_TFER_N") or ""))
    if applicants and admitted is not None:
        data.applicants = applicants
        data.admitted = admitted
        data.enrolled = enrolled
        data.acceptance_rate_transfer = round(admitted / applicants, 4)
        data.notes.append("Parsed AcroForm transfer totals.")

    term_map = {
        "accepts_fall": "AD_TFER_FALL",
        "accepts_spring": "AD_TFER_SPRI",
        "accepts_transfer_winter": "AD_TFER_WINT",
        "accepts_transfer_summer": "AD_TFER_SUMM",
    }
    for attr, key in term_map.items():
        if key in values:
            setattr(data, attr, checked(values.get(key)))

    min_credits = parse_int(str(values.get("AD_TFER_CRDT_MIN_N") or ""))
    if min_credits:
        data.min_credits_required = min_credits

    grade = str(values.get("AD_TFER_GRADE") or "").strip()
    if grade:
        data.lowest_letter_grade_for_credit = grade

    max_credits = parse_int(str(values.get("AD_TFER_CRDT_2_N") or ""))
    if max_credits:
        data.max_credits_accepted = max_credits

    residency = parse_int(str(values.get("TFER_CRDT_BACH_N") or ""))
    if residency:
        data.residency_credits_required = residency

    fall_close = month_day(values, "AP_DL_TFER_MON", "AP_DL_TFER_DAY")
    spring_close = month_day(values, "AP_DL_TFER_SPRI_MON", "AP_DL_TFER_SPRI_DAY")
    fall_notify = month_day(values, "AP_NOTF_DL_TFER_MON", "AP_NOTF_DL_TFER_DAY")
    spring_notify = month_day(values, "AP_NOTF_DL_TFER_SPRI_MON", "AP_NOTF_DL_TFER_SPRI_DAY")
    if fall_close:
        data.fall_closing_date = fall_close
    if spring_close:
        data.spring_closing_date = spring_close
    if fall_notify:
        data.fall_notification_date = fall_notify
    if spring_notify:
        data.spring_notification_date = spring_notify


def extract_transfer_data(path: Path) -> ExtractedTransferData:
    text, found = section_d_text(path)
    data = ExtractedTransferData(section_found=found)
    parse_d2(text, data)
    parse_terms(text, data)
    parse_min_credits(text, data)
    parse_gpa(text, data)
    parse_dates(text, data)
    parse_grade_and_credit_policy(text, data)
    parse_acroform_fields(path, data)
    return data


def csv_value(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=True)
    return value


def apply_legacy_fallback(base: dict[str, Any], extracted: ExtractedTransferData, legacy_rows: dict[str, dict[str, str]]) -> None:
    legacy = legacy_rows.get(normalize_name(base.get("name", "")))
    if not legacy:
        return

    if extracted.acceptance_rate_transfer is None:
        percent = parse_float(legacy.get("acceptance_rate_transfer", ""))
        if percent and percent > 0:
            extracted.acceptance_rate_transfer = round(percent / 100, 4)
            extracted.notes.append("Used legacy CDS.txt acceptance rate fallback.")

    if extracted.min_credits_required is None:
        credits = parse_int(legacy.get("min_credits_transfer", ""))
        if credits and credits > 0:
            extracted.min_credits_required = credits
            extracted.notes.append("Used legacy CDS.txt minimum credits fallback.")

    if extracted.max_credits_accepted is None or extracted.max_credits_accepted < 30:
        credits = parse_int(legacy.get("max_credits_accepted", ""))
        if credits and credits > 0:
            extracted.max_credits_accepted = credits
            extracted.notes.append("Used legacy CDS.txt max credits fallback.")

    if extracted.residency_credits_required is None or extracted.residency_credits_required < 30:
        credits = parse_int(legacy.get("residency_credits_required", ""))
        if credits and credits > 0:
            extracted.residency_credits_required = credits
            extracted.notes.append("Used legacy CDS.txt residency credits fallback.")


def merge_row(base: dict[str, Any], extracted: ExtractedTransferData) -> dict[str, Any]:
    row = {column: base.get(column) for column in SUPABASE_COLUMNS}
    row_id = str(row.get("id") or "")
    if row_id in OFFICIAL_TRANSFER_LINKS:
        row["transfer_info_link"] = OFFICIAL_TRANSFER_LINKS[row_id]
        row["apply_link"] = OFFICIAL_TRANSFER_LINKS[row_id]
    updates = {
        "acceptance_rate_transfer": extracted.acceptance_rate_transfer,
        "avg_gpa_transfer": extracted.avg_gpa_transfer,
        "max_credits_accepted": extracted.max_credits_accepted,
        "residency_credits_required": extracted.residency_credits_required,
        "accepts_transfer_summer": extracted.accepts_transfer_summer,
        "accepts_transfer_winter": extracted.accepts_transfer_winter,
        "min_gpa": extracted.min_gpa,
        "min_credits_required": extracted.min_credits_required,
        "accepts_fall": extracted.accepts_fall,
        "accepts_spring": extracted.accepts_spring,
        "lowest_letter_grade_for_credit": extracted.lowest_letter_grade_for_credit,
        "fall-closing-date": extracted.fall_closing_date,
        "spring-closing-date": extracted.spring_closing_date,
        "fall-notification-date": extracted.fall_notification_date,
        "spring-notification-date": extracted.spring_notification_date,
    }
    for key, value in updates.items():
        if value not in (None, ""):
            row[key] = value
    override = DEADLINE_OVERRIDES.get(row_id)
    if override:
        for key, value in override.items():
            if key.startswith("_"):
                continue
            if key in row and value not in (None, ""):
                row[key] = value
    return {key: csv_value(row.get(key)) for key in SUPABASE_COLUMNS}


def main() -> int:
    base_rows = fetch_base_rows()
    legacy_rows = load_legacy_cds()
    output_rows: list[dict[str, Any]] = []
    note_rows: list[dict[str, Any]] = []

    for filename, ipeds_id in FILE_TO_IPEDS.items():
        path = CDS_DIR / filename
        if not path.exists():
            raise FileNotFoundError(path)
        base = base_rows.get(ipeds_id)
        if not base:
            raise RuntimeError(f"No Supabase row found for {filename} / {ipeds_id}")

        print(f"Extracting {filename}", file=sys.stderr)
        extracted = extract_transfer_data(path)
        apply_legacy_fallback(base, extracted, legacy_rows)
        override_note = DEADLINE_OVERRIDES.get(ipeds_id, {}).get("_note")
        if override_note:
            extracted.notes.append(override_note)
        output_rows.append(merge_row(base, extracted))
        note_rows.append(
            {
                "id": ipeds_id,
                "name": base.get("name"),
                "source_file": str(path.relative_to(ROOT)),
                "section_d_found": extracted.section_found,
                "applicants": extracted.applicants or "",
                "admitted": extracted.admitted or "",
                "enrolled": extracted.enrolled or "",
                "acceptance_rate_percent": (
                    round(extracted.acceptance_rate_transfer * 100, 2)
                    if extracted.acceptance_rate_transfer is not None
                    else ""
                ),
                "notes": "; ".join(extracted.notes),
            }
        )

    with OUT_CSV.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=SUPABASE_COLUMNS)
        writer.writeheader()
        writer.writerows(output_rows)

    with NOTES_CSV.open("w", newline="") as file:
        fieldnames = [
            "id",
            "name",
            "source_file",
            "section_d_found",
            "applicants",
            "admitted",
            "enrolled",
            "acceptance_rate_percent",
            "notes",
        ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(note_rows)

    print(f"Wrote {OUT_CSV}")
    print(f"Wrote {NOTES_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
