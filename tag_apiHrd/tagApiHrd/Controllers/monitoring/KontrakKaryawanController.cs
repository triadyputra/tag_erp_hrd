using DevExpress.XtraPrinting.Native;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using tagApi.Filter;
using tagApi.Model;
using tagApi.Services.Combo;
using tagApi.Services.Hrd;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Report.Hrd;

namespace tagApiHrd.Controllers.monitoring
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class KontrakKaryawanController : ControllerBase
    {
        private readonly IRepoHrd _repo;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;

        public KontrakKaryawanController(IRepoHrd repo, UserManager<ApplicationUser> userManager, IRepoCombo comboRepository)
        {
            _repo = repo;
            this.userManager = userManager;
            _comboRepository = comboRepository;
        }

        private static bool IsTglBerakhirRangeInvalid(
            DateTime? tglBerakhirAwal,
            DateTime? tglBerakhirAkhir)
        {
            return tglBerakhirAwal.HasValue
                && tglBerakhirAkhir.HasValue
                && tglBerakhirAwal.Value.Date > tglBerakhirAkhir.Value.Date;
        }

        [ApiKeyAuthorize]
        [HttpGet("GetListKontrakKaryawan")]
        public async Task<ActionResult<PaginatedResponse<ViewKontrakAktif>>> GetListKontrakKaryawan(
            string? noKontrak,
            string? namaKaryawan,
            string? jenisKontrak,
            string? cabang,
            string? sisaKontrak,
            DateTime? tglBerakhirAwal,
            DateTime? tglBerakhirAkhir,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                if (IsTglBerakhirRangeInvalid(tglBerakhirAwal, tglBerakhirAkhir))
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Tanggal berakhir awal tidak boleh lebih besar dari tanggal berakhir akhir",
                        "400"));
                }

                var finalCabang = await _comboRepository.GetCabangAsync(cabang);
                // =========================
                // VALIDASI
                // =========================
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _repo.GetKontrakAktif(
                    noKontrak,
                    namaKaryawan,
                    jenisKontrak,
                    finalCabang,
                    sisaKontrak,
                    tglBerakhirAwal,
                    tglBerakhirAkhir,
                    page,
                    pageSize
                );

                var response = new PaginatedResponse<ViewKontrakAktif>
                {
                    Data = result.Data ?? new List<ViewKontrakAktif>(),
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
                // 🔥 logging (optional tapi penting)
                Console.WriteLine("ERROR GetListKontrakKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(ApiResponse<object>.Error(ex.Message, "500"));
            }
        }

        [HttpGet("PrintDataKaryawan")]
        public async Task<IActionResult> PrintDataKaryawan(
            [FromQuery] string? noKontrak,
            [FromQuery] string? namaKaryawan,
            [FromQuery] string? jenisKontrak,
            [FromQuery] string? cabang,
            [FromQuery] string? sisaKontrak,
            [FromQuery] DateTime? tglBerakhirAwal,
            [FromQuery] DateTime? tglBerakhirAkhir,
            [FromQuery] string? format = "pdf"
        )
        {
            try
            {
                if (IsTglBerakhirRangeInvalid(tglBerakhirAwal, tglBerakhirAkhir))
                {
                    return BadRequest(ApiResponse<object>.Error(
                        "Tanggal berakhir awal tidak boleh lebih besar dari tanggal berakhir akhir",
                        "400"));
                }

                var data = await _repo.PrintDataKaryawan(
                    noKontrak,
                    namaKaryawan,
                    jenisKontrak,
                    cabang,
                    sisaKontrak,
                    tglBerakhirAwal,
                    tglBerakhirAkhir
                );

                if (data == null || !data.Any())
                {
                    return Ok(new
                    {
                        response = "",
                        metadata = new
                        {
                            message = "Data tidak ditemukan",
                            code = "201"
                        }
                    });
                }

                // ===============================
                // SET REPORT
                // ===============================
                var report = new RefDataKaryawan();
                report.DataSource = data;

                using var ms = new MemoryStream();

                // ===============================
                // EXPORT FORMAT
                // ===============================
                format = format?.ToLower();

                if (format == "excel" || format == "xlsx")
                {
                    report.ExportToXlsx(ms);
                    format = "xlsx";
                }
                else
                {
                    report.ExportToPdf(ms);
                    format = "pdf";
                }

                var base64 = Convert.ToBase64String(ms.ToArray());

                return Ok(new
                {
                    response = base64,
                    metadata = new
                    {
                        message = "Berhasil",
                        code = "200",
                        format = format.ToUpper()
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
                        code = "201"
                    }
                });
            }
        }



    }
}
