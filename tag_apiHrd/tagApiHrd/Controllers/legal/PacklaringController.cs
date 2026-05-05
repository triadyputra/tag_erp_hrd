using DevExpress.XtraReports.UI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
using tagApiHrd.Model.Dto.legal;
using tagApiHrd.Model.Dto.report;
using tagApiHrd.Report.Hrd;
using tagApiHrd.Services.Legal;

namespace tagApiHrd.Controllers.legal
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PacklaringController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;
        private readonly string _ttdPath;
        private readonly IRepoPacklaring _repo;

        public PacklaringController(IRepoPacklaring repo, UserManager<ApplicationUser> userManager, IConfiguration configuration, IRepoCombo comboRepository)
        {
            _repo = repo;
            this.userManager = userManager;
            _comboRepository = comboRepository;
        }

        // =========================
        // LIST KONTRAK KARYAWAN
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetListPacklaring")]
        public async Task<ActionResult<PaginatedResponse<ViewPacklaringDto>>> GetListPacklaring(
        string? nomor,
        string? nama,
        string? jenis,
        string? cabang,
        DateTime? tglAwal,
        DateTime? tglAkhir,
        int page = 1,
        int pageSize = 10)
            {
                try
                {
                    // validasi paging
                    if (page < 1) page = 1;
                    if (pageSize < 1 || pageSize > 100) pageSize = 10;

                    // mapping cabang
                    var finalCabang = await _comboRepository.GetCabangAsync(cabang);

                    var result = await _repo.GetPacklaringList(
                        nomor,
                        nama,
                        jenis,
                        finalCabang,
                        tglAwal,
                        tglAkhir,
                        page,
                        pageSize
                    );

                    var response = new PaginatedResponse<ViewPacklaringDto>
                    {
                        Data = result.Data ?? new List<ViewPacklaringDto>(),
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
                    Console.WriteLine("ERROR GetListPacklaring:");
                    Console.WriteLine(ex.Message);
                    Console.WriteLine(ex.InnerException?.Message);

                    return BadRequest(
                        ApiResponse<object>.Error(
                            ex.InnerException?.Message ?? ex.Message,
                            "500"
                        )
                    );
                }
            }

        [ApiKeyAuthorize]
        [HttpGet("GetDetailPacklaring")]
        public async Task<ActionResult<ApiResponse<PacklaringDto>>> GetDetailPacklaring(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Id wajib diisi", "400")
                    );
                }

                var data = await _repo.GetDetailPacklaring(id);

                if (data == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error("Data packlaring tidak ditemukan", "404")
                    );
                }

                return Ok(ApiResponse<PacklaringDto>.Success(data));
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR GetDetailPacklaring:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        [ApiKeyAuthorize]
        [HttpPost("SavePacklaring")]
        public async Task<ActionResult<ApiResponse<object>>> SavePacklaring(
            [FromBody] PacklaringDto model
        )
        {
            try
            {
                // =========================
                // VALIDASI DASAR
                // =========================
                if (model == null)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Data tidak boleh kosong", "400")
                    );
                }

                if (string.IsNullOrWhiteSpace(model.NamaKaryawan))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Nama karyawan wajib diisi", "400")
                    );
                }

                if (string.IsNullOrWhiteSpace(model.NoKtp))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("No KTP wajib diisi", "400")
                    );
                }

                if (string.IsNullOrWhiteSpace(model.Nik))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("NIK wajib diisi", "400")
                    );
                }

                if (model.Masuk == null || model.Keluar == null)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Tanggal masuk dan keluar wajib diisi", "400")
                    );
                }

                if (model.Masuk > model.Keluar)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Tanggal masuk tidak boleh lebih besar dari tanggal keluar", "400")
                    );
                }

                // =========================
                // USER LOGIN
                // =========================
                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "SYSTEM";

                // =========================
                // SIMPAN DATA
                // =========================
                var result = await _repo.SavePacklaring(model, username);

                return Ok(
                    ApiResponse<object>.Success(
                        new
                        {
                            Id = result
                        },
                        "Data packlaring berhasil disimpan"
                    )
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR SavePacklaring:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        [ApiKeyAuthorize]
        [HttpDelete("DeletePacklaring")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePacklaring(string id)
        {
            try
            {
                // =========================
                // VALIDASI
                // =========================
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Id wajib diisi", "400")
                    );
                }

                // cek data dulu
                var data = await _repo.GetDetailPacklaring(id);

                if (data == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error("Data packlaring tidak ditemukan", "404")
                    );
                }

                // hapus
                var result = await _repo.DeletePacklaring(id);

                if (!result)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Gagal menghapus data packlaring", "500")
                    );
                }

                return Ok(
                    ApiResponse<object>.Success(
                        null,
                        "Data packlaring berhasil dihapus"
                    )
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR DeletePacklaring:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        [ApiKeyAuthorize]
        [HttpPost("PrintPacklaring")]
        public async Task<IActionResult> PrintPacklaring([FromBody] string id)
        {
            try
            {
                // ===============================
                // VALIDASI
                // ===============================
                if (string.IsNullOrWhiteSpace(id))
                {
                    return Ok(new
                    {
                        response = "",
                        metadata = new
                        {
                            message = "Id wajib diisi",
                            code = "201"
                        }
                    });
                }

                // ===============================
                // AMBIL DATA DB
                // ===============================
                var dataDb = await _repo.GetDetailPacklaring(id);

                if (dataDb == null)
                {
                    return Ok(new
                    {
                        response = "",
                        metadata = new
                        {
                            message = "Data packlaring tidak ditemukan",
                            code = "201"
                        }
                    });
                }

                // ===============================
                // PILIH REPORT BERDASARKAN JENIS
                // Jika Jenis = BPJS pakai RefPacklaringBpjs
                // selain itu pakai RepPacklaringKerja
                // ===============================
                XtraReport report;

                if ((dataDb.Jenis ?? "").Trim().ToUpper() == "BPJS")
                {
                    report = new RefPackalaringBpjs();
                }
                else
                {
                    report = new RepPacklaringKerja();
                }

                // ===============================
                // DATASOURCE
                // ===============================
                report.DataSource = new List<PacklaringDto> { dataDb };

                report.CreateDocument();

                // ===============================
                // EXPORT PDF
                // ===============================
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

    }
}
