using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace tagApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ValidasiController : ControllerBase
    {
    }
}
