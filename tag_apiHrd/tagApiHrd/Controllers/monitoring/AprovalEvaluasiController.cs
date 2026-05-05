using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using tagApi.Filter;
using tagApi.Model;
using tagApi.Services.Combo;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;
using tagApiHrd.Services.Legal;

namespace tagApiHrd.Controllers.monitoring
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AprovalEvaluasiController : ControllerBase
    {
        //private readonly UserManager<ApplicationUser> userManager;
        private readonly IRepoCombo _comboRepository;
        private readonly IRepoPenilaian _repo;

        public AprovalEvaluasiController(
            IRepoPenilaian repo,
            //UserManager<ApplicationUser> userManager,
            //IConfiguration configuration,
            IRepoCombo comboRepository)
        {
            _repo = repo;
            //this.userManager = userManager;
            _comboRepository = comboRepository;
        }

        // =========================
        // LIST APPROVAL EVALUASI
        // =========================
        [ApiKeyAuthorize]
        [HttpGet("GetListAprovalEvaluasi")]
        public async Task<ActionResult<PaginatedResponse<ViewApprovalEvaluasiDto>>> GetListAprovalEvaluasi(
            string? namaKaryawan,
            string? cabang,
            DateTime? tglAwal,
            DateTime? tglAkhir,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var finalCabang = await _comboRepository.GetCabangAsync(cabang);

                var result = await _repo.AprovalEvaluasi(
                    namaKaryawan,
                    finalCabang,
                    tglAwal,
                    tglAkhir,
                    page,
                    pageSize
                );

                var response = new PaginatedResponse<ViewApprovalEvaluasiDto>
                {
                    Data = result.Data ?? new List<ViewApprovalEvaluasiDto>(),
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
        // UPDATE APPROVAL EVALUASI
        // =========================
        [ApiKeyAuthorize]
        [HttpPost("UpdateEvaluasi")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateEvaluasi(
            [FromBody] FormApprovalEvaluasiDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(
                        ApiResponse<object>.Error(
                            "Data tidak valid",
                            "400"
                        )
                    );
                }

                if (dto == null)
                {
                    return BadRequest(
                        ApiResponse<object>.Error(
                            "Payload tidak boleh kosong",
                            "400"
                        )
                    );
                }

                if (string.IsNullOrWhiteSpace(dto.NoTran))
                {
                    return BadRequest(
                        ApiResponse<object>.Error(
                            "No transaksi wajib diisi",
                            "400"
                        )
                    );
                }

                if (string.IsNullOrWhiteSpace(dto.Keputusan))
                {
                    return BadRequest(
                        ApiResponse<object>.Error(
                            "Keputusan wajib diisi",
                            "400"
                        )
                    );
                }

                var result = await _repo.UpdateAprovalEvaluasi(dto);

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
    }
}
