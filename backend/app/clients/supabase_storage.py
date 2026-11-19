import logging
import uuid
import httpx
from fastapi import status
from supabase import Client, create_client
from supabase._sync.client import SupabaseException

from app.core.config import get_settings
from app.core.exceptions import AppException

logger = logging.getLogger("smartfarm.clients.storage")


class SupabaseStorageClient:
    _client: Client | None = None
    _use_rest_fallback: bool = False

    @classmethod
    def _validate_configuration(cls) -> None:
        settings = get_settings()
        url = settings.normalized_supabase_url
        key_format = settings.supabase_key_format

        if not url or not url.startswith("https://") or ".supabase." not in url:
            logger.error("Supabase Storage misconfigured: invalid or missing SUPABASE_URL.")
            raise AppException(
                message="Supabase Storage URL is not properly configured on the server.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_CONFIG_ERROR",
            )

        if key_format == "missing":
            logger.error("Supabase Storage misconfigured: SUPABASE_KEY is empty.")
            raise AppException(
                message="Supabase Storage API key is missing in backend/.env.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_CONFIG_ERROR",
            )

        if key_format == "publishable_invalid_for_backend":
            logger.error("Supabase Storage misconfigured: publishable key supplied instead of secret key.")
            raise AppException(
                message="Invalid backend Supabase key: use the Secret key (sb_secret_...), not the publishable key.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_KEY_TYPE_ERROR",
            )

        if key_format == "personal_access_token_invalid":
            logger.error("Supabase Storage misconfigured: personal access token supplied.")
            raise AppException(
                message="Invalid backend Supabase key: use the project Secret key (sb_secret_...), not an account token.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_KEY_TYPE_ERROR",
            )

        if key_format == "unrecognized":
            logger.error("Supabase Storage misconfigured: unrecognized SUPABASE_KEY format.")
            raise AppException(
                message="Unrecognized Supabase API key format in backend/.env.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_KEY_FORMAT_ERROR",
            )

        if not settings.SUPABASE_BUCKET:
            logger.error("Supabase Storage misconfigured: SUPABASE_BUCKET is empty.")
            raise AppException(
                message="Supabase Storage bucket name is missing in backend/.env.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SUPABASE_CONFIG_ERROR",
            )

    @classmethod
    def _get_client(cls) -> Client | None:
        if cls._use_rest_fallback:
            return None
        if cls._client is not None:
            return cls._client

        cls._validate_configuration()
        settings = get_settings()

        try:
            cls._client = create_client(settings.normalized_supabase_url, settings.SUPABASE_KEY)
            logger.info(
                "Initialized Supabase Storage SDK client (key_format=%s, bucket=%s).",
                settings.supabase_key_format,
                settings.SUPABASE_BUCKET,
            )
            return cls._client
        except SupabaseException as exc:
            if settings.supabase_key_format == "secret_v2":
                logger.warning(
                    "Installed supabase-py rejected sb_secret_ key locally; switching to direct Storage REST upload."
                )
                cls._use_rest_fallback = True
                return None

            logger.error("Supabase client rejected API key: %s", str(exc))
            raise AppException(
                message="Supabase rejected SUPABASE_KEY. Verify your Secret key in backend/.env.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="SUPABASE_AUTH_ERROR",
            ) from exc

    @classmethod
    def _upload_via_rest(cls, file_bytes: bytes, content_type: str, storage_path: str) -> str:
        settings = get_settings()
        base_url = settings.normalized_supabase_url
        bucket_name = settings.SUPABASE_BUCKET
        upload_url = f"{base_url}/storage/v1/object/{bucket_name}/{storage_path}"

        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": content_type,
            "x-upsert": "true",
        }

        with httpx.Client(timeout=20.0) as client:
            response = client.post(upload_url, content=file_bytes, headers=headers)

        if response.status_code in {401, 403}:
            logger.error("Supabase Storage REST rejected credentials (status=%s).", response.status_code)
            raise AppException(
                message="Supabase Storage rejected SUPABASE_KEY. Verify your Secret key in backend/.env.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="SUPABASE_AUTH_ERROR",
            )

        if response.status_code >= 400:
            logger.error(
                "Supabase Storage REST upload failed (status=%s, body=%s)",
                response.status_code,
                response.text[:200],
            )
            raise AppException(
                message=f"Supabase Storage upload failed ({response.status_code}). Verify bucket '{bucket_name}' exists.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="STORAGE_UPLOAD_FAILED",
            )

        return f"{base_url}/storage/v1/object/public/{bucket_name}/{storage_path}"

    @classmethod
    def upload_leaf_image(cls, file_bytes: bytes, content_type: str, original_filename: str) -> str:
        cls._validate_configuration()
        settings = get_settings()
        bucket_name = settings.SUPABASE_BUCKET

        ext = ".jpg"
        if original_filename and "." in original_filename:
            candidate_ext = "." + original_filename.rsplit(".", 1)[-1].lower().strip()
            if candidate_ext in {".jpg", ".jpeg", ".png", ".webp"}:
                ext = candidate_ext

        storage_path = f"scans/{uuid.uuid4().hex}{ext}"
        client = cls._get_client()

        if client is None:
            return cls._upload_via_rest(file_bytes, content_type, storage_path)

        try:
            bucket = client.storage.from_(bucket_name)
            bucket.upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"},
            )
            public_url = bucket.get_public_url(storage_path)
            if isinstance(public_url, dict):
                return public_url.get("publicUrl", "")
            return str(public_url)
        except AppException:
            raise
        except Exception as exc:
            logger.error(
                "Supabase storage upload failed (bucket=%s, error=%s): %s",
                bucket_name,
                type(exc).__name__,
                str(exc),
            )
            raise AppException(
                message=f"Failed to upload leaf image to Supabase bucket '{bucket_name}'.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="STORAGE_UPLOAD_FAILED",
            ) from exc