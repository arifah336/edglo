import { useState } from 'react';
import type { Payment } from '../../types';
import { MONTH_NAMES, formatCurrency } from '../../data/mockData';

type ChartMode = 'nominal' | 'rate';

export default function YearlyOverview({ payments, year }: { payments: Payment[]; year: number }) {
  const months = MONTH_NAMES.map((name, index) => {
    const rows = payments.filter((payment) => payment.year === year && payment.month === index + 1);
    const billed = rows.reduce((sum, row) => sum + row.total, 0);
    const paid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.total, 0);
    const overdue = rows.filter((row) => row.status === 'overdue').length;
    return { name, billed, paid, outstanding: billed - paid, count: rows.length, overdue, rate: billed ? Math.round((paid / billed) * 100) : 0 };
  });
  const latestMonthIndex = months.reduce((latest, month, index) => month.count > 0 ? index : latest, 0);
  const [selectedIndex, setSelectedIndex] = useState(latestMonthIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<ChartMode>('nominal');
  const maxNominal = Math.max(...months.map((month) => month.billed), 1);
  const selected = months[selectedIndex];
  const yearlyPaid = months.reduce((sum, month) => sum + month.paid, 0);
  const yearlyBilled = months.reduce((sum, month) => sum + month.billed, 0);

  const selectPrevious = () => setSelectedIndex((current) => current === 0 ? 11 : current - 1);
  const selectNext = () => setSelectedIndex((current) => current === 11 ? 0 : current + 1);

  return (
    <div className="yearly-overview card">
      <div className="yearly-chart-heading">
        <div><span className="eyebrow">ARUS KAS {year}</span><h3>Performa penerimaan bulanan</h3><p>Arahkan kursor atau pilih bulan untuk melihat rinciannya.</p></div>
        <div className="yearly-heading-actions">
          <div className="chart-mode-switch" aria-label="Mode grafik"><button type="button" className={mode === 'nominal' ? 'active' : ''} onClick={() => setMode('nominal')}>Nominal</button><button type="button" className={mode === 'rate' ? 'active' : ''} onClick={() => setMode('rate')}>Persentase</button></div>
          <div className="year-total"><span>Total diterima</span><strong>{formatCurrency(yearlyPaid)}</strong><small>dari {formatCurrency(yearlyBilled)}</small></div>
        </div>
      </div>

      <div className={`interactive-year-chart chart-${mode}`}>
        <div className="chart-scale"><span>{mode === 'nominal' ? formatCurrency(maxNominal) : '100%'}</span><span>{mode === 'nominal' ? formatCurrency(maxNominal / 2) : '50%'}</span><span>0</span></div>
        <div className="year-bars">
          {months.map((month, index) => {
            const isActive = selectedIndex === index;
            const isHovered = hoveredIndex === index;
            return (
              <button
                type="button"
                className={`year-bar-item${isActive ? ' selected' : ''}`}
                key={month.name}
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={`${month.name}: diterima ${formatCurrency(month.paid)} dari ${formatCurrency(month.billed)}`}
              >
                {isHovered && <span className="month-chart-tooltip"><strong>{month.name} {year}</strong><span>Ditagihkan <b>{formatCurrency(month.billed)}</b></span><span>Diterima <b>{formatCurrency(month.paid)}</b></span><span>Piutang <b>{formatCurrency(month.outstanding)}</b></span><small>{month.count} tagihan · {month.rate}% tertagih</small></span>}
                <span className="year-bar-track">
                  {mode === 'nominal' ? <><i className="year-bar-billed" style={{ height: `${Math.max((month.billed / maxNominal) * 100, month.billed ? 7 : 0)}%` }} /><i className="year-bar-paid" style={{ height: `${Math.max((month.paid / maxNominal) * 100, month.paid ? 5 : 0)}%` }} /></> : <i className="year-bar-rate" style={{ height: `${Math.max(month.rate, month.billed ? 5 : 0)}%` }} />}
                </span>
                <strong>{month.name.slice(0, 3)}</strong>
                <small>{month.count}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="year-chart-footer">
        <div className="year-legend">{mode === 'nominal' ? <><span><i className="legend-billed" />Ditagihkan</span><span><i className="legend-paid" />Diterima</span></> : <span><i className="legend-rate" />Persentase tertagih</span>}</div>
        <small>Angka di bawah bulan menunjukkan jumlah tagihan</small>
      </div>

      <div className="selected-month-panel">
        <button type="button" className="month-arrow" onClick={selectPrevious} aria-label="Bulan sebelumnya">‹</button>
        <div className="selected-month-title"><span>BULAN TERPILIH</span><strong>{selected.name} {year}</strong><small>{selected.count} tagihan · {selected.overdue} terlambat</small></div>
        <div className="month-metric"><span>Ditagihkan</span><strong>{formatCurrency(selected.billed)}</strong></div>
        <div className="month-metric metric-paid"><span>Diterima</span><strong>{formatCurrency(selected.paid)}</strong></div>
        <div className="month-metric metric-outstanding"><span>Piutang</span><strong>{formatCurrency(selected.outstanding)}</strong></div>
        <div className="month-metric metric-rate"><span>Tertagih</span><strong>{selected.rate}%</strong></div>
        <button type="button" className="month-arrow" onClick={selectNext} aria-label="Bulan berikutnya">›</button>
      </div>
    </div>
  );
}
