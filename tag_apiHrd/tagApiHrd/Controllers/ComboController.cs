using DocumentFormat.OpenXml.Office2010.Excel;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Claims;
using System.Reflection;
using tagApi.Data;
using tagApi.Filter;
using tagApi.Helper;
using tagApi.Services.Combo;
using tagApi.Services.Hrd;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;


namespace tagApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ComboController : ControllerBase
    {
        private readonly IRepoCombo _comboRepository;
        private readonly IRepoHrd _hrdRepo;

        public ComboController(IRepoCombo comboRepository, IRepoHrd hrdRepo)
        {
            _comboRepository = comboRepository;
            _hrdRepo = hrdRepo;
        }

        [HttpGet]
        [Route("ComboCabang")]
        public async Task<IActionResult> ComboCabang()
        {
            var cabang = await _comboRepository.ComboCabang();

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboCabangWithPusat")]
        public async Task<IActionResult> ComboCabangWithPusat()
        {
            var cabang = await _comboRepository.ComboCabangWithPusat();

            return Ok(cabang);
        }


        [HttpGet]
        [Route("ComboVendor")]
        public async Task<IActionResult> ComboVendor()
        {
            var cabang = await _comboRepository.ComboVendor();

            return Ok(cabang);
        }


        #region HRD
        [HttpGet("GetFilterMasterKtp")]
        public async Task<ActionResult<ApiResponse<object>>> GetFilterMasterKtp(
            [FromQuery] string? nama,
            [FromQuery] string? cabang
        )
        {
            try
            {
                var finalCabang = await _comboRepository.GetCabangAsync(cabang);

                var data = await _comboRepository.ListMasterPegawai(nama, finalCabang);

                return Ok(ApiResponse<List<ViewLookupMasterKtp>>.Success(data));

            }
            catch (Exception ex)
            {

                return Ok(ApiResponse<object>.Error(ex.InnerException?.Message ?? "", "500"));
            }
        }

        [HttpGet("GetDetailMasterKtp")]
        public async Task<ActionResult<ApiResponse<KontrakKaryawanDto>>> GetDetailMasterKtp(string noktp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(noktp))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No ktp wajib diisi"
                    });
                }

                var data = await _hrdRepo.GetDetailKontrakByKtp(noktp);

                if (data == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Data master karyawan tidak ditemukan"
                    });
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



        [HttpGet("GetFilterKaryawan")]
        public async Task<ActionResult<ApiResponse<object>>> GetFilterKaryawan(
            [FromQuery] string? nama,
            [FromQuery] string? cabang
        )
        {
            try
            {
                var finalCabang = await _comboRepository.GetCabangAsync(cabang);

                var data = await _hrdRepo.GetFilterKaryawan(nama, finalCabang);

                return Ok(ApiResponse<List<ViewFIlterKaryawan>>.Success(data));

            }
            catch (Exception ex)
            {

                return Ok(ApiResponse<object>.Error(ex.InnerException?.Message ?? "", "500"));
            }
        }

        [HttpGet("GetDetailKaryawan")]
        public async Task<ActionResult<ApiResponse<KaryawanDetailResult>>> GetDetailKaryawan(string noktp)
        {
            
            try
            {
                var data = await _hrdRepo.GetDetailKaryawan(noktp);

                return Ok(ApiResponse<KaryawanDetailResult>.Success(data));

            }
            catch (Exception ex)
            {

                return Ok(ApiResponse<object>.Error(ex.InnerException?.Message ?? "", "500"));
            }
        }

        [HttpGet("GetDetailPegawaiWithKontrakNik")]
        public async Task<ActionResult<ApiResponse<ViewMasterPegawaiDto>>> GetDetailPegawaiWithKontrakNik(
        string cniksistag)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(cniksistag))
                {
                    return BadRequest(
                        ApiResponse<object>.Error("NIK wajib diisi", "400")
                    );
                }

                var data = await _comboRepository.GetDetailMasterPegawai(cniksistag);

                if (data == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error("Data pegawai tidak ditemukan", "404")
                    );
                }

                return Ok(
                    ApiResponse<ViewMasterPegawaiDto>.Success(data)
                );
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


        [HttpGet]
        [Route("ComboDivisi")]
        public async Task<IActionResult> ComboDivisi()
        {
            var cabang = await _comboRepository.ComboDivisi();

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboBagian")]
        public async Task<IActionResult> ComboBagian(string divisi)
        {
            var cabang = await _comboRepository.ComboBagian(divisi);

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboSubBagian")]
        public async Task<IActionResult> ComboSubBagian(string bagian)
        {
            var cabang = await _comboRepository.ComboSubBagian(bagian);

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboJabatan")]
        public async Task<IActionResult> ComboJabatan()
        {
            var cabang = await _comboRepository.ComboJabatan();

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboKategoriGaji")]
        public async Task<IActionResult> ComboKategoriGaji()
        {
            var cabang = await _comboRepository.ComboKategoriGaji();

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboJenisGaji")]
        public async Task<IActionResult> ComboJenisGaji()
        {
            var cabang = await _comboRepository.ComboJenisGaji();

            return Ok(cabang);
        }

        [HttpGet]
        [Route("ComboPeriodeBulan")]
        public IActionResult ComboPeriodeBulan()
        {
            var data = new List<object>
            {
                new { value = "1 BULAN", title = "1 BULAN" },
                new { value = "3 BULAN", title = "3 BULAN" },
                new { value = "6 BULAN", title = "6 BULAN" },
                new { value = "9 BULAN", title = "9 BULAN" },
                new { value = "12 BULAN", title = "12 BULAN" }
            };

            return Ok(data);
        }

        [HttpGet]
        [Route("ComboStatusPajak")]
        public IActionResult ComboStatusPajak()
        {
            var data = new List<object>
                {
                    new { value = "TK0", title = "TK0" },
                    new { value = "TK1", title = "TK1" },
                    new { value = "TK2", title = "TK2" },
                    new { value = "TK3", title = "TK3" },
                    new { value = "K0", title = "K0" },
                    new { value = "K1", title = "K1" },
                    new { value = "K2", title = "K2" },
                    new { value = "K3", title = "K3" },
                    new { value = "K/I/0", title = "K/I/0" },
                    new { value = "K/I/1", title = "K/I/1" },
                    new { value = "K/I/2", title = "K/I/2" },
                    new { value = "K/I/3", title = "K/I/3" }
                };

            return Ok(data);
        }

        [HttpGet]
        [Route("ComboJenisKontrak")]
        public IActionResult ComboJenisKontrak()
        {
            var data = new List<object>
            {
                new { value = "PEGAWAI", title = "PEGAWAI" },
                new { value = "MITRA", title = "MITRA" }
            };

            return Ok(data);
        }


        [HttpGet("GetAspekPenilaian")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ViewAspekPenilaianDto>>>> GetAspekPenilaian()
        {
            try
            {
                var data = await _comboRepository.ListAspekPenilaian();

                return Ok(
                    ApiResponse<IEnumerable<ViewAspekPenilaianDto>>.Success(data)
                );
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


        #endregion
    }
}
