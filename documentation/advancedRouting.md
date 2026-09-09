# Advanced Routing

Advanced routing is how the system decides which offices need to sign off on a document request, and in what order, before the document is released to the requestor.

Not all documents go through the same offices. Some only need one office to approve. Others require the requestor to be cleared by multiple offices first before the issuing office can release the document.

**Why it exists:** A Certificate of Enrollment only needs the Registrar to approve. A Transcript of Records requires the student to be cleared by the Library, Cashier, and Student Affairs first. The routing system makes this configurable per document type instead of hardcoding logic per document.

---

## Clearance Types

**Parallel** — offices that clear the requestor at the same time, with no order dependency between them.

**Final** — the issuing office that acts last, only after all parallel clearances are completed.

---

## Document Flows

## COE — Certificate of Enrollment

Final: OUR — approve and generate

## COG — Certificate of Grades

Final: OUR — approve and generate

## CUE — Certificate of Units Earned

Final: OUR — approve and generate

## CGMC — Certificate of Good Moral Character

Final: OSAS — approve and generate

## COEMPL — Certificate of Employment

Final: HRMO — approve and generate

## TOR — Transcript of Records

Parallel: LIB, UCF, PSO, OSAS

Final: OUR — upload and release

## DIPLOMA — Diploma Duplicate

Parallel: LIB, UCF

Final: OUR — upload and release

## TC — Transfer Credential

Parallel: LIB, UCF, PSO, OSAS, DCO

Final: OUR — upload and release

## GENCLR — General Clearance

Parallel: LIB, UCF, PSO, MIS, OSAS, HRMO

Final: OUR — generate and release

## SR — Service Record

Parallel: UCF

Final: HRMO — upload and release

---

## Office Codes

| Code | Office |
|------|--------|
| OUR | Office of the University Registrar |
| UCF | University Cashier / Finance |
| LIB | Library |
| PSO | Property / Supply Office |
| MIS | Management Information System |
| DCO | Dormitory / Campus Operations |
| OSAS | Office of Student Affairs and Services |
| HRMO | Human Resource Management Office |
