from io import BytesIO
from urllib.parse import quote

import boto3
from botocore.exceptions import ClientError
from flask import current_app


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=current_app.config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=current_app.config["AWS_SECRET_ACCESS_KEY"],
        region_name=current_app.config["AWS_REGION"],
    )


def public_url_for_key(key: str) -> str:
    base = current_app.config.get("AWS_S3_PUBLIC_BASE_URL") or ""
    base = base.rstrip("/")
    if base:
        return f"{base}/{quote(key, safe='/')}"
    bucket = current_app.config["AWS_BUCKET_NAME"]
    region = current_app.config["AWS_REGION"]
    return f"https://{bucket}.s3.{region}.amazonaws.com/{quote(key, safe='/')}"


def get_s3_object(key: str):
    s3 = get_s3_client()
    try:
        response = s3.get_object(Bucket=current_app.config["AWS_BUCKET_NAME"], Key=key)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code in {"NoSuchKey", "404", "NoSuchBucket"}:
            raise FileNotFoundError(f"S3 key not found: {key}")
        raise

    data = response["Body"].read()
    content_type = response.get("ContentType", "application/octet-stream")
    return data, content_type


def upload_fileobj_to_s3(fileobj, key, content_type):
    s3 = get_s3_client()
    bucket = current_app.config["AWS_BUCKET_NAME"]

    s3.upload_fileobj(
        fileobj,
        bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )

    return public_url_for_key(key)


def delete_s3_key(key: str) -> None:
    s3 = get_s3_client()
    bucket = current_app.config["AWS_BUCKET_NAME"]
    s3.delete_object(Bucket=bucket, Key=key)
