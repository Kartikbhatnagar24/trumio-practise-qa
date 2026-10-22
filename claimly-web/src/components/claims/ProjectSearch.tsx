import { useEffect, useState } from "react";

import { findProjects } from "@/actions/claims-actions";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { fieldClass } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Project } from "@/constraints/types/claim-types";
import { cn } from "@/lib/utils";

interface ProjectSearchProps {
  selected: Project | null;
  error?: string;
  onChange: (project: Project | null) => void;
}

export function ProjectSearch({ selected, error, onChange }: ProjectSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => setProjects(await findProjects(query)), 200);
    return () => clearTimeout(timer);
  }, [open, query]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="project">
        Project <span className="text-xs font-normal text-secondary">Optional</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button id="project" type="button" role="combobox" aria-expanded={open} aria-invalid={!!error} className={cn(fieldClass, "flex cursor-pointer items-center justify-between text-left")}>
            <span className={selected ? "" : "text-muted"}>{selected ? selected.name : "Search by project name or code"}</span>
            {selected && <span className="text-secondary">{selected.code}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Type a project name or code…" aria-label="Search projects" />
            <CommandList>
              <CommandEmpty className="px-3 py-2 text-secondary">No active project matches.</CommandEmpty>
              {selected && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-secondary">No project</span>
                </CommandItem>
              )}
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => {
                    onChange(project);
                    setOpen(false);
                  }}
                >
                  <span>{project.name}</span>
                  <span className="text-secondary">{project.code}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-[13px] leading-[18px] text-danger">{error}</span>}
    </div>
  );
}
