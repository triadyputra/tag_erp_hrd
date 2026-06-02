/*
  dbo.Web_Asp_ViewDataKaryawanTetap
  List paginated MST_KARYAWANTETAP (HRDTAG) dengan filter No KTP, nama, cabang.

  Jalankan di database SISTAGHRD setelah backup.
*/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE dbo.Web_Asp_ViewDataKaryawanTetap
(
    @NoKtp         NVARCHAR(30)  = NULL,
    @NamaLengkap   NVARCHAR(100) = NULL,
    @KdCabang      NVARCHAR(20)  = NULL,
    @PageNumber    INT           = 1,
    @PageSize      INT           = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SET @NoKtp       = NULLIF(LTRIM(RTRIM(@NoKtp)), '');
    SET @NamaLengkap = NULLIF(LTRIM(RTRIM(@NamaLengkap)), '');
    SET @KdCabang    = NULLIF(LTRIM(RTRIM(@KdCabang)), '');

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -------------------------------------------------------
    -- TOTAL DATA
    -------------------------------------------------------
    SELECT COUNT(1)
    FROM HRDTAG.dbo.MST_KARYAWANTETAP A
    WHERE
        (@NoKtp IS NULL OR A.NOKTP LIKE '%' + @NoKtp + '%')
        AND (@NamaLengkap IS NULL OR A.NAMALENGKAP LIKE '%' + @NamaLengkap + '%')
        AND (@KdCabang IS NULL OR A.KDCABANG = @KdCabang);

    -------------------------------------------------------
    -- DATA
    -------------------------------------------------------
    SELECT
        A.NOKTP         AS Noktp,
        A.NIKSISTAG     AS NikSistag,
        A.NAMALENGKAP   AS NamaLengkap,
        A.KELAMIN       AS Kelamin,
        A.TEMPATLAHIR   AS TempatLahir,
        A.TGLLAHIR      AS TglLahir,
        A.ALAMAT        AS Alamat,
        A.PENDIDIKAN    AS Pendidikan,
        A.AGAMA         AS Agama,
        A.PERKAWINAN    AS Perkawinan,
        A.FOTO          AS Foto,
        A.IDFINGER      AS IdFinger,
        A.TGLMASUK      AS TglMasuk,
        A.KDCABANG      AS KdCabang,
        A.NMCABANG      AS NmCabang,
        A.NMBANK        AS NmBank,
        A.NOREKENING    AS NoRekening,
        A.NOTELEPON     AS NoTelepon,
        A.KDDIVISI      AS KdDivisi,
        A.NMDIVISI      AS NmDivisi,
        A.KDBAGIAN      AS KdBagian,
        A.NMBAGIAN      AS NmBagian,
        A.KDSUBBAGIAN   AS KdSubBagian,
        A.NMSUBBAGIAN   AS NmSubBagian,
        A.KDJABATAN     AS KdJabatan,
        A.NMJABATAN     AS NmJabatan,
        A.VALIDUSER     AS ValidUser,
        A.NOKONTRAK     AS NoKontrak,
        A.NOSK          AS NoSk,
        A.TGLSK         AS TglSk,
        A.NOIM          AS NoIm,
        A.TGLINPUT      AS TglInput
    FROM HRDTAG.dbo.MST_KARYAWANTETAP A
    WHERE
        (@NoKtp IS NULL OR A.NOKTP LIKE '%' + @NoKtp + '%')
        AND (@NamaLengkap IS NULL OR A.NAMALENGKAP LIKE '%' + @NamaLengkap + '%')
        AND (@KdCabang IS NULL OR A.KDCABANG = @KdCabang)
    ORDER BY A.TGLMASUK DESC, A.NAMALENGKAP
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
