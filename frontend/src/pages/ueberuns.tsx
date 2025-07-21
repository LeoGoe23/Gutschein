import { Box, Typography } from '@mui/material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';

const steps = [
	{
		title: 'Der Kunde kauft den Gutschein online',
		text: 'Kunden entdecken Ihren Gutschein online – bequem von zuhause, 24/7 verfügbar. Sie erhalten direkt neues Einkommen, ganz ohne eigenen technischen Aufwand oder Betreuung. Perfekt auch für spontane Käufe an Feiertagen oder Sonntagen.',
		img: '/about1.png',
	},
	{
		title: 'Der Gutschein wird bei Ihnen eingelöst',
		text: 'Sobald der Kunde mit dem Gutschein kommt, zeigen Sie ihn einfach vor oder scannen den Code – fertig. Die Auszahlung an Sie läuft automatisch, kein Extra-System nötig. Einfach, sicher, bewährt.',
		img: '/about2.png',
	},
	{
		title: 'Neue Kunden werden auf Sie aufmerksam',
		text: 'Gutscheine werden gerne verschenkt. Das bedeutet für Sie: Empfehlungen, neue Zielgruppen, höhere Bekanntheit – ganz ohne Werbebudget. Viele Kunden kommen durch einen Gutschein das erste Mal.',
		img: '/about3.png',
	},
	{
		title: 'Ihre Marke wird sichtbar und empfohlen',
		text: 'Ihr Gutschein trägt Ihren Namen, Ihr Design und Ihre Leistung direkt ins soziale Umfeld Ihrer Kunden. Dadurch entsteht organisches Wachstum – jedes Geschenk wird zu einer Empfehlung Ihrer Marke.',
		img: '/about4.png',
	},
];

export default function UeberUns() {
	return (
		<Box
			sx={{
				width: '100%',
				minHeight: '100vh',
				overflowX: 'hidden',
				fontFamily: 'system-ui, sans-serif',
				px: { xs: '1rem', md: '6vw' },
				py: '4rem',
				backgroundColor: '#fff',
			}}
		>
			<LogoTopLeft />
			<Box
				sx={{
					position: 'absolute',
					top: { xs: '0.5rem', md: '1.5rem' },
					right: { xs: '1rem', md: '4rem' },
					zIndex: 3,
				}}
			>
				<TopBar />
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: '5rem',
					mt: '6rem',
				}}
			>
				{steps.map((step, index) => (
					<Box
						key={index}
						sx={{
							display: 'flex',
							flexDirection: { xs: 'column', md: 'row' },
							alignItems: 'center',
							gap: '3rem',
						}}
					>
						{/* Linke Seite: Bild (40%) */}
						<Box
							sx={{
								flex: '0 0 40%',
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							<Box
								component="img"
								src={step.img}
								alt={step.title}
								sx={{
									width: '100%',
									maxWidth: 400,
									borderRadius: '1rem',
									boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
								}}
							/>
						</Box>

						{/* Rechte Seite: Text (60%) */}
						<Box
							sx={{
								flex: '0 0 60%',
								pl: { xs: 0, md: '3rem' },
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 700,
									mb: 2,
									color: '#222',
								}}
							>
								{step.title}
							</Typography>
							<Typography
								variant="body1"
								sx={{
									fontSize: '1.05rem',
									lineHeight: 1.8,
									color: '#444',
									maxWidth: '75%',
								}}
							>
								{step.text}
							</Typography>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
}
