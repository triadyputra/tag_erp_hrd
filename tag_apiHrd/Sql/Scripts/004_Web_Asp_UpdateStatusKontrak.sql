/*
  dbo.Web_Asp_UpdateStatusKontrak
  - Mobile TTD: @status = 1 (default) → ttd = 1, tglTtd = GETDATE()
  - Web Approve: @status = 2 → ttd = 2, tglTtd = GETDATE()
  Jalankan di database SISTAGHRD setelah backup.
*/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE dbo.Web_Asp_UpdateStatusKontrak
    @nokontrak NVARCHAR(50),
    @status INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TRX_KONTRAKKARYAWAN
    SET
        ttd = @status,
        tglTtd = GETDATE()
    WHERE NOKONTRAK = @nokontrak;

    RETURN @@ROWCOUNT;
END
GO
