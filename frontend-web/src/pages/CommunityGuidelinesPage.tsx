
import React from 'react';
import { Container } from 'react-bootstrap';

const CommunityGuidelinesPage: React.FC = () => {
  return (
    <Container className="mt-4">
      <h1>Community Guidelines</h1>
      <p>Welcome to the VideoVerse community! To ensure a safe, respectful, and enjoyable experience for everyone, we ask all users to adhere to the following guidelines:</p>

      <h2>Respectful Interaction</h2>
      <ul>
        <li>Treat all users with respect. Harassment, bullying, hate speech, and personal attacks are strictly prohibited.</li>
        <li>Do not discriminate against others based on their race, ethnicity, national origin, religion, disability, disease, age, sexual orientation, gender, or gender identity.</li>
        <li>Keep discussions constructive and relevant to the content.</li>
      </ul>

      <h2>Content Standards</h2>
      <ul>
        <li>Do not upload, share, or promote content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.</li>
        <li>Prohibited content includes, but is not limited to: graphic violence, sexually explicit material, illegal activities, and content that promotes self-harm.</li>
        <li>Respect copyright and intellectual property. Only upload content that you own or have permission to use.</li>
      </ul>

      <h2>Privacy</h2>
      <ul>
        <li>Do not share personal information about yourself or others without explicit consent.</li>
        <li>Respect the privacy of others. Do not engage in doxxing or unauthorized sharing of private information.</li>
      </ul>

      <h2>Spam and Misinformation</h2>
      <ul>
        <li>Do not engage in spamming, phishing, or any form of deceptive behavior.</li>
        <li>Do not spread misinformation or disinformation that could cause harm.</li>
      </ul>

      <h2>Reporting Violations</h2>
      <p>If you encounter content or behavior that violates these guidelines, please report it using our reporting tools. Our team will review all reports and take appropriate action.</p>

      <h2>Consequences of Violations</h2>
      <p>Violations of these Community Guidelines may result in content removal, temporary suspension, or permanent termination of your account, depending on the severity and frequency of the offense.</p>

      <p>Thank you for helping us maintain a positive and safe community on VideoVerse!</p>
    </Container>
  );
};

export default CommunityGuidelinesPage;
