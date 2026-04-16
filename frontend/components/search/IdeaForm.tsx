"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/app.store";
import { track } from "@/lib/posthog";
import { MultiSelect } from "./MultiSelect";
import { BudgetSlider, BUDGET_UNLIMITED } from "./BudgetSlider";
import { MilestoneCard } from "./MilestoneCard";

const MIN_LENGTH = 20;

const SECTORS = [
  "Fintech",
  "SaaS",
  "HealthTech",
  "EdTech",
  "CleanTech",
  "Consumer",
  "DeepTech",
  "E-commerce",
  "Marketplace",
  "Web3",
  "Other",
];
const STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Growth"];
const GEOS = [
  "USA",
  "Europe",
  "UK",
  "India",
  "Southeast Asia",
  "LATAM",
  "Africa",
  "Global",
];

interface CreateSearchResponse {
  id: string;
  status: string;
}

interface CreateSearchBody {
  raw_input: string;
  sectors?: string[];
  stages?: string[];
  geo_focus?: string[];
  budget_min?: number;
  budget_max?: number;
}

export function IdeaForm() {
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [geoFocus, setGeoFocus] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([0, BUDGET_UNLIMITED]);
  const [quotaError, setQuotaError] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const { getToken } = useAuth();
  const setCurrentSearchId = useAppStore((s) => s.setCurrentSearchId);
  const queryClient = useQueryClient();

  const isValid = description.trim().length >= MIN_LENGTH;
  const showError = touched && !isValid;

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateSearchBody = {
        raw_input: description.trim(),
        ...(sectors.length > 0 && { sectors }),
        ...(stages.length > 0 && { stages }),
        ...(geoFocus.length > 0 && { geo_focus: geoFocus }),
        ...(budget[0] > 0 && { budget_min: budget[0] }),
        ...(budget[1] > 0 &&
          budget[1] < BUDGET_UNLIMITED && { budget_max: budget[1] }),
      };
      return apiFetch<CreateSearchResponse>("/searches", getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      setQuotaError(false);
      setGenericError(null);
      setCurrentSearchId(data.id);
      track("search_started", { search_id: data.id });
      router.push(`/search/${data.id}`);
    },
    onError: (error: Error & { status?: number }) => {
      if (
        error.status === 429 ||
        error.message?.toLowerCase().includes("limit reached")
      ) {
        setQuotaError(true);
        setGenericError(null);
        void queryClient.invalidateQueries({ queryKey: ["user-me"] });
      } else {
        setQuotaError(false);
        setGenericError(
          error.message ?? "Something went wrong. Please try again.",
        );
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setQuotaError(false);
    setGenericError(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Describe your startup</label>
        <Textarea
          placeholder="Describe your startup idea, target market, and funding needs..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={5}
          className="resize-none"
          aria-invalid={showError}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {showError && (
              <span className="text-destructive">
                Please enter at least {MIN_LENGTH} characters.
              </span>
            )}
          </span>
          <span>
            {description.trim().length} / {MIN_LENGTH} min
          </span>
        </div>
      </div>

      {/* Refine search toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowFilters((v) => !v)}
        className="flex items-center gap-2 w-fit"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {showFilters ? "Hide filters" : "Refine search"}
      </Button>

      {showFilters && (
        <>
          {/* Sectors */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Sectors{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <MultiSelect
              options={SECTORS}
              value={sectors}
              onChange={setSectors}
              placeholder="Select sectors (optional)"
            />
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Stage{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <MultiSelect
              options={STAGES}
              value={stages}
              onChange={setStages}
              placeholder="Select stages (optional)"
            />
          </div>

          {/* Geography */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Geography{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <MultiSelect
              options={GEOS}
              value={geoFocus}
              onChange={setGeoFocus}
              placeholder="Select geographies (optional)"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Check size range{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <div className="px-1 pt-1">
              <BudgetSlider value={budget} onChange={setBudget} />
            </div>
          </div>
        </>
      )}

      {quotaError && (
        <MilestoneCard
          used={3}
          limit={3}
          onUpgrade={() => track("upgrade_clicked", { source: "quota_error" })}
        />
      )}

      {genericError && !quotaError && (
        <p className="text-sm text-destructive">{genericError}</p>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending || (touched && !isValid)}
        className="w-full"
      >
        {mutation.isPending ? "Starting search..." : "Find Investors"}
      </Button>
    </form>
  );
}
