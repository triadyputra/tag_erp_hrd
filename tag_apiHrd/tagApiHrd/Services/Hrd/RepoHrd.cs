using Dapper;
using System.Data;
using System.Text;
using tagApi.Data;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.cuti;


namespace tagApi.Services.Hrd
{
    public class RepoHrd : IRepoHrd
    {
        private readonly DapperSistagHrdContext _context;

        public RepoHrd(DapperSistagHrdContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ViewKontrakAktif>> GetKontrakAktif(
            string? noKontrak,
            string? namaKaryawan,
            string? jenisKontrak,
            string? cabang,
            string? sisaKontrak,
            int page,
            int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                const string procedureName = "Web_Asp_ViewDataKontrakAktif";

                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();
                parameters.Add("@ckdcabang", string.IsNullOrWhiteSpace(cabang) ? null : cabang);
                parameters.Add("@cnokontrak", string.IsNullOrWhiteSpace(noKontrak) ? null : noKontrak);
                parameters.Add("@cnmkaryawan", string.IsNullOrWhiteSpace(namaKaryawan) ? null : namaKaryawan);
                parameters.Add("@cjnskontrak", string.IsNullOrWhiteSpace(jenisKontrak) ? null : jenisKontrak);
                parameters.Add("@SisaKontrakFilter", string.IsNullOrWhiteSpace(sisaKontrak) ? null : sisaKontrak);
                parameters.Add("@PageNumber", page);
                parameters.Add("@PageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                // 🔥 1. BACA TOTAL DULU
                var totalLong = await multi.ReadFirstOrDefaultAsync<long>();

                // 🔥 2. BARU DATA
                var data = (await multi.ReadAsync<ViewKontrakAktif>()).ToList();

                // 🔥 SAFE CAST
                var total = totalLong > int.MaxValue
                    ? int.MaxValue
                    : (int)totalLong;


                return new PagedResult<ViewKontrakAktif>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                // 🔥 Logging (optional tapi recommended)
                Console.WriteLine("ERROR GetKontrakAktif:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                // 🔥 lempar ke atas (biar controller handle)
                throw new Exception(
                    $"Gagal mengambil data kontrak aktif. {ex.Message}",
                    ex
                );
            }
        }

        public async Task<List<ViewFIlterKaryawan>> GetFilterKaryawan(
        string? nama,
        string? cabang)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                SELECT TOP 50
                    a.NOKTP,
                    a.NAMALENGKAP,
                    b.NMDIVISI,
                    b.NMJABATAN,
                    a.NMCABANG
                FROM HRDTAG.dbo.MST_KTP a
                LEFT JOIN (
                    SELECT NOKTP, NMDIVISI, NMJABATAN 
                    FROM (
                        SELECT *,
                            ROW_NUMBER() OVER (PARTITION BY NOKTP ORDER BY PAKHIR DESC) as rn
                        FROM HRDTAG.dbo.v_MASTERPEGAWAI
                    ) AS subquery
                    WHERE rn = 1
                ) b 
                ON a.NOKTP COLLATE DATABASE_DEFAULT = b.NOKTP COLLATE DATABASE_DEFAULT
                WHERE 
                    (@nama IS NULL OR a.NAMALENGKAP LIKE '%' + @nama + '%')
                    AND (
                        @cabang IS NULL 
                        OR @cabang = '' 
                        OR a.KDCABANG = @cabang
                    )
                ORDER BY a.NAMALENGKAP;
                ";

                var parameters = new DynamicParameters();
                parameters.Add("@nama", string.IsNullOrWhiteSpace(nama) ? null : nama);
                parameters.Add("@cabang", string.IsNullOrWhiteSpace(cabang) ? null : cabang);

                var data = (await connection.QueryAsync<ViewFIlterKaryawan>(
                    sql,
                    parameters
                )).ToList();

                return data;
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetFilterKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                throw new Exception(
                    $"Gagal mengambil data karyawan. {ex.Message}",
                    ex
                );
            }
        }


        public async Task<KaryawanDetailResult> GetDetailKaryawan(string noktp)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    -- 1. PROFILE
                    SELECT 
                        a.NOKTP, 
                        a.NAMALENGKAP, 
                        a.KELAMIN, 
                        a.TGLLAHIR, 
                        a.ALAMAT, 
                        a.TGLMASUK, 
                        a.FOTO, 
                        CASE
                            WHEN pk.TGLRESIGN IS NOT NULL THEN pk.TGLRESIGN
                            WHEN hk.PAKHIRFREE IS NOT NULL THEN hk.PAKHIRFREE
                            ELSE NULL
                        END AS ResignDate,
                        a.NMVENDOR,
                        kk.NIKSISTAG
                    FROM HRDTAG.dbo.MST_KTP a
                    LEFT JOIN dbo.TRX_KARYAWANPK pk 
                        ON a.NOKTP COLLATE DATABASE_DEFAULT = pk.NOKTP COLLATE DATABASE_DEFAULT
                    LEFT JOIN dbo.TRX_KARYAWANHK hk 
                        ON a.NOKTP COLLATE DATABASE_DEFAULT = hk.NIKKTP COLLATE DATABASE_DEFAULT
                    OUTER APPLY (
                        SELECT TOP 1 *
                        FROM dbo.TRX_KONTRAKKARYAWAN k
                        WHERE k.NOKTP COLLATE DATABASE_DEFAULT = a.NOKTP COLLATE DATABASE_DEFAULT
                        ORDER BY k.PAKHIR DESC
                    ) kk
                    WHERE a.NOKTP = @cnoktp;

                    -- 2. KONTRAK
                    SELECT 
                        a.TGLINPUT, a.NOKONTRAK, a.NIKSISTAG, a.JNSKONTRAK, 
                        a.PAWAL, a.PAKHIR, a.BEGINDATE,
                        a.NMDIVISI, a.NMBAGIAN, a.NMJABATAN, 
                        a.NMCABANG, a.KETERANGAN, a.NMVENDOR, a.Status, a.Validuser
                    FROM dbo.web_v_DATAKONTRAK a
                    WHERE a.NOKTP = @cnoktp
                    ORDER BY a.PAKHIR desc;

                    -- 3. SP
                    SELECT DISTINCT 
                        a.TGLPELANGGARAN, a.NOTRAN, a.NMATASAN, 
                        a.PELANGGARANHRD, a.SANKSIHRD, 
                        a.CATATANHRD, a.APPROVEDBY
                    FROM SISTAGHRD.dbo.TRX_KARYAWANSP a
                    LEFT JOIN HRDTAG.dbo.v_MASTERPEGAWAI b 
                        ON RIGHT('0000000000'+a.NIKKARYAWAN,10) = RIGHT('0000000000'+b.NIKSISTAG,10)
                        AND a.KDCABANG = b.KDCABANG
                    WHERE b.NOKTP = @cnoktp
                    ORDER BY a.TGLPELANGGARAN;
                    ";

                using var multi = await connection.QueryMultipleAsync(sql, new { cnoktp = noktp });

                var profile = await multi.ReadFirstOrDefaultAsync<KaryawanProfile>();
                var kontrak = (await multi.ReadAsync<KaryawanKontrak>()).ToList();
                var sp = (await multi.ReadAsync<KaryawanSP>()).ToList();

                if (profile?.FOTO != null)
                {
                    profile.FOTO_BASE64 = $"data:image/jpeg;base64,{Convert.ToBase64String(profile.FOTO)}";
                }

                return new KaryawanDetailResult
                {
                    Profile = profile,
                    Kontrak = kontrak,
                    SP = sp
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKaryawan:");
                Console.WriteLine(ex.Message);

                throw new Exception($"Gagal mengambil detail karyawan. {ex.Message}", ex);
            }
        }

        #region kontrak
        public async Task<KontrakKaryawanDto?> GetDetailKontrakByKtp(string noKtp)
        {
            try
            {
                using var connection = _context.CreateConnection();

                //var sql = @"
                //    SELECT 
                //        a.NOKTP,
                //        a.NAMALENGKAP NMKARYAWAN,
                //        a.TEMPATLAHIR,
                //        a.TGLLAHIR,
                //        a.ALAMAT,
                //        a.KELAMIN,
                //        a.PERKAWINAN,
                //        a.PENDIDIKAN,
                //        a.AGAMA,
                //        a.KDCABANG,
                //        a.NMCABANG,
                //        b.NIKSISTAG,
                //        a.IDFINGER,
                //        ISNULL(a.NMBANK,'BCA') AS NMBANK,
                //        a.NOREKENING,
                //        a.NOTELEPON NOHANDPHONE,
                //        a.TGLMASUK,
                //        a.FOTO,

                //        b.KDDIVISI,
                //        b.NMDIVISI,
                //        b.KDBAGIAN,
                //        b.NMBAGIAN,
                //        b.KDSUBBAGIAN,
                //        b.NMSUBBAGIAN,
                //        b.KDJABATAN,
                //        b.NMJABATAN,

                //        b.NMPERUSAHAAN,
                //        b.JNSKONTRAK,
                //        b.KATEGORIGAJI,
                //        b.JNSGAJI,
                //        b.NONPWP,
                //        b.PPH21,
                //        ISNULL(b.ISJAMINANBPJS,0) AS ISJAMINANBPJS,
                //        b.NOBPJSTK,
                //        b.NOBPJSKSH,
                //        b.NOBPJSJHT,

                //        null NOKONTRAK,
                //        b.PAWAL,
                //        b.PAKHIR

                //    FROM HRDTAG.dbo.MST_KTP a
                //    OUTER APPLY (
                //        SELECT TOP 1 *
                //        FROM TRX_KONTRAKKARYAWAN b
                //        WHERE a.NOKTP COLLATE DATABASE_DEFAULT = b.NOKTP COLLATE DATABASE_DEFAULT
                //        ORDER BY b.PAKHIR DESC
                //    ) b
                //    WHERE a.NOKTP = @noKtp
                //    ";

                var sql = @"
                    SELECT 
                        a.NOKTP,
                        a.NAMALENGKAP AS NMKARYAWAN,
                        a.TEMPATLAHIR,
                        a.TGLLAHIR,
                        a.ALAMAT,
                        a.KELAMIN,
                        a.PERKAWINAN,
                        a.PENDIDIKAN,
                        a.AGAMA,
                        a.KDCABANG,
                        a.NMCABANG,

                        isnull(kontrak.NIKSISTAG,tetap.NIKSISTAG) NIKSISTAG,

                        a.IDFINGER,

                        ISNULL(a.NMBANK,'BCA') AS NMBANK,

                        a.NOREKENING,
                        a.NOTELEPON AS NOHANDPHONE,
                        a.TGLMASUK,
                        a.FOTO,

                        kontrak.KDDIVISI,
                        kontrak.NMDIVISI,

                        kontrak.KDBAGIAN,
                        kontrak.NMBAGIAN,

                        kontrak.KDSUBBAGIAN,
                        kontrak.NMSUBBAGIAN,

                        kontrak.KDJABATAN,
                        kontrak.NMJABATAN,

                        kontrak.NMPERUSAHAAN,
                        kontrak.JNSKONTRAK,
                        kontrak.KATEGORIGAJI,
                        kontrak.JNSGAJI,
                        kontrak.NONPWP,
                        kontrak.PPH21,

                        ISNULL(kontrak.ISJAMINANBPJS,0)
                            AS ISJAMINANBPJS,

                        kontrak.NOBPJSTK,
                        kontrak.NOBPJSKSH,
                        kontrak.NOBPJSJHT,

                        NULL AS NOKONTRAK,

                        kontrak.PAWAL,
                        kontrak.PAKHIR

                    FROM HRDTAG.dbo.MST_KTP a

                    OUTER APPLY
                    (
                        SELECT TOP 1 *
                        FROM TRX_KONTRAKKARYAWAN kontrak
                        WHERE a.NOKTP COLLATE DATABASE_DEFAULT =
                              kontrak.NOKTP COLLATE DATABASE_DEFAULT
                        ORDER BY kontrak.PAKHIR DESC
                    ) kontrak

                    OUTER APPLY
                    (
                        SELECT TOP 1 *
                        FROM HRDTAG.dbo.MST_KARYAWANTETAP tetap
                        WHERE a.NOKTP COLLATE DATABASE_DEFAULT =
                              tetap.NOKTP COLLATE DATABASE_DEFAULT
                    ) tetap
                    WHERE a.NOKTP = @noKtp
                    ";
                var data = await connection.QueryFirstOrDefaultAsync<KontrakKaryawanDto>(
                    sql,
                    new { noKtp }
                );

                // 🔥 HANDLE FOTO
                if (data?.FOTO != null && data.FOTO.Length > 0)
                {
                    data.FOTO_BASE64 = $"data:image/jpeg;base64,{Convert.ToBase64String(data.FOTO)}";
                }

                return data;
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKontrak:");
                Console.WriteLine(ex.Message);

                throw new Exception($"Gagal ambil detail kontrak. {ex.Message}", ex);
            }
        }

        public async Task<PagedResult<KontrakKaryawanDto>> GetListKontrakKaryawan(
        DateTime? tglAwal,
        DateTime? tglAkhir,
        string? kdCabang,
        string? namaKaryawan,
        string? perusahaan,
        int page,
        int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                using var connection = _context.CreateConnection();

                var sql = @"
                    -- ================= TOTAL =================
                    SELECT COUNT(1)
                    FROM dbo.TRX_KONTRAKKARYAWAN
                    WHERE
                        (@tglAwal IS NULL OR TGLINPUT >= @tglAwal)
                        AND (@tglAkhir IS NULL OR TGLINPUT <= @tglAkhir)
                        AND (@kdCabang IS NULL OR KDCABANG = @kdCabang)
                        AND (@nama IS NULL OR NMKARYAWAN LIKE '%' + @nama + '%')
                        AND (@perusahaan IS NULL OR NMPERUSAHAAN LIKE '%' + @perusahaan + '%');

                    -- ================= DATA =================
                    SELECT NOKONTRAK, TGLINPUT, NOKTP, NMKARYAWAN, TEMPATLAHIR, TGLLAHIR, ALAMAT, KELAMIN, PENDIDIKAN, PERKAWINAN, AGAMA, 
                           KDCABANG, NMCABANG, NIKSISTAG, IDFINGER, NMBANK, NOREKENING, NOHANDPHONE, TGLMASUK, KDDIVISI, NMDIVISI, KDBAGIAN, 
                           NMBAGIAN, KDSUBBAGIAN, NMSUBBAGIAN, KDJABATAN, NMJABATAN, PERIODE, PAWAL, PAKHIR, NMPERUSAHAAN, JNSKONTRAK, 
                           KATEGORIGAJI, JNSGAJI, NONPWP, PPH21, ISJAMINANBPJS, NOBPJSTK, NOBPJSKSH, NOBPJSJHT, NOSURATTUGAS, KETERANGAN, VALIDUSER
                    FROM dbo.TRX_KONTRAKKARYAWAN
                    WHERE
                        (@tglAwal IS NULL OR TGLINPUT >= @tglAwal)
                        AND (@tglAkhir IS NULL OR TGLINPUT <= @tglAkhir)
                        AND (@kdCabang IS NULL OR KDCABANG = @kdCabang)
                        AND (@nama IS NULL OR NMKARYAWAN LIKE '%' + @nama + '%')
                        AND (@perusahaan IS NULL OR NMPERUSAHAAN LIKE '%' + @perusahaan + '%')
                    ORDER BY TGLINPUT DESC
                    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
                    ";

                var parameters = new DynamicParameters();
                parameters.Add("@tglAwal", tglAwal);
                parameters.Add("@tglAkhir", tglAkhir);
                parameters.Add("@kdCabang", string.IsNullOrWhiteSpace(kdCabang) ? null : kdCabang);
                parameters.Add("@nama", string.IsNullOrWhiteSpace(namaKaryawan) ? null : namaKaryawan);
                parameters.Add("@perusahaan", string.IsNullOrWhiteSpace(perusahaan) ? null : perusahaan);
                parameters.Add("@offset", (page - 1) * pageSize);
                parameters.Add("@pageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(sql, parameters);

                var total = await multi.ReadFirstAsync<int>();
                var data = (await multi.ReadAsync<KontrakKaryawanDto>()).ToList();

                // 🔥 convert foto ke base64
                foreach (var item in data)
                {
                    if (item.FOTO != null)
                    {
                        item.FOTO_BASE64 = $"data:image/jpeg;base64,{Convert.ToBase64String(item.FOTO)}";
                    }
                }

                return new PagedResult<KontrakKaryawanDto>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetListKontrakKaryawan:");
                Console.WriteLine(ex.Message);

                throw new Exception($"Gagal ambil list kontrak. {ex.Message}", ex);
            }
        }

        public async Task<KontrakKaryawanDto?> GetDetailKontrak(string noKontrak)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    SELECT *, ttd as status
                    FROM dbo.TRX_KONTRAKKARYAWAN
                    WHERE NOKONTRAK = @noKontrak;
                    ";

                var data = await connection.QueryFirstOrDefaultAsync<KontrakKaryawanDto>(
                    sql,
                    new { noKontrak }
                );

                if (data?.FOTO != null)
                {
                    data.FOTO_BASE64 = $"data:image/jpeg;base64,{Convert.ToBase64String(data.FOTO)}";
                }

                return data;
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKontrak:");
                Console.WriteLine(ex.Message);

                throw new Exception($"Gagal ambil detail kontrak. {ex.Message}", ex);
            }
        }

        public async Task<(string regCode, string nomorNik)> AddOrUpdateKontrakAsync(
            KontrakKaryawanDto model
        )
        {
            try
            {
                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();

                // ================= INPUT =================
                parameters.Add("@noktp", model.NOKTP);
                parameters.Add("@nmkaryawan", model.NMKARYAWAN);
                parameters.Add("@tempatlahir", model.TEMPATLAHIR);
                parameters.Add("@tgllahir", model.TGLLAHIR);
                parameters.Add("@alamat", model.ALAMAT);
                parameters.Add("@kelamin", model.KELAMIN);
                parameters.Add("@perkawinan", model.PERKAWINAN);
                parameters.Add("@pendidikan", model.PENDIDIKAN);
                parameters.Add("@agama", model.AGAMA);

                parameters.Add("@kdcabang", model.KDCABANG);
                parameters.Add("@nmcabang", model.NMCABANG);

                parameters.Add("@niksistag", model.NIKSISTAG ?? "");
                parameters.Add("@idfinger", model.IDFINGER);
                parameters.Add("@nmbank", model.NMBANK);
                parameters.Add("@norekening", model.NOREKENING);
                parameters.Add("@nohandphone", model.NOHANDPHONE);

                parameters.Add("@tglmasuk", model.TGLMASUK);
                parameters.Add("@tglinput", model.TGLINPUT ?? DateTime.Now);

                parameters.Add("@nokontrak", model.NOKONTRAK);

                parameters.Add("@kddivisi", model.KDDIVISI);
                parameters.Add("@nmdivisi", model.NMDIVISI);
                parameters.Add("@kdbagian", model.KDBAGIAN);
                parameters.Add("@nmbagian", model.NMBAGIAN);
                parameters.Add("@kdsubbagian", model.KDSUBBAGIAN);
                parameters.Add("@nmsubbagian", model.NMSUBBAGIAN);
                parameters.Add("@kdjabatan", model.KDJABATAN);
                parameters.Add("@nmjabatan", model.NMJABATAN);

                parameters.Add("@pawal", model.PAWAL);
                parameters.Add("@pakhir", model.PAKHIR);

                parameters.Add("@nmperusahaan", model.NMPERUSAHAAN);
                parameters.Add("@jnskontrak", model.JNSKONTRAK);
                parameters.Add("@kategorigaji", model.KATEGORIGAJI);
                parameters.Add("@jnsgaji", model.JNSGAJI);
                parameters.Add("@nonpwp", model.NONPWP);
                parameters.Add("@pph21", model.PPH21);

                parameters.Add("@isjaminanbpjs", model.ISJAMINANBPJS);
                parameters.Add("@nobpjstk", model.NOBPJSTK);
                parameters.Add("@nobpjskes", model.NOBPJSKSH);
                parameters.Add("@nobpjsjht", model.NOBPJSJHT);

                parameters.Add("@nosurattugas", model.NOSURATTUGAS);

                // 🔥 FOTO (byte[])
                parameters.Add("@foto", model.FOTO, DbType.Binary);

                parameters.Add("@keterangan", model.KETERANGAN);
                parameters.Add("@periode", model.PERIODE);

                parameters.Add("@validuser", model.VALIDUSER ?? "SYSTEM");

                // ================= OUTPUT =================
                parameters.Add("@regcode", dbType: DbType.String, size: 50, direction: ParameterDirection.Output);
                parameters.Add("@nomornik", dbType: DbType.String, size: 20, direction: ParameterDirection.Output);

                // ================= EXECUTE =================
                await connection.ExecuteAsync(
                    "Web_Asp_AddKontrakNewPKWT",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // ================= OUTPUT RESULT =================
                var regCode = parameters.Get<string>("@regcode");
                var nomorNik = parameters.Get<string>("@nomornik");

                return (regCode, nomorNik);
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR AddOrUpdateKontrak:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                throw new Exception($"Gagal simpan kontrak. {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteKontrakAsync(string noKontrak, string noKtp, string user)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();
                parameters.Add("@cnokontrak", noKontrak);
                parameters.Add("@cnoktp", noKtp);
                parameters.Add("@cvaliduser", user);

                // ambil return value
                parameters.Add("@RETURN_VALUE", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

                await connection.ExecuteAsync(
                    "dbo.Web_Asp_DeleteDataKontrakNewPKWT",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                var result = parameters.Get<int>("@RETURN_VALUE");

                return result == 0;
            }
            catch (Exception ex)
            {
                throw new Exception($"Gagal hapus kontrak: {ex.Message}");
            }
        }

        public async Task<int> UpdateStatusTtd(string noKontrak)
        {
            using var connection = _context.CreateConnection();

            var param = new DynamicParameters();
            param.Add("@nokontrak", noKontrak);

            // 🔥 ambil return value
            param.Add("returnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

            await connection.ExecuteAsync(
                "Web_Asp_UpdateStatusKontrak",
                param,
                commandType: CommandType.StoredProcedure
            );

            return param.Get<int>("returnValue");
        }
        #endregion

        #region cuti
        public async Task<PagedResult<ViewSaldoCutiKaryawan>> GetSaldoCutiKaryawan(
            int? tahun,
            string? cabang,
            string? nama,
            int page,
            int pageSize)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                const string procedureName = "Web_Asp_Saldo_Cuti_Karyawan";

                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();
                parameters.Add("@TAHUN", tahun);
                parameters.Add("@KDCABANG", string.IsNullOrWhiteSpace(cabang) ? null : cabang);
                parameters.Add("@NAMA", string.IsNullOrWhiteSpace(nama) ? null : nama);
                parameters.Add("@PageNumber", page);
                parameters.Add("@PageSize", pageSize);

                using var multi = await connection.QueryMultipleAsync(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var totalLong = await multi.ReadFirstOrDefaultAsync<long>();

                var data = (await multi.ReadAsync<ViewSaldoCutiKaryawan>()).ToList();

                var total = totalLong > int.MaxValue
                    ? int.MaxValue
                    : (int)totalLong;

                return new PagedResult<ViewSaldoCutiKaryawan>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetSaldoCutiKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                throw new Exception(
                    $"Gagal mengambil data saldo cuti karyawan. {ex.Message}",
                    ex
                );
            }
        }

        public async Task<CutiKaryawanDetailResponse> GetDetailCutiAsync(
        string noktp,
        int? tahun)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noktp))
                    throw new ArgumentException("NOKTP wajib diisi");

                const string procedureName = "Web_Asp_Saldo_Cuti_Karyawan_Detail";

                using var connection = _context.CreateConnection();

                var parameters = new DynamicParameters();
                parameters.Add("@NOKTP", noktp);
                parameters.Add("@TAHUN", tahun);

                using var multi = await connection.QueryMultipleAsync(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                // 🔥 RESULT 1 (SUMMARY)
                var summary = await multi.ReadFirstOrDefaultAsync<CutiSummaryDto>();

                // 🔥 RESULT 2 (DETAIL)
                var detail = (await multi.ReadAsync<CutiDetailDto>()).ToList();

                return new CutiKaryawanDetailResponse
                {
                    Summary = summary ?? new CutiSummaryDto(),
                    Detail = detail
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailCutiKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                throw new Exception(
                    $"Gagal mengambil detail cuti karyawan. {ex.Message}",
                    ex
                );
            }
        }

        // =========================
        // FORM CUTI
        // =========================
        public async Task<PagedResult<ViewCutiKaryawanDto>> GetListCutiAsync(
            DateTime? tglAwal,
            DateTime? tglAkhir,
            string? nama, 
            string? cabang, 
            int page,
            int pageSize)
        {
            using var connection = _context.CreateConnection();

            var param = new DynamicParameters();
            param.Add("@TanggalAwal", tglAwal);
            param.Add("@TanggalAkhir", tglAkhir);
            param.Add("@NamaKaryawan", nama);
            param.Add("@KdCabang", cabang);
            param.Add("@PageNumber", page);
            param.Add("@PageSize", pageSize);

            using var multi = await connection.QueryMultipleAsync(
                "Web_Asp_ViewCutiKaryawan_xNEW",
                param,
                commandType: CommandType.StoredProcedure
            );

            // =========================
            // TOTAL DATA
            // =========================
            var total = await multi.ReadFirstOrDefaultAsync<int>();

            // =========================
            // DATA LIST
            // =========================
            var data = (await multi.ReadAsync<ViewCutiKaryawanDto>()).ToList();

            return new PagedResult<ViewCutiKaryawanDto>
            {
                Data = data,
                Total = total
            };
        }

        public async Task<FormCutiKaryawan?> GetDetailCutiFormAsync(string noCuti)
        {
            using var connection = _context.CreateConnection();

            var sql = @"
                SELECT 
                    NOCUTI,
                    TANGGAL,
                    NIKKARYAWAN,
                    NMKARYAWAN,
                    KDDIVISI,
                    NMDIVISI,
                    KDBAGIAN,
                    NMBAGIAN,
                    KDSUBBAGIAN,
                    NMSUBBAGIAN,
                    KDJABATAN,
                    NMJABATAN,
                    ALAMAT,
                    TELEPON,
                    JNSCUTI,
                    JMLHARI,
                    KEPERLUAN,
                    CATATAN,
                    HAKCUTI,
                    TERPAKAI,
                    SISACUTI,
                    KDCABANG,
                    VALIDUSER
                FROM dbo.HDR_KARYAWANCUTI
                WHERE NOCUTI = @NoCuti;

                SELECT
                    TGLCUTI
                FROM dbo.DTL_KARYAWANCUTI
                WHERE NOCUTI = @NoCuti
                ORDER BY TGLCUTI;
            ";

            using var multi = await connection.QueryMultipleAsync(sql, new { NoCuti = noCuti });

            var header = await multi.ReadFirstOrDefaultAsync<FormCutiKaryawan>();

            if (header == null)
                return null;

            var details = (await multi.ReadAsync<DateTime>()).ToList();

            // 🔥 mapping ke DetailTanggal
            header.DetailTanggal = details;

            return header;
        }

        public async Task<SpResult> SaveCutiAsync(FormCutiKaryawan req)
        {
            using var connection = _context.CreateConnection();

            var param = new DynamicParameters();

            // =========================
            // HEADER
            // =========================
            param.Add("@nocuti", req.NoCuti);
            param.Add("@tanggal", req.Tanggal);
            param.Add("@nikkaryawan", req.NikKaryawan);
            param.Add("@nmkaryawan", req.NmKaryawan);
            param.Add("@kddivisi", req.KdDivisi);
            param.Add("@nmdivisi", req.NmDivisi);
            param.Add("@kdbagian", req.KdBagian);
            param.Add("@nmbagian", req.NmBagian);
            param.Add("@kdsubbagian", req.KdSubBagian);
            param.Add("@nmsubbagian", req.NmSubBagian);
            param.Add("@kdjabatan", req.KdJabatan);
            param.Add("@nmjabatan", req.NmJabatan);
            param.Add("@alamat", req.Alamat);
            param.Add("@telepon", req.Telepon);
            param.Add("@jnscuti", req.JnsCuti);
            param.Add("@jmlhari", req.JmlHari);
            param.Add("@keperluan", req.Keperluan);
            param.Add("@catatan", req.Catatan);
            param.Add("@hakcuti", req.HakCuti);
            param.Add("@terpakai", req.Terpakai);
            param.Add("@sisacuti", req.SisaCuti);
            param.Add("@kdcabang", req.KdCabang);
            param.Add("@validuser", req.ValidUser);
            param.Add("@status", req.Status);

            // =========================
            // XML DETAIL
            // =========================
            var xml = GenerateXml(req.DetailTanggal);
            param.Add("@griddetails", xml);

            // OUTPUT
            param.Add("@regcode", dbType: DbType.String, size: 30, direction: ParameterDirection.Output);

            // =========================
            // EXECUTE
            // =========================
            var result = await connection.QueryFirstAsync<SpResult>(
                "Web_Asp_AddNewCutiKaryawan_xHRD",
                param,
                commandType: CommandType.StoredProcedure
            );

            // ambil output jika perlu
            var noCuti = param.Get<string>("@regcode");

            if (string.IsNullOrEmpty(result.NoCuti))
            {
                result.NoCuti = noCuti;
            }

            return result;
        }

        public async Task<SpResult> DeleteCutiAsync(string noCuti, string validUser)
        {
            using var connection = _context.CreateConnection();

            var param = new DynamicParameters();
            param.Add("@cnocuti", noCuti);
            param.Add("@cvaliduser", validUser);

            var result = await connection.QueryFirstAsync<SpResult>(
                "Web_Asp_DeleteKaryawanCuti",
                param,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        // =========================
        // GENERATE XML
        // =========================
        private string GenerateXml(List<DateTime> dates)
        {
            var sb = new StringBuilder();
            sb.Append("<Details>");

            foreach (var d in dates)
            {
                sb.Append("<Item>");
                sb.Append($"<Tanggal>{d:yyyy-MM-dd}</Tanggal>");
                sb.Append("</Item>");
            }

            sb.Append("</Details>");
            return sb.ToString();
        }
        
        #endregion



    }

}
