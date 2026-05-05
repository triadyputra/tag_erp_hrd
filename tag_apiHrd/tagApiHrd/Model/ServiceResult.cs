namespace tagApi.Model
{
    public class ServiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;

        public static ServiceResult Ok() =>
            new ServiceResult { Success = true };

        public static ServiceResult Fail(string message) =>
            new ServiceResult { Success = false, Message = message };
    }
}
