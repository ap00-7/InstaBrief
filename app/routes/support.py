from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.services.storage import StorageService
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


router = APIRouter()
storage = StorageService()

# Email configuration
SUPPORT_EMAIL = "divyabgowda034@gmail.com"


def send_support_email(ticket: dict):
    """Send support ticket as email notification"""
    try:
        # Create email content
        subject = f"[InstaBrief Support] {ticket['category'].upper()} - {ticket['subject']}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                        🎫 New Support Ticket
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 8px 0;"><strong>Category:</strong> <span style="background-color: #e3e8ff; padding: 4px 8px; border-radius: 4px;">{ticket['category'].title()}</span></p>
                        <p style="margin: 8px 0;"><strong>Priority:</strong> <span style="background-color: {'#ffebee' if ticket['priority'] == 'high' else '#fff9e6' if ticket['priority'] == 'medium' else '#e8f5e9'}; padding: 4px 8px; border-radius: 4px;">{ticket['priority'].upper()}</span></p>
                        <p style="margin: 8px 0;"><strong>Subject:</strong> {ticket['subject']}</p>
                        {f"<p style='margin: 8px 0;'><strong>User Email:</strong> {ticket.get('email', 'Not provided')}</p>" if ticket.get('email') else ''}
                        <p style="margin: 8px 0;"><strong>Submitted:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    </div>
                    
                    <div style="background-color: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px;">
                        <h3 style="color: #333; margin-top: 0;">Message:</h3>
                        <p style="white-space: pre-wrap;">{ticket['message']}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #f0f7ff; border-radius: 6px;">
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            <strong>Ticket ID:</strong> {ticket.get('id', 'N/A')}<br>
                            This is an automated notification from InstaBrief Support System.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = "InstaBrief Support <noreply@instabrief.com>"
        msg['To'] = SUPPORT_EMAIL
        
        # Attach HTML content
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send via Gmail SMTP (you'll need to configure app password)
        # For now, we'll use a simple SMTP relay or print to console
        print(f"\n{'='*60}")
        print(f"📧 SUPPORT TICKET EMAIL")
        print(f"{'='*60}")
        print(f"To: {SUPPORT_EMAIL}")
        print(f"Subject: {subject}")
        print(f"Category: {ticket['category']}")
        print(f"Priority: {ticket['priority']}")
        print(f"Subject: {ticket['subject']}")
        print(f"Message: {ticket['message']}")
        print(f"{'='*60}\n")
        
        # Uncomment below to send actual email via SMTP
        # You'll need to set up Gmail App Password or use SendGrid API
        """
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login('your-email@gmail.com', 'your-app-password')
            server.send_message(msg)
        """
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


class SupportTicket(BaseModel):
    category: str = Field(default="general")
    priority: str = Field(default="medium")
    subject: str
    message: str
    email: Optional[str] = None


@router.post("/")
async def create_ticket(payload: SupportTicket):
    doc = payload.model_dump()
    result = await storage.db.support.insert_one(doc)
    ticket_id = str(result.inserted_id)
    
    # Add ticket ID to document for email
    doc['id'] = ticket_id
    
    # Send email notification
    send_support_email(doc)
    
    return {"id": ticket_id, "status": "received"}


