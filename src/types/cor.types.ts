/**
 * types/cor.types.ts
 * ─────────────────────────────────────────────────────────────
 * Short acronym keys — must match {placeholders} in cor-template.docx
 * ─────────────────────────────────────────────────────────────
 */

export interface CORSubject {
  cd: string; // {cd}  - code
  ttl: string; // {ttl} - title
  lc: number; // {lc}  - lec units
  lb: number; // {lb}  - lab units
  cr: number; // {cr}  - credit units
  sec: string; // {sec} - section
  sch: string; // {sch} - schedule/room
}

export interface CORFee {
  lbl: string; // {lbl} - label
  amt: string; // {amt} - amount (pre-formatted e.g. "5,720.00")
}

export interface CORData {
  // ── Header ─────────────────────────────────────────────────
  regNo: string; // {regNo}  - registration number
  campus: string; // {campus}
  sem: string; // {sem}    - semester
  ay: string; // {ay}     - academic year

  // ── Student info ───────────────────────────────────────────
  sno: string; // {sno}  - student number
  snm: string; // {snm}  - student name
  crs: string; // {crs}  - course
  yr: string; // {yr}   - year level

  // ── Subjects loop — {#sub}...{/sub} ───────────────────────
  sub: CORSubject[];
  tsub: number; // {tsub} - total subjects
  tlc: number; // {tlc}  - total lec
  tlb: number; // {tlb}  - total lab
  tcr: number; // {tcr}  - total credit

  // ── Fees loop — {#fee}...{/fee} ───────────────────────────
  fee: CORFee[];
  tamt: string; // {tamt} - total assessment
  faid: string; // {faid} - financial aid
  namt: string; // {namt} - net assessed
  tpay: string; // {tpay} - total payment
  cmmo: string; // {cmmo} - credit memo
  tbal: string; // {tbal} - total balance
  pbal: string; // {pbal} - additional prev balance
  obal: string; // {obal} - outstanding balance

  // ── Signatories ────────────────────────────────────────────
  rgnm: string; // {rgnm} - registrar name
  rgtl: string; // {rgtl} - registrar title

  // ── Footer ─────────────────────────────────────────────────
  dtpr: string; // {dtpr} - date printed
  dcod: string; // {dcod} - document code
}
