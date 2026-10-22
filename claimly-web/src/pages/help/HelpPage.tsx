import { TopBar } from "@/components/common/header/TopBar";

const QUESTIONS = [
  { q: "How long does approval take?", a: "Managers usually act within two working days. Claims above the finance limit take one more day." },
  { q: "My claim was sent back. What now?", a: "Open the claim, read the comment, fix what was asked and resubmit. The claim keeps its number and history." },
  { q: "Can I claim in another currency?", a: "Yes. Pick the currency you paid in. Claimly converts it to rupees at the fixed rate on the Expense policy page." },
  { q: "When is money paid?", a: "Approved claims are paid with your next salary." },
];

export function HelpPage() {
  return (
    <>
      <TopBar crumbs={[{ label: "Help and FAQs" }]} />
      <main className="flex w-full max-w-[880px] flex-col gap-5 px-4 py-7 md:px-8">
        <h1 className="m-0 text-[22px] font-semibold leading-[30px]">Help and FAQs</h1>
        <section className="rounded-[var(--radius-panel)] border border-rule bg-sheet px-7 py-2">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="border-b border-rule-soft py-3.5 last:border-0">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="m-0 mt-2 max-w-[70ch] text-[#3B4552]">{item.a}</p>
            </details>
          ))}
        </section>
      </main>
    </>
  );
}
