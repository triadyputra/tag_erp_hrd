ALTER PROCEDURE dbo.Web_Asp_ViewAprovalEvaluasiKontrak
(
    @nama        NVARCHAR(100) = NULL,
    @kdcabang    NVARCHAR(10) = NULL,
    @tglAwal     DATE = NULL,
    @tglAkhir    DATE = NULL,
    @pAkhirAwal  DATE = NULL,
    @pAkhirAkhir DATE = NULL,
    @keputusan   NVARCHAR(200) = NULL, -- contoh: 'MENUNGGU,PERPANJANG'
    @page        INT = 1,
    @pageSize    INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- NORMALISASI
    ------------------------------------------------------------
    SET @nama      = NULLIF(LTRIM(RTRIM(@nama)), '');
    SET @kdcabang  = NULLIF(LTRIM(RTRIM(@kdcabang)), '');
    SET @keputusan = NULLIF(LTRIM(RTRIM(@keputusan)), '');

    IF @page < 1 SET @page = 1;
    IF @pageSize < 1 SET @pageSize = 10;
    IF @pageSize > 100 SET @pageSize = 100;

    DECLARE @Offset INT = (@page - 1) * @pageSize;

    ------------------------------------------------------------
    -- FILTER KEPUTUSAN (multi value) - TANPA STRING_SPLIT
    ------------------------------------------------------------
    DECLARE @KeputusanFilter TABLE (val NVARCHAR(100) PRIMARY KEY);
    IF @keputusan IS NOT NULL
    BEGIN
        DECLARE @xml XML;

        -- escape & lalu ubah csv -> xml list
        SET @keputusan = REPLACE(@keputusan, '&', '&amp;');
        SET @xml = CAST('<i>' + REPLACE(@keputusan, ',', '</i><i>') + '</i>' AS XML);

        INSERT INTO @KeputusanFilter(val)
        SELECT DISTINCT UPPER(LTRIM(RTRIM(T.c.value('.', 'nvarchar(100)'))))
        FROM @xml.nodes('/i') AS T(c)
        WHERE NULLIF(LTRIM(RTRIM(T.c.value('.', 'nvarchar(100)'))), '') IS NOT NULL;
    END

    ------------------------------------------------------------
    -- TEMP TABLE
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#Result') IS NOT NULL
        DROP TABLE #Result;

    ------------------------------------------------------------
    -- DATA
    ------------------------------------------------------------
    SELECT
        a.KDCABANG,
        b.NMCABANG,
        a.NOTRAN,
        a.NOKONTRAK,
        RIGHT('0000000000' + a.NIP,10) AS NIP,
        a.NMKARYAWAN,
        c.NMDIVISI,
        d.NMBAGIAN,
        e.NMJABATAN,
        a.TGLMASUK,
        a.PAWAL,
        a.PAKHIR,
        a.TGLNILAI,
        a.NILAI,
        a.REKOMENDASI,
        a.CATATAN,
        a.NMATASAN,
        a.CATATANHRD,
        a.KEPUTUSAN,
        a.NMHRDSTAFF,
        a.NIKHRDSTAFF
    INTO #Result
    FROM dbo.HDR_EVALUASIKONTRAK a
    LEFT JOIN dbo.TBL_CABANG b
        ON a.KDCABANG = b.KDCABANG
    LEFT JOIN dbo.REF_DIVISI c
        ON a.KDDEPARTEMEN = c.KDDIVISI
    LEFT JOIN dbo.REF_BAGIAN d
        ON a.KDBAGIAN = d.KDBAGIAN
    LEFT JOIN dbo.REF_JABATAN e
        ON a.KDJABATAN = e.KDJABATAN
    WHERE
        (@nama IS NULL OR a.NMKARYAWAN LIKE '%' + @nama + '%')
        AND (@kdcabang IS NULL OR a.KDCABANG = @kdcabang)
        AND (@tglAwal IS NULL OR CAST(a.TGLNILAI AS DATE) >= @tglAwal)
        AND (@tglAkhir IS NULL OR CAST(a.TGLNILAI AS DATE) <= @tglAkhir)
        AND (@pAkhirAwal IS NULL OR CAST(a.PAKHIR AS DATE) >= @pAkhirAwal)
        AND (@pAkhirAkhir IS NULL OR CAST(a.PAKHIR AS DATE) <= @pAkhirAkhir)
        AND (
            @keputusan IS NULL
            OR EXISTS (
                SELECT 1
                FROM @KeputusanFilter k
                WHERE k.val = UPPER(LTRIM(RTRIM(ISNULL(a.KEPUTUSAN, 'MENUNGGU'))))
            )
        );

    ------------------------------------------------------------
    -- INDEX TEMP
    ------------------------------------------------------------
    CREATE CLUSTERED INDEX IX_#Result
        ON #Result (NMKARYAWAN);

    ------------------------------------------------------------
    -- TOTAL
    ------------------------------------------------------------
    SELECT COUNT(1) AS TotalData
    FROM #Result;

    ------------------------------------------------------------
    -- PAGING
    ------------------------------------------------------------
    SELECT *
    FROM #Result
    --ORDER BY TGLNILAI DESC, NMKARYAWAN
    ORDER BY NMKARYAWAN
    OFFSET @Offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO
