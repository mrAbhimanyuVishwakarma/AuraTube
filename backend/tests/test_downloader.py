import os
import pytest
from unittest.mock import patch, MagicMock
from app.config import validate_cookies_content, get_cookie_status
from app.downloader import build_ydl_options, map_yt_dlp_exception
from app.errors import (
    AuthenticationRequiredError,
    VideoUnavailableError,
    FormatNotAvailableError
)

def test_cookie_validation_valid():
    valid_content = (
        "# Netscape HTTP Cookie File\n"
        ".youtube.com\tTRUE\t/\tTRUE\t1735689600\tLOGIN_INFO\tXYZ123\n"
    )
    assert validate_cookies_content(valid_content) == True

def test_cookie_validation_invalid():
    invalid_content = "Just a random string with no tabs"
    assert validate_cookies_content(invalid_content) == False

def test_build_ydl_options_defaults():
    # Ensure environment is clean
    if 'YTDLP_PLAYER_CLIENTS' in os.environ:
        del os.environ['YTDLP_PLAYER_CLIENTS']
    if 'YTDLP_USE_COOKIES' in os.environ:
        del os.environ['YTDLP_USE_COOKIES']
        
    opts = build_ydl_options(download=False)
    assert opts['nocheckcertificate'] == False
    assert opts['extract_flat'] == 'in_playlist'
    assert 'extractor_args' not in opts

def test_build_ydl_options_with_clients():
    os.environ['YTDLP_PLAYER_CLIENTS'] = 'android_vr,web'
    opts = build_ydl_options(download=False)
    assert 'extractor_args' in opts
    assert 'player_client=android_vr,web' in opts['extractor_args']['youtube']
    del os.environ['YTDLP_PLAYER_CLIENTS']

def test_error_mapping():
    class DummyYTDLPError(Exception):
        pass

    auth_err = DummyYTDLPError("Sign in to confirm you are not a bot")
    mapped = map_yt_dlp_exception(auth_err)
    assert isinstance(mapped, AuthenticationRequiredError)

    unavail_err = DummyYTDLPError("Private video")
    mapped = map_yt_dlp_exception(unavail_err)
    assert isinstance(mapped, VideoUnavailableError)

    format_err = DummyYTDLPError("Requested format is not available")
    mapped = map_yt_dlp_exception(format_err)
    assert isinstance(mapped, FormatNotAvailableError)
