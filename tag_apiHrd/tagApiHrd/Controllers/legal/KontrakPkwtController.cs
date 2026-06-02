using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using tagApi.Filter;
using tagApi.Model;
using tagApi.Report.Hrd;
using tagApi.Services.Combo;
using tagApi.Services.Hrd;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.report;
using tagApiHrd.Services.master;

namespace tagApi.Controllers.Hrd
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class KontrakPkwtController : ControllerBase
    {
        private readonly IRepoHrd _repo;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;
        private readonly IFaktaIntegritasFileService _faktaIntegritasFiles;
        private readonly string _ttdPath;
        private readonly string _wwwrootPath;

        public KontrakPkwtController(
            IRepoHrd repo,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IRepoCombo comboRepository,
            IFaktaIntegritasFileService faktaIntegritasFiles,
            IWebHostEnvironment webHostEnvironment)
        {
            _repo = repo;
            this.userManager = userManager;
            _comboRepository = comboRepository;
            _faktaIntegritasFiles = faktaIntegritasFiles;
            _ttdPath = configuration["FileStorage:TtdPath"] ?? "D:/TAG/Storage/";
            _wwwrootPath = webHostEnvironment.WebRootPath;
        }

        // =========================
        // LIST KONTRAK KARYAWAN
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetListKontrakPkwt")]
        public async Task<ActionResult<PaginatedResponse<KontrakKaryawanDto>>> GetListKontrakPkwt(
            DateTime? tglAwal,
            DateTime? tglAkhir,
            string? cabang,
            string? namaKaryawan,
            string? perusahaan,
            int? statusTtd,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                
                var finalCabang = await _comboRepository.GetCabangAsync(cabang);
                // =========================
                // VALIDASI
                // =========================
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _repo.GetListKontrakKaryawan(
                    tglAwal,
                    tglAkhir,
                    finalCabang,
                    namaKaryawan,
                    perusahaan,
                    statusTtd,
                    page,
                    pageSize
                );

                var response = new PaginatedResponse<KontrakKaryawanDto>
                {
                    Data = result.Data ?? new List<KontrakKaryawanDto>(),
                    TotalCount = result.Total,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = result.Total > 0
                        ? (int)Math.Ceiling(result.Total / (double)pageSize)
                        : 0
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetListKontrakKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(ApiResponse<object>.Error(ex.InnerException?.Message, "500"));

            }
        }

        // =========================
        // DETAIL KONTRAK
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetDetailKontrakPkwt")]
        public async Task<ActionResult<ApiResponse<KontrakKaryawanDto>>> GetDetailKontrakPkwt(string noKontrak)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noKontrak))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No kontrak wajib diisi"
                    });
                }

                var data = await _repo.GetDetailKontrak(noKontrak);

                if (data == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Data kontrak tidak ditemukan"
                    });
                }

                // 🔥 cari file berdasarkan NOKONTRAK
                var extensions = new[] { ".png", ".jpg", ".jpeg" };

                // 🔥 hanya hapus '/'
                var cleanNoKontrak = data.NOKONTRAK.Replace("/", "");

                string? foundPath = null;

                foreach (var ext in extensions)
                {
                    var fileName = $"{cleanNoKontrak}{ext}";
                    var path = Path.Combine(_ttdPath, fileName);

                    if (System.IO.File.Exists(path))
                    {
                        foundPath = path;
                        break;
                    }
                }

                if (!string.IsNullOrEmpty(foundPath))
                {
                    var bytes = await System.IO.File.ReadAllBytesAsync(foundPath);
                    data.SIGNATURE_BASE64 = $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
                }
                else
                {
                    data.SIGNATURE_BASE64 = null;
                }

                return Ok(ApiResponse<KontrakKaryawanDto>.Success(data));
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailKontrak:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(ApiResponse<object>.Error(ex.InnerException?.Message, "500"));

            }
        }


        [ApiKeyAuthorize]
        [HttpPost("SaveEditKontrakPkwt")]
        public async Task<ActionResult<ApiResponse<object>>> SaveEditKontrakPkwt(
            [FromBody] KontrakKaryawanDto model
        )
        {
            try
            {
                // =========================
                // VALIDASI DASAR
                // =========================
                if (model == null)
                {
                    return BadRequest(ApiResponse<object>.Error("Data tidak boleh kosong", "400"));
                }

                if (string.IsNullOrWhiteSpace(model.NOKTP))
                {
                    return BadRequest(ApiResponse<object>.Error("NOKTP wajib diisi", "400"));
                }

                if (string.IsNullOrWhiteSpace(model.NMKARYAWAN))
                {
                    return BadRequest(ApiResponse<object>.Error("Nama karyawan wajib diisi", "400"));
                }

                if (model.PAWAL == null || model.PAKHIR == null)
                {
                    return BadRequest(ApiResponse<object>.Error("Periode kontrak wajib diisi", "400"));
                }

                if (model.PAWAL > model.PAKHIR)
                {
                    return BadRequest(ApiResponse<object>.Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir", "400"));
                }

                var isTambahKontrak = string.IsNullOrWhiteSpace(model.NOKONTRAK);
                if (isTambahKontrak && !_faktaIntegritasFiles.Exists(model.NOKTP))
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Dokumen fakta integritas belum diupload. Upload terlebih dahulu di Master KTP sebelum membuat kontrak.",
                        "400"));
                }

                // =========================
                // USER LOGIN
                // =========================
                //var user = await userManager.GetUserAsync(User);
                var username = User.FindFirst(ClaimTypes.Name)?.Value;
                model.VALIDUSER = username ?? "SYSTEM";

                // =========================
                // HANDLE FOTO BASE64 → BYTE[]
                // =========================
                if (!string.IsNullOrWhiteSpace(model.FOTO_BASE64))
                {
                    try
                    {
                        var base64 = model.FOTO_BASE64.Contains(",")
                            ? model.FOTO_BASE64.Split(',')[1]
                            : model.FOTO_BASE64;

                        model.FOTO = Convert.FromBase64String(base64);
                    }
                    catch
                    {
                        return BadRequest(ApiResponse<object>.Error("Format foto tidak valid", "400"));
                    }
                }

                // =========================
                // SIMPAN DATA (SP)
                // =========================
                var result = await _repo.AddOrUpdateKontrakAsync(model);

                return Ok(ApiResponse<object>.Success(new
                {
                    NoKontrak = result.regCode,
                    Niksistag = result.nomorNik
                }, "Data kontrak berhasil disimpan"));

            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR SaveKontrakPkwt:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(ApiResponse<object>.Error(ex.InnerException?.Message ?? ex.Message, "500"));
            }
        }

        [ApiKeyAuthorize]
        [HttpDelete("DeleteKontrakPkwt")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteKontrakPkwt(string noKontrak, string noKtp)
        {
            try
            {
                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "SYSTEM";

                var result = await _repo.DeleteKontrakAsync(noKontrak, noKtp, username);

                if (!result)
                {
                    return BadRequest(ApiResponse<object>.Error("Gagal menghapus data kontrak", "500"));
                }
                return Ok(ApiResponse<object>.SuccessNoData("Data kontrak berhasil dihapus", "200"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message, "500"));
            }
        }

        [ApiKeyAuthorize]
        [HttpPost("ApproveKontrakPkwt")]
        public async Task<ActionResult<ApiResponse<object>>> ApproveKontrakPkwt([FromBody] string noKontrak)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noKontrak))
                {
                    return BadRequest(ApiResponse<object>.Error("No kontrak wajib diisi", "400"));
                }

                var detail = await _repo.GetDetailKontrak(noKontrak);
                if (detail == null)
                {
                    return BadRequest(ApiResponse<object>.Error("Data kontrak tidak ditemukan", "404"));
                }

                if (detail.Status == 2)
                {
                    return Ok(ApiResponse<object>.SuccessNoData("Kontrak sudah di-approve", "200"));
                }

                if (detail.Status != 1)
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Approve hanya dapat dilakukan jika status kontrak sudah TTD (1)",
                        "400"));
                }

                var affected = await _repo.UpdateStatusTtd(noKontrak, 2);
                if (affected == 0)
                {
                    return BadRequest(ApiResponse<object>.Error("Gagal approve kontrak", "500"));
                }

                return Ok(ApiResponse<object>.SuccessNoData("Kontrak berhasil di-approve", "200"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message, "500"));
            }
        }

        [ApiKeyAuthorize]
        [HttpPost("PrintKontrak")]
        public async Task<IActionResult> PrintKontrak([FromBody] string noKontrak)
        {
            try
            {
                // ===============================
                // VALIDASI
                // ===============================
                if (string.IsNullOrWhiteSpace(noKontrak))
                {
                    return Ok(new
                    {
                        response = "",
                        metadata = new { message = "No kontrak wajib diisi", code = "201" }
                    });
                }

                // ===============================
                // AMBIL DATA DARI DB
                // ===============================
                var dataDb = await _repo.GetDetailKontrak(noKontrak);

                if (dataDb == null)
                {
                    return Ok(new
                    {
                        response = "",
                        metadata = new { message = "Data kontrak tidak ditemukan", code = "201" }
                    });
                }

                // ===============================
                // MAPPING KE REPORT DTO
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
                    NmBagian = dataDb.NMBAGIAN,
                    TglMulai = dataDb.PAWAL,
                    TglSelesai = dataDb.PAKHIR,
                    JenisKelamin = dataDb.KELAMIN,
                    Agama = dataDb.AGAMA,
                    Status = dataDb.PERKAWINAN,
                    TempatLahir = dataDb.TEMPATLAHIR,
                    TanggalLahir = dataDb.TGLLAHIR,
                    Pasal1 = GetPasal1(dataDb),
                    Pasal2 = GetPasal2(dataDb),
                    Pasal3 = GetPasal3(dataDb),
                    NmPerusahaan = dataDb.NMPERUSAHAAN,
                    StatusTtd = dataDb.Status
                };

                reportData.LOGO_BASE64 = await KontrakPkwtLogoHelper.LoadLogoBase64Async(
                    _wwwrootPath, dataDb.NMPERUSAHAAN);

                if (dataDb.Status == 2)
                {
                    var ttdHrdPath = Path.Combine(_wwwrootPath, "ttd_hrd.png");
                    if (System.IO.File.Exists(ttdHrdPath))
                    {
                        var hrdBytes = await System.IO.File.ReadAllBytesAsync(ttdHrdPath);
                        reportData.HRD_SIGNATURE_BASE64 = Convert.ToBase64String(hrdBytes);
                    }
                }

                var cleanNoKontrak = dataDb.NOKONTRAK
                    .Replace("/", "")
                    .Trim();

                string? foundPath = null;

                try
                {
                    var file = Directory
                        .GetFiles(_ttdPath, $"{cleanNoKontrak}.*", SearchOption.TopDirectoryOnly)
                        .FirstOrDefault();

                    if (file != null)
                        foundPath = file;
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
                    var defaultPath = Path.Combine(_ttdPath, "default.png");
                    if (System.IO.File.Exists(defaultPath))
                    {
                        var bytes = await System.IO.File.ReadAllBytesAsync(defaultPath);
                        reportData.SIGNATURE_BASE64 = $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
                    }
                    else
                    {
                        reportData.SIGNATURE_BASE64 = null;
                        Console.WriteLine($"TTD tidak ditemukan: {cleanNoKontrak}");
                    }
                }

                var report = new RefKontrakPwkt();
                report.DataSource = new[] { reportData };
                report.CreateDocument();

                using MemoryStream ms = new MemoryStream();
                report.ExportToPdf(ms);

                var base64Output = Convert.ToBase64String(ms.ToArray());

                return Ok(new
                {
                    response = base64Output,
                    metadata = new
                    {
                        message = "Berhasil",
                        code = "200",
                        format = "PDF"
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    response = "",
                    metadata = new
                    {
                        message = ex.InnerException?.Message ?? ex.Message,
                        code = "500"
                    }
                });
            }
        }

        #region pasal
        private string GetPasal1(dynamic d)
        {
            var perusahaan = (string?)d.NMPERUSAHAAN ?? "Tunas Artha Gardatama";
            var bagian = (string?)d.NMBAGIAN ?? "-";
            var jabatan = (string?)d.NMJABATAN ?? "-";

            return $@"{{\rtf1\ansi
\fs20

\pard\li400\fi-400 1.\tab Perusahaan  PT. {perusahaan} mempekerjakan Karyawan atas nama tersebut dia atas pada bagian {bagian} dengan Jabatan/posisi sebagai {jabatan} untuk Jangka Waktu Tertentu.\par

\pard\li400\fi-400 2.\tab Karyawan menerima dan sanggup melaksanakan kewajiban-kewajiban dan tugas-tugas yang dibebankan kepadanya oleh Perusahaan, sehubungan dengan jabatannya yang disebut dalam ayat 1 pasal ini dengan sebaik-baiknya dan penuh rasa tanggung jawab.\par

\pard\li400\fi-400 3.\tab Karyawan dalam menjalankan tugas pekerjaannya bertanggung jawab langsung kepada atasan yang ditunjuk oleh Perusahaan dan atau Pimpinan Perusahaan.\par

\pard\li400\fi-400 4.\tab Karyawan bersedia dan wajib untuk mentaati perintah dan atau penugasan yang layak dari atasannya yang ditunjuk oleh Perusahaan dan atau Pimpinan Perusahaan.\par

\pard\li400\fi-400 5.\tab Karyawan bersedia dan sanggup diputuskan Hubungan Kerjanya sebelum habis masa berlakunya perjanjian kontrak ini secara sepihak tanpa adanya syarat berupa apa pun,berapa pun dan dalam bentuk apa pun apabila ternyata Karyawan telah melakukan tindakan pengingkaran, lalai dan atau melanggar ketentuan - ketentuan dalam Perjanjian atau pun Peraturan yang berlaku di Perusahaan yang dapat mengakibatkan pemutusan Hubungan Kerja.\par

}}";
        }

        private string GetPasal2(dynamic d)
        {
            return $@"{{\rtf1\ansi
\fs20

\pard\li400\fi-400 1.\tab Kontrak Kerja ini berlaku untuk jangka waktu tertentu terhitung sejak tanggal  {d.PAWAL:dd MMMM yyyy} dan akan berakhir pada tanggal {d.PAKHIR:dd MMMM yyyy}.\par

\pard\li400\fi-400 2.\tab Dengan berakhirnya jangka waktu perjanjian tersebut dalam ayat 1 pasal ini apabila salah satu pihak 
tidak menginginkan adanya perpanjangan, maka hubungan kerja antara Para Pihak menjadi putus 
tanpa syarat apapun dan berakhir dengan sendirinya oleh karena itu perjanjian ini menjadi tidak berlaku 
lagi.\par

\pard\li400\fi-400 3.\tab Apabila salah satu pihak menghendaki berakhirnya perjanjian ini sebelum waktunya yang 
disebabkan oleh hal-hal atau alasan-alasan selain yang tercantum dalam ayat (1) dan (2) dari Pasal ini, 
maka pihak yang menghendaki tersebut harus memberitahukan pihak lainnya secara tertulis dengan 
alasan yang jelas (putusnya Perjanjian Induk Pihak Pertama dengan klien) dalam waktu paling lambat 
30 (tiga puluh) hari kalender sebelum tanggal pengakhiran perjanjian ini yang dikendaki oleh pihak 
tersebut, dengan kewajiban pembayaran sampai dengan hari kerja terakhir (proporsional) dalam bulan 
berjalan.\par

}}";
        }

        private string GetPasal3(dynamic d)
        {
            return $@"{{\rtf1\ansi
\fs20

\pard\li400\fi-400 1.\tab Perusahaan menempatkan Karyawan sebagai Karyawan Kontrak untuk jangka Waktu Tertentu (KKWT) 
yang status tempat penerimaannya di Jakarta atau Tempat lain yang ditentukan oleh Perusahaan.\par

\pard\li400\fi-400 2.\tab Karyawan bersedia ditempatkan/dimutasikan/ditugaskan dibagian/divisi lain dan atau ditempatkan di 
mana saja dikemudian hari sesuai dengan kepentingan Perusahaan..\par


}}";
        }
        #endregion

    }
}
