# Claimly web: design plan

## Brief

- **What it is:** internal expense-claims software for an Indian IT-services company.
- **Who uses it:**
  - employees, who submit claims;
  - managers, who approve their reports' claims;
  - finance admins, who do the final approval above a limit and mark claims paid.
- **What it must feel like:** a calm, credible work tool that people use every week, close to real finance software.
- **Why it exists:** QA learners test it as if it were their client's product, so it has to look and behave like one, not like a demo.

## Where the look comes from

Indian office finance runs on the **expense voucher**: a printed slip with a voucher number, ruled lines for each field, amounts written in a right-hand column, and a violet rubber stamp (*Approved*, *Paid*, *Rejected*) pressed on at the end. Ledger books add bottle-green covers and red ink for anything struck off.

Claimly borrows that vernacular sparingly:
- ruled rows instead of cards;
- figures in a right-aligned column;
- one rubber-stamp mark for status on the claim page.

## Palette

| Name | Hex | Role |
|---|---|---|
| Ledger paper | `#F5F7F4` | App background: a cool, slightly green grey, not cream |
| Sheet | `#FFFFFF` | Panels, tables, dialogs |
| Fountain ink | `#1B2433` | Primary text: blue-black, not tinted near-black |
| Ruling | `#D5DCD6` | Hairlines between rows and fields |
| Bottle green | `#2F5D50` | Brand and primary action (buttons, links, focus ring, active nav) |
| Stamp violet | `#5B3F8C` | Only the rubber-stamp mark and the APPROVED stamp |

Supporting tones:
- **Secondary text:** `#55606E`.
- **Muted text:** `#7A8490`.
- **Hover wash:** `#EAF0EC`, the bottle green at low strength.
- **Correction red:** `#B3261E`, for errors, over-limit amounts and the REJECTED stamp.

### Claim status colours

One text colour and one wash per status. The badges are text with a 1 px border in the same colour, not filled pills.

| Status | Text | Wash |
|---|---|---|
| Draft | `#5F6670` | `#F0F1F3` |
| Submitted | `#2C5A9E` | `#EAF1FB` |
| Sent back | `#9A5B13` | `#FBF2E6` |
| Manager approved | `#2F7D5B` | `#E8F4EE` |
| Finance approved | `#2F5D50` | `#E3EEE9` |
| Paid | `#1E5A46` | `#DDEBE4` |
| Rejected | `#B3261E` | `#FBEAE9` |

## Type

- **IBM Plex Sans** (400, 500, 600) for everything, self-hosted through `@fontsource/ibm-plex-sans`. It's an engineered, corporate face that suits software IT-services teams use every day.
  - Amounts use `font-variant-numeric: tabular-nums` so columns line up like a ledger.
  - Fallback is `"Noto Sans", system-ui, sans-serif`, both of which carry the ₹ glyph.
- **Scale**, at a 1.2 ratio from a 14 px base. A dense tool needs 14 px body.

| Use | Size / line height | Weight |
|---|---|---|
| Caption | 12 / 16 | 400 |
| Body | 14 / 20 | 400 |
| Label | 14 / 20 | 500 |
| Section | 17 / 24 | 600 |
| Page title | 20 / 28 | 600 |
| Voucher number | 24 / 32 | 600, tabular |

- Sentence case everywhere. No all-caps labels and no eyebrow labels. The only uppercase text is the stamp itself, because real stamps are uppercase.

## Layout

App shell: a fixed left rail, with content left-aligned and capped at 1200 px.

```
+------------+--------------------------------------------------+
| Claimly    |  My claims                         [New claim]   |
|            |--------------------------------------------------|
| My claims  |  Status v  Category v  From [  ] To [  ]  Clear  |
| New claim  |--------------------------------------------------|
| Approvals  |  Date       Merchant          Category   Amount  |
| Policy     |  12 Jun     Truffles Cafe     Meals     ₹450.00  |
|            |  ...                                             |
|            |--------------------------------------------------|
| Asha Verma |  1–20 of 64                    < Prev  Next >    |
| Employee   |                                                  |
+------------+--------------------------------------------------+
```

Claim page, the voucher. This page carries the one memorable element:

```
+--------------------------------------------------------------+
| CLM-10023                                 .-------------.    |
| Truffles Cafe · submitted 12 Jun          |  APPROVED   |    |
|                                           '-------------'    |
|--------------------------------------------------------------|
| Category        Meals                     Claimed   ₹450.00  |
| Expense date    10 Jun 2026               Approved  ₹400.00  |
| Project         Atlas Payments Migration                     |
| Receipt         receipt.pdf (82 KB)                          |
|--------------------------------------------------------------|
| History                                                      |
|  ● Submitted by Asha Verma              12 Jun, 10:42        |
|  ● Approved ₹400.00 by Rahul Mehta       13 Jun, 09:10       |
|    "Tip not covered"                                         |
+--------------------------------------------------------------+
```

New claim, as two steps with a live summary:

```
+-------------------------------------+------------------------+
| 1 Details   2 Receipt               | Summary                |
|-------------------------------------|  ₹450.00               |
| Category      [Meals         v]     |  Converted from INR    |
| Amount        [ 450.00 ] [INR v]    |                        |
| Merchant      [ Truffles Cafe   ]   |  Policy for this claim |
| Expense date  [ 10/06/2026      ]   |  Meals up to ₹1,200    |
| Project       [ Search projects ]   |  Receipt from ₹2,000   |
| Description   [                 ]   |                        |
|                                     |                        |
|          [Save draft] [Submit claim]|                        |
+-------------------------------------+------------------------+
```

- **Approvals:** the same table as My claims, plus an Employee column. Rows open the claim page, which has the action bar (Approve, Send back, Reject, Pay).
- **Policy:** a single readable column of plain sentences (max 70 characters a line), each with its number in bold.
- **Alignment:** text left-aligned, amounts right-aligned, dates in `DD Mon YYYY`.

## Principles

1. **Ruled, not boxed.** Rows and fields are separated by 1 px `Ruling` lines.
   - Panels have one border and no shadow.
   - Only dialogs and popovers get a shadow.
   - Radius is 6 px on controls and 8 px on panels and dialogs. Badges have no radius except a 4 px square corner.
2. **Figures behave like a ledger.** Amounts are always right-aligned, tabular, with ₹ and two decimals. Over-limit amounts turn Correction red, with the reason next to them.
3. **One stamp.** The claim page's status stamp is the single expressive moment. It is the status word in a double-ruled rectangle, rotated −4° and inked in the status colour at 85 % opacity, with a faint texture. Nothing else on any page is decorated.
4. **Motion only answers actions.**
   - Dialogs fade in over 120 ms.
   - After an action, the stamp swaps with one 160 ms scale-from-110 % press.
   - Respect `prefers-reduced-motion`.
5. **Words do one job.**
   - Buttons say exactly what happens ("Send back", "Mark paid"), and the toast repeats the verb ("Sent back").
   - Errors say what went wrong and how to fix it, using the API's message.
   - Empty lists invite the next action ("No claims yet. Start a new claim.").
6. **Testable by design.**
   - Every control has a real label, and buttons have visible text.
   - Tables are real `<table>` elements with header cells.
   - Dialogs use `role="dialog"` with a title.
   - So learners practise locators against an accessible app.
7. **Quality floor.**
   - Keyboard focus is a 2 px Bottle green ring with a 2 px offset.
   - Text contrast is AA or better.
   - Layout works down to 360 px: the rail collapses to a top bar, and tables scroll inside their panel.

## Approved mockup (2026-10-22)

The user reviewed the mockup at https://claude.ai/artifact/GyrjyiEDLdfcjhgUQVFAzm, asked for a fuller UI with a logo, and approved the result. It adds the following to the plan above.

**Shell, on every page**
- **Logo:** a 28 px Bottle green rounded square holding a paper receipt with a zig-zag foot and a tick. Next to it, the wordmark "Claimly" (19 px, 600) and the company line "Kaveri Infotech Pvt. Ltd." (12 px, secondary).
- **Side menu:**
  - grouped as Expenses (My claims with a count, New claim, Corporate card "Soon") and Company (Expense policy, Help and FAQs);
  - managers and finance see an Approvals group with a queue count;
  - 16 px stroke icons;
  - a "Next payout" note;
  - the user's initials avatar, name and role at the bottom.
- **Top bar** (60 px, white, ruled): search ("Search claims, merchants or claim numbers"), a "Claim guide" link and a notifications bell with a red count. Detail pages show a breadcrumb instead of search.

**My claims**
- A greeting heading, plus "Download statement" and "New claim" buttons.
- **Summary strip:** one ruled panel with four cells (Claimed this month, Waiting for approval, Paid this quarter, Needs your action), each with a one-line explanation. This replaces the earlier no-tiles rule: it's a single ruled strip, not separate cards.
- **Sent-back banner:** amber wash with a "Fix and resubmit" button.
- **Status tabs** with counts, filters, and sorting.
- **Table:**
  - the merchant with its category on a second line;
  - a project code column;
  - a receipt clip icon;
  - the amount with the original foreign amount underneath;
  - "Rows per page" and Previous/Next.

**Claim page**
- A breadcrumb, plus "n of m in your queue" with Previous/Next.
- **The voucher:**
  - the stamp;
  - a ruled details list;
  - the money column (Claimed, Per night or Rate, Not approved, To pay);
  - a receipt thumbnail with Open/Download;
  - the history;
  - a comment box next to Reject / Send back / Approve.
- **Side column:** an employee card, policy checks (a tick per passed rule, "!" for notes) and the employee's recent claims.

**New claim**
- A two-segment progress bar ("Step 1 Expense details", "Step 2 Receipt and review"), and "Draft saved at hh:mm" in the top bar.
- Recent-merchant chips, the project combobox list, and a character counter on the description.
- **Side column:** summary, policy for this claim, "Before you submit" tips, and the employee's last claims of the same category.

## Review against generic defaults

I checked this plan against the look I'd produce for any "expense dashboard" prompt: an Inter or Geist font, an indigo or violet primary, white rounded stat cards with soft shadows, a gradient hero number and ALL-CAPS section labels. I changed three things from my first draft:

- **Status badges:** the first draft had filled pastel pills. They're now outlined ink badges, because filled pills are the SaaS-kit default and outlines read as printed forms.
- **Dashboard tiles:** the first draft opened My claims with three summary tiles (Pending / Approved / Paid totals). I cut them. The table is the content, and stat tiles with a big number and a small label are the default treatment the brief should avoid. The page title row shows one plain line instead, for example "₹12,450 waiting for approval".
- **Primary colour:** the first draft used Stamp violet as the primary colour. Bottle green now leads, and violet is kept only for the stamp, so the one memorable element stays rare.

The look is not the "broadsheet" pattern either: there are no zero-radius dense newspaper columns, only rules between rows inside normal rounded panels.
