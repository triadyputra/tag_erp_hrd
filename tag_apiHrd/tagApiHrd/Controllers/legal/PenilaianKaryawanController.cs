using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using tagApi.Filter;
using tagApi.Model;
using tagApi.Services.Combo;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;
using tagApiHrd.Services.Legal;

namespace tagApiHrd.Controllers.legal
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PenilaianKaryawanController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;
        private readonly string _ttdPath;
        private readonly IRepoPenilaian _repo;

        public PenilaianKaryawanController(IRepoPenilaian repo, UserManager<ApplicationUser> userManager, IConfiguration configuration, IRepoCombo comboRepository)
        {
            _repo = repo;
            this.userManager = userManager;
            _comboRepository = comboRepository;
        }

        // =========================
        // LIST PENILAIAN KARYAWAN
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetListPenilaianKaryawan")]
        public async Task<ActionResult<PaginatedResponse<ViewEvaluasiKontrakDto>>> GetListPenilaianKaryawan(
        string? nik,
        string? namaKaryawan,
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

                var result = await _repo.GetListEvaluasiKontrak(
                    nik,
                    namaKaryawan,
                    finalCabang,
                    tglAwal,
                    tglAkhir,
                    page,
                    pageSize
                );

                var response = new PaginatedResponse<ViewEvaluasiKontrakDto>
                {
                    Data = result.Data ?? new List<ViewEvaluasiKontrakDto>(),
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
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        // =========================
        // DETAIL PENILAIAN KARYAWAN
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetDetailPenilaianKaryawan")]
        public async Task<ActionResult<ApiResponse<FormEvaluasiKontrakDto>>> GetDetailPenilaianKaryawan(
            string noTran)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noTran))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("No transaksi wajib diisi", "400")
                    );
                }

                var data = await _repo.GetDetailEvaluasiKontrak(noTran);

                if (data == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error("Data penilaian tidak ditemukan", "404")
                    );
                }

                return Ok(ApiResponse<FormEvaluasiKontrakDto>.Success(data));
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }


        [ApiKeyAuthorize]
        [HttpPost("SavePenilaianKaryawan")]
        public async Task<ActionResult<ApiResponse<object>>> SavePenilaianKaryawan(
        [FromBody] FormEvaluasiKontrakDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Data tidak valid", "400")
                    );
                }

                if (dto == null)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Payload tidak boleh kosong", "400")
                    );
                }

                if (string.IsNullOrWhiteSpace(dto.Nik))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("NIK wajib diisi", "400")
                    );
                }

                if (string.IsNullOrWhiteSpace(dto.NamaKaryawan))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Nama karyawan wajib diisi", "400")
                    );
                }

                if (dto.TglNilai == null)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Tanggal penilaian wajib diisi", "400")
                    );
                }

                if (dto.Details == null || !dto.Details.Any())
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Detail penilaian wajib diisi", "400")
                    );
                }

                //var user = await userManager.GetUserAsync(User);
                var username = User.FindFirst(ClaimTypes.Name)?.Value;

                dto.ValidUser = username ?? "SYSTEM";

                var result = await _repo.SaveEvaluasiKontrak(dto);

                if (result.Metadata?.Success == true)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }


        // ===============================
        // CONTROLLER
        // ===============================
        [ApiKeyAuthorize]
        [HttpDelete("DeletePenilaianKaryawan")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePenilaianKaryawan(
            string noTran)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noTran))
                {
                    return BadRequest(
                        ApiResponse<object>.Error(
                            "No transaksi wajib diisi",
                            "400"
                        )
                    );
                }

                var result = await _repo.DeleteEvaluasiKontrak(noTran);

                if (result.Metadata?.Success == true)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        // =========================
        // LIST KONTRAK MAU HABIS
        // =========================
        // [ApiKeyAuthorize]
        [HttpGet("GetListKontrakMauHabis")]
        public async Task<ActionResult<ApiResponse<List<ViewKontrakMauHabisDto>>>> GetListKontrakMauHabis(
            string? cabang,
            string bulan,
            int tahun)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(bulan))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Bulan wajib diisi (contoh: JUNI)", "400")
                    );
                }

                if (tahun < 2000 || tahun > 2100)
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Tahun tidak valid", "400")
                    );
                }

                var finalCabang = await _comboRepository.GetCabangAsync(cabang);

                if (string.IsNullOrWhiteSpace(finalCabang))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("Kode cabang wajib diisi", "400")
                    );
                }

                var data = await _repo.GetListKontrakMauHabis(
                    finalCabang,
                    bulan.Trim(),
                    tahun
                );

                return Ok(ApiResponse<List<ViewKontrakMauHabisDto>>.Success(data));
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }
    }
}
