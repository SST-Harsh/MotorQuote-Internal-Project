import LoginPage from './(auth)/login/page';

export default function HomePage() {
  return (
    <LoginPage
      logo="MotorQuote"
      tagline="Sell Made Simple."
      companyName="MotorQuote"
      backgroundImage="/assets/Banner.jpg"
    />
  );
}
