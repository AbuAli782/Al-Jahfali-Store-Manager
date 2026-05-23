# Security Specification & Threat Model - Al-Jahfali Store

## 1. Security Invariants and Access Boundaries
- **Products Collection (`/products/{productId}`)**:
  - Anyone can query and read product listings (`read` and `list`).
  - Only authenticated Admins can perform `write`, `create`, `update`, and `delete` operations.
  - No product cannot have a blank name or negative YER price.
- **Testimonials Collection (`/testimonials/{testimonialId}`)**:
  - Anyone can view reviews.
  - Authenticated customers can submit a review with their name.
  - Review rating must strictly range from `1` to `5`.
- **Bookings Collection (`/bookings/{bookingId}`)**:
  - Only Admins can list and read all customer bookings.
  - Anyone can create a new booking with a unique, valid phone number.
  - No user can edit or delete a booking once submitted, to prevent malicious removal.
- **Jobs / Maintenance Collection (`/jobs/{jobId}`)**:
  - Any customer with a safe ID tracker can read their own ticket status (`get`), but cannot list general records (`list`).
  - Only authenticated Admins can create, write, or override maintenance tickets (`create`, `update`, `delete`).

---

## 2. The "Dirty Dozen" Malicious Payloads

We test and block the following 12 payloads with a `PERMISSION_DENIED`:

### Payload #1: Product Price Attack (Denial of Wallet)
- **Target**: `/products/phone-illegal`
- **Payload**: `{ "id": "phone-illegal", "name": "Fake S25", "arabicName": "مزيف", "category": "smartphones", "brand": "Samsung", "price": -9999999, ... }`
- **Result**: `REJECTED` (Negative Price violates business limits).

### Payload #2: Shadow Admin Update (Privilege Escalation)
- **Target**: `/products/phone-16pm`
- **Payload**: `{ "id": "phone-16pm", "isAdminRole": true, "price": 100 }`
- **Result**: `REJECTED` (Non-admin writes to catalog restricted).

### Payload #3: Invalid Testimonial Star Count (Data Poisoning)
- **Target**: `/testimonials/badstar`
- **Payload**: `{ "id": "badstar", "name": "Fake Human", "comment": "Nice!", "rating": 6, "date": "2026-05-23" }`
- **Result**: `REJECTED` (Rating is 6, must be <= 5).

### Payload #4: Spoofed Timestamp Creation
- **Target**: `/bookings/tstamp`
- **Payload**: `{ "id": "tstamp", "name": "Yemen User", "phone": "777777777", "createdAt": "2020-01-01T00:00:00Z" }`
- **Result**: `REJECTED` (Creation date must strictly equal server time `request.time`).

### Payload #5: Query Scraper / Unsecured List Attack
- **Operation**: `getDocs(collection(db, 'bookings'))` with anonymous query.
- **Result**: `REJECTED` (Listing customer bookings is an administrator-only capability).

### Payload #6: Long string Injection (Wallet Exhaustion Exploit)
- **Target**: `/testimonials/longtext`
- **Payload**: `{ "id": "longtext", "name": "A" * 15000, "comment": "..." }`
- **Result**: `REJECTED` (String sizes must be bounded by explicit `.size() <= MAX` characters).

### Payload #7: Maintenance Self-Elevation
- **Target**: `/jobs/7818` (Updating job status from `in-progress` to `ready` via client bypass)
- **Payload**: `{ "id": "7818", "status": "ready", "price": "免费 0 YER" }`
- **Result**: `REJECTED` (Only admins can write or modify maintenance sheets).

### Payload #8: Malformed Path poisoning
- **Target**: `/products/@#$%^&*()`
- **Result**: `REJECTED` (Document IDs must strictly match safety regex `^[a-zA-Z0-9_\-]+$`).

### Payload #9: Optional Field Spoofing (Unregistered keys)
- **Target**: `/products/extra-keys`
- **Payload**: `{ "id": "someId", "name": "Valid", ..., "shadowVulnerabilityField": "unauthorized" }`
- **Result**: `REJECTED` (Strict property schema checks).

### Payload #10: Booking Tampering (Post-submission rewrite)
- **Operation**: `updateDoc(doc(db, 'bookings', 'myBookingId'), { phone: '000000' })`
- **Result**: `REJECTED` (Bookings are write-once; updates are forbidden for normal users).

### Payload #11: Review Identity Cloaking
- **Target**: `/testimonials/anontestimonial`
- **Payload**: `{ "id": "anontestimonial", "name": "", "rating": 3, "comment": "empty name" }`
- **Result**: `REJECTED` (Review name and comment must have positive size > 0).

### Payload #12: Overwriting Exchange Rates
- **Target**: `/settings/exchange_rates`
- **Payload**: `{ "usdBuy": 1, "sarBuy": 1 }`
- **Result**: `REJECTED` (Setting exchange rates is exclusive to the Administrator).

---

## 3. Test Outline
All the twelve payloads must fail validation in our standard security rules test cycle. Standard users will be restricted strictly to client-facing scopes, while administrative views are safeguarded by authenticating against known administrative user IDs.
