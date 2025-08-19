"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";

type Branch = { id: string; name: string };
type Barber = { id: string; name: string; branches: string[] };

type Shift = {
  id: string;
  barberId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breaks?: { startTime: string; endTime: string }[];
  type?: "full" | "half" | "split";
};

type Template = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
};

const Planner: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<{ startDate: string; endDate: string; templateId: string; barberScope: "selected" | "all"; barberId?: string }>({ startDate: "", endDate: "", templateId: "", barberScope: "selected" });
  const [branchLegacyByUnified, setBranchLegacyByUnified] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [branchesRes, barbersRes, templatesRes, legacyBranchesRes] = await Promise.all([
        fetch("/api/branches/unified"),
        fetch("/api/barbers"),
        fetch("/api/admin/scheduling/templates", { cache: "no-store" }),
        fetch("/branches.json").catch(() => new Response("[]")),
      ]);
      const [branchesJson, barbersJson, templatesJson, legacyBranchesJson] = await Promise.all([
        branchesRes.json(),
        barbersRes.json(),
        templatesRes.ok ? templatesRes.json() : Promise.resolve([]),
        legacyBranchesRes.ok ? legacyBranchesRes.json() : Promise.resolve([]),
      ]);
      const normalizedBranches: Branch[] = (branchesJson || []).map((b: any) => ({ id: b.originalId || b.id, name: b.name }));
      const legacyByName = new Map<string, string>(
        (legacyBranchesJson || []).map((lb: any) => [String(lb.name).toLowerCase(), lb.id]),
      );
      const map: Record<string, string> = {};
      for (const nb of normalizedBranches) {
        const legacyId = legacyByName.get(nb.name.toLowerCase()) || nb.id;
        map[nb.id] = legacyId;
      }
      setBranchLegacyByUnified(map);
      setBranches(normalizedBranches);
      setBarbers(barbersJson || []);
      setTemplates(templatesJson || []);
      if (!selectedBranch && normalizedBranches?.[0]?.id) setSelectedBranch(normalizedBranches[0].id);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshShifts = async () => {
      const start = format(period === "weekly" ? startOfWeek(baseDate) : startOfMonth(baseDate), "yyyy-MM-dd");
      const end = format(period === "weekly" ? endOfWeek(baseDate) : endOfMonth(baseDate), "yyyy-MM-dd");
      const params = new URLSearchParams();
      const branchIdForFilter = branchLegacyByUnified[selectedBranch] || selectedBranch;
      if (selectedBranch) params.set("branchId", branchIdForFilter);
      if (selectedBarber && selectedBarber !== "all") params.set("barberId", selectedBarber);
      params.set("start", start);
      params.set("end", end);
      const res = await fetch(`/api/admin/scheduling/shifts?${params.toString()}`, { cache: "no-store" });
      const data = res.ok ? await res.json() : [];
      setShifts(data);
  };
  useEffect(() => {
    refreshShifts();
  }, [selectedBranch, selectedBarber, period, baseDate, branchLegacyByUnified]);

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
  };
  const endOfWeek = (date: Date) => {
    const s = startOfWeek(date);
    return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
  };
  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const navigate = (deltaDaysOrMonths: number) => {
    setBaseDate((d) =>
      period === "weekly"
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + deltaDaysOrMonths * 7)
        : new Date(d.getFullYear(), d.getMonth() + deltaDaysOrMonths, d.getDate()),
    );
  };

  const days = useMemo(() => {
    if (period === "weekly") {
      const s = startOfWeek(baseDate);
      return new Array(7).fill(0).map((_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
    }
    const s = startOfMonth(baseDate);
    const e = endOfMonth(baseDate);
    const out: Date[] = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) out.push(new Date(d));
    return out;
  }, [baseDate, period]);

  const barbersForBranch = useMemo(() => {
    if (!selectedBranch) return barbers;
    const unifiedId = selectedBranch;
    const legacyId = branchLegacyByUnified[selectedBranch] || selectedBranch;
    return barbers.filter(
      (b) => Array.isArray(b.branches) && (b.branches.includes(legacyId) || b.branches.includes(unifiedId)),
    );
  }, [barbers, selectedBranch, branchLegacyByUnified]);

  useEffect(() => {
    if (selectedBarber === "all") return;
    const stillVisible = barbersForBranch.some((b) => b.id === selectedBarber);
    if (!stillVisible) setSelectedBarber("all");
  }, [barbersForBranch, selectedBarber]);

  const createShift = async (day: Date, specificBarberId?: string) => {
    const barberIdToUse = specificBarberId || selectedBarber;
    if (!selectedBranch || !barberIdToUse || barberIdToUse === "all") return;
    const branchIdForCreate = branchLegacyByUnified[selectedBranch] || selectedBranch;
    const body = {
      branchId: branchIdForCreate,
      barberId: barberIdToUse,
      date: format(day, "yyyy-MM-dd"),
      startTime: "10:00",
      endTime: "19:00",
      type: "full",
    } as Partial<Shift>;
    const res = await fetch("/api/admin/scheduling/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setShifts((s) => [created, ...s]);
    }
  };

  const minutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const bulkCreateShifts = async () => {
    if (!selectedBranch || !createForm.startDate || !createForm.endDate || !createForm.templateId) return;
    const tpl = templates.find((t) => t.id === createForm.templateId);
    if (!tpl) return;
    // Robust date range generation (inclusive) using local midnight to avoid DST/UTC issues
    const startLocal = new Date(`${createForm.startDate}T00:00:00`);
    const endLocal = new Date(`${createForm.endDate}T00:00:00`);
    // Ensure valid and in order
    const start = isNaN(startLocal.getTime()) ? new Date() : startLocal;
    const end = isNaN(endLocal.getTime()) ? start : endLocal;
    const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start];
    const daysCount = differenceInCalendarDays(rangeEnd, rangeStart);
    const dayList: string[] = Array.from({ length: daysCount + 1 }, (_, i) => format(addDays(rangeStart, i), "yyyy-MM-dd"));
    const targetBarbers = createForm.barberScope === "all"
      ? barbersForBranch
      : barbersForBranch.filter((b) => (createForm.barberId ? b.id === createForm.barberId : selectedBarber !== "all" ? b.id === selectedBarber : false));
    const type = minutes(tpl.endTime) - minutes(tpl.startTime) >= 8 * 60 ? "full" : "half";
    const breaks = tpl.breakStart && tpl.breakEnd ? [{ startTime: tpl.breakStart, endTime: tpl.breakEnd }] : [];
    const requests: Promise<any>[] = [];
    const branchIdForCreate = branchLegacyByUnified[selectedBranch] || selectedBranch;
    for (const date of dayList) {
      for (const b of targetBarbers) {
        const payload = { branchId: branchIdForCreate, barberId: b.id, date, startTime: tpl.startTime, endTime: tpl.endTime, type, breaks };
        requests.push(fetch("/api/admin/scheduling/shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
      }
    }
    setIsCreating(true);
    let createdCount = 0;
    let skippedCount = 0;
    for (const date of dayList) {
      for (const b of targetBarbers) {
        const payload = { branchId: branchIdForCreate, barberId: b.id, date, startTime: tpl.startTime, endTime: tpl.endTime, type, breaks };
        try {
          const res = await fetch("/api/admin/scheduling/shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.status === 201) createdCount += 1;
          else if (res.status === 409) skippedCount += 1; // overlap
        } catch (e) {
          // treat as skipped
          skippedCount += 1;
        }
      }
    }
    await refreshShifts();
    toast.success(`Shifts created: ${createdCount}${skippedCount ? `, skipped: ${skippedCount}` : ""}`);
    setIsCreating(false);
    setIsCreateOpen(false);
  };

  const label = period === "weekly"
    ? `${format(startOfWeek(baseDate), "MMM d")} - ${format(endOfWeek(baseDate), "MMM d, yyyy")}`
    : format(baseDate, "MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Select branch" /></SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedBarber} onValueChange={setSelectedBarber}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All barbers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All barbers</SelectItem>
            {barbersForBranch.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2 ">
          <Button variant="outline" onClick={() => navigate(-1)}>Prev</Button>
          <div className="min-w-[220px] text-center font-medium ">{label}</div>
          <Button variant="outline" onClick={() => navigate(1)}>Next</Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Shifts</Button>
            </DialogTrigger>
            <DialogContent className="text-white">
              <DialogHeader>
                <DialogTitle>Create shifts</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start date</Label>
                    <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input type="date" value={createForm.endDate} onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Template</Label>
                  <Select value={createForm.templateId} onValueChange={(v) => setCreateForm((f) => ({ ...f, templateId: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select a template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.startTime}-{t.endTime})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Barber scope</Label>
                    <Select value={createForm.barberScope} onValueChange={(v) => setCreateForm((f) => ({ ...f, barberScope: v as any }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="selected">Selected barber</SelectItem>
                        <SelectItem value="all">All barbers in branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Barber</Label>
                    <Select value={createForm.barberId || (selectedBarber !== "all" ? selectedBarber : undefined)} onValueChange={(v) => setCreateForm((f) => ({ ...f, barberId: v }))} disabled={createForm.barberScope === "all"}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose barber" /></SelectTrigger>
                      <SelectContent>
                        {barbersForBranch.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={bulkCreateShifts} disabled={isCreating || !createForm.startDate || !createForm.endDate || !createForm.templateId}>{isCreating ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(${days.length}, 1fr)` }}>
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="px-2 py-1 text-center text-sm text-muted-foreground">
              {format(d, "EEE\nMMM d")}
            </div>
          ))}

          {barbersForBranch.map((b) => (
            <React.Fragment key={b.id}>
              <div className="px-3 py-2 font-medium border-t">{b.name}</div>
              {days.map((d) => {
                const dayStr = format(d, "yyyy-MM-dd");
                const s = shifts.filter((s) => s.barberId === b.id && s.date === dayStr);
                return (
                  <div key={dayStr + b.id} className="border-t px-2 py-2">
                    {s.length === 0 ? (
                      <Button size="sm" variant="ghost" onClick={() => { createShift(d, b.id); }}>
                        + Add shift
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {s.map((sh) => (
                          <div key={sh.id} className="rounded border bg-muted px-2 py-1 text-xs flex items-center justify-between gap-2">
                            <span>{sh.startTime} - {sh.endTime} {sh.type ? `(${sh.type})` : ""}</span>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditShift(sh)} title="Edit">✏️</Button>
                              <Button size="icon" variant="ghost" onClick={async () => {
                                setIsDeletingId(sh.id);
                                try {
                                  const res = await fetch(`/api/admin/scheduling/shifts?id=${sh.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    await refreshShifts();
                                  }
                                } finally {
                                  setIsDeletingId(null);
                                }
                              }} title="Delete" disabled={isDeletingId === sh.id}>🗑️</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Dialog open={!!editShift} onOpenChange={(o) => { if (!o) setEditShift(null); }}>
        <DialogContent className="text-white">
          <DialogHeader>
            <DialogTitle>Edit shift</DialogTitle>
          </DialogHeader>
          {editShift && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start time</Label>
                  <Input type="time" value={editShift.startTime} onChange={(e) => setEditShift({ ...editShift, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input type="time" value={editShift.endTime} onChange={(e) => setEditShift({ ...editShift, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editShift.type || "full"} onValueChange={(v) => setEditShift({ ...editShift, type: v as any })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="half">Half</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditShift(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editShift) return;
              const res = await fetch(`/api/admin/scheduling/shifts`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editShift.id, startTime: editShift.startTime, endTime: editShift.endTime, type: editShift.type }) });
              if (res.ok) {
                setEditShift(null);
                await refreshShifts();
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planner;


