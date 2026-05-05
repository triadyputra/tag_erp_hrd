using Dapper;
using System.Net.Http;
using tagApi.Data;
using tagApi.Helper;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;


namespace tagApi.Services.Combo
{
    public class RepoCombo : IRepoCombo
    {
        private readonly DapperSistagContext _context;
        private readonly DapperSistagHrdContext _contextHrd;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RepoCombo(DapperSistagContext context, DapperSistagHrdContext contextHrd, HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _contextHrd = contextHrd;
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> GetCabangAsync(string cabang, string? token)
        {
            //var _token = _httpContextAccessor.HttpContext?
            //    .Request.Headers["Authorization"]
            //    .FirstOrDefault()?.Replace("Bearer ", "") ?? token;

            if (string.IsNullOrEmpty(token))
            {
                token = _httpContextAccessor.HttpContext ?
                    .Request.Headers["Authorization"]
                    .FirstOrDefault()?.Replace("Bearer ", "") ?? token; 
            }

            var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"https://apisistag.tag.co.id/erp-konfigurasi/api/Auth/GetCabang?cabang={cabang}"
            );

            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return string.Empty;

            var content = await response.Content.ReadAsStringAsync();

            var result = System.Text.Json.JsonSerializer.Deserialize<ApiResponse<string>>(content);

            return result?.Data ?? string.Empty;
        }

        public async Task<IEnumerable<ComboViewModel>> ComboCabang()
        {
            var query = "SELECT KDCABANG Id, NMCABANG Name FROM TBL_CABANG order by NMCABANG";


            using (var connection = _context.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboCabangWithPusat()
        {
            var query = "SELECT KDCABANG Id, NMCABANG Name FROM TBL_CABANG where kdgroup = 'TAG' order by NMCABANG";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboBank()
        {
            var query = "SELECT KDBANK Id, NMBANK Name FROM TBL_BANK order by NMBANK";


            using (var connection = _context.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboVendor()
        {
            //var query = "SELECT KDBANK Id, NMBANK Name FROM TBL_BANK order by NMBANK";
            var query = "SELECT KDVENDOR Id, NMVENDOR Name FROM TBL_VENDOR ORDER BY NMVENDOR";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }


        public async Task<List<ViewLookupMasterKtp>> ListMasterPegawai(string? nama, string? kdcabang)
        {
            var query = @"
                    SELECT 
                        NOKTP, 
                        NAMALENGKAP, 
                        KELAMIN, 
                        ALAMAT, 
                        KDCABANG 
                    FROM HRDTAG.dbo.MST_KTP
                    WHERE 
                        (@ckdcabang IS NULL OR KDCABANG = @ckdcabang)
                        AND (@cnmlengkap IS NULL OR NAMALENGKAP LIKE '%' + @cnmlengkap + '%')
                    ORDER BY NAMALENGKAP
                ";

            using (var connection = _contextHrd.CreateConnection())
            {
                var data = await connection.QueryAsync<ViewLookupMasterKtp>(
                    query,
                    new
                    {
                        ckdcabang = string.IsNullOrWhiteSpace(kdcabang) ? null : kdcabang,
                        cnmlengkap = string.IsNullOrWhiteSpace(nama) ? null : nama
                    }
                );

                return data.ToList();
            }


        }


        public async Task<IEnumerable<ComboViewModel>> ComboDivisi()
        {
            var query = "SELECT KDDIVISI Id, NMDIVISI Name FROM REF_DIVISI where KDDIVISI != 14  ORDER BY kddivisi";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboBagian(string divisi)
        {
            var query = "SELECT KDBAGIAN Id, NMBAGIAN Name FROM REF_BAGIAN where kddivisi=@divisi ORDER by kdbagian";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query, new {divisi});
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboSubBagian(string bagian)
        {
            var query = "SELECT KDSUBBAGIAN Id, NMSUBBAGIAN Name FROM REF_SUBBAGIAN where kdbagian=@bagian ORDER by kdsubbagian";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query, new { bagian });
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboJabatan()
        {
            var query = "SELECT KDJABATAN Id, NMJABATAN Name FROM REF_JABATAN where KDJABATAN != 27 ORDER BY kdjabatan";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboKategoriGaji()
        {
            var query = "SELECT KATEGORI Id, KATEGORI Name FROM REFF_KATEGORIGAJI ORDER BY id";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }

        public async Task<IEnumerable<ComboViewModel>> ComboJenisGaji()
        {
            var query = "SELECT JENIS Id, JENIS Name FROM REFF_JENISGAJI ORDER BY id";


            using (var connection = _contextHrd.CreateConnection())
            {
                var companies = await connection.QueryAsync<ComboViewModel>(query);
                return companies.ToList();
            }
        }



        public async Task<IEnumerable<ViewAspekPenilaianDto>> ListAspekPenilaian()
        {
            try
            {
                using var connection = _contextHrd.CreateConnection();

                const string sql = @"
                SELECT
                    ID       AS Id,
                    GRP      AS Grp,
                    NMGRP    AS NmGrp,
                    NOURUT   AS NoUrut,
                    KDASPEK  AS KdAspek,
                    NMASPEK  AS NmAspek
                FROM dbo.TBL_ASPEKPENILAIAN
                ORDER BY NOURUT, ID";

                var data = await connection.QueryAsync<ViewAspekPenilaianDto>(sql);

                return data;
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data aspek penilaian. {ex.Message}",
                    ex
                );
            }
        }


        public async Task<ViewMasterPegawaiDto?> GetDetailMasterPegawai(string cniksistag)
        {
            try
            {
                using var connection = _context.CreateConnection();

                const string sql = @"
                SELECT
                    a.NOKTP           AS NoKtp,
                    a.NMKARYAWAN      AS NmKaryawan,
                    a.IDFINGER        AS IdFinger,
                    a.NIKSISTAG       AS NikSistag,
                    a.JNSKONTRAK      AS JnsKontrak,
                    a.NOKONTRAK       AS NoKontrak,
                    a.TMT             AS Tmt,
                    a.PAWAL           AS PAwal,
                    a.PAKHIR          AS PAkhir,
                    a.BEGINDATE       AS BeginDate,
                    a.ENDDATE         AS EndDate,
                    a.KDDIVISI        AS KdDivisi,
                    a.NMDIVISI        AS NmDivisi,
                    a.KDBAGIAN        AS KdBagian,
                    a.NMBAGIAN        AS NmBagian,
                    a.KDSUBBAGIAN     AS KdSubBagian,
                    a.NMSUBBAGIAN     AS NmSubBagian,
                    a.KDJABATAN       AS KdJabatan,
                    a.NMJABATAN       AS NmJabatan,
                    a.KELAMIN         AS Kelamin,
                    a.PERKAWINAN      AS Perkawinan,
                    a.AGAMA           AS Agama,
                    a.PENDIDIKAN      AS Pendidikan,
                    a.TEMPATLAHIR     AS TempatLahir,
                    a.TGLLAHIR        AS TglLahir,
                    a.ALAMATKTP       AS AlamatKtp,
                    a.ALAMATTINGGAL   AS AlamatTinggal,
                    a.KDCABANG        AS KdCabang,
                    a.NMCABANG        AS NmCabang,
                    a.NMVENDOR        AS NmVendor,
                    a.KATKONTRAK      AS KatKontrak
                FROM HRDTAG.dbo.v_MASTERPEGAWAI a
                WHERE RIGHT('0000000000' + a.NIKSISTAG,10) = RIGHT('0000000000' + @cniksistag,10)";

                return await connection.QueryFirstOrDefaultAsync<ViewMasterPegawaiDto>(
                    sql,
                    new { cniksistag }
                );
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil detail master pegawai. {ex.Message}",
                    ex
                );
            }
        }
    }
}
