export const getWelcomeEmailTemplate = (email) => {
  return {
    subject: '🌴 Welcome to Sarawak Tourism Newsletter!',
    html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .email-container {
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .fun-fact {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              border-left: 5px solid #667eea;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .fun-fact h3 {
              margin-top: 0;
              color: #667eea;
              font-size: 20px;
            }
            .fun-fact p {
              margin: 10px 0;
              line-height: 1.8;
            }
            .benefits {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .benefits h3 {
              color: #333;
              margin-top: 0;
            }
            .benefits ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .benefits li {
              padding: 8px 0;
              padding-left: 25px;
              position: relative;
            }
            .benefits li:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #667eea;
              font-weight: bold;
              font-size: 18px;
            }
            .cta-button {
              text-align: center;
              margin: 30px 0;
            }
            .cta-button a {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 30px;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: transform 0.3s;
            }
            .footer {
              background: #f9f9f9;
              text-align: center;
              padding: 30px;
              color: #666;
              font-size: 13px;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🌴 Welcome to Sarawak Tourism!</h1>
              <p>Your Journey to Paradise Begins Here</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi there! 👋</p>
              
              <p>Thank you for subscribing to our newsletter! We're absolutely thrilled to have you join our community of adventure seekers and nature lovers.</p>
              
              <p>Get ready to discover the hidden gems, breathtaking landscapes, and rich cultural heritage of <strong>Sarawak - the Land of the Hornbill!</strong> 🦅</p>
              
              <div class="fun-fact">
                <h3>🎯 Amazing Sarawak Fact!</h3>
                <p><strong>Did you know? Sarawak is home to the world's largest cave chamber!</strong></p>
                <p>The Sarawak Chamber in Gunung Mulu National Park is so enormous that it could fit <strong>40 Boeing 747 airplanes</strong> inside with room to spare! It measures 700 meters long, 400 meters wide, and at least 70 meters high.</p>
                <p>This UNESCO World Heritage Site is just one of the countless natural wonders waiting to be explored in our beautiful state. From pristine rainforests to vibrant coral reefs, Sarawak is a paradise for adventurers! 🏞️</p>
              </div>
              
              <div class="benefits">
                <h3>📬 What You'll Receive from Us:</h3>
                <ul>
                  <li>🏞️ <strong>Exclusive travel guides</strong> to Sarawak's best destinations</li>
                  <li>🎉 <strong>Festival updates</strong> and cultural event calendars</li>
                  <li>🍜 <strong>Local cuisine recommendations</strong> and food trails</li>
                  <li>💰 <strong>Special deals</strong> on tours and accommodations</li>
                  <li>📸 <strong>Stunning photography</strong> and travel inspiration</li>
                  <li>🗺️ <strong>Insider tips</strong> from local experts</li>
                  <li>🌿 <strong>Eco-tourism opportunities</strong> and wildlife encounters</li>
                </ul>
              </div>
              
              <p>Whether you're planning your first visit or you're a seasoned explorer of Borneo, we've got exciting content lined up just for you!</p>
              
              <div class="cta-button">
                <a href="https://metaversetrails20.vercel.app/">Start Exploring Sarawak</a>
              </div>
              
              <p style="text-align: center; color: #666; font-style: italic;">Stay curious, keep exploring, and let Sarawak's magic captivate you! 🗺️✨</p>
              
              <p style="margin-top: 30px;">Best regards,<br>
              <strong>The Sarawak Tourism Team</strong> 🌴</p>
            </div>
            
            <div class="footer">
              <p>📧 You're receiving this email because you subscribed at <strong>${email}</strong></p>
              <p>© 2025 Sarawak Tourism. All rights reserved.</p>
              <p style="margin-top: 15px; font-size: 11px;">
                If you no longer wish to receive our emails, you can unsubscribe at any time.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    text: `
  🌴 Welcome to Sarawak Tourism Newsletter!
  
  Hi there! 👋
  
  Thank you for subscribing to our newsletter! We're thrilled to have you join our community of adventure seekers and nature lovers.
  
  Get ready to discover the hidden gems, breathtaking landscapes, and rich cultural heritage of Sarawak - the Land of the Hornbill! 🦅
  
  🎯 AMAZING SARAWAK FACT!
  Did you know? Sarawak is home to the world's largest cave chamber!
  
  The Sarawak Chamber in Gunung Mulu National Park is so enormous that it could fit 40 Boeing 747 airplanes inside! It measures 700 meters long, 400 meters wide, and at least 70 meters high.
  
  This UNESCO World Heritage Site is just one of the countless natural wonders waiting to be explored in Sarawak!
  
  📬 WHAT YOU'LL RECEIVE FROM US:
  ✓ Exclusive travel guides to Sarawak's best destinations
  ✓ Festival updates and cultural event calendars  
  ✓ Local cuisine recommendations and food trails
  ✓ Special deals on tours and accommodations
  ✓ Stunning photography and travel inspiration
  ✓ Insider tips from local experts
  ✓ Eco-tourism opportunities and wildlife encounters
  
  Whether you're planning your first visit or you're a seasoned explorer of Borneo, we've got exciting content lined up for you!
  
  Start exploring: https://metaversetrails20.vercel.app/
  
  Stay curious and keep exploring! 🗺️
  
  Best regards,
  The Sarawak Tourism Team 🌴
  
  ---
  You're receiving this email because you subscribed at ${email}
  © 2025 Sarawak Tourism. All rights reserved.
      `
  };
};

export const getNewLocationEmailTemplate = (locationName, fullName, locationDescription, locationCategory, locationType) => {
  return {
    subject: `🌴 New Location: Explore ${locationName} on Metaverse Trails 2.0!`,
    html: `
      <!DOCTYPE html>
      <html>

      <head>
          <style>
              body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f4f4f4;
              }

              .email-container {
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }

              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
              }

              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
              }

              .header p {
                  margin: 10px 0 0 0;
                  font-size: 16px;
                  opacity: 0.9;
              }
              
              .featured-image {
                  width: 100%;
                  height: auto;
                  max-height: 300px;
                  object-fit: cover;
              }

              .content {
                  padding: 40px 30px;
              }

              .greeting {
                  font-size: 18px;
                  color: #333;
                  margin-bottom: 20px;
              }
              
              .announcement-box {
                  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                  border-left: 5px solid #667eea;
                  padding: 20px;
                  margin: 25px 0;
                  border-radius: 8px;
              }
              
              .announcement-box h2 {
                  margin-top: 0;
                  color: #667eea;
                  font-size: 22px;
              }
              
              .announcement-box p {
                  margin: 10px 0 0 0;
                  line-height: 1.7;
              }
              
              .cta-button {
                  text-align: center;
                  margin: 30px 0;
              }

              .cta-button a {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 30px;
                  font-weight: bold;
                  font-size: 16px;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  transition: transform 0.3s;
              }

              .footer {
                  background: #f9f9f9;
                  text-align: center;
                  padding: 30px;
                  color: #666;
                  font-size: 13px;
                  border-top: 1px solid #e0e0e0;
              }

              .footer p {
                  margin: 5px 0;
              }
          </style>
      </head>

      <body>
          <div class="email-container">
              <div class="header">
                  <h1>New Location Added!</h1>
                  <p>Your Next Adventure in Sarawak Awaits</p>
              </div>
              <div class="content">
                  <p class="greeting">Hi ${fullName}, 👋</p>

                  <p>Great news! We've just added something new and exciting to Metaverse Trails 2.0 that we think you'll love.</p>
                  
                  <div class="announcement-box">
                      <h2>Discover: ${locationName}</h2>
                      <p>${locationDescription}</p>
                  </div>
                  
                  <div class="details-section">
                    <h3>Location Details:</h3>
                      <ul>
                          <li><strong>Category:</strong> ${locationCategory}</li>
                          <li><strong>Type:</strong> ${locationType}</li>
                      </ul>
                  </div>

                  <p>Ready to see more? Click the button below to explore interactive maps, view stunning galleries, and get all the details for your visit.</p>

                  <div class="cta-button">
                      <a href="https://metaversetrails20.vercel.app/">Explore Now</a>
                  </div>

                  <p style="text-align: center; color: #666; font-style: italic;">Stay curious, keep exploring, and let
                      Sarawak's magic captivate you! 🗺️✨</p>

                  <p style="margin-top: 30px;">Best regards,<br>
                      <strong>The Sarawak Tourism Team</strong> 🌴
                  </p>
              </div>

              <div class="footer">
                  <p>📧 You're receiving this email because you have notifications turned on.</p>
                  <p>&copy; 2025 Sarawak Tourism. All rights reserved.</p>
                  <p style="margin-top: 15px; font-size: 11px;">If you no longer wish to receive our emails, you can turn notifications off in the settings at any time</p>
              </div>
          </div>
      </body>

      </html>
    `,
    text: `
      Hi ${fullName}, 👋

      Great news! We've just added something new and exciting to Metaverse Trails 2.0 that we think you'll love.

      Discover: ${locationName}
      ${locationDescription}

      Location Details:
      Category: ${locationCategory}
      Type: ${locationType}
      Ready to see more? Click the button below to explore interactive maps, view stunning galleries, and get all the details for your visit.

      Explore Now
      Stay curious, keep exploring, and let Sarawak's magic captivate you! 🗺️✨

      Best regards,
      The Sarawak Tourism Team 🌴

      📧 You're receiving this email because you have notifications turned on.

      © 2025 Sarawak Tourism. All rights reserved.

      If you no longer wish to receive our emails, you can turn notifications off in the settings at any time
    `
  }
}

export const getNewEventEmailTemplate = (eventName, fullName, eventDescription, eventOrganizers, eventType, eventHashtags, eventStartDate) => {
  return {
    subject: `🌴 New Event: Explore ${eventName} on Metaverse Trails 2.0!`,
    html: `
      <!DOCTYPE html>
      <html>

      <head>
          <style>
              body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f4f4f4;
              }

              .email-container {
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }

              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
              }

              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
              }

              .header p {
                  margin: 10px 0 0 0;
                  font-size: 16px;
                  opacity: 0.9;
              }
              
              .featured-image {
                  width: 100%;
                  height: auto;
                  max-height: 300px;
                  object-fit: cover;
              }

              .content {
                  padding: 40px 30px;
              }

              .greeting {
                  font-size: 18px;
                  color: #333;
                  margin-bottom: 20px;
              }
              
              .announcement-box {
                  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                  border-left: 5px solid #667eea;
                  padding: 20px;
                  margin: 25px 0;
                  border-radius: 8px;
              }
              
              .announcement-box h2 {
                  margin-top: 0;
                  color: #667eea;
                  font-size: 22px;
              }
              
              .announcement-box p {
                  margin: 10px 0 0 0;
                  line-height: 1.7;
              }
              
              .cta-button {
                  text-align: center;
                  margin: 30px 0;
              }

              .cta-button a {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 30px;
                  font-weight: bold;
                  font-size: 16px;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  transition: transform 0.3s;
              }

              .footer {
                  background: #f9f9f9;
                  text-align: center;
                  padding: 30px;
                  color: #666;
                  font-size: 13px;
                  border-top: 1px solid #e0e0e0;
              }

              .footer p {
                  margin: 5px 0;
              }
          </style>
      </head>

      <body>
          <div class="email-container">
              <div class="header">
                  <h1>New Event Added!</h1>
                  <p>Your Next Adventure in Sarawak Awaits</p>
              </div>
              <div class="content">
                  <p class="greeting">Hi ${fullName}, 👋</p>

                  <p>Great news! We've just added something new and exciting to Metaverse Trails 2.0 that we think you'll love.</p>
                  
                  <div class="announcement-box">
                      <h2>Discover: ${eventName}</h2>
                      <p>${eventDescription}</p>
                  </div>
                  
                  <div class="details-section">
                    <h3>Event Details:</h3>
                      <ul>
                          <li><strong>Organizers:</strong> ${eventOrganizers}</li>
                          <li><strong>Type:</strong> ${eventType}</li>
                          <li><strong>Hashtags:</strong> ${eventHashtags}</li>
                          <li><strong>Start Date:</strong> ${eventStartDate}</li>
                      </ul>
                  </div>

                  <p>Ready to see more? Click the button below to explore interactive maps, view stunning galleries, and get all the details for your visit.</p>

                  <div class="cta-button">
                      <a href="https://metaversetrails20.vercel.app/">Explore Now</a>
                  </div>

                  <p style="text-align: center; color: #666; font-style: italic;">Stay curious, keep exploring, and let
                      Sarawak's magic captivate you! 🗺️✨</p>

                  <p style="margin-top: 30px;">Best regards,<br>
                      <strong>The Sarawak Tourism Team</strong> 🌴
                  </p>
              </div>

              <div class="footer">
                  <p>📧 You're receiving this email because you have notifications turned on.</p>
                  <p>&copy; 2025 Sarawak Tourism. All rights reserved.</p>
                  <p style="margin-top: 15px; font-size: 11px;">If you no longer wish to receive our emails, you can turn notifications off in the settings at any time</p>
              </div>
          </div>
      </body>

      </html>
    `,
    text: `
      Hi ${fullName}, 👋

      Great news! We've just added something new and exciting to Metaverse Trails 2.0 that we think you'll love.

      Discover: ${eventName}
      ${eventDescription}

      Event Details:
      Organizers: ${eventOrganizers}
      Type: ${eventType}
      Hashtags: ${eventHashtags}
      Start Date: ${eventStartDate}
      Ready to see more? Click the button below to explore interactive maps, view stunning galleries, and get all the details for your visit.

      Explore Now
      Stay curious, keep exploring, and let Sarawak's magic captivate you! 🗺️✨

      Best regards,
      The Sarawak Tourism Team 🌴

      📧 You're receiving this email because you have notifications turned on.

      © 2025 Sarawak Tourism. All rights reserved.

      If you no longer wish to receive our emails, you can turn notifications off in the settings at any time
    `
  }
}