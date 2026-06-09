/*
  dbo.Web_Asp_Saldo_Cuti_Karyawan_Detail
  Summary + riwayat cuti per NOKTP.

  Aturan saldo kontrak (selaras dengan Web_Asp_Saldo_Cuti_Karyawan):
  - Reset global: @TGLRESET
  - Kontrak lama (PAWAL < @TGLRESET): saldo awal MST di bucket 1
  - Kontrak baru (PAWAL >= @TGLRESET): saldo awal MST hangus;
    hitung dari bulan kontrak (maks 12 per bucket)

  Jalankan di database yang memuat procedure ini setelah backup.
*/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE dbo.Web_Asp_Saldo_Cuti_Karyawan_Detail
(
    @TAHUN INT = NULL,
    @NOKTP NVARCHAR(20)
)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- RESET GLOBAL
    ------------------------------------------------------------
    DECLARE @TGLRESET DATE = '2026-06-02';

    IF @TAHUN IS NULL
        SET @TAHUN = YEAR(GETDATE());

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
        DATEFROMPARTS(YEAR(@RefDate), MONTH(@RefDate), 1);

    ------------------------------------------------------------
    -- 1. NORMALISASI KONTRAK BY NOKTP
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

    INSERT INTO #KONTRAK
    SELECT
        K.NOKTP COLLATE DATABASE_DEFAULT,
        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT,
        K.NMKARYAWAN COLLATE DATABASE_DEFAULT,
        K.NMDIVISI COLLATE DATABASE_DEFAULT,
        K.NMBAGIAN COLLATE DATABASE_DEFAULT,
        K.NMJABATAN COLLATE DATABASE_DEFAULT,
        CAST(K.PAWAL AS DATE),
        CAST(K.PAKHIR AS DATE),
        K.KDCABANG COLLATE DATABASE_DEFAULT,
        K.NMCABANG COLLATE DATABASE_DEFAULT
    FROM HRDTAG.dbo.DATA_KONTRAKKARYAWAN K
    WHERE K.NOKTP COLLATE DATABASE_DEFAULT = @NOKTP COLLATE DATABASE_DEFAULT;

    INSERT INTO #KONTRAK
    SELECT
        K.NOKTP COLLATE DATABASE_DEFAULT,
        RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT,
        K.NMKARYAWAN COLLATE DATABASE_DEFAULT,
        K.NMDIVISI COLLATE DATABASE_DEFAULT,
        K.NMBAGIAN COLLATE DATABASE_DEFAULT,
        K.NMJABATAN COLLATE DATABASE_DEFAULT,
        CAST(K.PAWAL AS DATE),
        CAST(K.PAKHIR AS DATE),
        K.KDCABANG COLLATE DATABASE_DEFAULT,
        K.NMCABANG COLLATE DATABASE_DEFAULT
    FROM TRX_KONTRAKKARYAWAN K
    WHERE K.NOKTP COLLATE DATABASE_DEFAULT = @NOKTP COLLATE DATABASE_DEFAULT;

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
    SELECT *
    INTO #LAST_KONTRAK
    FROM X
    WHERE RN = 1;

    ------------------------------------------------------------
    -- 3. CEK APA KONTRAK AKTIF
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#AKTIF') IS NOT NULL
        DROP TABLE #AKTIF;

    SELECT
        K.NOKTP,
        K.NIKSISTAG
    INTO #AKTIF
    FROM #LAST_KONTRAK K
    WHERE @RefDate BETWEEN K.PAWAL AND K.PAKHIR;

    ------------------------------------------------------------
    -- 4. PERIODE KONTRAK
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

        CASE
            WHEN K.PAWAL < @TGLRESET
                THEN @TGLRESET
            ELSE K.PAWAL
        END AS TGLMULAIHITUNG,

        CASE
            WHEN K.PAWAL < @TGLRESET
                THEN ISNULL(SA.SALDOAWAL, 0)
            ELSE 0
        END AS SALDOAWAL

    INTO #PERIODE
    FROM #LAST_KONTRAK K
    LEFT JOIN MST_SALDOCUTI_KARYAWAN SA
        ON SA.NOKTP COLLATE DATABASE_DEFAULT = K.NOKTP COLLATE DATABASE_DEFAULT;

    ------------------------------------------------------------
    -- 5. EXPAND BULAN KONTRAK
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
            DATEDIFF(MONTH, P.TGLMULAIHITUNG, P.PAKHIR)
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
    -- 8. SALDO KONTRAK
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
        ON B.NOKTP = BA.NOKTP
        AND B.BUCKET_NO = BA.BUCKET_NO
    GROUP BY
        BA.NOKTP,
        BA.BUCKET_NO;

    ------------------------------------------------------------
    -- 9. TERPAKAI KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#TERPAKAI_KONTRAK') IS NOT NULL
        DROP TABLE #TERPAKAI_KONTRAK;

    SELECT
        BA.NOKTP,
        BA.BUCKET_NO,
        SUM(D.NHARI) AS TERPAKAI
    INTO #TERPAKAI_KONTRAK
    FROM DTL_KARYAWANCUTI D
    JOIN HDR_KARYAWANCUTI H
        ON H.NOCUTI COLLATE DATABASE_DEFAULT = D.NOCUTI COLLATE DATABASE_DEFAULT
    JOIN #AKTIF A
        ON A.NIKSISTAG COLLATE DATABASE_DEFAULT =
           RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT
    JOIN #PERIODE P
        ON P.NOKTP = A.NOKTP
    JOIN #BUCKET B
        ON B.NOKTP = A.NOKTP
        AND B.BULAN = DATEFROMPARTS(YEAR(D.TGLCUTI), MONTH(D.TGLCUTI), 1)
    JOIN #BUCKET_AKTIF BA
        ON BA.NOKTP = B.NOKTP
        AND BA.BUCKET_NO = B.BUCKET_NO
    WHERE
        H.STATUS = 2
        AND D.TGLCUTI >= P.TGLMULAIHITUNG
    GROUP BY
        BA.NOKTP,
        BA.BUCKET_NO;

    ------------------------------------------------------------
    -- 10. PENGAJUAN KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#PENGAJUAN_KONTRAK') IS NOT NULL
        DROP TABLE #PENGAJUAN_KONTRAK;

    SELECT
        BA.NOKTP,
        BA.BUCKET_NO,
        COUNT(DISTINCT H.NOCUTI) AS JUMLAHPENGAJUAN
    INTO #PENGAJUAN_KONTRAK
    FROM DTL_KARYAWANCUTI D
    JOIN HDR_KARYAWANCUTI H
        ON H.NOCUTI COLLATE DATABASE_DEFAULT = D.NOCUTI COLLATE DATABASE_DEFAULT
    JOIN #AKTIF A
        ON A.NIKSISTAG COLLATE DATABASE_DEFAULT =
           RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT
    JOIN #BUCKET B
        ON B.NOKTP = A.NOKTP
        AND B.BULAN = DATEFROMPARTS(YEAR(D.TGLCUTI), MONTH(D.TGLCUTI), 1)
    JOIN #BUCKET_AKTIF BA
        ON BA.NOKTP = B.NOKTP
        AND BA.BUCKET_NO = B.BUCKET_NO
    WHERE H.STATUS = 1
    GROUP BY
        BA.NOKTP,
        BA.BUCKET_NO;

    ------------------------------------------------------------
    -- 11. RESULT KONTRAK
    ------------------------------------------------------------
    IF OBJECT_ID('tempdb..#RESULT') IS NOT NULL
        DROP TABLE #RESULT;

    -- 16 kolom (termasuk NOKTP, BUCKET_NO, JUMLAHPENGAJUAN); jangan disamakan dengan #RESULT di 007 (13 kolom)
    CREATE TABLE #RESULT
    (
        NOKTP NVARCHAR(20) COLLATE DATABASE_DEFAULT,
        NIKSISTAG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMKARYAWAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMDIVISI NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMBAGIAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        NMJABATAN NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        KDCABANG NVARCHAR(10) COLLATE DATABASE_DEFAULT,
        NMCABANG NVARCHAR(200) COLLATE DATABASE_DEFAULT,
        STATUSKARYAWAN NVARCHAR(20) COLLATE DATABASE_DEFAULT,
        BUCKET_NO INT,
        SALDOAWAL INT,
        SALDO_OTOMATIS INT,
        SALDO INT,
        TERPAKAI INT,
        SISA INT,
        JUMLAHPENGAJUAN INT
    );

    IF EXISTS (SELECT 1 FROM #SALDO_KONTRAK)
    BEGIN
        INSERT INTO #RESULT
        (
            NOKTP,
            NIKSISTAG,
            NMKARYAWAN,
            NMDIVISI,
            NMBAGIAN,
            NMJABATAN,
            KDCABANG,
            NMCABANG,
            STATUSKARYAWAN,
            BUCKET_NO,
            SALDOAWAL,
            SALDO_OTOMATIS,
            SALDO,
            TERPAKAI,
            SISA,
            JUMLAHPENGAJUAN
        )
        SELECT
            P.NOKTP,
            P.NIKSISTAG,
            P.NMKARYAWAN,
            P.NMDIVISI,
            P.NMBAGIAN,
            P.NMJABATAN,
            P.KDCABANG,
            P.NMCABANG,
            'KONTRAK' AS STATUSKARYAWAN,
            S.BUCKET_NO,

            CASE
                WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                    THEN ISNULL(P.SALDOAWAL, 0)
                ELSE 0
            END AS SALDOAWAL,

            CASE
                WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                    THEN 0
                ELSE S.SALDO_OTOMATIS
            END AS SALDO_OTOMATIS,

            CASE
                WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                    THEN ISNULL(P.SALDOAWAL, 0)
                ELSE S.SALDO_OTOMATIS
            END AS SALDO,

            ISNULL(T.TERPAKAI, 0) AS TERPAKAI,

            CASE
                WHEN S.BUCKET_NO = 1 AND P.PAWAL < @TGLRESET
                    THEN ISNULL(P.SALDOAWAL, 0) - ISNULL(T.TERPAKAI, 0)
                ELSE S.SALDO_OTOMATIS - ISNULL(T.TERPAKAI, 0)
            END AS SISA,

            ISNULL(PG.JUMLAHPENGAJUAN, 0) AS JUMLAHPENGAJUAN
        FROM #SALDO_KONTRAK S
        JOIN #PERIODE P
            ON P.NOKTP = S.NOKTP
        LEFT JOIN #TERPAKAI_KONTRAK T
            ON T.NOKTP = S.NOKTP
            AND T.BUCKET_NO = S.BUCKET_NO
        LEFT JOIN #PENGAJUAN_KONTRAK PG
            ON PG.NOKTP = S.NOKTP
            AND PG.BUCKET_NO = S.BUCKET_NO;
    END

    ------------------------------------------------------------
    -- 12. JIKA BUKAN KONTRAK AKTIF, CEK KARYAWAN TETAP
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM #RESULT)
    BEGIN
        INSERT INTO #RESULT
        (
            NOKTP,
            NIKSISTAG,
            NMKARYAWAN,
            NMDIVISI,
            NMBAGIAN,
            NMJABATAN,
            KDCABANG,
            NMCABANG,
            STATUSKARYAWAN,
            BUCKET_NO,
            SALDOAWAL,
            SALDO_OTOMATIS,
            SALDO,
            TERPAKAI,
            SISA,
            JUMLAHPENGAJUAN
        )
        SELECT
            K.NOKTP COLLATE DATABASE_DEFAULT,
            RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT,
            K.NAMALENGKAP COLLATE DATABASE_DEFAULT,
            K.NMDIVISI COLLATE DATABASE_DEFAULT,
            K.NMBAGIAN COLLATE DATABASE_DEFAULT,
            K.NMJABATAN COLLATE DATABASE_DEFAULT,
            K.KDCABANG COLLATE DATABASE_DEFAULT,
            K.NMCABANG COLLATE DATABASE_DEFAULT,
            'TETAP' AS STATUSKARYAWAN,
            1 AS BUCKET_NO,
            0 AS SALDOAWAL,
            12 AS SALDO_OTOMATIS,
            12 AS SALDO,
            ISNULL(T.TERPAKAI, 0) AS TERPAKAI,
            12 - ISNULL(T.TERPAKAI, 0) AS SISA,
            ISNULL(PG.JUMLAHPENGAJUAN, 0) AS JUMLAHPENGAJUAN
        FROM HRDTAG.dbo.MST_KARYAWANTETAP K
        LEFT JOIN
        (
            SELECT
                RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10)
                COLLATE DATABASE_DEFAULT AS NIKSISTAG,
                SUM(D.NHARI) AS TERPAKAI
            FROM DTL_KARYAWANCUTI D
            JOIN HDR_KARYAWANCUTI H
                ON H.NOCUTI COLLATE DATABASE_DEFAULT = D.NOCUTI COLLATE DATABASE_DEFAULT
            WHERE
                H.STATUS = 2
                AND YEAR(D.TGLCUTI) = @TAHUN
            GROUP BY
                RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10)
        ) T
            ON T.NIKSISTAG COLLATE DATABASE_DEFAULT =
               RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT
        LEFT JOIN
        (
            SELECT
                RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10)
                COLLATE DATABASE_DEFAULT AS NIKSISTAG,
                COUNT(DISTINCT H.NOCUTI) AS JUMLAHPENGAJUAN
            FROM DTL_KARYAWANCUTI D
            JOIN HDR_KARYAWANCUTI H
                ON H.NOCUTI COLLATE DATABASE_DEFAULT = D.NOCUTI COLLATE DATABASE_DEFAULT
            WHERE
                H.STATUS = 1
                AND YEAR(D.TGLCUTI) = @TAHUN
            GROUP BY
                RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10)
        ) PG
            ON PG.NIKSISTAG COLLATE DATABASE_DEFAULT =
               RIGHT('0000000000' + CAST(K.NIKSISTAG AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT
        WHERE
            K.NOKTP COLLATE DATABASE_DEFAULT = @NOKTP COLLATE DATABASE_DEFAULT;
    END

    ------------------------------------------------------------
    -- VALIDASI DATA
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM #RESULT)
    BEGIN
        RAISERROR('Data karyawan tidak ditemukan dari NOKTP', 16, 1);
        RETURN;
    END

    ------------------------------------------------------------
    -- RESULT 1 : SUMMARY
    ------------------------------------------------------------
    SELECT
        NOKTP,
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
        SISA,
        JUMLAHPENGAJUAN
    FROM #RESULT;

    ------------------------------------------------------------
    -- RESULT 2 : DETAIL CUTI
    ------------------------------------------------------------
    SELECT
        H.NOCUTI,
        D.TGLCUTI,
        D.NHARI,
        H.KEPERLUAN AS KETERANGAN,
        H.STATUS AS STATUS
    FROM DTL_KARYAWANCUTI D
    JOIN HDR_KARYAWANCUTI H
        ON H.NOCUTI COLLATE DATABASE_DEFAULT = D.NOCUTI COLLATE DATABASE_DEFAULT
    JOIN #RESULT R
        ON R.NIKSISTAG COLLATE DATABASE_DEFAULT =
           RIGHT('0000000000' + CAST(D.NIKKARYAWAN AS VARCHAR(10)), 10) COLLATE DATABASE_DEFAULT
    LEFT JOIN #BUCKET B
        ON B.NOKTP = R.NOKTP
        AND B.BULAN = DATEFROMPARTS(YEAR(D.TGLCUTI), MONTH(D.TGLCUTI), 1)
    WHERE
    (
        R.STATUSKARYAWAN = 'TETAP'
        AND YEAR(D.TGLCUTI) = @TAHUN
    )
    OR
    (
        R.STATUSKARYAWAN = 'KONTRAK'
        AND B.BUCKET_NO = R.BUCKET_NO
    )
    ORDER BY
        D.TGLCUTI DESC,
        H.NOCUTI DESC;

END
GO
