# Security Setup Guide

## Super Admin Secret Key

To ensure only authorized personnel can create super admin accounts, the system requires a secret key during registration.

### Setup Instructions

1. **Generate a Secure Secret Key**
   - Use a strong, random string (recommended: 32+ characters)
   - Include a mix of uppercase, lowercase, numbers, and special characters
   - Example: `Sm@rtB$s2024!S3cr3tK3y#S3cur1ty`

2. **Add to Environment Variables**
   - Copy the secret key to your `.env` file:
   ```
   SUPER_ADMIN_SECRET_KEY=your_generated_secret_key_here
   ```

3. **Share Securely**
   - Share the secret key only with authorized personnel
   - Use secure communication channels (encrypted email, secure messaging)
   - Never commit the secret key to version control

### Security Best Practices

- **Rotate Regularly**: Change the secret key periodically
- **Limit Access**: Only share with personnel who need super admin access
- **Monitor Usage**: Keep track of who has the secret key
- **Secure Storage**: Store the secret key securely, not in plain text files
- **Environment Separation**: Use different secret keys for development, staging, and production

### Example Secret Key Generation

You can generate a secure secret key using:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Troubleshooting

- **"Server configuration error"**: The `SUPER_ADMIN_SECRET_KEY` environment variable is not set
- **"Invalid secret key"**: The provided secret key doesn't match the one in the environment
- **"All fields are required"**: The secret key field is empty

### Important Notes

- The secret key is only required for super admin registration
- Once a super admin account is created, the secret key is not needed for login
- The secret key should be treated as a sensitive credential
- Consider implementing additional security measures like IP whitelisting for production environments 