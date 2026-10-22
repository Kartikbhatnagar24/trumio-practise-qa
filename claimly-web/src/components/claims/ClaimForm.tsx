import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import { attachReceipt, deleteDraft, loadSummary, saveDraft, submitDraft } from "@/actions/claims-actions";
import { loadPolicy } from "@/actions/policy-actions";
import { CategoryField } from "@/components/claims/CategoryField";
import { ClaimSummary, toInr } from "@/components/claims/ClaimSummary";
import { DateField } from "@/components/claims/DateField";
import { ProjectSearch } from "@/components/claims/ProjectSearch";
import { ReceiptDropzone } from "@/components/claims/ReceiptDropzone";
import { TopBar } from "@/components/common/header/TopBar";
import { CheckIcon } from "@/components/common/icons";
import { ConfirmDialog } from "@/components/common/modals/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVariant, hasUiBug } from "@/configs/env";
import * as UiBug from "@/constraints/enums/bug-enums";
import { Category, ClaimStatus, Currency } from "@/constraints/enums/claim-enums";
import { StepOrder, SubmitLabel } from "@/constraints/enums/variant-enums";
import { Claim, ClaimForm as ClaimFormData, FieldIssue, Project } from "@/constraints/types/claim-types";
import { cn } from "@/lib/utils";
import { paths } from "@/routes";
import { claimSchema, ClaimFormValues } from "@/schemas/claim-schema";
import { useAuthStore } from "@/stores/auth-store";
import { useClaimsStore } from "@/stores/claims-store";
import { usePolicyStore } from "@/stores/policy-store";

type Step = "details" | "receipt";

const STEP_TITLES: Record<Step, string> = { details: "Expense details", receipt: "Receipt" };
const SUBMIT_LABELS: Record<SubmitLabel, string> = { [SubmitLabel.SUBMIT_CLAIM]: "Submit claim", [SubmitLabel.SEND_FOR_APPROVAL]: "Send for approval" };

const formFieldFor = (field: string): keyof ClaimFormValues | "receipt" | null => {
  const { amountField, merchantField, dateField } = getVariant().api;
  const map: Record<string, keyof ClaimFormValues | "receipt"> = {
    [amountField]: "amount",
    [merchantField]: "merchant",
    [dateField]: "expenseDate",
    project_id: "projectId",
    category: "category",
    currency: "currency",
    description: "description",
    nights: "nights",
    receipt: "receipt",
  };
  return map[field] ?? null;
};

const valuesFrom = (claim: Claim | null): ClaimFormValues => ({
  category: claim?.category ?? "",
  currency: claim?.currency ?? Currency.INR,
  amount: claim?.amount ?? "",
  merchant: claim?.merchant ?? "",
  expenseDate: claim?.expenseDate ?? "",
  description: claim?.description ?? "",
  projectId: claim?.project?.id ?? null,
  nights: claim?.nights ?? null,
});

export function ClaimForm({ existing }: { existing: Claim | null }) {
  const navigate = useNavigate();
  const variant = getVariant();
  const steps: Step[] = variant.ui.stepOrder === StepOrder.RECEIPT_FIRST ? ["receipt", "details"] : ["details", "receipt"];
  const user = useAuthStore((state) => state.user)!;
  const policy = usePolicyStore((state) => state.policy);
  const { summary, isSaving } = useClaimsStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [claimId, setClaimId] = useState<number | null>(existing?.id ?? null);
  const [project, setProject] = useState<Project | null>(existing?.project ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [savedReceipt, setSavedReceipt] = useState(existing?.receipt ?? null);
  const [receiptError, setReceiptError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { register, control, handleSubmit, watch, setValue, setError, trigger, formState } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: valuesFrom(existing),
  });
  const values = watch();
  const merchantErrorMisplaced = hasUiBug(UiBug.ERROR_UNDER_WRONG_FIELD);
  const errors = formState.errors;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const inr = toInr(values.amount, values.currency, policy);
  const receiptRequired = !!policy && inr !== null && inr >= policy.rules.receiptRequiredFrom;
  const recentMerchants = [...new Set(summary.map((claim) => claim.merchant))].slice(0, 3);
  const recentSameCategory = summary.filter((claim) => claim.category === values.category && claim.id !== claimId).slice(0, 3);

  useEffect(() => {
    loadPolicy();
    loadSummary();
  }, []);

  const showIssues = (issues: FieldIssue[]) => {
    const unknown: string[] = [];
    let detailsIssue = false;
    issues.forEach((issue) => {
      const field = formFieldFor(issue.field);
      if (field === "receipt") setReceiptError(issue.message);
      else if (field) {
        setError(field, { message: issue.message });
        detailsIssue = true;
      } else unknown.push(issue.message);
    });
    setFormError(unknown.length ? unknown.join(" ") : null);
    if (detailsIssue) setStepIndex(steps.indexOf("details"));
    else if (issues.some((issue) => formFieldFor(issue.field) === "receipt")) setStepIndex(steps.indexOf("receipt"));
  };

  const persist = async (data: ClaimFormValues): Promise<number | null> => {
    setFormError(null);
    setReceiptError(undefined);
    const saved = await saveDraft(data as ClaimFormData, claimId);
    if (!saved.claim) {
      showIssues(saved.issues);
      return null;
    }
    setClaimId(saved.claim.id);
    if (file) {
      const uploaded = await attachReceipt(saved.claim.id, file);
      if (!uploaded.claim) {
        setReceiptError(uploaded.issues[0]?.message ?? "Could not upload the receipt.");
        setStepIndex(steps.indexOf("receipt"));
        return null;
      }
      setFile(null);
      setSavedReceipt(uploaded.claim.receipt);
    }
    setSavedAt(new Date());
    return saved.claim.id;
  };

  const goToDetailsIfInvalid = async () => {
    const valid = await trigger(undefined, { shouldFocus: step === "details" });
    if (!valid) setStepIndex(steps.indexOf("details"));
    return valid;
  };

  const onSaveDraft = async () => {
    if (await goToDetailsIfInvalid()) await handleSubmit(persist)();
  };

  const onNext = async () => {
    if (step === "details") {
      if (!(await trigger(undefined, { shouldFocus: true }))) return;
      const id = await persist(values);
      if (id) setStepIndex(stepIndex + 1);
    } else setStepIndex(stepIndex + 1);
  };

  const onSubmitClaim = async () => {
    if (!(await goToDetailsIfInvalid())) return;
    const id = await persist(values);
    if (!id) return;
    const result = await submitDraft(id);
    if (result.claim) navigate(paths.claim.generate(id));
    else showIssues(result.issues);
  };

  return (
    <>
      <TopBar crumbs={[{ label: "My claims", to: paths.myClaims }, { label: claimId ? `CLM-${claimId}` : "New claim" }]}>
        {savedAt && (
          <span role="status" className="flex items-center gap-1.5 text-[13px] text-secondary">
            <CheckIcon className="text-ok" />
            Draft saved at {format(savedAt, "HH:mm")}
          </span>
        )}
      </TopBar>
      <main className="flex w-full max-w-[1120px] flex-col gap-5 px-4 py-7 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-semibold leading-[30px]">{existing ? (existing.status === ClaimStatus.SENT_BACK ? "Fix and resubmit" : "Edit draft") : "New claim"}</h1>
          <p className="m-0 text-secondary">One expense per claim. Your manager approves it next.</p>
        </div>
        <div className="flex flex-wrap items-start gap-6">
          <form noValidate onSubmit={(event) => event.preventDefault()} className="min-w-0 flex-[3_1_460px] rounded-[var(--radius-panel)] border border-rule bg-sheet">
            <ol aria-label="Steps" className="m-0 grid list-none grid-cols-2 gap-3 border-b border-rule px-7 py-[18px]">
              {steps.map((item, index) => (
                <li key={item} aria-current={index === stepIndex ? "step" : undefined}>
                  <button type="button" onClick={() => setStepIndex(index)} className="flex w-full cursor-pointer flex-col gap-2 border-0 bg-transparent p-0 text-left">
                    <span className={cn("h-1 rounded-sm", index <= stepIndex ? "bg-brand" : "bg-[#E1E7E2]")} />
                    <span className="flex items-baseline gap-2">
                      <span className={cn("font-semibold", index === stepIndex ? "text-brand" : "text-secondary")}>Step {index + 1}</span>
                      <span className={index === stepIndex ? "font-medium" : "text-secondary"}>{STEP_TITLES[item]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {formError && (
              <p role="alert" className="mx-7 mt-5 mb-0 rounded-[var(--radius-control)] border border-danger-line bg-danger-wash px-3 py-2 text-danger">
                {formError}
              </p>
            )}
            {step === "details" ? (
              <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] px-7 py-6 sm:grid-cols-2">
                <Controller control={control} name="category" render={({ field }) => <CategoryField picker={variant.ui.categoryPicker} value={field.value} error={errors.category?.message} onChange={field.onChange} />} />
                <Controller control={control} name="expenseDate" render={({ field }) => <DateField input={variant.ui.dateInput} value={field.value} error={errors.expenseDate?.message} onChange={field.onChange} />} />
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="flex gap-2">
                    <Input id="amount" inputMode="decimal" className="flex-1 text-right tabular-nums" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "amount-error" : undefined} {...register("amount")} />
                    <NativeSelect aria-label="Currency" className="w-[84px]" {...register("currency")}>
                      {Object.values(Currency).map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  {errors.amount && (
                    <span id="amount-error" className="text-[13px] leading-[18px] text-danger">
                      {errors.amount.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input id="merchant" aria-invalid={!!errors.merchant} aria-describedby={errors.merchant ? "merchant-error" : undefined} {...register("merchant")} />
                  {errors.merchant && !merchantErrorMisplaced ? (
                    <span id="merchant-error" className="text-[13px] leading-[18px] text-danger">
                      {errors.merchant.message}
                    </span>
                  ) : (
                    recentMerchants.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs leading-4 text-secondary">
                        Recent
                        {recentMerchants.map((merchant) => (
                          <button
                            key={merchant}
                            type="button"
                            onClick={() => setValue("merchant", merchant, { shouldValidate: true })}
                            className="h-6 cursor-pointer rounded-xl border border-rule bg-sheet px-2 text-xs text-ink hover:bg-paper"
                          >
                            {merchant}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
                {values.category === Category.HOTEL && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nights">Nights</Label>
                    <Controller
                      control={control}
                      name="nights"
                      render={({ field }) => (
                        <Input
                          id="nights"
                          type="number"
                          min={1}
                          max={60}
                          value={field.value ?? ""}
                          aria-invalid={!!errors.nights}
                          onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                        />
                      )}
                    />
                    {errors.nights && <span className="text-[13px] leading-[18px] text-danger">{errors.nights.message}</span>}
                  </div>
                )}
                <div className="sm:col-span-2">
                  <ProjectSearch
                    selected={project}
                    error={errors.projectId?.message}
                    onChange={(next) => {
                      setProject(next);
                      setValue("projectId", next?.id ?? null);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={3} aria-invalid={!!errors.description} {...register("description")} />
                  {merchantErrorMisplaced && errors.merchant && <span className="text-[13px] leading-[18px] text-danger">{errors.merchant.message}</span>}
                  <span className={cn("self-end text-xs leading-4", errors.description ? "text-danger" : "text-secondary")}>
                    {errors.description?.message ?? `${values.description.length} / 500`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-7 py-6">
                <ReceiptDropzone
                  file={file}
                  saved={savedReceipt}
                  error={receiptError}
                  required={receiptRequired}
                  onFile={(next) => {
                    setFile(next);
                    setReceiptError(undefined);
                  }}
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 border-t border-rule px-7 py-4">
              {claimId && existing?.status !== ClaimStatus.SENT_BACK && (
                <Button variant="ghost" className="px-1 text-danger hover:bg-danger-wash" onClick={() => setConfirmingDelete(true)}>
                  Delete draft
                </Button>
              )}
              <div className="flex-grow" />
              {stepIndex > 0 && (
                <Button variant="secondary" onClick={() => setStepIndex(stepIndex - 1)}>
                  Back
                </Button>
              )}
              <Button variant="secondary" disabled={isSaving} onClick={onSaveDraft}>
                Save draft
              </Button>
              {isLast ? (
                <Button disabled={isSaving && !hasUiBug(UiBug.DOUBLE_SUBMIT)} onClick={onSubmitClaim}>
                  {SUBMIT_LABELS[variant.ui.submitLabel]}
                </Button>
              ) : (
                <Button disabled={isSaving} onClick={onNext}>
                  Next: {STEP_TITLES[steps[stepIndex + 1]].toLowerCase()}
                </Button>
              )}
            </div>
          </form>
          {claimId && (
            <ConfirmDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title={`Delete CLM-${claimId}?`}
              description="The draft and its receipt are removed. This cannot be undone."
              confirmLabel="Delete draft"
              onConfirm={async () => {
                if (await deleteDraft(claimId)) navigate(paths.myClaims);
              }}
            />
          )}
          <ClaimSummary amount={values.amount} currency={values.currency} category={values.category} nights={values.nights} policy={policy} user={user} recent={recentSameCategory} />
        </div>
      </main>
    </>
  );
}
