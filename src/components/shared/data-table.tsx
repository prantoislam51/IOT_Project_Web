"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Inbox } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href: string };
  pageSize?: number;
}

export function DataTable<T extends { _id?: string }>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = search.trim()
    ? data.filter((row) =>
        columns.some((col) => {
          const val = col.render(row);
          return typeof val === "string" && val.toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div className="space-y-4">
      {searchable && (
        <SearchInput value={search} onValueChange={(v) => { setSearch(v); setPage(0); }} placeholder={searchPlaceholder} />
      )}

      {paged.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key} className={col.hideOnMobile ? "hidden md:table-cell" : col.className}>
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row, i) => (
                  <TableRow key={row._id ?? i}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.hideOnMobile ? "hidden md:table-cell" : col.className}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {safePage * pageSize + 1}&ndash;{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(0)}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-sm font-medium">{safePage + 1} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
