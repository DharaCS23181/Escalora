import smtplib
import logging
from email.message import EmailMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, text_content: str, html_content: str | None = None) -> bool:
    if not settings.SMTP_HOST:
        logger.warning(f"SMTP not configured. Mocking email to {to_email} with subject '{subject}'")
        logger.info(f"Email Content:\n{text_content}")
        return True

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME or 'Escalora'} <{settings.SMTP_FROM_EMAIL or 'noreply@escalora.com'}>"
    msg["To"] = to_email
    
    msg.set_content(text_content)
    if html_content:
        msg.add_alternative(html_content, subtype='html')
        
    try:
        if settings.SMTP_USE_TLS:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as server:
                server.starttls()
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 25) as server:
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_invitation_email_sync(to_email: str, name: str, pin: str):
    subject = "You've been invited to Escalora"
    text = f"Hello {name},\n\nYou have been invited to join Escalora.\n\nYour temporary login PIN is: {pin}\n\nPlease log in to create your permanent password.\n\nThanks,\nEscalora Team"
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #161616; padding: 20px;">
        <h2>Welcome to Escalora, {name}!</h2>
        <p>You have been invited to join the Escalora intelligent ticket escalation system.</p>
        <p>Your temporary login PIN is: <strong style="font-size: 18px; color: #013F32; padding: 4px 8px; background: #E7FE25; border-radius: 4px;">{pin}</strong></p>
        <p>Log in with your email address and this PIN to activate your account and create a permanent password.</p>
        <p>Best regards,<br/>The Escalora Team</p>
      </body>
    </html>
    """
    send_email(to_email, subject, text, html)

def send_project_assignment_email_sync(to_email: str, name: str, project_name: str, role: str):
    subject = f"You've been assigned to project: {project_name}"
    text = f"Hello {name},\n\nYou have been assigned to the project '{project_name}' as a {role}.\n\nLog in to Escalora to view your new workspace.\n\nThanks,\nEscalora Team"
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #161616; padding: 20px;">
        <h2>Project Assignment: {project_name}</h2>
        <p>Hello {name},</p>
        <p>You have been assigned to the project <strong>{project_name}</strong> as a <strong>{role.replace('_', ' ')}</strong>.</p>
        <p>Log in to Escalora to view your new workspace and get started.</p>
        <p>Best regards,<br/>The Escalora Team</p>
      </body>
    </html>
    """
    send_email(to_email, subject, text, html)

def send_ticket_assignment_email_sync(to_email: str, name: str, ticket_key: str, ticket_title: str, project_name: str, priority: str, assigned_by_name: str):
    subject = f"You have been assigned {ticket_key}"
    text = f"Hello {name},\n\nYou have been assigned a new ticket.\n\nTicket: {ticket_key}\n{ticket_title}\n\nProject: {project_name}\nPriority: {priority}\nAssigned by: {assigned_by_name}\n\nLog in to Escalora to view the ticket.\n\nThanks,\nEscalora Team"
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #161616; padding: 20px;">
        <h2>You have been assigned {ticket_key}</h2>
        <p>Hello {name},</p>
        <p>You have been assigned a new ticket.</p>
        <div style="background: #FDFDFD; padding: 15px; border: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Ticket:</strong> {ticket_key}</p>
            <p><strong>Title:</strong> {ticket_title}</p>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Priority:</strong> {priority}</p>
            <p><strong>Assigned by:</strong> {assigned_by_name}</p>
        </div>
        <p>Log in to Escalora to view and manage this ticket.</p>
        <p>Best regards,<br/>The Escalora Team</p>
      </body>
    </html>
    """
    send_email(to_email, subject, text, html)

def send_escalation_email_sync(to_email: str, name: str, ticket_key: str, ticket_title: str, project_name: str, priority: str, reason: str, escalated_to_name: str):
    subject = f"Escalation: {ticket_key} requires attention"
    text = f"Hello {name},\n\nTicket {ticket_key} ({ticket_title}) has been escalated to you.\n\nProject: {project_name}\nPriority: {priority}\nReason: {reason}\n\nPlease log in to Escalora to review and take action.\n\nThanks,\nEscalora Team"
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #161616; padding: 20px;">
        <h2>⚡ Escalation: {ticket_key}</h2>
        <p>Hello {name},</p>
        <p>A ticket has been escalated to you and requires your attention.</p>
        <div style="background: #FDFDFD; padding: 15px; border: 1px solid #ddd; margin: 20px 0; border-left: 4px solid #E7FE25;">
            <p><strong>Ticket:</strong> {ticket_key}</p>
            <p><strong>Title:</strong> {ticket_title}</p>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Priority:</strong> <span style="color: {'#ef4444' if priority == 'CRITICAL' else '#f97316' if priority == 'HIGH' else '#161616'}; font-weight: bold;">{priority}</span></p>
            <p><strong>Reason:</strong> {reason}</p>
            <p><strong>Escalated To:</strong> {escalated_to_name}</p>
            <p><strong>Status:</strong> ESCALATED</p>
        </div>
        <p>Log in to Escalora to acknowledge and take over this ticket.</p>
        <p>Best regards,<br/>The Escalora Team</p>
      </body>
    </html>
    """
    send_email(to_email, subject, text, html)
