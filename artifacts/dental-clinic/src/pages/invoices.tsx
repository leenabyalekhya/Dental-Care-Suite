import { useState } from "react";
import { useListInvoices, useCreateInvoice, useListPatients, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", description: "", amount: "", paymentStatus: "pending", paymentMethod: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { paymentStatus: statusFilter } : {};
  const { data: invoices, isLoading } = useListInvoices(params, { query: { queryKey: getListInvoicesQueryKey(params) } });
  const { data: patients } = useListPatients({});
  const create = useCreateInvoice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    create.mutate(
      {
        data: {
          patientId: parseInt(form.patientId),
          items: [{ description: form.description, quantity: 1, unitPrice: amount, amount }],
          subtotal: amount,
          total: amount,
          paymentStatus: form.paymentStatus as any,
          paymentMethod: form.paymentMethod || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Invoice created" });
          setOpen(false);
          setForm({ patientId: "", description: "", amount: "", paymentStatus: "pending", paymentMethod: "" });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        },
        onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">Billing and payment tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-invoice"><Plus className="h-4 w-4 mr-1" />New Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Patient *</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm(f => ({ ...f, patientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.fullName} ({p.patientId})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>Amount (₹) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} /></div>
              <div className="space-y-1">
                <Label>Payment Status</Label>
                <Select value={form.paymentStatus} onValueChange={(v) => setForm(f => ({ ...f, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Payment Method</Label><Input value={form.paymentMethod} onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))} placeholder="Cash, Card, UPI..." /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>Create</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "paid", "partial"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20" data-testid={`row-invoice-${inv.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                      <td className="px-4 py-3 font-medium">₹{Number(inv.total).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge variant={inv.paymentStatus === "paid" ? "default" : inv.paymentStatus === "partial" ? "outline" : "secondary"} className="capitalize text-xs">{inv.paymentStatus}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.paymentMethod || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Link href={`/invoices/${inv.id}`}><Button variant="ghost" size="sm" className="h-7 text-xs">View</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
