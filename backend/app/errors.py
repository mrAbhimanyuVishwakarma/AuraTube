class DownloaderError(Exception):
    """Base class for downloader errors."""
    def __init__(self, code: str, message: str, retryable: bool = False):
        self.code = code
        self.message = message
        self.retryable = retryable
        super().__init__(self.message)

class InvalidURLError(DownloaderError):
    def __init__(self, message: str = "The provided URL is invalid or unsupported."):
        super().__init__("INVALID_URL", message, retryable=False)

class VideoUnavailableError(DownloaderError):
    def __init__(self, message: str = "The video is unavailable, private, or geo-restricted."):
        super().__init__("VIDEO_UNAVAILABLE", message, retryable=False)

class AuthenticationRequiredError(DownloaderError):
    def __init__(self, message: str = "Sign in or authentication required to access this content."):
        super().__init__("AUTHENTICATION_REQUIRED", message, retryable=False)

class FormatNotAvailableError(DownloaderError):
    def __init__(self, message: str = "The requested quality or format is not available for this video."):
        super().__init__("FORMAT_NOT_AVAILABLE", message, retryable=False)

class RateLimitedError(DownloaderError):
    def __init__(self, message: str = "Rate limited or CAPTCHA required by the platform."):
        super().__init__("RATE_LIMITED", message, retryable=True)

class FFmpegUnavailableError(DownloaderError):
    def __init__(self, message: str = "FFmpeg is required but not installed or unavailable."):
        super().__init__("FFMPEG_UNAVAILABLE", message, retryable=False)

class NetworkTimeoutError(DownloaderError):
    def __init__(self, message: str = "Network timeout occurred while fetching data."):
        super().__init__("NETWORK_TIMEOUT", message, retryable=True)

class UnknownExtractorError(DownloaderError):
    def __init__(self, message: str = "An unknown error occurred during extraction."):
        super().__init__("UNKNOWN_EXTRACTOR_ERROR", message, retryable=False)
