using Microsoft.AspNetCore.Identity;
using System.Net.Http;
using System.Security.Claims;
using tagApi.Model;

namespace tagApi.Filter
{
    public class SessionValidationMiddleware
    {

        private readonly RequestDelegate _next;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        public SessionValidationMiddleware(RequestDelegate next, HttpClient httpClient, IConfiguration config)
        {
            _next = next;
            _httpClient = httpClient;
            _config = config;
        }


        public async Task Invoke(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var token = context.Request.Headers["Authorization"]
                    .FirstOrDefault()?.Replace("Bearer ", "");

                if (string.IsNullOrEmpty(token))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Unauthorized");
                    return;
                }

                // 🔥 call API AUTH
                var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    _config["ApiLogin:ValidateSesion"]
                );

                request.Headers.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Session expired");
                    return;
                }
            }

            await _next(context);
        }
        //public async Task Invoke(HttpContext context, UserManager<ApplicationUser> userManager)
        //{
        //    if (context.User.Identity?.IsAuthenticated == true)
        //    {
        //        var username = context.User.FindFirst(ClaimTypes.Name)?.Value;
        //        var tokenVersion = context.User.FindFirst("SessionVersion")?.Value;

        //        if (username != null && tokenVersion != null)
        //        {
        //            var user = await userManager.FindByNameAsync(username);

        //            if (user == null || user.SessionVersion.ToString() != tokenVersion)
        //            {
        //                context.Response.StatusCode = 401;
        //                await context.Response.WriteAsync("Session expired");
        //                return;
        //            }
        //        }
        //    }

        //    await _next(context);
        //}
    }
}
