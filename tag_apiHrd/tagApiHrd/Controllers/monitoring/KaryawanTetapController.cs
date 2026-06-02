using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using tagApi.Filter;
using tagApi.Services.Combo;
using tagApi.Services.Hrd;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;

namespace tagApiHrd.Controllers.monitoring
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class KaryawanTetapController : ControllerBase
    {
        private readonly IRepoHrd _repo;
        private readonly IRepoCombo _comboRepository;

        public KaryawanTetapController(
            IRepoHrd repo,
            IRepoCombo comboRepository)
        {
            _repo = repo;
            _comboRepository = comboRepository;
        }

        [ApiKeyAuthorize]
        [HttpGet("ListKaryawanTetap")]
        public async Task<IActionResult> ListKaryawanTetap(
            [FromQuery] string? noKtp,
            [FromQuery] string? namaLengkap,
            [FromQuery] string? cabang,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var finalCabang =
                    await _comboRepository.GetCabangAsync(cabang);

                var result = await _repo.ListKaryawanTetap(
                    noKtp,
                    namaLengkap,
                    finalCabang,
                    page,
                    pageSize);

                return Ok(
                    ApiResponse<object>.Success(
                        result,
                        "Berhasil mengambil data"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "500")
                );
            }
        }

        [ApiKeyAuthorize]
        [HttpGet("GetDetailKaryawanTetap/{noktp}")]
        public async Task<IActionResult> GetDetailKaryawanTetap(string noktp)
        {
            try
            {
                var result = await _repo.GetDetailKaryawanTetap(noktp);

                if (result == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error(
                            "Data tidak ditemukan",
                            "404"
                        )
                    );
                }

                return Ok(
                    ApiResponse<object>.Success(
                        result,
                        "Berhasil mengambil detail data"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "500")
                );
            }
        }
    }
}
