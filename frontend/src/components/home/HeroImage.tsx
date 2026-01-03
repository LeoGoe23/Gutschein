export default function HeroImage() {
  return (
    <img
      src="/home.svg"
      alt="Illustration"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'top right',
      }}
    />
  );
}
