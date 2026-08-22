<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 16mm 13mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #20313a; font-family: DejaVu Sans, sans-serif; font-size: 8px; }
        header { padding-bottom: 10px; border-bottom: 2px solid #1687a7; }
        .brand { color: #1687a7; font-size: 21px; font-weight: bold; }
        .brand span { color: #ffb020; }
        h1 { margin: 5px 0 2px; color: #17232d; font-size: 15px; }
        .meta { width: 100%; margin-top: 8px; padding: 7px 9px; border: 1px solid #dce8eb; background: #f3f8f9; }
        .meta td:last-child { text-align: right; }
        table.data { width: 100%; margin-top: 11px; border-collapse: collapse; table-layout: auto; }
        .data th { padding: 7px 6px; border: 1px solid #cbdde2; color: #315a68; background: #e9f4f6; font-size: 7px; text-align: left; text-transform: uppercase; }
        .data td { padding: 6px; border: 1px solid #dce6e9; vertical-align: top; }
        .data tr { page-break-inside: avoid; }
        .data tbody tr:nth-child(even) { background: #f8fbfc; }
        .empty { padding: 22px !important; color: #778a93; text-align: center; }
        footer { margin-top: 14px; color: #7a8b93; font-size: 7px; }
        .signature { width: 180px; margin: 22px 0 0 auto; color: #425a65; text-align: center; }
        .signature-line { margin-top: 34px; padding-top: 4px; border-top: 1px solid #617681; font-weight: bold; }
    </style>
</head>
<body>
    <header>
        <div class="brand">Ed<span>GLO</span></div>
        <h1>{{ $title }}</h1>
        <div>EdGLO Learning Center - Learn, Do, Repeat</div>
    </header>

    <table class="meta">
        <tr><td><strong>Periode:</strong> {{ $period }}</td><td>Dibuat {{ now()->format('d/m/Y H:i') }} oleh {{ $generatedBy }}</td></tr>
    </table>

    <table class="data">
        <thead><tr><th style="width: 24px">No.</th>@foreach($columns as $column)<th>{{ $column }}</th>@endforeach</tr></thead>
        <tbody>
        @forelse($rows as $index => $row)
            <tr><td>{{ $index + 1 }}</td>@foreach($row as $value)<td>{{ $value }}</td>@endforeach</tr>
        @empty
            <tr><td class="empty" colspan="{{ count($columns) + 1 }}">Tidak ada data pada periode ini.</td></tr>
        @endforelse
        </tbody>
    </table>

    @if($showSignature)
        <div class="signature"><div>Mengetahui,</div><div class="signature-line">Penanggung Jawab EdGLO</div></div>
    @endif
    <footer>Dokumen ini dibuat oleh Sistem Administrasi EdGLO dan digunakan untuk kebutuhan administrasi internal lembaga.</footer>
</body>
</html>
