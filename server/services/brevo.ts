// Configuration Brevo avec fetch direct
async function initializeBrevo() {
  if (!process.env.BREVO_API_KEY) {
    console.log('BREVO_API_KEY not configured - email notifications disabled');
    return null;
  }

  // Utiliser fetch directement pour contourner les problèmes d'API
  return {
    sendEmail: async (emailData: any) => {
      const payload = {
        sender: emailData.sender,
        to: emailData.to,
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent
      };

      console.log('📧 Sending email via Brevo:', {
        to: emailData.to,
        subject: emailData.subject,
        sender: emailData.sender
      });

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Brevo API error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
        throw new Error(`Brevo API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
      }
      
      console.log('✅ Brevo API response:', responseData);
      return responseData;
    }
  };
}

export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('Email sending skipped - Brevo API key not configured');
      return false;
    }

    const brevoService = await initializeBrevo();
    if (!brevoService) {
      console.log('Email sending skipped - Brevo service initialization failed');
      return false;
    }

    const emailPayload = {
      sender: {
        name: emailData.senderName || "Equi Saddles - Chat Support",
        email: emailData.senderEmail || "equisaddles@gmail.com"
      },
      to: [{ email: emailData.to }],
      subject: emailData.subject,
      htmlContent: emailData.htmlContent,
      textContent: emailData.textContent || emailData.htmlContent.replace(/<[^>]*>/g, '')
    };

    const response = await brevoService.sendEmail(emailPayload);
    console.log('Email sent successfully via Brevo API:', response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendChatNotificationToAdmin(customerName: string, customerEmail: string, message: string, sessionId: string): Promise<boolean> {
  const adminEmail = "equisaddles@gmail.com"; // Email de l'admin vérifié dans Brevo
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  const emailData: EmailData = {
    to: adminEmail,
    subject: `🔔 Nouveau message chat - ${customerName}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8B5A3C; margin-bottom: 20px;">💬 Nouveau message de chat reçu</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Informations du client:</h3>
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
          <p style="margin: 5px 0;"><strong>Session ID:</strong> ${sessionId}</p>
        </div>
        
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #8B5A3C; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Message:</h3>
          <p style="margin: 0; line-height: 1.5;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://${domain}/admin?tab=chat&session=${sessionId}" 
             style="background-color: #8B5A3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            🔗 Répondre directement à cette conversation
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 15px;">
          <a href="https://${domain}/admin" 
             style="background-color: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; display: inline-block; font-size: 14px; font-weight: bold;">
            📊 Voir toutes les conversations
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Cette notification a été envoyée automatiquement par le système de chat Equi Saddles.<br>
          Pour désactiver ces notifications, connectez-vous à votre interface admin.
        </p>
      </div>
    `,
    senderName: "Equi Saddles - Système de Chat", 
    senderEmail: "equisaddles@gmail.com"
  };

  return await sendEmail(emailData);
}

export async function sendChatResponseToCustomer(customerEmail: string, customerName: string, adminMessage: string): Promise<boolean> {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  const emailData: EmailData = {
    to: customerEmail,
    subject: `📩 Réponse de l'équipe Equi Saddles`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8B5A3C; margin-bottom: 20px;">📩 Réponse de notre équipe</h2>
        
        <p style="margin-bottom: 20px;">Bonjour ${customerName},</p>
        
        <p style="margin-bottom: 20px;">Nous avons répondu à votre message sur notre chat en ligne:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #8B5A3C; margin-bottom: 20px;">
          <p style="margin: 0; line-height: 1.5; font-style: italic;">${adminMessage}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://equisaddles.com/chat?email=${encodeURIComponent(customerEmail)}" 
             style="background-color: #8B5A3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            🔗 Continuer la conversation
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 14px; color: #333; margin-bottom: 10px;">
          <strong>Equi Saddles</strong><br>
          Spécialiste en selles d'équitation<br>
          Rue du Vicinal 9, 4141 Louveigné, Belgique<br>
          Tél: +32 496 94 41 25<br>
          Email: contact@equisaddles.com
        </p>
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Merci de votre confiance. Nous sommes là pour vous accompagner dans vos projets équestres.
        </p>
      </div>
    `,
    senderName: "Equi Saddles",
    senderEmail: "equisaddles@gmail.com"
  };

  return await sendEmail(emailData);
}

export async function sendContactFormEmail(name: string, email: string, subject: string, message: string): Promise<boolean> {
  const adminEmail = "equisaddles@gmail.com"; // Email de l'admin qui reçoit les messages de contact
  
  const emailData: EmailData = {
    to: adminEmail,
    subject: `📩 Nouveau message de contact - ${subject}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8B5A3C; margin-bottom: 20px;">📩 Nouveau message du formulaire de contact</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Informations de l'expéditeur:</h3>
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Sujet:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #8B5A3C; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Message:</h3>
          <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${email}" 
             style="background-color: #8B5A3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            📧 Répondre à ${name}
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Ce message a été envoyé depuis le formulaire de contact du site Equi Saddles.
        </p>
      </div>
    `,
    senderName: "Equi Saddles - Formulaire de Contact", 
    senderEmail: "equisaddles@gmail.com"
  };

  return await sendEmail(emailData);
}

export async function sendInvoiceEmail(customerName: string, customerEmail: string, orderData: {
  orderId: number;
  items: Array<{ name: string; quantity: number; price: string; }>;
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  orderDate: string;
}): Promise<boolean> {
  
  const emailData: EmailData = {
    to: customerEmail,
    subject: `Facture #${orderData.orderId} - Equi Saddles`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
          <h1 style="color: #1e40af; font-size: 32px; margin: 0 0 10px 0;">Equi Saddles</h1>
          <h2 style="color: #333; font-size: 24px; margin: 0;">FACTURE #${orderData.orderId}</h2>
          <p style="color: #666; margin: 10px 0 0 0;">Date: ${orderData.orderDate}</p>
        </div>

        <!-- Greeting -->
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Bonjour ${customerName},</p>
        <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
          Merci pour votre commande ! Vous trouverez ci-dessous le détail de votre facture.
        </p>

        <!-- Customer Info -->
        <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Informations de livraison:</h3>
          <p style="margin: 5px 0; color: #555; line-height: 1.6;">
            <strong>${customerName}</strong><br>
            ${orderData.address}<br>
            ${orderData.city}, ${orderData.postalCode}<br>
            ${orderData.country}
          </p>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #333;">Article</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; color: #333;">Qté</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #333;">Prix unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #333;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map((item) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #333;">${item.name}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #333;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #333;">${parseFloat(item.price).toFixed(2)} €</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #333;">${(parseFloat(item.price) * item.quantity).toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="margin-left: auto; width: 350px; margin-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #555;">Sous-total:</span>
            <span style="color: #333; font-weight: 500;">${orderData.subtotal.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #555;">Frais de port:</span>
            <span style="color: #333; font-weight: 500;">${orderData.shipping.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #000; margin-top: 10px;">
            <span style="color: #000; font-weight: 700; font-size: 18px;">TOTAL:</span>
            <span style="color: #1e40af; font-weight: 700; font-size: 20px;">${orderData.total.toFixed(2)} €</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; margin: 10px 0; font-size: 14px;">
            Merci pour votre confiance !
          </p>
          <p style="color: #999; margin: 20px 0 0 0; font-size: 13px;">
            <strong>Equi Saddles</strong><br>
            Rue du Vicinal 9, 4141 Louveigné, Belgique<br>
            Tél: +32 496 94 41 25 | Email: contact@equisaddles.com
          </p>
          <p style="color: #999; margin: 20px 0 0 0; font-size: 12px;">
            Pour toute question concernant votre commande, n'hésitez pas à nous contacter.
          </p>
        </div>
      </div>
    `,
    senderName: "Equi Saddles",
    senderEmail: "equisaddles@gmail.com"
  };

  return await sendEmail(emailData);
}