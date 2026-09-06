/* ═══════════════════════════════════════════════════════════════════════
   GET AUDITED — curated copy
   ───────────────────────────────────────────────────────────────────────
   Every line here is written, not generated. Add variations freely; the
   generator picks one at random per notice.
   ═══════════════════════════════════════════════════════════════════════ */

const AUDIT_COPY = {

  /* Shown in the FILING STATUS field. */
  filingStatuses: [
    "Overexposed",
    "Chronically online",
    "Exit liquidity",
    "Financially creative",
    "High-risk taxpayer",
    "Overleveraged",
    "Bagholder",
    "Terminally optimistic"
  ],

  /* Captions offered for the X post. No price talk, no promises. */
  captions: [
    "I have officially been audited by the Internal Rug Service.",
    "Apparently my portfolio has been selected for examination.",
    "The Internal Rug Service has questions about my financial activity.",
    "I regret to announce that the audit findings are conclusive.",
    "My examination is complete. The findings speak for themselves.",
    "Received my notice from the Internal Rug Service. No notes."
  ],

  /* Subjects used by RANDOM AUDIT. */
  randomSubjects: [
    "Anonymous taxpayer",
    "Subject withheld",
    "Unidentified wallet",
    "Taxpayer no. 42069",
    "@notfinancialadvice",
    "Party of interest"
  ],

  /* Extra field values used by RANDOM AUDIT. */
  randomExtras: [
    { label: "Dependents",      value: "37 shitcoins" },
    { label: "Unrealized gains", value: "Classified" },
    { label: "Risk tolerance",  value: "Medically concerning" },
    { label: "Conviction",      value: "Unshakeable, unexplained" },
    { label: "Due diligence",   value: "Performed retroactively" },
    { label: "Cost basis",      value: "Best not discussed" }
  ],

  /* ── The twelve grounds for examination ──────────────────────────────
     id       stable key, used in URLs and analytics
     label    shown in the selector and printed on the notice
     field    label + placeholder for the optional third input
     status   printed as CASE STATUS
     stamp    two lines of the rubber stamp
     findings 3 variations, picked at random
     ------------------------------------------------------------------ */
  reasons: [
    {
      id: "unreported-gains",
      label: "Unreported gains",
      field: { label: "Amount detected", placeholder: "e.g. 1,240.00" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Capital appreciation has been detected and documented against your wishes.",
        "Records show a gain you neglected to mention to anyone, including yourself.",
        "An unexplained increase in value has been logged and will be held against you."
      ]
    },
    {
      id: "excessive-bagholding",
      label: "Excessive bagholding",
      field: { label: "Held since", placeholder: "e.g. March 2024" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Holdings have been retained well beyond the point of reasonable optimism.",
        "The subject continues to carry positions that other parties abandoned some time ago.",
        "Conviction has been observed at levels no longer distinguishable from inertia."
      ]
    },
    {
      id: "suspicious-100x",
      label: "Suspicious 100x activity",
      field: { label: "Multiple claimed", placeholder: "e.g. 104x" },
      status: "Pending verification",
      stamp: ["Pending", "Verification"],
      findings: [
        "Returns of this magnitude are ordinarily accompanied by an explanation. None was provided.",
        "The subject reports an outcome our examiners were unable to reproduce.",
        "Performance appears inconsistent with the subject's demonstrated ability."
      ]
    },
    {
      id: "refund-request",
      label: "Refund request",
      field: { label: "Requested amount", placeholder: "e.g. 10,000.00" },
      status: "Refund processed",
      stamp: ["Refund", "Processed"],
      findings: [
        "Your request has been received, reviewed and processed in full. Refund issued: $0.00.",
        "The requested refund has been approved at its full assessed value of zero dollars.",
        "Processing is complete. Thank you for your involuntary contribution."
      ]
    },
    {
      id: "overleveraged",
      label: "Overleveraged",
      field: { label: "Leverage used", placeholder: "e.g. 50x" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Margin usage exceeds levels ordinarily observed in financially responsible adults.",
        "The subject has borrowed heavily against a conviction that remains unverified.",
        "Positions were opened with money the subject does not appear to possess."
      ]
    },
    {
      id: "buying-the-top",
      label: "Buying the top",
      field: { label: "Entry price", placeholder: "e.g. 0.0042" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Transaction records indicate exceptional commitment to purchasing local maxima.",
        "Entry was timed with a precision our examiners found genuinely difficult to explain.",
        "The subject arrived at the exact moment everyone else was leaving."
      ]
    },
    {
      id: "selling-the-bottom",
      label: "Selling the bottom",
      field: { label: "Exit price", placeholder: "e.g. 0.0001" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Disposal occurred immediately prior to substantial appreciation.",
        "The position was closed at the one price that guaranteed regret.",
        "Records show an exit executed with unfortunate accuracy."
      ]
    },
    {
      id: "unauthorized-profit",
      label: "Unauthorized profit",
      field: { label: "Amount realised", placeholder: "e.g. 8,400.00" },
      status: "Reported",
      stamp: ["Duly", "Reported"],
      findings: [
        "Profit was realised without the appropriate paperwork, permission or explanation.",
        "The subject appears to have made money on purpose. This is being looked into.",
        "Gains were recorded outside of any process this office recognises."
      ]
    },
    {
      id: "too-many-memecoins",
      label: "Too many memecoins",
      field: { label: "Number of dependents", placeholder: "e.g. 37" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "Your portfolio currently lists an unreasonable number of financial dependents.",
        "The subject supports more tokens than people.",
        "Holdings include several assets the subject can no longer identify by name."
      ]
    },
    {
      id: "portfolio-negligence",
      label: "Portfolio negligence",
      field: { label: "Last reviewed", placeholder: "e.g. never" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "No evidence of a strategy was found during examination.",
        "The subject's holdings appear to have been assembled without supervision.",
        "Positions were acquired and then left entirely unattended."
      ]
    },
    {
      id: "liquidity-provider",
      label: "Liquidity provider behaviour",
      field: { label: "Pool", placeholder: "e.g. the one with the logo" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "The subject has been providing liquidity to parties who did not ask and will not repay.",
        "Records indicate a sustained pattern of generosity toward strangers.",
        "Funds were supplied to a pool the subject did not read about first."
      ]
    },
    {
      id: "rug-exposure",
      label: "Rug exposure",
      field: { label: "Incidents on record", placeholder: "e.g. 4" },
      status: "Rugged successfully",
      stamp: ["Rugged", "Successfully"],
      findings: [
        "You appear to have entered several financial arrangements lacking an identifiable exit.",
        "Repeated contact with projects that were never intended to survive.",
        "The subject demonstrates a consistent inability to identify the obvious."
      ]
    }
  ]
};
