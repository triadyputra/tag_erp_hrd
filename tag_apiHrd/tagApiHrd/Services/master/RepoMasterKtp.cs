using Dapper;
using System.Data;
using tagApi.Data;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.master;

namespace tagApiHrd.Services.master
{
    public class RepoMasterKtp : IRepoMasterKtp
    {
        private readonly DapperSistagHrdContext _context;

        public RepoMasterKtp(DapperSistagHrdContext context)
        {
            _context = context;
        }


        // ===============================
        // GET LIST
        // ===============================
        public async Task<PagedResult<FormDataKtpDto>> GetListDataKtp(
            string? noktp,
            string? namaLengkap,
            string? kdCabang,
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

                param.Add("@NoKtp",
                    string.IsNullOrWhiteSpace(noktp)
                    ? null
                    : noktp);

                param.Add("@NamaLengkap",
                    string.IsNullOrWhiteSpace(namaLengkap)
                    ? null
                    : namaLengkap);

                param.Add("@KdCabang",
                    string.IsNullOrWhiteSpace(kdCabang)
                    ? null
                    : kdCabang);

                param.Add("@PageNumber", page);
                param.Add("@PageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    "dbo.Web_Asp_ViewDataKTP",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var total =
                    await multi.ReadFirstOrDefaultAsync<int>();

                var data =
                    (await multi.ReadAsync<FormDataKtpDto>())
                    .ToList();

                return new PagedResult<FormDataKtpDto>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data KTP. {ex.Message}",
                    ex
                );
            }
        }

        // ===============================
        // GET DETAIL
        // ===============================
        public async Task<FormDataKtpDto?> GetDetailDataKtp(
            string noktp)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                const string sql = @"
                SELECT
                    NOKTP               AS Noktp,
                    NAMALENGKAP         AS NamaLengkap,
                    KELAMIN             AS Kelamin,
                    TEMPATLAHIR         AS TempatLahir,
                    TGLLAHIR            AS TglLahir,
                    ALAMAT              AS Alamat,
                    ALAMATTINGGAL       AS AlamatTinggal,
                    PENDIDIKAN          AS Pendidikan,
                    AGAMA               AS Agama,
                    PERKAWINAN          AS Perkawinan,
                    TGLMASUK            AS TglMasuk,
                    IDFINGER            AS IdFinger,
                    NOTELEPON           AS NoTelepon,
                    TITIPIJAZAH         AS TitipIjazah,
                    FOTO                AS Foto,
                    KDCABANG            AS KdCabang,
                    NMCABANG            AS NmCabang,
                    KDVENDOR            AS KdVendor,
                    NMVENDOR            AS NmVendor
                FROM HRDTAG.dbo.MST_KTP
                WHERE NOKTP = @noktp
                ";

                return await connection
                    .QueryFirstOrDefaultAsync<FormDataKtpDto>(
                        sql,
                        new { noktp });
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil detail data KTP. {ex.Message}",
                    ex
                );
            }
        }

        // ===============================
        // SAVE
        // ===============================
        public async Task<ApiResponse<object>> SaveDataKtp(
            FormDataKtpDto dto, string ValidUser)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                var param = new DynamicParameters();

                param.Add("@noktp", dto.Noktp);
                param.Add("@namalengkap", dto.NamaLengkap);
                param.Add("@kelamin", dto.Kelamin);
                param.Add("@tempatlahir", dto.TempatLahir);
                param.Add("@tgllahir", dto.TglLahir);

                param.Add("@alamat", dto.Alamat);
                param.Add("@alamattinggal", dto.AlamatTinggal);
                param.Add("@pendidikan", dto.Pendidikan);
                param.Add("@agama", dto.Agama);
                param.Add("@perkawinan", dto.Perkawinan);

                param.Add("@tglmasuk", dto.TglMasuk);

                param.Add("@idfinger", dto.IdFinger);
                param.Add("@notelepon", dto.NoTelepon);
                param.Add("@titipijazah", dto.TitipIjazah);

                param.Add("@foto", dto.Foto);

                param.Add("@kdcabang", dto.KdCabang);
                param.Add("@nmcabang", dto.NmCabang);

                param.Add("@kdvendor", dto.KdVendor);
                param.Add("@nmvendor", dto.NmVendor);

                param.Add("@validuser", ValidUser);

                await connection.ExecuteAsync(
                    "dbo.Web_Asp_AddDataKTP",
                    param,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                return ApiResponse<object>.Success(
                    new
                    {
                        dto.Noktp
                    },
                    "Data KTP berhasil disimpan"
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


        // ===============================
        // DELETE
        // ===============================
        public async Task<ApiResponse<object>> DeleteDataKtp(
            string noktp)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                var parameters =
                    new DynamicParameters();

                parameters.Add("@cnoktp", noktp);
                parameters.Add("@ckdcabang", "");
                parameters.Add("@cvaliduser", "");

                // return value
                parameters.Add(
                    "@RETURN_VALUE",
                    dbType: DbType.Int32,
                    direction: ParameterDirection.ReturnValue
                );

                await connection.ExecuteAsync(
                    "dbo.Asp_DeleteDataKTP",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                var result =
                    parameters.Get<int>("@RETURN_VALUE");

                if (result == 0)
                {
                    return ApiResponse<object>.Success(
                        new
                        {
                            Noktp = noktp
                        },
                        "Data berhasil dihapus"
                    );
                }

                return ApiResponse<object>.Error(
                    "Gagal menghapus data",
                    "400"
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
