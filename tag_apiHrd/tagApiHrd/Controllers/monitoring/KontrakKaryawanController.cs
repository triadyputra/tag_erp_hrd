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

        [ApiKeyAuthorize]
        [HttpGet("GetListKontrakKaryawan")]
        public async Task<ActionResult<PaginatedResponse<ViewKontrakAktif>>> GetListKontrakKaryawan(
            string? noKontrak,
            string? namaKaryawan,
            string? jenisKontrak,
            string? cabang,
            string? sisaKontrak,
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

                var result = await _repo.GetKontrakAktif(
                    noKontrak,
                    namaKaryawan,
                    jenisKontrak,
                    finalCabang,
                    sisaKontrak,
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
    }
}
