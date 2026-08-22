type Props = {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  label?: string;
};

function visiblePages(current: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  return Array.from(pages).filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

export default function DataPagination({ totalItems, page, pageSize, onPageChange, onPageSizeChange, label = 'data' }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pages = visiblePages(safePage, totalPages);

  return (
    <div className="data-pagination">
      <div className="pagination-size"><span>Tampilkan</span><select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{[10, 20, 50].map((size) => <option value={size} key={size}>{size}</option>)}</select><span>{label}</span></div>
      <span className="pagination-info">Menampilkan {start}-{end} dari {totalItems} {label}</span>
      <nav className="pagination-pages" aria-label="Navigasi halaman">
        <button type="button" onClick={() => onPageChange(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Halaman sebelumnya">‹</button>
        {pages.map((pageNumber, index) => {
          const previous = pages[index - 1];
          return <span className="pagination-page-group" key={pageNumber}>{previous && pageNumber - previous > 1 && <i>...</i>}<button type="button" className={pageNumber === safePage ? 'active' : ''} onClick={() => onPageChange(pageNumber)} aria-current={pageNumber === safePage ? 'page' : undefined}>{pageNumber}</button></span>;
        })}
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} aria-label="Halaman berikutnya">›</button>
      </nav>
    </div>
  );
}
