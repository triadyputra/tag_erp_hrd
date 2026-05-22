using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using tagApi.Filter;
using tagApi.Model;
using tagApi.Services.Combo;
using tagApi.Services.Hrd;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.cuti;

namespace tagApiHrd.Controllers.absensi
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CutiKaryawanController : ControllerBase
    {
        private readonly IRepoHrd _repo;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;

        private const string MsgCutiSudahLewat =
            "Tidak dapat dilakukan karena tanggal cuti yang diajukan sudah lewat.";

        private const string MsgBackdateCuti =
            "Tanggal cuti tidak boleh backdate (pilih hari ini atau tanggal mendatang).";

        public CutiKaryawanController(IRepoHrd repo, UserManager<ApplicationUser> userManager, IRepoCombo comboRepository)
        {
            _repo = repo;
            this.userManager = userManager;
            _comboRepository = comboRepository;
        }

        /// <summary>
        /// Cuti dianggap sudah lewat jika seluruh tanggal cuti (hari terakhir) sebelum hari ini.
        /// </summary>
        private static bool IsTanggalCutiSudahLewat(IEnumerable<DateTime>? tanggalCuti)
        {
            if (tanggalCuti == null || !tanggalCuti.Any())
                return false;

            return tanggalCuti.Max(t => t.Date) < DateTime.Today;
        }

        private static bool HasBackdateTanggalCuti(IEnumerable<DateTime>? tanggalCuti)
        {
            if (tanggalCuti == null || !tanggalCuti.Any())
                return false;

            return tanggalCuti.Any(t => t.Date < DateTime.Today);
        }

        private static bool HasNewBackdateTanggalCuti(
            IEnumerable<DateTime> submitted,
            IEnumerable<DateTime>? existing)
        {
            var existingDates = existing?
                .Select(d => d.Date)
                .ToHashSet() ?? new HashSet<DateTime>();

            return submitted.Any(d =>
                d.Date < DateTime.Today && !existingDates.Contains(d.Date));
        }

        [ApiKeyAuthorize]
        [HttpGet("GetListCutiKaryawan")]
        public async Task<ActionResult<PaginatedResponse<ViewCutiKaryawanDto>>> GetListCutiKaryawan(
            DateTime? tglAwal,
            DateTime? tglAkhir,
            string? cabang,
            string? namaKaryawan,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                var finalCabang = await _comboRepository.GetCabangAsync(cabang) ?? string.Empty;

                // =========================
                // VALIDASI
                // =========================
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _repo.GetListCutiAsync(
                    tglAwal,
                    tglAkhir,
                    namaKaryawan,
                    finalCabang,
                    page,
                    pageSize
                );

                var response = new PaginatedResponse<ViewCutiKaryawanDto>
                {
                    Data = result.Data ?? new List<ViewCutiKaryawanDto>(),
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

        [ApiKeyAuthorize]
        [HttpGet("GetDetailCuti/{noCuti}")]
        public async Task<ActionResult<ApiResponse<object>>> GetDetailCuti(string noCuti)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noCuti))
                {
                    return BadRequest(ApiResponse<object>.Error("NoCuti wajib diisi", "400"));
                }

                var result = await _repo.GetDetailCutiFormAsync(noCuti);

                if (result == null)
                {
                    return NotFound(ApiResponse<object>.Error("Data tidak ditemukan", "404"));
                }

                return Ok(ApiResponse<object>.Success(result, "Detail cuti berhasil diambil"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }

        [ApiKeyAuthorize]
        [HttpPost("SaveEditCutiKaryawan")]
        public async Task<ActionResult<ApiResponse<object>>> SaveEditCutiKaryawan(
            [FromBody] FormCutiKaryawan model
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

                if (string.IsNullOrWhiteSpace(model.NikKaryawan))
                {
                    return BadRequest(ApiResponse<object>.Error("NIK karyawan wajib diisi", "400"));
                }

                if (string.IsNullOrWhiteSpace(model.NmKaryawan))
                {
                    return BadRequest(ApiResponse<object>.Error("Nama karyawan wajib diisi", "400"));
                }

                if (model.DetailTanggal == null || !model.DetailTanggal.Any())
                {
                    return BadRequest(ApiResponse<object>.Error("Tanggal cuti wajib diisi", "400"));
                }

                if (model.Tanggal == default)
                {
                    return BadRequest(ApiResponse<object>.Error("Tanggal pengajuan wajib diisi", "400"));
                }

                if (string.IsNullOrWhiteSpace(model.NoCuti))
                {
                    if (HasBackdateTanggalCuti(model.DetailTanggal))
                    {
                        return BadRequest(ApiResponse<object>.Error(MsgBackdateCuti, "400"));
                    }
                }
                else
                {
                    var existing = await _repo.GetDetailCutiFormAsync(model.NoCuti);
                    if (existing == null)
                    {
                        return NotFound(ApiResponse<object>.Error("Data cuti tidak ditemukan", "404"));
                    }

                    if (IsTanggalCutiSudahLewat(existing.DetailTanggal))
                    {
                        return BadRequest(ApiResponse<object>.Error(
                            $"Tidak dapat mengubah data cuti. {MsgCutiSudahLewat}",
                            "400"));
                    }

                    if (HasNewBackdateTanggalCuti(model.DetailTanggal, existing.DetailTanggal))
                    {
                        return BadRequest(ApiResponse<object>.Error(MsgBackdateCuti, "400"));
                    }
                }

                // =========================
                // USER LOGIN
                // =========================
                var username = User.FindFirst(ClaimTypes.Name)?.Value;
                model.ValidUser = username ?? "SYSTEM";

                // =========================
                // HITUNG JUMLAH HARI OTOMATIS
                // =========================
                model.JmlHari = model.DetailTanggal.Count;
                model.Status = 2;
                // =========================
                // CALL SERVICE
                // =========================
                var result = await _repo.SaveCutiAsync(model);

                // =========================
                // HANDLE RESULT DARI SP
                // =========================
                if (result.Code != "200")
                {
                    return BadRequest(ApiResponse<object>.Error(result.Message, result.Code));
                }

                // =========================
                // SUCCESS
                // =========================
                return Ok(ApiResponse<object>.Success(new
                {
                    NoCuti = result.NoCuti
                }, "Data cuti berhasil disimpan"));
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR SaveCutiKaryawan:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.InnerException?.Message);

                return BadRequest(ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                ));
            }
        }


        [ApiKeyAuthorize]
        [HttpDelete("DeleteCuti/{noCuti}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteCuti(string noCuti)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noCuti))
                {
                    return BadRequest(ApiResponse<object>.Error("NoCuti wajib diisi", "400"));
                }

                var existing = await _repo.GetDetailCutiFormAsync(noCuti);
                if (existing == null)
                {
                    return NotFound(ApiResponse<object>.Error("Data cuti tidak ditemukan", "404"));
                }

                if (IsTanggalCutiSudahLewat(existing.DetailTanggal))
                {
                    return BadRequest(ApiResponse<object>.Error(
                        $"Tidak dapat menghapus data cuti. {MsgCutiSudahLewat}",
                        "400"));
                }

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
    }
}
