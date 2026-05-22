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
        private readonly IFaktaIntegritasFileService _faktaIntegritasFiles;

        public MasterKtpController(
            IRepoMasterKtp repo,
            IFaktaIntegritasFileService faktaIntegritasFiles)
        {
            _repo = repo;
            _faktaIntegritasFiles = faktaIntegritasFiles;
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
        // FAKTA INTEGRITAS (FILE)
        // ===============================
        [HttpGet("{noktp}/fakta-integritas/exists")]
        public IActionResult CheckFaktaIntegritasExists(string noktp)
        {
            try
            {
                var exists = _faktaIntegritasFiles.Exists(noktp);

                return Ok(
                    ApiResponse<object>.Success(
                        new { Exists = exists },
                        exists
                            ? "Dokumen tersedia"
                            : "Dokumen belum tersedia"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "400")
                );
            }
        }

        [HttpGet("{noktp}/fakta-integritas")]
        public async Task<IActionResult> GetFaktaIntegritas(string noktp)
        {
            try
            {
                var exists = _faktaIntegritasFiles.Exists(noktp);
                string? base64 = null;

                if (exists)
                    base64 = await _faktaIntegritasFiles.ReadBase64Async(noktp);

                return Ok(
                    ApiResponse<object>.Success(
                        new
                        {
                            Exists = exists,
                            Base64 = base64,
                            FileName = _faktaIntegritasFiles.GetFileName(noktp),
                        },
                        exists
                            ? "Berhasil mengambil dokumen"
                            : "Dokumen belum tersedia"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "400")
                );
            }
        }

        [HttpPost("{noktp}/fakta-integritas")]
        [RequestSizeLimit(2 * 1024 * 1024)]
        public async Task<IActionResult> UploadFaktaIntegritas(
            string noktp,
            IFormFile file)
        {
            try
            {
                await _faktaIntegritasFiles.SaveAsync(noktp, file);

                return Ok(
                    ApiResponse<object>.Success(
                        new
                        {
                            Noktp = noktp,
                            FileName = _faktaIntegritasFiles.GetFileName(noktp),
                        },
                        "Dokumen fakta integritas berhasil diupload"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "400")
                );
            }
        }

        [HttpDelete("{noktp}/fakta-integritas")]
        public IActionResult DeleteFaktaIntegritas(string noktp)
        {
            try
            {
                var deleted = _faktaIntegritasFiles.Delete(noktp);

                if (!deleted)
                {
                    return NotFound(
                        ApiResponse<object>.Error(
                            "Dokumen tidak ditemukan",
                            "404"
                        )
                    );
                }

                return Ok(
                    ApiResponse<object>.Success(
                        new { Noktp = noktp },
                        "Dokumen fakta integritas berhasil dihapus"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(ex.Message, "400")
                );
            }
        }

        // ===============================
        // DELETE
        // ===============================
        [HttpDelete("{noktp}")]
        public async Task<IActionResult> DeleteDataKtp(
         string noktp,
         [FromQuery] string kdcabang)
        {
            try
            {
                var result =
                    await _repo.DeleteDataKtp(
                        noktp,
                        kdcabang);

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
