/*
  dbo.Web_Asp_ReportDataKontrakAktifAll
  Filter range tanggal berakhir: @ctglakhirawal, @ctglakhirakhir
  (PAKHIR inklusif; NULL = tidak memfilter)

  Jalankan di database SISTAGHRD setelah backup.
*/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE dbo.Web_Asp_ReportDataKontrakAktifAll
(
    @ckdcabang         NVARCHAR(10)  = NULL,
    @cnokontrak        NVARCHAR(50)  = NULL,
    @cnmkaryawan       NVARCHAR(100) = NULL,
    @cjnskontrak       NVARCHAR(20)  = NULL,
    @SisaKontrakFilter NVARCHAR(20)  = NULL,
    @ctglakhirawal     DATE          = NULL,
    @ctglakhirakhir    DATE          = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- NORMALISASI PARAMETER
    ------------------------------------------------------------
    SET @ckdcabang         = NULLIF(LTRIM(RTRIM(@ckdcabang)), '');
    SET @cnokontrak        = NULLIF(LTRIM(RTRIM(@cnokontrak)), '');
    SET @cnmkaryawan       = NULLIF(LTRIM(RTRIM(@cnmkaryawan)), '');
    SET @cjnskontrak       = NULLIF(LTRIM(RTRIM(@cjnskontrak)), '');
    SET @SisaKontrakFilter = NULLIF(LTRIM(RTRIM(@SisaKontrakFilter)), '');

    DECLARE @Now DATETIME = GETDATE();
    DECLARE @Today DATE = CAST(@Now AS DATE);
    DECLARE @FirstDayOfCurrentMonth DATE = DATEADD(DAY, 1 - DAY(@Today), @Today);
    DECLARE @GraceStart DATE = DATEADD(MONTH, -1, @FirstDayOfCurrentMonth);

    IF OBJECT_ID('tempdb..#Result') IS NOT NULL
        DROP TABLE #Result;

    ;WITH
    CTE_MstKtp AS
    (
        SELECT
            a.NOKTP COLLATE DATABASE_DEFAULT AS NOKTP,
            a.NAMALENGKAP COLLATE DATABASE_DEFAULT AS NMKARYAWAN,
            a.IDFINGER COLLATE DATABASE_DEFAULT AS IDFINGER,
            a.TGLMASUK AS TMT,
            a.TGLLAHIR,
            a.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG,
            a.NMCABANG COLLATE DATABASE_DEFAULT AS NMCABANG
        FROM HRDTAG.dbo.MST_KTP a
        WHERE
            a.KDCABANG IS NOT NULL
            AND (@ckdcabang IS NULL OR a.KDCABANG = @ckdcabang)
    ),
    CTE_Baru AS
    (
        SELECT
            b.NOKTP COLLATE DATABASE_DEFAULT AS NOKTP,
            RIGHT('0000000000' + ISNULL(b.NIKSISTAG, ''), 10) COLLATE DATABASE_DEFAULT AS NIKSISTAG,
            CAST('PKWT' AS NVARCHAR(20)) COLLATE DATABASE_DEFAULT AS JNSKONTRAK,
            b.NOKONTRAK COLLATE DATABASE_DEFAULT AS NOKONTRAK,
            b.PAWAL,
            b.PAKHIR,
            b.PAWAL AS BEGINDATE,
            b.PAKHIR AS ENDDATE,
            b.NMDIVISI COLLATE DATABASE_DEFAULT AS NMDIVISI,
            b.NMBAGIAN COLLATE DATABASE_DEFAULT AS NMBAGIAN,
            b.NMJABATAN COLLATE DATABASE_DEFAULT AS NMJABATAN,
            b.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG,
            CAST(1 AS INT) AS PRIORITAS_SUMBER
        FROM dbo.TRX_KONTRAKKARYAWAN b
        WHERE
            b.PAKHIR >= DATEADD(MONTH, -1, @Now)
            AND b.PAWAL <= @Now
            AND (@ckdcabang IS NULL OR b.KDCABANG = @ckdcabang)
    ),
    CTE_LamaAktif AS
    (
        SELECT
            b.NOKTP COLLATE DATABASE_DEFAULT AS NOKTP,
            RIGHT('0000000000' + ISNULL(b.NIKSISTAG, ''), 10) COLLATE DATABASE_DEFAULT AS NIKSISTAG,
            b.JNSKONTRAK COLLATE DATABASE_DEFAULT AS JNSKONTRAK,
            b.NOKONTRAK COLLATE DATABASE_DEFAULT AS NOKONTRAK,
            b.PAWAL,
            b.PAKHIR,
            CASE
                WHEN b.JNSKONTRAK = 'PKWT' THEN DATEADD(MONTH, 3, b.PAWAL)
                ELSE b.PAWAL
            END AS BEGINDATE,
            b.PAKHIR AS ENDDATE,
            b.NMDIVISI COLLATE DATABASE_DEFAULT AS NMDIVISI,
            b.NMBAGIAN COLLATE DATABASE_DEFAULT AS NMBAGIAN,
            b.NMJABATAN COLLATE DATABASE_DEFAULT AS NMJABATAN,
            b.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG,
            CAST(2 AS INT) AS PRIORITAS_SUMBER
        FROM HRDTAG.dbo.DATA_KONTRAKKARYAWAN b WITH (NOLOCK)
        WHERE
            b.PAKHIR >= @Now
            AND (@ckdcabang IS NULL OR b.KDCABANG = @ckdcabang)
    ),
    CTE_LamaGrace AS
    (
        SELECT
            b.NOKTP COLLATE DATABASE_DEFAULT AS NOKTP,
            RIGHT('0000000000' + ISNULL(b.NIKSISTAG, ''), 10) COLLATE DATABASE_DEFAULT AS NIKSISTAG,
            b.JNSKONTRAK COLLATE DATABASE_DEFAULT AS JNSKONTRAK,
            b.NOKONTRAK COLLATE DATABASE_DEFAULT AS NOKONTRAK,
            b.PAWAL,
            b.PAKHIR,
            CASE
                WHEN b.JNSKONTRAK = 'PKWT' THEN DATEADD(MONTH, 3, b.PAWAL)
                ELSE b.PAWAL
            END AS BEGINDATE,
            b.PAKHIR AS ENDDATE,
            b.NMDIVISI COLLATE DATABASE_DEFAULT AS NMDIVISI,
            b.NMBAGIAN COLLATE DATABASE_DEFAULT AS NMBAGIAN,
            b.NMJABATAN COLLATE DATABASE_DEFAULT AS NMJABATAN,
            b.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG,
            CAST(3 AS INT) AS PRIORITAS_SUMBER
        FROM HRDTAG.dbo.DATA_KONTRAKKARYAWAN b WITH (NOLOCK)
        WHERE
            b.PAKHIR BETWEEN @GraceStart AND @Now
            AND b.NOKONTRAK NOT IN ('00202/PKWT/HRD_TAG/00/IX/2023')
            AND (@ckdcabang IS NULL OR b.KDCABANG = @ckdcabang)
    ),
    CTE_AllKontrak AS
    (
        SELECT * FROM CTE_Baru
        UNION ALL
        SELECT * FROM CTE_LamaAktif
        UNION ALL
        SELECT * FROM CTE_LamaGrace
    ),
    CTE_KontrakTerbaik AS
    (
        SELECT
            x.*,
            ROW_NUMBER() OVER
            (
                PARTITION BY x.NOKTP
                ORDER BY
                    x.PRIORITAS_SUMBER ASC,
                    x.PAKHIR DESC,
                    x.PAWAL DESC,
                    x.NOKONTRAK DESC
            ) AS RN
        FROM CTE_AllKontrak x
    ),
    CTE_PegawaiKontrak AS
    (
        SELECT
            m.NOKTP,
            k.NIKSISTAG,
            m.NMKARYAWAN,
            m.IDFINGER,
            k.JNSKONTRAK,
            k.NOKONTRAK,
            k.NMDIVISI,
            k.NMBAGIAN,
            k.NMJABATAN,
            k.PAWAL,
            k.PAKHIR,
            m.TMT,
            m.TGLLAHIR,
            m.KDCABANG
        FROM CTE_MstKtp m
        INNER JOIN CTE_KontrakTerbaik k
            ON m.NOKTP = k.NOKTP
           AND k.RN = 1
        WHERE
            k.NIKSISTAG IS NOT NULL
            AND k.ENDDATE >= @Now
            AND k.BEGINDATE <= @Now
    ),
    CTE_PegawaiTetap AS
    (
        SELECT
            t.NOKTP COLLATE DATABASE_DEFAULT AS NOKTP,
            t.NIKSISTAG COLLATE DATABASE_DEFAULT AS NIKSISTAG,
            t.NAMALENGKAP COLLATE DATABASE_DEFAULT AS NMKARYAWAN,
            t.IDFINGER COLLATE DATABASE_DEFAULT AS IDFINGER,
            CAST('TETAP' AS NVARCHAR(20)) COLLATE DATABASE_DEFAULT AS JNSKONTRAK,
            CONCAT('TETAP', '-', t.NIKSISTAG) COLLATE DATABASE_DEFAULT AS NOKONTRAK,
            t.NMDIVISI COLLATE DATABASE_DEFAULT AS NMDIVISI,
            t.NMBAGIAN COLLATE DATABASE_DEFAULT AS NMBAGIAN,
            t.NMJABATAN COLLATE DATABASE_DEFAULT AS NMJABATAN,
            t.TGLMASUK AS PAWAL,
            pk.TGLRESIGN AS PAKHIR,
            t.TGLMASUK AS TMT,
            t.TGLLAHIR,
            t.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG
        FROM HRDTAG.dbo.MST_KARYAWANTETAP t
        LEFT JOIN dbo.TRX_KARYAWANPK pk
            ON t.NOKTP COLLATE DATABASE_DEFAULT = pk.NOKTP COLLATE DATABASE_DEFAULT
        WHERE
            (@ckdcabang IS NULL OR t.KDCABANG = @ckdcabang)
            AND pk.TGLRESIGN IS NULL
            AND t.TGLMASUK <= @Now
    ),
    CTE_Final AS
    (
        SELECT * FROM CTE_PegawaiKontrak
        UNION ALL
        SELECT * FROM CTE_PegawaiTetap
    )
    ------------------------------------------------------------
    -- FILTER AKHIR (termasuk range tanggal berakhir PAKHIR)
    ------------------------------------------------------------
    SELECT
        *,
        CASE
            WHEN PAKHIR IS NULL THEN NULL
            WHEN CAST(PAKHIR AS DATE) < CAST(GETDATE() AS DATE) THEN -1
            ELSE DATEDIFF(DAY, CAST(GETDATE() AS DATE), CAST(PAKHIR AS DATE))
        END AS SISA_KONTRAK
    INTO #Result
    FROM CTE_Final
    WHERE
        (@cnokontrak IS NULL OR NOKONTRAK LIKE '%' + @cnokontrak + '%')
        AND (@cnmkaryawan IS NULL OR NMKARYAWAN LIKE '%' + @cnmkaryawan + '%')
        AND (@cjnskontrak IS NULL OR JNSKONTRAK = @cjnskontrak)
        AND (@ctglakhirawal IS NULL OR CAST(PAKHIR AS DATE) >= @ctglakhirawal)
        AND (@ctglakhirakhir IS NULL OR CAST(PAKHIR AS DATE) <= @ctglakhirakhir);

    IF @SisaKontrakFilter IS NOT NULL
    BEGIN
        DELETE FROM #Result
        WHERE NOT (
            (@SisaKontrakFilter = 'KRITIS'
                AND SISA_KONTRAK BETWEEN 0 AND 7)
            OR (@SisaKontrakFilter = 'MENIPIS'
                AND SISA_KONTRAK BETWEEN 0 AND 30)
            OR (@SisaKontrakFilter = 'AMAN'
                AND SISA_KONTRAK > 30)
            OR (@SisaKontrakFilter = 'EXPIRED'
                AND SISA_KONTRAK < 0)
        );
    END;

    SELECT
        NOKTP,
        NIKSISTAG,
        NMKARYAWAN,
        IDFINGER,
        JNSKONTRAK,
        NOKONTRAK,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        PAWAL,
        PAKHIR,
        TMT,
        TGLLAHIR,
        KDCABANG,
        SISA_KONTRAK
    FROM #Result
    ORDER BY NMKARYAWAN, NOKTP
    OPTION (RECOMPILE);
END
GO
