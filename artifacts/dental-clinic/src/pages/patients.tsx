import { useState } from "react";
import { useListPatients, useCreatePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function RegisterPatientDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", age: "", gender: "male", contactNumber: "", email: "", address: "", emergencyContact: "", emergencyPhone: "", bloodGroup: "" });
  const create = useCreatePatient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { fullName: form.fullName, age: parseInt(form.age), gender: form.gender as any, contactNumber: form.contactNumber, email: form.email || undefined, address: form.address || undefined, emergencyContact: form.emergencyContact || undefined, emergencyPhone: form.emergencyPhone || undefined, bloodGroup: form.bloodGroup || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Patient registered successfully" });
          setOpen(false);
          setForm({ fullName: "", age: "", gender: "male", contactNumber: "", email: "", address: "", emergencyContact: "", emergencyPhone: "", bloodGroup: "" });
          onSuccess();
        },
        onError: () => toast({ title: "Failed to register patient", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-register-patient"><Plus className="h-4 w-4 mr-1" />Register Patient</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Full Name *</Label>
              <Input data-testid="input-fullname" value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Age *</Label>
              <Input data-testid="input-age" type="number" value={form.age} onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))} required min={1} max={120} />
            </div>
            <div className="space-y-1">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Contact Number *</Label>
              <Input data-testid="input-contact" value={form.contactNumber} onChange={(e) => setForm(f => ({ ...f, contactNumber: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Blood Group</Label>
              <Input value={form.bloodGroup} onChange={(e) => setForm(f => ({ ...f, bloodGroup: e.target.value }))} placeholder="e.g. O+" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Emergency Contact</Label>
              <Input value={form.emergencyContact} onChange={(e) => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Emergency Phone</Label>
              <Input value={form.emergencyPhone} onChange={(e) => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending} data-testid="button-submit-patient">{create.isPending ? "Registering..." : "Register"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Patients() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useListPatients(
    debouncedSearch ? { search: debouncedSearch } : {},
    { query: { queryKey: getListPatientsQueryKey(debouncedSearch ? { search: debouncedSearch } : {}) } }
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 300);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground text-sm">Search and manage patient records</p>
        </div>
        <RegisterPatientDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() })} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-patient"
          className="pl-9"
          placeholder="Search by name, ID, or phone..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age/Gender</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Blood Group</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-patient-${p.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{p.patientId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.age}y · <span className="capitalize">{p.gender}</span></td>
                      <td className="px-4 py-3">{p.contactNumber}</td>
                      <td className="px-4 py-3">{p.bloodGroup || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{search ? "No patients found matching your search" : "No patients registered yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
