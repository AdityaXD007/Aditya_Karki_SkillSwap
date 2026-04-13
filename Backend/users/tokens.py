from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

def generate_verification_token(user_id: int) -> str:
    signer = TimestampSigner()
    return signer.sign(str(user_id))

def verify_email_token(token: str, max_age_seconds: int = 86400) -> int | None:
    signer = TimestampSigner()
    try:
        user_id = signer.unsign(token, max_age=max_age_seconds)
        return int(user_id)
    except (BadSignature, SignatureExpired):
        return None
