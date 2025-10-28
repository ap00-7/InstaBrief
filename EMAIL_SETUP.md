# 📧 Email Integration Setup Guide

## Overview
Support tickets submitted through the InstaBrief Support page will be sent to: **divyabgowda034@gmail.com**

## Current Status
✅ Email integration code is implemented
⚠️ Email sending is currently **disabled** (prints to console instead)
🔧 Follow steps below to enable actual email delivery

---

## Option 1: Gmail SMTP (Recommended for Development)

### Step 1: Create Gmail App Password
1. Go to Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select app: **Mail**
5. Select device: **Other (Custom name)** → Enter "InstaBrief"
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Environment Variables
Create a `.env` file in the project root:

```bash
# Email Configuration
SUPPORT_EMAIL=divyabgowda034@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Step 3: Update support.py
In `/app/routes/support.py`, lines 80-84, **uncomment** this code:

```python
# CHANGE THIS (line 80-84):
"""
with smtplib.SMTP('smtp.gmail.com', 587) as server:
    server.starttls()
    server.login('your-email@gmail.com', 'your-app-password')
    server.send_message(msg)
"""

# TO THIS:
import os
with smtplib.SMTP(os.getenv('SMTP_HOST', 'smtp.gmail.com'), 
                  int(os.getenv('SMTP_PORT', '587'))) as server:
    server.starttls()
    server.login(os.getenv('SMTP_USERNAME'), os.getenv('SMTP_PASSWORD'))
    server.send_message(msg)
```

### Step 4: Restart Server
```bash
# Stop the server (Ctrl+C)
# Restart it
cd /Users/divya/Desktop/InstaBrief
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## Option 2: SendGrid API (Recommended for Production)

### Step 1: Create SendGrid Account
1. Sign up: https://signup.sendgrid.com/
2. Verify your email
3. Create API Key: Settings → API Keys → Create API Key
4. Select **Full Access** → Copy the API key

### Step 2: Install SendGrid
```bash
pip install sendgrid
```

### Step 3: Update support.py
Replace the `send_support_email` function with SendGrid implementation:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

def send_support_email(ticket: dict):
    try:
        message = Mail(
            from_email='noreply@instabrief.com',
            to_emails='divyabgowda034@gmail.com',
            subject=f"[InstaBrief Support] {ticket['category'].upper()} - {ticket['subject']}",
            html_content=html_body  # Same HTML content as before
        )
        
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(f"Email sent! Status: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
```

---

## Testing Email Integration

### Test 1: Console Output (Current State)
When a user submits a support ticket, you'll see this in the terminal:
```
============================================================
📧 SUPPORT TICKET EMAIL
============================================================
To: divyabgowda034@gmail.com
Subject: [InstaBrief Support] GENERAL - Test Issue
Category: general
Priority: medium
Subject: Test Issue
Message: This is a test support ticket.
============================================================
```

### Test 2: Actual Email Delivery (After Setup)
1. Go to http://localhost:3000/support
2. Fill out the support form:
   - Category: Bug Report
   - Priority: High
   - Subject: Test Email Integration
   - Message: Testing if emails are working
3. Click "Submit Ticket"
4. Check **divyabgowda034@gmail.com** inbox
5. You should receive a formatted email with all ticket details

---

## Email Template Preview

The email will look like this:

```
🎫 New Support Ticket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Category: General
Priority: MEDIUM
Subject: Need help with document upload
User Email: user@example.com
Submitted: 2025-10-04 20:04:36

Message:
I'm having trouble uploading PDF files larger than 10MB.
Can you help me troubleshoot this issue?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket ID: 507f1f77bcf86cd799439011
This is an automated notification from InstaBrief Support System.
```

---

## Troubleshooting

### Issue: "Authentication failed"
- ✅ Make sure 2-Step Verification is enabled
- ✅ Use App Password, NOT your regular Gmail password
- ✅ Remove spaces from the 16-character password

### Issue: "Connection refused"
- ✅ Check firewall settings
- ✅ Verify SMTP_HOST and SMTP_PORT are correct
- ✅ Try port 465 with SSL instead of 587 with TLS

### Issue: Emails not arriving
- ✅ Check spam/junk folder
- ✅ Verify SUPPORT_EMAIL is correct
- ✅ Check server logs for errors

---

## Current Configuration

📧 **Recipient Email:** divyabgowda034@gmail.com  
🎫 **Ticket Storage:** MongoDB `support` collection  
📋 **Email Format:** HTML with styling  
⚡ **Status:** Console logging (email disabled)

To enable email delivery, follow Option 1 or Option 2 above.

---

## Quick Enable (Gmail)

If you want to enable emails right now:

1. **Get your Gmail App Password** (16 characters)
2. **Create `.env` file** with your credentials
3. **Edit line 80-84** in `/app/routes/support.py` to uncomment SMTP code
4. **Restart the server**

Done! 🎉
