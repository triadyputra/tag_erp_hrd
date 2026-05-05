using DevExpress.XtraReports.UI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using tagApi.Model;
using tagApi.Report.Hrd;
using tagApi.Services.Hrd;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.cuti;
using tagApiHrd.Model.Dto.legal;
using tagApiHrd.Model.Dto.mobile;
using tagApiHrd.Model.Dto.report;
using tagApiHrd.Report.Hrd;
using tagApiHrd.Services.Legal;

namespace tagApiHrd.Controllers.Mobile
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MobileHrController : ControllerBase
    {
        private readonly IRepoHrd _repo;
        private readonly IRepoPacklaring _repoPacklaring;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly string _ttdPath;
        public MobileHrController(IRepoHrd repo, IRepoPacklaring repoPacklaring, UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _repo = repo;
            _repoPacklaring = repoPacklaring;
            this.userManager = userManager;
            // 🔥 ambil dari appsettings
            _ttdPath = configuration["FileStorage:TtdPath"] ?? "D:/TAG/Storage/";
        }

        [HttpGet("GetDetailKontrakMobile")]
        public async Task<ActionResult<ApiResponse<object>>> GetDetailKontrakMobile(string noKontrak)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noKontrak))
                {
                    return BadRequest(ApiResponse<object>.Error("No kontrak wajib diisi", "400"));
                }

                var dataDb = await _repo.GetDetailKontrak(noKontrak);

                if (dataDb == null)
                {
                    return NotFound(ApiResponse<object>.Error("Data kontrak tidak ditemukan", "404"));
                }

                // ===============================
                // MAPPING DTO
                // ===============================
                var reportData = new KontrakReportDto
                {
                    NoKontrak = dataDb.NOKONTRAK,
                    NikSistag = dataDb.NIKSISTAG,
                    NamaKaryawan = dataDb.NMKARYAWAN,
                    NoKtp = dataDb.NOKTP,
                    Alamat = dataDb.ALAMAT,
                    Telepon = dataDb.NOHANDPHONE,
                    Jabatan = dataDb.NMJABATAN,
                    TglMulai = dataDb.PAWAL,
                    TglSelesai = dataDb.PAKHIR,
                    JenisKelamin = dataDb.KELAMIN,
                    Agama = dataDb.AGAMA,
                    Status = dataDb.PERKAWINAN,
                    TempatLahir = dataDb.TEMPATLAHIR,
                    TanggalLahir = dataDb.TGLLAHIR,
                    StatusTtd = dataDb.Status,
                    //Pasal1 = GetPasal1(dataDb),
                    //Pasal2 = GetPasal2(dataDb),
                    //Pasal3 = GetPasal3(dataDb)
                };

                // ===============================
                // AMBIL SIGNATURE
                // ===============================
                var cleanNoKontrak = dataDb.NOKONTRAK.Replace("/", "").Trim();

                string? foundPath = null;

                try
                {
                    var file = Directory
                        .GetFiles(_ttdPath, $"{cleanNoKontrak}.*", SearchOption.TopDirectoryOnly)
                        .FirstOrDefault();

                    if (file != null)
                    {
                        foundPath = file;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERROR READ DIRECTORY: {ex.Message}");
                }

                if (!string.IsNullOrEmpty(foundPath))
                {
                    var bytes = await System.IO.File.ReadAllBytesAsync(foundPath);

                    var ext = Path.GetExtension(foundPath).ToLower();
                    var mime = ext switch
                    {
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".png" => "image/png",
                        _ => "application/octet-stream"
                    };

                    reportData.SIGNATURE_BASE64 = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
                }
                else
                {
                    reportData.SIGNATURE_BASE64 = null;
                }

                // ===============================
                // GENERATE PDF
                // ===============================
                var report = new RefKontrakPwkt();
                report.DataSource = new[] { reportData };
                report.CreateDocument();

                using MemoryStream ms = new MemoryStream();
                report.ExportToPdf(ms);

                var pdfBase64 = Convert.ToBase64String(ms.ToArray());

                // ===============================
                // RESPONSE MOBILE
                // ===============================
                return Ok(ApiResponse<object>.Success(new
                {
                    Detail = reportData,
                    PdfBase64 = pdfBase64
                }));
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKontrakMobile:");
                Console.WriteLine(ex.Message);

                return BadRequest(ApiResponse<object>.Error(ex.Message, "500"));
            }
        }

        [HttpPost("SignKontrak")]
        public async Task<ActionResult<ApiResponse<object>>> SignKontrak([FromBody] SignRequest req)
        {
            try
            {
                // ===============================
                // VALIDASI
                // ===============================
                if (string.IsNullOrWhiteSpace(req.NoKontrak))
                    return BadRequest(ApiResponse<object>.Error("No kontrak kosong", "400"));

                if (string.IsNullOrWhiteSpace(req.Signature))
                    return BadRequest(ApiResponse<object>.Error("Signature kosong", "400"));

                // ===============================
                // CLEAN FILE NAME (HAPUS / DLL)
                // ===============================
                var cleanNoKontrak = CleanFileName(req.NoKontrak);

                // ===============================
                // BASE64 → BYTE
                // ===============================
                var base64 = req.Signature.Contains(",")
                    ? req.Signature.Split(',')[1]
                    : req.Signature;

                byte[] bytes;
                try
                {
                    bytes = Convert.FromBase64String(base64);
                }
                catch
                {
                    return BadRequest(ApiResponse<object>.Error("Format base64 tidak valid", "400"));
                }

                // ===============================
                // PATH DARI APPSETTINGS
                // ===============================
                var fullPath = Path.Combine(_ttdPath, $"{cleanNoKontrak}.png");

                // ===============================
                // PASTIKAN DIRECTORY ADA
                // ===============================
                var dir = Path.GetDirectoryName(fullPath);
                if (!Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir!);
                }

                // ===============================
                // SIMPAN FILE
                // ===============================
                await System.IO.File.WriteAllBytesAsync(fullPath, bytes);

                // 🔥 VALIDASI FILE BENAR-BENAR ADA
                if (!System.IO.File.Exists(fullPath))
                {
                    throw new Exception("Gagal menyimpan file signature");
                }


                var affected = await _repo.UpdateStatusTtd(req.NoKontrak);

                if (affected == 0)
                {
                    // 🔥 rollback file
                    if (System.IO.File.Exists(fullPath))
                    {
                        System.IO.File.Delete(fullPath);
                    }

                    return BadRequest(new
                    {
                        message = "Data kontrak tidak ditemukan / gagal update"
                    });
                }

                // ===============================
                // RESPONSE
                // ===============================
                return Ok(ApiResponse<object>.Success(new
                {
                    message = "Berhasil",
                    fileName = $"{cleanNoKontrak}.png",
                    fullPath = fullPath
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message, "400"));
            }
        }


        private string CleanFileName(string input)
        {
            foreach (var c in Path.GetInvalidFileNameChars())
            {
                input = input.Replace(c.ToString(), "");
            }
            return input.Replace("/", "").Trim();
        }

        #region cuti
        [HttpGet("GetDetailCuti")]
        public async Task<ActionResult<ApiResponse<object>>> GetDetailCuti(
        [FromQuery] string noktp,
        [FromQuery] int? tahun)
        {
            var result = await _repo.GetDetailCutiAsync(noktp, tahun);

            return Ok(ApiResponse<object>.Success(result));
        }

        [HttpPost("SaveCutiKaryawanMobile")]
        public async Task<ActionResult<ApiResponse<object>>> SaveCutiKaryawanMobile(
            [FromBody] CutiMobileRequest request
        )
        {
            try
            {
                // =========================
                // VALIDASI DASAR
                // =========================
                if (request == null)
                    return BadRequest(ApiResponse<object>.Error("Data tidak boleh kosong", "400"));

                if (string.IsNullOrWhiteSpace(request.NIK))
                    return BadRequest(ApiResponse<object>.Error("NIK wajib diisi", "400"));

                if (string.IsNullOrWhiteSpace(request.JnsCuti))
                    return BadRequest(ApiResponse<object>.Error("Jenis cuti wajib diisi", "400"));

                if (request.TanggalCuti == null || !request.TanggalCuti.Any())
                    return BadRequest(ApiResponse<object>.Error("Tanggal cuti wajib diisi", "400"));

                // =========================
                // VALIDASI SABTU / MINGGU ❌
                // =========================
                foreach (var date in request.TanggalCuti)
                {
                    if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                    {
                        return BadRequest(ApiResponse<object>.Error(
                            $"Tanggal {date:dd MMM yyyy} jatuh pada weekend (tidak diperbolehkan)",
                            "400"
                        ));
                    }
                }

                // =========================
                // AMBIL DATA KARYAWAN
                // =========================
                var noktp = request.NIK;

                var dataKaryawan = await _repo.GetDetailKontrakByKtp(noktp);

                if (dataKaryawan == null)
                    return BadRequest(ApiResponse<object>.Error("Data karyawan tidak ditemukan", "404"));

                // =========================
                // CEK SALDO CUTI
                // =========================
                var tahun = DateTime.Now.Year;

                var saldo = await _repo.GetDetailCutiAsync(noktp, tahun);

                if (saldo == null)
                    return BadRequest(ApiResponse<object>.Error("Saldo cuti tidak ditemukan", "404"));

                // =========================
                // VALIDASI MASIH ADA PENGAJUAN MENUNGGU ❌
                // =========================
                if (saldo.Summary?.JumlahPengajuan > 0)
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Masih ada pengajuan cuti yang menunggu approval",
                        "400"
                    ));
                }

                var jumlahHari = request.TanggalCuti.Count;

                if (saldo.Summary == null)
                {
                    return BadRequest(ApiResponse<object>.Error("Data saldo cuti tidak valid", "500"));
                }

                if (saldo.Summary.Sisa < jumlahHari)
                {
                    return BadRequest(ApiResponse<object>.Error(
                        $"Saldo cuti tidak cukup. Sisa: {saldo.Summary.Sisa}, Pengajuan: {jumlahHari}",
                        "400"
                    ));
                }

                // =========================
                // USER LOGIN
                // =========================
                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "SYSTEM";

                // =========================
                // MAPPING KE MODEL
                // =========================
                var model = new FormCutiKaryawan
                {
                    NoCuti = null,
                    Tanggal = DateTime.Now,

                    NikKaryawan = dataKaryawan.NIKSISTAG,
                    NmKaryawan = dataKaryawan.NMKARYAWAN,

                    KdDivisi = dataKaryawan.KDDIVISI,
                    NmDivisi = dataKaryawan.NMDIVISI,

                    KdBagian = dataKaryawan.KDBAGIAN,
                    NmBagian = dataKaryawan.NMBAGIAN,

                    KdSubBagian = dataKaryawan.KDSUBBAGIAN,
                    NmSubBagian = dataKaryawan.NMSUBBAGIAN,

                    KdJabatan = dataKaryawan.KDJABATAN,
                    NmJabatan = dataKaryawan.NMJABATAN,

                    Alamat = dataKaryawan.ALAMAT,
                    Telepon = dataKaryawan.NOHANDPHONE,

                    JnsCuti = request.JnsCuti,
                    JmlHari = jumlahHari,
                    Keperluan = request.Keperluan,
                    KdCabang = dataKaryawan.KDCABANG,

                    ValidUser = username,

                    DetailTanggal = request.TanggalCuti,

                    HakCuti = saldo.Summary.Saldo,
                    Terpakai = saldo.Summary.Terpakai,
                    SisaCuti = saldo.Summary.Sisa,
                };

                // =========================
                // SIMPAN
                // =========================
                var result = await _repo.SaveCutiAsync(model);

                if (result.Code != "200")
                {
                    return BadRequest(ApiResponse<object>.Error(result.Message, result.Code));
                }

                return Ok(ApiResponse<object>.Success(new
                {
                    NoCuti = result.NoCuti
                }, "Pengajuan cuti berhasil"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }

        [HttpDelete("DeleteCutiKaryawanMobile/{noCuti}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteCutiKaryawanMobile(string noCuti)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noCuti))
                {
                    return BadRequest(ApiResponse<object>.Error("NoCuti wajib diisi", "400"));
                }

                // ambil user login
                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "SYSTEM";

                var result = await _repo.DeleteCutiAsync(noCuti, username);

                if (result.Code != "200")
                {
                    return BadRequest(ApiResponse<object>.Error(result.Message, result.Code));
                }

                return Ok(ApiResponse<object>.Success(null, result.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }

        #endregion

        #region packlaring
        [HttpPost("SavePacklaringMobile")]
        public async Task<ActionResult<ApiResponse<object>>> SavePacklaringMobile(
        [FromBody] PengajuanPacklaringRequest request)
        {
            try
            {
                // =========================
                // VALIDASI DASAR
                // =========================
                if (request == null)
                    return BadRequest(ApiResponse<object>.Error("Data tidak boleh kosong", "400"));

                if (string.IsNullOrWhiteSpace(request.NoKtp))
                    return BadRequest(ApiResponse<object>.Error("No Ktp wajib diisi", "400"));

                if (string.IsNullOrWhiteSpace(request.Jenis))
                    return BadRequest(ApiResponse<object>.Error("Jenis wajib diisi", "400"));

                if (string.IsNullOrWhiteSpace(request.Keperluan))
                    return BadRequest(ApiResponse<object>.Error("Keperluan wajib diisi", "400"));

                // =========================
                // AMBIL DATA KARYAWAN
                // =========================
                var dataKaryawan = await _repo.GetDetailKontrakByKtp(request.NoKtp);

                if (dataKaryawan == null)
                    return BadRequest(ApiResponse<object>.Error("Data karyawan tidak ditemukan", "404"));

                // =========================
                // USER LOGIN
                // =========================
                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "SYSTEM";

                // =========================
                // BENTUK DATA PACKLARING
                // =========================
                var model = new PacklaringDto
                {
                    Id = null,
                    Tanggal = DateTime.Now,
                    Nomor = Guid.NewGuid().ToString(),
                    NoKtp = dataKaryawan.NOKTP,
                    Nik = dataKaryawan.NIKSISTAG,
                    NamaKaryawan = dataKaryawan.NMKARYAWAN,
                    Divisi = dataKaryawan.NMDIVISI,
                    Masuk = dataKaryawan.TGLMASUK,
                    Keluar = DateTime.Now,
                    Hrd = username,
                    KdCabang = dataKaryawan.KDCABANG,
                    NmCabang = dataKaryawan.NMCABANG,
                    Jenis = request.Jenis,
                    Status = 0,
                    Keperluan = request.Keperluan,
                };

                // kalau perlu simpan keperluan, tambahkan field di dto/table
                // model.Keperluan = request.Keperluan;

                // =========================
                // SIMPAN
                // =========================
                var result = await _repoPacklaring.SavePacklaring(model, username);

                return Ok(ApiResponse<object>.Success(new
                {
                    Nomor = result
                }, "Pengajuan packlaring berhasil"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }

        // ===============================
        // MOBILE CONTROLLER
        // ===============================
        [HttpGet("GetListPacklaringByNik")]
        public async Task<ActionResult<ApiResponse<object>>> GetListPacklaringByNik(string NoKtp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(NoKtp))
                    return BadRequest(ApiResponse<object>.Error("NIK wajib diisi", "400"));

                var data = await _repoPacklaring.GetListPacklaringByNik(NoKtp);

                return Ok(ApiResponse<object>.Success(data));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }

        // ===============================
        // PRINT PACKLARING MOBILE
        // ===============================
        [HttpGet("PrintPacklaringMobile")]
        public async Task<ActionResult<ApiResponse<object>>> PrintPacklaringMobile(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    return BadRequest(ApiResponse<object>.Error("Id wajib diisi", "400"));

                var dataDb = await _repoPacklaring.GetDetailPacklaring(id);

                if (dataDb == null)
                    return BadRequest(ApiResponse<object>.Error("Data packlaring tidak ditemukan", "404"));

                if (dataDb.Status != 1)
                    return BadRequest(ApiResponse<object>.Error("Packlaraing masih dalam proses pengajuan", "404"));
                // ===============================
                // PILIH REPORT
                // ===============================
                XtraReport report;

                if ((dataDb.Jenis ?? "").Trim().ToUpper() == "BPJS")
                    report = new RefPackalaringBpjs();
                else
                    report = new RepPacklaringKerja();

                report.DataSource = new[] { dataDb };
                report.CreateDocument();

                using MemoryStream ms = new MemoryStream();
                report.ExportToPdf(ms);

                var pdfBase64 = Convert.ToBase64String(ms.ToArray());

                return Ok(ApiResponse<object>.Success(new
                {
                    Detail = dataDb,
                    PdfBase64 = pdfBase64
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }
        #endregion
    }
}
