import { Button } from "@/components/ui/button";

interface PaginationFooterProps {
  total: number;
  page: number;
  lastPage: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationFooter({ total, page, lastPage, onPrev, onNext }: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-muted-foreground text-sm">
        {total} résultat{total !== 1 ? "s" : ""} · page {page}/{Math.max(lastPage, 1)}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
          Précédent
        </Button>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={onNext}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
