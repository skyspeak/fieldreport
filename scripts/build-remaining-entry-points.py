#!/usr/bin/env python3
"""CSV of remaining majors (after Optometry) with traditional + 3 new-world doors."""

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "unobvious-paths.csv"
OUT = ROOT / "remaining-entry-points.csv"

# Family default: (job, why) x3. Per-CIP overrides in JOBS_CIP.
FAMILY_JOBS = {
    "51.18": [
        ("Optical product specialist", "Train shops on lenses, coatings, and digital surfacing for a manufacturer."),
        ("Clinical research coordinator", "Ophthalmology device and drug trials: visits, imaging, consent."),
        ("Vision category buyer", "Merchandising for a chain or online optical, not the dispensary bench."),
    ],
    "51.20": [
        ("Regulatory / quality associate", "Filings, CAPA, and specs: the paperwork that lets a drug or device ship."),
        ("Health information technologist", "EHR, registries, and quality reporting: the data side of the clinic."),
        ("Medical science / field application specialist", "You brief clinicians on a drug or device for a manufacturer."),
    ],
    "51.22": [
        ("Occupational health / industrial hygienist", "Workplace exposure and injury: public health with an employer as the client."),
        ("Health information / surveillance analyst", "Registries, EHR extracts, and quality measures: the data job, not the pamphlet."),
        ("Healthcare compliance analyst", "Infection control, privacy, and program rules as an operating function."),
    ],
    "51.23": [
        ("Occupational health specialist", "Workplace injury, exposure, and return-to-work at employers and insurers."),
        ("Clinical specialist (rehab devices)", "Vendor-side support for implants, braces, and rehab tech."),
        ("Healthcare care manager", "Utilization and complex cases for a plan or hospital: still clinical, different building."),
    ],
    "51.26": [
        ("Patient navigator / care coordinator", "Scheduling, benefits, and handoffs: the ops seat next to the aide role."),
        ("Clinical research coordinator", "Screening, visits, and source docs: a trial job that uses the floor skills."),
        ("Occupational health technician", "Clinics inside plants and warehouses, not a bedside assignment."),
    ],
    "51.27": [
        ("EHR implementation analyst", "You stand up charts, order sets, and registries for a hospital or vendor."),
        ("Clinical quality / registry analyst", "Measures and extracts, not illustration or coding class."),
        ("Privacy / HIPAA compliance analyst", "Access, minimum necessary, and incident review."),
    ],
    "51.31": [
        ("Food product / culinary R&D", "Formulation and claims for a CPG or foodservice brand."),
        ("Corporate wellness specialist", "Employer programs: metabolic health without a hospital tray line."),
        ("Clinical research coordinator", "Nutrition and metabolic trials at a hospital, CRO, or startup."),
    ],
    "51.32": [
        ("IRB / research compliance analyst", "Protocol review and human-subjects rules: ethics as an operating job."),
        ("Medical writer", "Protocols, plain-language consents, and education: the words, not the ward."),
        ("Patient experience specialist", "Complaints, rounding, and service design inside a health system."),
    ],
    "51.33": [
        ("Supplement / CPG quality associate", "Specs, labeling, and complaints for botanicals and OTC."),
        ("Corporate wellness specialist", "Employer programs that want an integrative background, not a clinic."),
        ("Integrative clinic operations manager", "Scheduling, billing, and credentialing: the business of the practice."),
    ],
    "51.34": [
        ("Maternal health program officer", "Public health or foundation work on birth outcomes, not deliveries."),
        ("Clinical research coordinator", "OB and neonatal trials: visits and data, not catch."),
        ("Perinatal care coordinator", "Navigation and utilization for a plan or health system."),
    ],
    "51.35": [
        ("Occupational health / ergonomics specialist", "Injury prevention at employers: the same hands, a different client."),
        ("Sports performance staff", "College or pro settings that hire bodywork without a spa menu."),
        ("Spa / hospitality operations", "Programming and P&L, not the table."),
    ],
    "51.36": [
        ("Corporate wellness / L&D facilitator", "Movement programs sold to employers, not a studio class list."),
        ("Digital fitness product specialist", "You brief or implement an app, device, or content library."),
        ("Occupational health specialist", "Injury prevention and return-to-work, using movement as the tool."),
    ],
    "51.37": [
        ("Botanical / supplement quality associate", "Identity testing, labeling, and complaints for a CPG brand."),
        ("Wellness brand specialist", "Education and sales for a product line, not a treatment room."),
        ("Hospitality / spa programming", "Menus and training for a resort or wellness brand."),
    ],
    "51.38": [
        ("Health information technologist", "EHR build, order sets, and clinical informatics: nursing judgment without the floor."),
        ("Occupational health specialist", "Workplace injury, exposure, and return-to-work at employers and insurers."),
        ("Clinical specialist (devices)", "You train surgeons and staff on a vendor's equipment: the commercial cousin of the unit."),
    ],
    "51.39": [
        ("Care coordinator / utilization review", "Authorizations and discharge planning: clinical, not a shift on the floor."),
        ("Clinical research coordinator", "Visits and source docs that use the same patient skills."),
        ("Occupational health technician", "On-site clinics at employers and warehouses."),
    ],
    "52.01": [
        ("Buyer / purchasing agent", "Supplier negotiation and cost: commerce, not a leadership-development program."),
        ("Logistician", "Move goods, not slide decks."),
        ("Market research analyst", "Demand and category work for a brand or retailer."),
    ],
    "52.02": [
        ("Systems analyst (implementation)", "You configure and stand up the software other people bought."),
        ("Logistician", "Inventory, freight, and network design: operations with a real constraint set."),
        ("Insurance underwriter", "You decide who gets covered and at what price."),
    ],
    "52.03": [
        ("ERP implementation analyst", "NetSuite / Workday / SAP stand-up. The close is the domain; the job is the system."),
        ("Insurance underwriter", "Financial statements as a risk signal, not a monthly close."),
        ("Internal audit / compliance analyst", "Controls and investigations: accounting judgment without being the bookkeeper."),
    ],
    "52.04": [
        ("Executive operations coordinator", "Calendar, staff work, and follow-through for a principal: not a front desk."),
        ("Customer success / implementation", "You stand up what the customer bought."),
        ("Office systems / workflow analyst", "Ticketing, docs, and automation: the job that ate the old secretarial major."),
    ],
    "52.05": [
        ("Internal communications / change", "Rollouts and executive voice inside a company, not a classroom."),
        ("Proposal / technical writer", "RFPs and collateral: writing that closes deals."),
        ("Investor / corporate communications", "Earnings, media, and the public file."),
    ],
    "52.06": [
        ("Pricing analyst", "Willingness-to-pay and pack architecture for a brand or carrier."),
        ("Operations research analyst", "The same models, pointed at staffing, routing, or inventory."),
        ("Policy / regulatory economist", "Filings and impact work for an agency or trade group."),
    ],
    "52.07": [
        ("Startup chief of staff / operations", "The generalist seat that is not 'founding CEO on a class project.'"),
        ("Partnerships / business development", "You sell the relationship, not a quota of widgets."),
        ("Venture or accelerator associate", "Sourcing and diligence: the other side of the pitch."),
    ],
    "52.08": [
        ("Actuary", "Exam track that uses the same math the bank internship ignored."),
        ("Operations research analyst", "Pricing, staffing, and routing models: finance-adjacent without a coverage universe."),
        ("Insurance underwriter", "Credit and risk judgment on the other side of the bank wall."),
    ],
    "52.09": [
        ("Revenue / yield manager", "Rooms, covers, and price: the math job in a hotel or airline."),
        ("Corporate event operations", "Meetings as a production, sold to companies not tourists."),
        ("Guest experience / CX analyst", "Surveys, recovery, and service design."),
    ],
    "52.10": [
        ("People analytics specialist", "Surveys, attrition, and hiring funnels: HR as measurement."),
        ("Compensation analyst", "Bands, offers, and equity: the pricing job inside people ops."),
        ("Learning & development specialist", "Curriculum for employees, not a classroom of undergrads."),
    ],
    "52.11": [
        ("Trade compliance analyst", "Classification, sanctions, and export licenses."),
        ("Global supply chain / logistician", "Lanes, brokers, and inventory across borders."),
        ("Market-entry analyst", "Where to sell next, and what it costs to get there."),
    ],
    "52.12": [
        ("Systems analyst (implementation)", "You stand up the software other people bought."),
        ("Information security / GRC analyst", "Access, evidence, and control design."),
        ("Sales engineer", "Technical brain on the sales call: demos and architecture."),
    ],
    "52.13": [
        ("Actuary", "The exam path that actually uses the probability sequence."),
        ("Operations research analyst", "The namesake job most classmates still do not apply for."),
        ("Systems analyst (implementation)", "Optimization and process, pointed at standing up software for a customer."),
    ],
    "52.14": [
        ("Market research / insights analyst", "The measurement and study side, not campaign ops or social posting."),
        ("Sales engineer", "If you can get technical on a product, this is marketing's highest-leverage unobvious door."),
        ("Revenue operations", "The funnel as a system: routing, SLAs, and the CRM."),
    ],
    "52.15": [
        ("Commercial acquisitions analyst", "Underwrite deals for a PE, REIT, or developer: not a license and a listing."),
        ("Asset / property operations analyst", "NOI, capex, and vendors for a portfolio."),
        ("PropTech implementation specialist", "You stand up the software landlords and brokers bought."),
    ],
    "52.16": [
        ("Tax technology / provision analyst", "The close and the engine, not a seasonal 1040 shop."),
        ("Transfer pricing analyst", "Intercompany pricing for a multinational."),
        ("Equity / compensation tax specialist", "Withholding and 409A for a company that grants stock."),
    ],
    "52.17": [
        ("Insurance underwriter", "You decide who gets covered and at what price: not a captive-agent book."),
        ("Actuarial analyst", "The exam door if the program had real math."),
        ("Special investigations / SIU", "Fraud and claims that need a case file, not a sales license."),
    ],
    "52.18": [
        ("Revenue operations", "The sales machine: routing, forecasting, and the CRM."),
        ("Category / merchandising analyst", "What gets shelf space and at what margin."),
        ("Customer success", "Retention after the deal, not the first cold call."),
    ],
    "52.19": [
        ("Brand merchandiser / wholesale", "You sell the line into retailers, not a single store's floor."),
        ("E-commerce operations", "Assortment, inventory, and the site as a store."),
        ("Market research analyst", "Demand and category work for a brand or retailer."),
    ],
    "52.20": [
        ("Cost estimator", "The bid is the product. Read a drawing and price it."),
        ("Project controls / owner's representative", "Schedule, change orders, and the owner's side of the job."),
        ("Construction software implementation", "Procore / BIM / ERP stand-up: the system, not the trailer."),
    ],
    "52.21": [
        ("Network / systems analyst", "Circuits and platforms as an operating job."),
        ("Sales engineer", "You specify the stack on the sales call."),
        ("Implementation consultant", "Stand-up after the contract: circuits, SLAs, and cutover."),
    ],
    "54.01": [
        ("Compliance / investigations analyst", "Source work and chronology, applied to misconduct, AML, or policy breaches."),
        ("Information governance / records analyst", "Retention, discovery, and archives inside companies: not a museum gift shop."),
        ("Market / archival researcher", "Primary-source and desk research for consultancies, media, and legal shops."),
    ],
}

JOBS_CIP = {
    "51.2703": [
        ("UX / digital product designer", "Anatomy and visual hierarchy, applied to health software instead of plates."),
        ("Surgical / device visualization specialist", "You draw what a manufacturer needs to sell or train on."),
        ("Clinical education media producer", "Modules and animation for a hospital or vendor academy."),
    ],
    "51.2706": [
        ("EHR implementation analyst", "Charts, order sets, and cutover for a hospital or vendor."),
        ("Clinical quality / registry analyst", "Measures and extracts: informatics as reporting, not a help desk."),
        ("Privacy / HIPAA compliance analyst", "Access reviews and incident work."),
    ],
    "51.3201": [
        ("IRB / research compliance analyst", "Protocol review and human-subjects rules."),
        ("Healthcare compliance officer", "Conflicts, privacy, and program integrity."),
        ("Medical writer", "Consent language and ethics sections for sponsors and journals."),
    ],
    "51.3499": [
        ("Supplement / CPG quality associate", "Specs, labeling, and complaints for botanicals and OTC."),
        ("Corporate wellness specialist", "Employer programs that want an integrative background, not a clinic."),
        ("Integrative clinic operations manager", "Scheduling, billing, and credentialing: the business of the practice."),
    ],
    "51.3603": [
        ("Corporate wellness specialist", "Employer programs that want a facilitation background, not a treatment room."),
        ("Patient experience specialist", "Anxiety, procedure prep, and service design inside a health system."),
        ("L&D / facilitation specialist", "Workshops for employees: the skill without a private-practice shingle."),
    ],
    "51.3203": [
        ("Clinical education specialist (industry)", "You train nurses on a drug or device for a manufacturer."),
        ("Simulation / training specialist", "Labs and scenarios inside a health system."),
        ("Learning & development specialist", "Curriculum for a hospital workforce, not a school of nursing faculty line."),
    ],
    "52.1901": [
        ("Specialist at an auction house", "Cataloging and client work for art, autos, or estates."),
        ("Marketplace / secondary-market operations", "Listings, authenticity, and settlement for an online house."),
        ("Valuation / appraisal analyst", "Comps and condition for insurers, banks, or the house."),
    ],
    "52.1902": [
        ("Wholesale / brand merchandiser", "You place the line in stores. Not a mall job."),
        ("E-commerce operations", "Assortment and the site as the store."),
        ("Market research analyst", "Demand and trend work for an apparel brand."),
    ],
    "52.1903": [
        ("Casting / talent coordinator", "Booking and logistics for a brand or agency."),
        ("Brand / influencer operations", "The production side of a campaign."),
        ("Wholesale showroom coordinator", "The commercial room, not the runway."),
    ],
    "52.1905": [
        ("Destination marketing analyst", "Campaign measurement for a bureau or carrier."),
        ("Revenue / yield manager", "Price and inventory for rooms or seats."),
        ("Partnerships coordinator", "Hotels, OTAs, and the deal memo."),
    ],
    "52.1906": [
        ("Destination marketing analyst", "Campaign measurement for a bureau or carrier."),
        ("Revenue / yield manager", "Price and inventory for rooms or seats."),
        ("Partnerships coordinator", "Hotels, OTAs, and the deal memo."),
    ],
    "52.1907": [
        ("Aftermarket product specialist", "You specify parts and tools for dealers and shops."),
        ("Category buyer", "Assortment and margin for a parts retailer or distributor."),
        ("Sales engineer", "Technical brain on the wholesale call."),
    ],
}

# Keyword → traditional title. First match wins. More specific first.
TRAD_RULES = [
    (r"optician", "optician"),
    (r"optometric technician", "optometric technician"),
    (r"ophthalmic technician", "ophthalmic technician"),
    (r"orthopt", "orthoptist"),
    (r"pharmacy administration|pharmacy policy", "pharmacy policy / regulatory associate"),
    (r"pharmaceutics and drug design", "formulation scientist"),
    (r"medicinal and pharmaceutical chemistry", "medicinal chemist"),
    (r"pharmacognosy|natural products", "natural products chemist"),
    (r"clinical and industrial drug", "clinical development associate"),
    (r"pharmacoeconom", "HEOR / pharmacoeconomics analyst"),
    (r"hospital, and managed care pharmacy|managed care pharmacy", "hospital / managed-care pharmacist"),
    (r"industrial and physical pharmacy|cosmetic", "industrial / cosmetic pharmacist"),
    (r"pharmaceutical sciences", "pharmaceutical scientist"),
    (r"pharmaceutical marketing", "pharmaceutical brand / sales specialist"),
    (r"^pharmacy, pharmaceutical|^pharmacy$", "pharmacist"),
    (r"^environmental health$", "environmental health specialist"),
    (r"health/medical  physics|medical  physics|health/medical physics", "medical physicist"),
    (r"occupational health and industrial hygiene", "industrial hygienist"),
    (r"public health education|health education and promotion", "health educator"),
    (r"community health and preventive", "community health specialist"),
    (r"maternal and child health", "maternal and child health specialist"),
    (r"international public health", "global health officer"),
    (r"health services administration", "health services administrator"),
    (r"behavioral aspects of health", "behavioral health specialist"),
    (r"patient safety", "patient safety / quality specialist"),
    (r"public health genetics", "public health geneticist"),
    (r"public health, other|public health, general", "health educator"),
    (r"art therapy", "art therapist"),
    (r"dance therapy", "dance therapist"),
    (r"music therapy", "music therapist"),
    (r"occupational therapy", "occupational therapist"),
    (r"orthotist|prosthetist", "orthotist / prosthetist"),
    (r"physical therapy/therapist", "physical therapist"),
    (r"therapeutic recreation", "recreational therapist"),
    (r"vocational rehabilitation", "vocational rehabilitation counselor"),
    (r"kinesiotherapy", "kinesiotherapist"),
    (r"assistive/augmentative|rehabilitation engineering", "rehab engineer"),
    (r"animal-assisted therapy", "animal-assisted therapist"),
    (r"rehabilitation science", "rehabilitation scientist"),
    (r"drama therapy", "drama therapist"),
    (r"horticulture therapy", "horticultural therapist"),
    (r"play therapy", "play therapist"),
    (r"rehabilitation and therapeutic", "staff therapist"),
    (r"medication aide", "medication aide"),
    (r"rehabilitation aide", "rehabilitation aide"),
    (r"physical therapy technician", "physical therapy aide"),
    (r"^health aide$", "home health aide"),
    (r"medical illustration", "medical illustrator"),
    (r"medical informatics", "health information technologist"),
    (r"dietitian assistant", "dietitian assistant"),
    (r"dietetic technician", "dietetic technician"),
    (r"clinical nutrition", "clinical nutritionist"),
    (r"dietetics/dietitian|^dietitian", "dietitian"),
    (r"dietetics and clinical nutrition", "dietitian"),
    (r"bioethics|medical ethics", "clinical ethicist"),
    (r"nursing education", "nursing faculty / educator"),
    (r"health professions education", "health professions educator"),
    (r"medical/health humanities", "health humanities specialist"),
    (r"history of medicine", "medical historian"),
    (r"arts in medicine", "arts-in-health specialist"),
    (r"health professions education, ethics", "clinical ethicist"),
    (r"acupuncture", "acupuncturist"),
    (r"traditional chinese medicine|chinese herbology", "TCM practitioner"),
    (r"naturopathic|naturopathy", "naturopathic physician"),
    (r"homeopathic", "homeopath"),
    (r"ayurvedic", "Ayurvedic practitioner"),
    (r"holistic/integrative", "integrative health practitioner"),
    (r"alternative and complementary medicine", "integrative practitioner"),
    (r"direct entry midwifery", "midwife"),
    (r"alternative and complementary medical support", "integrative support practitioner"),
    (r"massage therapy|therapeutic massage", "massage therapist"),
    (r"asian bodywork", "Asian bodywork therapist"),
    (r"somatic bodywork", "somatic therapist"),
    (r"movement therapy", "movement therapist"),
    (r"yoga teacher|yoga therapy", "yoga teacher / therapist"),
    (r"hypnotherapy", "hypnotherapist"),
    (r"aromatherapy", "aromatherapist"),
    (r"herbalism|herbalist", "herbalist"),
    (r"polarity therapy", "polarity therapist"),
    (r"^reiki$", "Reiki practitioner"),
    (r"energy and biologically based", "energy therapist"),
    (r"registered nursing/registered nurse|^registered nursing", "bedside RN"),
    (r"nursing administration", "nurse manager"),
    (r"adult health nurse", "adult-health NP / RN"),
    (r"nurse anesthetist", "CRNA"),
    (r"family practice nurse", "family NP"),
    (r"maternal/child health and neonatal nurse|neonatal nurse", "NICU / maternal-child RN"),
    (r"nurse midwife|nursing midwifery", "nurse-midwife"),
    (r"nursing science", "nurse scientist"),
    (r"pediatric nurse", "pediatric RN / NP"),
    (r"psychiatric/mental health nurse", "psych / mental-health NP"),
    (r"public health/community nurse", "public health nurse"),
    (r"perioperative|operating room and surgical nurse", "OR / perioperative RN"),
    (r"clinical nurse specialist", "clinical nurse specialist"),
    (r"critical care nursing", "ICU RN"),
    (r"occupational and environmental health nursing", "occupational health nurse"),
    (r"occupational and environmental health nurse", "occupational health nurse"),
    (r"emergency room/trauma nursing", "ED / trauma RN"),
    (r"nursing practice", "DNP-prepared clinician"),
    (r"palliative care nursing", "palliative RN"),
    (r"clinical nurse leader", "clinical nurse leader"),
    (r"geriatric nurse", "geriatric RN / NP"),
    (r"women's health nurse", "women's health NP"),
    (r"forensic nursing", "forensic RN"),
    (r"licensed practical|vocational nurse training", "LPN / LVN"),
    (r"nursing assistant|patient care assistant", "CNA / patient-care aide"),
    (r"practical nursing, vocational", "LPN / CNA"),
    (r"business/commerce, general", "management trainee"),
    (r"business administration and management, general", "management trainee"),
    (r"purchasing, procurement", "buyer / purchasing agent"),
    (r"logistics, materials, and supply", "supply chain analyst"),
    (r"office management", "office manager"),
    (r"operations management", "operations supervisor"),
    (r"non-profit/public/organizational", "nonprofit program manager"),
    (r"customer service management", "customer service manager"),
    (r"e-commerce/electronic commerce", "e-commerce coordinator"),
    (r"transportation/mobility management", "transportation manager"),
    (r"research and development management", "R&D program coordinator"),
    (r"construction project management", "construction project manager"),
    (r"^project management$", "project coordinator"),
    (r"retail management", "assistant store manager"),
    (r"organizational leadership", "management trainee"),
    (r"research administration", "research administrator"),
    (r"^risk management$", "risk analyst"),
    (r"financial risk management", "financial risk analyst"),
    (r"science/technology management", "technology program coordinator"),
    (r"^accounting$", "staff accountant"),
    (r"accounting technology|bookkeeping", "bookkeeper"),
    (r"^auditing$", "staff auditor"),
    (r"accounting and finance", "staff accountant"),
    (r"accounting and business", "staff accountant"),
    (r"administrative assistant and secretarial", "administrative assistant"),
    (r"executive assistant|executive secretary", "executive assistant"),
    (r"^receptionist$", "receptionist"),
    (r"office automation|data entry", "office / data-entry clerk"),
    (r"general office occupations", "office clerk"),
    (r"parts, warehousing, and inventory", "inventory / warehouse clerk"),
    (r"traffic, customs, and transportation clerk", "traffic / customs clerk"),
    (r"customer service support|call center|teleservice", "call-center representative"),
    (r"business operations support and secretarial", "administrative assistant"),
    (r"grantsmanship", "grant writer"),
    (r"business/corporate communications", "corporate communications coordinator"),
    (r"business/managerial economics", "business economist / analyst"),
    (r"entrepreneurship/entrepreneurial", "small-business owner"),
    (r"franchising", "franchise operator"),
    (r"small business administration", "small-business manager"),
    (r"social entrepreneurship", "nonprofit / social-venture manager"),
    (r"finance, general", "bank financial analyst"),
    (r"banking and financial support", "bank operations specialist"),
    (r"financial planning and services", "financial planner"),
    (r"international finance", "international finance analyst"),
    (r"investments and securities", "securities / investment analyst"),
    (r"public finance", "public-finance analyst"),
    (r"credit management", "credit analyst"),
    (r"financial risk management", "financial risk analyst"),
    (r"finance and financial management", "bank financial analyst"),
    (r"hospitality administration/management, general", "hotel / restaurant manager"),
    (r"tourism and travel services management", "travel / tour manager"),
    (r"hotel/motel administration", "hotel manager"),
    (r"restaurant/food services management", "restaurant manager"),
    (r"resort management", "resort manager"),
    (r"meeting and event planning", "event planner"),
    (r"casino management", "casino operations supervisor"),
    (r"hotel, motel, and restaurant", "hotel / restaurant manager"),
    (r"brewery/brewpub", "brewery / brewpub manager"),
    (r"hospitality administration/management, other", "hospitality manager"),
    (r"human resources management/personnel", "HR generalist"),
    (r"labor and industrial relations", "labor relations specialist"),
    (r"organizational behavior", "OD / people analyst"),
    (r"^labor studies$", "labor relations specialist"),
    (r"human resources development", "L&D specialist"),
    (r"executive/career coaching", "career / executive coach"),
    (r"human resources management and services, other", "HR generalist"),
    (r"international business", "import / export coordinator"),
    (r"management information systems, general", "IT / systems analyst"),
    (r"information resources management", "IT manager / IRM analyst"),
    (r"knowledge management", "knowledge manager"),
    (r"management information systems and services, other", "IT / systems analyst"),
    (r"^management science$", "management scientist / analyst"),
    (r"business statistics", "business statistician"),
    (r"actuarial science", "actuarial analyst"),
    (r"marketing/marketing management, general", "marketing coordinator"),
    (r"marketing research", "market research analyst"),
    (r"international marketing", "international marketing coordinator"),
    (r"digital marketing", "digital marketing coordinator"),
    (r"^marketing, other$", "marketing coordinator"),
    (r"^real estate$", "real estate agent"),
    (r"^taxation$", "tax preparer / staff tax"),
    (r"^insurance$", "insurance sales agent"),
    (r"sales, distribution, and marketing operations", "sales representative"),
    (r"retailing and retail operations", "retail supervisor"),
    (r"selling skills and sales operations", "salesperson"),
    (r"general merchandising, sales", "retail salesperson"),
    (r"^auctioneering$", "auctioneer"),
    (r"fashion merchandising", "fashion merchandiser"),
    (r"fashion modeling", "fashion model"),
    (r"apparel and accessories marketing", "apparel sales / wholesale"),
    (r"tourism and travel services marketing", "travel marketing coordinator"),
    (r"tourism promotion", "tourism promotion coordinator"),
    (r"vehicle and vehicle parts", "auto parts sales"),
    (r"business and personal/financial services marketing", "financial-services salesperson"),
    (r"special products marketing", "product sales specialist"),
    (r"hospitality and recreation marketing", "hospitality marketing coordinator"),
    (r"construction management", "construction manager"),
    (r"telecommunications management", "telecom manager"),
    (r"american  history|united states", "U.S. history teacher"),
    (r"european history", "European history teacher"),
    (r"history and philosophy of science", "history of science teacher"),
    (r"public/applied history", "public historian / archivist"),
    (r"asian history", "Asian history teacher"),
    (r"canadian history", "Canadian history teacher"),
    (r"military history", "military historian"),
    (r"history, other|history, general", "history teacher"),
]


def traditional(cip: str, name: str, fallback: str) -> str:
    n = re.sub(r"\s+", " ", name).strip().lower()
    for pat, title in TRAD_RULES:
        if re.search(pat, n):
            return title
    return fallback


def jobs_for(cip: str) -> list[tuple[str, str]]:
    return JOBS_CIP.get(cip) or FAMILY_JOBS[cip[:5]]


def main() -> None:
    rows = list(csv.DictReader(SRC.open(encoding="utf-8")))
    out_rows = []
    for r in rows:
        cip = r["cip"]
        if cip < "51.1801":
            continue
        if cip.startswith(("60", "61", "99")):
            continue
        if cip[:5] not in FAMILY_JOBS and cip not in JOBS_CIP:
            continue
        jobs = jobs_for(cip)
        trad = traditional(cip, r["major"], r["traditional_entry"])
        out_rows.append(
            {
                "cip": cip,
                "major": r["major"],
                "category": r["category"],
                "traditional": trad,
                "new_1": jobs[0][0],
                "why_1": jobs[0][1],
                "new_2": jobs[1][0],
                "why_2": jobs[1][1],
                "new_3": jobs[2][0],
                "why_3": jobs[2][1],
            }
        )

    fields = [
        "cip",
        "major",
        "category",
        "traditional",
        "new_1",
        "why_1",
        "new_2",
        "why_2",
        "new_3",
        "why_3",
    ]
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(out_rows)
    print(f"wrote {OUT} rows={len(out_rows)}")
    print("first", out_rows[0]["cip"], out_rows[0]["traditional"], "→", out_rows[0]["new_1"])
    print("last", out_rows[-1]["cip"], out_rows[-1]["traditional"], "→", out_rows[-1]["new_1"])


if __name__ == "__main__":
    main()
