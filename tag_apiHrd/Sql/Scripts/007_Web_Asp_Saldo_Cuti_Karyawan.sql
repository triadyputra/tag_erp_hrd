/*
  dbo.Web_Asp_Saldo_Cuti_Karyawan
  Saldo cuti karyawan kontrak + tetap (paginated).

  Aturan saldo kontrak:
  - Reset global: @TGLRESET
  - Kontrak lama (PAWAL < @TGLRESET): saldo awal dari MST_SALDOCUTI_KARYAWAN di bucket 1
  - Kontrak baru (PAWAL >= @TGLRESET): saldo awal MST dianggap hangus;
    hitung dari bulan kontrak (1 hari/bulan, maks 12 per bucket) seperti bucket berikutnya

  Jalankan di database yang memuat procedure ini (biasanya SISTAGHRD) setelah backup.
*/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE dbo.Web_Asp_Saldo_Cuti_Karyawan
(
    @TAHUN INT = NULL,
    @KDCABANG NVARCHAR(10) = NULL,
    @NAMA NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- RESET GLOBAL
    ------------------------------------------------------------
    DECLARE @TGLRESET DATE = '2026-06-02';

    ------------------------------------------------------------
    -- VALIDASI
    ------------------------------------------------------------
    IF @TAHUN IS NULL
        SET @TAHUN = YEAR(GETDATE());

    IF @PageNumber < 1
        SET @PageNumber = 1;

    IF @PageSize < 1
        SET @PageSize = 10;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    DECLARE @RefDate DATE =
    (
        CASE
            WHEN @TAHUN = YEAR(@Today)
                THEN @Today
            ELSE DATEFROMPARTS(@TAHUN, 12, 31)
        END
    );

    DECLARE @RefMonth DATE =
        DATEFROMPARTS
        (
            YEAR(@RefDate),
            MONTH(@RefDate),
            1
        );

    ------------------------------------------------------------
    -- 1. NORMALISASI KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#KONTRAK') IS NOT NULL
        DROP TABLE #KONTRAK;

    CREATE TABLE #KONTRAK
    (
        NOKTP NVARCHAR(20) COLLATE DATABASE_DEFAULT,
        NIKSISTAG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMKARYAWAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMDIVISI NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMBAGIAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMJABATAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        PAWAL DATE,
        PAKHIR DATE,
        KDCABANG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMCABANG NVARCHAR(200) COLLATE DATABASE_DEFAULT
    );

    ------------------------------------------------------------
    -- DATA KONTRAK MASTER
    ------------------------------------------------------------
    INSERT INTO #KONTRAK
    (
        NOKTP,
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        PAWAL,
        PAKHIR,
        KDCABANG,
        NMCABANG
    )
    SELECT
        K.NOKTP COLLATE DATABASE_DEFAULT,

        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)),10)
        COLLATE DATABASE_DEFAULT,

        K.NMKARYAWAN COLLATE DATABASE_DEFAULT,
        K.NMDIVISI COLLATE DATABASE_DEFAULT,
        K.NMBAGIAN COLLATE DATABASE_DEFAULT,
        K.NMJABATAN COLLATE DATABASE_DEFAULT,

        CAST(K.PAWAL AS DATE),
        CAST(K.PAKHIR AS DATE),

        K.KDCABANG COLLATE DATABASE_DEFAULT,
        K.NMCABANG COLLATE DATABASE_DEFAULT

    FROM HRDTAG.dbo.DATA_KONTRAKKARYAWAN K

    WHERE
    (
        @KDCABANG IS NULL
        OR @KDCABANG = ''
        OR
        K.KDCABANG COLLATE DATABASE_DEFAULT
        =
        @KDCABANG COLLATE DATABASE_DEFAULT
    );

    ------------------------------------------------------------
    -- DATA KONTRAK TRANSAKSI
    ------------------------------------------------------------
    INSERT INTO #KONTRAK
    (
        NOKTP,
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        PAWAL,
        PAKHIR,
        KDCABANG,
        NMCABANG
    )
    SELECT
        K.NOKTP COLLATE DATABASE_DEFAULT,

        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)),10)
        COLLATE DATABASE_DEFAULT,

        K.NMKARYAWAN COLLATE DATABASE_DEFAULT,
        K.NMDIVISI COLLATE DATABASE_DEFAULT,
        K.NMBAGIAN COLLATE DATABASE_DEFAULT,
        K.NMJABATAN COLLATE DATABASE_DEFAULT,

        CAST(K.PAWAL AS DATE),
        CAST(K.PAKHIR AS DATE),

        K.KDCABANG COLLATE DATABASE_DEFAULT,
        K.NMCABANG COLLATE DATABASE_DEFAULT

    FROM TRX_KONTRAKKARYAWAN K

    WHERE
    (
        @KDCABANG IS NULL
        OR @KDCABANG = ''
        OR
        K.KDCABANG COLLATE DATABASE_DEFAULT
        =
        @KDCABANG COLLATE DATABASE_DEFAULT
    );

    ------------------------------------------------------------
    -- 2. LAST KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#LAST_KONTRAK') IS NOT NULL
        DROP TABLE #LAST_KONTRAK;

    ;WITH X AS
    (
        SELECT
            K.*,

            ROW_NUMBER() OVER
            (
                PARTITION BY K.NOKTP
                ORDER BY
                    CASE
                        WHEN @RefDate BETWEEN K.PAWAL AND K.PAKHIR
                            THEN 0
                        ELSE 1
                    END,

                    CASE
                        WHEN @RefDate BETWEEN K.PAWAL AND K.PAKHIR
                            THEN K.PAKHIR
                    END DESC,

                    K.PAKHIR DESC,
                    K.PAWAL DESC
            ) AS RN

        FROM #KONTRAK K
    )
    SELECT
        NOKTP,
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        PAWAL,
        PAKHIR,
        KDCABANG,
        NMCABANG
    INTO #LAST_KONTRAK
    FROM X
    WHERE RN = 1;

    ------------------------------------------------------------
    -- 3. KARYAWAN AKTIF
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#AKTIF') IS NOT NULL
        DROP TABLE #AKTIF;

    SELECT DISTINCT
        K.NOKTP,
        K.NIKSISTAG

    INTO #AKTIF
    FROM #LAST_KONTRAK K

    WHERE @RefDate BETWEEN K.PAWAL AND K.PAKHIR;

    ------------------------------------------------------------
    -- 4. PERIODE HITUNG
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#PERIODE') IS NOT NULL
        DROP TABLE #PERIODE;

    SELECT
        K.NOKTP,
        K.NIKSISTAG,
        K.NMKARYAWAN,
        K.NMDIVISI,
        K.NMBAGIAN,
        K.NMJABATAN,
        K.KDCABANG,
        K.NMCABANG,
        K.PAWAL,
        K.PAKHIR,

        --------------------------------------------------------
        -- RESET HANYA SEKALI
        --------------------------------------------------------
        CASE
            WHEN K.PAWAL < @TGLRESET
                THEN @TGLRESET
            ELSE K.PAWAL
        END AS TGLMULAIHITUNG,

        --------------------------------------------------------
        -- Saldo awal MST hanya untuk kontrak sebelum @TGLRESET
        -- Kontrak baru (PAWAL >= @TGLRESET): saldo awal hangus
        --------------------------------------------------------
        CASE
            WHEN K.PAWAL < @TGLRESET
                THEN ISNULL(SA.SALDOAWAL, 0)
            ELSE 0
        END AS SALDOAWAL

    INTO #PERIODE
    FROM #LAST_KONTRAK K

    LEFT JOIN MST_SALDOCUTI_KARYAWAN SA
        ON
        SA.NOKTP COLLATE DATABASE_DEFAULT
        =
        K.NOKTP COLLATE DATABASE_DEFAULT;

    ------------------------------------------------------------
    -- 5. EXPAND BULAN
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#BULAN') IS NOT NULL
        DROP TABLE #BULAN;

    ;WITH N AS
    (
        SELECT TOP (3000)
            ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS NO
        FROM sys.all_objects
    )

    SELECT DISTINCT
        P.NOKTP,

        DATEFROMPARTS
        (
            YEAR(DATEADD(MONTH, N.NO, P.TGLMULAIHITUNG)),
            MONTH(DATEADD(MONTH, N.NO, P.TGLMULAIHITUNG)),
            1
        ) AS BULAN

    INTO #BULAN
    FROM #PERIODE P

    JOIN N
        ON N.NO <=
        (
            DATEDIFF
            (
                MONTH,
                P.TGLMULAIHITUNG,
                P.PAKHIR
            )
            +
            CASE
                WHEN DAY(P.PAKHIR) >= DAY(P.TGLMULAIHITUNG)
                    THEN 1
                ELSE 0
            END
            - 1
        );

    ------------------------------------------------------------
    -- 6. BUCKET 12 BULAN
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#BUCKET') IS NOT NULL
        DROP TABLE #BUCKET;

    ;WITH X AS
    (
        SELECT
            B.NOKTP,
            B.BULAN,

            ROW_NUMBER() OVER
            (
                PARTITION BY B.NOKTP
                ORDER BY B.BULAN
            ) AS URUT

        FROM #BULAN B
    )

    SELECT
        X.NOKTP,
        X.BULAN,

        ((X.URUT - 1) / 12) + 1 AS BUCKET_NO

    INTO #BUCKET
    FROM X;

    ------------------------------------------------------------
    -- 7. BUCKET AKTIF
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#BUCKET_AKTIF') IS NOT NULL
        DROP TABLE #BUCKET_AKTIF;

    SELECT
        B.NOKTP,
        B.BULAN,
        B.BUCKET_NO

    INTO #BUCKET_AKTIF
    FROM #BUCKET B

    JOIN #AKTIF A
        ON A.NOKTP = B.NOKTP

    WHERE B.BULAN = @RefMonth;

    ------------------------------------------------------------
    -- 8. SALDO OTOMATIS
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#SALDO_KONTRAK') IS NOT NULL
        DROP TABLE #SALDO_KONTRAK;

    SELECT
        BA.NOKTP,
        BA.BUCKET_NO,

        COUNT(*) AS SALDO_OTOMATIS

    INTO #SALDO_KONTRAK
    FROM #BUCKET_AKTIF BA

    JOIN #BUCKET B
        ON
        B.NOKTP = BA.NOKTP
        AND
        B.BUCKET_NO = BA.BUCKET_NO

    GROUP BY
        BA.NOKTP,
        BA.BUCKET_NO;

    ------------------------------------------------------------
    -- 9. TERPAKAI
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#TERPAKAI') IS NOT NULL
        DROP TABLE #TERPAKAI;

    SELECT
        BA.NOKTP,
        BA.BUCKET_NO,

        SUM(D.NHARI) AS TERPAKAI

    INTO #TERPAKAI
    FROM DTL_KARYAWANCUTI D

    JOIN HDR_KARYAWANCUTI H
        ON
        H.NOCUTI COLLATE DATABASE_DEFAULT
        =
        D.NOCUTI COLLATE DATABASE_DEFAULT

    JOIN #AKTIF A
        ON
        A.NIKSISTAG COLLATE DATABASE_DEFAULT
        =
        RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)),10)
        COLLATE DATABASE_DEFAULT

    JOIN #PERIODE P
        ON P.NOKTP = A.NOKTP

    JOIN #BUCKET B
        ON
        B.NOKTP = A.NOKTP
        AND
        B.BULAN =
        DATEFROMPARTS
        (
            YEAR(D.TGLCUTI),
            MONTH(D.TGLCUTI),
            1
        )

    JOIN #BUCKET_AKTIF BA
        ON
        BA.NOKTP = B.NOKTP
        AND
        BA.BUCKET_NO = B.BUCKET_NO

    WHERE
        H.STATUS = 2
        AND
        D.TGLCUTI >= P.TGLMULAIHITUNG

    GROUP BY
        BA.NOKTP,
        BA.BUCKET_NO;

    ------------------------------------------------------------
    -- 10. RESULT KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#RESULT_KONTRAK') IS NOT NULL
        DROP TABLE #RESULT_KONTRAK;

    SELECT
        P.NIKSISTAG,
        P.NMKARYAWAN,
        P.NMDIVISI,
        P.NMBAGIAN,
        P.NMJABATAN,
        P.KDCABANG,
        P.NMCABANG,

        --------------------------------------------------------
        -- SALDO AWAL (MST) hanya bucket 1 + kontrak lama
        --------------------------------------------------------
        CASE
            WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                THEN ISNULL(P.SALDOAWAL, 0)
            ELSE 0
        END AS SALDOAWAL,

        --------------------------------------------------------
        -- SALDO OTOMATIS (akumulasi bulan, maks 12/bucket)
        --------------------------------------------------------
        CASE
            WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                THEN 0
            ELSE S.SALDO_OTOMATIS
        END AS SALDO_OTOMATIS,

        --------------------------------------------------------
        -- TOTAL SALDO
        --------------------------------------------------------
        CASE
            WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                THEN ISNULL(P.SALDOAWAL, 0)
            ELSE S.SALDO_OTOMATIS
        END AS SALDO,

        ISNULL(T.TERPAKAI, 0) AS TERPAKAI,

        --------------------------------------------------------
        -- SISA
        --------------------------------------------------------
        CASE
            WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                THEN
                    ISNULL(P.SALDOAWAL, 0)
                    - ISNULL(T.TERPAKAI, 0)
            ELSE
                S.SALDO_OTOMATIS
                - ISNULL(T.TERPAKAI, 0)
        END AS SISA,

        CONVERT(NVARCHAR(20), 'KONTRAK') AS STATUSKARYAWAN

    INTO #RESULT_KONTRAK
    FROM #SALDO_KONTRAK S

    JOIN #PERIODE P
        ON P.NOKTP = S.NOKTP

    LEFT JOIN #TERPAKAI T
        ON
        T.NOKTP = S.NOKTP
        AND
        T.BUCKET_NO = S.BUCKET_NO

    WHERE
    (
        @NAMA IS NULL
        OR @NAMA = ''
        OR
        P.NMKARYAWAN COLLATE DATABASE_DEFAULT
        LIKE '%' + @NAMA + '%'
    );

    ------------------------------------------------------------
    -- 11. RESULT TETAP
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#RESULT_TETAP') IS NOT NULL
        DROP TABLE #RESULT_TETAP;

    SELECT
        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)),10)
        COLLATE DATABASE_DEFAULT AS NIKSISTAG,

        K.NAMALENGKAP COLLATE DATABASE_DEFAULT AS NMKARYAWAN,
        K.NMDIVISI COLLATE DATABASE_DEFAULT AS NMDIVISI,
        K.NMBAGIAN COLLATE DATABASE_DEFAULT AS NMBAGIAN,
        K.NMJABATAN COLLATE DATABASE_DEFAULT AS NMJABATAN,
        K.KDCABANG COLLATE DATABASE_DEFAULT AS KDCABANG,
        K.NMCABANG COLLATE DATABASE_DEFAULT AS NMCABANG,

        0 AS SALDOAWAL,

        12 AS SALDO_OTOMATIS,

        12 AS SALDO,

        ISNULL(T.TERPAKAI, 0) AS TERPAKAI,

        (12 - ISNULL(T.TERPAKAI, 0)) AS SISA,

        CONVERT(NVARCHAR(20), 'TETAP') AS STATUSKARYAWAN

    INTO #RESULT_TETAP
    FROM HRDTAG.dbo.MST_KARYAWANTETAP K

    LEFT JOIN
    (
        SELECT
            RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)),10)
            COLLATE DATABASE_DEFAULT AS NIKSISTAG,

            SUM(D.NHARI) AS TERPAKAI

        FROM DTL_KARYAWANCUTI D

        JOIN HDR_KARYAWANCUTI H
            ON
            H.NOCUTI COLLATE DATABASE_DEFAULT
            =
            D.NOCUTI COLLATE DATABASE_DEFAULT

        WHERE
            H.STATUS = 2
            AND
            YEAR(D.TGLCUTI) = @TAHUN

        GROUP BY D.NIKKARYAWAN

    ) T
        ON
        T.NIKSISTAG COLLATE DATABASE_DEFAULT
        =
        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)),10)
        COLLATE DATABASE_DEFAULT

    WHERE
    (
        @KDCABANG IS NULL
        OR @KDCABANG = ''
        OR
        K.KDCABANG COLLATE DATABASE_DEFAULT
        =
        @KDCABANG COLLATE DATABASE_DEFAULT
    )

    AND

    (
        @NAMA IS NULL
        OR @NAMA = ''
        OR
        K.NAMALENGKAP COLLATE DATABASE_DEFAULT
        LIKE '%' + @NAMA + '%'
    );

    ------------------------------------------------------------
    -- 12. FINAL
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#RESULT') IS NOT NULL
        DROP TABLE #RESULT;

    CREATE TABLE #RESULT
    (
        NIKSISTAG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMKARYAWAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMDIVISI NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMBAGIAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMJABATAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        KDCABANG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMCABANG NVARCHAR(200) COLLATE DATABASE_DEFAULT,

        SALDOAWAL INT,
        SALDO_OTOMATIS INT,

        SALDO INT,
        TERPAKAI INT,
        SISA INT,

        STATUSKARYAWAN NVARCHAR(20) COLLATE DATABASE_DEFAULT
    );

    ------------------------------------------------------------
    -- INSERT RESULT KONTRAK
    ------------------------------------------------------------
    INSERT INTO #RESULT
    (
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        KDCABANG,
        NMCABANG,

        SALDOAWAL,
        SALDO_OTOMATIS,

        SALDO,
        TERPAKAI,
        SISA,

        STATUSKARYAWAN
    )
    SELECT
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        KDCABANG,
        NMCABANG,

        SALDOAWAL,
        SALDO_OTOMATIS,

        SALDO,
        TERPAKAI,
        SISA,

        STATUSKARYAWAN
    FROM #RESULT_KONTRAK;

    ------------------------------------------------------------
    -- INSERT RESULT TETAP
    ------------------------------------------------------------
    INSERT INTO #RESULT
    (
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        KDCABANG,
        NMCABANG,

        SALDOAWAL,
        SALDO_OTOMATIS,

        SALDO,
        TERPAKAI,
        SISA,

        STATUSKARYAWAN
    )
    SELECT
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        KDCABANG,
        NMCABANG,

        SALDOAWAL,
        SALDO_OTOMATIS,

        SALDO,
        TERPAKAI,
        SISA,

        STATUSKARYAWAN
    FROM #RESULT_TETAP;

    ------------------------------------------------------------
    -- TOTAL
    ------------------------------------------------------------
    SELECT COUNT(1) AS Total
    FROM #RESULT;

    ------------------------------------------------------------
    -- DATA
    ------------------------------------------------------------
    SELECT
        NIKSISTAG,
        NMKARYAWAN,
        NMDIVISI,
        NMBAGIAN,
        NMJABATAN,
        KDCABANG,
        NMCABANG,

        STATUSKARYAWAN,

        SALDOAWAL,
        SALDO_OTOMATIS,

        SALDO,
        TERPAKAI,
        SISA

    FROM #RESULT

    ORDER BY
        KDCABANG,
        NMKARYAWAN

    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END
GO
