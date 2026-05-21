import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  rejectSaving: boolean;
  onSubmit: () => void;
};

export function RejectDialog({
  open,
  onOpenChange,
  rejectReason,
  setRejectReason,
  rejectSaving,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak registrasi customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="co-reject-reason">Alasan penolakan</Label>
          <Textarea
            id="co-reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Wajib diisi"
            rows={4}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" variant="destructive" disabled={!rejectReason.trim() || rejectSaving} onClick={onSubmit}>
            {rejectSaving ? "Menyimpan…" : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
