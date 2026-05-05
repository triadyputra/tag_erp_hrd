using Dapper;
using System.Data;
using tagApi.Data;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;

namespace tagApiHrd.Services.Legal
{
    public class RepoPacklaring : IRepoPacklaring
    {
        private readonly DapperSistagHrdContext _context;

        public RepoPacklaring(DapperSistagHrdContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ViewPacklaringDto>> GetPacklaringList(
        string? nomor,
        string? nama,
        string? jenis,
        string? cabang,
        DateTime? tglAwal,
        DateTime? tglAkhir,
        int page,
        int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                const string procedureName = "dbo.Web_Asp_ViewPacklaring";

                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();

                // sesuai nama parameter di Stored Procedure
                parameters.Add("@nomor", string.IsNullOrWhiteSpace(nomor) ? null : nomor);
                parameters.Add("@nama", string.IsNullOrWhiteSpace(nama) ? null : nama);
                parameters.Add("@jenis", string.IsNullOrWhiteSpace(jenis) ? null : jenis);
                parameters.Add("@cabang", string.IsNullOrWhiteSpace(cabang) ? null : cabang);

                parameters.Add("@tglAwal", tglAwal);
                parameters.Add("@tglAkhir", tglAkhir);

                parameters.Add("@page", page);
                parameters.Add("@pageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                // resultset 1 = total
                var total = await multi.ReadFirstOrDefaultAsync<int>();

                // resultset 2 = data
                var data = (await multi.ReadAsync<ViewPacklaringDto>()).ToList();

                return new PagedResult<ViewPacklaringDto>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data packlaring. {ex.Message}",
                    ex
                );
            }
        }

        public async Task<PacklaringDto?> GetDetailPacklaring(string id)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    SELECT *
                    FROM dbo.TRX_PACKLARING
                    WHERE id = @id;
                    ";

                var data = await connection.QueryFirstOrDefaultAsync<PacklaringDto>(
                    sql,
                    new { id }
                );

                return data;
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKontrak:");
                Console.WriteLine(ex.Message);

                throw new Exception($"Gagal ambil detail kontrak. {ex.Message}", ex);
            }
        }


        public async Task<string> SavePacklaring(PacklaringDto model, string user)
        {
            using var conn = _context.CreateConnection();

            var param = new DynamicParameters();
            param.Add("@Id", model.Id);
            param.Add("@Tanggal", model.Tanggal);
            param.Add("@Nomor", model.Nomor);
            param.Add("@NoKtp", model.NoKtp);
            param.Add("@Nik", model.Nik);
            param.Add("@NamaKaryawan", model.NamaKaryawan);
            param.Add("@Divisi", model.Divisi);
            param.Add("@Masuk", model.Masuk);
            param.Add("@Keluar", model.Keluar);
            param.Add("@Hrd", model.Hrd);
            param.Add("@KdCabang", model.KdCabang);
            param.Add("@NmCabang", model.NmCabang);
            param.Add("@Jenis", model.Jenis);
            param.Add("@Keperluan", model.Keperluan);
            param.Add("@Status", model.Status);
            param.Add("@ValidUser", user);

            await conn.ExecuteAsync("Web_Asp_AddPacklaring", param, commandType: CommandType.StoredProcedure);

            return model.Nomor!;
        }

        public async Task<bool> DeletePacklaring(string id)
        {
            try
            {
                using var conn = _context.CreateConnection();

                const string sql = @"
                DELETE FROM dbo.TRX_PACKLARING
                WHERE Id = @id";

                var affected = await conn.ExecuteAsync(sql, new { id });

                return affected > 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Gagal hapus packlaring. {ex.Message}", ex);
            }
        }



        // ===============================
        // REPOSITORY
        // ===============================
        public async Task<List<PacklaringDto>> GetListPacklaringByNik(string NoKtp)
        {
            using var conn = _context.CreateConnection();

            const string sql = @"
                SELECT *
                FROM dbo.TRX_PACKLARING
                WHERE NoKtp = @NoKtp
                ORDER BY Tanggal DESC, Id DESC";

            var data = await conn.QueryAsync<PacklaringDto>(sql, new { NoKtp });

            return data.ToList();
        }

    }
}
