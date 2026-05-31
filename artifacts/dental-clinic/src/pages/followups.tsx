import { useState } from "react";
import { useListFollowups, useUpdateFollowup, getListFollowupsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FollowUps() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: followups, isLoading } = useListFollowups(params, { query: { queryKey: getListFollowupsQueryKey(params) } });
  const update = useUpdateFollowup();

  const handleStatusChange = (id: number, status: string) => {
    update.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          toast({ title: "Follow-up updated" });
          queryClient.invalidateQueries({ queryKey: getListFollowupsQueryKey() });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  };

  const isOverdue = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <p className="text-muted-foreground text-sm">Manage scheduled patient follow-ups</p>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "completed", "cancelled"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : followups && followups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {followups.map((fu) => (
                    <tr key={fu.id} className="hover:bg-muted/20" data-testid={`row-followup-${fu.id}`}>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${fu.patientId}`} className="font-medium hover:text-primary transition-colors">{fu.patientName || `Patient #${fu.patientId}`}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={fu.status === "pending" && isOverdue(fu.scheduledDate) ? "text-destructive font-medium" : ""}>
                          {new Date(fu.scheduledDate).toLocaleDateString()}
                        </span>
                        {fu.status === "pending" && isOverdue(fu.scheduledDate) && <span className="text-xs text-destructive ml-1">Overdue</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{fu.notes || "—"}</td>
                      <td className="px-4 py-3"><Badge variant={fu.status === "completed" ? "default" : fu.status === "cancelled" ? "secondary" : "outline"} className="capitalize text-xs">{fu.status}</Badge></td>
                      <td className="px-4 py-3">
                        {fu.status === "pending" && (
                          <Select value={fu.status} onValueChange={(v) => handleStatusChange(fu.id, v)}>
                            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No follow-ups found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
