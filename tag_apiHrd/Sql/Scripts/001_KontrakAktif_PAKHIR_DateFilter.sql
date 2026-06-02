/*
  PATCH RINGKAS — Web_Asp_ViewDataKontrakAktif

  Parameter @ctglakhirawal / @ctglakhirakhir sudah ada di signature.
  Tambahkan di blok INSERT #Result (setelah filter jenis kontrak):

    AND (@ctglakhirawal IS NULL OR CAST(PAKHIR AS DATE) >= @ctglakhirawal)
    AND (@ctglakhirakhir IS NULL OR CAST(PAKHIR AS DATE) <= @ctglakhirakhir)

  COUNT dan paging membaca dari #Result — otomatis ikut terfilter.

  SP lengkap yang sudah diperbaiki:
    Sql/Scripts/002_Web_Asp_ViewDataKontrakAktif.sql

  SP report (print):
    Sql/Scripts/003_Web_Asp_ReportDataKontrakAktifAll.sql
*/
