using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.master;
using tagApiHrd.Services.master;

namespace tagApiHrd.Controllers.Master
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MasterKtpController : ControllerBase
    {
        private readonly IRepoMasterKtp _repo;

        public MasterKtpController(
            IRepoMasterKtp repo)
        {
            _repo = repo;
        }

        // ===============================
        // GET LIST
        // ===============================
        [HttpGet]
        public async Task<IActionResult> GetListDataKtp(
            [FromQuery] string? noktp,
            [FromQuery] string? namaLengkap,
            [FromQuery] string? kdCabang,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result =
                    await _repo.GetListDataKtp(
                        noktp,
                        namaLengkap,
                        kdCabang,
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
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }

        // ===============================
        // GET DETAIL
        // ===============================
        [HttpGet("{noktp}")]
        public async Task<IActionResult> GetDetailDataKtp(
            string noktp)
        {
            try
            {
                var result =
                    await _repo.GetDetailDataKtp(
                        noktp);

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
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }

        // ===============================
        // SAVE
        // ===============================
        [HttpPost]
        public async Task<IActionResult> SaveDataKtp(
            [FromBody] FormDataKtpDto dto)
        {
            try
            {

                var username = User.FindFirst(ClaimTypes.Name)?.Value;

                var result =
                    await _repo.SaveDataKtp(
                        dto,
                        username);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }

        // ===============================
        // DELETE
        // ===============================
        [HttpDelete("{noktp}")]
        public async Task<IActionResult> DeleteDataKtp(
            string noktp)
        {
            try
            {
                var result =
                    await _repo.DeleteDataKtp(
                        noktp);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }
    }
}
