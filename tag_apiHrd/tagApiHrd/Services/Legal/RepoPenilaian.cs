using Dapper;
using System.Data;
using System.Xml.Linq;
using tagApi.Data;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;

namespace tagApiHrd.Services.Legal
{
    public class RepoPenilaian : IRepoPenilaian
    {
        private readonly DapperSistagHrdContext _context;

        public RepoPenilaian(DapperSistagHrdContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ViewEvaluasiKontrakDto>> GetListEvaluasiKontrak(
        string? nik,
        string? namaKaryawan,
        string? kdCabang,
        DateTime? tglAwal,
        DateTime? tglAkhir, 
        int page,
        int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                using var connection = _context.CreateConnection();

                var param = new DynamicParameters();
                param.Add("@cnikkaryawan", string.IsNullOrWhiteSpace(nik) ? null : nik);
                param.Add("@NamaKaryawan", string.IsNullOrWhiteSpace(namaKaryawan) ? null : namaKaryawan);
                param.Add("@KdCabang", string.IsNullOrWhiteSpace(kdCabang) ? null : kdCabang);
                param.Add("@TanggalAwal", tglAwal);
                param.Add("@TanggalAkhir", tglAkhir);
                param.Add("@PageNumber", page);
                param.Add("@PageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    "dbo.Web_Asp_ViewEvaluasiKontrak",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var total = await multi.ReadFirstOrDefaultAsync<int>();
                var data = (await multi.ReadAsync<ViewEvaluasiKontrakDto>()).ToList();

                return new PagedResult<ViewEvaluasiKontrakDto>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data evaluasi kontrak. {ex.Message}",
                    ex
                );
            }
        }

        public async Task<FormEvaluasiKontrakDto?> GetDetailEvaluasiKontrak(string noTran)
        {
            try
            {
                using var connection = _context.CreateConnection();

                const string sql = @"
                SELECT
                    h.NOTRAN           AS NoTran,
                    h.NIP              AS Nip,
                    h.NIK              AS Nik,
                    h.NOKONTRAK        AS NoKontrak,
                    h.NMKARYAWAN       AS NamaKaryawan,
                    h.TGLLAHIR         AS TglLahir,
                    h.USIA             AS Usia,
                    h.KDDEPARTEMEN     AS KdDepartemen,
                    h.KDBAGIAN         AS KdBagian,
                    h.KDJABATAN        AS KdJabatan,
                    h.TGLMASUK         AS TglMasuk,
                    h.TGLHKONTRAK      AS TglHabisKontrak,
                    h.NIKATASAN        AS NikAtasan,
                    h.NMATASAN         AS NamaAtasan,
                    h.TGLNILAI         AS TglNilai,
                    h.PAWAL            AS PAwal,
                    h.PAKHIR           AS PAkhir,
                    h.NILAI            AS Nilai,
                    h.REKOMENDASI      AS Rekomendasi,
                    h.CATATAN          AS Catatan,
                    h.VALIDUSER        AS ValidUser,
                    h.KDCABANG         AS KdCabang
                FROM dbo.HDR_EVALUASIKONTRAK h
                WHERE h.NOTRAN = @noTran;

                SELECT
                    d.GRPASPEK         AS GrupAspek,
                    d.KDASPEK          AS KdAspek,
                    d.NILAI            AS Nilai
                FROM dbo.DTL_EVALUASIKONTRAK d
                WHERE d.NOTRAN = @noTran
                ORDER BY d.NOURUT, d.KDASPEK;";

                using var multi = await connection.QueryMultipleAsync(sql, new { noTran });

                var header = await multi.ReadFirstOrDefaultAsync<FormEvaluasiKontrakDto>();

                if (header == null)
                    return null;

                var details = (await multi.ReadAsync<FormEvaluasiKontrakDetailDto>()).ToList();

                header.Details = details;

                return header;
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil detail evaluasi kontrak. {ex.Message}",
                    ex
                );
            }
        }

        public async Task<ApiResponse<object>> SaveEvaluasiKontrak(FormEvaluasiKontrakDto dto)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var xml = new XElement("Details",
                    dto.Details.Select(x => new XElement("Item",
                        new XElement("GrupAspek", x.GrupAspek),
                        new XElement("KdAspek", x.KdAspek),
                        new XElement("Nilai", x.Nilai)
                    ))
                );

                var param = new DynamicParameters();

                //param.Add("@notran", dto.NoTran);
                param.Add("@notran", string.IsNullOrWhiteSpace(dto.NoTran) ? "" : dto.NoTran);
                param.Add("@nip", dto.Nip);
                param.Add("@nik", dto.Nik);
                param.Add("@nokontrak", dto.NoKontrak);
                param.Add("@nmkaryawan", dto.NamaKaryawan);
                param.Add("@tgllahir", dto.TglLahir);
                param.Add("@usia", dto.Usia);
                param.Add("@kddepartemen", dto.KdDepartemen);
                param.Add("@kdbagian", dto.KdBagian);
                param.Add("@kdjabatan", dto.KdJabatan);
                param.Add("@tglmasuk", dto.TglMasuk);
                param.Add("@tglhkontrak", dto.TglHabisKontrak);
                param.Add("@nikatasan", dto.NikAtasan);
                param.Add("@nmatasan", dto.NamaAtasan);
                param.Add("@tglnilai", dto.TglNilai);
                param.Add("@pawal", dto.PAwal);
                param.Add("@pakhir", dto.PAkhir);
                param.Add("@nilai", dto.Nilai);
                param.Add("@rekomendasi", dto.Rekomendasi);
                param.Add("@catatan", dto.Catatan);
                param.Add("@validuser", dto.ValidUser);
                param.Add("@kdcabang", dto.KdCabang);
                param.Add("@griddetails", xml.ToString());

                param.Add("@regcode",
                    dbType: DbType.String,
                    size: 14,
                    direction: ParameterDirection.Output);

                var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "Web_Asp_AddEvaluasiKaryawan",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                return new ApiResponse<object>
                {
                    Metadata = new Metadata
                    {
                        Success = result?.Code == "200",
                        Code = result?.Code ?? "500",
                        Message = result?.Message ?? "Gagal menyimpan data"
                    },
                    Data = new
                    {
                        NoTran = param.Get<string>("@regcode")
                    }
                };
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.Error(
                    $"Gagal menyimpan evaluasi kontrak. {ex.Message}",
                    "500"
                );
            }
        }

        // ===============================
        // REPOSITORY
        // ===============================
        public async Task<ApiResponse<object>> DeleteEvaluasiKontrak(string noTran)
        {
            IDbTransaction? tran = null;

            try
            {
                using var connection = _context.CreateConnection();

                connection.Open();

                tran = connection.BeginTransaction();

                if (string.IsNullOrWhiteSpace(noTran))
                {
                    return ApiResponse<object>.Error(
                        "No transaksi wajib diisi",
                        "400");
                }

                var cek = await connection.ExecuteScalarAsync<int>(
                    @"SELECT COUNT(1)
              FROM dbo.HDR_EVALUASIKONTRAK
              WHERE NOTRAN = @noTran",
                    new { noTran },
                    tran
                );

                if (cek == 0)
                {
                    tran.Rollback();

                    return ApiResponse<object>.Error(
                        "Data tidak ditemukan",
                        "404");
                }

                await connection.ExecuteAsync(
                    @"DELETE FROM dbo.DTL_EVALUASIKONTRAK
              WHERE NOTRAN=@noTran",
                    new { noTran },
                    tran);

                await connection.ExecuteAsync(
                    @"DELETE FROM dbo.HDR_EVALUASIKONTRAK
              WHERE NOTRAN=@noTran",
                    new { noTran },
                    tran);

                tran.Commit();

                return ApiResponse<object>.Success(
                    new { NoTran = noTran },
                    "Berhasil dihapus");
            }
            catch (Exception ex)
            {
                tran?.Rollback();

                return ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500");
            }
        }



        // ===============================
        // REPOSITORY
        // ===============================
        public async Task<PagedResult<ViewApprovalEvaluasiDto>> AprovalEvaluasi(
            string? namaKaryawan,
            string? kdCabang,
            DateTime? tglAwal,
            DateTime? tglAkhir,
            int page,
            int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                using var connection = _context.CreateConnection();

                var param = new DynamicParameters();
                param.Add("@nama", string.IsNullOrWhiteSpace(namaKaryawan) ? null : namaKaryawan);
                param.Add("@kdcabang", string.IsNullOrWhiteSpace(kdCabang) ? null : kdCabang);
                param.Add("@tglAwal", tglAwal);
                param.Add("@tglAkhir", tglAkhir);
                param.Add("@page", page);
                param.Add("@pageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    "Web_Asp_ViewAprovalEvaluasiKontrak",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var total = await multi.ReadFirstOrDefaultAsync<int>();
                var data = (await multi.ReadAsync<ViewApprovalEvaluasiDto>()).ToList();

                return new PagedResult<ViewApprovalEvaluasiDto>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data approval evaluasi. {ex.Message}",
                    ex
                );
            }
        }

        // ===============================
        // REPOSITORY
        // ===============================
        public async Task<ApiResponse<object>> UpdateAprovalEvaluasi(
            FormApprovalEvaluasiDto dto)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var param = new DynamicParameters();

                param.Add("@NoTran", dto.NoTran);
                param.Add("@CatatanHrd", dto.CatatanHrd);
                param.Add("@NikHrdStaff", dto.NikHrdStaff);
                param.Add("@NmHrdStaff", dto.NmHrdStaff);
                param.Add("@Keputusan", dto.Keputusan);
                param.Add("@ValidUser", dto.ValidUser);

                await connection.ExecuteAsync(
                    "dbo.Web_Asp_UpdateAprovalEvaluasi",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                return ApiResponse<object>.Success(
                    new
                    {
                        dto.NoTran
                    },
                    "Approval evaluasi berhasil disimpan"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                );
            }
        }
    }
}
